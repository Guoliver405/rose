import { describe, expect, it } from 'vitest'
import { floorOf } from './cleaning-sim'
import { DEFAULT_FORM } from './sim-form'
import { policiesFromForm, roomsFromForm } from './sim-convert'

describe('Simulator → Hotelkonto', () => {
  it('Zimmer wie im Simulator nummeriert, eindeutig, Etage passt zur Nummer', () => {
    const rooms = roomsFromForm({ floors: 12, roomsPerFloor: 3 })
    expect(rooms).toHaveLength(36)
    expect(rooms.slice(0, 4).map(r => r.number)).toEqual(['101', '102', '103', '201'])
    expect(rooms.at(-1)).toEqual({ floor: 12, number: '1203' })
    expect(new Set(rooms.map(r => r.number)).size).toBe(36)
    expect(rooms.every(r => floorOf(r.number) === r.floor)).toBe(true)
  })

  it('Regeln: Umschalter und Uhrzeiten; keine Zeitzone', () => {
    const p = policiesFromForm(DEFAULT_FORM, 'onDemand')
    expect(p).toEqual({ stayoverAutoClean: false, stayoverAutoCleanTime: '08:00', checkoutUntil: '11:00', checkinFrom: '15:00' })
    expect(policiesFromForm(DEFAULT_FORM, 'routine').stayoverAutoClean).toBe(true)
    expect('timeZone' in p).toBe(false)
  })
})
