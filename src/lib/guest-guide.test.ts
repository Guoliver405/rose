import { describe, expect, it } from 'vitest'
import {
  GUIDE_LANGS, buildGuestGuide, buildGuestGuides, buildGuestSheet, buildGuestSheets,
  guideLines, parseSheetLanguages, sheetLabels,
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

describe('parseSheetLanguages', () => {
  it('ohne Angabe: Deutsch, dann Englisch', () => {
    expect(parseSheetLanguages({})).toEqual(['de', 'en'])
  })

  it('folgt der Wahl des Hauses, in dieser Reihenfolge', () => {
    expect(parseSheetLanguages({ sheetLanguage: 'es', sheetLanguage2: 'fr' })).toEqual(['es', 'fr'])
  })

  it('ausdrücklich leere Zweitsprache heißt: nur eine', () => {
    // Ohne diesen Fall könnte ein Haus die zweite Sprache nie abwählen.
    expect(parseSheetLanguages({ sheetLanguage: 'en', sheetLanguage2: '' })).toEqual(['en'])
  })

  it('zweimal dieselbe Sprache ergibt einen Block', () => {
    expect(parseSheetLanguages({ sheetLanguage: 'de', sheetLanguage2: 'de' })).toEqual(['de'])
  })

  it('unbekannte Werte: erste Sprache auf Vorgabe, zweite fällt weg', () => {
    // Es muss immer eine erste Sprache geben; ein Wert, den wir nicht kennen,
    // ist dagegen kein Auftrag, Englisch zu drucken.
    expect(parseSheetLanguages({ sheetLanguage: 'xx' })).toEqual(['de', 'en'])
    expect(parseSheetLanguages({ sheetLanguage: 'fr', sheetLanguage2: 'xx' })).toEqual(['fr'])
    expect(parseSheetLanguages({ sheetLanguage: 42, sheetLanguage2: {} })).toEqual(['de'])
  })
})

describe('buildGuestSheet — Legende', () => {
  it('beschriftet die Knöpfe in der Sprache des PORTALS, den Hinweis in der des Blattes', () => {
    // Eine Legende, die „Clean my room" nennt, während auf dem Bildschirm
    // „Zimmer reinigen" steht, ist keine Legende.
    const en = buildGuestSheet({}, pinDeep, 'en')
    expect(en.buttons.clean.label).toBe('Zimmer reinigen')
    expect(en.buttons.dnd.label).toBe('Bitte nicht stören')
    expect(en.buttons.services.label).toBe('Service bestellen')
    expect(en.buttons.clean.hint).toMatch(/cleaned/)
  })

  it('zieht mit, sobald das Portal übersetzt ist', () => {
    const en = buildGuestSheet({}, { ...pinDeep, portalLang: 'en' }, 'en')
    expect(en.buttons.clean.label).toBe('Clean my room')
    expect(en.buttons.dnd.label).toBe('Do not disturb')
  })

  it('deutsche Beschriftungen sind wortgleich mit dem Gastportal', () => {
    // Quelle: GuestSignalPanel.tsx („Zimmer reinigen", „Bitte nicht stören")
    // und GuestServicesPanel.tsx („Service bestellen"). Wer dort umbenennt,
    // muss hier nachziehen.
    const de = buildGuestSheet({}, pinDeep)
    expect([de.buttons.clean.label, de.buttons.dnd.label, de.buttons.services.label])
      .toEqual(['Zimmer reinigen', 'Bitte nicht stören', 'Service bestellen'])
  })
})

describe('buildGuestSheet — Aushang gegen Handout', () => {
  it('der neutrale Nachhaltigkeits-Satz nennt keine Uhrzeit', () => {
    // Er steht auf dem PERMANENTEN Aushang. Eine gedruckte Uhrzeit veraltet
    // stillschweigend, sobald das Haus seine Zeiten ändert.
    const policies = {
      stayoverAutoClean: true, stayoverAutoCleanTime: '10:30',
      cleaningWindowEnabled: true, cleaningWindowStart: '08:00', cleaningWindowEnd: '15:00',
    }
    for (const lang of GUIDE_LANGS) {
      const s = buildGuestSheet(policies, pinDeep, lang)
      expect(s.sustainabilityNeutral, lang).not.toMatch(/\d{1,2}:\d{2}/)
    }
  })

  it('der neutrale Satz ist in beiden Policy-Welten derselbe', () => {
    for (const lang of GUIDE_LANGS) {
      const wunsch = buildGuestSheet({}, pinDeep, lang).sustainabilityNeutral
      const routine = buildGuestSheet({ stayoverAutoClean: true }, pinDeep, lang).sustainabilityNeutral
      expect(routine, lang).toBe(wunsch)
    }
  })

  it('spricht auch neutral von Wasser und Energie', () => {
    const begriffe: Record<GuideLang, RegExp> = {
      de: /Wasser.+Energie/,
      en: /water.+energy/,
      es: /agua.+energía/,
      fr: /eau.+énergie/,
    }
    for (const lang of GUIDE_LANGS) {
      expect(buildGuestSheet({}, pinDeep, lang).sustainabilityNeutral).toMatch(begriffe[lang])
    }
  })

  it('die Regel fürs Handout verzweigt und nennt die effektive Zeit', () => {
    const s = buildGuestSheet({ stayoverAutoClean: true, stayoverAutoCleanTime: '9:30' }, pinDeep)
    // Check-out-Frist (Default 11:00) ist die Untergrenze der Routine.
    expect(s.cleaningRule).toMatch(/täglich ab 11:00 Uhr/)
    expect(buildGuestSheet({}, pinDeep).cleaningRule).toMatch(/auf Wunsch/)
    // Identisch mit der Langfassung — die Verzweigung steht nur an einer Stelle.
    expect(s.cleaningRule).toBe(
      buildGuestGuide({ stayoverAutoClean: true, stayoverAutoCleanTime: '9:30' }, pinDeep).cleaning,
    )
  })
})

describe('buildGuestSheets', () => {
  it('liefert die Blöcke in der Reihenfolge des Hauses', () => {
    const blocks = buildGuestSheets({ sheetLanguage: 'fr', sheetLanguage2: 'de' }, pinDeep)
    expect(blocks.map(b => b.lang)).toEqual(['fr', 'de'])
  })

  it('lässt in keiner Sprache ein Feld leer', () => {
    // Derselbe Wächter wie für die Langfassung: Ein neuer Punkt, der in einer
    // Übersetzung vergessen wird, fehlt still auf dem gedruckten Blatt.
    for (const lang of GUIDE_LANGS) {
      const s = buildGuestSheet({}, pinDeep, lang)
      for (const [feld, wert] of Object.entries(s)) {
        if (feld === 'lang') continue // Sprachkürzel, kein Text
        if (feld === 'buttons') {
          for (const [knopf, b] of Object.entries(s.buttons)) {
            expect(b.label.trim().length, `${lang}.${knopf}.label`).toBeGreaterThan(2)
            expect(b.hint.trim().length, `${lang}.${knopf}.hint`).toBeGreaterThan(2)
          }
        } else {
          expect(String(wert).trim().length, `${lang}.${feld}`).toBeGreaterThan(2)
        }
      }
    }
  })
})
