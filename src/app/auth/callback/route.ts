import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Rückkehr aus einer Supabase-Mail (heute: Passwort zurücksetzen).
 *
 * Der Link in der Mail zeigt auf Supabase; Supabase leitet hierher weiter und
 * hängt `?code=…` an. Dieser Code wird gegen eine Sitzung getauscht — danach
 * ist der Nutzer angemeldet und kann auf `/passwort-neu` ein neues Passwort
 * setzen.
 *
 * **PKCE:** Der Tausch braucht den `code_verifier`, den `resetPasswordForEmail`
 * als Cookie hinterlegt hat. Der Link muss deshalb in DEMSELBEN Browser
 * geöffnet werden, in dem er angefordert wurde — sonst schlägt der Tausch fehl.
 * Genau dafür gibt es die Rückmeldung `?fehler=link` auf der Anforderungsseite.
 *
 * Als Route Handler und nicht als Seite, weil hier Cookies geschrieben werden.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)

  // Hinter dem Vercel-Proxy ist `url.origin` nicht zwingend die öffentliche
  // Adresse — dieselbe Basis benutzen, die auch in die Mail geschrieben wurde.
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? url.origin).replace(/\/+$/, '')
  const zurueckZumAnfordern = NextResponse.redirect(`${base}/passwort-vergessen?fehler=link`)

  // Supabase hängt bei abgelaufenem oder schon benutztem Link einen Fehler an.
  if (url.searchParams.get('error') || url.searchParams.get('error_description')) {
    return zurueckZumAnfordern
  }

  const code = url.searchParams.get('code')
  if (!code) return zurueckZumAnfordern

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession:', error.message)
    return zurueckZumAnfordern
  }

  // `next` kommt aus der URL und ist damit ungeprüft: nur projekteigene,
  // relative Ziele zulassen. Ohne diesen Riegel wäre der Callback ein offener
  // Weiterleiter — ein Link auf unsere Domain könnte auf fremde Seiten führen.
  const next = url.searchParams.get('next') ?? '/admin'
  const ziel = next.startsWith('/') && !next.startsWith('//') ? next : '/admin'

  return NextResponse.redirect(`${base}${ziel}`)
}
