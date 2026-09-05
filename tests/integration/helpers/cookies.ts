import { createServerClient } from '@supabase/ssr'
import { sessionFor, type UserHandle } from './world'

/**
 * Cookie-Speicher im Arbeitsspeicher, kompatibel zu dem, was `next/headers`
 * liefert — die App nutzt `get`, `getAll` und `set`.
 */
export type FakeCookieStore = {
  get(name: string): { name: string; value: string } | undefined
  getAll(): { name: string; value: string }[]
  set(name: string, value: string, options?: unknown): void
  delete(name: string): void
  readonly map: Map<string, string>
}

export function cookieStore(): FakeCookieStore {
  const map = new Map<string, string>()
  return {
    map,
    get: (name) => (map.has(name) ? { name, value: map.get(name)! } : undefined),
    getAll: () => [...map.entries()].map(([name, value]) => ({ name, value })),
    set: (name, value) => { map.set(name, value) },
    delete: (name) => { map.delete(name) },
  }
}

/**
 * Legt die Sitzung des Nutzers in einem frischen Cookie-Speicher ab — im
 * **selben Format**, das `@supabase/ssr` in der App schreibt.
 *
 * Bewusst über `createServerClient` statt von Hand gebaute Cookie-Namen: das
 * Format ist Implementierungsdetail der Bibliothek und ändert sich mit ihr.
 *
 * Angemeldet wird nicht hier, sondern einmal je Datei über `sessionFor`
 * (siehe world.ts, „Anmeldungen bündeln"); `setSession` schreibt die
 * vorhandene Sitzung ohne Netzverkehr in die Cookies. Jeder Aufruf bekommt
 * trotzdem einen **eigenen** Speicher — die App darf ihn beim Erneuern
 * beschreiben, ohne dass der nächste Test das erbt.
 */
export async function signedInStore(user: UserHandle): Promise<FakeCookieStore> {
  const store = cookieStore()
  const session = await sessionFor(user)

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value }) => store.set(name, value)),
      },
    },
  )

  const { error } = await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  if (error) throw new Error(`Sitzung konnte nicht abgelegt werden für ${user.email}: ${error.message}`)
  if (store.map.size === 0) throw new Error('Anmeldung hat keine Session-Cookies geschrieben')

  return store
}
