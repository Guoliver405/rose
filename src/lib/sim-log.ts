/**
 * Ereignis-Protokoll eines Ablaufs (Simulator, 26.09.2026, Wunsch des Users):
 * statt ausgewählter Hinweise JEDES Ereignis mit Uhrzeit — was die Gäste tun,
 * was jede Kraft tut, wann das Haus einen Meilenstein erreicht. Für alle, die
 * nachvollziehen wollen, warum eine Zahl so herauskommt.
 *
 * Abgeleitet aus dem Szenario und den Abschnitten des Ablaufs, nichts von
 * Hand gesetzt. **Sachlich, ohne Wertung** (User, 26.09.2026): Das
 * Protokoll beschreibt, was geschieht; Einordnungen wie „auf der Papierliste
 * steht das nicht" bleiben den Hinweisen der Landing Page vorbehalten.
 * Gleiches Geschehen hat in beiden Bildern denselben Wortlaut. Reine
 * Rechnung ohne I/O.
 */

import { clockLabel, floorOf, maidLabel, type Scenario, type SimResult } from './cleaning-sim'

export type LogKind = 'house' | 'guest' | 'maid'

export type LogEntry = {
  /** Schichtminute. */
  at: number
  kind: LogKind
  /** Reinigungskraft (nur `maid`). */
  maid?: number
  /** Zimmer, soweit es um eines geht. */
  nr?: string
  text: string
}

const ORDER: Record<LogKind, number> = { house: 0, guest: 1, maid: 2 }
const floorName = (f: number) => `${f}. OG`

export function eventLog(res: SimResult, scn: Scenario): LogEntry[] {
  const P = scn.params
  const clock = (m: number) => clockLabel(m, P.shiftStart)
  const rose = res.coord === 'rose'
  const onDemand = res.policy === 'onDemand'
  const out: LogEntry[] = []
  const guest = (at: number, nr: string, text: string) => out.push({ at, kind: 'guest', nr, text: `${nr}: ${text}` })
  const house = (at: number, text: string) => out.push({ at, kind: 'house', text })

  // ── Gäste ────────────────────────────────────────────────────────────────
  for (const r of scn.rooms) {
    if (r.kind === 'departure') {
      guest(r.checkoutAt, r.nr, 'Gast checkt aus')
      continue
    }
    if (r.kind !== 'stay') continue
    if (r.presence === 'dnd') {
      guest(P.notBeforeSetAt, r.nr, rose ? '„Nicht stören“ im Portal, den ganzen Tag' : '„Nicht stören“ an der Tür, den ganzen Tag')
      continue
    }
    if (r.presence === 'declines') continue // zeigt sich erst beim Klopfen
    const shows = onDemand ? r.wants : r.signals
    if (r.dndUntil !== null) {
      guest(P.notBeforeSetAt, r.nr, rose ? '„Nicht stören“ im Portal' : '„Nicht stören“ an der Tür')
      guest(r.dndUntil, r.nr, `Gast geht, „Nicht stören“ aufgehoben${shows ? ', Reinigung gewünscht' : ''}`)
      continue
    }
    if (r.notBefore !== null) {
      if (rose) {
        guest(P.notBeforeSetAt, r.nr, `Gast gibt im Portal „Reinigung frühestens ab ${clock(r.notBefore)}“ an`)
        guest(r.outAt, r.nr, 'Gast verlässt das Zimmer')
      } else {
        guest(P.notBeforeSetAt, r.nr, `„Nicht stören“ an der Tür bis ${clock(r.notBefore)}`)
        guest(r.outAt, r.nr, 'Gast verlässt das Zimmer')
        guest(r.notBefore, r.nr, 'Schild auf „Bitte reinigen“ gewendet')
      }
      continue
    }
    guest(r.outAt, r.nr, shows
      ? (rose ? 'Gast geht, Reinigungswunsch im Portal' : 'Gast geht, Anhänger „Bitte reinigen“ an der Tür')
      : 'Gast verlässt das Zimmer')
  }
  const c = scn.complaint
  if (!rose && P.baseline.departures === 'radio') {
    for (const r of scn.rooms) {
      if (r.kind === 'departure') house(r.checkoutAt + P.duration.radioDelay, `Rezeption meldet per Funk: ${r.nr} abgereist`)
    }
  }
  if (c) {
    guest(c.at, c.nr, 'Sonderfall gemeldet')
    if (rose) house(c.at, `Rezeption priorisiert ${c.nr} auf dem Board`)
    else house(c.at + P.complaint.reachDelay, `Rezeption erreicht die zuständige Kraft für ${c.nr}`)
  }

  // ── Haus ─────────────────────────────────────────────────────────────────
  house(P.checkoutAt, 'Check-out-Frist')
  const ready = res.metrics.departuresReadyAt
  if (ready !== null) house(ready, 'Alle Abreisezimmer bezugsfertig')
  const late = scn.rooms.filter(r => r.kind === 'departure' && !((res.doneAt[r.nr] ?? Infinity) <= P.checkinAt)).length
  house(P.checkinAt, late > 0 ? `Check-in beginnt – ${late} Abreisezimmer noch nicht fertig` : 'Check-in beginnt – alle Abreisezimmer fertig')

  // ── Kräfte ───────────────────────────────────────────────────────────────
  const kindOf = new Map(scn.rooms.map(r => [r.nr, r.kind]))
  const lastFloor = new Map<number, number>()
  const lastEnd = new Map<number, number>()
  for (const g of res.segments) {
    const who = `Kraft ${maidLabel(g.maid)}`
    const maid = (text: string, at = g.start, nr = g.nr || undefined) => out.push({ at, kind: 'maid', maid: g.maid, nr, text: `${who} ${text}` })
    if (g.kind !== 'idle') lastEnd.set(g.maid, g.end)
    const floor = g.nr ? floorOf(g.nr) : undefined
    switch (g.kind) {
      case 'walk': {
        const prev = lastFloor.get(g.maid)
        if (floor !== undefined && prev !== floor) {
          maid(prev === undefined
            ? `beginnt auf der ${floorName(floor)}`
            : `wechselt in die ${floorName(floor)}${g.pulledFrom !== undefined ? ` (Board empfiehlt die Etage wegen offener Abreisen)` : ''}`)
        }
        break
      }
      case 'patrol': maid(`geht die ${floorName(floor!)} ab (Anhänger prüfen)`); break
      case 'overview': maid(`liest die Etagenliste der ${floorName(floor!)}`); break
      case 'radio': maid(g.jobId ? `nimmt Funkspruch der Rezeption an: ${g.jobId} abgereist` : 'meldet per Funk den Etagenwechsel', g.start, g.jobId ?? (g.nr || undefined)); break
      case 'knock': maid(`klopft bei ${g.nr} – Gast noch im Zimmer, später erneut`); break
      case 'declined': maid(`klopft bei ${g.nr} – Gast lehnt Reinigung für heute ab`); break
      case 'skip': maid(`an ${g.nr}: „Nicht stören“, später erneut`); break
      case 'clean': {
        const what = g.jobId?.endsWith('!') ? 'Sonderfall' : kindOf.get(g.nr) === 'departure' ? 'Abreise' : 'Bleibe'
        maid(`reinigt ${g.nr} (${what}), fertig ${clock(g.end)}`)
        break
      }
      case 'idle': if (g.end - g.start >= 5) maid(`wartet bis ${clock(g.end)}`); break
    }
    if (floor !== undefined && g.kind !== 'idle') lastFloor.set(g.maid, floor)
  }
  for (const [m, end] of lastEnd) {
    out.push({ at: end, kind: 'maid', maid: m, text: `Kraft ${maidLabel(m)} ist fertig` })
  }

  return out
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.at - b.e.at || ORDER[a.e.kind] - ORDER[b.e.kind] || (a.e.maid ?? 0) - (b.e.maid ?? 0) || a.i - b.i)
    .map(x => x.e)
}

/** Filter der Oberfläche: Kraft („A", „Kraft B"), Etage („3", „10") oder genau ein Zimmer („305", „1004"). */
export function filterLog(entries: LogEntry[], query: string): LogEntry[] {
  const q = query.trim().toLowerCase().replace(/^kraft\s+/, '')
  if (!q) return entries
  if (/^\d{1,2}$/.test(q)) return entries.filter(e => e.nr !== undefined && floorOf(e.nr) === Number(q))
  if (/^\d+$/.test(q)) return entries.filter(e => e.nr === q)
  return entries.filter(e => e.maid !== undefined && maidLabel(e.maid).toLowerCase() === q)
}
