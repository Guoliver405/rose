'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAccountContext } from '@/utils/auth'
import { slugify, uniqueSlug } from '@/lib/slug'
import { DEFAULT_PIN_LENGTH } from '@/lib/ids'
import serviceTemplates from '@/lib/service-templates.json'
import {
  deleteAccountData, deleteHotelData, previewAccountDeletion, previewHotelDeletion,
  type DeletionPreview,
} from '@/utils/deletion'

/*
 * Konto-Ebene: Häuser anlegen.
 *
 * `/admin` ist die Häuser-Seite UND der Konto-Bereich — dort steht der
 * Plan-Kasten, die Liste der Häuser und dieser Weg, ein weiteres anzulegen.
 * Die Seite liegt außerhalb von `/h/<slug>/` und wird deshalb von KEINEM
 * Hotel-Layout geschützt; die Action braucht ihren eigenen Riegel.
 *
 * `getAccountContext()` lässt ausschließlich den Kontoinhaber durch — ein
 * Manager sieht die Häuser seines Bereichs, darf aber keine anlegen.
 */

type Result = { error?: string }

/** Neues Haus im eigenen Konto. Slug wird aus dem Namen erzeugt. */
export async function createHotelAction(formData: FormData): Promise<Result & { slug?: string }> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (name.length < 2) return { error: 'Hotelname muss mindestens 2 Zeichen haben.' }

  const admin = createAdminClient()

  // Slugs sind GLOBAL eindeutig (sie sind der URL-Schlüssel) — deshalb hier
  // bewusst ohne Konto-Filter gegen alle bestehenden prüfen.
  const { data: existing } = await admin.from('hotels').select('slug')
  const slug = uniqueSlug(slugify(name), (existing ?? []).map(h => h.slug))

  const { data: hotel, error } = await admin
    .from('hotels')
    .insert({
      name,
      slug,
      account_id: ctx.accountId,
      policies: { pinLength: DEFAULT_PIN_LENGTH },
    })
    .select('id')
    .single()
  if (error) return { error: `Anlegen fehlgeschlagen: ${error.message}` }

  // Beispiel-Services seeden — gleiche Vorlagen wie beim Anlegen eines
  // Mandanten per Skript. Ganz normale Services, jederzeit archivierbar.
  for (const t of serviceTemplates) {
    const { data: svc } = await admin
      .from('service_definitions')
      .insert({ hotel_id: hotel.id, name: t.name, description: t.description, urgent: t.urgent })
      .select('id')
      .single()
    if (svc && t.items.length > 0) {
      await admin.from('service_items').insert(
        t.items.map((i, idx) => ({
          service_id: svc.id,
          hotel_id: hotel.id,
          label: i.label,
          price_cents: i.price_cents,
          sort_order: idx,
        })),
      )
    }
  }

  revalidatePath('/admin')
  return { slug }
}

// ═══════════════════════════════════════════════════════════════════════════
// LÖSCHBEGEHREN — Haus oder ganzes Konto restlos entfernen.
//
// Die Gegenrichtung zum Rest des Projekts: sonst überleben Belege bewusst
// jede Löschung (`room_state_transitions` und `billing_snapshots` tragen
// deshalb keine Fremdschlüssel). Genau deshalb erfüllt die Kaskade ein
// „entfernt alle meine Daten" NICHT von allein — siehe utils/deletion.ts.
//
// Nur der Kontoinhaber, und nur für das eigene Konto: `getAccountContext()`
// ist der einzige Guard außerhalb von `/h/<slug>/`.
// ═══════════════════════════════════════════════════════════════════════════

/** Was ein Löschen entfernen würde — Grundlage der Bestätigung. */
export async function getDeletionPreviewAction(
  hotelId?: string,
): Promise<{ preview?: DeletionPreview; confirmPhrase?: string; error?: string }> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Nur der Kontoinhaber kann Daten löschen.' }

  if (hotelId) {
    const admin = createAdminClient()
    const { data: hotel } = await admin
      .from('hotels').select('id, name, account_id').eq('id', hotelId).maybeSingle()
    if (!hotel || hotel.account_id !== ctx.accountId) return { error: 'Haus nicht gefunden.' }

    const preview = await previewHotelDeletion(hotelId)
    if (!preview) return { error: 'Haus nicht gefunden.' }
    return { preview, confirmPhrase: hotel.name }
  }

  return {
    preview: await previewAccountDeletion(ctx.accountId),
    confirmPhrase: ctx.accountName,
  }
}

/** Ein einzelnes Haus des eigenen Kontos restlos entfernen. */
export async function deleteHotelAction(
  hotelId: string,
  confirmPhrase: string,
): Promise<Result> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Nur der Kontoinhaber kann Daten löschen.' }

  const admin = createAdminClient()
  const { data: hotel } = await admin
    .from('hotels').select('id, name, account_id').eq('id', hotelId).maybeSingle()
  if (!hotel || hotel.account_id !== ctx.accountId) return { error: 'Haus nicht gefunden.' }
  if (confirmPhrase.trim() !== hotel.name) {
    return { error: `Bitte „${hotel.name}" zur Bestätigung eingeben.` }
  }

  const res = await deleteHotelData(hotelId)
  if (res.error) return { error: `Löschen fehlgeschlagen: ${res.error}` }

  revalidatePath('/admin')
  return {}
}

/**
 * Das gesamte Konto entfernen. Löscht auch das eigene Anmeldekonto — die
 * Sitzung ist danach ungültig, der Aufrufer muss auf `/login` führen.
 */
export async function deleteAccountAction(confirmPhrase: string): Promise<Result> {
  const ctx = await getAccountContext()
  if (!ctx) return { error: 'Nur der Kontoinhaber kann das Konto löschen.' }
  if (confirmPhrase.trim() !== ctx.accountName) {
    return { error: `Bitte „${ctx.accountName}" zur Bestätigung eingeben.` }
  }

  const res = await deleteAccountData(ctx.accountId)
  if (res.error) return { error: `Löschen fehlgeschlagen: ${res.error}` }

  revalidatePath('/admin')
  return {}
}
