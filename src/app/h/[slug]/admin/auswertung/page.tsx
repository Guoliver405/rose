import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { clampStaleMinutes } from '@/lib/board'
import {
  computeWorkStats, dayKey, dayRange, extractCleanings, formatDuration, sumStats,
  MAX_BREAK_HOURS, MAX_SHIFT_HOURS, type StaffLogRow, type WorkStats,
} from '@/lib/worklog'

const KIND_LABEL: Record<string, string> = {
  shift_start: 'Schichtbeginn',
  shift_end: 'Schichtende',
  break_start: 'Pause begonnen',
  break_end: 'Pause beendet',
  other_cleaning: 'Sonstige Reinigung (Einzelstich)',
  other_start: 'Sonstige Reinigung begonnen',
  other_end: 'Sonstige Reinigung beendet',
  clean_start: 'Reinigung gestartet',
  clean_done: 'Reinigung abgeschlossen',
  clean_aborted: 'Reinigung abgebrochen',
}

/** „YYYY-MM-DD" oder null. */
function parseDayParam(raw: string | undefined): string | null {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(key: string): string {
  return dayRange(key).start.toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
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

  const params = await searchParams
  const now = new Date()
  const today = dayKey(now)
  // Default: laufende Woche = die letzten 7 Kalendertage inkl. heute.
  const defaultFrom = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6))
  const from = parseDayParam(params.from) ?? defaultFrom
  const to = parseDayParam(params.to) ?? today
  // Vertauschte Eingabe still korrigieren statt Fehler werfen.
  const [fromKey, toKey] = from <= to ? [from, to] : [to, from]
  const range = { start: dayRange(fromKey).start, end: dayRange(toKey).end }

  const supabase = await createClient()
  const [{ data: profiles }, { data: logs }, { data: rooms }, { data: hotel }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, deactivated_at')
      .eq('hotel_id', ctx.hotelId)
      .not('username', 'is', null)
      .order('display_name'),
    supabase
      .from('staff_log')
      .select('profile_id, kind, at, room_id')
      .eq('hotel_id', ctx.hotelId)
      .gte('at', range.start.toISOString())
      .lt('at', range.end.toISOString())
      .order('at'),
    supabase.from('rooms').select('id, number').eq('hotel_id', ctx.hotelId),
    supabase.from('hotels').select('policies').eq('id', ctx.hotelId).single(),
  ])

  const staleMinutes = clampStaleMinutes(
    (hotel?.policies as { cleaningStaleMinutes?: number } | null)?.cleaningStaleMinutes,
  )
  const roomNumber = new Map((rooms ?? []).map(r => [r.id, r.number]))

  const rowsByMaid = new Map<string, StaffLogRow[]>()
  for (const l of logs ?? []) {
    const list = rowsByMaid.get(l.profile_id) ?? []
    list.push({ kind: l.kind, at: l.at, room_id: l.room_id })
    rowsByMaid.set(l.profile_id, list)
  }

  // Kräfte mit Aktivität im Zeitraum — deaktivierte gehören dazu, genau
  // dafür werden sie nicht mehr gelöscht.
  const maids = (profiles ?? [])
    .map(p => ({
      id: p.id,
      name: p.display_name,
      deactivated: Boolean(p.deactivated_at),
      rows: rowsByMaid.get(p.id) ?? [],
    }))
    .filter(m => m.rows.length > 0)
    .map(m => ({ ...m, stats: computeWorkStats(m.rows, range, staleMinutes, now) }))

  const total = sumStats(maids.map(m => m.stats))
  const selected = params.maid ? maids.find(m => m.id === params.maid) ?? null : null

  // Detail-Protokoll: Kalendertage der gewählten Kraft, neueste zuerst.
  const days: { key: string; rows: StaffLogRow[]; stats: WorkStats; durationByEnd: Map<string, number> }[] = []
  if (selected) {
    const byDay = new Map<string, StaffLogRow[]>()
    for (const r of selected.rows) {
      const key = dayKey(new Date(r.at))
      const list = byDay.get(key) ?? []
      list.push(r)
      byDay.set(key, list)
    }
    for (const [key, rows] of [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
      const dRange = dayRange(key)
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
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/h/${ctx.hotelSlug}/admin/einstellungen`}
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink print:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Einstellungen
        </Link>
        <h1 className="text-xl font-black text-ink">Auswertung Reinigung</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
          {dayLabel(fromKey)} – {dayLabel(toKey)}
        </span>
      </div>

      {/* Zeitraum — reines GET-Formular, damit der Stand teil- und druckbar bleibt */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-edge bg-surface p-4 print:hidden">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          von
          <input
            type="date" name="from" defaultValue={fromKey}
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          bis
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
          Anzeigen
        </button>
      </form>

      {maids.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <p className="font-semibold text-ink">Keine Tätigkeiten in diesem Zeitraum.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Sobald Reinigungskräfte Schichten und Reinigungen stechen, erscheinen hier die Kennzahlen.
          </p>
        </div>
      ) : (
        <>
          {/* Kennzahlen gesamt */}
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <Kpi label="Arbeitszeit" value={formatDuration(total.shiftMs)} hint={`${total.shiftCount} Schichten`} />
            <Kpi label="davon Pause" value={formatDuration(total.breakMs)} />
            <Kpi label="Netto-Arbeitszeit" value={formatDuration(total.netMs)} tone="positive" />
            <Kpi label="Zimmerreinigung" value={formatDuration(total.cleaningMs)} hint={`${total.cleaningCount} Zimmer`} />
            <Kpi label="Ø je Zimmer" value={formatDuration(total.avgCleaningMs)} tone="action" />
            <Kpi
              label="Sonstige Reinigung"
              value={formatDuration(total.otherCleaningMs)}
              hint={
                total.legacyOtherCount > 0
                  ? `${total.otherCleaningCount}× · ${total.legacyOtherCount} Alt-Stiche ohne Dauer`
                  : `${total.otherCleaningCount}×`
              }
            />
            <Kpi label="Übrige Zeit" value={formatDuration(total.unassignedMs)} hint="Wege, Rüstzeit" />
            <Kpi
              label="Auffällig"
              value={`${total.implausibleCount + total.abortedCount + total.openCount + total.implausibleShiftCount + total.implausibleBreakCount}`}
              hint={`${total.implausibleShiftCount} Schichten ohne Ende · ${total.abortedCount} abgebrochen · ${total.openCount} offen · ${total.implausibleCount} unplausibel`}
              tone={
                total.implausibleCount + total.openCount + total.implausibleShiftCount > 0
                  ? 'attention'
                  : undefined
              }
            />
          </section>

          {/* Je Reinigungskraft */}
          <section className="overflow-x-auto rounded-xl border border-edge bg-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-edge text-xs font-semibold text-ink-muted">
                  <th className="px-4 py-2">Reinigungskraft</th>
                  <th className="px-3 py-2">Schichten</th>
                  <th className="px-3 py-2">Arbeitszeit</th>
                  <th className="px-3 py-2">Pause</th>
                  <th className="px-3 py-2">Netto</th>
                  <th className="px-3 py-2">Zimmer</th>
                  <th className="px-3 py-2">Reinigungszeit</th>
                  <th className="px-3 py-2">Ø je Zimmer</th>
                  <th className="px-3 py-2">Sonstige</th>
                  <th className="px-3 py-2">Übrige Zeit</th>
                </tr>
              </thead>
              <tbody>
                {maids.map(m => (
                  <tr key={m.id} className="border-b border-edge last:border-0">
                    <td className="px-4 py-2">
                      <Link href={linkFor(m.id)} className="font-bold text-ink hover:underline">
                        {m.name}
                      </Link>
                      {m.deactivated && (
                        <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                          deaktiviert
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">
                      {m.stats.shiftCount}
                      {m.stats.implausibleShiftCount > 0 && (
                        <span
                          className="ml-1.5 rounded-full bg-attention-pill px-2 py-0.5 text-xs font-bold text-attention-deepest"
                          title={`${m.stats.implausibleShiftCount}× Schichtende vergessen — nicht in der Arbeitszeit enthalten`}
                        >
                          +{m.stats.implausibleShiftCount} offen
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold text-ink">{formatDuration(m.stats.shiftMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(m.stats.breakMs)}</td>
                    <td className="px-3 py-2 font-semibold text-ink">{formatDuration(m.stats.netMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{m.stats.cleaningCount}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(m.stats.cleaningMs)}</td>
                    <td className="px-3 py-2 font-semibold text-ink">{formatDuration(m.stats.avgCleaningMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(m.stats.otherCleaningMs)}</td>
                    <td className="px-3 py-2 text-ink-soft">{formatDuration(m.stats.unassignedMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p className="flex items-start gap-2 rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-xs text-ink-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Zeiten entstehen aus den Stichen der Kräfte (Schicht, Pause, Reinigung Start/Ende).
              Vergessene Stiche werden nicht stillschweigend gekappt, sondern aus den Summen
              genommen und unter &bdquo;Auffällig&ldquo; ausgewiesen: Schichten über
              {' '}{MAX_SHIFT_HOURS} h, Pausen und sonstige Reinigungen über
              {' '}{MAX_BREAK_HOURS} h sowie Zimmerreinigungen ohne Abschluss oder länger als
              {` ${staleMinutes} Minuten. `}&bdquo;Übrige Zeit&ldquo; ist der Rest der
              Netto-Arbeitszeit (Wege, Rüstzeit). Name anklicken für das Tagesprotokoll.
            </span>
          </p>

          {/* Detail-Protokoll je Kalendertag */}
          {selected && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-black text-ink">Tagesprotokoll — {selected.name}</h2>
                <Link href={linkFor()} className="text-sm font-semibold text-ink-muted hover:text-ink print:hidden">
                  schließen
                </Link>
              </div>

              {days.map(d => (
                <div key={d.key} className="rounded-xl border border-edge bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2 border-b border-edge pb-2">
                    <h3 className="text-sm font-bold text-ink">{dayLabel(d.key)}</h3>
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                      {formatDuration(d.stats.shiftMs)} Arbeitszeit
                    </span>
                    {d.stats.breakMs > 0 && (
                      <span className="rounded-full bg-caution-pill px-2.5 py-0.5 text-xs font-semibold text-caution-deepest">
                        {formatDuration(d.stats.breakMs)} Pause
                      </span>
                    )}
                    <span className="rounded-full bg-positive-pill px-2.5 py-0.5 text-xs font-semibold text-positive-deepest">
                      {d.stats.cleaningCount} Zimmer · {formatDuration(d.stats.cleaningMs)}
                    </span>
                  </div>

                  <ol className="mt-2 flex flex-col gap-1">
                    {d.rows.map((r, i) => {
                      const ms = d.durationByEnd.get(r.at)
                      return (
                        <li key={`${r.at}-${i}`} className="flex items-baseline gap-3 text-sm">
                          <span className="w-12 shrink-0 font-mono text-xs text-ink-muted">
                            {timeLabel(r.at)}
                          </span>
                          <span className="font-semibold text-ink">
                            {KIND_LABEL[r.kind] ?? r.kind}
                          </span>
                          {r.room_id && (
                            <span className="text-ink-soft">
                              Zimmer {roomNumber.get(r.room_id) ?? '?'}
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
    </div>
  )
}

function Kpi({
  label, value, hint, tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'positive' | 'attention' | 'action'
}) {
  const toneClass =
    tone === 'positive' ? 'text-positive-deepest' :
    tone === 'attention' ? 'text-attention-deepest' :
    tone === 'action' ? 'text-action-deep' :
    'text-ink'
  return (
    <div className="rounded-xl border border-edge bg-surface px-4 py-3">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className={`text-xl font-black ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
