/**
 * Rechnungsdaten und USt-IdNr. — I/O-frei, getestet.
 *
 * Die **inhaltliche** Prüfung der USt-IdNr. (VIES) macht Stripe, sobald die
 * Nummer am Stripe-Kunden hinterlegt ist; hier wird nur geprüft, was ein
 * Formular sofort zurückmelden kann: Pflichtfelder, Ländercode, Präfix der
 * USt-IdNr. passend zum Land, grobes Format.
 *
 * Steuerlich relevant ist allein die Frage „EU-Land außer Deutschland?": dort
 * ist die USt-IdNr. Pflicht, weil Stripe Tax nur mit gültiger Nummer die
 * Steuerschuld umkehrt (Reverse Charge) — ohne Nummer würde ein
 * österreichisches Hotel deutsche Umsatzsteuer zahlen.
 */

/** EU-Mitgliedstaaten (ISO 3166-1 alpha-2). */
export const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

export function isEuCountry(country: string): boolean {
  return EU_COUNTRIES.has(country.toUpperCase())
}

/**
 * Präfix der USt-IdNr. je Land. Weicht bei Griechenland vom Ländercode ab
 * (EL statt GR); Nordirland (XI) bleibt außen vor — dort gilt seit dem
 * Brexit ein Sonderregime, das ein Hotel als Kunde nicht braucht.
 */
export function vatPrefixFor(country: string): string | null {
  const c = country.toUpperCase()
  if (!isEuCountry(c)) return null
  return c === 'GR' ? 'EL' : c
}

/** Leerzeichen, Punkte und Bindestriche raus, Großschreibung. */
export function normalizeVatId(raw: string): string {
  return raw.replace(/[\s.\-]/g, '').toUpperCase()
}

/**
 * Formale Prüfung: Präfix passt zum Land, danach 2–13 alphanumerische
 * Zeichen (die EU-Formate reichen von 8 Ziffern in AT/DK bis 12 in FR/ES mit
 * Buchstaben). Absichtlich grob — die echte Prüfung macht Stripe.
 */
export function vatIdLooksValid(vatId: string, country: string): boolean {
  const prefix = vatPrefixFor(country)
  if (!prefix) return false
  const v = normalizeVatId(vatId)
  if (!v.startsWith(prefix)) return false
  const rest = v.slice(prefix.length)
  return /^[A-Z0-9]{2,13}$/.test(rest) && /\d/.test(rest)
}

export type BillingDetailsInput = {
  name: string
  line1: string
  line2?: string
  postalCode: string
  city: string
  country: string
  vatId?: string
}

export type BillingDetails = {
  name: string
  address: { line1: string; line2: string | null; postal_code: string; city: string; country: string }
  /** Normalisiert; `null`, wenn keine angegeben (außerhalb der EU erlaubt). */
  vatId: string | null
}

/**
 * Prüft und normalisiert die Rechnungsdaten. Liefert entweder einen
 * Fehlertext für das Formular oder die bereinigten Werte.
 */
export function validateBillingDetails(input: BillingDetailsInput): { error: string } | { details: BillingDetails } {
  const name = input.name.trim()
  const line1 = input.line1.trim()
  const line2 = (input.line2 ?? '').trim()
  const postalCode = input.postalCode.trim()
  const city = input.city.trim()
  const country = input.country.trim().toUpperCase()
  const vatRaw = (input.vatId ?? '').trim()

  if (name.length < 2) return { error: 'Bitte den Rechnungsempfänger angeben.' }
  if (!/^[A-Z]{2}$/.test(country)) return { error: 'Bitte ein Land auswählen.' }
  if (line1.length < 3) return { error: 'Bitte Straße und Hausnummer angeben.' }
  if (postalCode.length < 3) return { error: 'Bitte die Postleitzahl angeben.' }
  if (city.length < 2) return { error: 'Bitte den Ort angeben.' }

  let vatId: string | null = null
  if (vatRaw) {
    if (!isEuCountry(country)) {
      return { error: 'Eine USt-IdNr. gibt es nur für Unternehmen in der EU. Bitte das Feld leer lassen.' }
    }
    if (!vatIdLooksValid(vatRaw, country)) {
      return { error: `Die USt-IdNr. passt nicht zum Format für ${country} (Präfix ${vatPrefixFor(country)}).` }
    }
    vatId = normalizeVatId(vatRaw)
  } else if (isEuCountry(country) && country !== 'DE') {
    return { error: 'Für Unternehmen in der EU außerhalb Deutschlands ist die USt-IdNr. Pflicht — sonst müssten wir deutsche Umsatzsteuer berechnen.' }
  }

  return {
    details: {
      name,
      address: { line1, line2: line2 || null, postal_code: postalCode, city, country },
      vatId,
    },
  }
}

/**
 * Alle ISO-3166-1-Alpha-2-Codes, die als Rechnungsland zur Auswahl stehen.
 * Anzeigenamen liefert `Intl.DisplayNames` zur Laufzeit; hier nur die Codes.
 */
export const COUNTRY_CODES: readonly string[] = [
  'AD', 'AE', 'AF', 'AG', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF',
  'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG',
  'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO',
  'DZ', 'EC', 'EE', 'EG', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FM', 'FR', 'GA', 'GB', 'GD', 'GE', 'GH',
  'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IN', 'IQ',
  'IR', 'IS', 'IT', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KZ', 'LA',
  'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG', 'MH',
  'MK', 'ML', 'MM', 'MN', 'MR', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NE', 'NG', 'NI',
  'NL', 'NO', 'NP', 'NR', 'NZ', 'OM', 'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PT', 'PW', 'PY', 'QA',
  'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO',
  'SR', 'ST', 'SV', 'SY', 'SZ', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV',
  'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VN', 'VU', 'WS', 'YE', 'ZA', 'ZM', 'ZW',
]
