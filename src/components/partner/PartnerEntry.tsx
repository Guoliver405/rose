import Link from 'next/link'
import { ChevronRight, Handshake } from 'lucide-react'
import { affiliateEnabled } from '@/lib/affiliate'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

/**
 * Weg in den Partnerbereich — dieselbe Karte auf der Häuser-Seite, unter
 * „Mein Zugang“ und im Konto des Simulators. Ohne `AFFILIATE_ENABLED` gibt
 * es sie nicht.
 */
export default async function PartnerEntry() {
  if (!affiliateEnabled()) return null
  const m = getMessages(await getAdminLocale()).partner.entry
  return (
    <Link href="/partner"
      className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-4 hover:border-edge-strong">
      <Handshake className="h-5 w-5 shrink-0 text-action" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-ink">{m.title}</div>
        <div className="text-sm text-ink-soft">{m.text}</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
    </Link>
  )
}
