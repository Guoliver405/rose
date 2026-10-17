'use client'

import { Printer } from 'lucide-react'
import { formatMinor } from '@/lib/money'
import type { StayBill } from '@/lib/stay-bill'
import type { PrintMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'

/**
 * Das Blatt. Auf dem Bildschirm eine Karte, im Druck der Seiteninhalt —
 * dasselbe Muster wie beim Gast-Handout.
 *
 * Print-Fallstrick von dort übernommen: Die Kopfzeile trägt eine farbige
 * **Linie**, keine gefüllte Fläche. Browser drucken Hintergrundflächen
 * standardmäßig nicht; ein Balken mit heller Schrift wäre auf Papier leer.
 */
export default function BillSheet({
  hotelName,
  roomNumber,
  building,
  checkedInAt,
  checkedOutAt,
  timeZone,
  bill,
  m,
  intlLocale,
}: {
  hotelName: string
  roomNumber: string
  building: string | null
  checkedInAt: string
  checkedOutAt: string | null
  timeZone: string
  bill: StayBill
  m: PrintMessages['statement']
  /** Sprach-Tag für Datum und Uhrzeit („de-DE“). */
  intlLocale: string
}) {
  const stamp = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(intlLocale, {
          timeZone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        }).format(new Date(iso))
      : '—'

  return (
    <div className="flex w-full flex-col items-center gap-5 print:gap-0">
      <article className="w-full max-w-[820px] rounded-2xl border border-edge bg-surface p-8 shadow-lg print:w-[186mm] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-t-4 border-action pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-action">
            {m.title}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-4xl font-black leading-none text-ink">
              <span className="mr-2 align-middle text-sm font-bold uppercase tracking-wider text-ink-muted">
                {m.room}
              </span>
              {roomNumber}
            </h1>
            <p className="text-sm font-semibold text-ink-soft">
              {building ? `${building} · ` : ''}{hotelName}
            </p>
          </div>
        </header>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 border-b border-edge pb-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{m.arrival}</dt>
            <dd className="font-semibold text-ink">{stamp(checkedInAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{m.departure}</dt>
            <dd className="font-semibold text-ink">
              {checkedOutAt ? stamp(checkedOutAt) : m.stayRunning}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{m.created}</dt>
            <dd className="font-semibold text-ink">{stamp(new Date().toISOString())}</dd>
          </div>
        </dl>

        {!bill.hasPositions ? (
          <p className="mt-6 rounded-xl border border-edge bg-surface-sunken px-4 py-6 text-center text-sm font-semibold text-ink-soft">
            {m.none}
          </p>
        ) : (
          <>
            <table className="mt-5 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-2 font-semibold">{m.service}</th>
                  <th className="py-2 font-semibold">{m.ordered}</th>
                  <th className="py-2 font-semibold">{m.done}</th>
                  <th className="py-2 text-right font-semibold">{m.amount}</th>
                </tr>
              </thead>
              <tbody>
                {bill.positions.map(p => (
                  <tr key={p.id} className="border-b border-edge align-top">
                    <td className="py-2 pr-3">
                      <span className="font-bold text-ink">{p.serviceName}</span>
                      {p.items.length > 0 && (
                        <span className="block text-xs text-ink-muted">
                          {p.items.map(i => `${i.label} (${formatMinor(i.priceCents, bill.currency)})`).join(' · ')}
                        </span>
                      )}
                      {!p.counted && (
                        <span className="mt-1 inline-block rounded-full border border-edge-strong px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                          {p.status === 'open' ? m.openNotCharged : m.notProvidedNotCharged}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-ink-soft">{stamp(p.createdAt)}</td>
                    <td className="py-2 pr-3 text-xs text-ink-soft">
                      {p.counted ? stamp(p.closedAt) : '—'}
                    </td>
                    <td className={`py-2 text-right font-bold tabular-nums ${p.counted ? 'text-ink' : 'text-ink-muted line-through'}`}>
                      {formatMinor(p.totalCents, bill.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right text-sm font-bold uppercase tracking-wide text-ink-soft">
                    {m.total}
                  </td>
                  <td className="pt-3 text-right text-2xl font-black tabular-nums text-ink">
                    {formatMinor(bill.totalCents, bill.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {(bill.openCount > 0 || bill.notDoneCount > 0) && (
              <p className="mt-3 text-xs text-ink-soft">
                {m.excludedNote}
              </p>
            )}
          </>
        )}

        <footer className="mt-6 border-t border-edge pt-3 text-[11px] leading-relaxed text-ink-muted">
          <Rich text={m.footer} tags={{ b: c => <span className="font-semibold">{c}</span> }} />
        </footer>
      </article>

      {/* ── Bedienung, nie gedruckt ────────────────────────────────── */}
      <div className="print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-action px-5 py-2.5 font-bold text-action-foreground shadow-sm hover:bg-action-strong"
        >
          <Printer className="h-4 w-4" />
          {m.print}
        </button>
      </div>
    </div>
  )
}
