import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import MaidPinCard from '@/components/MaidPinCard'

/**
 * Standalone-Druckseite für die Maid-Zugangskarte. Bewusst eigene Seite
 * (statt Modal), damit window.print() nur die Karte erwischt — Header/
 * Zurück-Link sind print:hidden.
 */
export default async function MaidCardPage({
  params,
}: {
  params: Promise<{ slug: string; profileId: string }>
}) {
  const { slug, profileId } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')
  const supabase = await createClient()

  const [{ data: profile }, { data: card }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, username')
      .eq('hotel_id', ctx.hotelId)
      .eq('id', profileId)
      .maybeSingle(),
    supabase
      .from('maid_login_tokens')
      .select('token, pin')
      .eq('hotel_id', ctx.hotelId)
      .eq('profile_id', profileId)
      .maybeSingle(),
  ])

  if (!profile?.username || !card) notFound()

  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  // QR-Ziel bleibt mandantenfrei (Token ist global eindeutig); der Weg von
  // Hand braucht die Hotel-Adresse, weil Benutzernamen nur je Hotel eindeutig sind.
  const loginUrl = `${origin}/service/auto/${card.token}`
  const manualUrl = `${origin}/h/${ctx.hotelSlug}/service/login`

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <Link
        href={`/h/${ctx.hotelSlug}/admin/personal`}
        className="flex items-center gap-1.5 self-start text-sm font-semibold text-ink-soft hover:text-ink print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zum Personal
      </Link>

      <MaidPinCard
        hotelName={ctx.hotelName}
        displayName={profile.display_name}
        username={profile.username}
        pin={card.pin}
        loginUrl={loginUrl}
        manualUrl={manualUrl}
      />
    </div>
  )
}
