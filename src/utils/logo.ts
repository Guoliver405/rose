import { createAdminClient } from '@/utils/supabase/service'
import { LOGO_BUCKET, logoFolder, logoObjectPath, logoPublicUrl, type LogoMime } from '@/lib/logo'

/**
 * Hotel-Logo — der I/O-Teil (Supabase Storage). Die Rechenlogik steht I/O-frei
 * und getestet in [lib/logo.ts](../lib/logo.ts).
 *
 * Geschrieben wird ausschließlich über den Admin-Client, wie jeder
 * Schreibzugriff im Projekt; der Bucket `hotel-logos` ist öffentlich **lesbar**
 * und trägt keine Policies (siehe Migration `2026-09-09_hotels_logo.sql`).
 */

/** Öffentliche URL zum gespeicherten Pfad — `null` bleibt `null`. */
export function logoUrlFor(path: string | null | undefined): string | null {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return logoPublicUrl(base, path)
}

/**
 * Neues Logo ablegen und am Haus vermerken. Der alte Gegenstand wird
 * **danach** entfernt: Schlägt der Upload fehl, bleibt das bisherige Logo
 * stehen, statt dass das Haus ohne dasteht.
 */
export async function uploadHotelLogo(
  hotelId: string,
  bytes: Uint8Array,
  mime: LogoMime,
): Promise<{ path?: string; error?: string }> {
  const admin = createAdminClient()

  const { data: hotel } = await admin
    .from('hotels').select('logo_path').eq('id', hotelId).maybeSingle()
  const alt: string | null = hotel?.logo_path ?? null

  const pfad = logoObjectPath(hotelId, mime)
  const { error: upErr } = await admin.storage
    .from(LOGO_BUCKET)
    // Der Pfad trägt einen Zufallsanteil, kann also nicht schon existieren —
    // `upsert` wäre nur eine stille Einladung zum Überschreiben.
    .upload(pfad, bytes, { contentType: mime, upsert: false })
  if (upErr) return { error: upErr.message }

  const { error: dbErr } = await admin
    .from('hotels').update({ logo_path: pfad }).eq('id', hotelId)
  if (dbErr) {
    // Zeile nicht geschrieben ⇒ die frische Datei ist eine Waise.
    await admin.storage.from(LOGO_BUCKET).remove([pfad])
    return { error: dbErr.message }
  }

  if (alt && alt !== pfad) await admin.storage.from(LOGO_BUCKET).remove([alt])
  return { path: pfad }
}

/** Logo entfernen — Zeile zuerst, damit die Seite nie auf ein totes Bild zeigt. */
export async function removeHotelLogo(hotelId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()

  const { data: hotel } = await admin
    .from('hotels').select('logo_path').eq('id', hotelId).maybeSingle()
  const pfad: string | null = hotel?.logo_path ?? null

  const { error } = await admin.from('hotels').update({ logo_path: null }).eq('id', hotelId)
  if (error) return { error: error.message }

  if (pfad) await admin.storage.from(LOGO_BUCKET).remove([pfad])
  return {}
}

/**
 * Alle Logo-Dateien eines Hauses löschen — für `purgeHotel`.
 *
 * Storage-Gegenstände haben **keinen Fremdschlüssel** auf `hotels`; die
 * Kaskade räumt sie nicht ab. Dieselbe Falle wie bei
 * `room_state_transitions` und `auth.users`. Muss deshalb **vor** dem Löschen
 * des Hauses laufen — danach ist die ID nicht mehr aus der Zeile zu lesen.
 *
 * Geräumt wird der ganze Ordner, nicht nur der vermerkte Pfad: Bricht ein
 * Upload zwischen Datei und Zeile ab, bliebe sonst eine Waise stehen.
 */
export async function purgeHotelLogos(hotelId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const ordner = logoFolder(hotelId)

  const { data: dateien, error } = await admin.storage.from(LOGO_BUCKET).list(ordner)
  if (error) return { error: error.message }
  if (!dateien || dateien.length === 0) return {}

  const { error: rmErr } = await admin.storage
    .from(LOGO_BUCKET)
    .remove(dateien.map(d => `${ordner}/${d.name}`))
  return rmErr ? { error: rmErr.message } : {}
}
