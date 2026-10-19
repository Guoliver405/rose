/**
 * Sprachen der Oberfläche — nur Kennungen und Regeln, keine Texte. Getrennt
 * vom Index, damit Browser-Komponenten (Sprach-Umschalter) die Liste kennen,
 * ohne alle Sprachdateien ins Bundle zu ziehen.
 *
 * Welche Sprache ein Gerät sieht (Bauplan `Sessions/Sprachen-des-Hauses-Plan-2026-10-17.md`):
 * eigene Wahl (Cookie) → Sprache des Geräts (`Accept-Language`), soweit
 * angeboten → Rückfallsprache des Hauses → `DEFAULT_LOCALE`.
 *
 * Seit 17.10.2026 gibt es Englisch, seit 19.10.2026 Französisch und
 * Spanisch — jeweils für alle Bereiche außer den Rechtstexten.
 *
 * Ohne I/O, getestet in `locales.test.ts`.
 */
export const LOCALES = ['de', 'en', 'fr', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'de'

/** Sprachen, in denen das Gästeportal vollständig übersetzt ist. */
export const GUEST_LOCALES: readonly Locale[] = ['de', 'en', 'fr', 'es']

/** Sprachen, in denen das Reinigungsboard vollständig übersetzt ist (seit 17.10.2026). */
export const SERVICE_LOCALES: readonly Locale[] = ['de', 'en', 'fr', 'es']

/**
 * Sprachen der Verwaltung (Rezeptions-Portal, Mails, Druckseiten, Hilfe und
 * Lotsen, Konto und Abrechnung, Anmeldung, Simulator, Landing Page; seit
 * 17.10.2026). Rechnungen folgen nicht der Oberfläche, sondern dem Land der
 * Rechnungsanschrift (`invoiceLocale` in `lib/invoice.ts`).
 */
export const ADMIN_LOCALES: readonly Locale[] = ['de', 'en', 'fr', 'es']

/** Name jeder Sprache in ihrer eigenen Schreibweise — für den Umschalter, keine Flaggen. */
export const LOCALE_NAMES: Record<Locale, string> = { de: 'Deutsch', en: 'English', fr: 'Français', es: 'Español' }

/** Sprach-Tag für `Intl`/`toLocale…String`. */
export const INTL_LOCALES: Record<Locale, string> = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES' }

/** Cookie der eigenen Sprachwahl — unabhängig vom Aufenthalt, übersteht den Check-out. */
export const LOCALE_COOKIE = 'rose_lang'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Heimatsprache des Hauses (`policies.homeLanguage`, seit 17.10.2026): die
 * Sprache, in der es seine Inhalte anlegt (Service-Baukasten). Vorgabe Deutsch.
 */
export function parseHomeLanguage(policies: Record<string, unknown>): Locale {
  return isLocale(policies.homeLanguage) ? policies.homeLanguage : DEFAULT_LOCALE
}

/**
 * Rückfallsprache des Hauses (`policies.fallbackLanguage`): die sehen alle
 * Portale, wenn das Gerät eine Sprache hat, die nicht angeboten wird. Sie ist
 * zugleich die erste Sprache der gedruckten Blätter (`parseSheetLanguages`).
 *
 * Nicht gesetzt: zuerst die erste Blatt-Sprache aus der Zeit vor der Kopplung
 * (`sheetLanguage`), soweit das Portal sie kennt — damit Blatt und Rückfall
 * schon vor dem ersten Speichern zusammenpassen —, dann die Heimatsprache.
 */
export function parseFallbackLanguage(policies: Record<string, unknown>): Locale {
  if (isLocale(policies.fallbackLanguage)) return policies.fallbackLanguage
  if (isLocale(policies.sheetLanguage)) return policies.sheetLanguage
  return parseHomeLanguage(policies)
}

/**
 * Erste angebotene Sprache aus `Accept-Language`, nach Gewichtung (`q`).
 * Regionen zählen zur Sprache: `en-GB` trifft `en`.
 */
export function matchAcceptLanguage(header: string | null | undefined, offered: readonly Locale[]): Locale | null {
  if (!header) return null
  const wanted = header
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map(p => p.trim()).find(p => p.startsWith('q='))
      return { lang: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) : 1, i }
    })
    .filter(w => w.lang && w.lang !== '*' && !Number.isNaN(w.q) && w.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
  for (const w of wanted) {
    const hit = offered.find(l => l === w.lang)
    if (hit) return hit
  }
  return null
}

/** Die Reihenfolge der Sprachwahl an einer Stelle. */
export function resolveLocale(args: {
  chosen?: string | null
  acceptLanguage?: string | null
  fallback?: Locale
  offered?: readonly Locale[]
}): Locale {
  const offered = args.offered ?? LOCALES
  if (isLocale(args.chosen) && offered.includes(args.chosen)) return args.chosen
  const device = matchAcceptLanguage(args.acceptLanguage, offered)
  if (device) return device
  if (args.fallback && offered.includes(args.fallback)) return args.fallback
  return DEFAULT_LOCALE
}
