import { describe, expect, it } from 'vitest'
import { formatCents, parseEuroToCents } from './money'

describe('parseEuroToCents', () => {
  it('versteht Komma und Punkt als Dezimaltrenner', () => {
    expect(parseEuroToCents('4,50')).toBe(450)
    expect(parseEuroToCents('4.50')).toBe(450)
  })

  it('versteht ganze Beträge', () => {
    expect(parseEuroToCents('4')).toBe(400)
    expect(parseEuroToCents('0')).toBe(0)
  })

  it('ignoriert Euro-Zeichen und Leerzeichen', () => {
    expect(parseEuroToCents(' 12,90 € ')).toBe(1290)
  })

  it('liefert null für „ohne Preisangabe"', () => {
    expect(parseEuroToCents('')).toBeNull()
    expect(parseEuroToCents('   ')).toBeNull()
  })

  it('weist Unsinn und negative Beträge ab', () => {
    expect(parseEuroToCents('kostenlos')).toBeNull()
    expect(parseEuroToCents('-5')).toBeNull()
  })

  it('rundet auf ganze Cent', () => {
    expect(parseEuroToCents('4,555')).toBe(456)
  })
})

describe('formatCents', () => {
  it('formatiert deutsch mit Euro-Zeichen', () => {
    // Intl setzt ein schmales geschütztes Leerzeichen vor das €.
    expect(formatCents(450).replace(/ | /g, ' ')).toBe('4,50 €')
    expect(formatCents(0).replace(/ | /g, ' ')).toBe('0,00 €')
  })
})
