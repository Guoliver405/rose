import { describe, expect, it } from 'vitest'
import { ANONYMIZE_AFTER_HOURS, anonymizeCutoff, groupForPairing, pairingKey, parseStaffTracking } from './staff-tracking'

describe('parseStaffTracking', () => {
  it('Vorgabe ist person, nur „team" schaltet um', () => {
    expect(parseStaffTracking({})).toBe('person')
    expect(parseStaffTracking({ staffTracking: 'person' })).toBe('person')
    expect(parseStaffTracking({ staffTracking: 'team' })).toBe('team')
    expect(parseStaffTracking({ staffTracking: 'TEAM' })).toBe('person')
    expect(parseStaffTracking({ staffTracking: true })).toBe('person')
  })
})

describe('pairingKey / groupForPairing', () => {
  const rows = [
    { id: 1, profile_id: 'maria', session_id: 's1' },
    { id: 2, profile_id: 'maria', session_id: 's2' }, // zweite Schicht derselben Kraft
    { id: 3, profile_id: 'lena', session_id: null },  // Bestand vor der Migration
    { id: 4, profile_id: null, session_id: 's3' },    // anonymisiert, aber paarbar
    { id: 5, profile_id: null, session_id: null },    // anonymisierter Bestand: nicht paarbar
  ]

  it('Person-Modus paart je Kraft, Team-Modus je Schicht', () => {
    expect(pairingKey(rows[0], 'person')).toBe('maria')
    expect(pairingKey(rows[0], 'team')).toBe('s1')
    expect(pairingKey(rows[2], 'team')).toBe('lena') // ohne Session: Rückfall auf die Person
    expect(pairingKey(rows[4], 'team')).toBeNull()
  })

  it('Sessions verketten keine Tage — zwei Schichten sind im Team-Modus zwei Gruppen', () => {
    const team = groupForPairing(rows, 'team')
    expect([...team.groups.keys()].sort()).toEqual(['lena', 's1', 's2', 's3'])
    expect(team.unpaired).toBe(1)
    const person = groupForPairing(rows, 'person')
    expect([...person.groups.keys()].sort()).toEqual(['lena', 'maria', 's3'])
    expect(person.groups.get('maria')?.map(r => r.id)).toEqual([1, 2])
    expect(person.unpaired).toBe(1)
  })
})

describe('anonymizeCutoff', () => {
  it('liegt genau ANONYMIZE_AFTER_HOURS zurück', () => {
    const now = new Date('2026-09-16T12:00:00Z')
    expect(anonymizeCutoff(now)).toBe(new Date(now.getTime() - ANONYMIZE_AFTER_HOURS * 3_600_000).toISOString())
  })
})
