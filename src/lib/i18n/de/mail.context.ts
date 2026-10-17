import type { LooseContext } from '../format'
import type { MailMessages } from './mail'

/**
 * Erläuterungen zum Mail-Versand für Übersetzer (17.10.2026). Leser der
 * E-Mails sind Personal und Kontoinhaber (gesiezt); die Statuszeile liest die
 * Verwaltung unter einem Sende-Knopf.
 */
export const mailContext = {
  templates: {
    _: { where: 'E-Mail-Vorlagen (Einladung, Passwort-Link, Simulator-Konto)', note: 'Nach der Anrede („Guten Tag,“) beginnt der nächste Satz klein. {role} = Rolle, {hotel} = Haus, {name}, {by} = einladende Person, {tool} = Name des Simulators, {url} = Adresse.' },
  },
  status: { where: 'Statuszeile unter einem Sende-Knopf: Zustand der E-Mail', note: '{detail} = Grund des Empfänger-Servers, unübersetzt (oft Englisch).' },
  line: { where: 'Statuszeile unter einem Sende-Knopf: Überschriften und Hilfen', note: '{seconds}, {recipient}, {origin} (Satzanfang aus „origin“), {since} (Datum, mit Leerzeichen davor), {domain}, {count}, {detail}. <code> = Domain im Festschriftsatz.' },
  errors: { where: 'Fehlermeldungen des Versands', note: '„Resend“ ist der Name des Versanddienstes; {status} = HTTP-Code, {detail} = technische Meldung.' },
  fromVia: { where: 'Absendername der E-Mail', note: '{hotel} = Name des Hauses; „via RoSe“ bleibt.' },
} satisfies LooseContext<MailMessages>
