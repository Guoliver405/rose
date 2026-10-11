import type { Metadata } from 'next'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'
import { LegalView, legalVars } from '../ui'

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getMessages(await getLocale()).legal.impressum
  return { title: format(meta.title, legalVars()), description: format(meta.description, legalVars()) }
}

/**
 * Impressum nach § 5 DDG und § 18 Abs. 2 MStV.
 *
 * Vorlage war das Impressum des Anbieters auf internetinformationsdienste.de —
 * mit drei Korrekturen: Dort steht noch „§ 5 TMG" (das Telemediengesetz ist
 * seit Mai 2024 durch das Digitale-Dienste-Gesetz abgelöst), „§ 55 Abs. 2
 * RStV" (der Rundfunkstaatsvertrag ging im November 2020 im
 * Medienstaatsvertrag auf) und ein Link auf die EU-Plattform zur
 * Online-Streitbeilegung, die am 20.07.2025 abgeschaltet wurde. Der
 * Hinweis zur Verbraucherschlichtung (§ 36 VSBG) bleibt, obwohl RoSe sich
 * nur an Unternehmen richtet — er schadet nicht und deckt den Fall ab, dass
 * doch einmal ein Verbraucher die Seite liest.
 *
 * Wortlaut seit 11.10.2026 in `src/lib/i18n/de/legal/impressum.ts`.
 */
export default async function ImpressumPage() {
  const m = getMessages(await getLocale()).legal
  return <LegalView page={m.impressum} common={m.common} />
}
