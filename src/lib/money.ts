/**
 * Preis-Helfer. Service-Preise sind reine Anzeige-Info (optional, keine
 * Abrechnung) und werden in der kleinsten Einheit der Währung gespeichert
 * (`price_cents` — der Spaltenname stammt aus der Zeit, als es nur Euro gab).
 *
 * Seit 17.10.2026 hat jedes Haus eine Währung für seine Service-Preise
 * (`policies.currency`, ISO 4217, Vorgabe EUR). Die Preise von RoSe selbst
 * (Abrechnung, Landing Page, Rechtstexte) bleiben Euro: `formatCents`.
 *
 * Ohne I/O, getestet in `money.test.ts`. Browser-tauglich.
 */

export const DEFAULT_CURRENCY = 'EUR'

let supported: Set<string> | null = null
function supportedCurrencies(): Set<string> {
  if (!supported) {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    supported = new Set(intl.supportedValuesOf ? intl.supportedValuesOf('currency') : [DEFAULT_CURRENCY])
  }
  return supported
}

/** Alle Währungen der Laufzeit, für die Auswahl unter „Haus & Regeln“. */
export function listCurrencies(): string[] {
  return [...supportedCurrencies()].sort()
}

export function isCurrency(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value) && supportedCurrencies().has(value)
}

/** Währung der Service-Preise eines Hauses. */
export function parseCurrency(policies: Record<string, unknown>): string {
  return isCurrency(policies.currency) ? policies.currency : DEFAULT_CURRENCY
}

/** Nachkommastellen einer Währung (Euro 2, Yen 0, Dinar 3) — entscheidet über die kleinste Einheit. */
export function currencyDigits(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

/**
 * Preiseingabe → kleinste Einheit. "4,50" / "4.50" / "4" → 450 bei Euro,
 * "1200" → 1200 bei Yen. Währungszeichen und Leerzeichen werden ignoriert.
 * Leer/ungültig → null (= ohne Preisangabe).
 */
export function parsePriceToMinor(raw: string, currency: string = DEFAULT_CURRENCY): number | null {
  const cleaned = raw.trim().replace(/[^\d.,-]/g, '')
  if (!cleaned) return null
  if ((cleaned.match(/[.,]/g) ?? []).length > 1) return null
  const value = Number(cleaned.replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 10 ** currencyDigits(currency))
}

/** Betrag in kleinster Einheit → Anzeige im Format der Sprache („12,00 €“, „฿120.00“, „¥1,200“). */
export function formatMinor(amount: number, currency: string = DEFAULT_CURRENCY, intlLocale = 'de-DE'): string {
  const digits = currencyDigits(currency)
  try {
    return new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(amount / 10 ** digits)
  } catch {
    return `${(amount / 10 ** digits).toFixed(digits)} ${currency}`
  }
}

/** Beispielpreis fürs Eingabefeld — „4,50“ bei Euro, „500“ bei Yen. */
export function pricePlaceholder(currency: string, intlLocale = 'de-DE'): string {
  const digits = currencyDigits(currency)
  return new Intl.NumberFormat(intlLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
    .format(digits === 0 ? 500 : 4.5)
}

/** Preise von RoSe selbst (Abrechnung, Landing Page) — immer Euro. */
export function formatCents(cents: number, intlLocale = 'de-DE'): string {
  return new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
