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
 *          Abreisen reinigt sie deshalb erst ab der Check-out-Frist. Was an den
 *          Türen hängt (Anhänger, „Nicht stören"), sieht sie nur auf der Etage,
 *          auf der sie gerade ist; was ein Gast an der Tür sagt, weiß nur sie.
 *          Ist in ihrem Bereich nichts mehr zu erwarten, hilft sie anderswo aus.
 *  rose  — mit RoSe, gemeinsames Board. Check-out, Reinigungswunsch,
 *          „frühestens ab", „Nicht stören" und dessen Rücknahme, „später" und
 *          „heute nicht" an der Tür stehen sofort für ALLE Kräfte auf dem Board.
 *          Die Etage wählt jede Kraft nach dem Etagenscore (Gewichte aus
 *          `board.ts`: ein Wunsch wiegt doppelt so viel wie eine Routine; geteilt
 *          durch Kräfte vor Ort + 1 wie auf dem Board).
 *
 * Die GÄSTE sind in beiden Bildern dieselben (User, 26.09.2026 — „du hast die
 * wesentlichen Eigenschaften von RoSe gar nicht eingebaut"):
 *  - Jeder Bleibegast lässt Reinigung ab einer Uhrzeit zu (er geht), gleich-
 *    verteilt 7:00–11:00: Die Chance, dass ein Klopfen gelingt, steigt linear.
 *  - Ein Teil zeigt beim Gehen an, dass er Reinigung will — ohne Software per
 *    Türanhänger, mit RoSe per Tipp. Auf Wunsch tut das jeder, der Reinigung will.
 *  - Ein Teil nennt in RoSe morgens „frühestens ab" (volle Stunde): Bis dahin
 *    klopft niemand. Ohne Software gibt es diese Angabe nicht.
 *  - Morgens hängt an manchen Türen „Nicht stören"; beim Gehen nimmt der Gast
 *    es ab (und wünscht teils Reinigung), ein Rest bleibt den ganzen Tag.
 * Alle Anteile sind Annahmen und stehen im Kleingedruckten; Feinabstimmung
 * folgt (User: „erst muss der Kern so arbeiten wie gedacht").
 *
 * Die REINIGUNGSPOLITIK ist ein Umschalter, der für BEIDE Bilder gilt:
 *  routine  — Bleibezimmer täglich, in beiden Bildern ab Schichtbeginn 8:00.
 *             Wer im Zimmer bleibt und nichts will, sagt es an der Tür.
 *  onDemand — nur auf Wunsch. Wer nichts anzeigt, wird nicht gereinigt.
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

/** Bleibezimmer bei täglicher Reinigung: in beiden Bildern ab Schichtbeginn. */
export const STAY_ROUTINE_AT = 0

/** Nach 14:00 schaut niemand mehr nach „Nicht stören" — in beiden Bildern. */
export const DND_GIVE_UP = 360

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
  /** Vor der Tür stehen, Schild „Nicht stören" sehen, notieren. */
  skip: 1,
  /** Nach einem Klopfen bzw. „Nicht stören" frühestens so viel später wieder. */
  retry: 30,
  walkRoom: 1,
  /** Mit Wäschewagen und Aufzug. */
  walkFloor: 5,
} as const

/** Annahmen zum Gästeverhalten (Kleingedrucktes). */
export const GUEST = {
  /** Anteil der Bleibegäste mit „Nicht stören" am Morgen … */
  dndMorning: 0.15,
  /** … davon so viele den ganzen Tag. */
  dndAllDay: 1 / 3,
  /** Wer „Nicht stören" abnimmt und Reinigung will: zeigt es dabei an. */
  dndLiftSignals: 0.5,
  /** Anteil der Gäste mit Reinigungswunsch, die in RoSe „frühestens ab" nennen. */
  notBefore: 0.2,
  /** Anteil der Gäste mit Reinigungswunsch, die es bei täglicher Reinigung beim Gehen anzeigen. */
  signals: 0.3,
} as const

/** Wann ein Gast, der „frühestens ab" nennt, das tut: beim Frühstück, 7:00. */
const NOT_BEFORE_SET_AT = -60

/**
 * Bleibegast:
 *  out      — verlässt das Zimmer um `outAt`; `wants`: will er Reinigung?
 *  declines — bleibt im Zimmer, will keine Reinigung, sagt es an der Tür
 *  dnd      — „Nicht stören" den ganzen Tag
 * `dndUntil`: „Nicht stören" am Morgen, abgenommen beim Gehen (= `outAt`).
 * `signals`: zeigt beim Gehen an, dass er Reinigung will (Anhänger bzw. Tipp).
 * `notBefore`: nennt in RoSe „frühestens ab" (volle Stunde ≥ `outAt`).
 */
export type Stay =
  | { presence: 'out'; outAt: number; wants: boolean; signals: boolean; dndUntil: number | null; notBefore: number | null }
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
  /** Im Zimmer, will keine Reinigung. */
  declines: 5,
  /** Geht und will Reinigung. */
  outWants: 47,
  /** Geht, bräuchte keine. */
  outNoRequest: 6,
} as const

export const FLOORS = 10
export const ROOMS_PER_FLOOR = 10
/** Fünf Kräfte, ohne Software je zwei Etagen. */
export const MAIDS = 5

/**
 * 10 Etagen × 10 Zimmer, fünf Reinigungskräfte ab 8:00. Belegung aus `MIX`,
 * zufällig verteilt. Check-outs zwischen 7:00 und 11:00 (gehäuft gegen Ende),
 * Bleibegäste gehen gleichverteilt zwischen 7:00 und 11:00.
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
  const out = (nr: string, floor: number, wants: boolean): SimRoom => {
    const outAt = -60 + five(240 * rand())
    if (rand() < GUEST.dndMorning) {
      if (rand() < GUEST.dndAllDay) return { nr, floor, kind: 'stay', presence: 'dnd' }
      return { nr, floor, kind: 'stay', presence: 'out', outAt, wants, dndUntil: outAt, notBefore: null,
        signals: wants && rand() < GUEST.dndLiftSignals }
    }
    if (wants && rand() < GUEST.notBefore) {
      return { nr, floor, kind: 'stay', presence: 'out', outAt, wants, dndUntil: null,
        notBefore: Math.ceil(outAt / 60) * 60, signals: false }
    }
    return { nr, floor, kind: 'stay', presence: 'out', outAt, wants, dndUntil: null, notBefore: null,
      signals: wants && rand() < GUEST.signals }
  }
  const rooms: SimRoom[] = kinds.map((k, i) => {
    const floor = Math.floor(i / ROOMS_PER_FLOOR) + 1
    const nr = `${floor}${String((i % ROOMS_PER_FLOOR) + 1).padStart(2, '0')}`
    switch (k) {
      case 'departure': return { nr, floor, kind: 'departure', checkoutAt: -60 + five(240 * Math.sqrt(rand())) }
      case 'empty': return { nr, floor, kind: 'empty' }
      case 'declines': return { nr, floor, kind: 'stay', presence: 'declines' }
      case 'outWants': return out(nr, floor, true)
      case 'outNoRequest': return out(nr, floor, false)
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
  /** Ab wann der Auftrag auf Liste bzw. Board steht (Infinity = nur über ein Signal). */
  knownAt: number
  /** Ab wann ein Reinigungswunsch angezeigt ist (Anhänger bzw. Tipp; Infinity = nie). */
  signalAt: number
  /** „Nicht stören" bis (Infinity = ganztags, 0 = keins). */
  dndUntil: number
  /** „Frühestens ab" — nur RoSe kennt es (sonst 0). */
  notBefore: number
  /** Gast bleibt im Zimmer und lehnt an der Tür ab. */
  declines: boolean
  duration: number
  weight: number
}

function jobsFor(scn: Scenario, coord: Coordination, policy: Policy): Job[] {
  const jobs: Job[] = []
  const none = { signalAt: Infinity, dndUntil: 0, notBefore: 0, declines: false }
  for (const r of scn.rooms) {
    const base = { id: r.nr, nr: r.nr, floor: r.floor }
    if (r.kind === 'departure') {
      jobs.push({ ...base, ...none, kind: 'departure', readyAt: r.checkoutAt,
        // Ohne Software: sicher frei erst zur Frist. Mit RoSe: erscheint beim Check-out.
        knownAt: coord === 'paper' ? Math.max(CHECKOUT_AT, r.checkoutAt) : r.checkoutAt,
        duration: DURATION.departure, weight: SCORE_WEIGHTS.checkoutPending })
      continue
    }
    if (r.kind !== 'stay') continue
    const stayBase = { ...base, kind: 'stay' as const, duration: DURATION.stay, weight: SCORE_WEIGHTS.stayover }
    if (r.presence === 'dnd') {
      // Ganztags „Nicht stören": RoSe weiß es; ohne Software steht das Zimmer
      // auf der Liste, und erst vor der Tür sieht die Kraft das Schild.
      if (policy === 'routine' && coord === 'paper') {
        jobs.push({ ...stayBase, ...none, readyAt: Infinity, knownAt: STAY_ROUTINE_AT, dndUntil: Infinity })
      }
      continue
    }
    if (r.presence === 'declines') {
      if (policy === 'routine') jobs.push({ ...stayBase, ...none, readyAt: Infinity, knownAt: STAY_ROUTINE_AT, declines: true })
      continue
    }
    // Unterwegs. Der Wunsch: mit RoSe per Tipp — bei „frühestens ab" zu dieser
    // Uhrzeit —, ohne Software als Anhänger beim Gehen.
    const shows = policy === 'onDemand' ? r.wants : (r.signals || r.notBefore !== null)
    const signalAt = !shows ? Infinity : coord === 'rose' && r.notBefore !== null ? r.notBefore : r.outAt
    if (policy === 'onDemand' && !r.wants) continue
    jobs.push({ ...stayBase, readyAt: r.outAt, declines: false,
      knownAt: policy === 'routine' ? STAY_ROUTINE_AT : Infinity,
      signalAt,
      dndUntil: r.dndUntil ?? 0,
      notBefore: coord === 'rose' && r.notBefore !== null ? r.notBefore : 0 })
  }
  const c = scn.complaint
  if (c) {
    jobs.push({ id: `${c.nr}!`, nr: c.nr, floor: floorOf(c.nr), kind: 'complaint', readyAt: c.at, ...none,
      knownAt: coord === 'paper' ? c.at + COMPLAINT.reachDelay : c.at,
      duration: DURATION.complaint, weight: SCORE_WEIGHTS.priority })
  }
  return jobs
}

export type Segment = {
  /** Index der Reinigungskraft. */
  maid: number
  /**
   * knock = Gast noch da, declined = Gast lehnt ab, skip = Schild „Nicht
   * stören" an der Tür, patrol = Etagen abgehen.
   */
  kind: 'walk' | 'patrol' | 'knock' | 'declined' | 'skip' | 'clean' | 'idle'
  /** Zimmer, an dem die Kraft am Ende des Abschnitts steht. */
  nr: string
  /** Auftrag (bei clean/knock/declined/skip). */
  jobId?: string
  /** declined/knock: eine andere Kraft hatte hier schon eine Ablehnung bzw. ein „später" gehört. */
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
  /** Türanhänger (ohne Software): wann ihn die erste Kraft gesehen hat. */
  noticedAt: Record<string, number>
  metrics: {
    cleaned: number
    /** Geklopft, Gast noch da — später wieder. */
    knocks: number
    /** Geklopft, Gast lehnt ab. */
    declined: number
    /** Vor der Tür „Nicht stören" gesehen. */
    skips: number
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
  /** Wunsch bekannt: mit RoSe allen ab dem Tipp, ohne Software nur, wer den Anhänger gesehen hat. */
  const signalKnown = (j: Job, maid: number, at: number) =>
    j.signalAt <= at && (coord === 'rose' || !!seenBy[j.id]?.has(maid))
  /**
   * Wer von einer Ablehnung weiß. Ohne Software nur die Kraft, die geklopft
   * hat; mit RoSe steht es auf dem Board und damit bei allen.
   */
  const declinedFor: Record<string, Set<number>> = {}
  /**
   * Nach einem Klopfen bei anwesendem Gast oder einem „Nicht stören" an der
   * Tür: nicht vor diesem Zeitpunkt wieder. Ohne Software weiß das nur die
   * Kraft, die da war; mit RoSe alle.
   */
  const retry: Record<string, { until: number; by: number }> = {}
  const retryFor = (j: Job, maid: number) => {
    const r = retry[j.id]
    return r && (coord === 'rose' || r.by === maid) ? r.until : 0
  }
  let knocks = 0
  let declined = 0
  let skips = 0

  // Ein Auftrag gilt als vergeben, sobald eine Kraft ihn übernommen hat —
  // die Schleife läuft in Zeitreihenfolge, deshalb ist das race-frei.
  const open = (maid: number, t: number) => jobs.filter(j => doneAt[j.id] === undefined && !declinedFor[j.id]?.has(maid)
    // Nach 14:00 schaut niemand mehr nach „Nicht stören".
    && !(j.dndUntil > t && t >= DND_GIVE_UP))

  for (;;) {
    const m = maids.filter(x => !x.finished).sort((a, b) => a.t - b.t || a.i - b.i)[0]
    if (!m || m.t >= HORIZON) break
    const t = m.t
    // Ohne Software: Wer auf einer Etage steht, sieht die Anhänger dort.
    if (m.pos && coord === 'paper') {
      for (const j of jobs) {
        if (j.floor === m.pos.floor && j.signalAt <= t && doneAt[j.id] === undefined) {
          ;(seenBy[j.id] ??= new Set()).add(m.i)
          noticedAt[j.id] ??= t
        }
      }
    }
    const openNow = open(m.i, t)
    // Ohne Software: eigener Bereich; ist dort nichts mehr zu erwarten, hilft
    // die Kraft anderswo aus — mit ihrem eigenen Wissen.
    const helping = !!m.floors && !openNow.some(j => m.floors!.has(j.floor))
    const mine = (j: Job) => !m.floors || helping || m.floors.has(j.floor)
    const visible = (j: Job) => {
      if (!mine(j) || retryFor(j, m.i) > t) return false
      if (!(j.knownAt <= t || signalKnown(j, m.i, t))) return false
      // RoSe weiß von „Nicht stören" und „frühestens ab" — solche Zimmer sind nicht offen.
      if (coord === 'rose' && (j.dndUntil > t || j.notBefore > t)) return false
      return true
    }
    // Ein angezeigter Wunsch geht vor — dort geht das Klopfen nicht ins Leere.
    const signaled = (j: Job) => (signalKnown(j, m.i, t) ? 0 : 1)
    const weightOf = (j: Job) => (j.kind === 'stay' && signalKnown(j, m.i, t) ? SCORE_WEIGHTS.pleaseClean : j.weight)

    let pick: Job | undefined
    const urgent = openNow.filter(j => j.kind === 'complaint' && visible(j))
    if (urgent.length > 0) {
      // Sonderfall geht vor — sobald die Kraft davon weiß.
      pick = urgent[0]
    } else if (coord === 'paper') {
      m.queue = m.queue.filter(j => openNow.includes(j) && visible(j))
      if (m.queue.length === 0) m.queue = openNow.filter(visible).sort((a, b) => a.floor - b.floor || a.nr.localeCompare(b.nr))
      // Auf der Etage, auf der sie steht, nimmt sie ein Zimmer mit Anhänger zuerst.
      const hung = m.pos ? m.queue.find(j => j.floor === m.pos!.floor && signaled(j) === 0) : undefined
      if (hung) m.queue = [hung, ...m.queue.filter(j => j !== hung)]
      pick = m.queue.shift()
    } else {
      const avail = openNow.filter(visible)
      if (avail.length > 0) {
        const byUrgency = (a: Job, b: Job) => weightOf(b) - weightOf(a) || signaled(a) - signaled(b) || a.nr.localeCompare(b.nr)
        const here = m.pos ? avail.filter(j => j.floor === m.pos!.floor) : []
        if (here.length > 0) {
          pick = here.sort(byUrgency)[0]
        } else {
          // Etagenscore ÷ (Kolleginnen vor Ort + 1), bei Gleichstand die untere Etage.
          const score = new Map<number, number>()
          for (const j of avail) score.set(j.floor, (score.get(j.floor) ?? 0) + weightOf(j))
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
      const unseen = coord === 'paper'
        ? openNow.filter(j => j.knownAt === Infinity && mine(j) && j.signalAt <= t && !seenBy[j.id]?.has(m.i))
        : []
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
      const wake = (j: Job) => {
        let at = Math.max(Math.min(j.knownAt, j.signalAt), retryFor(j, m.i))
        if (coord === 'rose') at = Math.max(at, Math.min(j.dndUntil, HORIZON), j.notBefore)
        return at
      }
      const next = Math.min(...openNow.filter(mine).map(wake).filter(v => v > t), DND_GIVE_UP > t ? DND_GIVE_UP : Infinity)
      if (!Number.isFinite(next) || next >= HORIZON || !openNow.some(mine)) {
        m.finished = true
        continue
      }
      segments.push({ maid: m.i, kind: 'idle', nr: m.pos?.nr ?? '', start: t, end: next })
      m.t = next
      continue
    }

    // Hingehen — Schild, Klopfen, Ablehnung oder Reinigung.
    let now = t
    const w = walkTime(m.pos, pick.floor, pick.nr)
    if (w > 0) segments.push({ maid: m.i, kind: 'walk', nr: pick.nr, start: now, end: now + w })
    now += w
    m.pos = { floor: pick.floor, nr: pick.nr }
    if (pick.dndUntil > now) {
      // Nur ohne Software möglich: erst vor der Tür sieht sie das Schild.
      segments.push({ maid: m.i, kind: 'skip', nr: pick.nr, jobId: pick.id, start: now, end: now + DURATION.skip })
      now += DURATION.skip
      retry[pick.id] = { until: now + DURATION.retry, by: m.i }
      skips++
    } else if (pick.declines) {
      const again = declinedAt[pick.id] !== undefined
      segments.push({ maid: m.i, kind: 'declined', nr: pick.nr, jobId: pick.id, again, start: now, end: now + DURATION.knock })
      now += DURATION.knock
      declinedAt[pick.id] ??= now
      const knowers = (declinedFor[pick.id] ??= new Set())
      if (coord === 'paper') knowers.add(m.i)
      else maids.forEach(o => knowers.add(o.i))
      declined++
    } else if (pick.readyAt > now) {
      // Nochmal geklopft, obwohl eine Kollegin eben „später" gehört hat?
      const again = !!retry[pick.id] && retry[pick.id].by !== m.i && retry[pick.id].until > now
      segments.push({ maid: m.i, kind: 'knock', nr: pick.nr, jobId: pick.id, again, start: now, end: now + DURATION.knock })
      now += DURATION.knock
      retry[pick.id] = { until: now + DURATION.retry, by: m.i }
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
      skips,
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
 * gewöhnlicher Tag" sagen — der Tag ist gerechnet, nicht ausgesucht.
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
export const SCENARIO_SEED = 94
export const SCENARIO: Scenario = buildScenario(SCENARIO_SEED)

// ── Zustand zu einem Zeitpunkt (für die Anzeige) ──────────────────────────

export type TileState =
  | 'empty'      // leer, nichts zu tun
  | 'occupied'   // Gast da / noch nicht ausgecheckt
  | 'dnd'
  | 'deferred'   // „frühestens ab" — nur mit RoSe bekannt
  | 'skipped'    // keine Reinigung angefordert (nur auf Wunsch)
  | 'declined'   // Gast hat an der Tür abgelehnt
  | 'departed'   // ausgecheckt, wartet auf Reinigung
  | 'wants'      // Gast weg, Reinigung offen
  | 'cleaning'
  | 'done'

export type Tile = { nr: string; floor: number; state: TileState; knock: 'present' | 'declined' | 'dnd' | null; priority: boolean }

export function tilesAt(res: SimResult, t: number, scn: Scenario = SCENARIO): Tile[] {
  const current = res.segments.filter(g => g.start <= t && t < g.end)
  const c = scn.complaint
  const complaintOpen = !!c && t >= c.at && !(res.metrics.complaintDoneAt !== null && res.metrics.complaintDoneAt <= t)
  return scn.rooms.map(r => {
    const kinds = current.filter(g => g.nr === r.nr).map(g => g.kind)
    const knock = kinds.includes('knock') ? 'present' : kinds.includes('declined') ? 'declined' : kinds.includes('skip') ? 'dnd' : null
    const done = res.doneAt[r.nr] !== undefined && res.doneAt[r.nr] <= t
    const refused = res.declinedAt[r.nr] !== undefined && res.declinedAt[r.nr] <= t
    let state: TileState
    if (r.kind === 'empty') state = 'empty'
    else if (kinds.includes('clean')) state = 'cleaning'
    else if (done) state = 'done'
    else if (refused) state = 'declined'
    else if (r.kind === 'departure') state = t >= r.checkoutAt ? 'departed' : 'occupied'
    else if (r.presence === 'dnd') state = 'dnd'
    else if (r.presence === 'out' && r.dndUntil !== null && t < r.dndUntil) state = 'dnd'
    else if (res.policy === 'onDemand' && (r.presence === 'declines' || !r.wants)) state = 'skipped'
    else if (r.presence === 'declines') state = 'occupied'
    else if (res.coord === 'rose' && r.notBefore !== null && t >= NOT_BEFORE_SET_AT && t < r.notBefore) state = 'deferred'
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

/** Vergeblich an der Tür bis t: Gast noch da, lehnt ab oder „Nicht stören" — in beiden Bildern gleich gezählt. */
export function turnedAwayAt(res: SimResult, t: number): number {
  return res.segments.filter(g => (g.kind === 'knock' || g.kind === 'declined' || g.kind === 'skip') && g.start <= t).length
}

export function clockLabel(min: number): string {
  const h = SIM_START_HOUR + Math.floor(min / 60)
  const m = Math.floor(((min % 60) + 60) % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

// ── Hinweise im Zeitverlauf ───────────────────────────────────────────────
//
// Statt Zahlen zum Vergleichen blitzt unter jedem Bild auf, was gerade
// passiert und warum es zählt. Abgeleitet aus dem Ablauf selbst, damit kein
// Hinweis etwas behauptet, das in diesem Bild nicht geschieht.

export type Highlight = { at: number; tone: 'good' | 'bad' | 'neutral'; text: string }

export const MAID_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

type OutGuest = Extract<SimRoom, { presence: 'out' }>
const outGuests = (scn: Scenario) => scn.rooms.flatMap(r => (r.kind === 'stay' && r.presence === 'out' ? [r as OutGuest] : []))
const firstBy = <T>(xs: T[], key: (x: T) => number) => [...xs].sort((a, b) => key(a) - key(b))[0]

export function highlights(res: SimResult, scn: Scenario = SCENARIO): Highlight[] {
  const out: Highlight[] = []
  const deps = scn.rooms.flatMap(r => (r.kind === 'departure' ? [r] : []))
  const cleans = res.segments.filter(g => g.kind === 'clean').sort((a, b) => a.start - b.start)
  const m = res.metrics
  const c = scn.complaint
  const minutes = c && m.complaintDoneAt !== null ? Math.round(m.complaintDoneAt - c.at) : 0
  const guests = outGuests(scn)
  const firstClean = (nr: string) => cleans.find(g => g.jobId === nr)?.start

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
    const firstCheckout = firstBy(deps, d => d.checkoutAt)
    if (firstCheckout) {
      out.push({ at: Math.max(0, firstCheckout.checkoutAt), tone: 'bad',
        text: `${firstCheckout.nr} ist bereits ausgecheckt – auf der Papierliste steht das nicht.` })
    }
    const early = deps.filter(d => d.checkoutAt <= CHECKOUT_AT - 30).length
    if (early > 1) {
      out.push({ at: CHECKOUT_AT - 30, tone: 'bad', text: `${early} Zimmer sind ausgecheckt – doch nur die Rezeption weiß es.` })
    }
    out.push({ at: CHECKOUT_AT, tone: 'neutral', text: 'Check-out-Frist: erst jetzt können diese Zimmer sicher gereinigt werden.' })
    // Geklopft, wo der Gast in RoSe „frühestens ab" gesagt hätte.
    const nb = res.segments.filter(g => g.kind === 'knock' && guests.some(x => x.nr === g.nr && x.notBefore !== null))
      .sort((a, b) => a.start - b.start)[0]
    if (nb) {
      const gst = guests.find(x => x.nr === nb.nr)!
      out.push({ at: nb.start, tone: 'bad',
        text: `Geklopft bei ${nb.nr} – der Gast will erst ab ${clockLabel(gst.notBefore!)} Reinigung, aber davon weiß niemand.` })
    }
    // „Nicht stören" abgenommen — gesehen erst, wenn jemand vorbeikommt.
    const lifted = guests.filter(x => x.dndUntil !== null && x.dndUntil >= 0 && firstClean(x.nr) !== undefined)
      .map(x => ({ nr: x.nr, at: x.dndUntil!, seen: firstClean(x.nr)! }))
      .sort((a, b) => (b.seen - b.at) - (a.seen - a.at))[0]
    if (lifted && lifted.seen - lifted.at >= 30) {
      out.push({ at: lifted.seen, tone: 'bad',
        text: `Das „Nicht stören“ an ${lifted.nr} ist seit ${clockLabel(lifted.at)} weg – gereinigt erst jetzt, niemand kam vorbei.` })
    }
    const firstSkip = res.segments.filter(g => g.kind === 'skip').sort((a, b) => a.start - b.start)[0]
    if (firstSkip) {
      out.push({ at: firstSkip.start, tone: 'bad',
        text: `Vor ${firstSkip.nr}: „Nicht stören“ – das sieht die Kraft erst an der Tür, später muss sie wieder hin.` })
    }
    const declines = res.segments.filter(g => g.kind === 'declined').sort((a, b) => a.start - b.start)
    const again = declines.find(g => g.again)
    if (again) {
      const knower = declines.find(g => !g.again && g.nr === again.nr)!
      out.push({ at: again.start, tone: 'bad',
        text: `Kraft ${MAID_LABELS[again.maid]} hilft aus und klopft bei ${again.nr} noch einmal – dass der Gast abgelehnt hat, wusste nur Kraft ${MAID_LABELS[knower.maid]}.` })
    }
    const knockAgain = res.segments.filter(g => g.kind === 'knock' && g.again).sort((a, b) => a.start - b.start)[0]
    if (knockAgain) {
      const told = res.segments.filter(g => g.kind === 'knock' && g.nr === knockAgain.nr && g.maid !== knockAgain.maid && g.start < knockAgain.start)
        .sort((a, b) => b.start - a.start)[0]
      out.push({ at: knockAgain.start, tone: 'bad',
        text: `Kraft ${MAID_LABELS[knockAgain.maid]} klopft bei ${knockAgain.nr} – dass der Gast eben „später“ gesagt hat, wusste nur Kraft ${MAID_LABELS[told.maid]}.` })
    }
    // Türanhänger: der, der am längsten unbemerkt hing.
    const waits = Object.entries(res.noticedAt).flatMap(([nr, seen]) => {
      const g = guests.find(x => x.nr === nr)
      return g ? [{ nr, hung: g.outAt, seen }] : []
    }).sort((a, b) => (b.seen - b.hung) - (a.seen - a.hung) || a.nr.localeCompare(b.nr))
    const longest = waits[0]
    if (longest && longest.seen - Math.max(0, longest.hung) >= 15) {
      out.push({ at: longest.seen, tone: 'bad',
        text: `Der Anhänger „Bitte reinigen“ an ${longest.nr} hing seit ${clockLabel(longest.hung)} – gesehen erst jetzt, als eine Kraft auf die Etage kam.` })
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
    // Eine Uhrzeit nach Schichtbeginn, sonst zeigt der Hinweis nichts.
    const nb = firstBy(guests.filter(x => x.notBefore !== null && x.notBefore >= 60 && (res.policy === 'routine' || x.wants)), x => x.notBefore!)
    if (nb) {
      out.push({ at: 0, tone: 'good',
        text: `${nb.nr} hat im Portal „frühestens ab ${clockLabel(nb.notBefore!)}“ angegeben – bis dahin klopft niemand, die Kräfte planen drumherum.` })
    }
    const lift = firstBy(guests.filter(x => x.dndUntil !== null && x.dndUntil >= 0 && (res.policy === 'routine' || x.wants)), x => x.dndUntil!)
    if (lift) {
      out.push({ at: lift.dndUntil!, tone: 'good',
        text: lift.signals || res.policy === 'onDemand'
          ? `${lift.nr} nimmt „Nicht stören“ zurück und wünscht Reinigung – sofort auf dem Board, für alle Kräfte.`
          : `${lift.nr} nimmt „Nicht stören“ zurück – das Zimmer ist sofort wieder auf dem Board.` })
    }
    const firstSignal = firstBy(guests.filter(x => x.outAt >= 0 && x.notBefore === null && x.dndUntil === null
      && (res.policy === 'onDemand' ? x.wants : x.signals)), x => x.outAt)
    if (firstSignal) {
      out.push({ at: firstSignal.outAt, tone: 'good',
        text: `${firstSignal.nr} tippt beim Gehen „Zimmer reinigen“ – das Board zieht die nächste freie Kraft auf diese Etage.` })
    }
    const firstLater = res.segments.filter(g => g.kind === 'knock').sort((a, b) => a.start - b.start)[0]
    if (firstLater) {
      out.push({ at: firstLater.start, tone: 'good',
        text: `${firstLater.nr}: Gast noch da – „In 30 Min“ getippt, bis dahin klopft keine Kollegin.` })
    }
    // Ablehnung an der Tür: ein Tipp, und das Board kennt sie für alle Kräfte.
    const firstDecline = res.segments.filter(g => g.kind === 'declined').sort((a, b) => a.start - b.start)[0]
    if (firstDecline) {
      out.push({ at: firstDecline.start, tone: 'good',
        text: `${firstDecline.nr} möchte an der Tür heute keine Reinigung – ein Tipp, und RoSe merkt es sich für alle Kräfte.` })
    }
    if (c && m.complaintDoneAt !== null) {
      out.push({ at: m.complaintDoneAt, tone: 'good',
        text: `Sonderfall in ${c.nr}: ein Klick der Rezeption, die nächste freie Kraft übernimmt – erledigt nach ${minutes} Minuten.` })
    }
  }
  return out.sort((a, b) => a.at - b.at)
}
