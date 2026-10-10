/**
 * Vorlagen für Verweise im Service-Baukasten (16.09.2026).
 *
 * Ein Verweis ist eine Kachel im Gastportal, die einen Link nach außen
 * öffnet — Trinkgeld-App fürs Housekeeping, Lieferdienst, Taxi. RoSe bildet
 * die Leistung nicht ab und hat keine Schnittstelle; das Haus kuratiert, RoSe
 * liefert die Vorlage. Die Vorlagen füllen nur das Formular vor (Name,
 * Beschreibung, Startadresse) — angelegt wird erst mit „Anlegen", damit das
 * Haus die Adresse auf sein Konto oder seine Stadt anpassen kann.
 *
 * Bewusst KEINE Vorlage mit Konto-Bezug: Die Adresse einer Trinkgeld-App ist
 * je Haus verschieden, die Vorlage bleibt deshalb ohne URL und sagt, was
 * einzutragen ist. Regionen sind eine Lesehilfe, keine Sperre.
 */

/**
 * Texte der Vorlagen aus der Sprachdatei (`admin.services.linkTemplates`).
 * Sie kommen als Parameter herein statt per Import: Der Konfigurator ist eine
 * Client-Komponente, und ein Import der Sprachdatei legte die deutsche
 * Fassung fest ins Browser-Bundle. Strukturell beschrieben, damit diese Datei
 * nichts aus `@/lib/i18n` braucht.
 */
export type ServiceLinkTemplateTexts = {
  names: Record<TemplateKind, string>
  descriptions: Record<TemplateKind, string>
  regions: Record<TemplateRegion, string>
  hints: Record<TemplateId, string>
}

type TemplateKind = 'tip' | 'food'
type TemplateRegion = 'everywhere' | 'germany' | 'germanyNordicsJapan' | 'worldwide' | 'southeastAsia' | 'asia'
type TemplateId = 'tip' | 'lieferando' | 'wolt' | 'ubereats' | 'grab' | 'foodpanda'

/** Daten einer Vorlage — Markenname und Adresse werden nicht übersetzt. */
type TemplateData = {
  id: TemplateId
  kind: TemplateKind
  /** Name des Dienstes; null bei der Trinkgeld-Vorlage (je Haus eine andere App). */
  brand: string | null
  /** Startadresse; leer, wenn das Haus sie zwingend selbst kennt (Trinkgeld-App). */
  url: string
  /** Wo der Dienst üblich ist — nur zur Orientierung im Konfigurator. */
  region: TemplateRegion
}

export type ServiceLinkTemplate = {
  id: string
  name: string
  description: string
  /** Startadresse; leer, wenn das Haus sie zwingend selbst kennt (Trinkgeld-App). */
  url: string
  /** Wo der Dienst üblich ist — nur zur Orientierung im Konfigurator. */
  region: string
  /** Hinweis fürs Haus, was an der Adresse anzupassen ist. */
  hinweis: string
}

const TEMPLATE_DATA: TemplateData[] = [
  { id: 'tip', kind: 'tip', brand: null, url: '', region: 'everywhere' },
  { id: 'lieferando', kind: 'food', brand: 'Lieferando', url: 'https://www.lieferando.de/', region: 'germany' },
  { id: 'wolt', kind: 'food', brand: 'Wolt', url: 'https://wolt.com/', region: 'germanyNordicsJapan' },
  { id: 'ubereats', kind: 'food', brand: 'Uber Eats', url: 'https://www.ubereats.com/', region: 'worldwide' },
  { id: 'grab', kind: 'food', brand: 'GrabFood', url: 'https://food.grab.com/', region: 'southeastAsia' },
  { id: 'foodpanda', kind: 'food', brand: 'foodpanda', url: 'https://www.foodpanda.com/', region: 'asia' },
]

/** Platzhalter `{brand}` einsetzen — bewusst ohne Import aus `@/lib/i18n`. */
function withBrand(text: string, brand: string | null): string {
  return brand ? text.replace(/\{brand\}/g, brand) : text
}

/** Vorlagen in der Sprache der Texte. */
export function serviceLinkTemplates(texts: ServiceLinkTemplateTexts): ServiceLinkTemplate[] {
  return TEMPLATE_DATA.map(t => ({
    id: t.id,
    name: withBrand(texts.names[t.kind], t.brand),
    description: withBrand(texts.descriptions[t.kind], t.brand),
    url: t.url,
    region: texts.regions[t.region],
    hinweis: withBrand(texts.hints[t.id], t.brand),
  }))
}

/**
 * Gültige Adresse für einen Verweis: absolut, http oder https, nichts anderes.
 * Der Gast öffnet den Link auf dem Handy in einem neuen Tab — ein
 * `javascript:`- oder `data:`-Ziel darf dort nie landen. Liefert die
 * normalisierte Adresse oder null.
 */
export function normalizeLinkUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  if (!parsed.hostname.includes('.')) return null
  if (parsed.href.length > 2000) return null
  return parsed.href
}
