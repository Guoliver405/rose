import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RATE_BPS, HOLD_DAYS, PARTNER_CODE_ALPHABET, PARTNER_CODE_LENGTH,
  availableAt, commissionCents, isPartnerCode, isSelfReferral, normalizePartnerCode,
  refFromParam, reversalCents, summarize, withRef, type CommissionEntry,
} from './affiliate'
import { generatePartnerCode } from './ids'
import { MIN_MONTHLY_CENTS } from './pricing'

describe('commissionCents', () => {
  it('nimmt ein Fünftel vom bezahlten Nettobetrag', () => {
    expect(commissionCents(2000)).toBe(400)
    expect(commissionCents(6000)).toBe(1200)
  })

  it('läuft mit dem Mindestbetrag mit: 5 € ergeben 1 €', () => {
    expect(commissionCents(MIN_MONTHLY_CENTS)).toBe(100)
  })

  it('bucht im Freimonat nichts', () => {
    expect(commissionCents(0)).toBe(0)
    expect(commissionCents(-500)).toBe(0)
    expect(commissionCents(Number.NaN)).toBe(0)
  })

  it('rundet krumme Beträge kaufmännisch', () => {
    expect(commissionCents(552)).toBe(110)  // 110,4
    expect(commissionCents(553)).toBe(111)  // 110,6
    expect(commissionCents(2)).toBe(0)      // 0,4
    expect(commissionCents(3)).toBe(1)      // 0,6
  })

  it('rechnet mit dem Satz des Partners', () => {
    expect(commissionCents(2000, 2500)).toBe(500)
    expect(commissionCents(2000, 0)).toBe(0)
  })

  it('hält den vereinbarten Satz', () => {
    // 20 % dauerhaft (Entscheidung vom 26.10.2026) — Partnerbedingungen und
    // Partnerbereich nennen diese Zahl.
    expect(DEFAULT_RATE_BPS).toBe(2000)
  })
})

describe('reversalCents', () => {
  it('nimmt bei voller Erstattung die ganze Provision zurück', () => {
    expect(reversalCents(400, 2380, 2380)).toBe(400)
  })

  it('nimmt bei Teilerstattung den Anteil zurück', () => {
    expect(reversalCents(400, 2000, 500)).toBe(100)
    expect(reversalCents(100, 595, 200)).toBe(34)
  })

  it('nimmt nie mehr zurück als die Provision', () => {
    expect(reversalCents(400, 2000, 9000)).toBe(400)
  })

  it('bucht nichts ohne Erstattung oder ohne Provision', () => {
    expect(reversalCents(400, 2000, 0)).toBe(0)
    expect(reversalCents(0, 2000, 2000)).toBe(0)
    expect(reversalCents(400, 0, 100)).toBe(0)
  })
})

describe('Partner-Code', () => {
  it('erzeugt Codes in der gespeicherten Form', () => {
    for (let i = 0; i < 200; i++) {
      const code = generatePartnerCode()
      expect(code).toHaveLength(PARTNER_CODE_LENGTH)
      expect(isPartnerCode(code)).toBe(true)
    }
  })

  it('kennt keine verwechselbaren Zeichen', () => {
    for (const z of ['0', 'O', '1', 'I', 'L']) expect(PARTNER_CODE_ALPHABET).not.toContain(z)
  })

  it('passt zum CHECK der Migration', () => {
    // affiliates.code: ^[A-HJKMNP-Z2-9]{8}$
    const db = /^[A-HJKMNP-Z2-9]{8}$/
    for (const z of PARTNER_CODE_ALPHABET) expect(db.test(z.repeat(8))).toBe(true)
    for (const z of ['0', 'O', '1', 'I', 'L', 'a']) expect(db.test(z.repeat(8))).toBe(false)
  })

  it('normalisiert abgetippte und kopierte Eingaben', () => {
    expect(normalizePartnerCode(' abcd-efgh ')).toBe('ABCDEFGH')
    expect(normalizePartnerCode('ABCD EFGH​')).toBe('ABCDEFGH')
    expect(normalizePartnerCode(null)).toBe('')
    expect(normalizePartnerCode(undefined)).toBe('')
  })

  it('weist ab, was kein Code sein kann', () => {
    expect(isPartnerCode('ABCDEFGH')).toBe(true)
    expect(isPartnerCode('ABCDEFG')).toBe(false)
    expect(isPartnerCode('ABCDEFGHJ')).toBe(false)
    expect(isPartnerCode('ABCDEFG0')).toBe(false)
    expect(isPartnerCode('abcdefgh')).toBe(false)
    expect(isPartnerCode('')).toBe(false)
  })
})

describe('Code im Link', () => {
  it('hängt den Code an interne Links', () => {
    expect(withRef('/registrieren', 'ABCDEFGH')).toBe('/registrieren?ref=ABCDEFGH')
    expect(withRef('/simulator?x=1', 'abcd-efgh')).toBe('/simulator?x=1&ref=ABCDEFGH')
    expect(withRef('/#preise', 'ABCDEFGH')).toBe('/?ref=ABCDEFGH#preise')
  })

  it('trägt nichts weiter, was kein Code sein kann', () => {
    expect(withRef('/registrieren', '')).toBe('/registrieren')
    expect(withRef('/registrieren', null)).toBe('/registrieren')
    expect(withRef('/registrieren', '"><script>')).toBe('/registrieren')
    expect(withRef('/registrieren', 'ABC')).toBe('/registrieren')
  })

  it('liest den Code aus dem Parameter', () => {
    expect(refFromParam('abcdefgh')).toBe('ABCDEFGH')
    expect(refFromParam(['ABCDEFGH', 'ZZZZZZZZ'])).toBe('ABCDEFGH')
    expect(refFromParam(undefined)).toBe('')
    expect(refFromParam('nicht ein code')).toBe('')
  })
})

describe('isSelfReferral', () => {
  it('erkennt den eigenen Code bei der Kontoanlage', () => {
    expect(isSelfReferral({ partnerUserId: 'u1', actingUserId: 'u1' })).toBe(true)
    expect(isSelfReferral({ partnerUserId: 'u1', actingUserId: 'u2' })).toBe(false)
  })

  it('erkennt beim Buchen, dass der Partner zum Konto gehört', () => {
    expect(isSelfReferral({ partnerUserId: 'u1', memberUserIds: ['u2', 'u1'] })).toBe(true)
    expect(isSelfReferral({ partnerUserId: 'u1', memberUserIds: ['u2'] })).toBe(false)
    expect(isSelfReferral({ partnerUserId: 'u1' })).toBe(false)
  })
})

describe('availableAt', () => {
  it('liegt die Haltefrist nach der Zahlung', () => {
    const paid = new Date('2026-12-01T10:00:00Z')
    expect(availableAt(paid).toISOString()).toBe('2027-01-30T10:00:00.000Z')
  })

  it('deckt die SEPA-Rückgabe von acht Wochen ab', () => {
    expect(HOLD_DAYS).toBeGreaterThanOrEqual(56)
  })
})

describe('summarize', () => {
  const now = new Date('2027-03-15T12:00:00Z')
  const frei = '2027-03-01T00:00:00Z'       // Haltefrist abgelaufen
  const haelt = '2027-04-01T00:00:00Z'      // läuft noch

  const c = (invoiceId: string, periodStart: string, amountCents: number, availableAt: string): CommissionEntry =>
    ({ kind: 'commission', invoiceId, periodStart, amountCents, availableAt })
  const r = (invoiceId: string | null, periodStart: string, amountCents: number): CommissionEntry =>
    ({ kind: 'reversal', invoiceId, periodStart, amountCents, availableAt: null })

  it('ist ohne Buchungen leer', () => {
    expect(summarize([], now)).toEqual({ pendingCents: 0, availableCents: 0, reversedCents: 0, months: [] })
  })

  it('trennt vorgemerkt und verfügbar an der Haltefrist', () => {
    const s = summarize([c('a', '2026-12-01', 400, frei), c('b', '2027-02-01', 400, haelt)], now)
    expect(s.pendingCents).toBe(400)
    expect(s.availableCents).toBe(400)
    expect(s.reversedCents).toBe(0)
  })

  it('gibt genau zum Ende der Haltefrist frei', () => {
    const s = summarize([c('a', '2027-01-01', 400, now.toISOString())], now)
    expect(s.pendingCents).toBe(0)
    expect(s.availableCents).toBe(400)
  })

  it('zieht eine Rücknahme in der Haltefrist vom vorgemerkten Betrag ab', () => {
    const s = summarize([c('b', '2027-02-01', 400, haelt), r('b', '2027-02-01', -400)], now)
    expect(s.pendingCents).toBe(0)
    expect(s.availableCents).toBe(0)
    expect(s.reversedCents).toBe(400)
  })

  it('zieht eine Rücknahme nach der Haltefrist vom verfügbaren Betrag ab', () => {
    const s = summarize([
      c('a', '2026-12-01', 400, frei), r('a', '2026-12-01', -100),
      c('b', '2027-02-01', 400, haelt),
    ], now)
    expect(s.availableCents).toBe(300)
    expect(s.pendingCents).toBe(400)
    expect(s.reversedCents).toBe(100)
  })

  it('lässt den verfügbaren Betrag negativ werden, statt eine Rücknahme zu verschlucken', () => {
    const s = summarize([r(null, '2026-12-01', -250)], now)
    expect(s.availableCents).toBe(-250)
    expect(s.pendingCents).toBe(0)
  })

  it('verrechnet eine zurückgewonnene Rückbuchung', () => {
    const s = summarize([
      c('a', '2026-12-01', 400, frei), r('a', '2026-12-01', -400), r('a', '2026-12-01', 400),
    ], now)
    expect(s.availableCents).toBe(400)
    expect(s.reversedCents).toBe(0)
  })

  it('bündelt je Leistungsmonat, neuester zuerst', () => {
    const s = summarize([
      c('a', '2026-12-01', 400, frei),
      c('b', '2027-02-01', 400, haelt), c('b2', '2027-02-01', 100, haelt), r('b2', '2027-02-01', -100),
    ], now)
    expect(s.months).toEqual([
      { periodStart: '2027-02-01', netCents: 400, pendingCents: 400, reversedCents: 100 },
      { periodStart: '2026-12-01', netCents: 400, pendingCents: 0, reversedCents: 0 },
    ])
  })

  it('geht mit der Summe der Monate auf', () => {
    const entries = [
      c('a', '2026-12-01', 400, frei), r('a', '2026-12-01', -100),
      c('b', '2027-01-01', 730, frei), c('d', '2027-02-01', 120, haelt),
    ]
    const s = summarize(entries, now)
    const summe = entries.reduce((x, e) => x + e.amountCents, 0)
    expect(s.pendingCents + s.availableCents).toBe(summe)
    expect(s.months.reduce((x, m) => x + m.netCents, 0)).toBe(summe)
  })
})
