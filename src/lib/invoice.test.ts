import { describe, expect, it } from 'vitest'
import {
  INVOICE_DUE_DAYS, dateKeyFromUnix, invoiceFooter, invoiceIdempotencyKey, invoiceLineDescription,
  invoiceMemo, isOverdue, mapStripeInvoiceStatus, periodLabel, periodRangeLabel, previousMonthPeriod,
} from './invoice'
import { MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS, billingLine } from './pricing'
import { formatCents } from './money'

describe('previousMonthPeriod', () => {
  it('liefert den Vormonat, auch über den Jahreswechsel', () => {
    const p = previousMonthPeriod(new Date(2026, 9, 1, 4, 0)) // 1.10. 04:00
    expect([p.start.getFullYear(), p.start.getMonth(), p.start.getDate()]).toEqual([2026, 8, 1])
    expect([p.end.getFullYear(), p.end.getMonth(), p.end.getDate()]).toEqual([2026, 9, 1])
    const j = previousMonthPeriod(new Date(2027, 0, 1))
    expect([j.start.getFullYear(), j.start.getMonth()]).toEqual([2026, 11])
  })

  it('ist unabhängig vom Tag im laufenden Monat', () => {
    const a = previousMonthPeriod(new Date(2026, 9, 1))
    const b = previousMonthPeriod(new Date(2026, 9, 28))
    expect(a.start.getTime()).toBe(b.start.getTime())
  })
})

describe('Rechnungstexte', () => {
  const sept = new Date(2026, 8, 1)
  const registriert = new Date(2026, 3, 5)

  it('nennt Zimmerzahl und Zimmerpreis oberhalb des Mindestbetrags', () => {
    const line = billingLine(12, registriert, sept)
    expect(invoiceLineDescription(line, sept)).toBe(`RoSe – Nutzung im September 2026: 12 Zimmer × ${formatCents(PRICE_PER_ROOM_CENTS)}`)
  })

  it('nennt den Mindestbetrag darunter', () => {
    const line = billingLine(3, registriert, sept)
    expect(invoiceLineDescription(line, sept)).toBe(`RoSe – Nutzung im September 2026: 3 Zimmer (Mindestbetrag ${formatCents(MIN_MONTHLY_CENTS)} je Monat)`)
  })

  it('bildet Monats- und Zeitraum-Bezeichnung', () => {
    expect(periodLabel(sept)).toBe('September 2026')
    expect(periodRangeLabel(previousMonthPeriod(new Date(2026, 9, 1)))).toBe('01.09.2026 – 30.09.2026')
    expect(invoiceMemo(previousMonthPeriod(new Date(2026, 9, 1)))).toMatch(/^Leistungszeitraum 01\.09\.2026 – 30\.09\.2026\./)
  })

  it('trägt die Pflichtangaben des Anbieters in der Fußzeile', () => {
    const f = invoiceFooter()
    expect(f).toContain('I²D UG (haftungsbeschränkt)')
    expect(f).toContain('HRB 102734')
    expect(f).toContain('USt-IdNr. DE434570609')
    expect(f).toContain(`${INVOICE_DUE_DAYS} Tagen`)
  })

  it('bildet einen stabilen Idempotenzschlüssel je Konto und Periode', () => {
    const p = previousMonthPeriod(new Date(2026, 9, 1))
    expect(invoiceIdempotencyKey('abc', p)).toBe('invoice-abc-2026-09-01')
  })
})

describe('Status-Abbildung', () => {
  it('bildet Stripe-Status ab und lässt Unbekanntes offen', () => {
    expect(mapStripeInvoiceStatus('paid')).toBe('paid')
    expect(mapStripeInvoiceStatus('draft')).toBe('draft')
    expect(mapStripeInvoiceStatus('void')).toBe('void')
    expect(mapStripeInvoiceStatus('uncollectible')).toBe('uncollectible')
    expect(mapStripeInvoiceStatus('open')).toBe('open')
    expect(mapStripeInvoiceStatus(null)).toBe('open')
    expect(mapStripeInvoiceStatus('irgendwas')).toBe('open')
  })

  it('erkennt Überfälligkeit nur bei offenen Rechnungen nach dem Fälligkeitstag', () => {
    const heute = new Date(2026, 9, 20)
    expect(isOverdue('open', '2026-10-15', heute)).toBe(true)
    expect(isOverdue('open', '2026-10-20', heute)).toBe(false)
    expect(isOverdue('open', '2026-10-25', heute)).toBe(false)
    expect(isOverdue('paid', '2026-10-15', heute)).toBe(false)
    expect(isOverdue('open', null, heute)).toBe(false)
  })

  it('wandelt Unix-Sekunden in einen Tagesschlüssel', () => {
    const s = Math.floor(new Date(2026, 9, 15, 12).getTime() / 1000)
    expect(dateKeyFromUnix(s)).toBe('2026-10-15')
    expect(dateKeyFromUnix(null)).toBeNull()
  })
})
