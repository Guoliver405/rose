import { describe, expect, it } from 'vitest'
import { buildStayBill, type BillOrderInput } from './stay-bill'

function order(over: Partial<BillOrderInput> = {}): BillOrderInput {
  return {
    id: 'o1',
    serviceName: 'Wäscheservice',
    items: [{ label: 'Wäschesack klein', price_cents: 1200 }],
    status: 'done',
    createdAt: '2026-09-08T10:00:00.000Z',
    closedAt: '2026-09-08T12:00:00.000Z',
    ...over,
  }
}

describe('buildStayBill', () => {
  it('summiert erbrachte Leistungen', () => {
    const bill = buildStayBill([
      order({ id: 'a', items: [{ label: 'klein', price_cents: 1200 }] }),
      order({ id: 'b', items: [{ label: 'groß', price_cents: 2000 }] }),
    ])
    expect(bill.totalCents).toBe(3200)
    expect(bill.positions).toHaveLength(2)
    expect(bill.hasPositions).toBe(true)
  })

  it('summiert mehrere Optionen einer Anfrage', () => {
    const bill = buildStayBill([
      order({ items: [{ label: 'klein', price_cents: 1200 }, { label: 'groß', price_cents: 2000 }] }),
    ])
    expect(bill.positions[0].totalCents).toBe(3200)
    expect(bill.totalCents).toBe(3200)
  })

  it('lässt Wartung weg — ein Service ohne bepreiste Optionen taucht nicht auf', () => {
    const bill = buildStayBill([
      order({ id: 'wartung', serviceName: 'Technischer Dienst', items: [] }),
      order({ id: 'wäsche' }),
    ])
    expect(bill.positions.map(p => p.id)).toEqual(['wäsche'])
    expect(bill.totalCents).toBe(1200)
  })

  it('zählt offene kostenfreie Anfragen getrennt — der Check-out schließt sie mit', () => {
    const bill = buildStayBill([
      order({ id: 'defekt', serviceName: 'Technischer Dienst', items: [], status: 'open', closedAt: null }),
      order({ id: 'erledigter defekt', serviceName: 'Technischer Dienst', items: [] }),
      order({ id: 'wäsche' }),
    ])
    expect(bill.openFreeCount).toBe(1)
    expect(bill.openCount).toBe(0)
    expect(bill.positions.map(p => p.id)).toEqual(['wäsche'])
  })

  it('lässt Optionen ohne Preisangabe weg, behält die bepreiste', () => {
    const bill = buildStayBill([
      order({ items: [{ label: 'Kissen weich', price_cents: null }, { label: 'klein', price_cents: 1200 }] }),
    ])
    expect(bill.positions[0].items.map(i => i.label)).toEqual(['klein'])
    expect(bill.positions[0].totalCents).toBe(1200)
  })

  it('lässt eine Anfrage weg, die insgesamt nichts kostet', () => {
    const bill = buildStayBill([order({ items: [{ label: 'Gruß der Küche', price_cents: 0 }] })])
    expect(bill.hasPositions).toBe(false)
    expect(bill.totalCents).toBe(0)
  })

  it('zählt offene Anfragen nicht in die Summe, weist sie aber aus', () => {
    const bill = buildStayBill([
      order({ id: 'erbracht' }),
      order({ id: 'offen', status: 'open', closedAt: null, items: [{ label: 'groß', price_cents: 2000 }] }),
    ])
    expect(bill.totalCents).toBe(1200)
    expect(bill.openCount).toBe(1)
    expect(bill.openCents).toBe(2000)
    expect(bill.positions).toHaveLength(2)
    expect(bill.positions.find(p => p.id === 'offen')?.counted).toBe(false)
  })

  it('zählt nicht erbrachte Leistungen nicht, lässt sie aber sichtbar', () => {
    const bill = buildStayBill([
      order({ id: 'erbracht' }),
      order({ id: 'storniert', status: 'cancelled', items: [{ label: 'groß', price_cents: 2000 }] }),
    ])
    expect(bill.totalCents).toBe(1200)
    expect(bill.notDoneCount).toBe(1)
    expect(bill.openCount).toBe(0)
    expect(bill.positions.map(p => p.id)).toContain('storniert')
  })

  it('sortiert nach Bestellzeitpunkt, nicht nach Abschluss', () => {
    const bill = buildStayBill([
      order({ id: 'spät', createdAt: '2026-09-08T18:00:00.000Z', closedAt: '2026-09-08T18:30:00.000Z' }),
      order({ id: 'früh', createdAt: '2026-09-08T08:00:00.000Z', closedAt: '2026-09-08T20:00:00.000Z' }),
    ])
    expect(bill.positions.map(p => p.id)).toEqual(['früh', 'spät'])
  })

  it('ohne Bestellungen: Fall b) — keine Summe, keine Positionen', () => {
    const bill = buildStayBill([])
    expect(bill.hasPositions).toBe(false)
    expect(bill.totalCents).toBe(0)
    expect(bill.openCount).toBe(0)
    expect(bill.notDoneCount).toBe(0)
  })
})
