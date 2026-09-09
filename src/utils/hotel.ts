import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/service'

/**
 * Auflösung des Mandanten aus dem URL-Slug (`/h/<slug>/…`).
 *
 * Läuft über den Admin-Client: Gäste und die Reinigungs-Anmeldung sind zum
 * Zeitpunkt der Auflösung nicht authentifiziert, die RLS auf `hotels` gibt
 * ihnen also nichts heraus.
 *
 * Bewusst KEIN öffentliches Hotel-Verzeichnis und keine Liste: der Slug muss
 * bekannt sein (Aushang, Handout, Zugangskarte). Ein unbekannter Slug führt
 * auf 404 — ohne Hinweis, ob es das Haus gibt.
 */
export type HotelHandle = {
  id: string
  name: string
  slug: string
  /** Konto, dem das Haus gehört — Grundlage der Inhaber-Berechtigung. */
  accountId: string
  policies: Record<string, unknown>
  /**
   * Pfad des Hotel-Logos im Storage (`hotels.logo_path`), sonst `null`.
   * Liegt hier, weil die Haus-Zeile ohnehin geladen wird: eine kurze
   * Zeichenkette kostet keinen Roundtrip, das Bild selbst holt der Browser
   * beim CDN.
   */
  logoPath: string | null
}

/**
 * `cache` dedupliziert innerhalb eines Requests — Layout und Page lösen
 * denselben Slug auf, sollen die DB aber nur einmal fragen.
 */
export const findHotelBySlug = cache(
  async (slug: string): Promise<HotelHandle | null> => {
    const normalized = (slug ?? '').trim().toLowerCase()
    if (!normalized) return null

    const { data } = await createAdminClient()
      .from('hotels')
      .select('id, name, slug, account_id, policies, logo_path')
      .eq('slug', normalized)
      .maybeSingle()

    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      accountId: data.account_id,
      policies: (data.policies ?? {}) as Record<string, unknown>,
      logoPath: data.logo_path ?? null,
    }
  },
)

/** Wie `findHotelBySlug`, aber 404 statt `null` — für Pages. */
export async function requireHotelBySlug(slug: string): Promise<HotelHandle> {
  const hotel = await findHotelBySlug(slug)
  if (!hotel) notFound()
  return hotel
}
