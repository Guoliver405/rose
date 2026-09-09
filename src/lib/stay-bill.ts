/**
 * Die Aufstellung der Zusatzleistungen eines Aufenthalts — reine Rechenlogik,
 * kein I/O.
 *
 * Zweck ist NICHT eine Rechnung: RoSe kennt keine Zimmerpreise, stellt keine
 * Rechnungsnummer aus und quittiert keine Zahlung (sonst wäre es der Sache
 * nach eine Kassenaufzeichnung). Die Aufstellung beantwortet genau eine Frage
 * am Tresen: **Muss beim Check-out noch etwas kassiert werden?**
 *
 * Drei Regeln, die aus dieser Frage folgen:
 *
 * 1. **Was keinen Preis trägt, steht nicht drauf.** Optionen ohne Preisangabe
 *    fallen weg, und eine Anfrage, die danach bei 0,00 € landet, fällt ganz
 *    weg. Damit ist auch „Wartung" erledigt, ohne dass es dafür ein eigenes
 *    Kennzeichen am Service bräuchte: Der technische Dienst hat keine
 *    bepreisten Optionen, also gibt es nichts zu prüfen.
 * 2. **Nur Erbrachtes zählt.** Offene und als „nicht erbracht" geschlossene
 *    Anfragen bleiben sichtbar — sonst verschwände eine Diskussion mit dem
 *    Gast einfach vom Blatt —, gehen aber nicht in die Summe ein.
 * 3. **Preise kommen aus dem Snapshot der Bestellung**, nie aus dem aktuellen
 *    Baukasten (siehe `items_snapshot`).
 */

/** Endzustände wie in `service_orders.status`. */
export type BillOrderStatus = 'open' | 'done' | 'cancelled'

/** Eine Zeile aus `items_snapshot` — Feldnamen bewusst wie in der DB. */
export type BillSnapshotItem = { label: string; price_cents?: number | null }

export type BillOrderInput = {
  id: string
  serviceName: string
  items: BillSnapshotItem[]
  note?: string | null
  status: BillOrderStatus
  createdAt: string
  /** `done_at` — Zeitpunkt des Abschlusses, egal in welche Richtung. */
  closedAt?: string | null
}

export type BillPosition = {
  id: string
  serviceName: string
  items: { label: string; priceCents: number }[]
  note: string | null
  status: BillOrderStatus
  createdAt: string
  closedAt: string | null
  totalCents: number
  /** Zählt in die Summe — ausschließlich erbrachte Leistungen. */
  counted: boolean
}

export type StayBill = {
  /** Nur kostenpflichtige Anfragen, aufsteigend nach Bestellzeitpunkt. */
  positions: BillPosition[]
  /** Summe der erbrachten Leistungen — der Betrag, um den es am Tresen geht. */
  totalCents: number
  /** Noch offene kostenpflichtige Anfragen (nicht in der Summe). */
  openCount: number
  openCents: number
  /** Als „nicht erbracht" geschlossene kostenpflichtige Anfragen. */
  notDoneCount: number
  /**
   * Offene Anfragen OHNE Preis — sie stehen auf keiner Aufstellung, werden vom
   * Check-out aber genauso geschlossen. Der Dialog nennt sie trotzdem: Ein
   * gemeldeter Defekt hört nicht auf zu existieren, weil der Gast abreist.
   */
  openFreeCount: number
  /** Gab es überhaupt etwas Kostenpflichtiges? Entscheidet Fall a) gegen b). */
  hasPositions: boolean
}

export function buildStayBill(orders: BillOrderInput[]): StayBill {
  const positions: BillPosition[] = []
  let openFreeCount = 0

  for (const order of orders ?? []) {
    const items = (order.items ?? [])
      .filter(i => typeof i?.price_cents === 'number' && Number.isFinite(i.price_cents))
      .map(i => ({ label: i.label, priceCents: i.price_cents as number }))
    const totalCents = items.reduce((sum, i) => sum + i.priceCents, 0)
    // Kostet nichts ⇒ nichts zu kassieren ⇒ nicht auf die Aufstellung.
    if (totalCents <= 0) {
      if (order.status === 'open') openFreeCount++
      continue
    }

    positions.push({
      id: order.id,
      serviceName: order.serviceName,
      items,
      note: order.note ?? null,
      status: order.status,
      createdAt: order.createdAt,
      closedAt: order.closedAt ?? null,
      totalCents,
      counted: order.status === 'done',
    })
  }

  positions.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const offen = positions.filter(p => p.status === 'open')

  return {
    positions,
    totalCents: positions.filter(p => p.counted).reduce((sum, p) => sum + p.totalCents, 0),
    openCount: offen.length,
    openCents: offen.reduce((sum, p) => sum + p.totalCents, 0),
    notDoneCount: positions.filter(p => p.status === 'cancelled').length,
    openFreeCount,
    hasPositions: positions.length > 0,
  }
}

/** Leere Aufstellung — für Zimmer ohne Aufenthalt, spart eine Fallunterscheidung. */
export const EMPTY_BILL: StayBill = {
  positions: [],
  totalCents: 0,
  openCount: 0,
  openCents: 0,
  notDoneCount: 0,
  openFreeCount: 0,
  hasPositions: false,
}
