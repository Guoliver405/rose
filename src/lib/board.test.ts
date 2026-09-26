import { describe, expect, it } from 'vitest'
import {
  CLEANING_STALE_MINUTES_DEFAULT, clampStaleMinutes, isCleaningFresh, isPresenceFresh,
  cleanDeferOptions, dateKeyAfterNights, isCleanDeferred, isDepartureToday, isRoomActive, isStayoverDue,
  isWithinCleaningWindow, localDateKey, parseCleanDefer, parseCleaningWindow, stayoverDueTime,
  parseStayoverPolicy, PRESENCE_STALE_HOURS, roomScore, staleCleaningCutoff, guestCleaningStatus,
  canAnswerAtDoor, doorDeferUntil, isDeclinedToday,
} from './board'
import { zonedInstant } from './tz'

const B = 'Europe/Berlin'
/** Ortszeit Berlin → Zeitpunkt; so laufen die Tests auf jedem Rechner gleich (CI rechnet in UTC). */
const berlin = (y: number, m: number, d: number, h = 0, mi = 0) => zonedInstant(B, y, m, d, h, mi)

describe('staleCleaningCutoff', () => {
  const now = new Date('2026-07-26T12:00:00Z')

  it('ist null ohne Reinigung oder ohne Startzeitpunkt', () => {
    expect(staleCleaningCutoff({ cleaning_by: null, cleaning_started_at: null }, 90, now)).toBeNull()
    expect(staleCleaningCutoff({ cleaning_by: 'maria', cleaning_started_at: null }, 90, now)).toBeNull()
  })

  it('ist null, solange die Reinigung frisch ist', () => {
    const state = { cleaning_by: 'maria', cleaning_started_at: '2026-07-26T11:30:00Z' }
    expect(staleCleaningCutoff(state, 90, now)).toBeNull()
  })

  it('liefert Start + Limit, nicht den Zeitpunkt des Bemerkens', () => {
    const state = { cleaning_by: 'maria', cleaning_started_at: '2026-07-26T09:00:00Z' }
    expect(staleCleaningCutoff(state, 90, now)).toBe('2026-07-26T10:30:00.000Z')
  })

  it('ist genau am Limit bereits gerissen (Spiegel zu isCleaningFresh)', () => {
    const state = { cleaning_by: 'maria', cleaning_started_at: '2026-07-26T10:30:00Z' }
    expect(isCleaningFresh(state, 90, now)).toBe(false)
    expect(staleCleaningCutoff(state, 90, now)).toBe('2026-07-26T12:00:00.000Z')
  })
})

describe('clampStaleMinutes', () => {
  it('nimmt den Default bei fehlender oder unbrauchbarer Policy', () => {
    expect(clampStaleMinutes(undefined)).toBe(CLEANING_STALE_MINUTES_DEFAULT)
    expect(clampStaleMinutes('90')).toBe(CLEANING_STALE_MINUTES_DEFAULT)
    expect(clampStaleMinutes(NaN)).toBe(CLEANING_STALE_MINUTES_DEFAULT)
  })

  it('klemmt auf 5 Minuten bis 24 Stunden', () => {
    expect(clampStaleMinutes(1)).toBe(5)
    expect(clampStaleMinutes(99999)).toBe(24 * 60)
    expect(clampStaleMinutes(45)).toBe(45)
  })
})

describe('isCleaningFresh', () => {
  const now = new Date('2026-07-26T12:00:00Z')

  it('ist false, wenn niemand reinigt', () => {
    expect(isCleaningFresh({ cleaning_by: null, cleaning_started_at: null }, 90, now)).toBe(false)
  })

  it('ist true kurz nach dem Start', () => {
    const state = { cleaning_by: 'maria', cleaning_started_at: '2026-07-26T11:30:00Z' }
    expect(isCleaningFresh(state, 90, now)).toBe(true)
  })

  it('kippt nach dem Stale-Timeout auf false — vergessener Abschluss', () => {
    const state = { cleaning_by: 'maria', cleaning_started_at: '2026-07-26T09:00:00Z' }
    expect(isCleaningFresh(state, 90, now)).toBe(false)
  })

  it('gilt ohne Startzeitpunkt als frisch', () => {
    expect(isCleaningFresh({ cleaning_by: 'maria', cleaning_started_at: null }, 90, now)).toBe(true)
  })
})

describe('isRoomActive', () => {
  const base = { guest_signal: 'none' as const, checkout_pending: false, priority: false }

  it('ist aktiv bei Check-out, Priorität oder Reinigungswunsch', () => {
    expect(isRoomActive({ ...base, checkout_pending: true })).toBe(true)
    expect(isRoomActive({ ...base, priority: true })).toBe(true)
    expect(isRoomActive({ ...base, guest_signal: 'please_clean' })).toBe(true)
  })

  it('ist nicht aktiv bei DND oder ohne Signal', () => {
    expect(isRoomActive(base)).toBe(false)
    expect(isRoomActive({ ...base, guest_signal: 'dnd' })).toBe(false)
  })

  it('ist bei „frühestens ab" erst ab der Uhrzeit aktiv', () => {
    const wish = { ...base, guest_signal: 'please_clean' as const, clean_not_before: '2026-09-07T09:00:00Z' }
    expect(isRoomActive(wish, new Date('2026-09-07T08:59:00Z'))).toBe(false)
    expect(isCleanDeferred(wish, new Date('2026-09-07T08:59:00Z'))).toBe(true)
    expect(isRoomActive(wish, new Date('2026-09-07T09:00:00Z'))).toBe(true)
    expect(roomScore(wish, false, new Date('2026-09-07T08:00:00Z'))).toBe(0)
    expect(roomScore(wish, false, new Date('2026-09-07T10:00:00Z'))).toBe(1)
    // Seit 26.09.: auch ohne Wunsch — Aufschub an der Tür für die Routine.
    expect(isCleanDeferred({ ...base, clean_not_before: '2099-01-01T00:00:00Z' })).toBe(true)
    // Nie bei einer Abreise und nie bei „Nicht stören".
    expect(isCleanDeferred({ ...base, checkout_pending: true, clean_not_before: '2099-01-01T00:00:00Z' })).toBe(false)
    expect(isCleanDeferred({ ...base, guest_signal: 'dnd', clean_not_before: '2099-01-01T00:00:00Z' })).toBe(false)
  })
})

describe('parseCleanDefer / cleanDeferOptions', () => {
  it('ist standardmäßig an mit 11:00 und lässt sich abschalten', () => {
    expect(parseCleanDefer({})).toEqual({ enabled: true, hour: 11, minute: 0 })
    expect(parseCleanDefer({ cleanDeferEnabled: false, cleanDeferUntil: '13:30' })).toEqual({ enabled: false, hour: 13, minute: 30 })
  })

  it('bietet volle Stunden nach jetzt bis zur Grenze an — vor Ort', () => {
    const now = berlin(2026, 9, 7, 8, 20)
    const opts = cleanDeferOptions(parseCleanDefer({}), now, B)
    expect(opts.map(o => o.label)).toEqual(['09:00', '10:00', '11:00'])
    expect(opts[0].iso).toBe(berlin(2026, 9, 7, 9, 0).toISOString())
  })

  it('nimmt die Grenze selbst auf, wenn sie keine volle Stunde ist', () => {
    const now = berlin(2026, 9, 7, 9, 30)
    expect(cleanDeferOptions(parseCleanDefer({ cleanDeferUntil: '11:30' }), now, B).map(o => o.label))
      .toEqual(['10:00', '11:00', '11:30'])
  })

  it('ist leer nach der Grenze oder bei ausgeschalteter Policy', () => {
    expect(cleanDeferOptions(parseCleanDefer({}), berlin(2026, 9, 7, 11, 0), B)).toEqual([])
    expect(cleanDeferOptions(parseCleanDefer({ cleanDeferEnabled: false }), berlin(2026, 9, 7, 8, 0), B)).toEqual([])
  })
})

describe('roomScore', () => {
  const base = { guest_signal: 'none' as const, checkout_pending: false, priority: false }

  it('gewichtet Priorität am höchsten und summiert', () => {
    expect(roomScore({ ...base, priority: true })).toBe(3)
    expect(roomScore({ ...base, checkout_pending: true })).toBe(2)
    expect(roomScore({ ...base, guest_signal: 'please_clean' })).toBe(1)
    expect(roomScore({ guest_signal: 'please_clean', checkout_pending: true, priority: true })).toBe(6)
  })

  it('wertet die Routine-Reinigung wie einen Gast-Wunsch', () => {
    expect(roomScore(base, true)).toBe(1)
  })

  it('zählt Wunsch und Routine nicht doppelt', () => {
    expect(roomScore({ ...base, guest_signal: 'please_clean' }, true)).toBe(1)
  })

  it('ist 0 für ein ruhiges Zimmer', () => {
    expect(roomScore(base)).toBe(0)
    expect(roomScore({ ...base, guest_signal: 'dnd' })).toBe(0)
  })
})

describe('parseStayoverPolicy', () => {
  it('ist aus, solange die Policy nicht ausdrücklich true ist', () => {
    expect(parseStayoverPolicy({}).enabled).toBe(false)
    expect(parseStayoverPolicy({ stayoverAutoClean: 'true' }).enabled).toBe(false)
  })

  it('liest die Uhrzeit und fällt bei Unsinn auf 10:00 zurück', () => {
    expect(parseStayoverPolicy({ stayoverAutoCleanTime: '07:30' })).toMatchObject({ hour: 7, minute: 30 })
    expect(parseStayoverPolicy({ stayoverAutoCleanTime: 'morgens' })).toMatchObject({ hour: 10, minute: 0 })
  })

  it('klemmt unmögliche Zeiten', () => {
    expect(parseStayoverPolicy({ stayoverAutoCleanTime: '99:99' })).toMatchObject({ hour: 23, minute: 59 })
  })

  it('liest die Check-out-Frist und nimmt sonst 11:00', () => {
    expect(parseStayoverPolicy({})).toMatchObject({ checkoutHour: 11, checkoutMinute: 0 })
    expect(parseStayoverPolicy({ checkoutUntil: '12:30' })).toMatchObject({ checkoutHour: 12, checkoutMinute: 30 })
  })
})

describe('stayoverDueTime', () => {
  it('nimmt das Spätere aus Routine-Zeit und Check-out-Frist', () => {
    expect(stayoverDueTime({ enabled: true, hour: 10, minute: 0, checkoutHour: 11, checkoutMinute: 0 })).toEqual({ hour: 11, minute: 0 })
    expect(stayoverDueTime({ enabled: true, hour: 13, minute: 15, checkoutHour: 11, checkoutMinute: 0 })).toEqual({ hour: 13, minute: 15 })
  })
})

describe('localDateKey / dateKeyAfterNights / isDepartureToday', () => {
  const heute = berlin(2026, 9, 6, 23, 30) // 06.09.2026, spät abends — in UTC schon der 07.

  it('bildet das Datum vor Ort, nicht das UTC-Datum', () => {
    expect(localDateKey(heute, B)).toBe('2026-09-06')
    expect(heute.toISOString().slice(0, 10)).toBe('2026-09-06') // Kontrolle: UTC ist 21:30 — erst um 22:00 kippt der UTC-Tag
    expect(localDateKey(berlin(2026, 9, 7, 0, 30), B)).toBe('2026-09-07')
  })

  it('rechnet Nächte auf das Abreisedatum um, über Monatsgrenzen hinweg', () => {
    expect(dateKeyAfterNights(heute, 1, B)).toBe('2026-09-07')
    expect(dateKeyAfterNights(berlin(2026, 9, 30, 12), 2, B)).toBe('2026-10-02')
    expect(dateKeyAfterNights(heute, -3, B)).toBe('2026-09-06')
  })

  it('erkennt den Abreisetag und ignoriert fehlende Angaben', () => {
    expect(isDepartureToday('2026-09-06', heute, B)).toBe(true)
    expect(isDepartureToday('2026-09-07', heute, B)).toBe(false)
    expect(isDepartureToday(null, heute, B)).toBe(false)
    expect(isDepartureToday(undefined, heute, B)).toBe(false)
  })
})

describe('isStayoverDue', () => {
  const policy = { enabled: true, hour: 10, minute: 0, checkoutHour: 11, checkoutMinute: 0 }
  const gestern = berlin(2026, 7, 25, 14, 0).toISOString()
  const heuteFrueh = berlin(2026, 7, 26, 8, 0).toISOString()
  const nachDerZeit = berlin(2026, 7, 26, 11, 0)
  const vorDerZeit = berlin(2026, 7, 26, 9, 0)

  const args = {
    policy, occupied: true, checkedInAt: gestern,
    guestSignal: 'none' as const, cleanedToday: false, now: nachDerZeit, timeZone: B,
  }

  it('ist fällig ab der zweiten Nacht nach der eingestellten Uhrzeit', () => {
    expect(isStayoverDue(args)).toBe(true)
  })

  it('ist vor der eingestellten Uhrzeit noch nicht fällig', () => {
    expect(isStayoverDue({ ...args, now: vorDerZeit })).toBe(false)
  })

  it('greift nicht in der ersten Nacht', () => {
    expect(isStayoverDue({ ...args, checkedInAt: heuteFrueh })).toBe(false)
  })

  it('greift nicht bei DND, eigenem Wunsch, freiem Zimmer oder ausgeschalteter Policy', () => {
    expect(isStayoverDue({ ...args, guestSignal: 'dnd' })).toBe(false)
    expect(isStayoverDue({ ...args, guestSignal: 'please_clean' })).toBe(false)
    expect(isStayoverDue({ ...args, occupied: false })).toBe(false)
    expect(isStayoverDue({ ...args, policy: { ...policy, enabled: false } })).toBe(false)
  })

  it('ist erledigt, sobald heute gereinigt wurde', () => {
    expect(isStayoverDue({ ...args, cleanedToday: true })).toBe(false)
  })

  it('wird nie vor der Check-out-Frist fällig, auch wenn die Routine-Zeit früher liegt', () => {
    // Routine 10:00, Check-out bis 11:00, jetzt 10:30: wer noch da ist, könnte
    // gleich abreisen — nicht reinigen, sonst zweimal.
    expect(isStayoverDue({ ...args, now: berlin(2026, 7, 26, 10, 30) })).toBe(false)
    expect(isStayoverDue({ ...args, now: berlin(2026, 7, 26, 11, 0) })).toBe(true)
    // Liegt die Routine-Zeit später als die Frist, gilt die Routine-Zeit.
    const spaet = { ...policy, hour: 14, minute: 0 }
    expect(isStayoverDue({ ...args, policy: spaet, now: berlin(2026, 7, 26, 13, 0) })).toBe(false)
    expect(isStayoverDue({ ...args, policy: spaet, now: berlin(2026, 7, 26, 14, 0) })).toBe(true)
  })

  it('setzt am geplanten Abreisetag aus — gereinigt wird nach dem Check-out', () => {
    expect(isStayoverDue({ ...args, expectedCheckout: '2026-07-26' })).toBe(false)
    expect(isStayoverDue({ ...args, expectedCheckout: '2026-07-26', now: berlin(2026, 7, 26, 15, 0) })).toBe(false)
  })

  it('läuft an anderen Tagen normal — auch bei überfälligem Abreisedatum', () => {
    expect(isStayoverDue({ ...args, expectedCheckout: '2026-07-27' })).toBe(true)
    // Datum von gestern: die Rezeption hat den Aufenthalt wohl verlängert und
    // das Datum nicht nachgezogen — dann gilt der Aufenthalt als offen.
    expect(isStayoverDue({ ...args, expectedCheckout: '2026-07-25' })).toBe(true)
  })
})

describe('parseCleaningWindow', () => {
  it('ist aus und nimmt die Standardzeiten', () => {
    expect(parseCleaningWindow({})).toEqual({ enabled: false, start: '08:00', end: '16:00' })
  })

  it('normalisiert einstellige Stunden', () => {
    expect(parseCleaningWindow({ cleaningWindowStart: '9:05' }).start).toBe('09:05')
  })
})

describe('isWithinCleaningWindow', () => {
  // Ortszeit Berlin; die Funktion rechnet mit der Zeitzone des Hauses (Default Berlin).
  const at = (h: number, m = 0) => berlin(2026, 7, 26, h, m)

  it('lässt bei ausgeschalteter Policy alles durch', () => {
    expect(isWithinCleaningWindow({ enabled: false, start: '08:00', end: '16:00' }, at(23))).toBe(true)
  })

  it('prüft ein normales Tagesfenster, Ende exklusiv', () => {
    const p = { enabled: true, start: '08:00', end: '16:00' }
    expect(isWithinCleaningWindow(p, at(7, 59))).toBe(false)
    expect(isWithinCleaningWindow(p, at(8))).toBe(true)
    expect(isWithinCleaningWindow(p, at(15, 59))).toBe(true)
    expect(isWithinCleaningWindow(p, at(16))).toBe(false)
  })

  it('liest Start > Ende als Fenster über Mitternacht', () => {
    const p = { enabled: true, start: '22:00', end: '02:00' }
    expect(isWithinCleaningWindow(p, at(23))).toBe(true)
    expect(isWithinCleaningWindow(p, at(1))).toBe(true)
    expect(isWithinCleaningWindow(p, at(12))).toBe(false)
  })

  it('liest Start === Ende als ganztägig', () => {
    const p = { enabled: true, start: '09:00', end: '09:00' }
    expect(isWithinCleaningWindow(p, at(3))).toBe(true)
  })
})

describe('isPresenceFresh', () => {
  const now = new Date('2026-07-26T12:00:00Z')

  it('ist frisch innerhalb des Stale-Fensters', () => {
    expect(isPresenceFresh('2026-07-26T06:00:00Z', now)).toBe(true)
  })

  it('altert nach dem Stale-Fenster heraus — vergessenes Schichtende', () => {
    const alt = new Date(now.getTime() - (PRESENCE_STALE_HOURS + 1) * 3_600_000).toISOString()
    expect(isPresenceFresh(alt, now)).toBe(false)
  })
})

describe('guestCleaningStatus', () => {
  const policyOn = parseStayoverPolicy({ stayoverAutoClean: true, stayoverAutoCleanTime: '10:00', checkoutUntil: '11:00' })
  const policyOff = parseStayoverPolicy({})
  const idle = { guest_signal: 'none' as const, priority: false, cleaning_by: null, cleaning_started_at: null, clean_not_before: null }
  const base = {
    state: idle, staleMinutes: 90, policy: policyOn, timeZone: B,
    checkedInAt: berlin(2026, 9, 14, 15).toISOString(), expectedCheckout: null, lastCleanDoneAt: null,
  }

  it('laufende Reinigung schlägt alles — aber nur, solange sie frisch ist', () => {
    const now = berlin(2026, 9, 16, 12)
    const running = { ...idle, cleaning_by: 'm', cleaning_started_at: berlin(2026, 9, 16, 11, 30).toISOString() }
    expect(guestCleaningStatus({ ...base, state: running, now }).kind).toBe('in_progress')
    const stale = { ...idle, cleaning_by: 'm', cleaning_started_at: berlin(2026, 9, 16, 8).toISOString() }
    expect(guestCleaningStatus({ ...base, state: stale, now }).kind).toBe('scheduled') // Routine fällig
  })

  it('Wunsch ist vorgesehen, „frühestens ab" nennt die Uhrzeit, danach nicht mehr', () => {
    const notBefore = berlin(2026, 9, 16, 14)
    const wish = { ...idle, guest_signal: 'please_clean' as const, clean_not_before: notBefore.toISOString() }
    const before = guestCleaningStatus({ ...base, state: wish, now: berlin(2026, 9, 16, 9) })
    expect(before).toEqual({ kind: 'scheduled_from', at: notBefore, reason: 'guest' })
    expect(guestCleaningStatus({ ...base, state: wish, now: berlin(2026, 9, 16, 14, 30) }).kind).toBe('scheduled')
  })

  it('ein neuer Wunsch nach der Reinigung ist wieder „vorgesehen", nicht „erledigt"', () => {
    const now = berlin(2026, 9, 16, 15)
    const done = berlin(2026, 9, 16, 10, 40).toISOString()
    expect(guestCleaningStatus({ ...base, now, lastCleanDoneAt: done })).toEqual({ kind: 'done', at: new Date(done) })
    const wish = { ...idle, guest_signal: 'please_clean' as const }
    expect(guestCleaningStatus({ ...base, state: wish, now, lastCleanDoneAt: done }).kind).toBe('scheduled')
    expect(guestCleaningStatus({ ...base, state: { ...idle, priority: true }, now, lastCleanDoneAt: done }).kind).toBe('scheduled')
  })

  it('Nicht stören geht vor Routine und Erledigt', () => {
    const dnd = { ...idle, guest_signal: 'dnd' as const }
    const done = berlin(2026, 9, 16, 9).toISOString()
    expect(guestCleaningStatus({ ...base, state: dnd, now: berlin(2026, 9, 16, 12), lastCleanDoneAt: done }).kind).toBe('dnd')
  })

  it('„erledigt" zählt nur am Ortstag und nur ab Check-in', () => {
    const now = berlin(2026, 9, 16, 12)
    // Gestern gereinigt (Vorgänger-Check-out oder gestrige Routine): heute nicht „erledigt".
    const yesterday = berlin(2026, 9, 15, 18).toISOString()
    expect(guestCleaningStatus({ ...base, now, lastCleanDoneAt: yesterday }).kind).toBe('scheduled')
    // Anreisetag: um 00:30 Ortszeit gereinigt, Check-in um 14:00 → gehört dem Vorgänger.
    const arrival = berlin(2026, 9, 16, 14).toISOString()
    const earlyToday = berlin(2026, 9, 16, 0, 30).toISOString()
    const s = guestCleaningStatus({ ...base, checkedInAt: arrival, now: berlin(2026, 9, 16, 16), lastCleanDoneAt: earlyToday })
    expect(s).toEqual({ kind: 'none', reason: 'first_day' })
  })

  it('Routine: vor der Fälligkeit „ab HH:MM" (Check-out-Frist als Untergrenze), danach vorgesehen', () => {
    const early = guestCleaningStatus({ ...base, now: berlin(2026, 9, 16, 8) })
    expect(early).toEqual({ kind: 'scheduled_from', at: berlin(2026, 9, 16, 11), reason: 'routine' })
    expect(guestCleaningStatus({ ...base, now: berlin(2026, 9, 16, 11, 5) }).kind).toBe('scheduled')
  })

  it('Routine setzt am Anreisetag und am Abreisetag aus, ohne Routine gibt es nichts', () => {
    const now = berlin(2026, 9, 16, 12)
    expect(guestCleaningStatus({ ...base, now, checkedInAt: berlin(2026, 9, 16, 9).toISOString() })).toEqual({ kind: 'none', reason: 'first_day' })
    expect(guestCleaningStatus({ ...base, now, expectedCheckout: '2026-09-16' })).toEqual({ kind: 'none', reason: 'departure' })
    expect(guestCleaningStatus({ ...base, now, policy: policyOff })).toEqual({ kind: 'none', reason: 'no_routine' })
  })
})

describe('Gast an der Tür', () => {
  const policyOn = parseStayoverPolicy({ stayoverAutoClean: true, stayoverAutoCleanTime: '10:00', checkoutUntil: '11:00' })
  const routine = (now: Date, extra: { cleanNotBefore?: string | null; cleanedToday?: boolean } = {}) => isStayoverDue({
    policy: policyOn, occupied: true, checkedInAt: berlin(2026, 9, 25, 15).toISOString(), guestSignal: 'none',
    cleanedToday: extra.cleanedToday ?? false, cleanNotBefore: extra.cleanNotBefore ?? null, now, timeZone: B,
  })

  it('„bitte später" hält die Routine bis zur Uhrzeit an, danach ist sie wieder fällig', () => {
    const later = berlin(2026, 9, 26, 12, 30).toISOString()
    expect(routine(berlin(2026, 9, 26, 11, 30))).toBe(true)
    expect(routine(berlin(2026, 9, 26, 11, 30), { cleanNotBefore: later })).toBe(false)
    expect(routine(berlin(2026, 9, 26, 12, 30), { cleanNotBefore: later })).toBe(true)
  })

  it('„heute keine Reinigung" hält die Routine nur heute an', () => {
    const due = (now: Date, cleanDeclinedOn: string) => isStayoverDue({
      policy: policyOn, occupied: true, checkedInAt: berlin(2026, 9, 24, 15).toISOString(), guestSignal: 'none',
      cleanedToday: false, cleanDeclinedOn, now, timeZone: B,
    })
    expect(due(berlin(2026, 9, 26, 14), '2026-09-26')).toBe(false)
    expect(due(berlin(2026, 9, 27, 14), '2026-09-26')).toBe(true) // verfällt um Mitternacht
    // Kurz nach Mitternacht in Berlin ist es in UTC noch „gestern" — gerechnet wird vor Ort.
    expect(isDeclinedToday('2026-09-27', berlin(2026, 9, 27, 0, 30), B)).toBe(true)
  })

  it('bietet die Antworten nur bei belegten Zimmern mit offener Routine oder offenem Wunsch an', () => {
    const room = { occupied: true, checkoutPending: false, guestSignal: 'none' as const, stayoverDue: true, deferred: false, cleaningFresh: false }
    expect(canAnswerAtDoor(room)).toBe(true)
    expect(canAnswerAtDoor({ ...room, stayoverDue: false, guestSignal: 'please_clean' })).toBe(true)
    expect(canAnswerAtDoor({ ...room, stayoverDue: false })).toBe(false) // nichts offen
    expect(canAnswerAtDoor({ ...room, occupied: false })).toBe(false)
    expect(canAnswerAtDoor({ ...room, checkoutPending: true })).toBe(false) // Abreise: kein Gast mehr
    expect(canAnswerAtDoor({ ...room, guestSignal: 'dnd' })).toBe(false)
    expect(canAnswerAtDoor({ ...room, cleaningFresh: true })).toBe(false)
    expect(canAnswerAtDoor({ ...room, deferred: true })).toBe(false) // schon aufgeschoben
  })

  it('der Aufschub endet auf der vollen Minute', () => {
    const now = new Date('2026-09-26T09:17:42.500Z')
    expect(doorDeferUntil(30, now).toISOString()).toBe('2026-09-26T09:47:00.000Z')
    expect(doorDeferUntil(60, now).toISOString()).toBe('2026-09-26T10:17:00.000Z')
  })

  describe('Gaststatus', () => {
    const idle = { guest_signal: 'none' as const, priority: false, cleaning_by: null, cleaning_started_at: null, clean_not_before: null }
    const base = {
      state: idle, staleMinutes: 90, policy: policyOn, timeZone: B,
      checkedInAt: berlin(2026, 9, 25, 15).toISOString(), expectedCheckout: null, lastCleanDoneAt: null,
    }

    it('„bitte später" nennt die Uhrzeit mit Grund „an der Tür"', () => {
      const at = berlin(2026, 9, 26, 12, 30)
      const state = { ...idle, clean_not_before: at.toISOString() }
      expect(guestCleaningStatus({ ...base, state, now: berlin(2026, 9, 26, 11, 30) }))
        .toEqual({ kind: 'scheduled_from', at, reason: 'door' })
    })

    it('„heute keine Reinigung" steht, bis gereinigt wird oder der Gast selbst wünscht', () => {
      const now = berlin(2026, 9, 26, 13)
      const skip = { ...idle, clean_declined_on: '2026-09-26' }
      expect(guestCleaningStatus({ ...base, state: skip, now })).toEqual({ kind: 'declined' })
      // Doch gereinigt: gereinigt gilt.
      const done = berlin(2026, 9, 26, 12, 40).toISOString()
      expect(guestCleaningStatus({ ...base, state: skip, now, lastCleanDoneAt: done }).kind).toBe('done')
      // Wunsch geht vor (das Portal hebt den Verzicht ohnehin auf).
      expect(guestCleaningStatus({ ...base, state: { ...skip, guest_signal: 'please_clean' as const }, now }).kind).toBe('scheduled')
      // Gestern verzichtet zählt heute nicht.
      expect(guestCleaningStatus({ ...base, state: { ...idle, clean_declined_on: '2026-09-25' }, now }).kind).toBe('scheduled')
    })
  })
})
