/**
 * Mehrsprachiger Service-Baukasten (17.10.2026, Bauplan
 * `Sessions/Sprachen-des-Hauses-Plan-2026-10-17.md`, Abschnitt 3).
 *
 * Das Haus legt Services in seiner Heimatsprache an und übersetzt selbst —
 * bewusst ohne automatische Übersetzung: Jeder Wortlaut (Beschreibung,
 * Preis-Option) ist ein Versprechen des Hauses an den Gast. Die Grundtexte
 * stehen in den Spalten `name`/`description`/`label`, ihre Sprache in
 * `service_definitions.lang`, die Übersetzungen als jsonb je Sprache.
 *
 * Drei Regeln:
 * - **Rückfall je Feld:** Fehlt eine Übersetzung, sieht der Gast den
 *   Grundtext — nie ein leeres Feld. Ein halb übersetzter Service bleibt
 *   brauchbar.
 * - **Drängen, nicht sperren:** `missingLanguages` sagt dem Baukasten, wo
 *   etwas fehlt; gespeichert werden darf immer.
 * - **Die Rezeption sieht die Grundtexte:** Anfragen frieren sie ein.
 *
 * Ohne I/O, getestet in `service-i18n.test.ts`. Browser-tauglich (kein Import
 * des Sprachindex).
 */
import { isLocale, type Locale } from './i18n/locales'

export type ServiceText = { name?: string; description?: string }
export type ItemText = { label?: string }
export type ServiceTranslations = Partial<Record<Locale, ServiceText>>
export type ItemTranslations = Partial<Record<Locale, ItemText>>

const clean = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim().slice(0, max)
  return t || undefined
}

/** Übersetzungen eines Service aus DB oder Formular: nur bekannte Sprachen und Felder, leere fallen weg. */
export function parseServiceTranslations(raw: unknown): ServiceTranslations {
  const out: ServiceTranslations = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [lang, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isLocale(lang) || !value || typeof value !== 'object') continue
    const v = value as Record<string, unknown>
    const text: ServiceText = { name: clean(v.name, 120), description: clean(v.description, 500) }
    if (!text.name) delete text.name
    if (!text.description) delete text.description
    if (Object.keys(text).length > 0) out[lang] = text
  }
  return out
}

/** Übersetzungen einer Option. */
export function parseItemTranslations(raw: unknown): ItemTranslations {
  const out: ItemTranslations = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [lang, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isLocale(lang) || !value || typeof value !== 'object') continue
    const label = clean((value as Record<string, unknown>).label, 120)
    if (label) out[lang] = { label }
  }
  return out
}

/** Sprache der Grundtexte; unbekannt ⇒ Deutsch (Bestand vor der Migration). */
export function serviceLang(raw: unknown): Locale {
  return isLocale(raw) ? raw : 'de'
}

/** Name und Beschreibung in der Sprache des Gastes — je Feld, sonst der Grundtext. */
export function localizeService(
  s: { name: string; description: string | null; lang: Locale; translations: ServiceTranslations },
  locale: Locale,
): { name: string; description: string | null } {
  if (locale === s.lang) return { name: s.name, description: s.description }
  const t = s.translations[locale]
  return {
    name: t?.name ?? s.name,
    // Ohne Grundbeschreibung keine Beschreibung — eine Übersetzung ohne Original wäre verwaist.
    description: s.description ? (t?.description ?? s.description) : null,
  }
}

/** Beschriftung einer Option in der Sprache des Gastes. */
export function localizeItem(i: { label: string; translations: ItemTranslations }, serviceLangValue: Locale, locale: Locale): string {
  if (locale === serviceLangValue) return i.label
  return i.translations[locale]?.label ?? i.label
}

/**
 * Sprachen, in denen an einem Service noch etwas fehlt: Name, Beschreibung
 * (nur wenn es eine gibt) oder eine Option. Die Sprache der Grundtexte zählt
 * nie als fehlend.
 */
export function missingLanguages(
  s: { description: string | null; lang: Locale; translations: ServiceTranslations },
  items: { translations: ItemTranslations }[],
  offered: readonly Locale[],
): Locale[] {
  return offered.filter(locale => {
    if (locale === s.lang) return false
    const t = s.translations[locale]
    if (!t?.name) return true
    if (s.description && !t.description) return true
    return items.some(i => !i.translations[locale]?.label)
  })
}

// ── Vorlagen (Beispiel-Services) ────────────────────────────────────────────

/** Text einer Vorlage in allen Produktsprachen, die sie mitbringt. */
export type TemplateText = Partial<Record<Locale, string>>
export type ServiceTemplate = {
  name: TemplateText
  description: TemplateText
  urgent: boolean
  maintenance: boolean
  items: { label: TemplateText; price_cents: number | null }[]
}

/**
 * Vorlage für ein Haus aufbereiten: Grundtexte in seiner Heimatsprache
 * (fehlt sie in der Vorlage, Deutsch), alle übrigen Sprachen als
 * Übersetzungen — so ist ein Beispiel-Service von Anfang an übersetzt.
 */
export function templateForHome(t: ServiceTemplate, home: Locale) {
  const base: Locale = t.name[home] ? home : 'de'
  const others = (Object.keys(t.name) as Locale[]).filter(l => l !== base)
  const translations: ServiceTranslations = {}
  for (const l of others) {
    translations[l] = { name: t.name[l], ...(t.description[l] ? { description: t.description[l] } : {}) }
  }
  return {
    lang: base,
    name: t.name[base] ?? '',
    description: t.description[base] ?? null,
    urgent: t.urgent,
    maintenance: t.maintenance,
    translations,
    items: t.items.map(i => {
      const tr: ItemTranslations = {}
      for (const l of others) if (i.label[l]) tr[l] = { label: i.label[l] }
      return { label: i.label[base] ?? '', price_cents: i.price_cents, translations: tr }
    }),
  }
}
