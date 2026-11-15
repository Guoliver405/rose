import type { Metadata } from 'next'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'
import { LegalView, legalVars } from '../ui'

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getMessages(await getLocale()).legal.partnerTerms
  return { title: format(meta.title, legalVars()), description: format(meta.description, legalVars()) }
}

/**
 * Partnerbedingungen (Partnerprogramm, 15.11.2026). Getrennt von den AGB: Die
 * AGB regeln den entgeltlichen Vertrag über den Dienst, diese Bedingungen die
 * Empfehlung gegen Provision. Entwurf — anwaltliche Prüfung offen, die
 * Auszahlung ist noch nicht geregelt und steht so im Text.
 *
 * Wortlaut in `src/lib/i18n/de/legal/partnerTerms.ts`; wer ihn ändert, zählt
 * `PARTNER_TERMS_VERSION` hoch.
 */
export default async function PartnerbedingungenPage() {
  const m = getMessages(await getLocale()).legal
  return <LegalView page={m.partnerTerms} common={m.common} strongLinks />
}
