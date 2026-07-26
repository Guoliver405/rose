/**
 * Auto-Login-Endpunkt für die druckbare Maid-Zugangskarte (QR-Ziel).
 *
 * GET /service/auto/<token>:
 *   1. Token via Admin-Client in maid_login_tokens nachschlagen.
 *   2. Synthetische E-Mail aus username + hotel_id bauen.
 *   3. Service-Portal-Client (svc_-Cookies) → signInWithPassword(email, pin).
 *   4. Erfolg → /h/<slug>/service, sonst → Anmeldung mit Fehler-Code.
 *
 * Diese Route bleibt bewusst OHNE Mandanten-Präfix: der Token ist global
 * eindeutig und trägt den Mandanten selbst. Dadurch bleiben bereits gedruckte
 * Zugangskarten über jeden Routing-Umbau hinweg gültig.
 *
 * Kein Time-Expiry: Token gilt, bis das Management eine neue Karte erzeugt
 * (UPSERT überschreibt die Zeile → alte Karte als Einheit tot).
 */
import { NextResponse } from 'next/server'
import { createServicePortalClient } from '@/utils/supabase/service-portal'
import { createAdminClient } from '@/utils/supabase/service'
import { buildMaidEmail } from '@/lib/maid'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const origin = new URL(request.url).origin

  // Ohne bekannten Mandanten bleibt nur die mandantenfreie Hinweisseite.
  const fail = (slug?: string) =>
    NextResponse.redirect(
      slug
        ? `${origin}/h/${slug}/service/login?error=auto_login_failed`
        : `${origin}/service/login?error=auto_login_failed`,
    )

  if (!token || token.length < 16) return fail()

  const admin = createAdminClient()

  const { data: row } = await admin
    .from('maid_login_tokens')
    .select('profile_id, hotel_id, pin')
    .eq('token', token)
    .maybeSingle()
  if (!row) return fail()

  const [{ data: profile }, { data: hotel }] = await Promise.all([
    admin.from('profiles').select('username, deactivated_at').eq('id', row.profile_id).maybeSingle(),
    admin.from('hotels').select('slug').eq('id', row.hotel_id).maybeSingle(),
  ])
  if (!hotel) return fail()
  // Deaktivierte Kraft: gedruckte Karte ist damit wirkungslos.
  if (!profile?.username || profile.deactivated_at) return fail(hotel.slug)

  const supabase = await createServicePortalClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: buildMaidEmail(profile.username, row.hotel_id),
    password: row.pin,
  })
  if (error) return fail(hotel.slug)

  return NextResponse.redirect(`${origin}/h/${hotel.slug}/service`)
}
