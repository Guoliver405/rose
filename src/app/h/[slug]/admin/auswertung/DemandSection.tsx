import { Info } from 'lucide-react'
import type { DemandStats } from '@/lib/demand'
import { format, plural, type AdminMessages } from '@/lib/i18n'

/**
 * Nachfrage — wann wünschen Gäste Reinigung, wann reisen sie ab, und wer ist
 * dann im Dienst? Server-gerendert, reine CSS-Balken (keine Chart-Bibliothek),
 * druckbar wie der Rest der Auswertung.
 *
 * Farbsprache wie auf den Boards: Amber = Gast-Wunsch, Orange = Abreise,
 * Rosé = „Bitte nicht stören", Grün = Kräfte im Dienst.
 */
export default function DemandSection({
  stats, routineLabel, checkoutLabel, m, intlLocale,
}: {
  stats: DemandStats
  /** „11:00" — Uhrzeit, ab der die Routine fällig wird; null, wenn die Routine aus ist. */
  routineLabel: string | null
  /** „11:00" — Check-out-Frist des Hauses. */
  checkoutLabel: string
  m: AdminMessages['staff']['report']['demand']
  intlLocale: string
}) {
  const hh = (h: number) => String(h).padStart(2, '0')
  const maxEvents = Math.max(1, ...stats.hours.map(h => Math.max(h.wishes, h.checkouts, h.dnd)))
  const maxStaff = Math.max(0.01, ...stats.hours.map(h => h.staffAvg))
  const routineHour = routineLabel ? Number(routineLabel.slice(0, 2)) : null
  const checkoutHour = Number(checkoutLabel.slice(0, 2))
  const pct = (n: number) => `${Math.round((n / maxEvents) * 100)}%`
  const empty = stats.totalWishes + stats.totalCheckouts + stats.totalDnd === 0

  return (
    <section data-lotse="auswertung.nachfrage" className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-black text-ink">{m.title}</h2>
        <span className="text-xs text-ink-muted">{plural(intlLocale, stats.days, m.days)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label={m.wishes} value={String(stats.totalWishes)} tone="attention" />
        <Mini label={m.checkouts} value={String(stats.totalCheckouts)} tone="caution" />
        <Mini
          label={m.peakHour}
          value={stats.peakWishHour === null ? '–' : format(m.hourRange, { from: hh(stats.peakWishHour), to: hh(stats.peakWishHour + 1) })}
        />
        <Mini
          label={m.uncovered}
          value={stats.uncoveredShare === null ? '–' : format(m.uncoveredValue, { pct: Math.round(stats.uncoveredShare * 100) })}
          tone={stats.uncoveredShare !== null && stats.uncoveredShare > 0.2 ? 'attention' : undefined}
          hint={m.uncoveredHint}
        />
      </div>

      {empty ? (
        <p className="text-sm text-ink-muted">
          {m.empty}
        </p>
      ) : (
        <>
          {/* Stunden-Profil */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid h-28 grid-cols-24 items-end gap-px">
                {stats.hours.map(h => (
                  <div key={h.hour} className="flex h-full items-end justify-center gap-px px-px" title={format(m.hourTitle, { from: h.hour, to: h.hour + 1, wishes: h.wishes, checkouts: h.checkouts, dnd: h.dnd, staff: h.staffAvg.toFixed(1) })}>
                    <span className="w-1/3 rounded-t bg-attention" style={{ height: pct(h.wishes) }} />
                    <span className="w-1/3 rounded-t bg-caution" style={{ height: pct(h.checkouts) }} />
                    <span className="w-1/3 rounded-t bg-blocked" style={{ height: pct(h.dnd) }} />
                  </div>
                ))}
              </div>
              {/* Kräfte im Dienst: Streifen, Deckkraft = Anteil am Maximum */}
              <div className="mt-1 grid grid-cols-24 gap-px">
                {stats.hours.map(h => (
                  <div
                    key={h.hour}
                    className="flex h-6 items-center justify-center rounded-sm bg-positive text-[10px] font-bold text-positive-foreground"
                    style={{ opacity: h.staffAvg === 0 ? 0.12 : 0.35 + 0.65 * (h.staffAvg / maxStaff) }}
                    title={format(m.staffTitle, { staff: h.staffAvg.toFixed(1) })}
                  >
                    {h.staffAvg >= 0.05 ? h.staffAvg.toFixed(1) : ''}
                  </div>
                ))}
              </div>
              {/* Stundenachse mit Markern */}
              <div className="mt-1 grid grid-cols-24 gap-px text-center text-[10px] text-ink-muted">
                {stats.hours.map(h => (
                  <div key={h.hour} className="flex flex-col items-center">
                    <span>{h.hour % 3 === 0 ? String(h.hour).padStart(2, '0') : ''}</span>
                    {h.hour === checkoutHour && <span className="font-bold text-caution-deep">{m.markerCheckout}</span>}
                    {routineHour !== null && h.hour === routineHour && h.hour !== checkoutHour && (
                      <span className="font-bold text-attention-deep">{m.markerDaily}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <Legend className="bg-attention" text={m.legendWish} />
            <Legend className="bg-caution" text={m.legendCheckout} />
            <Legend className="bg-blocked" text={m.legendDnd} />
            <Legend className="bg-positive" text={m.legendStaff} />
          </div>

          {/* Wochentage */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-center text-sm">
              <thead>
                <tr className="text-xs font-semibold text-ink-muted">
                  <th className="py-1 text-left">{m.weekday}</th>
                  {stats.weekdays.map(w => <th key={w.weekday} className="py-1">{m.weekdays[w.weekday]}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-edge">
                  <td className="py-1 text-left text-ink-soft">{m.rowWishes}</td>
                  {stats.weekdays.map(w => <td key={w.weekday} className="py-1 font-semibold text-ink">{w.wishes}</td>)}
                </tr>
                <tr className="border-t border-edge">
                  <td className="py-1 text-left text-ink-soft">{m.rowCheckouts}</td>
                  {stats.weekdays.map(w => <td key={w.weekday} className="py-1 text-ink">{w.checkouts}</td>)}
                </tr>
                <tr className="border-t border-edge">
                  <td className="py-1 text-left text-ink-soft">{m.rowDnd}</td>
                  {stats.weekdays.map(w => <td key={w.weekday} className="py-1 text-ink">{w.dnd}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="flex items-start gap-2 rounded-lg bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {m.note}{' '}
          {routineLabel
            ? format(m.noteRules, { checkout: checkoutLabel, daily: routineLabel })
            : format(m.noteRulesOff, { checkout: checkoutLabel })}
        </span>
      </p>
    </section>
  )
}

function Mini({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'attention' | 'caution' }) {
  const toneClass = tone === 'attention' ? 'text-attention-deepest' : tone === 'caution' ? 'text-caution-deepest' : 'text-ink'
  return (
    <div className="rounded-lg border border-edge bg-surface-sunken px-3 py-2">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <p className={`text-lg font-black ${toneClass}`}>{value}</p>
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  )
}

function Legend({ className, text }: { className: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${className}`} /> {text}
    </span>
  )
}
