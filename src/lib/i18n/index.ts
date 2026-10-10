import { guest } from './de/guest'
import { service } from './de/service'

/**
 * Sprachen und Texte der Oberfläche. Ausgelagert sind bisher Gästeportal und Reinigungsboard;
 * die übrigen Bereiche folgen nacheinander (Plan in `TODO.md`, Begriffe in
 * `Sessions/Begriffe-Entscheidungen.md`).
 *
 * Eine weitere Sprache kommt als eigener Ordner dazu (`en/guest.ts` mit
 * `satisfies Shape<GuestMessages>`) und wird hier in `MESSAGES` eingetragen.
 */
export { flattenMessages, format, parseRich, plural, type PluralForms, type Shape, type Vars } from './format'
export type { GuestMessages } from './de/guest'
export type { ServiceMessages } from './de/service'

export const LOCALES = ['de'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'de'

const MESSAGES = {
  de: { guest, service },
} satisfies Record<Locale, unknown>

export type Messages = (typeof MESSAGES)['de']

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}

/** Sprach-Tag für `Intl`/`toLocale…String` — Uhrzeiten und Beträge im Format der Sprache. */
export function intlLocale(locale: Locale): string {
  return { de: 'de-DE' }[locale]
}
