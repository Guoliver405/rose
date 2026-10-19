import { describe, expect, it } from 'vitest'
import {
  localizeItem, localizeService, missingLanguages, parseItemTranslations, parseServiceTranslations,
  serviceLang, templateForHome, type ServiceTemplate,
} from './service-i18n'
import templates from './service-templates.json'

const waesche = {
  name: 'Wäscheservice',
  description: 'Bis 10:00 anmelden',
  lang: 'de' as const,
  translations: { en: { name: 'Laundry service', description: 'Request by 10:00' } },
}

describe('localizeService — Rückfall je Feld', () => {
  it('zeigt die Übersetzung in der Sprache des Gastes', () => {
    expect(localizeService(waesche, 'en')).toEqual({ name: 'Laundry service', description: 'Request by 10:00' })
  })
  it('in der Sprache der Grundtexte die Grundtexte', () => {
    expect(localizeService(waesche, 'de')).toEqual({ name: 'Wäscheservice', description: 'Bis 10:00 anmelden' })
  })
  it('fehlt ein Feld, kommt nur dieses als Grundtext', () => {
    const halb = { ...waesche, translations: { en: { name: 'Laundry service' } } }
    expect(localizeService(halb, 'en')).toEqual({ name: 'Laundry service', description: 'Bis 10:00 anmelden' })
  })
  it('ohne Grundbeschreibung keine Beschreibung, auch wenn eine Übersetzung herumliegt', () => {
    expect(localizeService({ ...waesche, description: null }, 'en').description).toBeNull()
  })
})

describe('localizeItem', () => {
  it('Übersetzung, sonst Grundtext', () => {
    expect(localizeItem({ label: 'klein', translations: { en: { label: 'small' } } }, 'de', 'en')).toBe('small')
    expect(localizeItem({ label: 'klein', translations: {} }, 'de', 'en')).toBe('klein')
    expect(localizeItem({ label: 'klein', translations: { en: { label: 'small' } } }, 'de', 'de')).toBe('klein')
  })
})

describe('missingLanguages — drängen, nicht sperren', () => {
  const items = [{ translations: { en: { label: 'small' } } }]
  it('vollständig übersetzt ⇒ nichts fehlt', () => {
    expect(missingLanguages(waesche, items, ['de', 'en'])).toEqual([])
  })
  it('fehlender Name, fehlende Beschreibung oder Option zählen', () => {
    expect(missingLanguages({ ...waesche, translations: {} }, [], ['de', 'en'])).toEqual(['en'])
    expect(missingLanguages({ ...waesche, translations: { en: { name: 'Laundry' } } }, [], ['de', 'en'])).toEqual(['en'])
    expect(missingLanguages(waesche, [{ translations: {} }], ['de', 'en'])).toEqual(['en'])
  })
  it('ohne Grundbeschreibung reicht der Name', () => {
    expect(missingLanguages({ description: null, lang: 'de', translations: { en: { name: 'Repair' } } }, [], ['de', 'en'])).toEqual([])
  })
  it('die Sprache der Grundtexte fehlt nie', () => {
    expect(missingLanguages({ description: null, lang: 'en', translations: {} }, [], ['de', 'en'])).toEqual(['de'])
  })
})

describe('Parsen aus DB und Formular', () => {
  it('nur bekannte Sprachen und Felder, leere fallen weg, Text wird gekürzt', () => {
    expect(parseServiceTranslations({ en: { name: '  Laundry ', description: '' }, xx: { name: 'x' }, fr: 'kaputt' }))
      .toEqual({ en: { name: 'Laundry' } })
    expect(parseServiceTranslations(null)).toEqual({})
    expect(parseItemTranslations({ en: { label: 'a'.repeat(300) } }).en?.label).toHaveLength(120)
    expect(parseItemTranslations({ en: { label: '  ' } })).toEqual({})
  })
  it('unbekannte Grundsprache ist Deutsch (Bestand)', () => {
    expect(serviceLang(undefined)).toBe('de')
    expect(serviceLang('en')).toBe('en')
  })
})

describe('Beispiel-Services — von Anfang an übersetzt', () => {
  const all = templates as ServiceTemplate[]
  it('jede Vorlage bringt alle Produktsprachen mit', () => {
    for (const t of all) {
      expect(Object.keys(t.name).sort()).toEqual(['de', 'en', 'es', 'fr'])
      for (const i of t.items) expect(Object.keys(i.label).sort()).toEqual(['de', 'en', 'es', 'fr'])
    }
  })
  it('Grundtexte in der Heimatsprache, der Rest als Übersetzung', () => {
    const en = templateForHome(all[1], 'en')
    expect(en.lang).toBe('en')
    expect(en.name).toBe('Laundry service')
    expect(en.translations.de?.name).toBe('Wäscheservice')
    expect(en.items[0].translations.de?.label).toBe('Wäschesack klein')
    const de = templateForHome(all[1], 'de')
    expect(de.name).toBe('Wäscheservice')
    expect(missingLanguages(de, de.items, ['de', 'en'])).toEqual([])
  })
  it('der Technische Dienst bleibt eine Meldung ans Haus', () => {
    expect(templateForHome(all[0], 'de').maintenance).toBe(true)
  })
})
