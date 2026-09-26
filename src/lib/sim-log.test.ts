import { describe, expect, it } from 'vitest'
import { ALL_RUNS, SCENARIO, simulate } from './cleaning-sim'
import { eventLog, filterLog } from './sim-log'

describe('Ereignis-Protokoll', () => {
  const runs = ALL_RUNS.map(([c, p]) => ({ c, p, res: simulate(c, p, SCENARIO) }))

  it('chronologisch, jede Reinigung genau einmal, jede Kraft wird fertig', () => {
    for (const { res } of runs) {
      const log = eventLog(res, SCENARIO)
      expect(log.map(e => e.at)).toEqual([...log.map(e => e.at)].sort((a, b) => a - b))
      const cleans = log.filter(e => e.text.includes(' reinigt '))
      expect(cleans).toHaveLength(res.metrics.cleaned)
      for (let m = 0; m < res.maids; m++) expect(log.filter(e => e.maid === m && e.text.endsWith('ist fertig'))).toHaveLength(1)
      expect(log.filter(e => e.text.includes('klopft'))).toHaveLength(res.metrics.knocks + res.metrics.declined)
    }
  })

  it('jede Abreise checkt aus, Check-in und Meilensteine stehen drin', () => {
    const { res } = runs.find(r => r.c === 'rose' && r.p === 'routine')!
    const log = eventLog(res, SCENARIO)
    const deps = SCENARIO.rooms.filter(r => r.kind === 'departure')
    expect(log.filter(e => e.text.includes('checkt aus'))).toHaveLength(deps.length)
    expect(log.some(e => e.kind === 'house' && e.text.startsWith('Alle Abreisezimmer bezugsfertig'))).toBe(true)
    expect(log.filter(e => e.text.startsWith('Check-in beginnt'))).toHaveLength(1)
  })

  it('ohne Software: Etagenliste, Check-out-Frist, Anhänger; mit RoSe: Portal und Board', () => {
    const paper = eventLog(runs.find(r => r.c === 'paper' && r.p === 'routine')!.res, SCENARIO)
    const rose = eventLog(runs.find(r => r.c === 'rose' && r.p === 'routine')!.res, SCENARIO)
    expect(paper.some(e => e.text.includes('liest die Etagenliste'))).toBe(true)
    expect(paper.some(e => e.text.startsWith('Check-out-Frist'))).toBe(true)
    expect(rose.some(e => e.text.includes('Etagenliste') || e.text.startsWith('Check-out-Frist'))).toBe(false)
    expect(rose.some(e => e.text.includes('frühestens ab'))).toBe(true)
  })

  it('Filter nach Kraft und nach Zimmer bzw. Etage', () => {
    const log = eventLog(runs[1].res, SCENARIO)
    const a = filterLog(log, 'Kraft A')
    expect(a.length).toBeGreaterThan(0)
    expect(a.every(e => e.maid === 0)).toBe(true)
    const room = SCENARIO.rooms[0].nr
    expect(filterLog(log, room).every(e => e.nr === room)).toBe(true)
    expect(filterLog(log, room).length).toBeGreaterThan(0)
    const third = filterLog(log, '3')
    expect(third.length).toBeGreaterThan(0)
    expect(third.every(e => e.nr !== undefined && Number(e.nr) >= 300 && Number(e.nr) < 400)).toBe(true)
    expect(filterLog(log, '  ')).toBe(log)
  })
})
