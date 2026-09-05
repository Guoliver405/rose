import { Info } from 'lucide-react'
import { WEEKDAY_LABEL, type DemandStats } from '@/lib/demand'

/**
 * Nachfrage — wann wünschen Gäste Reinigung, wann reisen sie ab, und wer ist
 * dann im Dienst? Server-gerendert, reine CSS-Balken (keine Chart-Bibliothek),
 * druckbar wie der Rest der Auswertung.
 *
 * Farbsprache wie auf den Boards: Amber = Gast-Wunsch, Orange = Abreise,
 * Rosé = „Bitte nicht stören", Grün = Kräfte im Dienst.
 */
export default function DemandSection({
  stats, routineLabel, checkoutLabel,
}: {
  stats: DemandStats
  /** „11:00" — Uhrzeit, ab der die Routine fällig wird; null, wenn die Routine aus ist. */
  routineLabel: string | null
  /** „11:00" — Check-out-Frist des Hauses. */
  checkoutLabel: string
}) {
  const maxEvents = Math.max(1, ...stats.hours.map(h => Math.max(h.wishes, h.checkouts, h.dnd)))
  const maxStaff = Math.max(0.01, ...stats.hours.map(h => h.staffAvg))
  const routineHour = routineLabel ? Number(routineLabel.slice(0, 2)) : null
  const checkoutHour = Number(checkoutLabel.slice(0, 2))
  const pct = (n: number) => `${Math.round((n / maxEvents) * 100)}%`
  const empty = stats.totalWishes + stats.totalCheckouts + stats.totalDnd === 0

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-black text-ink">Nachfrage — wann Gäste Reinigung wünschen</h2>
        <span className="text-xs text-ink-muted">{stats.days} {stats.days === 1 ? 'Tag' : 'Tage'}, Ortszeit</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Mini label="Reinigungswünsche" value={String(stats.totalWishes)} tone="attention" />
        <Mini label="Abreisen" value={String(stats.totalCheckouts)} tone="caution" />
        <Mini
          label="Spitzenstunde"
          value={stats.peakWishHour === null ? '–' : `${String(stats.peakWishHour).padStart(2, '0')}–${String(stats.peakWishHour + 1).padStart(2, '0')} Uhr`}
        />
        <Mini
          label="Wünsche ohne Kraft im Dienst"
          value={stats.uncoveredShare === null ? '–' : `${Math.round(stats.uncoveredShare * 100)} %`}
          tone={stats.uncoveredShare !== null && stats.uncoveredShare > 0.2 ? 'attention' : undefined}
          hint="Anteil, der in Stunden fiel, in denen niemand auf Schicht war"
        />
      </div>

      {empty ? (
        <p className="text-sm text-ink-muted">
          Noch keine Gast-Signale oder Abreisen in diesem Zeitraum. Sobald Gäste im Portal
          tippen und die Rezeption auscheckt, entsteht hier das Tagesprofil.
        </p>
      ) : (
        <>
          {/* Stunden-Profil */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid h-28 grid-cols-24 items-end gap-px">
                {stats.hours.map(h => (
                  <div key={h.hour} className="flex h-full items-end justify-center gap-px px-px" title={`${h.hour}–${h.hour + 1} Uhr: ${h.wishes} Wünsche · ${h.checkouts} Abreisen · ${h.dnd}× Nicht stören · Ø ${h.staffAvg.toFixed(1)} Kräfte`}>
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
                    title={`Ø ${h.staffAvg.toFixed(1)} Kräfte im Dienst`}
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
                    {h.hour === checkoutHour && <span className="font-bold text-caution-deep">Check-out</span>}
                    {routineHour !== null && h.hour === routineHour && h.hour !== checkoutHour && (
                      <span className="font-bold text-attention-deep">Routine</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <Legend className="bg-attention" text="Reinigungswunsch (Gast tippt)" />
            <Legend className="bg-caution" text="Abreise (Check-out)" />
            <Legend className="bg-blocked" text="Bitte nicht stören" />
            <Legend className="bg-positive" text="Ø Kräfte im Dienst" />
          </div>

          {/* Wochentage */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-center text-sm">
              <thead>
                <tr className="text-xs font-semibold text-ink-muted">
                  <th className="py-1 text-left">Wochentag</th>
                  {stats.weekdays.map(w => <th key={w.weekday} className="py-1">{WEEKDAY_LABEL[w.weekday]}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-edge">
                  <td className="py-1 text-left text-ink-soft">Wünsche</td>
                  {stats.weekdays.map(w => <td key={w.weekday} className="py-1 font-semibold text-ink">{w.wishes}</td>)}
                </tr>
                <tr className="border-t border-edge">
                  <td className="py-1 text-left text-ink-soft">Abreisen</td>
                  {stats.weekdays.map(w => <td key={w.weekday} className="py-1 text-ink">{w.checkouts}</td>)}
                </tr>
                <tr className="border-t border-edge">
                  <td className="py-1 text-left text-ink-soft">Nicht stören</td>
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
          Gezählt wird der Zeitpunkt, an dem ein Gast im Portal tippt, und der Check-out-Klick
          der Rezeption — keine Wunschzeiten, sondern die tatsächliche Nachfrage. &bdquo;Kräfte im
          Dienst&ldquo; kommt aus den Schicht-Stichen, gemittelt über die Tage des Zeitraums. Liegen
          viele Wünsche in Stunden mit wenig oder keiner Kraft, ist das der Hinweis für die
          Schichtplanung. Check-out-Frist {checkoutLabel} Uhr{routineLabel ? `, Routine-Reinigung ab ${routineLabel} Uhr` : ', Routine-Reinigung aus'}.
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
