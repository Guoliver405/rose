import type { Metadata } from 'next'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'
import { LegalView, legalVars } from '../ui'

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getMessages(await getLocale()).legal.datenschutz
  return { title: format(meta.title, legalVars()), description: format(meta.description, legalVars()) }
}

/**
 * Datenschutzerklärung für Website und Dienst.
 *
 * Die tragende Unterscheidung: Für **Besucher der Website und Kunden**
 * (Kontoinhaber, Manager, Rezeption) ist der Anbieter selbst Verantwortlicher.
 * Für die Daten, die ein Hotel IN RoSe verarbeitet — Gäste-Aufenthalte,
 * Personal, Tätigkeitsnachweise — ist das **Hotel** Verantwortlicher und der
 * Anbieter Auftragsverarbeiter (Art. 28 DSGVO). Beides steht hier, weil Gäste
 * und Reinigungskräfte diese Seite über die Fußzeile ihrer Portale erreichen
 * und dort erfahren sollen, was mit ihren Daten geschieht — auch wenn ihr
 * eigentlicher Ansprechpartner das Haus ist.
 *
 * Fakten aus dem Code, nicht aus einer Vorlage: keine Analyse-Werkzeuge, keine
 * Einwilligungs-Banner (nur technisch notwendige Cookies), Gäste anonym, die
 * Mail-Adresse eines Gastes wird nicht in RoSe gespeichert (wohl aber im
 * Zustellprotokoll des Mail-Dienstleisters), Fehlversuche der Gast-Anmeldung
 * nur als IP-Hash für 15 Minuten. Seit 06.09.2026 Abschnitt 6 zu Stripe:
 * Rechnungsdaten und Zahlungsmittel gehen an Stripe Payments Europe (Irland),
 * RoSe speichert weder Kartendaten noch IBAN, nur Kennung und letzte Ziffern;
 * Stripe verschickt Rechnungen und Erinnerungen. Stripe ist KEIN
 * Unterauftragsverarbeiter der Hotels — es verarbeitet die Daten des Kunden
 * (Firma, Inhaber), nicht die seiner Gäste; deshalb steht es nicht in § 8 AGB.
 *
 * Wortlaut seit 11.10.2026 in `src/lib/i18n/de/legal/datenschutz.ts`.
 */
export default async function DatenschutzPage() {
  const m = getMessages(await getLocale()).legal
  return <LegalView page={m.datenschutz} common={m.common} />
}
