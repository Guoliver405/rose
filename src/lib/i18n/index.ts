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
import { guest as enGuest } from './en/guest'
import { service as enService } from './en/service'
import { admin as enAdmin } from './en/admin'
import { mail as enMail } from './en/mail'
import { print as enPrint } from './en/print'
import { help as enHelp } from './en/help'
import { symbols as enSymbols } from './en/symbols'
import { account as enAccount } from './en/account'
import { auth as enAuth } from './en/auth'
import { simulator as enSimulator } from './en/simulator'
import { landing as enLanding } from './en/landing'
import { legalCommon as enLegalCommon } from './en/legal'
import { guest as frGuest } from './fr/guest'
import { service as frService } from './fr/service'
import { admin as frAdmin } from './fr/admin'
import { mail as frMail } from './fr/mail'
import { print as frPrint } from './fr/print'
import { help as frHelp } from './fr/help'
import { symbols as frSymbols } from './fr/symbols'
import { account as frAccount } from './fr/account'
import { auth as frAuth } from './fr/auth'
import { simulator as frSimulator } from './fr/simulator'
import { landing as frLanding } from './fr/landing'
import { legalCommon as frLegalCommon } from './fr/legal'
import { guest as esGuest } from './es/guest'
import { service as esService } from './es/service'
import { admin as esAdmin } from './es/admin'
import { mail as esMail } from './es/mail'
import { print as esPrint } from './es/print'
import { help as esHelp } from './es/help'
import { symbols as esSymbols } from './es/symbols'
import { account as esAccount } from './es/account'
import { auth as esAuth } from './es/auth'
import { simulator as esSimulator } from './es/simulator'
import { landing as esLanding } from './es/landing'
import { legalCommon as esLegalCommon } from './es/legal'
import { DEFAULT_LOCALE, INTL_LOCALES, type Locale } from './locales'

/**
 * Sprachen und Texte der Oberfläche. Ausgelagert sind Gästeportal, Reinigungsboard, Mails, Druckseiten,
 * Rezeption, Anmeldung, Konto, Simulator und Hilfe (die gedruckten Blätter haben eigene Sprachen, siehe
 * `sheets.ts`); es folgen die Landing Page und die Rechtstexte (Plan in `TODO.md`, Begriffe in
 * `Sessions/Begriffe-Entscheidungen.md`).
 *
 * Eine weitere Sprache kommt als eigener Ordner dazu (`en/guest.ts` mit
 * `satisfies Shape<GuestMessages>`), wird hier in `MESSAGES` eingetragen und
 * in `locales.ts` freigeschaltet. Englisch seit 17.10.2026, Französisch und
 * Spanisch seit 19.10.2026 (Glossar `Sessions/Glossar-fr-es-2026-10-19.md`).
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

export {
  ADMIN_LOCALES, DEFAULT_LOCALE, GUEST_LOCALES, SERVICE_LOCALES, INTL_LOCALES, LOCALE_COOKIE, LOCALE_NAMES, LOCALES,
  isLocale, matchAcceptLanguage, parseFallbackLanguage, parseHomeLanguage, resolveLocale, type Locale,
} from './locales'

const de = { guest, service, mail, print, admin, auth, account, simulator, help, symbols, landing, legal }
export type Messages = typeof de

/**
 * Je Sprache der ganze Satz Texte. Aus dem Deutschen kommen nur noch die
 * Rechtstexte (bis zur anwaltlichen Prüfung nur auf Deutsch).
 */
const MESSAGES: Record<Locale, Messages> = {
  de,
  en: { ...de, guest: enGuest, service: enService, admin: enAdmin, mail: enMail, print: enPrint, help: enHelp, symbols: enSymbols, account: enAccount, auth: enAuth, simulator: enSimulator, landing: enLanding, legal: { ...de.legal, common: enLegalCommon } },
  fr: { ...de, guest: frGuest, service: frService, admin: frAdmin, mail: frMail, print: frPrint, help: frHelp, symbols: frSymbols, account: frAccount, auth: frAuth, simulator: frSimulator, landing: frLanding, legal: { ...de.legal, common: frLegalCommon } },
  es: { ...de, guest: esGuest, service: esService, admin: esAdmin, mail: esMail, print: esPrint, help: esHelp, symbols: esSymbols, account: esAccount, auth: esAuth, simulator: esSimulator, landing: esLanding, legal: { ...de.legal, common: esLegalCommon } },
}

export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}

/** Sprach-Tag für `Intl`/`toLocale…String` — Uhrzeiten und Beträge im Format der Sprache. */
export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale]
}
