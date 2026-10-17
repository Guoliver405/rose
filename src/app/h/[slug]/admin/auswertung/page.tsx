import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Info } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import { clampStaleMinutes, parseStayoverPolicy, stayoverDueTime } from '@/lib/board'
import { computeDemand } from '@/lib/demand'
import DemandSection from './DemandSection'
import {
  computeWorkStats, extractCleanings, formatDuration, sumStats,
  MAX_BREAK_HOURS, MAX_SHIFT_HOURS, type StaffLogRow, type WorkStats,
} from '@/lib/worklog'
import { addDaysKey, parseTimeZone, zonedDateKey, zonedDayRange } from '@/lib/tz'
import { groupForPairing, pairingKey, parseStaffTracking } from '@/lib/staff-tracking'
import { format, getMessages, intlLocale, plural } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import Rich from '@/components/i18n/Rich'

/** „YYYY-MM-DD" oder null. */
function parseDayParam(raw: string | undefined): string | null {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

/** Uhrzeit vor Ort — der Server läuft in UTC, ohne `timeZone` stünde hier Serverzeit. */
function timeLabel(iso: string, tz: string, loc: string): string {
  return new Date(iso).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', timeZone: tz })
}

function dayLabel(key: string, tz: string, loc: string): string {
  return zonedDayRange(key, tz).start.toLocaleDateString(loc, {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: tz,
  })
}

export default async function AuswertungPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string; to?: string; maid?: string }>
}) {
  const { slug } = await routeParams
  // Arbeitszeit-Auswertung ist Personaldatenverarbeitung → verwaltende Rolle.
  const ctx = await getAdminContext(slug)
  if (!ctx) redirect(`/h/${slug}/admin`)
  const locale = await getAdminLocale()
  const loc = intlLocale(locale)
  const m = getMessages(locale).admin.staff.report

  const params = await searchParams
  const now = new Date()
  // Kalendertage in der Zeitzone des Hauses — nicht in Server-Zeit (UTC).
  const tz = parseTimeZone(ctx.policies)
  const tracking = parseStaffTracking(ctx.policies)
  const today = zonedDateKey(now, tz)
  // Default: laufende Woche = die letzten 7 Kalendertage inkl. heute.
  const defaultFrom = addDaysKey(today, -6)
  const from = parseDayParam(params.from) ?? defaultFrom
  const to = parseDayParam(params.to) ?? today
  // Vertauschte Eingabe still korrigieren statt Fehler werfen.
  const [fromKey, toKey] = from <= to ? [from, to] : [to, from]
  const range = { start: zonedDayRange(fromKey, tz).start, end: zonedDayRange(toKey, tz).end }

  const supabase = await createClient()
  // Nachfrage-Daten über den Admin-Client mit explizitem Haus-Filter:
  // `room_state_transitions` hat keine Policies für Management-Rollen, und
  // die Abfrage ist ohnehin auf das eigene Haus eingegrenzt.
  const admin = createAdminClient()
  const [
    { data: profiles }, { data: logs }, { data: rooms }, { data: hotel },
    { data: signals }, { data: checkouts },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, deactivated_at')
      .eq('hotel_id', ctx.hotelId)
      .not('username', 'is', null)
      .order('display_name'),
    supabase
      .from('staff_log')
      .select('profile_id, session_id, kind, at, room_id')
      .eq('hotel_id', ctx.hotelId)
      .gte('at', range.start.toISOString())
      .lt('at', range.end.toISOString())
      .order('at'),
    supabase.from('rooms').select('id, number').eq('hotel_id', ctx.hotelId),
    supabase.from('hotels').select('policies').eq('id', ctx.hotelId).single(),
    admin
      .from('room_state_transitions')
      .select('new_value, occurred_at')
      .eq('hotel_id', ctx.hotelId)
      .eq('field', 'guest_signal')
      .eq('source', 'guest')
      .in('new_value', ['please_clean', 'dnd'])
      .gte('occurred_at', range.start.toISOString())
      .lt('occurred_at', range.end.toISOString()),
    admin
      .from('stays')
      .select('checked_out_at')
      .eq('hotel_id', ctx.hotelId)
      .gte('checked_out_at', range.start.toISOString())
      .lt('checked_out_at', range.end.toISOString()),
  ])

  const policies = (hotel?.policies ?? {}) as Record<string, unknown>
  const stayover = parseStayoverPolicy(policies)
  const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const due = stayoverDueTime(stayover)
  const demand = computeDemand({
    wishes: (signals ?? []).filter(t => t.new_value === 'please_clean').map(t => t.occurred_at as string),
    dnd: (signals ?? []).filter(t => t.new_value === 'dnd').map(t => t.occurred_at as string),
    checkouts: (checkouts ?? []).map(c => c.checked_out_at as string),
    // Paarung je Kraft (Person-Modus) oder je Schicht (Team-Modus) — Zeilen
    // ohne Schlüssel lassen sich nicht paaren und fallen hier heraus.
    shiftRows: (logs ?? []).flatMap(l => {
      const key = pairingKey(l, tracking)
      return key ? [{ key, kind: l.kind as string, at: l.at as string }] : []
    }),
    range,
    now,
    timeZone: tz,
  })

  const staleMinutes = clampStaleMinutes(
    (hotel?.policies as { cleaningStaleMinutes?: number } | null)?.cleaningStaleMinutes,
  )
  const roomNumber = new Map((rooms ?? []).map(r => [r.id, r.number]))

  // Team-Modus (16.09.2026): gruppiert wird je Schicht (session_id), nicht je
  // Kraft — die Hausbilanz bleibt vollständig, eine Zuordnung zur Person
  // gibt es nicht mehr. Anonymisierte Bestandszeilen ohne Session lassen
  // sich nicht paaren; sie werden gezählt und ausgewiesen, nicht gerechnet.
  const { groups, unpaired } = groupForPairing(
    (logs ?? []).map(l => ({ profile_id: l.profile_id, session_id: l.session_id, kind: l.kind, at: l.at, room_id: l.room_id })),
    tracking,
  )
  const asRows = (list: { kind: string; at: string; room_id: string | null }[]): StaffLogRow[] =>
    list.map(l => ({ kind: l.kind, at: l.at, room_id: l.room_id }))

  // Kräfte mit Aktivität im Zeitraum — deaktivierte gehören dazu, genau
  // dafür werden sie nicht mehr gelöscht. Im Team-Modus bleibt die Liste
  // leer: Es gibt keine Tabelle je Kraft.
  const maids = tracking === 'team' ? [] : (profiles ?? [])
    .map(p => ({
      id: p.id,
      name: p.display_name,
      deactivated: Boolean(p.deactivated_at),
      rows: asRows(groups.get(p.id) ?? []),
    }))
    .filter(m => m.rows.length > 0)
    .map(m => ({ ...m, stats: computeWorkStats(m.rows, range, staleMinutes, now) }))

  // Hausbilanz: im Person-Modus die Summe der Kräfte (Stiche von Management-
  // Zugängen — „Als gereinigt markieren" — zählen wie bisher nicht), im
  // Team-Modus die Summe aller paarbaren Gruppen.
  const total = tracking === 'team'
    ? sumStats([...groups.values()].map(list => computeWorkStats(asRows(list), range, staleMinutes, now)))
    : sumStats(maids.map(m => m.stats))
  const hasActivity = tracking === 'team' ? groups.size > 0 || unpaired > 0 : maids.length > 0
  const selected = params.maid ? maids.find(m => m.id === params.maid) ?? null : null

  // Detail-Protokoll: Kalendertage der gewählten Kraft, neueste zuerst.
  const days: { key: string; rows: StaffLogRow[]; stats: WorkStats; durationByEnd: Map<string, number> }[] = []
  if (selected) {
    const byDay = new Map<string, StaffLogRow[]>()
    for (const r of selected.rows) {
      const key = zonedDateKey(new Date(r.at), tz)
      const list = byDay.get(key) ?? []
      list.push(r)
      byDay.set(key, list)
    }
    for (const [key, rows] of [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
      const dRange = zonedDayRange(key, tz)
      const runs = extractCleanings(rows, dRange, staleMinutes, now)
      days.push({
        key,
        rows,
        stats: computeWorkStats(rows, dRange, staleMinutes, now),
        // Dauer am Abschluss-Stich anzeigen (dort steht sie im Protokoll).
        durationByEnd: new Map(runs.filter(r => r.endedAt).map(r => [r.endedAt!, r.ms])),
      })
    }
  }

  const linkFor = (maidId?: string) => {
    const q = new URLSearchParams({ from: fromKey, to: toKey })
    if (maidId) q.set('maid', maidId)
    return `/h/${ctx.hotelSlug}/admin/auswertung?${q.toString()}`
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Eigener Nav-Punkt seit 04.09.2026 — kein Rücklink mehr in die
          Einstellungen, die Seite ist wie Übersicht und Services eine
          Hauptebene. */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">{m.title}</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
          {dayLabel(fromKey, tz, loc)} – {dayLabel(toKey, tz, loc)}
        </span>
      </div>

      {/* Zeitraum — reines GET-Formular, damit der Stand teil- und druckbar bleibt */}
      <form data-lotse="auswertung.zeitraum" method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-edge bg-surface p-4 print:hidden">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.from}
          <input
            type="date" name="from" defaultValue={fromKey}
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          {m.to}
          <input
            type="date" name="to" defaultValue={toKey}
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
          />
        </label>
        {selected && <input type="hidden" name="maid" value={selected.id} />}
        <button
          type="submit"
          className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong"
        >
          {m.show}
        </button>
      </form>

      {/* Nachfrage — unabhängig davon, ob Kräfte gestochen haben: Gast-Signale
          und Abreisen gibt es auch in Häusern, die noch keine Schichten stechen. */}
      <DemandSection
        stats={demand}
        routineLabel={stayover.enabled ? hhmm(due.hour, due.minute) : null}
        checkoutLabel={hhmm(stayover.checkoutHour, stayover.checkoutMinute)}
        m={m.demand}
        intlLocale={loc}
      />

      {!hasActivity ? (
        <div data-lotse="auswertung.kennzahlen" className="rounded-xl border border-edge bg-surface p-8 text-center">
          <p className="font-semibold text-ink">{m.emptyTitle}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {m.emptyHint}
          </p>
        </div>
      ) : (
        <>
          {/* Kennzahlen gesamt */}
          <section data-lotse="auswertung.kennzahlen" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Kpi label={m.workTime} value={formatDuration(total.shiftMs)} hint={plural(loc, total.shiftCount, m.shifts)} />
            <Kpi label={m.breakShare} value={formatDuration(total.breakMs)} />
            <Kpi label={m.netWorkTime} value={formatDuration(total.netMs)} tone="positive" />
            <Kpi label={m.roomCleaning} value={formatDuration(total.cleaningMs)} hint={plural(loc, total.cleaningCount, m.rooms)} />
            <Kpi label={m.avgPerRoom} value={formatDuration(total.avgCleaningMs)} tone="action" />
            <Kpi
              label={m.otherCleaning}
              value={formatDuration(total.otherCleaningMs)}
              hint={
                total.legacyOtherCount > 0
                  ? format(m.otherCountLegacy, { count: total.otherCleaningCount, legacy: total.legacyOtherCount })
                  : format(m.otherCount, { count: total.otherCleaningCount })
              }
            />
            <Kpi label={m.rest} value={formatDuration(total.unassignedMs)} hint={m.restHint} />
            <Kpi
              anchor="auswertung.auffaellig"
              label={m.flagged}
              value={`${total.implausibleCount + total.abortedCount + total.openCount + total.implausibleShiftCount + total.implausibleBreakCount}`}
              hint={format(m.flaggedHint, { shifts: total.implausibleShiftCount, aborted: total.abortedCount, open: total.openCount, implausible: total.implausibleCount })}
              tone={
                total.implausibleCount + total.openCount + total.implausibleShiftCount > 0
                  ? 'attention'
                  : undefined
              }
            />
          </section>

          {tracking === 'team' && (
            <p data-lotse="auswertung.tabelle" className="flex items-start gap-2 rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-xs text-ink-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <Rich
                  text={m.teamNote}
                  vars={{ shifts: plural(loc, groups.size, m.shifts) }}
                  tags={{ b: t => <strong className="font-semibold text-ink-soft">{t}</strong> }}
                />
                {unpaired > 0 && (
                  <> {plural(loc, unpaired, m.teamUnpaired)}</>
                )}
              </span>
            </p>
          )}

          {tracking === 'person' && (
          <>
          {/* Je Reinigungskraft */}
          <section data-lotse="auswertung.tabelle" className="overflow-x-auto rounded-xl border border-edge bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-edge text-xs font-semibold text-ink-muted">
                  <th className="px-4 py-2">{m.table.maid}</th>
                  <th className="px-3 py-2">{m.table.shifts}</th>
                  <th className="px-3 py-2">{m.table.workTime}</th>
                  <th className="px-3 py-2">{m.table.break}</th>
                  <th className="px-3 py-2">{m.table.net}</th>
                  <th className="px-3 py-2">{m.table.rooms}</th>
                  <th className="px-3 py-2">{m.table.cleaningTime}</th>
                  <th className="px-3 py-2">{m.table.avgPerRoom}</th>
                  <th className="px-3 py-2">{m.table.other}</th>
                  <th className="px-3 py-2">{m.table.rest}</th>
                </tr>
              </thead>
              <tbody>
                {maids.map(x => (
                  <tr key={x.id} className="border-b border-edge last:border-0">
                    <td className="px-4 py-2">
                      <Link href={linkFor(x.id)} className="font-bold text-ink hover:underline">
                        {x.name}
                      </Link>
                      {x.deactivated && (
                        <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                          {m.deactivated}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">
                      {x.stats.shiftCount}
                      {x.stats.implausibleShiftCount > 0 && (
                        <span
                          className="ml-1.5 rounded-full bg-attention-pill px-2 py-0.5 text-xs font-bold text-attention-deepest"
                          title={format(m.openShiftsTitle, { count: x.stats.implausibleShiftCount })}
                        >
                          {format(m.openShifts, { count: x.stats.implausibleShiftCount })}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold text-ink">{formatDuration(x.stats.shiftMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(x.stats.breakMs)}</td>
                    <td className="px-3 py-2 font-semibold text-ink">{formatDuration(x.stats.netMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{x.stats.cleaningCount}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(x.stats.cleaningMs)}</td>
                    <td className="px-3 py-2 font-semibold text-ink">{formatDuration(x.stats.avgCleaningMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(x.stats.otherCleaningMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(x.stats.unassignedMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p className="flex items-start gap-2 rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-xs text-ink-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {format(m.explainer, { maxShift: MAX_SHIFT_HOURS, maxBreak: MAX_BREAK_HOURS, stale: staleMinutes })}
            </span>
          </p>

          {/* Detail-Protokoll je Kalendertag */}
          {selected && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-black text-ink">{format(m.dayLog, { name: selected.name })}</h2>
                <Link href={linkFor()} className="text-sm font-semibold text-ink-muted hover:text-ink print:hidden">
                  {m.closeDayLog}
                </Link>
              </div>

              {days.map(d => (
                <div key={d.key} className="rounded-xl border border-edge bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2 border-b border-edge pb-2">
                    <h3 className="text-sm font-bold text-ink">{dayLabel(d.key, tz, loc)}</h3>
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                      {format(m.dayWork, { duration: formatDuration(d.stats.shiftMs) })}
                    </span>
                    {d.stats.breakMs > 0 && (
                      <span className="rounded-full bg-caution-pill px-2.5 py-0.5 text-xs font-semibold text-caution-deepest">
                        {format(m.dayBreak, { duration: formatDuration(d.stats.breakMs) })}
                      </span>
                    )}
                    <span className="rounded-full bg-positive-pill px-2.5 py-0.5 text-xs font-semibold text-positive-deepest">
                      {plural(loc, d.stats.cleaningCount, m.dayRooms, { duration: formatDuration(d.stats.cleaningMs) })}
                    </span>
                  </div>

                  <ol className="mt-2 flex flex-col gap-1">
                    {d.rows.map((r, i) => {
                      const ms = d.durationByEnd.get(r.at)
                      return (
                        <li key={`${r.at}-${i}`} className="flex items-baseline gap-3 text-sm">
                          <span className="w-12 shrink-0 font-mono text-xs text-ink-muted">
                            {timeLabel(r.at, tz, loc)}
                          </span>
                          <span className="font-semibold text-ink">
                            {m.kinds[r.kind] ?? r.kind}
                          </span>
                          {r.room_id && (
                            <span className="text-ink-soft">
                              {format(m.room, { number: roomNumber.get(r.room_id) ?? '?' })}
                            </span>
                          )}
                          {ms !== undefined && (
                            <span className="text-xs font-semibold text-ink-muted">
                              ({formatDuration(ms)})
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </div>
              ))}
            </section>
          )}
          </>
          )}
        </>
      )}
    </div>
  )
}

function Kpi({
  label, value, hint, tone, anchor,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'positive' | 'attention' | 'action'
  /** Ziel eines Lotsen-Schritts, siehe lib/lotsen.ts. */
  anchor?: string
}) {
  const toneClass =
    tone === 'positive' ? 'text-positive-deepest' :
    tone === 'attention' ? 'text-attention-deepest' :
    tone === 'action' ? 'text-action-deep' :
    'text-ink'
  return (
    <div data-lotse={anchor} className="rounded-xl border border-edge bg-surface px-4 py-3">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className={`text-xl font-black ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
