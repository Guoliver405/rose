import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/service'
import { GUEST_COOKIE } from '@/utils/guest'

/**
 * Individueller Gast-Zugang (`link`-Verfahren): Der Token steht auf dem
 * Ausdruck bzw. im Link der Mail und meldet **ohne weitere Eingabe** an.
 *
 * Bewusst OHNE Mandanten-Präfix — wie der Zimmer-QR: der Token ist global
 * eindeutig und trägt den Mandanten selbst. Gedruckte Zettel überleben damit
 * jeden Routing-Umbau.
 *
 * Der Zugang erlischt mit dem Check-out, weil `checked_out_at` mitgeprüft wird
 * — es braucht kein Aufräumen und kein Ablaufdatum.
 *
 * Hier gibt es keinen zweiten Faktor: Wer den Link hat, ist drin. Genau das ist
 * die Abwägung dieses Verfahrens, und sie steht so auch in der Erläuterung der
 * Einstellungsseite.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const origin = req.nextUrl.origin

  // Ohne bekannten Mandanten bleibt nur die mandantenfreie Hinweisseite.
  const fail = (slug?: string) =>
    NextResponse.redirect(
      slug ? `${origin}/h/${slug}/guest?error=link` : `${origin}/guest?error=link`,
    )

  if (!token || token.length < 16) return fail()

  const admin = createAdminClient()
  const { data: stay } = await admin
    .from('stays')
    .select('session_token, hotel_id, access_mode, checked_out_at')
    .eq('guest_token', token)
    .is('checked_out_at', null)
    .maybeSingle()

  if (!stay || stay.access_mode !== 'link') {
    // Ausgecheckt, unbekannt oder ein Aufenthalt des PIN-Verfahrens: In allen
    // Fällen dieselbe Antwort — der Zettel verrät sonst, ob das Zimmer belegt
    // ist.
    const { data: hotel } = stay
      ? await admin.from('hotels').select('slug').eq('id', stay.hotel_id).maybeSingle()
      : { data: null }
    return fail(hotel?.slug)
  }

  const { data: hotel } = await admin
    .from('hotels').select('slug').eq('id', stay.hotel_id).maybeSingle()
  if (!hotel) return fail()

  const cookieStore = await cookies()
  cookieStore.set(GUEST_COOKIE, stay.session_token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // effektive Grenze bleibt der Check-out
  })

  return NextResponse.redirect(`${origin}/h/${hotel.slug}/guest/status`)
}
