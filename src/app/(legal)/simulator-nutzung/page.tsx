import type { Metadata } from 'next'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'
import { LegalView, legalVars } from '../ui'

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getMessages(await getLocale()).legal.simulatorUse
  return { title: format(meta.title, legalVars()), description: format(meta.description, legalVars()) }
}

/**
 * Kurze Nutzungsbedingungen des Housekeeping-Simulators (26.09.2026, Bauplan
 * Abschnitt 4 „Rechtstexte"). Bewusst getrennt von den AGB: Die AGB regeln
 * einen entgeltlichen B2B-Vertrag über den Dienst, der Simulator ist ein
 * kostenloses Werkzeug ohne Leistungsversprechen. Entwurf — die anwaltliche
 * Prüfung steht wie bei den AGB aus.
 *
 * Wortlaut seit 11.10.2026 in `src/lib/i18n/de/legal/simulatorUse.ts`.
 */
export default async function SimulatorNutzungPage() {
  const m = getMessages(await getLocale()).legal
  return <LegalView page={m.simulatorUse} common={m.common} strongLinks />
}
