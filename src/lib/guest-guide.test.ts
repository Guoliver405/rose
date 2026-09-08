import { describe, expect, it } from 'vitest'
import {
  GUIDE_LANGS, buildGuestGuide, buildGuestGuides, guideLines, sheetLabels,
  type GuideLang,
} from './guest-guide'

const pinDeep = { accessMode: 'pin' as const, deepLink: true }

describe('buildGuestGuide — Reinigung', () => {
  it('ohne Routine-Reinigung muss der Gast anfordern', () => {
    const g = buildGuestGuide({}, pinDeep)
    expect(g.cleaning).toMatch(/auf Wunsch/)
    expect(g.cleaning).toMatch(/fordern Sie die Reinigung im Portal an/)
    expect(g.cleaning).not.toMatch(/täglich ab/)
  })

  it('mit Routine-Reinigung muss der Gast nichts anfordern und sieht die Uhrzeit', () => {
    // Routine 9:30, aber Check-out-Frist (Default 11:00) ist die Untergrenze.
    const g = buildGuestGuide({ stayoverAutoClean: true, stayoverAutoCleanTime: '9:30' }, pinDeep)
    expect(g.cleaning).toMatch(/täglich ab 11:00 Uhr/)
    expect(g.cleaning).toMatch(/am Abreisetag nach dem Check-out/)
    const frueh = buildGuestGuide({ stayoverAutoClean: true, stayoverAutoCleanTime: '9:30', checkoutUntil: '09:00' }, pinDeep)
    expect(frueh.cleaning).toMatch(/täglich ab 09:30 Uhr/)
    expect(g.cleaning).toMatch(/Sie müssen nichts anfordern/)
  })

  it('nennt die Aufschieb-Grenze, solange das Haus sie anbietet', () => {
    expect(buildGuestGuide({}, pinDeep).cleaning).toMatch(/bis spätestens 11:00 Uhr aufschieben/)
    expect(buildGuestGuide({ cleanDeferUntil: '13:00' }, pinDeep).cleaning).toMatch(/bis spätestens 13:00 Uhr/)
    expect(buildGuestGuide({ cleanDeferEnabled: false }, pinDeep).cleaning).not.toMatch(/aufschieben/)
  })

  it('Zeitfenster wird genannt, wenn es aktiv ist — in beiden Modi', () => {
    const win = { cleaningWindowEnabled: true, cleaningWindowStart: '08:00', cleaningWindowEnd: '15:00' }
    expect(buildGuestGuide(win, pinDeep).cleaning).toMatch(/von 08:00 bis 15:00 Uhr/)
    expect(buildGuestGuide({ ...win, stayoverAutoClean: true }, pinDeep).cleaning).toMatch(/von 08:00 bis 15:00 Uhr/)
  })

  it('ausgeschaltetes Zeitfenster taucht nicht auf', () => {
    const g = buildGuestGuide({ cleaningWindowEnabled: false, cleaningWindowStart: '08:00' }, pinDeep)
    expect(g.cleaning).not.toMatch(/Uhr entgegen/)
  })
})

describe('buildGuestGuide — Zugang', () => {
  it('Link-Verfahren: ohne PIN, erlischt mit dem Check-out', () => {
    const g = buildGuestGuide({}, { accessMode: 'link', deepLink: true })
    expect(g.access).toMatch(/ohne PIN/)
    expect(g.access).toMatch(/erlischt mit dem Check-out/)
    expect(g.access).not.toMatch(/PIN eingeben/)
  })

  it('PIN-Verfahren mit Zimmer-QR: scannen + PIN', () => {
    expect(buildGuestGuide({}, pinDeep).access).toMatch(/QR-Code scannen und PIN eingeben/)
  })

  it('PIN-Verfahren ohne Zimmer-QR: Adresse, Zimmernummer + PIN', () => {
    const g = buildGuestGuide({}, { accessMode: 'pin', deepLink: false })
    expect(g.access).toMatch(/Zimmernummer und PIN/)
  })
})

describe('Nachhaltigkeit', () => {
  it('begründet den Verzicht, wenn nur auf Wunsch gereinigt wird', () => {
    const g = buildGuestGuide({}, pinDeep)
    expect(g.sustainability).toMatch(/nur, wenn Sie es möchten/)
  })

  it('verweist auf „Nicht stören", wenn täglich gereinigt wird', () => {
    // Zum Verzicht aufrufen, während ohnehin täglich gereinigt wird, wäre
    // eine Lüge auf Papier — der Hebel ist dann ein anderer.
    const g = buildGuestGuide({ stayoverAutoClean: true }, pinDeep)
    expect(g.sustainability).toMatch(/Bitte nicht stören/)
    expect(g.sustainability).not.toMatch(/nur, wenn Sie es möchten/)
  })

  it('spricht in jeder Sprache von Wasser und Energie', () => {
    const begriffe: Record<GuideLang, RegExp> = {
      de: /Wasser.+Energie/,
      en: /water.+energy/,
      es: /agua.+energía/,
      fr: /eau.+énergie/,
    }
    for (const lang of GUIDE_LANGS) {
      expect(buildGuestGuide({}, pinDeep, lang).sustainability).toMatch(begriffe[lang])
      expect(buildGuestGuide({ stayoverAutoClean: true }, pinDeep, lang).sustainability)
        .toMatch(begriffe[lang])
    }
  })
})

describe('Sprachen', () => {
  it('liefert alle vier in Druckreihenfolge', () => {
    expect(buildGuestGuides({}, pinDeep).map(g => g.lang)).toEqual(['de', 'en', 'es', 'fr'])
  })

  it('lässt in keiner Sprache einen Satz leer', () => {
    // Der häufigste Fehler bei Übersetzungen: Ein neuer Punkt wird in einer
    // Sprache vergessen und fehlt still auf dem gedruckten Blatt.
    for (const g of buildGuestGuides({}, pinDeep)) {
      for (const [feld, wert] of Object.entries(g)) {
        if (feld === 'lang') continue // Sprachkürzel, kein Text
        if (feld === 'labels') {
          for (const label of Object.values(g.labels)) expect(label.length).toBeGreaterThan(2)
        } else {
          expect(String(wert).trim().length, `${g.lang}.${feld}`).toBeGreaterThan(2)
        }
      }
    }
  })

  it('nennt die Uhrzeiten des Hauses in jeder Sprache', () => {
    // Die Zahlen kommen aus den Policies und dürfen in keiner Übersetzung
    // verlorengehen — sonst steht in drei Sprachen etwas anderes als in der
    // vierten.
    const policies = {
      stayoverAutoClean: true, stayoverAutoCleanTime: '10:30', checkoutUntil: '09:00',
      cleaningWindowEnabled: true, cleaningWindowStart: '08:00', cleaningWindowEnd: '15:00',
      cleanDeferUntil: '13:00',
    }
    for (const g of buildGuestGuides(policies, pinDeep)) {
      for (const zeit of ['10:30', '08:00', '15:00', '13:00']) {
        expect(g.cleaning, `${g.lang} ohne ${zeit}`).toContain(zeit)
      }
    }
  })

  it('unterscheidet die Zugangs-Sätze auch übersetzt', () => {
    for (const lang of GUIDE_LANGS) {
      const link = buildGuestGuide({}, { accessMode: 'link', deepLink: true }, lang).access
      const tief = buildGuestGuide({}, { accessMode: 'pin', deepLink: true }, lang).access
      const flach = buildGuestGuide({}, { accessMode: 'pin', deepLink: false }, lang).access
      expect(new Set([link, tief, flach]).size).toBe(3)
    }
  })

  it('beschriftet den Zugangs-Bereich in jeder Sprache', () => {
    for (const lang of GUIDE_LANGS) {
      const l = sheetLabels(lang)
      for (const wert of Object.values(l)) expect(wert.trim().length).toBeGreaterThan(2)
    }
    expect(sheetLabels('fr').room).toBe('Chambre')
  })
})

describe('guideLines', () => {
  it('liefert alle Punkte in Lesereihenfolge', () => {
    const g = buildGuestGuide({}, pinDeep)
    expect(guideLines(g)).toEqual([
      g.purpose, g.cleaning, g.sustainability, g.dnd, g.services, g.access,
    ])
  })
})
