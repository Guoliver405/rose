import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Building2, Check, CreditCard, ExternalLink, FileText, Info, Pencil } from 'lucide-react'
import { getAccountContext } from '@/utils/auth'
import { getBillingOverview } from '@/utils/billing'
import { billingDetailsComplete, getAccountBilling, stripeReady, stripeTestMode } from '@/utils/stripe'
import { ensureInvoicesForAccount, listInvoices, type InvoiceRow } from '@/utils/invoicing'
import { isOverdue } from '@/lib/invoice'
import { formatCents } from '@/lib/money'
import {
  MIN_COVERS_ROOMS, MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS, billingLine, lastFreePeriodStart,
} from '@/lib/pricing'
import KontoShell from '../KontoShell'

/**
 * Plan & Abrechnung — die Konto-Seite des Inhabers.
 *
 * Zeigt, was das Konto nach dem Preismodell aus `pricing.ts` kostet: die
 * Zimmerzahl des laufenden Monats (je Haus und gesamt), die abgeschlossenen
 * Monate mit Betrag, dazu die Regeln in Kurzform. Zahlungsverfahren und
 * Rechnungen sind **Platzhalter** — es gibt noch keinen Zahlungsprovider, und
 * solange keiner eingerichtet ist, wird nichts berechnet (§ 6 Abs. 4 AGB).
 * Die Seite sagt das ausdrücklich, statt einen leeren Rechnungs-Ordner zu
 * zeigen, der wie ein Fehler aussieht.
 *
 * Die Beträge kommen aus `billingLine`, nicht aus eigener Rechnung — dieselbe
 * Funktion soll später die Rechnung stellen, damit Anzeige und Rechnung nie
 * auseinanderlaufen.
 *
 * Nur für den Kontoinhaber: ein Manager hat kein Konto und landet auf `/admin`.
 */

const monatsName = (periodStart: string) =>
  new Date(`${periodStart}T00:00:00`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

function Card({
  title, icon: Icon, children, anchor,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  /** Ziel eines Lotsen-Schritts, siehe lib/lotsen.ts. */
  anchor?: string
}) {
  return (
    <section data-lotse={anchor} className="rounded-xl border border-edge bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink-soft">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function FreiBadge() {
  return (
    <span
      className="rounded-full bg-positive-pill px-2 py-0.5 text-xs font-semibold text-positive-deepest"
      title="Freier Monat: der Kalendermonat der Registrierung und der erste volle Monat danach."
    >
      frei
    </span>
  )
}

const STATUS_PILL: Record<InvoiceRow['status'], { text: string; cls: string }> = {
  draft: { text: 'in Vorbereitung', cls: 'bg-surface-muted text-ink-muted' },
  open: { text: 'offen', cls: 'bg-attention-pill text-attention-deepest' },
  paid: { text: 'bezahlt', cls: 'bg-positive-pill text-positive-deepest' },
  uncollectible: { text: 'nicht einbringlich', cls: 'bg-critical-pill text-critical-deepest' },
  void: { text: 'storniert', cls: 'bg-surface-muted text-ink-muted' },
}

function InvoicePill({ inv, heute }: { inv: InvoiceRow; heute: Date }) {
  const ueberfaellig = isOverdue(inv.status, inv.dueAt, heute)
  const p = ueberfaellig ? { text: 'überfällig', cls: 'bg-critical-pill text-critical-deepest' } : STATUS_PILL[inv.status]
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.cls}`} title={inv.lastError ?? undefined}>
      {p.text}
    </span>
  )
}

function Regel({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" />
      <span>{children}</span>
    </li>
  )
}

export default async function AbrechnungPage() {
  const account = await getAccountContext()
  if (!account) redirect('/admin')

  const mitStripe = stripeReady()
  // Den Monatslauf für dieses Konto nachziehen, falls der Cron nicht lief —
  // idempotent, in der Regel eine Abfrage.
  if (mitStripe) await ensureInvoicesForAccount(account.accountId)
  const [billing, konto, rechnungen] = await Promise.all([
    getBillingOverview(account.accountId, 12),
    mitStripe ? getAccountBilling(account.accountId) : Promise.resolve(null),
    mitStripe ? listInvoices(account.accountId) : Promise.resolve([] as InvoiceRow[]),
  ])
  const heute = new Date()
  const rechnungJePeriode = new Map(rechnungen.map(r => [r.periodStart, r]))
  const zahlungsweg = konto?.paymentMethodKind
    ? { card: 'Karte', sepa_debit: 'SEPA-Lastschrift', bank_transfer: 'Überweisung auf Rechnung' }[konto.paymentMethodKind]
    : null
  const laufend = billingLine(
    billing.current.rooms, account.createdAt, new Date(`${billing.current.periodStart}T00:00:00`),
  )
  const abgeschlossen = billing.closed.map(row => ({
    ...row,
    line: billingLine(row.rooms, account.createdAt, new Date(`${row.periodStart}T00:00:00`)),
  }))
  const registriert = account.createdAt.toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const freiBis = lastFreePeriodStart(account.createdAt)
    .toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <KontoShell who={account.displayName}>
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Häuser
        </Link>
        <h1 className="text-xl font-black text-ink">Plan &amp; Abrechnung</h1>
      </div>

      {/* ── Hinweis: Testbetrieb bzw. noch keine Berechnung ───────────── */}
      {(!mitStripe || stripeTestMode()) && (
        <div className="flex gap-3 rounded-xl border border-attention-tint-edge bg-attention-tint p-4 text-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-attention-deep" />
          <div className="text-attention-deepest">
            <p className="font-bold">{mitStripe ? 'Testbetrieb — es wird nichts belastet.' : 'Aktuell wird nichts berechnet.'}</p>
            <p className="mt-1">
              {mitStripe
                ? 'Rechnungen werden monatlich am 1. für den Vormonat gestellt, derzeit aber über die Testumgebung unseres Zahlungsdienstleisters: Sie sind Testrechnungen, hinterlegte Zahlungsmittel werden nicht belastet. Vor dem Wechsel in den Echtbetrieb werden Sie in Textform informiert.'
                : 'Rechnungsstellung und Zahlungsverfahren sind noch nicht eingerichtet. Die Beträge auf dieser Seite zeigen, was das Konto nach dem Preismodell kosten würde. Vor der ersten Berechnung werden Sie in Textform informiert und können ein Zahlungsverfahren hinterlegen — bis dahin entstehen keine Kosten.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Plan ───────────────────────────────────────────────────────── */}
      <Card title="Ihr Plan" icon={Check} anchor="konto.plan">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p>
            <span className="text-3xl font-black text-ink">{formatCents(PRICE_PER_ROOM_CENTS)}</span>
            <span className="ml-1.5 text-sm text-ink-soft">je Zimmer und Monat, zzgl. USt.</span>
          </p>
          <p className="text-sm text-ink-soft">
            Mindestbetrag <span className="font-semibold text-ink">{formatCents(MIN_MONTHLY_CENTS)}</span> je
            Konto und Monat — bis {MIN_COVERS_ROOMS} Zimmer ein Festpreis.
          </p>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          Ein Preis für alle Hausgrößen, alle Funktionen sind enthalten. Es gibt keine Pakete
          und nichts, worauf Sie später hochstufen müssten. Ihr Konto besteht seit dem{' '}
          {registriert} und ist frei bis Ende {freiBis} — der Monat der Registrierung und der
          erste volle Kalendermonat danach kosten nichts.
        </p>
      </Card>

      {/* ── Laufender Monat ────────────────────────────────────────────── */}
      <Card title={`Laufender Monat — ${monatsName(billing.current.periodStart)}`} icon={Building2} anchor="konto.laufend">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="pb-2 font-bold">Haus</th>
                <th className="pb-2 text-right font-bold">Abrechenbare Zimmer</th>
              </tr>
            </thead>
            <tbody>
              {billing.hotels.map(h => (
                <tr key={h.id} className="border-t border-edge">
                  <td className="py-2">
                    <Link href={`/h/${h.slug}/admin`} className="font-semibold text-ink hover:underline">
                      {h.name}
                    </Link>
                  </td>
                  <td className="py-2 text-right tabular-nums text-ink">{h.rooms}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-edge-strong font-bold">
                <td className="py-2 text-ink">Gesamt</td>
                <td className="py-2 text-right tabular-nums text-ink">{laufend.rooms}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm">
          <span className="text-ink-soft">Voraussichtlicher Betrag:</span>
          <span className="text-lg font-black text-ink">{formatCents(laufend.cents)}</span>
          {laufend.free && (
            <>
              <FreiBadge />
              {laufend.regularCents > 0 && (
                <span className="text-xs text-ink-muted">statt {formatCents(laufend.regularCents)}</span>
              )}
            </>
          )}
          <span className="text-xs text-ink-muted">zzgl. USt.</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Gezählt wird jedes Zimmer, das im Monat auch nur vorübergehend in Betrieb war — ein
          heute außer Betrieb genommenes Zimmer zählt für diesen Monat also noch mit, ein heute
          angelegtes ebenfalls. Die Zahl steht erst mit dem Monatsende fest.
        </p>
      </Card>

      {/* ── Abgeschlossene Monate ──────────────────────────────────────── */}
      <Card title="Abgeschlossene Monate" icon={FileText} anchor="konto.monate">
        {abgeschlossen.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Noch kein abgeschlossener Monat — der erste erscheint hier ab dem 1. des Folgemonats.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted">
                  <th className="pb-2 font-bold">Monat</th>
                  <th className="pb-2 text-right font-bold">Zimmer</th>
                  <th className="pb-2 text-right font-bold">Betrag</th>
                  <th className="pb-2 pl-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {abgeschlossen.map(row => (
                  <tr key={row.periodStart} className="border-t border-edge">
                    <td className="py-2 font-semibold text-ink">{monatsName(row.periodStart)}</td>
                    <td className="py-2 text-right tabular-nums text-ink">{row.rooms}</td>
                    <td className="py-2 text-right tabular-nums text-ink">
                      {formatCents(row.line.cents)}
                      {row.line.free && row.line.regularCents > 0 && (
                        <span className="ml-1 text-xs text-ink-muted">statt {formatCents(row.line.regularCents)}</span>
                      )}
                    </td>
                    <td className="py-2 pl-3">
                      <span className="flex flex-wrap gap-1">
                        {row.line.free && <FreiBadge />}
                        {row.fixed && (
                          <span
                            className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted"
                            title="Festgeschrieben, bevor Zimmer gelöscht wurden — diese Zahl ändert sich nicht mehr."
                          >
                            festgeschrieben
                          </span>
                        )}
                        {!row.line.free && row.line.cents > 0 && (
                          rechnungJePeriode.get(row.periodStart)
                            ? <InvoicePill inv={rechnungJePeriode.get(row.periodStart)!} heute={heute} />
                            : (
                              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                                nicht berechnet
                              </span>
                            )
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-ink-muted">
          Abgeschlossene Monate werden festgeschrieben, sobald Zimmer gelöscht werden — sonst
          würde ein gelöschtes Zimmer rückwirkend aus bereits abgerechneten Zeiträumen
          verschwinden. Solange nichts gelöscht wird, ist die Zählung aus den Zimmern selbst
          ebenso verbindlich.
        </p>
      </Card>

      {/* ── Zahlungsverfahren + Rechnungen (Platzhalter) ───────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Zahlungsverfahren" icon={CreditCard} anchor="konto.zahlungsweg">
          {!mitStripe ? (
            <p className="text-sm text-ink-soft">
              Noch kein Zahlungsverfahren hinterlegt — und derzeit auch keines wählbar. Sobald
              die Rechnungsstellung eingerichtet ist, können Sie hier ein Zahlungsverfahren
              hinterlegen. Sie werden vorher in Textform informiert.
            </p>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              {zahlungsweg ? (
                <p>
                  <span className="font-semibold text-ink">{zahlungsweg}</span>
                  {konto?.paymentMethodKind !== 'bank_transfer' && konto?.paymentMethodLabel && (
                    <span className="text-ink-soft"> · {konto.paymentMethodLabel}</span>
                  )}
                </p>
              ) : (
                <p className="rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-xs font-semibold text-attention-deepest">
                  Noch kein Zahlungsweg hinterlegt.
                </p>
              )}
              {billingDetailsComplete(konto) ? (
                <p className="text-xs text-ink-soft">
                  Rechnung an <span className="font-semibold text-ink">{konto?.billingName}</span>,{' '}
                  {konto?.billingAddress?.postal_code} {konto?.billingAddress?.city},{' '}
                  {konto?.billingAddress?.country}
                  {konto?.vatId ? ` · USt-IdNr. ${konto.vatId}` : ''}
                </p>
              ) : (
                <p className="text-xs text-ink-soft">Rechnungsdaten fehlen noch.</p>
              )}
              <Link
                href="/admin/abrechnung/zahlungsweg"
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-xs font-bold text-ink hover:border-edge-strong"
              >
                <Pencil className="h-3.5 w-3.5" /> {zahlungsweg ? 'Zahlungsweg und Rechnungsdaten ändern' : 'Zahlungsweg hinterlegen'}
              </Link>
            </div>
          )}
        </Card>
        <Card title="Rechnungen" icon={FileText} anchor="konto.rechnungen">
          {rechnungen.length === 0 ? (
            <p className="text-sm text-ink-soft">
              {mitStripe
                ? 'Noch keine Rechnung. Die erste entsteht am 1. des Monats nach dem Freimonat — monatlich nachträglich, elektronisch, fällig innerhalb von 14 Tagen ohne Abzug.'
                : 'Noch keine Rechnungen. Rechnungen erscheinen hier, sobald die Rechnungsstellung eingerichtet ist — monatlich nachträglich, elektronisch, fällig innerhalb von 14 Tagen ohne Abzug.'}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-edge text-sm">
              {rechnungen.map(inv => (
                <li key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="font-semibold text-ink">{monatsName(inv.periodStart)}</span>
                  {inv.number && <span className="font-mono text-xs text-ink-muted">{inv.number}</span>}
                  <span className="tabular-nums text-ink">
                    {inv.totalCents != null ? formatCents(inv.totalCents) : `${formatCents(inv.netCents)} netto`}
                  </span>
                  <InvoicePill inv={inv} heute={heute} />
                  {inv.dueAt && inv.status === 'open' && (
                    <span className="text-xs text-ink-muted">fällig {new Date(`${inv.dueAt}T00:00:00`).toLocaleDateString('de-DE')}</span>
                  )}
                  {inv.lastError && inv.status === 'draft' && (
                    <span className="text-xs text-attention-deepest">{inv.lastError}</span>
                  )}
                  <span className="ml-auto flex gap-3">
                    {inv.invoicePdf && (
                      <a href={inv.invoicePdf} className="text-xs font-semibold text-action-strong hover:underline">PDF</a>
                    )}
                    {inv.hostedInvoiceUrl && (
                      <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs font-semibold text-action-strong hover:underline">
                        {inv.status === 'open' ? 'Ansehen / bezahlen' : 'Ansehen'} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Modalitäten ────────────────────────────────────────────────── */}
      <Card title="Abrechnungsmodalitäten" icon={Info}>
        <ul className="grid gap-x-6 gap-y-2 text-sm text-ink-soft sm:grid-cols-2">
          <Regel>
            <span className="font-semibold text-ink">Abrechnungsintervall:</span> Kalendermonat,
            monatlich nachträglich — die Rechnung kommt am 1. des Folgemonats per E-Mail und
            erscheint hier.
          </Regel>
          <Regel>
            <span className="font-semibold text-ink">Zahlung:</span> mit hinterlegter Karte oder
            Lastschrift wird mit Rechnungsstellung eingezogen (Lastschrift nach Vorabankündigung),
            sonst innerhalb von 14 Tagen per Überweisung oder über die Zahlungsseite.
          </Regel>
          <Regel>
            <span className="font-semibold text-ink">Mindestbetrag je Konto,</span> nicht je Haus —
            mehrere Häuser zahlen für die Summe ihrer Zimmer.
          </Regel>
          <Regel>
            <span className="font-semibold text-ink">Zimmer außer Betrieb</span> (Renovierung, Saison)
            zählen nicht, solange sie den ganzen Monat außer Betrieb sind.
          </Regel>
          <Regel>
            <span className="font-semibold text-ink">Keine Laufzeit:</span> monatlich zum Monatsende
            kündbar. Das Löschen des Kontos unter „Daten löschen“ ist zugleich die Kündigung.
          </Regel>
          <Regel>
            <span className="font-semibold text-ink">Alle Preise netto,</span> zuzüglich der
            gesetzlichen Umsatzsteuer.
          </Regel>
          <Regel>
            Details in den <Link href="/agb" className="underline hover:text-ink">AGB</Link>, § 6 und § 7.
          </Regel>
        </ul>
      </Card>
    </KontoShell>
  )
}
