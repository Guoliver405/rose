/**
 * Reinigungs-Simulation für die Landing Page (25./26.09.2026, Abschnitt #vergleich).
 *
 * Ein Tag, zwei Bilder, EIN Szenario: dieselben Abreisen, dieselben
 * Bleibegäste, dieselben Reinigungskräfte. Die Bilder unterscheiden sich nur
 * in der KOORDINATION — was die Kräfte wissen und wonach sie wählen:
 *
 *  paper — ohne Software. Das Haus ist fest aufgeteilt (je Kraft zwei Etagen).
 *          Die Abreise- und Bleibeliste vom Morgen liegt vor — welche Zimmer
 *          abreisen, weiß die Kraft, aber nicht, WANN der Gast auscheckt:
 *          Abreisen reinigt sie deshalb erst ab der Check-out-Frist. Ist in
 *          ihrem Bereich nichts mehr zu erwarten, hilft sie anderswo aus — mit
 *          ihrem eigenen Wissen. Türschilder sieht sie.
 *  rose  — mit RoSe, gemeinsames Board. Abreisen erscheinen live beim
 *          Check-out — wer um 9:30 auscheckt, ist um 9:30 auf dem Board, auf
 *          der Papierliste erst zur Frist. Die Etage wählt jede Kraft nach dem
 *          Etagenscore (Gewichte aus `board.ts`, geteilt durch Kräfte vor Ort + 1
 *          wie auf dem Board). Ablehnungen an der Tür merkt sich das Board für
 *          alle Kräfte.
 *
 * Die REINIGUNGSPOLITIK ist ein Umschalter, der für BEIDE Bilder gilt (User,
 * 26.09.2026) — sonst vergliche das Bild Politik und Koordination zugleich:
 *
 *  routine  — Bleibezimmer täglich. Ohne Software ab Schichtbeginn laut Liste
 *             (die Kraft klopft, auch wenn die meisten Gäste noch da sind), mit
 *             RoSe ab der Routine-Zeit 9:00 — der Verbleib ist über das beim
 *             Check-in eingetragene Abreisedatum sicher (`isKnownStayover`).
 *             Wer im Zimmer bleibt und nichts will, sagt es an der Tür.
 *  onDemand — nur auf Wunsch. Mit RoSe tippt der Gast beim Gehen „Zimmer
 *             reinigen" und das Zimmer steht sofort auf dem Board. Ohne Software
 *             hängt er den Türanhänger „Bitte reinigen" raus — den sieht eine
 *             Kraft erst, wenn sie auf dieser Etage ist. Hat sie nichts zu tun,
 *             geht sie ihre Etagen ab.
 *
 * Vorab vollständig durchgerechnet: die Oberfläche zeichnet nur den Zustand
 * zu einem Zeitpunkt, beide Bilder laufen dadurch garantiert synchron.
 * Reine Rechenlogik ohne I/O.
 */

import { SCORE_WEIGHTS } from './board'
import { ROI_DEFAULTS } from './roi'

export type Coordination = 'paper' | 'rose'
export type Policy = 'routine' | 'onDemand'

/** Minuten nach Schichtbeginn (8:00). */
export const SIM_START_HOUR = 8

/** Check-out-Frist 11:00. Ab dann ist ohne Software jede Abreise sicher frei. */
export const CHECKOUT_AT = 180

/** Check-in ab 15:00 — bis dahin sollten die Abreisezimmer bezugsfertig sein. */
export const CHECKIN_AT = 420

/**
 * Ab wann Bleibezimmer bei täglicher Reinigung dran sind. Ohne Software sagt
 * die Papierliste, wer bleibt — die Kraft beginnt mit Schichtbeginn und
 * klopft, auch wenn um 8:00 die meisten Gäste noch im Zimmer sind (sie hat vor
 * 11:00 sonst nichts zu tun). Mit RoSe legt das Haus die Routine auf 9:00: Die
 * erste Stunde kommen die Abreisen live aufs Board, danach ist das Klopfen
 * seltener umsonst.
 */
export const STAY_ROUTINE_AT = { paper: 0, rose: 60 } as const

/**
 * Sonderfall: ein Gast meldet mittags ein Problem in seinem bereits
 * gereinigten Zimmer (Handtücher fehlen, etwas verschüttet …). Ohne Software
 * muss die Rezeption die zuständige Kraft erst erreichen — anrufen, suchen;
 * mit RoSe priorisiert sie mit einem Klick.
 */
export const COMPLAINT = { at: 300, reachDelay: 20 } as const

export const DURATION = {
  complaint: 15,
  departure: 30,
  stay: ROI_DEFAULTS.stayoverMinutes,
  /** Klopfen, warten, kurzer Wortwechsel. */
  knock: 3,
  /** Nach einem Klopfen bei anwesendem Gast frühestens so viel später wieder. */
  retry: 30,
  walkRoom: 1,
  /** Mit Wäschewagen und Aufzug. */
  walkFloor: 5,
} as const

/**
 * Bleibegast:
 *  out      — verlässt das Zimmer um `outAt`
 *  dnd      — Türschild „Bitte nicht stören" den ganzen Tag
 *  declines — bleibt im Zimmer und will keine Reinigung und sagt es an der
 *             Tür; auf Wunsch fordert er schlicht nichts an
 * `wants` zählt nur bei `out`: fordert er beim Gehen Reinigung an?
 */
export type Stay =
  | { presence: 'out'; outAt: number; wants: boolean }
  | { presence: 'dnd' }
  | { presence: 'declines' }

export type SimRoom =
  | { nr: string; floor: number; kind: 'empty' }
  | { nr: string; floor: number; kind: 'departure'; checkoutAt: number }
  | ({ nr: string; floor: number; kind: 'stay' } & Stay)

export type Scenario = {
  /** Sonderfall: Zimmer und Zeitpunkt der Meldung. */
  complaint: { nr: string; at: number } | null
  floors: number
  roomsPerFloor: number
  /** Etagen je Reinigungskraft ohne Software (feste Aufteilung). */
  maidFloors: number[][]
  rooms: SimRoom[]
}

/** Zimmernummer → Etage („305" → 3, „1004" → 10). */
export const floorOf = (nr: string) => Math.floor(Number(nr) / 100)

/** Deterministischer Zufall (mulberry32) — jeder Besucher sieht denselben Tag. */
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Belegung von 100 Zimmern. */
export const MIX = {
  departure: 25,
  empty: 17,
  dnd: 5,
  /** Im Zimmer, will keine Reinigung — 5 von 53 ≈ 10 % („vorsichtig" im Nutzenrechner). */
  declines: 5,
  /** Unterwegs und will Reinigung. */
  outWants: 42,
  /** Unterwegs, bräuchte keine — mit den `declines` 11 von 53 ≈ 20 % („typisch"). */
  outNoRequest: 6,
} as const

export const FLOORS = 10
export const ROOMS_PER_FLOOR = 10
/** Fünf Kräfte, ohne Software je zwei Etagen. */
export const MAIDS = 5

/**
 * 10 Etagen × 10 Zimmer, fünf Reinigungskräfte ab 8:00. Belegung aus `MIX`,
 * zufällig verteilt. Check-outs zwischen 9:00 und 11:00 (gehäuft gegen Ende),
 * Bleibegäste gehen zwischen 9:00 und 10:40.
 */
export function buildScenario(seed: number): Scenario {
  const rand = rng(seed)
  const kinds: (keyof typeof MIX)[] = []
  for (const [k, n] of Object.entries(MIX) as [keyof typeof MIX, number][]) {
    for (let i = 0; i < n; i++) kinds.push(k)
  }
  // Fisher-Yates
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[kinds[i], kinds[j]] = [kinds[j], kinds[i]]
  }
  const five = (v: number) => Math.round(v / 5) * 5
  const rooms: SimRoom[] = kinds.map((k, i) => {
    const floor = Math.floor(i / ROOMS_PER_FLOOR) + 1
    const nr = `${floor}${String((i % ROOMS_PER_FLOOR) + 1).padStart(2, '0')}`
    switch (k) {
      case 'departure': return { nr, floor, kind: 'departure', checkoutAt: 60 + five(120 * Math.sqrt(rand())) }
      case 'empty': return { nr, floor, kind: 'empty' }
      case 'dnd': return { nr, floor, kind: 'stay', presence: 'dnd' }
      case 'declines': return { nr, floor, kind: 'stay', presence: 'declines' }
      case 'outWants': return { nr, floor, kind: 'stay', presence: 'out', outAt: 60 + five(100 * rand()), wants: true }
      case 'outNoRequest': return { nr, floor, kind: 'stay', presence: 'out', outAt: 60 + five(100 * rand()), wants: false }
    }
  })
  const per = FLOORS / MAIDS
  const maidFloors = Array.from({ length: MAIDS }, (_, i) => Array.from({ length: per }, (_, k) => i * per + k + 1))
  const base: Scenario = { complaint: null, floors: FLOORS, roomsPerFloor: ROOMS_PER_FLOOR, maidFloors, rooms }
  // Sonderfall: ein Zimmer, das zur Meldung in ALLEN vier Abläufen schon
  // gereinigt ist — sonst hätte eine Seite einen Vorsprung, weil sie das
  // Zimmer ohnehin erst noch reinigt. Bevorzugt im oberen Bereich.
  const runs = ALL_RUNS.map(([c, p]) => simulate(c, p, base))
  const half = FLOORS / 2
  const cleanedEverywhere = rooms
    .filter(r => runs.every(res => res.doneAt[r.nr] !== undefined && res.doneAt[r.nr] <= COMPLAINT.at - 10))
    .sort((a, b) => Number(b.floor > half) - Number(a.floor > half) || a.nr.localeCompare(b.nr))
  const target = cleanedEverywhere[0]
  return { ...base, complaint: target ? { nr: target.nr, at: COMPLAINT.at } : null }
}

export const ALL_RUNS: [Coordination, Policy][] = [
  ['paper', 'routine'], ['rose', 'routine'], ['paper', 'onDemand'], ['rose', 'onDemand'],
]

type Job = {
  /** Zimmernummer, beim Sonderfall mit „!" — er steht neben der Reinigung. */
  id: string
  nr: string
  floor: number
  kind: 'departure' | 'stay' | 'complaint'
  /** Ab wann das Zimmer frei ist (Infinity = nie). */
  readyAt: number
  /** Ab wann die Kraft von dem Auftrag wissen KANN (Liste, Board, Anhänger). */
  knownAt: number
  /** Türanhänger: erst sichtbar, wenn eine Kraft auf der Etage ist. */
  hanger: boolean
  /** Gast bleibt im Zimmer und lehnt an der Tür ab. */
  declines: boolean
  duration: number
  weight: number
}

function jobsFor(scn: Scenario, coord: Coordination, policy: Policy): Job[] {
  const jobs: Job[] = []
  for (const r of scn.rooms) {
    const base = { id: r.nr, nr: r.nr, floor: r.floor, hanger: false }
    if (r.kind === 'departure') {
      jobs.push({ ...base, kind: 'departure', readyAt: r.checkoutAt, declines: false,
        // Ohne Software: sicher frei erst zur Frist. Mit RoSe: erscheint beim Check-out.
        knownAt: coord === 'paper' ? Math.max(CHECKOUT_AT, r.checkoutAt) : r.checkoutAt,
        duration: DURATION.departure, weight: SCORE_WEIGHTS.checkoutPending })
    } else if (r.kind === 'stay') {
      if (r.presence === 'dnd') continue // Türschild sieht jede Strategie
      if (policy === 'routine') {
        jobs.push({ ...base, kind: 'stay', readyAt: r.presence === 'out' ? r.outAt : Infinity,
          knownAt: STAY_ROUTINE_AT[coord], declines: r.presence === 'declines',
          duration: DURATION.stay, weight: SCORE_WEIGHTS.pleaseClean })
      } else {
        // Auf Wunsch: nur wer beim Gehen anfordert — per Tipp oder Türanhänger.
        if (r.presence !== 'out' || !r.wants) continue
        jobs.push({ ...base, kind: 'stay', readyAt: r.outAt, knownAt: r.outAt, hanger: coord === 'paper',
          declines: false, duration: DURATION.stay, weight: SCORE_WEIGHTS.pleaseClean })
      }
    }
  }
  const c = scn.complaint
  if (c) {
    jobs.push({ id: `${c.nr}!`, nr: c.nr, floor: floorOf(c.nr), kind: 'complaint', readyAt: c.at, declines: false, hanger: false,
      knownAt: coord === 'paper' ? c.at + COMPLAINT.reachDelay : c.at,
      duration: DURATION.complaint, weight: SCORE_WEIGHTS.priority })
  }
  return jobs
}

export type Segment = {
  /** Index der Reinigungskraft. */
  maid: number
  /** knock = Gast noch da, declined = Gast lehnt ab, patrol = Etagen abgehen. */
  kind: 'walk' | 'patrol' | 'knock' | 'declined' | 'clean' | 'idle'
  /** Zimmer, an dem die Kraft am Ende des Abschnitts steht. */
  nr: string
  /** Auftrag (bei clean/knock/declined). */
  jobId?: string
  /** declined: eine andere Kraft hatte hier schon eine Ablehnung erfahren. */
  again?: boolean
  start: number
  end: number
}

export type SimResult = {
  coord: Coordination
  policy: Policy
  maids: number
  /** Je Kraft zeitlich geordnet, alle Kräfte hintereinander. */
  segments: Segment[]
  /** Fertigstellung je Auftrag (Zimmernummer, Sonderfall mit „!"). */
  doneAt: Record<string, number>
  /** Wann der Gast an der Tür abgelehnt hat. */
  declinedAt: Record<string, number>
  /** Türanhänger: wann ihn die erste Kraft gesehen hat. */
  noticedAt: Record<string, number>
  metrics: {
    cleaned: number
    /** Geklopft, Gast noch da — später wieder. */
    knocks: number
    /** Geklopft, Gast lehnt ab. */
    declined: number
    /** Minuten ohne Arbeit, weil nichts frei war (alle Kräfte). */
    idleMinutes: number
    /** Letzte Abreise bezugsfertig. */
    departuresReadyAt: number | null
    /** Sonderfall erledigt. */
    complaintDoneAt: number | null
    /** Die letzte Kraft ist fertig. */
    finishedAt: number
  }
}

/** Obergrenze, damit ein nie frei werdendes Zimmer den Lauf nicht festhält. */
const HORIZON = 10 * 60

type Pos = { floor: number; nr: string } | null

function walkTime(from: Pos, floor: number, nr: string): number {
  if (!from) return floor === 1 ? DURATION.walkRoom : DURATION.walkFloor
  if (from.nr === nr) return 0
  return from.floor === floor ? DURATION.walkRoom : DURATION.walkFloor
}

export function simulate(coord: Coordination, policy: Policy, scn: Scenario = SCENARIO): SimResult {
  const jobs = jobsFor(scn, coord, policy)
  const maids = scn.maidFloors.map((floors, i) => ({
    i,
    t: 0,
    pos: null as Pos,
    /** Ohne Software: nur die eigenen Etagen. */
    floors: coord === 'paper' ? new Set(floors) : null,
    own: floors,
    /** Ohne Software: die laufende Runde. */
    queue: [] as Job[],
    finished: false,
  }))
  const segments: Segment[] = []
  const doneAt: Record<string, number> = {}
  const declinedAt: Record<string, number> = {}
  const noticedAt: Record<string, number> = {}
  /** Türanhänger: welche Kraft ihn gesehen hat. */
  const seenBy: Record<string, Set<number>> = {}
  /**
   * Wer von einer Ablehnung weiß. Ohne Software nur die Kraft, die geklopft
   * hat; mit RoSe steht es auf dem Board und damit bei allen.
   */
  const declinedFor: Record<string, Set<number>> = {}
  /** Nach einem Klopfen bei anwesendem Gast: nicht vor diesem Zeitpunkt wieder. */
  const retryAt: Record<string, number> = {}
  let knocks = 0
  let declined = 0

  // Ein Auftrag gilt als vergeben, sobald eine Kraft ihn übernommen hat —
  // die Schleife läuft in Zeitreihenfolge, deshalb ist das race-frei.
  const open = (maid: number) => jobs.filter(j => doneAt[j.id] === undefined && !declinedFor[j.id]?.has(maid))

  for (;;) {
    const m = maids.filter(x => !x.finished).sort((a, b) => a.t - b.t || a.i - b.i)[0]
    if (!m || m.t >= HORIZON) break
    const t = m.t
    // Wer auf einer Etage steht, sieht die Türanhänger dort.
    if (m.pos) {
      for (const j of jobs) {
        if (j.hanger && j.floor === m.pos.floor && j.knownAt <= t && doneAt[j.id] === undefined) {
          ;(seenBy[j.id] ??= new Set()).add(m.i)
          noticedAt[j.id] ??= t
        }
      }
    }
    // Ohne Software: eigener Bereich; ist dort nichts mehr zu erwarten, hilft
    // die Kraft anderswo aus — mit ihrem eigenen Wissen.
    const helping = !!m.floors && !open(m.i).some(j => m.floors!.has(j.floor))
    const mine = (j: Job) => !m.floors || helping || m.floors.has(j.floor)
    const visible = (j: Job) => mine(j) && j.knownAt <= t && (retryAt[j.id] ?? 0) <= t
      && (!j.hanger || !!seenBy[j.id]?.has(m.i))

    let pick: Job | undefined
    const urgent = open(m.i).filter(j => j.kind === 'complaint' && visible(j))
    if (urgent.length > 0) {
      // Sonderfall geht vor — sobald die Kraft davon weiß.
      pick = urgent[0]
    } else if (coord === 'paper') {
      m.queue = m.queue.filter(j => open(m.i).includes(j) && visible(j))
      if (m.queue.length === 0) m.queue = open(m.i).filter(visible).sort((a, b) => a.floor - b.floor || a.nr.localeCompare(b.nr))
      pick = m.queue.shift()
    } else {
      const avail = open(m.i).filter(visible)
      if (avail.length > 0) {
        const byUrgency = (a: Job, b: Job) => b.weight - a.weight || a.nr.localeCompare(b.nr)
        const here = m.pos ? avail.filter(j => j.floor === m.pos!.floor) : []
        if (here.length > 0) {
          pick = here.sort(byUrgency)[0]
        } else {
          // Etagenscore ÷ (Kolleginnen vor Ort + 1), bei Gleichstand die untere Etage.
          const score = new Map<number, number>()
          for (const j of avail) score.set(j.floor, (score.get(j.floor) ?? 0) + j.weight)
          const crowd = (f: number) => maids.filter(o => o !== m && !o.finished && o.pos?.floor === f).length
          const floor = [...score.entries()]
            .map(([f, s]) => [f, s / (crowd(f) + 1)] as const)
            .sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
          pick = avail.filter(j => j.floor === floor).sort(byUrgency)[0]
        }
      }
    }

    if (!pick) {
      // Ohne Software und auf Wunsch: Hängt irgendwo schon ein Anhänger, den
      // diese Kraft noch nicht gesehen hat, geht sie ihre Etagen ab — sie weiß
      // nicht, wo er hängt, also der Reihe nach.
      const unseen = open(m.i).filter(j => j.hanger && mine(j) && j.knownAt <= t && !seenBy[j.id]?.has(m.i))
      if (unseen.length > 0) {
        const range = helping ? Array.from({ length: scn.floors }, (_, k) => k + 1) : m.own
        const cur = m.pos?.floor ?? 0
        const nextFloor = range.find(f => f > cur) ?? range[0]
        const nr = `${nextFloor}01`
        const w = walkTime(m.pos, nextFloor, nr)
        segments.push({ maid: m.i, kind: 'patrol', nr, start: t, end: t + w })
        m.pos = { floor: nextFloor, nr }
        m.t = t + w
        continue
      }
      // Warten, bis sich für diese Kraft etwas tun könnte.
      const next = Math.min(...open(m.i).filter(mine).map(j => Math.max(j.knownAt, retryAt[j.id] ?? 0)).filter(v => v > t))
      if (!Number.isFinite(next) || next >= HORIZON) {
        m.finished = true
        continue
      }
      segments.push({ maid: m.i, kind: 'idle', nr: m.pos?.nr ?? '', start: t, end: next })
      m.t = next
      continue
    }

    // Hingehen, klopfen — reinigen, später wiederkommen oder streichen.
    let now = t
    const w = walkTime(m.pos, pick.floor, pick.nr)
    if (w > 0) segments.push({ maid: m.i, kind: 'walk', nr: pick.nr, start: now, end: now + w })
    now += w
    m.pos = { floor: pick.floor, nr: pick.nr }
    if (pick.declines) {
      const again = declinedAt[pick.id] !== undefined
      segments.push({ maid: m.i, kind: 'declined', nr: pick.nr, jobId: pick.id, again, start: now, end: now + DURATION.knock })
      now += DURATION.knock
      declinedAt[pick.id] ??= now
      const knowers = (declinedFor[pick.id] ??= new Set())
      if (coord === 'paper') knowers.add(m.i)
      else maids.forEach(o => knowers.add(o.i))
      declined++
    } else if (pick.readyAt > now) {
      segments.push({ maid: m.i, kind: 'knock', nr: pick.nr, jobId: pick.id, start: now, end: now + DURATION.knock })
      now += DURATION.knock
      retryAt[pick.id] = now + DURATION.retry
      knocks++
    } else {
      segments.push({ maid: m.i, kind: 'clean', nr: pick.nr, jobId: pick.id, start: now, end: now + pick.duration })
      now += pick.duration
      doneAt[pick.id] = now
    }
    m.t = now
  }

  segments.sort((a, b) => a.maid - b.maid || a.start - b.start)
  const cleanSegs = segments.filter(g => g.kind === 'clean')
  const deps = jobs.filter(j => j.kind === 'departure')
  const depsDone = deps.every(j => doneAt[j.id] !== undefined)
  const complaintJob = jobs.find(j => j.kind === 'complaint')
  const work = segments.filter(g => g.kind !== 'idle')
  return {
    coord,
    policy,
    maids: maids.length,
    segments,
    doneAt,
    declinedAt,
    noticedAt,
    metrics: {
      cleaned: cleanSegs.length,
      knocks,
      declined,
      idleMinutes: segments.filter(g => g.kind === 'idle').reduce((sum, g) => sum + g.end - g.start, 0),
      departuresReadyAt: depsDone ? Math.max(...deps.map(j => doneAt[j.id])) : null,
      complaintDoneAt: complaintJob ? doneAt[complaintJob.id] ?? null : null,
      finishedAt: Math.max(0, ...work.map(g => g.end)),
    },
  }
}

// ── Der gezeigte Tag ──────────────────────────────────────────────────────

/** So viele Tage werden für den mittleren Tag durchgerechnet. */
export const TYPICAL_DAYS = 101

/**
 * Der mittlere Tag: Für jeden Startwert zählt der Vorsprung von RoSe bei den
 * Abreisen, in beiden Stellungen des Umschalters. Gewählt wird der Tag, der
 * in beiden Rangfolgen am nächsten an der Mitte liegt. So darf die Seite „ein
 * gewöhnlicher Tag" sagen — der Tag ist gerechnet, nicht ausgesucht
 * (Entscheidung 26.09.2026; vorher war er zugunsten von RoSe gewählt).
 */
export function typicalSeed(days = TYPICAL_DAYS): number {
  const lead = (scn: Scenario, p: Policy) => {
    const at = (c: Coordination) => simulate(c, p, scn).metrics.departuresReadyAt ?? HORIZON
    return at('paper') - at('rose')
  }
  const rows = Array.from({ length: days }, (_, i) => {
    const scn = buildScenario(i + 1)
    return { seed: i + 1, routine: lead(scn, 'routine'), onDemand: lead(scn, 'onDemand') }
  })
  const rank = (key: 'routine' | 'onDemand') => {
    const order = [...rows].sort((a, b) => a[key] - b[key] || a.seed - b.seed)
    return new Map(order.map((r, i) => [r.seed, i]))
  }
  const [r1, r2] = [rank('routine'), rank('onDemand')]
  const mid = (days - 1) / 2
  const dist = (s: number) => Math.abs(r1.get(s)! - mid) + Math.abs(r2.get(s)! - mid)
  return [...rows].sort((a, b) => dist(a.seed) - dist(b.seed) || a.seed - b.seed)[0].seed
}

/** Ergebnis von `typicalSeed()` — der Test hält fest, dass beides übereinstimmt. */
export const SCENARIO_SEED = 64
export const SCENARIO: Scenario = buildScenario(SCENARIO_SEED)

// ── Zustand zu einem Zeitpunkt (für die Anzeige) ──────────────────────────

export type TileState =
  | 'empty'      // leer, nichts zu tun
  | 'occupied'   // Gast da / noch nicht ausgecheckt
  | 'dnd'
  | 'skipped'    // keine Reinigung angefordert (nur auf Wunsch)
  | 'declined'   // Gast hat an der Tür abgelehnt
  | 'departed'   // ausgecheckt, wartet auf Reinigung
  | 'wants'      // Gast weg, Reinigung offen
  | 'cleaning'
  | 'done'

export type Tile = { nr: string; floor: number; state: TileState; knock: 'present' | 'declined' | null; priority: boolean }

export function tilesAt(res: SimResult, t: number, scn: Scenario = SCENARIO): Tile[] {
  const current = res.segments.filter(g => g.start <= t && t < g.end)
  const c = scn.complaint
  const complaintOpen = !!c && t >= c.at && !(res.metrics.complaintDoneAt !== null && res.metrics.complaintDoneAt <= t)
  return scn.rooms.map(r => {
    const kinds = current.filter(g => g.nr === r.nr).map(g => g.kind)
    const knock = kinds.includes('knock') ? 'present' : kinds.includes('declined') ? 'declined' : null
    const done = res.doneAt[r.nr] !== undefined && res.doneAt[r.nr] <= t
    const refused = res.declinedAt[r.nr] !== undefined && res.declinedAt[r.nr] <= t
    let state: TileState
    if (r.kind === 'empty') state = 'empty'
    else if (kinds.includes('clean')) state = 'cleaning'
    else if (done) state = 'done'
    else if (refused) state = 'declined'
    else if (r.kind === 'departure') state = t >= r.checkoutAt ? 'departed' : 'occupied'
    else if (r.presence === 'dnd') state = 'dnd'
    else if (res.policy === 'onDemand' && (r.presence === 'declines' || !r.wants)) state = 'skipped'
    else if (r.presence === 'declines') state = 'occupied'
    else state = t >= r.outAt ? 'wants' : 'occupied'
    return { nr: r.nr, floor: r.floor, state, knock, priority: complaintOpen && c!.nr === r.nr }
  })
}

/** Wo jede Kraft zum Zeitpunkt t steht (null = noch nicht unterwegs). */
export function maidsAt(res: SimResult, t: number): (string | null)[] {
  const at: (string | null)[] = Array.from({ length: res.maids }, () => null)
  for (const g of res.segments) {
    if (g.start <= t && g.nr) at[g.maid] = g.nr
  }
  return at
}

export function clockLabel(min: number): string {
  const h = SIM_START_HOUR + Math.floor(min / 60)
  const m = Math.floor(min % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

// ── Hinweise im Zeitverlauf ───────────────────────────────────────────────
//
// Statt Zahlen zum Vergleichen blitzt unter jedem Bild auf, was gerade
// passiert und warum es zählt. Abgeleitet aus dem Ablauf selbst, damit kein
// Hinweis etwas behauptet, das in diesem Bild nicht geschieht.

export type Highlight = { at: number; tone: 'good' | 'bad' | 'neutral'; text: string }

export const MAID_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

export function highlights(res: SimResult, scn: Scenario = SCENARIO): Highlight[] {
  const out: Highlight[] = []
  const deps = scn.rooms.flatMap(r => (r.kind === 'departure' ? [r] : []))
  const cleans = res.segments.filter(g => g.kind === 'clean').sort((a, b) => a.start - b.start)
  const m = res.metrics
  const c = scn.complaint
  const minutes = c && m.complaintDoneAt !== null ? Math.round(m.complaintDoneAt - c.at) : 0

  // Politik, nicht Koordination: steht in beiden Bildern gleich, neutral.
  if (res.policy === 'onDemand') {
    const none = scn.rooms.filter(r => r.kind === 'stay' && (r.presence === 'declines' || (r.presence === 'out' && !r.wants))).length
    if (none > 0) {
      out.push({ at: CHECKOUT_AT + 1, tone: 'neutral',
        text: `${none} Gäste möchten heute keine Reinigung – weniger Arbeit, Wasser und Waschmittel.` })
    }
  }

  // Check-in: sind die Abreisen rechtzeitig fertig? Gilt für beide Bilder, der Ton folgt dem Ergebnis.
  const ready = m.departuresReadyAt
  if (ready !== null && ready <= CHECKIN_AT) {
    out.push({ at: ready, tone: 'good', text: `Alle Abreisezimmer bezugsfertig – vor dem Check-in um ${clockLabel(CHECKIN_AT)}.` })
  } else {
    const late = deps.filter(d => (res.doneAt[d.nr] ?? Infinity) > CHECKIN_AT).length
    if (late > 0) {
      out.push({ at: CHECKIN_AT, tone: 'bad',
        text: `Check-in beginnt – ${late} Abreise${late === 1 ? 'zimmer ist' : 'zimmer sind'} noch nicht bezugsfertig.` })
    }
  }

  if (res.coord === 'paper') {
    const firstCheckout = [...deps].sort((a, b) => a.checkoutAt - b.checkoutAt || a.nr.localeCompare(b.nr))[0]
    if (firstCheckout) {
      out.push({ at: firstCheckout.checkoutAt, tone: 'bad',
        text: `${firstCheckout.nr} ist bereits ausgecheckt – auf der Papierliste steht das nicht.` })
    }
    const early = deps.filter(d => d.checkoutAt <= CHECKOUT_AT - 30).length
    if (early > 1) {
      out.push({ at: CHECKOUT_AT - 30, tone: 'bad', text: `${early} Zimmer sind ausgecheckt – doch nur die Rezeption weiß es.` })
    }
    out.push({ at: CHECKOUT_AT, tone: 'neutral', text: 'Check-out-Frist: erst jetzt können diese Zimmer sicher gereinigt werden.' })
    // Früh morgens sind die meisten Gäste noch im Zimmer — ohne Software wird
    // trotzdem geklopft. Gezählt wird bis zur ersten vollen Stunde nach 8:00.
    const earlyKnocks = res.segments.filter(g => g.kind === 'knock' && g.start < 60).length
    if (earlyKnocks >= 3) {
      out.push({ at: 60, tone: 'bad', text: `${earlyKnocks}-mal weggeschickt — um diese Zeit sind die meisten Gäste noch im Zimmer.` })
    }
    const declines = res.segments.filter(g => g.kind === 'declined').sort((a, b) => a.start - b.start)
    const first = declines.find(g => !g.again)
    if (first) {
      out.push({ at: first.start, tone: 'bad', text: `Umsonst geklopft: ${first.nr} möchte heute keine Reinigung.` })
    }
    const again = declines.find(g => g.again)
    if (again && first) {
      const knower = declines.find(g => !g.again && g.nr === again.nr)!
      out.push({ at: again.start, tone: 'bad',
        text: `Kraft ${MAID_LABELS[again.maid]} hilft aus und klopft bei ${again.nr} noch einmal – dass der Gast abgelehnt hat, wusste nur Kraft ${MAID_LABELS[knower.maid]}.` })
    }
    // Türanhänger: der, der am längsten unbemerkt hing.
    const waits = Object.entries(res.noticedAt).flatMap(([nr, seen]) => {
      const r = scn.rooms.find(x => x.nr === nr)
      return r?.kind === 'stay' && r.presence === 'out' ? [{ nr, hung: r.outAt, seen }] : []
    }).sort((a, b) => (b.seen - b.hung) - (a.seen - a.hung) || a.nr.localeCompare(b.nr))
    const longest = waits[0]
    if (longest && longest.seen - longest.hung >= 15) {
      out.push({ at: longest.seen, tone: 'bad',
        text: `Der Anhänger an ${longest.nr} hing seit ${clockLabel(longest.hung)} – gesehen erst jetzt, als eine Kraft auf die Etage kam.` })
    }
    const patrols = res.segments.filter(g => g.kind === 'patrol')
    if (patrols.length >= 3) {
      out.push({ at: patrols[2].start, tone: 'bad', text: 'Nichts zu tun, also Etagen abgehen – ob irgendwo ein Anhänger hängt, weiß niemand.' })
    }
    if (c && m.complaintDoneAt !== null) {
      out.push({ at: m.complaintDoneAt, tone: 'bad',
        text: `Sonderfall in ${c.nr}: Die Rezeption musste die zuständige Kraft erst erreichen – erledigt nach ${minutes} Minuten.` })
    }
  } else {
    const firstDep = cleans.find(g => deps.some(d => d.nr === g.nr))
    if (firstDep) {
      out.push({ at: firstDep.start, tone: 'good',
        text: `${firstDep.nr} ausgecheckt – sofort auf dem Board und zur Reinigung eingereiht.` })
    }
    if (res.policy === 'onDemand') {
      const firstRequest = scn.rooms
        .flatMap(r => (r.kind === 'stay' && r.presence === 'out' && r.wants ? [r] : []))
        .sort((a, b) => a.outAt - b.outAt || a.nr.localeCompare(b.nr))[0]
      if (firstRequest) {
        out.push({ at: firstRequest.outAt, tone: 'good',
          text: `${firstRequest.nr} tippt beim Gehen „Zimmer reinigen“ – sofort auf dem Board, niemand muss suchen.` })
      }
    }
    // Erster Etagenwechsel nach dem Start: die Empfehlung des Boards.
    const switchWalk = res.segments.find(g => g.kind === 'walk' && g.end - g.start === DURATION.walkFloor && g.start > (firstDep?.start ?? 0))
    if (switchWalk) {
      out.push({ at: switchWalk.start, tone: 'good',
        text: 'RoSe schickt dorthin, wo am meisten zu tun ist – abgestimmt und verteilt auf die Kräfte.' })
    }
    // Ablehnung an der Tür: ein Tipp, und das Board kennt sie für alle Kräfte.
    const firstDecline = res.segments.filter(g => g.kind === 'declined').sort((a, b) => a.start - b.start)[0]
    if (firstDecline) {
      out.push({ at: firstDecline.start, tone: 'good',
        text: `${firstDecline.nr} möchte an der Tür heute keine Reinigung – ein Tipp, und RoSe merkt es sich für alle Kräfte.` })
    }
    // Erste Kraft, die auf einer Etage weitermacht, auf der die Kollegin schon war.
    // (Der Sonderfall zählt nicht — er hat seinen eigenen Hinweis.)
    const regular = cleans.filter(g => !g.jobId?.endsWith('!'))
    const before = (g: Segment) => regular.find(o => o.maid !== g.maid && o.end <= g.start && floorOf(o.nr) === floorOf(g.nr))
    const handover = regular.find(g => before(g))
    if (handover) {
      out.push({ at: handover.start, tone: 'good',
        text: `Kraft ${MAID_LABELS[handover.maid]} macht auf der ${floorOf(handover.nr)}. Etage weiter – das Board zeigt ihr, was Kraft ${MAID_LABELS[before(handover)!.maid]} dort schon erledigt hat.` })
    }
    if (c && m.complaintDoneAt !== null) {
      out.push({ at: m.complaintDoneAt, tone: 'good',
        text: `Sonderfall in ${c.nr}: ein Klick der Rezeption, die nächste freie Kraft übernimmt – erledigt nach ${minutes} Minuten.` })
    }
  }
  return out.sort((a, b) => a.at - b.at)
}
