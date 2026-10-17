/**
 * Rechnungsposition und Rechnungstexte — I/O-frei, getestet.
 *
 * Die Rechnung selbst schreibt Stripe (Nummer, Steuer, PDF, Versand); RoSe
 * liefert genau eine Position je Konto und Kalendermonat, deren Betrag aus
 * `billingLine` kommt. Hier stehen die Texte dazu und die Abbildung des
 * Stripe-Status auf die Spiegel-Tabelle `invoices`.
 */

import type { BillingLine } from './pricing'
import { MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS } from './pricing'
import { formatCents } from './money'
import { monthPeriod, periodKey, type BillingPeriod } from './rooms'
import { PROVIDER } from './provider'
import { getMessages, intlLocale, type Locale } from './i18n'
import { format, plural } from './i18n/format'

/**
 * Sprache der Rechnung (18.10.2026): folgt dem **Land der Rechnungsanschrift**,
 * nicht der Oberfläche — die Rechnung entsteht im Monatslauf ohne Anfrage, und
 * sie ist ein Beleg für die Buchhaltung des Kunden. Deutschsprachige Länder
 * bekommen Deutsch, alle anderen Englisch; ohne Anschrift Deutsch.
 */
const GERMAN_SPEAKING = new Set(['DE', 'AT', 'CH', 'LI'])

export function invoiceLocale(country: string | null | undefined): Locale {
  if (!country) return 'de'
  return GERMAN_SPEAKING.has(country.toUpperCase()) ? 'de' : 'en'
}

const t = (l: Locale) => getMessages(l).account.billing.invoice
const intl = (l: Locale) => intlLocale(l)

/** Zahlungsziel in Tagen (§ 6 Abs. 4 AGB). */
export const INVOICE_DUE_DAYS = 14

/** Stripe-Steuercode „Software as a service (SaaS) – business use". */
export const SAAS_TAX_CODE = 'txcd_10103001'

/** Der Kalendermonat vor `now` — die Periode, die am Monatsersten abgerechnet wird. */
export function previousMonthPeriod(now: Date): BillingPeriod {
  const current = monthPeriod(now)
  const prevStart = new Date(current.start.getFullYear(), current.start.getMonth() - 1, 1)
  return monthPeriod(prevStart)
}

/** „September 2026" */
export function periodLabel(periodStart: Date, locale: Locale = 'de'): string {
  return periodStart.toLocaleDateString(intl(locale), { month: 'long', year: 'numeric' })
}

/** „01.09.2026 – 30.09.2026" */
export function periodRangeLabel(period: BillingPeriod, locale: Locale = 'de'): string {
  // Englisch ausgeschrieben („Sep 1, 2026“): 09/01/2026 läse ein europäischer Kunde als 9. Januar.
  const opts: Intl.DateTimeFormatOptions = locale === 'en'
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }
  const fmt = (d: Date) => d.toLocaleDateString(intl(locale), opts)
  const last = new Date(period.end.getTime() - 24 * 60 * 60 * 1000)
  return `${fmt(period.start)} – ${fmt(last)}`
}

/**
 * Beschreibung der einen Rechnungsposition. Nennt Zimmerzahl und Regel, damit
 * der Kunde den Betrag ohne die Konto-Seite nachvollziehen kann.
 */
export function invoiceLineDescription(line: BillingLine, periodStart: Date, locale: Locale = 'de'): string {
  const m = t(locale)
  const month = periodLabel(periodStart, locale)
  const rooms = plural(intl(locale), line.rooms, m.rooms)
  if (line.rooms * PRICE_PER_ROOM_CENTS < MIN_MONTHLY_CENTS) {
    return format(m.lineMinimum, { month, rooms, minimum: formatCents(MIN_MONTHLY_CENTS, intl(locale)) })
  }
  return format(m.line, { month, rooms, price: formatCents(PRICE_PER_ROOM_CENTS, intl(locale)) })
}

/** Vermerk (Memo) oberhalb der Positionen. */
export function invoiceMemo(period: BillingPeriod, locale: Locale = 'de'): string {
  return format(t(locale).memo, { range: periodRangeLabel(period, locale) })
}

/** Fußzeile mit den Pflichtangaben des Anbieters — steht auf jedem PDF. */
export function invoiceFooter(locale: Locale = 'de'): string {
  const m = t(locale)
  const teile = [
    PROVIDER.name,
    format(m.managingDirector, { name: PROVIDER.representative }),
    `${PROVIDER.registerCourt} ${PROVIDER.register}`,
    PROVIDER.vatId ? format(m.vatId, { vatId: PROVIDER.vatId }) : null,
    format(m.due, { days: INVOICE_DUE_DAYS }),
  ].filter(Boolean)
  return teile.join(' · ')
}

/** Name des Zusatzfelds „Leistungszeitraum“ auf der Rechnung. */
export function invoicePeriodFieldName(locale: Locale = 'de'): string {
  return t(locale).periodField
}

/** Idempotenzschlüssel je Konto und Periode — ein doppelter Lauf trifft bei Stripe dieselbe Rechnung. */
export function invoiceIdempotencyKey(accountId: string, period: BillingPeriod): string {
  return `invoice-${accountId}-${periodKey(period)}`
}

export type MirrorStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'

/** Stripe-Status → Spiegel-Status. Unbekanntes bleibt `open`, damit nichts fälschlich als bezahlt gilt. */
export function mapStripeInvoiceStatus(status: string | null | undefined): MirrorStatus {
  switch (status) {
    case 'draft': return 'draft'
    case 'paid': return 'paid'
    case 'uncollectible': return 'uncollectible'
    case 'void': return 'void'
    default: return 'open'
  }
}

/** Unix-Sekunden (Stripe) → `YYYY-MM-DD` in Ortszeit, für `due_at`. */
export function dateKeyFromUnix(seconds: number | null | undefined): string | null {
  if (!seconds) return null
  const d = new Date(seconds * 1000)
  return periodKeyLike(d)
}

function periodKeyLike(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Überfällig = offen und Fälligkeit vor dem heutigen Tag. */
export function isOverdue(status: MirrorStatus, dueAt: string | null, today: Date): boolean {
  if (status !== 'open' || !dueAt) return false
  return dueAt < periodKeyLike(today)
}
