import { describe, expect, it } from 'vitest'
import {
  COUNTRY_CODES, isEuCountry, normalizeVatId, validateBillingDetails, vatIdLooksValid, vatPrefixFor,
} from './vat'

describe('vatPrefixFor / isEuCountry', () => {
  it('kennt die EU und den griechischen Sonderfall', () => {
    expect(isEuCountry('de')).toBe(true)
    expect(isEuCountry('CH')).toBe(false)
    expect(vatPrefixFor('AT')).toBe('AT')
    expect(vatPrefixFor('GR')).toBe('EL')
    expect(vatPrefixFor('US')).toBeNull()
  })
})

describe('normalizeVatId / vatIdLooksValid', () => {
  it('räumt Leerzeichen, Punkte und Bindestriche weg', () => {
    expect(normalizeVatId(' de 123.456-789 ')).toBe('DE123456789')
  })

  it('verlangt das Länder-Präfix', () => {
    expect(vatIdLooksValid('DE123456789', 'DE')).toBe(true)
    expect(vatIdLooksValid('ATU12345678', 'AT')).toBe(true)
    expect(vatIdLooksValid('EL123456789', 'GR')).toBe(true)
    expect(vatIdLooksValid('DE123456789', 'AT')).toBe(false)
    expect(vatIdLooksValid('123456789', 'DE')).toBe(false)
    expect(vatIdLooksValid('DEABCDEFGH', 'DE')).toBe(false)
    expect(vatIdLooksValid('CHE123', 'CH')).toBe(false)
  })
})

describe('validateBillingDetails', () => {
  const basis = { name: 'Hotel Test GmbH', line1: 'Hauptstraße 1', postalCode: '12345', city: 'Berlin', country: 'DE' }

  it('nimmt deutsche Daten ohne USt-IdNr.', () => {
    const r = validateBillingDetails(basis)
    expect('details' in r && r.details.vatId).toBeNull()
    expect('details' in r && r.details.address.country).toBe('DE')
  })

  it('normalisiert die USt-IdNr. und das Land', () => {
    const r = validateBillingDetails({ ...basis, country: 'de', vatId: 'de 123 456 789' })
    expect('details' in r && r.details.vatId).toBe('DE123456789')
  })

  it('verlangt in der EU außerhalb Deutschlands eine USt-IdNr.', () => {
    const r = validateBillingDetails({ ...basis, country: 'AT' })
    expect('error' in r && r.error).toMatch(/Pflicht/)
    const ok = validateBillingDetails({ ...basis, country: 'AT', vatId: 'ATU12345678' })
    expect('details' in ok).toBe(true)
  })

  it('lehnt eine USt-IdNr. außerhalb der EU ab', () => {
    const r = validateBillingDetails({ ...basis, country: 'CH', vatId: 'CHE123456789' })
    expect('error' in r && r.error).toMatch(/nur für Unternehmen in der EU/)
  })

  it('lässt Drittländer ohne USt-IdNr. durch', () => {
    const r = validateBillingDetails({ ...basis, country: 'US', postalCode: '10001', city: 'New York' })
    expect('details' in r).toBe(true)
  })

  it('meldet fehlende Pflichtfelder einzeln', () => {
    expect(validateBillingDetails({ ...basis, name: '' })).toEqual({ error: expect.stringMatching(/Rechnungsempfänger/) })
    expect(validateBillingDetails({ ...basis, country: '' })).toEqual({ error: expect.stringMatching(/Land/) })
    expect(validateBillingDetails({ ...basis, line1: '' })).toEqual({ error: expect.stringMatching(/Straße/) })
    expect(validateBillingDetails({ ...basis, city: '' })).toEqual({ error: expect.stringMatching(/Ort/) })
  })

  it('meldet ein falsches Präfix mit dem erwarteten', () => {
    const r = validateBillingDetails({ ...basis, country: 'GR', vatId: 'GR123456789' })
    expect('error' in r && r.error).toMatch(/EL/)
  })
})

describe('COUNTRY_CODES', () => {
  it('sind eindeutige Zwei-Buchstaben-Codes und enthalten alle EU-Staaten', () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
    for (const c of COUNTRY_CODES) expect(c).toMatch(/^[A-Z]{2}$/)
    for (const c of ['AT', 'DE', 'FR', 'GR', 'IE', 'SE']) expect(COUNTRY_CODES).toContain(c)
  })
})
