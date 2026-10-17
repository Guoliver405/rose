import type { LooseContext } from '../format'
import type { AuthMessages } from './auth'

/**
 * Erläuterungen zu Anmeldung, Registrierung und Passwort für Übersetzer
 * (17.10.2026). Leser: Inhaber, Manager, Rezeption — gesiezt, knapp.
 */
export const authContext = {
  login: { where: 'Seite „Anmeldung“ der Verwaltung (/login)', note: '<link>…</link> wird zum Link auf die Registrierung.' },
  signup: { where: 'Seite „Konto anlegen“ (/registrieren) für neue Häuser', note: '{min} = Mindestlänge des Passworts. <terms>/<privacy> werden zu Links auf AGB und Datenschutzerklärung, <link> zur Anmeldung.' },
  forgot: { where: 'Seite „Passwort zurücksetzen“ (/passwort-vergessen)', note: '{email} = eingegebene Adresse (<code> = Festschrift), {seconds} = Wartezeit. Bewusst unbestimmt („falls es ein Konto gibt“), damit die Seite nicht verrät, welche Adressen ein Konto haben.' },
  newPassword: { where: 'Seite „Neues Passwort“ nach dem Link aus Einladung bzw. Passwort-Mail (/passwort-neu)', note: '{email}, {min}. <b> = fett.' },
  errors: { where: 'Fehlermeldungen von Anmeldung, Registrierung und Passwort', note: '{min}, {detail} (technische Meldung, unübersetzt).' },
} satisfies LooseContext<AuthMessages>
