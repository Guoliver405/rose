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

export const SERVICE_LINK_TEMPLATES: ServiceLinkTemplate[] = [
  {
    id: 'tip',
    name: 'Trinkgeld fürs Housekeeping',
    description: 'Bargeldlos Danke sagen — das Trinkgeld geht an das Reinigungsteam.',
    url: '',
    region: 'überall',
    hinweis: 'Die Adresse aus Ihrer Trinkgeld-App eintragen (der QR-Code der App enthält genau diesen Link). Ein Link für das ganze Team — das Gastportal nennt keine Namen.',
  },
  {
    id: 'lieferando',
    name: 'Essen bestellen — Lieferando',
    description: 'Restaurants in der Nähe liefern direkt ans Hotel.',
    url: 'https://www.lieferando.de/',
    region: 'Deutschland',
    hinweis: 'Besser als die Startseite: die Adresse Ihrer Straße oder Postleitzahl aus der Lieferando-Suche einsetzen, dann sieht der Gast sofort die Restaurants, die zu Ihnen liefern.',
  },
  {
    id: 'wolt',
    name: 'Essen bestellen — Wolt',
    description: 'Restaurants in der Nähe liefern direkt ans Hotel.',
    url: 'https://wolt.com/',
    region: 'Deutschland, Nordeuropa, Japan',
    hinweis: 'Stadtseite von Wolt einsetzen (z. B. …/de/deu/berlin), dann landet der Gast nicht auf der Länderauswahl.',
  },
  {
    id: 'ubereats',
    name: 'Essen bestellen — Uber Eats',
    description: 'Restaurants in der Nähe liefern direkt ans Hotel.',
    url: 'https://www.ubereats.com/',
    region: 'weltweit',
    hinweis: 'Die Adresse mit Ihrer Stadt aus der Uber-Eats-Suche einsetzen.',
  },
  {
    id: 'grab',
    name: 'Essen bestellen — GrabFood',
    description: 'Restaurants in der Nähe liefern direkt ans Hotel.',
    url: 'https://food.grab.com/',
    region: 'Südostasien',
    hinweis: 'Landes- oder Stadtseite von GrabFood einsetzen.',
  },
  {
    id: 'foodpanda',
    name: 'Essen bestellen — foodpanda',
    description: 'Restaurants in der Nähe liefern direkt ans Hotel.',
    url: 'https://www.foodpanda.com/',
    region: 'Asien',
    hinweis: 'Landesseite von foodpanda einsetzen.',
  },
]

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
