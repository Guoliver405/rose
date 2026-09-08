import { describe, expect, it } from 'vitest'
import {
  ALLE_LOTSEN, EINRICHTUNG, EINRICHTUNG_ORDER, LOTSEN,
  clampStep, einrichtungStart, lotseById, lotsenFuer, setupProgress,
  type SetupFacts,
} from './lotsen'

const facts = (patch: Partial<SetupFacts> = {}): SetupFacts => ({
  rooms: 0, maids: 0, services: 0, stays: 0,
  guestAccessChosen: false, timeZoneChosen: false, paymentMethod: null,
  ...patch,
})

describe('Katalog', () => {
  it('vergibt jede Lotsen-Kennung genau einmal', () => {
    const ids = ALLE_LOTSEN.map(l => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gibt jedem Lotsen mindestens einen Schritt', () => {
    for (const lotse of ALLE_LOTSEN) expect(lotse.steps.length).toBeGreaterThan(0)
  })

  it('benutzt nur Pfade unterhalb des Haus-Bereichs', () => {
    // Der Pilot baut `${base}${path}` zusammen — ein Pfad ohne führenden
    // Slash landete auf einer Nachbarroute („…/adminzimmer").
    for (const lotse of ALLE_LOTSEN) {
      for (const step of lotse.steps) {
        expect(step.path === '' || step.path.startsWith('/')).toBe(true)
        expect(step.path.endsWith('/')).toBe(false)
      }
    }
  })

  it('findet Lotsen über ihre Kennung und meldet Unbekanntes als null', () => {
    expect(lotseById('zimmer')?.title).toBe('Zimmer & Etagen')
    expect(lotseById('einrichtung')).not.toBeNull()
    expect(lotseById('gibt-es-nicht')).toBeNull()
  })
})

describe('Einrichtungs-Lotse', () => {
  it('fädelt genau die Kernschritte der Fach-Lotsen auf', () => {
    const kern = EINRICHTUNG_ORDER.flatMap(id =>
      LOTSEN.find(l => l.id === id)!.steps.filter(s => s.kern),
    )
    // Begrüßung + Kernschritte + Abschluss
    expect(EINRICHTUNG.steps.length).toBe(kern.length + 2)
    for (const step of kern) expect(EINRICHTUNG.steps).toContain(step)
  })

  it('bleibt deutlich kürzer als alle Fach-Lotsen zusammen', () => {
    const alle = LOTSEN.reduce((n, l) => n + l.steps.length, 0)
    expect(EINRICHTUNG.steps.length).toBeLessThan(alle)
  })

  it('endet im Hilfe-Bereich', () => {
    expect(EINRICHTUNG.steps.at(-1)?.path).toBe('/hilfe')
  })

  it('startet auf der Zimmer-Seite mit Schritt 0', () => {
    expect(einrichtungStart('haus-am-see'))
      .toBe('/h/haus-am-see/admin/zimmer?lotse=einrichtung&schritt=0')
  })
})

describe('Sichtbarkeit je Rolle', () => {
  it('zeigt der Rezeption nur, was sie auch bedienen kann', () => {
    const rezeption = lotsenFuer(false)
    expect(rezeption.every(l => l.zugang === 'alle')).toBe(true)
    expect(rezeption.length).toBeGreaterThan(0)
  })

  it('zeigt der Verwaltung alle Fach-Lotsen', () => {
    expect(lotsenFuer(true)).toHaveLength(LOTSEN.length)
  })
})

describe('clampStep', () => {
  const lotse = LOTSEN[0]

  it('nimmt gültige Indizes unverändert', () => {
    expect(clampStep(lotse, '2')).toBe(2)
  })

  it('fängt Müll aus der URL ab', () => {
    // Der Wert kommt aus der Adresszeile und damit vom Nutzer.
    expect(clampStep(lotse, 'abc')).toBe(0)
    expect(clampStep(lotse, null)).toBe(0)
    expect(clampStep(lotse, '-3')).toBe(0)
    expect(clampStep(lotse, '1.9')).toBe(1)
  })

  it('begrenzt auf den letzten Schritt statt ins Leere zu laufen', () => {
    expect(clampStep(lotse, '999')).toBe(lotse.steps.length - 1)
  })
})

describe('setupProgress', () => {
  it('meldet ein frisches Haus als unfertig', () => {
    const p = setupProgress(facts())
    expect(p.done).toBe(0)
    expect(p.complete).toBe(false)
  })

  it('zählt jeden erledigten Punkt', () => {
    const p = setupProgress(facts({ rooms: 12, timeZoneChosen: true }))
    expect(p.done).toBe(2)
    expect(p.items.find(i => i.id === 'zimmer')?.done).toBe(true)
    expect(p.items.find(i => i.id === 'zimmer')?.hint).toContain('12')
  })

  it('gilt ohne Services als fertig — sie sind freiwillig', () => {
    // Sonst stünde ein eingerichtetes Haus für immer auf „unfertig", nur
    // weil es keine Zusatzleistungen anbietet.
    const p = setupProgress(facts({
      rooms: 4, maids: 1, stays: 1, guestAccessChosen: true, timeZoneChosen: true,
    }))
    expect(p.complete).toBe(true)
    expect(p.items.find(i => i.id === 'services')?.done).toBe(false)
  })

  it('nimmt ein wieder geleertes Haus zurück auf unfertig', () => {
    // Der Kern der Ableitung: Häkchen blieben stehen, Zahlen nicht.
    const p = setupProgress(facts({
      rooms: 0, maids: 1, stays: 3, guestAccessChosen: true, timeZoneChosen: true,
    }))
    expect(p.complete).toBe(false)
  })

  it('blendet den Zahlungsweg aus, wenn die Rolle nichts damit zu tun hat', () => {
    expect(setupProgress(facts()).items.some(i => i.id === 'zahlungsweg')).toBe(false)
    expect(setupProgress(facts({ paymentMethod: false })).items.some(i => i.id === 'zahlungsweg')).toBe(true)
  })

  it('lässt einen fehlenden Zahlungsweg das Haus nicht blockieren', () => {
    const p = setupProgress(facts({
      rooms: 4, maids: 1, stays: 1, guestAccessChosen: true, timeZoneChosen: true,
      paymentMethod: false,
    }))
    expect(p.complete).toBe(true)
  })

  it('verweist jeden Punkt auf ein Ziel', () => {
    for (const item of setupProgress(facts({ paymentMethod: false })).items) {
      expect(item.path !== null || Boolean(item.href)).toBe(true)
    }
  })
})
