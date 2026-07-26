import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

/**
 * Rückkehr aus einer Supabase-Mail — Einladung, Passwort-Reset, Bestätigung.
 *
 * Ablöser für `/auth/callback`: statt eines PKCE-Codes wird der `token_hash`
 * aus der Mail per `verifyOtp` eingelöst. Der entscheidende Unterschied:
 *
 *   **Der Hash hängt am Konto, nicht am Browser.**
 *
 * Damit funktioniert der Link auch dort, wo PKCE prinzipiell nicht kann:
 *
 * - **Einladungen** — der einladende Browser (Rezeption) ist ein anderer als
 *   der annehmende (die eingeladene Person). Supabase unterstützt PKCE hier
 *   ausdrücklich nicht.
 * - **Passwort-Reset vom Handy angefordert, am Rechner geöffnet** — mit PKCE
 *   scheiterte das zwangsläufig, weil der `code_verifier` als Cookie im
 *   anfordernden Browser liegt.
 *
 * Voraussetzung: die Supabase-Mail-Vorlagen müssen auf diese Route zeigen und
 * `{{ .TokenHash }}` mitgeben — siehe Session-Protokoll. Mit der
 * Auslieferungsvorlage (`{{ .ConfirmationURL }}`) landet der Nutzer stattdessen
 * bei Supabase, das die Sitzung im URL-Fragment zurückgibt; ein Server kann das
 * nicht lesen.
 *
 * `/auth/callback` bleibt bestehen, damit bereits verschickte Links weiter
 * funktionieren.
 */
const ERLAUBTE_TYPEN: EmailOtpType[] = ['invite', 'recovery', 'email', 'email_change']

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)

  // Hinter dem Vercel-Proxy ist `url.origin` nicht zwingend die öffentliche
  // Adresse — dieselbe Basis benutzen, die auch in die Mail geschrieben wurde.
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? url.origin).replace(/\/+$/, '')
  const gescheitert = NextResponse.redirect(`${base}/passwort-vergessen?fehler=link`)

  const tokenHash = url.searchParams.get('token_hash')
  const typ = url.searchParams.get('type') as EmailOtpType | null

  if (!tokenHash || !typ || !ERLAUBTE_TYPEN.includes(typ)) return gescheitert

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type: typ, token_hash: tokenHash })
  if (error) {
    console.error('[auth/confirm] verifyOtp:', { typ, status: error.status, message: error.message })
    return gescheitert
  }

  // `next` kommt aus der URL und ist damit ungeprüft: nur projekteigene,
  // relative Ziele zulassen. Ohne diesen Riegel wäre die Route ein offener
  // Weiterleiter — ein Link auf unsere Domain könnte auf fremde Seiten führen.
  const next = url.searchParams.get('next') ?? '/passwort-neu'
  const ziel = next.startsWith('/') && !next.startsWith('//') ? next : '/passwort-neu'

  // Einladung: die Person hat noch nie ein Passwort gesetzt. Die Zielseite
  // begrüßt sie deshalb anders als jemanden, der seins vergessen hat.
  const mitHinweis =
    typ === 'invite' && ziel.startsWith('/passwort-neu')
      ? `${ziel}${ziel.includes('?') ? '&' : '?'}einladung=1`
      : ziel

  return NextResponse.redirect(`${base}${mitHinweis}`)
}
