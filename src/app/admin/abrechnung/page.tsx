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
import { format, getMessages, intlLocale, type AccountMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import Rich from '@/components/i18n/Rich'
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

type PageMessages = AccountMessages['billing']['page']

const monatsName = (periodStart: string, intl: string) =>
  new Date(`${periodStart}T00:00:00`).toLocaleDateString(intl, { month: 'long', year: 'numeric' })

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

function FreiBadge({ m }: { m: PageMessages['free'] }) {
  return (
    <span
      className="rounded-full bg-positive-pill px-2 py-0.5 text-xs font-semibold text-positive-deepest"
      title={m.title}
    >
      {m.label}
    </span>
  )
}

const STATUS_PILL: Record<InvoiceRow['status'], string> = {
  draft: 'bg-surface-muted text-ink-muted',
  open: 'bg-attention-pill text-attention-deepest',
  paid: 'bg-positive-pill text-positive-deepest',
  uncollectible: 'bg-critical-pill text-critical-deepest',
  void: 'bg-surface-muted text-ink-muted',
}

function InvoicePill({ inv, heute, m }: { inv: InvoiceRow; heute: Date; m: PageMessages['status'] }) {
  const ueberfaellig = isOverdue(inv.status, inv.dueAt, heute)
  const p = ueberfaellig
    ? { text: m.overdue, cls: 'bg-critical-pill text-critical-deepest' }
    : { text: m[inv.status], cls: STATUS_PILL[inv.status] }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.cls}`} title={inv.lastError ?? undefined}>
      {p.text}
    </span>
  )
}

/** Hervorhebung in Sätzen der Seite („<b>Zahlung:</b> …“). */
const hervorhebung = { b: (c: string) => <span className="font-semibold text-ink">{c}</span> }

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
  const locale = await getAdminLocale()
  const b = getMessages(locale).account.billing
  const m = b.page
  const intl = intlLocale(locale)

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
  const zahlungsweg = konto?.paymentMethodKind ? b.kinds[konto.paymentMethodKind] : null
  const laufend = billingLine(
    billing.current.rooms, account.createdAt, new Date(`${billing.current.periodStart}T00:00:00`),
  )
  const abgeschlossen = billing.closed.map(row => ({
    ...row,
    line: billingLine(row.rooms, account.createdAt, new Date(`${row.periodStart}T00:00:00`)),
  }))
  const registriert = account.createdAt.toLocaleDateString(intl, {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const freiBis = lastFreePeriodStart(account.createdAt)
    .toLocaleDateString(intl, { month: 'long', year: 'numeric' })

  return (
    <KontoShell who={account.displayName} istInhaber>
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> {m.backToHouses}
        </Link>
        <h1 className="text-xl font-black text-ink">{m.title}</h1>
      </div>

      {/* ── Hinweis: Testbetrieb bzw. noch keine Berechnung ───────────── */}
      {(!mitStripe || stripeTestMode()) && (
        <div className="flex gap-3 rounded-xl border border-attention-tint-edge bg-attention-tint p-4 text-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-attention-deep" />
          <div className="text-attention-deepest">
            <p className="font-bold">{mitStripe ? m.notice.testTitle : m.notice.noneTitle}</p>
            <p className="mt-1">{mitStripe ? m.notice.testText : m.notice.noneText}</p>
          </div>
        </div>
      )}

      {/* ── Plan ───────────────────────────────────────────────────────── */}
      <Card title={m.plan.title} icon={Check} anchor="konto.plan">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p>
            <span className="text-3xl font-black text-ink">{formatCents(PRICE_PER_ROOM_CENTS, intl)}</span>
            <span className="ml-1.5 text-sm text-ink-soft">{m.plan.perRoom}</span>
          </p>
          <p className="text-sm text-ink-soft">
            <Rich
              text={m.plan.minimum}
              vars={{ amount: formatCents(MIN_MONTHLY_CENTS, intl), rooms: MIN_COVERS_ROOMS }}
              tags={hervorhebung}
            />
          </p>
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          {format(m.plan.text, { registered: registriert, freeUntil: freiBis })}
        </p>
      </Card>

      {/* ── Laufender Monat ────────────────────────────────────────────── */}
      <Card
        title={format(m.current.title, { month: monatsName(billing.current.periodStart, intl) })}
        icon={Building2}
        anchor="konto.laufend"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="pb-2 font-bold">{m.current.colHouse}</th>
                <th className="pb-2 text-right font-bold">{m.current.colRooms}</th>
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
                <td className="py-2 text-ink">{m.current.total}</td>
                <td className="py-2 text-right tabular-nums text-ink">{laufend.rooms}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm">
          <span className="text-ink-soft">{m.current.expected}</span>
          <span className="text-lg font-black text-ink">{formatCents(laufend.cents, intl)}</span>
          {laufend.free && (
            <>
              <FreiBadge m={m.free} />
              {laufend.regularCents > 0 && (
                <span className="text-xs text-ink-muted">
                  {format(m.insteadOf, { amount: formatCents(laufend.regularCents, intl) })}
                </span>
              )}
            </>
          )}
          <span className="text-xs text-ink-muted">{m.plusVat}</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">{m.current.note}</p>
      </Card>

      {/* ── Abgeschlossene Monate ──────────────────────────────────────── */}
      <Card title={m.closed.title} icon={FileText} anchor="konto.monate">
        {abgeschlossen.length === 0 ? (
          <p className="text-sm text-ink-muted">{m.closed.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted">
                  <th className="pb-2 font-bold">{m.closed.colMonth}</th>
                  <th className="pb-2 text-right font-bold">{m.closed.colRooms}</th>
                  <th className="pb-2 text-right font-bold">{m.closed.colAmount}</th>
                  <th className="pb-2 pl-3 font-bold">{m.closed.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {abgeschlossen.map(row => (
                  <tr key={row.periodStart} className="border-t border-edge">
                    <td className="py-2 font-semibold text-ink">{monatsName(row.periodStart, intl)}</td>
                    <td className="py-2 text-right tabular-nums text-ink">{row.rooms}</td>
                    <td className="py-2 text-right tabular-nums text-ink">
                      {formatCents(row.line.cents, intl)}
                      {row.line.free && row.line.regularCents > 0 && (
                        <span className="ml-1 text-xs text-ink-muted">
                          {format(m.insteadOf, { amount: formatCents(row.line.regularCents, intl) })}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pl-3">
                      <span className="flex flex-wrap gap-1">
                        {row.line.free && <FreiBadge m={m.free} />}
                        {row.fixed && (
                          <span
                            className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted"
                            title={m.closed.fixedTitle}
                          >
                            {m.closed.fixed}
                          </span>
                        )}
                        {!row.line.free && row.line.cents > 0 && (
                          rechnungJePeriode.get(row.periodStart)
                            ? <InvoicePill inv={rechnungJePeriode.get(row.periodStart)!} heute={heute} m={m.status} />
                            : (
                              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                                {m.closed.notCharged}
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
        <p className="mt-2 text-xs text-ink-muted">{m.closed.note}</p>
      </Card>

      {/* ── Zahlungsweg + Rechnungen ───────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card title={m.paymentMethod.title} icon={CreditCard} anchor="konto.zahlungsweg">
          {!mitStripe ? (
            <p className="text-sm text-ink-soft">{m.paymentMethod.unavailable}</p>
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
                  {m.paymentMethod.none}
                </p>
              )}
              {billingDetailsComplete(konto) ? (
                <p className="text-xs text-ink-soft">
                  <Rich
                    text={m.paymentMethod.invoiceTo}
                    vars={{
                      name: konto?.billingName ?? '',
                      postalCode: konto?.billingAddress?.postal_code ?? '',
                      city: konto?.billingAddress?.city ?? '',
                      country: konto?.billingAddress?.country ?? '',
                    }}
                    tags={hervorhebung}
                  />
                  {konto?.vatId ? format(m.paymentMethod.vatId, { vatId: konto.vatId }) : ''}
                </p>
              ) : (
                <p className="text-xs text-ink-soft">{m.paymentMethod.detailsMissing}</p>
              )}
              <Link
                href="/admin/abrechnung/zahlungsweg"
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-xs font-bold text-ink hover:border-edge-strong"
              >
                <Pencil className="h-3.5 w-3.5" /> {zahlungsweg ? m.paymentMethod.change : m.paymentMethod.add}
              </Link>
            </div>
          )}
        </Card>
        <Card title={m.invoices.title} icon={FileText} anchor="konto.rechnungen">
          {rechnungen.length === 0 ? (
            <p className="text-sm text-ink-soft">
              {mitStripe ? m.invoices.emptyStripe : m.invoices.emptyNone}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-edge text-sm">
              {rechnungen.map(inv => (
                <li key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="font-semibold text-ink">{monatsName(inv.periodStart, intl)}</span>
                  {inv.number && <span className="font-mono text-xs text-ink-muted">{inv.number}</span>}
                  <span className="tabular-nums text-ink">
                    {inv.totalCents != null
                      ? formatCents(inv.totalCents, intl)
                      : format(m.invoices.net, { amount: formatCents(inv.netCents, intl) })}
                  </span>
                  <InvoicePill inv={inv} heute={heute} m={m.status} />
                  {inv.dueAt && inv.status === 'open' && (
                    <span className="text-xs text-ink-muted">
                      {format(m.invoices.due, { date: new Date(`${inv.dueAt}T00:00:00`).toLocaleDateString(intl) })}
                    </span>
                  )}
                  {inv.lastError && inv.status === 'draft' && (
                    <span className="text-xs text-attention-deepest">{inv.lastError}</span>
                  )}
                  <span className="ml-auto flex gap-3">
                    {inv.invoicePdf && (
                      <a href={inv.invoicePdf} className="text-xs font-semibold text-action-strong hover:underline">{m.invoices.pdf}</a>
                    )}
                    {inv.hostedInvoiceUrl && (
                      <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs font-semibold text-action-strong hover:underline">
                        {inv.status === 'open' ? m.invoices.viewPay : m.invoices.view} <ExternalLink className="h-3 w-3" />
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
      <Card title={m.terms.title} icon={Info}>
        <ul className="grid gap-x-6 gap-y-2 text-sm text-ink-soft sm:grid-cols-2">
          {[m.terms.interval, m.terms.payment, m.terms.minimum, m.terms.inactive, m.terms.cancel, m.terms.net].map(text => (
            <Regel key={text}>
              <Rich text={text} tags={hervorhebung} />
            </Regel>
          ))}
          <Regel>
            <Rich
              text={m.terms.details}
              tags={{ link: c => <Link href="/agb" className="underline hover:text-ink">{c}</Link> }}
            />
          </Regel>
        </ul>
      </Card>
    </KontoShell>
  )
}
