import { describe, expect, it } from 'vitest'
import { currencyDigits, formatCents, formatMinor, isCurrency, parseCurrency, parsePriceToMinor, pricePlaceholder } from './money'

describe('parsePriceToMinor — Euro (Vorgabe)', () => {
  it('versteht Komma und Punkt als Dezimaltrenner', () => {
    expect(parsePriceToMinor('4,50')).toBe(450)
    expect(parsePriceToMinor('4.50')).toBe(450)
  })

  it('versteht ganze Beträge', () => {
    expect(parsePriceToMinor('4')).toBe(400)
    expect(parsePriceToMinor('0')).toBe(0)
  })

  it('ignoriert Währungszeichen und Leerzeichen', () => {
    expect(parsePriceToMinor(' 12,90 € ')).toBe(1290)
  })

  it('liefert null für „ohne Preisangabe"', () => {
    expect(parsePriceToMinor('')).toBeNull()
    expect(parsePriceToMinor('   ')).toBeNull()
  })

  it('weist Unsinn und negative Beträge ab', () => {
    expect(parsePriceToMinor('kostenlos')).toBeNull()
    expect(parsePriceToMinor('-5')).toBeNull()
  })

  it('rundet auf ganze Cent', () => {
    expect(parsePriceToMinor('4,555')).toBe(456)
  })
})

describe('formatCents', () => {
  it('formatiert deutsch mit Euro-Zeichen', () => {
    // Intl setzt ein schmales geschütztes Leerzeichen vor das €.
    expect(formatCents(450).replace(/ | /g, ' ')).toBe('4,50 €')
    expect(formatCents(0).replace(/ | /g, ' ')).toBe('0,00 €')
  })
})

/** Intl setzt schmale geschützte Leerzeichen — für den Vergleich normalisieren. */
const n = (s: string) => s.replace(/[  ]/g, ' ')

describe('Währung je Haus (17.10.2026)', () => {
  it('kleinste Einheit nach den Nachkommastellen der Währung', () => {
    expect(currencyDigits('EUR')).toBe(2)
    expect(currencyDigits('JPY')).toBe(0)
    expect(parsePriceToMinor('1200', 'JPY')).toBe(1200)
    expect(parsePriceToMinor('120,50', 'THB')).toBe(12050)
  })

  it('mehrdeutige Eingaben mit Tausendertrennern weist es ab statt zu raten', () => {
    expect(parsePriceToMinor('1.234,50', 'EUR')).toBeNull()
  })

  it('zeigt Betrag und Symbol im Format der Sprache', () => {
    expect(n(formatMinor(1200, 'EUR', 'de-DE'))).toBe('12,00 €')
    expect(n(formatMinor(1200, 'EUR', 'en-US'))).toBe('€12.00')
    expect(n(formatMinor(1200, 'JPY', 'en-US'))).toBe('¥1,200')
    expect(n(formatMinor(12050, 'CHF', 'de-DE'))).toBe('120,50 CHF')
  })

  it('liest die Währung des Hauses, sonst Euro', () => {
    expect(parseCurrency({ currency: 'THB' })).toBe('THB')
    expect(parseCurrency({ currency: 'XYZ' })).toBe('EUR')
    expect(parseCurrency({ currency: 'thb' })).toBe('EUR')
    expect(parseCurrency({})).toBe('EUR')
    expect(isCurrency('CHF')).toBe(true)
  })

  it('Beispielpreis passend zur Währung', () => {
    expect(pricePlaceholder('EUR')).toBe('4,50')
    expect(pricePlaceholder('JPY')).toBe('500')
  })
})
