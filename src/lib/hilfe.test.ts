import { describe, expect, it } from 'vitest'
import {
  HILFE_THEMEN, hilfeHub, hilfeUrl, hilfeZiel, istHilfeSeite, relativerPfad, themaBereich, themaById,
  themaFuerPfad, themenFuer,
  type HilfeThema, type LegendeEintrag, type Verweis,
} from './hilfe'
import { LOTSEN, lotseById } from './lotsen'
import { ROOM_BARS, ROOM_RINGS, ROOM_SYMBOLS } from './room-symbols'

function alleEintraege<T>(art: 'legende' | 'verweise'): T[] {
  const out: T[] = []
  for (const t of HILFE_THEMEN) {
    for (const b of t.bloecke) if (b.art === art) out.push(...(b.eintraege as T[]))
  }
  return out
}

describe('Katalog', () => {
  it('vergibt jede Kennung genau einmal', () => {
    const ids = HILFE_THEMEN.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gibt jedem Thema Inhalt', () => {
    for (const t of HILFE_THEMEN) {
      expect(t.bloecke.length).toBeGreaterThan(0)
      for (const b of t.bloecke) {
        if (b.art === 'text') expect(b.absaetze.length).toBeGreaterThan(0)
        else expect(b.eintraege.length).toBeGreaterThan(0)
      }
    }
  })

  it('hat zu jedem Fach-Lotsen ein Thema mit derselben Kennung', () => {
    // Sonst führt der Hub vom Lotsen in eine Hilfe, die es nicht gibt — oder
    // umgekehrt. Beide Kataloge sind absichtlich parallel geschnitten.
    for (const lotse of LOTSEN) {
      const thema = themaById(lotse.id)
      expect(thema, `Thema zu Lotse ${lotse.id}`).not.toBeNull()
      expect(themaBereich(thema!)).toBe(lotse.bereich ?? 'haus')
    }
  })

  it('verweist nur auf Lotsen, die es gibt', () => {
    for (const t of HILFE_THEMEN) {
      if (t.lotse) {
        const lotse = lotseById(t.lotse)
        expect(lotse, `Lotse ${t.lotse} für Thema ${t.id}`).not.toBeNull()
        expect(lotse!.bereich ?? 'haus').toBe(themaBereich(t))
      }
    }
  })

  it('benutzt nur Pfade unterhalb der Basis', () => {
    for (const t of HILFE_THEMEN) {
      expect(t.pfade.length).toBeGreaterThan(0)
      for (const p of t.pfade) {
        expect(p === '' || p.startsWith('/')).toBe(true)
        expect(p.endsWith('/')).toBe(false)
      }
    }
  })

  it('vergibt jeden Pfad innerhalb eines Bereichs nur einmal', () => {
    for (const bereich of ['haus', 'konto'] as const) {
      const pfade = HILFE_THEMEN.filter(t => themaBereich(t) === bereich).flatMap(t => t.pfade)
      expect(new Set(pfade).size).toBe(pfade.length)
    }
  })

  it('kennt die Zeichen der Legenden', () => {
    // Die Schlüssel sind typisiert — der Test hält fest, dass die Tabellen
    // auch zur Laufzeit alles hergeben, was die Legende braucht (Text!).
    for (const e of alleEintraege<LegendeEintrag>('legende')) {
      const z = e.zeichen
      if (z.art === 'symbol') expect(ROOM_SYMBOLS[z.id].text.length).toBeGreaterThan(0)
      else if (z.art === 'balken') expect(ROOM_BARS[z.id].text.length).toBeGreaterThan(0)
      else if (z.art === 'ring') expect(ROOM_RINGS[z.id].text.length).toBeGreaterThan(0)
      else {
        // Icon und Pille tragen ihre Beschriftung selbst.
        expect(e.label, JSON.stringify(z)).toBeTruthy()
        expect(e.text, JSON.stringify(z)).toBeTruthy()
      }
    }
  })

  it('verweist nur auf Themen, Lotsen und Seiten, die es gibt', () => {
    for (const v of alleEintraege<Verweis>('verweise')) {
      if (v.ziel.art === 'thema') expect(themaById(v.ziel.id), v.label).not.toBeNull()
      if (v.ziel.art === 'lotse') expect(lotseById(v.ziel.id), v.label).not.toBeNull()
      if (v.ziel.art === 'seite') expect(v.ziel.path.startsWith('/')).toBe(true)
      if (v.ziel.art === 'url') expect(v.ziel.href.startsWith('/')).toBe(true)
    }
  })
})

describe('Rollenfilter', () => {
  it('zeigt der Rezeption nur Themen für alle', () => {
    const ids = themenFuer(false).map(t => t.id)
    expect(ids).toContain('uebersicht')
    expect(ids).toContain('anfragen')
    expect(ids).toContain('aushang')
    expect(ids).not.toContain('zimmer')
    expect(ids).not.toContain('konto')
  })

  it('zeigt dem Manager die Verwaltung, aber nicht das Konto', () => {
    const ids = themenFuer(true).map(t => t.id)
    expect(ids).toContain('zimmer')
    expect(ids).toContain('haeuser')
    expect(ids).not.toContain('konto')
  })

  it('zeigt dem Inhaber alles', () => {
    expect(themenFuer(true, true).length).toBe(HILFE_THEMEN.length)
  })
})

describe('Adressen', () => {
  const haus = themaById('zimmer')!
  const konto = themaById('konto')!

  it('baut Haus- und Konto-Adressen aus dem Bereich', () => {
    expect(hilfeUrl(haus, 'alpen')).toBe('/h/alpen/admin/hilfe/zimmer')
    expect(hilfeUrl(konto, 'alpen')).toBe('/admin/hilfe/konto')
    expect(hilfeHub('alpen')).toBe('/h/alpen/admin/hilfe')
  })

  it('führt „Erklärung" auf die Seite, um die es geht', () => {
    expect(hilfeZiel(haus, 'alpen')).toBe('/h/alpen/admin/zimmer')
    expect(hilfeZiel(konto, 'alpen')).toBe('/admin/abrechnung')
    expect(hilfeZiel(themaById('uebersicht')!, 'alpen')).toBe('/h/alpen/admin')
    expect(hilfeZiel(themaById('reinigung')!, 'alpen')).toBe('/h/alpen/admin/hilfe/reinigung')
  })

  it('führt von jedem Ziel wieder auf sein Thema', () => {
    // Sonst öffnet „Erklärung" die Leiste neben einer Seite, deren Thema ein
    // anderes ist — der Hub verspräche etwas, das die Leiste nicht hält.
    for (const t of HILFE_THEMEN) {
      expect(themaFuerPfad(t.pfade[0], themaBereich(t))?.id, t.id).toBe(t.id)
    }
  })

  it('zerlegt einen vollständigen Pfad in Bereich, Slug und Rest', () => {
    expect(relativerPfad('/h/alpen/admin')).toEqual({ bereich: 'haus', slug: 'alpen', pfad: '' })
    expect(relativerPfad('/h/alpen/admin/zimmer/aushang')).toEqual({ bereich: 'haus', slug: 'alpen', pfad: '/zimmer/aushang' })
    expect(relativerPfad('/admin')).toEqual({ bereich: 'konto', slug: null, pfad: '' })
    expect(relativerPfad('/admin/abrechnung/zahlungsweg')).toEqual({ bereich: 'konto', slug: null, pfad: '/abrechnung/zahlungsweg' })
    expect(relativerPfad('/h/alpen/guest')).toBeNull()
    expect(relativerPfad('/login')).toBeNull()
  })
})

describe('Thema zur Seite', () => {
  const id = (t: HilfeThema | null) => t?.id ?? null

  it('trifft die Startseite nur exakt', () => {
    expect(id(themaFuerPfad(''))).toBe('uebersicht')
    expect(id(themaFuerPfad('/'))).toBe('uebersicht')
    expect(id(themaFuerPfad('/einstellungen'))).toBeNull()
    expect(id(themaFuerPfad('/einstellungen/test'))).toBeNull()
  })

  it('lässt den längsten Pfad gewinnen', () => {
    expect(id(themaFuerPfad('/zimmer'))).toBe('zimmer')
    expect(id(themaFuerPfad('/zimmer/aushang'))).toBe('aushang')
    expect(id(themaFuerPfad('/personal'))).toBe('personal')
    expect(id(themaFuerPfad('/personal/abc-123'))).toBe('personal')
    expect(id(themaFuerPfad('/personal/karte/abc-123'))).toBe('aushang')
  })

  it('deckt Unterseiten mit Kennung ab', () => {
    expect(id(themaFuerPfad('/handout/0f3a'))).toBe('aushang')
    expect(id(themaFuerPfad('/aufstellung/0f3a'))).toBe('uebersicht')
  })

  it('unterscheidet die Bereiche', () => {
    expect(id(themaFuerPfad('', 'konto'))).toBe('haeuser')
    expect(id(themaFuerPfad('/abrechnung', 'konto'))).toBe('konto')
    expect(id(themaFuerPfad('/abrechnung/zahlungsweg', 'konto'))).toBe('konto')
    expect(id(themaFuerPfad('/abrechnung', 'haus'))).toBeNull()
  })

  it('erkennt Hub und Themenseiten, nicht aber die Simulationen', () => {
    expect(istHilfeSeite('/hilfe')).toBe(true)
    expect(istHilfeSeite('/hilfe/zimmer')).toBe(true)
    expect(istHilfeSeite('/hilfe/reinigung')).toBe(false)
    expect(istHilfeSeite('/hilfe/gast')).toBe(false)
    expect(istHilfeSeite('/hilfen')).toBe(false)
    expect(istHilfeSeite('')).toBe(false)
    expect(istHilfeSeite('/hilfe/konto', 'konto')).toBe(true)
  })
})
