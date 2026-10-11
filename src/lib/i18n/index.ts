import { guest } from './de/guest'
import { service } from './de/service'
import { mail } from './de/mail'
import { print } from './de/print'
import { admin } from './de/admin'
import { auth } from './de/auth'
import { account } from './de/account'
import { simulator } from './de/simulator'
import { help } from './de/help'
import { symbols } from './de/symbols'
import { landing } from './de/landing'
import { legal } from './de/legal'

/**
 * Sprachen und Texte der Oberfläche. Ausgelagert sind Gästeportal, Reinigungsboard, Mails, Druckseiten,
 * Rezeption, Anmeldung, Konto, Simulator und Hilfe (die gedruckten Blätter haben eigene Sprachen, siehe
 * `sheets.ts`); es folgen die Landing Page und die Rechtstexte (Plan in `TODO.md`, Begriffe in
 * `Sessions/Begriffe-Entscheidungen.md`).
 *
 * Eine weitere Sprache kommt als eigener Ordner dazu (`en/guest.ts` mit
 * `satisfies Shape<GuestMessages>`) und wird hier in `MESSAGES` eingetragen.
 */
export { flattenMessages, format, parseRich, plural, type PluralForms, type Shape, type Vars } from './format'
export type { GuestMessages } from './de/guest'
export type { ServiceMessages } from './de/service'
export type { MailMessages } from './de/mail'
export type { PrintMessages } from './de/print'
export type { AdminMessages } from './de/admin'
export type { AuthMessages } from './de/auth'
export type { AccountMessages } from './de/account'
export type { SimulatorMessages } from './de/simulator'
export type { HelpMessages } from './de/help'
export type { SymbolsMessages } from './de/symbols'
export type { LandingMessages } from './de/landing'
export type { LegalMessages } from './de/legal'

export const LOCALES = ['de'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'de'

const MESSAGES = {
  de: { guest, service, mail, print, admin, auth, account, simulator, help, symbols, landing, legal },
} satisfies Record<Locale, unknown>

export type Messages = (typeof MESSAGES)['de']

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}

/** Sprach-Tag für `Intl`/`toLocale…String` — Uhrzeiten und Beträge im Format der Sprache. */
export function intlLocale(locale: Locale): string {
  return { de: 'de-DE' }[locale]
}
