import type { Metadata } from 'next'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'
import { LegalView, legalVars } from '../ui'

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getMessages(await getLocale()).legal.agb
  return { title: format(meta.title, legalVars()), description: format(meta.description, legalVars()) }
}

/**
 * AGB für einen B2B-Software-Dienst mit monatlicher Laufzeit.
 *
 * Kein Vorbild vom Anbieter (die AGB-Seite auf internetinformationsdienste.de
 * liefert 404), deshalb von Grund auf für RoSe geschrieben. Die Preise kommen
 * aus `pricing.ts`, damit AGB und Landing Page nie auseinanderlaufen. Die
 * Zählregel („auch nur vorübergehend in Betrieb = zählt") ist dieselbe wie in
 * `countBillableRooms`; die Kündigungsregel folgt daraus: monatlich, zum
 * Monatsende, und das Löschen des Kontos ist zugleich die Kündigung.
 *
 * § 12 Abs. 3 (Vertragsübergang, 06.09.2026): Die Rechte an RoSe liegen bei
 * den Urhebern, die I²D UG hält nur eine Lizenz. Soll die Lizenz später an ein
 * anderes Unternehmen gehen, müssen die Kundenverträge mitwandern — eine
 * Vertragsübernahme braucht sonst die Zustimmung jedes einzelnen Hotels. Die
 * Klausel holt diese Zustimmung vorab ein, mit Ankündigung, Sonderkündigungsrecht
 * und mitlaufendem AVV, damit sie auch im B2B-Verhältnis der Inhaltskontrolle
 * standhält. Sie muss stehen, BEVOR der erste Kunde unterschreibt.
 *
 * Wortlaut seit 11.10.2026 in `src/lib/i18n/de/legal/agb.ts`.
 */
export default async function AgbPage() {
  const m = getMessages(await getLocale()).legal
  return <LegalView page={m.agb} common={m.common} />
}
