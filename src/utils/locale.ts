import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

/**
 * Sprache der laufenden Anfrage. Heute gibt es nur Deutsch; hier entscheidet
 * sich später, welche Sprache ein Gast sieht (eigene Wahl im Portal, sonst
 * `Accept-Language`) — unabhängig von der Sprache des Hauses. Asynchron, weil
 * genau das Cookies und Header lesen wird.
 */
export async function getLocale(): Promise<Locale> {
  return DEFAULT_LOCALE
}
