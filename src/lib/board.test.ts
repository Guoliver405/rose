import { describe, expect, it } from 'vitest'
import {
  CLEANING_STALE_MINUTES_DEFAULT, clampStaleMinutes, isCleaningFresh, isPresenceFresh,
  dateKeyAfterNights, isDepartureToday, isRoomActive, isStayoverDue, isWithinCleaningWindow,
  localDateKey, parseCleaningWindow, stayoverDueTime,
  parseStayoverPolicy, PRESENCE_STALE_HOURS, roomScore, staleCleaningCutoff,
} from './board'

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
  const heute = new Date(2026, 8, 6, 23, 30) // 06.09.2026, spät abends

  it('bildet das lokale Datum, nicht das UTC-Datum', () => {
    expect(localDateKey(heute)).toBe('2026-09-06')
  })

  it('rechnet Nächte auf das Abreisedatum um, über Monatsgrenzen hinweg', () => {
    expect(dateKeyAfterNights(heute, 1)).toBe('2026-09-07')
    expect(dateKeyAfterNights(new Date(2026, 8, 30), 2)).toBe('2026-10-02')
    expect(dateKeyAfterNights(heute, -3)).toBe('2026-09-06')
  })

  it('erkennt den Abreisetag und ignoriert fehlende Angaben', () => {
    expect(isDepartureToday('2026-09-06', heute)).toBe(true)
    expect(isDepartureToday('2026-09-07', heute)).toBe(false)
    expect(isDepartureToday(null, heute)).toBe(false)
    expect(isDepartureToday(undefined, heute)).toBe(false)
  })
})

describe('isStayoverDue', () => {
  const policy = { enabled: true, hour: 10, minute: 0, checkoutHour: 11, checkoutMinute: 0 }
  const gestern = new Date(2026, 6, 25, 14, 0).toISOString()
  const heuteFrueh = new Date(2026, 6, 26, 8, 0).toISOString()
  const nachDerZeit = new Date(2026, 6, 26, 11, 0)
  const vorDerZeit = new Date(2026, 6, 26, 9, 0)

  const args = {
    policy, occupied: true, checkedInAt: gestern,
    guestSignal: 'none' as const, cleanedToday: false, now: nachDerZeit,
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

  it('greift nicht bei DND, freiem Zimmer oder ausgeschalteter Policy', () => {
    expect(isStayoverDue({ ...args, guestSignal: 'dnd' })).toBe(false)
    expect(isStayoverDue({ ...args, occupied: false })).toBe(false)
    expect(isStayoverDue({ ...args, policy: { ...policy, enabled: false } })).toBe(false)
  })

  it('ist erledigt, sobald heute gereinigt wurde', () => {
    expect(isStayoverDue({ ...args, cleanedToday: true })).toBe(false)
  })

  it('wird nie vor der Check-out-Frist fällig, auch wenn die Routine-Zeit früher liegt', () => {
    // Routine 10:00, Check-out bis 11:00, jetzt 10:30: wer noch da ist, könnte
    // gleich abreisen — nicht reinigen, sonst zweimal.
    expect(isStayoverDue({ ...args, now: new Date(2026, 6, 26, 10, 30) })).toBe(false)
    expect(isStayoverDue({ ...args, now: new Date(2026, 6, 26, 11, 0) })).toBe(true)
    // Liegt die Routine-Zeit später als die Frist, gilt die Routine-Zeit.
    const spaet = { ...policy, hour: 14, minute: 0 }
    expect(isStayoverDue({ ...args, policy: spaet, now: new Date(2026, 6, 26, 13, 0) })).toBe(false)
    expect(isStayoverDue({ ...args, policy: spaet, now: new Date(2026, 6, 26, 14, 0) })).toBe(true)
  })

  it('setzt am geplanten Abreisetag aus — gereinigt wird nach dem Check-out', () => {
    expect(isStayoverDue({ ...args, expectedCheckout: '2026-07-26' })).toBe(false)
    expect(isStayoverDue({ ...args, expectedCheckout: '2026-07-26', now: new Date(2026, 6, 26, 15, 0) })).toBe(false)
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
  const at = (h: number, m = 0) => new Date(2026, 6, 26, h, m)

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
