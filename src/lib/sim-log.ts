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

import { clockLabel, floorOf, maidLabel, toldBefore, type Scenario, type SimResult } from './cleaning-sim'
import { format, plural, type PluralForms } from './i18n/format'

/**
 * Texte des Protokolls — Abschnitt `simulator.app.day.log` der Sprachdatei,
 * als Parameter (läuft im Browser, importiert keine Sprachdatei).
 */
export type SimLogTexts = {
  floor: string
  maid: string
  filterPrefix: string
  guestLine: string
  guest: {
    checksOut: string
    dndAllDayPortal: string
    dndAllDayDoor: string
    dndPortal: string
    dndDoor: string
    dndLifted: string
    dndLiftedWants: string
    notBeforePortal: string
    dndUntil: string
    signTurned: string
    leaves: string
    leavesWantsPortal: string
    leavesWantsDoor: string
    complaint: string
  }
  house: {
    radioDeparture: string
    complaintRose: string
    complaintReach: string
    checkoutDeadline: string
    departuresReady: string
    checkinLate: PluralForms
    checkinReady: string
  }
  maids: {
    starts: string
    switches: string
    switchesPulled: string
    patrol: string
    overview: string
    radioReceive: string
    radioAnnounce: string
    radioListen: PluralForms
    knockAgain: string
    knock: string
    declinedAgain: string
    declined: string
    skip: string
    clean: string
    cleanKind: { complaint: string; departure: string; stay: string }
    idle: string
    finished: string
  }
}

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
export function eventLog(res: SimResult, scn: Scenario, tx: SimLogTexts, intlLocale: string): LogEntry[] {
  const floorName = (f: number) => format(tx.floor, { n: f })
  const kraft = (i: number) => format(tx.maid, { name: maidLabel(i) })
  const G = tx.guest
  const H = tx.house
  const M = tx.maids
  const P = scn.params
  const clock = (m: number) => clockLabel(m, P.shiftStart)
  const rose = res.coord === 'rose'
  const onDemand = res.policy === 'onDemand'
  const out: LogEntry[] = []
  const guest = (at: number, nr: string, text: string) => out.push({ at, kind: 'guest', nr, text: format(tx.guestLine, { nr, text }) })
  const house = (at: number, text: string) => out.push({ at, kind: 'house', text })

  // ── Gäste ────────────────────────────────────────────────────────────────
  for (const r of scn.rooms) {
    if (r.kind === 'departure') {
      guest(r.checkoutAt, r.nr, G.checksOut)
      continue
    }
    if (r.kind !== 'stay') continue
    if (r.presence === 'dnd') {
      guest(P.notBeforeSetAt, r.nr, rose ? G.dndAllDayPortal : G.dndAllDayDoor)
      continue
    }
    if (r.presence === 'declines') continue // zeigt sich erst beim Klopfen
    const shows = onDemand ? r.wants : r.signals
    if (r.dndUntil !== null) {
      guest(P.notBeforeSetAt, r.nr, rose ? G.dndPortal : G.dndDoor)
      guest(r.dndUntil, r.nr, shows ? G.dndLiftedWants : G.dndLifted)
      continue
    }
    if (r.notBefore !== null) {
      if (rose) {
        guest(P.notBeforeSetAt, r.nr, format(G.notBeforePortal, { time: clock(r.notBefore) }))
        guest(r.outAt, r.nr, G.leaves)
      } else {
        guest(P.notBeforeSetAt, r.nr, format(G.dndUntil, { time: clock(r.notBefore) }))
        guest(r.outAt, r.nr, G.leaves)
        guest(r.notBefore, r.nr, G.signTurned)
      }
      continue
    }
    guest(r.outAt, r.nr, shows
      ? (rose ? G.leavesWantsPortal : G.leavesWantsDoor)
      : G.leaves)
  }
  const c = scn.complaint
  if (!rose && P.baseline.departures === 'radio') {
    for (const r of scn.rooms) {
      if (r.kind === 'departure') house(r.checkoutAt + P.duration.radioDelay, format(H.radioDeparture, { nr: r.nr }))
    }
  }
  if (c) {
    guest(c.at, c.nr, G.complaint)
    if (rose) house(c.at, format(H.complaintRose, { nr: c.nr }))
    else house(c.at + P.complaint.reachDelay, format(H.complaintReach, { nr: c.nr }))
  }

  // ── Haus ─────────────────────────────────────────────────────────────────
  house(P.checkoutAt, H.checkoutDeadline)
  const ready = res.metrics.departuresReadyAt
  if (ready !== null) house(ready, H.departuresReady)
  const late = scn.rooms.filter(r => r.kind === 'departure' && !((res.doneAt[r.nr] ?? Infinity) <= P.checkinAt)).length
  house(P.checkinAt, late > 0 ? plural(intlLocale, late, H.checkinLate) : H.checkinReady)

  // ── Kräfte ───────────────────────────────────────────────────────────────
  const kindOf = new Map(scn.rooms.map(r => [r.nr, r.kind]))
  const lastFloor = new Map<number, number>()
  const lastEnd = new Map<number, number>()
  for (const g of res.segments) {
    const who = kraft(g.maid)
    const maid = (text: string, at = g.start, nr = g.nr || undefined) => out.push({ at, kind: 'maid', maid: g.maid, nr, text })
    if (g.kind !== 'idle') lastEnd.set(g.maid, g.end)
    const floor = g.nr ? floorOf(g.nr) : undefined
    switch (g.kind) {
      case 'walk': {
        const prev = lastFloor.get(g.maid)
        if (floor !== undefined && prev !== floor) {
          maid(prev === undefined
            ? format(M.starts, { who, floor: floorName(floor) })
            : format(g.pulledFrom !== undefined ? M.switchesPulled : M.switches, { who, floor: floorName(floor) }))
        }
        break
      }
      case 'patrol': maid(format(M.patrol, { who, floor: floorName(floor!) })); break
      case 'overview': maid(format(M.overview, { who, floor: floorName(floor!) })); break
      case 'radio':
        if (g.radio === 'receive') maid(format(M.radioReceive, { who, nr: g.jobId ?? '' }), g.start, g.jobId)
        else if (g.radio === 'announce') maid(format(M.radioAnnounce, { who, floor: floorName(floor!) }))
        else maid(plural(intlLocale, g.count ?? 0, M.radioListen, { who }), g.start, undefined)
        break
      case 'knock': {
        const told = toldBefore(res, g)
        maid(told
          ? format(M.knockAgain, { who, nr: g.nr, teller: kraft(told.maid), time: clock(told.end) })
          : format(M.knock, { who, nr: g.nr }))
        break
      }
      case 'declined': {
        const told = toldBefore(res, g)
        maid(told
          ? format(M.declinedAgain, { who, nr: g.nr, teller: kraft(told.maid), time: clock(told.end) })
          : format(M.declined, { who, nr: g.nr }))
        break
      }
      case 'skip': maid(format(M.skip, { who, nr: g.nr })); break
      case 'clean': {
        const what = g.jobId?.endsWith('!') ? M.cleanKind.complaint : kindOf.get(g.nr) === 'departure' ? M.cleanKind.departure : M.cleanKind.stay
        maid(format(M.clean, { who, nr: g.nr, what, time: clock(g.end) }))
        break
      }
      case 'idle': if (g.end - g.start >= 5) maid(format(M.idle, { who, time: clock(g.end) })); break
    }
    if (floor !== undefined && g.kind !== 'idle') lastFloor.set(g.maid, floor)
  }
  for (const [m, end] of lastEnd) {
    out.push({ at: end, kind: 'maid', maid: m, text: format(M.finished, { who: kraft(m) }) })
  }

  return out
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.at - b.e.at || ORDER[a.e.kind] - ORDER[b.e.kind] || (a.e.maid ?? 0) - (b.e.maid ?? 0) || a.i - b.i)
    .map(x => x.e)
}

/**
 * Filter der Oberfläche: Kraft („A", „Kraft B"), Etage („3", „10") oder genau
 * ein Zimmer („305", „1004"). `maidPrefix` ist das Wort vor dem Buchstaben
 * (`log.filterPrefix` der Sprachdatei), es fällt weg.
 */
export function filterLog(entries: LogEntry[], query: string, maidPrefix: string): LogEntry[] {
  const prefix = maidPrefix.trim().toLowerCase()
  let q = query.trim().toLowerCase()
  if (prefix && q.startsWith(prefix) && /^\s/.test(q.slice(prefix.length))) q = q.slice(prefix.length).trim()
  if (!q) return entries
  if (/^\d{1,2}$/.test(q)) return entries.filter(e => e.nr !== undefined && floorOf(e.nr) === Number(q))
  if (/^\d+$/.test(q)) return entries.filter(e => e.nr === q)
  return entries.filter(e => e.maid !== undefined && maidLabel(e.maid).toLowerCase() === q)
}
