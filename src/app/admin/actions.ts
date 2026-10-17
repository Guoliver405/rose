'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/service'
import { getAccountContext } from '@/utils/auth'
import { slugify, uniqueSlug } from '@/lib/slug'
import { DEFAULT_PIN_LENGTH } from '@/lib/ids'
import { seedExampleServices } from '@/utils/example-services'
import { parseHomeLanguage } from '@/lib/i18n/locales'
import {
  deleteAccountData, deleteHotelData, previewAccountDeletion, previewHotelDeletion,
  type DeletionPreview,
} from '@/utils/deletion'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'

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

async function messages() {
  return getMessages(await getLocale()).account.houses.errors
}

/**
 * Konto umbenennen.
 *
 * `accounts.name` wird bei der Registrierung aus dem Namen des ersten Hauses
 * kopiert und war danach an keiner Stelle änderbar — der Konto-Kasten auf
 * `/admin` zeigte nach einer Umbenennung des Hauses weiter den alten Namen
 * (Rückmeldung 22.09.2026). Der Name dient nur der Anzeige und als
 * Bestätigungsphrase beim Löschen des Kontos; Rechnungsempfänger ist
 * `billing_name`, der bleibt hiervon unberührt.
 */
export async function renameAccountAction(formData: FormData): Promise<Result> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.noPermission }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (name.length < 2) return { error: e.accountNameTooShort }
  if (name.length > 80) return { error: e.accountNameTooLong }

  const { error } = await createAdminClient()
    .from('accounts').update({ name }).eq('id', ctx.accountId)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/admin/abrechnung', 'layout')
  return {}
}

/** Neues Haus im eigenen Konto. Slug wird aus dem Namen erzeugt. */
export async function createHotelAction(formData: FormData): Promise<Result & { slug?: string }> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.noPermission }

  const name = ((formData.get('name') as string) ?? '').trim()
  if (name.length < 2) return { error: e.houseNameTooShort }

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
  if (error) return { error: format(e.createFailed, { message: error.message }) }

  // Beispiel-Services — dieselbe Stelle wie Registrierung und Baukasten.
  // Ganz normale Services, jederzeit archivierbar. Neues Haus: Heimatsprache Vorgabe.
  await seedExampleServices(admin, hotel.id, parseHomeLanguage({}))

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
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.ownerOnlyDelete }

  if (hotelId) {
    const admin = createAdminClient()
    const { data: hotel } = await admin
      .from('hotels').select('id, name, account_id').eq('id', hotelId).maybeSingle()
    if (!hotel || hotel.account_id !== ctx.accountId) return { error: e.houseNotFound }

    const preview = await previewHotelDeletion(hotelId)
    if (!preview) return { error: e.houseNotFound }
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
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.ownerOnlyDelete }

  const admin = createAdminClient()
  const { data: hotel } = await admin
    .from('hotels').select('id, name, account_id').eq('id', hotelId).maybeSingle()
  if (!hotel || hotel.account_id !== ctx.accountId) return { error: e.houseNotFound }
  if (confirmPhrase.trim() !== hotel.name) {
    return { error: format(e.confirmPhrase, { phrase: hotel.name }) }
  }

  const res = await deleteHotelData(hotelId)
  if (res.error) return { error: format(e.deleteFailed, { message: res.error }) }

  revalidatePath('/admin')
  return {}
}

/**
 * Das gesamte Konto entfernen. Löscht auch das eigene Anmeldekonto — die
 * Sitzung ist danach ungültig, der Aufrufer muss auf `/login` führen.
 */
export async function deleteAccountAction(confirmPhrase: string): Promise<Result & { openInvoiceUrls?: string[] }> {
  const e = await messages()
  const ctx = await getAccountContext()
  if (!ctx) return { error: e.ownerOnlyDeleteAccount }
  if (confirmPhrase.trim() !== ctx.accountName) {
    return { error: format(e.confirmPhrase, { phrase: ctx.accountName }) }
  }

  const res = await deleteAccountData(ctx.accountId)
  if (res.finalInvoiceError) return { error: format(e.finalInvoiceFailed, { message: res.finalInvoiceError }) }
  if (res.error) return { error: format(e.deleteFailed, { message: res.error }) }

  revalidatePath('/admin')
  return res.openInvoiceUrls?.length ? { openInvoiceUrls: res.openInvoiceUrls } : {}
}
