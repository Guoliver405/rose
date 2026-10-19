import { describe, expect, it } from 'vitest'
import { getMessages, type Messages } from './index'
import { flattenMessages } from './format'
import { buildGuestSheet } from '../guest-guide'

/*
 * Französisch und Spanisch (19.10.2026), alle Bereiche außer den
 * Rechtstexten. Wächter wie für Englisch, für beide Sprachen in einer Datei:
 * gleiche Schlüssel und Datenfelder wie Deutsch, Platzhalter und Tags,
 * keine deutschen Reste, Typografie, Anrede (Glossar
 * `Sessions/Glossar-fr-es-2026-10-19.md`) und wortgleiche Knöpfe.
 */
const AREAS = ['guest', 'service', 'admin', 'mail', 'print', 'auth', 'account', 'simulator', 'help', 'symbols', 'landing'] as const
const DATA_KEY = /\.(art|id|ton|icon|href)$/
const de = getMessages('de')

const tokens = (text: string) => [...(text.match(/\{\w+\}|<\/?\w+>/g) ?? [])].sort()
const texts = (obj: object) => flattenMessages(obj).filter(([k]) => !DATA_KEY.test(k))
/** Quellentitel des Nutzenrechners bleiben im Original. */
const isSource = (area: string, key: string) => area === 'landing' && key.startsWith('roi.sources.items')

const langs = [
  { lang: 'fr' as const, open: '« ', close: ' »' },
  { lang: 'es' as const, open: '«', close: '»' },
]

describe.each(langs)('$lang — alle Bereiche', ({ lang }) => {
  const m = getMessages(lang)

  describe.each(AREAS)('%s', area => {
    const deArea = de[area] as object
    const area_ = m[area] as object
    const deAll = texts(deArea)
    const all = new Map(texts(area_))

    it('ist übersetzt, nicht aus dem Deutschen übernommen', () => {
      expect(area_).not.toBe(deArea)
    })

    it('hat dieselben Schlüssel und Datenfelder wie Deutsch', () => {
      expect([...all.keys()].sort()).toEqual(deAll.map(([k]) => k).sort())
      const deData = flattenMessages(deArea).filter(([k]) => DATA_KEY.test(k))
      const data = new Map(flattenMessages(area_).filter(([k]) => DATA_KEY.test(k)))
      expect(deData.filter(([k, v]) => data.get(k) !== v)).toEqual([])
    })

    it('behält Platzhalter und Tags', () => {
      expect(deAll.filter(([k, t]) => tokens(t).join() !== tokens(all.get(k) ?? '').join()).map(([k]) => k)).toEqual([])
    })

    it('enthält keine deutschen Reste', () => {
      // „ü“ ist auch spanisch (antigüedad), deshalb dort ausgenommen.
      const umlaut = lang === 'es' ? /[äöÄÖß„]/ : /[äöüÄÖÜß„]/
      expect([...all].filter(([k, t]) => !isSource(area, k) && (umlaut.test(t) || /\b(und|oder|Zimmer|Etage|bitte|nicht|Uhr)\b/.test(t)))).toEqual([])
    })

    it('setzt keine geraden Anführungszeichen und keine drei Punkte', () => {
      expect([...all].filter(([k, t]) => !isSource(area, k) && (t.includes('"') || t.includes('...')))).toEqual([])
    })
  })
})

describe('Französisch — Typografie und Anrede', () => {
  const all = AREAS.flatMap(a => texts(getMessages('fr')[a]).filter(([k]) => !isSource(a, k)).map(([k, t]) => [`${a}.${k}`, t] as const))

  it('schützt das Leerzeichen vor ; ! ? : und innen an « » (scripts/fr-typo.mjs)', () => {
    const bad = all.filter(([, t]) =>
      / [;:!?»]/.test(t) || /« /.test(t) || /[\p{L}}>»][;!?](\s|$)/u.test(t) || /[\p{L}}>»]:(\s|$)/u.test(t),
    )
    expect(bad).toEqual([])
  })

  it('setzt « » paarweise', () => {
    expect(all.filter(([, t]) => (t.match(/«/g) ?? []).length !== (t.match(/»/g) ?? []).length)).toEqual([])
  })

  it('siezt überall, ohne „(e)“-Formen', () => {
    expect(all.filter(([, t]) => /(?<!\p{L})(tu|toi|ton|ta|tes)(?!\p{L})/iu.test(t))).toEqual([])
    expect(all.filter(([, t]) => /\p{L}\(e\)/u.test(t))).toEqual([])
  })
})

describe('Spanisch — Typografie und Anrede', () => {
  const es = getMessages('es')
  const all = AREAS.flatMap(a => texts(es[a]).filter(([k]) => !isSource(a, k)).map(([k, t]) => [`${a}.${k}`, t] as const))

  it('setzt «» ohne Leerzeichen innen und paarweise', () => {
    expect(all.filter(([, t]) => /« | »/.test(t))).toEqual([])
    expect(all.filter(([, t]) => (t.match(/«/g) ?? []).length !== (t.match(/»/g) ?? []).length)).toEqual([])
  })

  it('eröffnet Fragen und Ausrufe mit ¿ und ¡', () => {
    // «?» ist der Hilfe-Knopf, kein Fragezeichen.
    expect(all.filter(([, t]) => (t.replaceAll('«?»', '').match(/\?/g) ?? []).length > (t.match(/¿/g) ?? []).length)).toEqual([])
    expect(all.filter(([, t]) => (t.match(/!/g) ?? []).length > (t.match(/¡/g) ?? []).length)).toEqual([])
  })

  it('kein „vosotros“ und kein „coger“ (neutraler Wortschatz)', () => {
    expect(all.filter(([, t]) => /\b(vosotros|vosotras|vuestr[oa]s?|coger|cogi\w*)\b/i.test(t))).toEqual([])
  })

  it('duzt die Reinigungskräfte und siezt den Gast', () => {
    expect(texts(es.service).filter(([, t]) => /\busted(es)?\b/i.test(t))).toEqual([])
    expect(texts(es.guest).filter(([, t]) => /\b(tú|tu|tus|te|ti)\b/i.test(t))).toEqual([])
  })
})

describe.each(langs)('$lang — Knöpfe wortgleich', ({ lang, open, close }) => {
  const m: Messages = getMessages(lang)
  const q = (label: string) => `${open}${label}${close}`

  it('Knöpfe des Gästeportals sind kurz genug fürs Blatt', () => {
    for (const label of [m.guest.signal.clean.label, m.guest.signal.dnd.label, m.guest.services.heading]) {
      expect(label.length, label).toBeLessThanOrEqual(22)
    }
    expect(m.guest.signal.skip.label.length).toBeLessThanOrEqual(26)
  })

  it('das Gästeportal zitiert seine Knöpfe wortgleich', () => {
    expect(m.guest.status.done.text).toContain(q(m.guest.signal.clean.label))
    expect(m.guest.status.dnd.text).toContain(q(m.guest.signal.dnd.label))
    expect(m.guest.status.scheduledFrom.daily).toContain(q(m.guest.signal.skip.label))
  })

  it('Reinigungsboard, Übersicht und Vorschau sprechen wie das Gästeportal', () => {
    expect(m.service.board.state.dnd).toBe(m.guest.signal.dnd.label)
    expect(m.service.board.state.declined).toBe(m.guest.signal.skip.label)
    expect(m.admin.overview.status.dnd).toBe(m.guest.signal.dnd.label)
    expect(m.admin.overview.status.declined).toBe(m.guest.signal.skip.label)
    expect(m.landing.demo.guest.clean).toBe(m.guest.signal.clean.label)
    expect(m.landing.demo.guest.dnd).toBe(m.guest.signal.dnd.label)
    expect(m.landing.demo.board.finish).toBe(m.service.board.finish)
  })

  it('der Tür-Hinweis nennt die drei Knöpfe wortgleich', () => {
    for (const label of [m.service.board.door.in30, m.service.board.door.in60, m.service.board.door.today]) {
      expect(m.service.board.door.hint).toContain(q(label))
    }
  })

  it('die Hilfe nennt die Seiten wie die Verwaltung', () => {
    expect(m.help.topics.regeln.title).toBe(m.admin.settings.house.title)
    expect(m.help.topics.gastzugang.title).toBe(m.admin.settings.guestAccess.title)
    expect(m.help.topics.zugang.title).toBe(m.admin.settings.myAccess.title)
  })

  it('das Blatt in dieser Sprache trägt die Knöpfe des Portals', () => {
    const sheet = buildGuestSheet({}, { accessMode: 'pin', deepLink: true }, lang)
    expect(sheet.buttons.clean.label).toBe(m.guest.signal.clean.label)
    expect(sheet.buttons.services.label).toBe(m.guest.services.heading)
  })
})
