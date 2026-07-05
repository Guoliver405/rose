/**
 * Supabase-Client für das Reinigungs-Portal.
 *
 * Verwendet den Cookie-Präfix "svc_" statt der Standard-Supabase-Cookie-
 * Namen, damit Reinigungs-Sessions und Rezeptions-Sessions sich im selben
 * Browser niemals gegenseitig überschreiben. (Pattern aus HotCord.)
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SVC = 'svc_'

export async function createServicePortalClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          // Präfix entfernen, damit Supabase die Cookie-Namen erkennt
          return cookieStore
            .getAll()
            .filter(c => c.name.startsWith(SVC))
            .map(c => ({ name: c.name.slice(SVC.length), value: c.value }))
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(SVC + name, value, options),
            )
          } catch {
            // Wird aus Server Components aufgerufen — ignorierbar.
          }
        },
      },
    },
  )
}

/**
 * Liefert die aktuelle Reinigungs-Session — oder `null`.
 *
 * Schluckt `refresh_token_already_used` / `refresh_token_not_found`,
 * die nach einem Dev-Server-Neustart oder bei parallelen Tabs aus
 * `auth.getSession()` fliegen: verbranntes Refresh-Token-Cookie wird
 * still gelöscht und als „nicht eingeloggt" behandelt.
 */
export async function getServicePortalSession(
  client: SupabaseClient,
): Promise<{ session: Awaited<ReturnType<SupabaseClient['auth']['getSession']>>['data']['session']; cleared: boolean }> {
  try {
    const { data, error } = await client.auth.getSession()
    if (error) {
      if (isStaleRefreshTokenError(error)) {
        await clearServicePortalCookies()
        return { session: null, cleared: true }
      }
      throw error
    }
    return { session: data.session, cleared: false }
  } catch (err) {
    if (isStaleRefreshTokenError(err)) {
      await clearServicePortalCookies()
      return { session: null, cleared: true }
    }
    throw err
  }
}

function isStaleRefreshTokenError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; status?: number; message?: string }
  if (e.code === 'refresh_token_already_used') return true
  if (e.code === 'refresh_token_not_found') return true
  if (typeof e.message === 'string' && /refresh token/i.test(e.message)) return true
  return false
}

async function clearServicePortalCookies(): Promise<void> {
  const cookieStore = await cookies()
  const expired: CookieOptions = { maxAge: 0, path: '/' }
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith(SVC)) {
      try {
        cookieStore.set(c.name, '', expired)
      } catch {
        // Server Components dürfen keine Cookies löschen — beim
        // nächsten Request kommt der Refresh erneut.
      }
    }
  }
}
