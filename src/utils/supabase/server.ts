import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Standard-Server-Client für das Rezeptions-/Admin-Portal.
 * RLS aktiv — für lesende Operationen und Auth-Prüfungen.
 * Schreibende Server-Actions nutzen nach manueller Auth-Prüfung
 * den Admin-Client (siehe service.ts) — Supabase gibt bei
 * RLS-blockierten DELETE/UPDATE keinen Fehler zurück.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll aus einer Server Component aufgerufen — ignorierbar,
            // solange Middleware/Route-Handler die Session refreshen.
          }
        },
      },
    }
  )
}
