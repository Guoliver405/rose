'use server'

import { revalidatePath } from 'next/cache'
import { isValidTimeZone } from '@/lib/tz'
import { redirect } from 'next/navigation'
import { createClient as createPlainClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { parseStaffTracking } from '@/lib/staff-tracking'
import { anonymizeStale } from '@/utils/staff-tracking'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext, getManagementContext } from '@/utils/auth'
import { clampPinLength } from '@/lib/ids'
import { clampStaleMinutes } from '@/lib/board'
import { GUIDE_LANGS } from '@/lib/guest-guide'
import { LOGO_HEAD_BYTES, validateLogoUpload } from '@/lib/logo'
import { removeHotelLogo, uploadHotelLogo } from '@/utils/logo'
import { isValidSlug, SLUG_MAX_LENGTH } from '@/lib/slug'
import { normalizeLinkUrl } from '@/lib/service-link-templates'
import { format, getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'
import { cancelEmailChange, requestEmailChange } from '@/utils/email-change'
import type { MailResult } from '@/utils/mail'

type ActionResult = { error?: string }

async function messages() {
  const { common, settings } = getMessages(await getLocale()).admin
  return { ...common.errors, ...settings.errors }
}

/**
 * Hotelname + Adresse (Slug) + Policies speichern. Policies werden gemergt
 * (nicht ersetzt), damit künftige Policy-Schlüssel nicht verloren gehen.
 */
export async function updateSettingsAction(slug: string, formData: FormData): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const name = ((formData.get('hotelName') as string) ?? '').trim()
  if (name.length < 2) return { error: e.houseNameTooShort }

  const newSlug = ((formData.get('slug') as string) ?? '').trim().toLowerCase()
  if (!isValidSlug(newSlug)) {
    return { error: format(e.slugInvalid, { max: SLUG_MAX_LENGTH }) }
  }

  const pinLength = clampPinLength(Number(formData.get('pinLength')))
  const cleaningStaleMinutes = clampStaleMinutes(Number(formData.get('cleaningStaleMinutes')))
  const stayoverAutoClean = formData.get('stayoverAutoClean') === 'on'
  const timeRaw = ((formData.get('stayoverAutoCleanTime') as string) ?? '').trim()
  if (stayoverAutoClean && !/^\d{1,2}:\d{2}$/.test(timeRaw)) {
    return { error: e.dailyTimeMissing }
  }
  const checkoutRaw = ((formData.get('checkoutUntil') as string) ?? '').trim()
  if (!/^\d{1,2}:\d{2}$/.test(checkoutRaw)) {
    return { error: e.checkoutMissing }
  }
  const checkinRaw = ((formData.get('checkinFrom') as string) ?? '').trim()
  if (!/^\d{1,2}:\d{2}$/.test(checkinRaw)) {
    return { error: e.checkinMissing }
  }
  const cleanDeferEnabled = formData.get('cleanDeferEnabled') === 'on'
  const deferRaw = ((formData.get('cleanDeferUntil') as string) ?? '').trim()
  if (cleanDeferEnabled && !/^\d{1,2}:\d{2}$/.test(deferRaw)) {
    return { error: e.deferMissing }
  }
  const timeZone = ((formData.get('timeZone') as string) ?? '').trim()
  if (!isValidTimeZone(timeZone)) return { error: e.timeZoneInvalid }
  // Team-Modus: nur die beiden Werte, alles andere fällt auf die Vorgabe zurück.
  const staffTracking = formData.get('staffTracking') === 'team' ? 'team' : 'person'
  // Bewertungslink: leer = aus, sonst nur http(s) (wie die Verweise).
  const reviewRaw = ((formData.get('reviewUrl') as string) ?? '').trim()
  const reviewUrl = reviewRaw ? normalizeLinkUrl(reviewRaw) : ''
  if (reviewUrl === null) return { error: e.reviewUrlInvalid }

  const cleaningWindowEnabled = formData.get('cleaningWindowEnabled') === 'on'
  const windowStartRaw = ((formData.get('cleaningWindowStart') as string) ?? '').trim()
  const windowEndRaw = ((formData.get('cleaningWindowEnd') as string) ?? '').trim()
  if (cleaningWindowEnabled) {
    if (!/^\d{1,2}:\d{2}$/.test(windowStartRaw) || !/^\d{1,2}:\d{2}$/.test(windowEndRaw)) {
      return { error: e.windowMissing }
    }
    if (windowStartRaw === windowEndRaw) {
      return { error: e.windowSame }
    }
  }

  const admin = createAdminClient()

  // Der Slug ist global eindeutig (er IST die Mandanten-Kennung in der URL) —
  // hier bewusst OHNE hotel_id-Filter, dafür mit Ausschluss des eigenen Hauses.
  const { data: taken } = await admin
    .from('hotels').select('id').eq('slug', newSlug).neq('id', ctx.hotelId).maybeSingle()
  if (taken) return { error: e.slugTaken }

  const { data: hotel } = await admin
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()

  const merged = {
    ...((hotel?.policies ?? {}) as Record<string, unknown>),
    pinLength,
    cleaningStaleMinutes,
    stayoverAutoClean,
    ...(timeRaw ? { stayoverAutoCleanTime: timeRaw } : {}),
    checkoutUntil: checkoutRaw,
    checkinFrom: checkinRaw,
    cleanDeferEnabled,
    ...(deferRaw ? { cleanDeferUntil: deferRaw } : {}),
    timeZone,
    cleaningWindowEnabled,
    ...(windowStartRaw ? { cleaningWindowStart: windowStartRaw } : {}),
    ...(windowEndRaw ? { cleaningWindowEnd: windowEndRaw } : {}),
    staffTracking,
    reviewUrl,
  }

  const { error } = await admin
    .from('hotels')
    .update({ name, slug: newSlug, policies: merged })
    .eq('id', ctx.hotelId)
  if (error) return { error: error.message }

  // Umschalten auf den Team-Modus wirkt sofort auf den Bestand — nicht erst
  // mit dem nächsten Schichtbeginn. Sonst stünde die Tabelle je Kraft nach
  // dem Speichern noch einen Tag lang da.
  const before = parseStaffTracking((hotel?.policies ?? {}) as Record<string, unknown>)
  if (staffTracking === 'team' && before !== 'team') await anonymizeStale(admin, ctx.hotelId)

  // Die Portalseiten unter /h/<slug> sind durchweg dynamisch (Cookie-Zugriff),
  // haben also keinen Full-Route-Cache, der nach einer Umbenennung veralten
  // könnte — hier reicht das Admin-Layout.
  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')

  // Adresse geändert → die aktuelle URL zeigt ins Leere. Weiterleiten, statt
  // den Nutzer auf einer toten Route stehen zu lassen.
  if (newSlug !== ctx.hotelSlug) redirect(`/h/${newSlug}/admin/einstellungen/hotel`)
  return {}
}

/**
 * Eigenen Anzeigenamen ändern.
 *
 * Der Name steht an bis zu drei Stellen, und alle drei gehören derselben
 * Person — deshalb werden sie gemeinsam gesetzt:
 *
 * - `profiles.display_name` — der Identitäts-Anker. Hieraus speist sich die
 *   Attribution im Zimmer-Verlauf und in der Bestell-Historie.
 * - `account_members.display_name` — für Kontoinhaber; das ist, was die
 *   Kopfzeile zeigt.
 * - `hotel_members.display_name` — für Manager und Rezeption, je Haus. Ein
 *   Manager über mehrere Häuser hat mehrere Zeilen; sie tragen denselben
 *   Namen und werden alle mitgezogen.
 *
 * Ohne diese Klammer liefen die Stellen auseinander — genau das war der
 * Zustand, in dem Kontoinhaber in der Kopfzeile „Rezeption" hießen.
 */
export async function updateDisplayNameAction(
  slug: string,
  formData: FormData,
): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: e.notSignedIn }

  const displayName = ((formData.get('displayName') as string) ?? '').trim()
  if (displayName.length < 2) return { error: e.displayNameTooShort }
  if (displayName.length > 60) return { error: e.displayNameTooLong }

  const admin = createAdminClient()

  // Ausschließlich die eigenen Zeilen: `ctx.userId` kommt aus der geprüften
  // Sitzung, nicht aus dem Formular.
  const [profil, konto, haus] = await Promise.all([
    admin.from('profiles').update({ display_name: displayName }).eq('id', ctx.userId),
    admin.from('account_members').update({ display_name: displayName }).eq('user_id', ctx.userId),
    admin.from('hotel_members').update({ display_name: displayName }).eq('user_id', ctx.userId),
  ])
  const fehler = profil.error ?? konto.error ?? haus.error
  if (fehler) return { error: format(e.saveFailed, { message: fehler.message }) }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath('/admin')
  return {}
}

/**
 * Passwort des eingeloggten Management-Users ändern (Supabase Auth).
 *
 * Verlangt das **aktuelle** Passwort. Ohne diese Prüfung genügte eine offen
 * stehende Sitzung, um jemanden aus seinem eigenen Zugang auszusperren — an
 * einem Rezeptionstresen kein theoretischer Fall.
 */
export async function changePasswordAction(slug: string, formData: FormData): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: e.notSignedIn }

  const current = (formData.get('currentPassword') as string) ?? ''
  const password = (formData.get('password') as string) ?? ''
  const confirm = (formData.get('passwordConfirm') as string) ?? ''
  if (password.length < 8) return { error: e.passwordTooShort }
  if (password !== confirm) return { error: e.passwordMismatch }
  if (!current) return { error: e.currentPasswordMissing }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: e.notSignedIn }

  // Gegenprobe über einen eigenständigen Client OHNE Cookie-Anbindung — sonst
  // überschriebe die Anmeldung hier die laufende Sitzung.
  const pruefung = createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { error: falsch } = await pruefung.auth.signInWithPassword({
    email: user.email,
    password: current,
  })
  if (falsch) return { error: e.currentPasswordWrong }

  // Über den Session-Client (nicht Admin) — ändert den eigenen Account.
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (error.code === 'same_password') return { error: e.samePassword }
    return { error: error.message }
  }
  return {}
}

/**
 * Anmelde-Adresse ändern, erster Schritt: Link an die neue Adresse
 * (11.10.2026, Ablauf und Begründung in `utils/email-change.ts`). Wie beim
 * Passwort wird das aktuelle Passwort verlangt. `release` gibt eine Adresse
 * auf der Sperrliste vorher frei (Entscheidung der Person am Bildschirm).
 */
export async function requestEmailChangeAction(
  slug: string,
  formData: FormData,
  release = false,
): Promise<{ error?: string; email?: string; expiresAt?: string | null; mail?: MailResult }> {
  const t = getMessages(await getLocale()).admin.settings.myAccess.email
  const e = await messages()
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: e.notSignedIn }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || user.id !== ctx.userId) return { error: e.notSignedIn }

  const res = await requestEmailChange({
    userId: ctx.userId,
    currentEmail: user.email,
    password: (formData.get('currentPassword') as string) ?? '',
    newEmail: (formData.get('newEmail') as string) ?? '',
    release,
  })
  if (res.kind === 'error') {
    if (res.reason === 'notConfigured') return { error: t.notConfigured }
    if (res.reason === 'failed') return { error: format(t.errors.failed, { message: res.message ?? '' }) }
    return { error: t.errors[res.reason] }
  }
  revalidatePath(`/h/${ctx.hotelSlug}/admin/einstellungen/zugang`)
  return { email: res.email, expiresAt: res.expiresAt, mail: res.mail }
}

/** Offene Änderung der Anmelde-Adresse verwerfen — der verschickte Link gilt danach nicht mehr. */
export async function cancelEmailChangeAction(slug: string): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getManagementContext(slug)
  if (!ctx) return { error: e.notSignedIn }
  await cancelEmailChange(ctx.userId)
  revalidatePath(`/h/${ctx.hotelSlug}/admin/einstellungen/zugang`)
  return {}
}

/**
 * Gast-Zugangsverfahren umstellen — bewusst eine eigene Action und eine eigene
 * Seite, nicht ein Feld im ohnehin vollen Hotel-Formular: Die Wahl ist eine
 * grundsätzliche Betriebsentscheidung und braucht Platz für die Erläuterung.
 *
 * Die Umstellung wirkt **erst ab dem nächsten Check-in**. Laufende Aufenthalte
 * behalten ihren ausgegebenen Zugang, weil das Verfahren am Aufenthalt
 * festgehalten ist (`stays.access_mode`).
 */
/**
 * Hotel-Logo hochladen. Geprüft wird die **Datei**, nicht ihr Name: Endung und
 * der vom Browser gemeldete Typ sind beide frei wählbar, die ersten Bytes
 * nicht (`validateLogoUpload`).
 */
export async function uploadHotelLogoAction(
  slug: string,
  formData: FormData,
): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const datei = formData.get('logo')
  if (!(datei instanceof File) || datei.size === 0) return { error: e.noFile }

  const bytes = new Uint8Array(await datei.arrayBuffer())
  const check = validateLogoUpload(bytes.byteLength, bytes.subarray(0, LOGO_HEAD_BYTES))
  if ('error' in check) {
    const lm = getMessages(await getLocale()).account.houses.logo
    return { error: check.error === 'tooLarge' ? format(lm.tooLarge, { kb: check.kb }) : lm[check.error] }
  }

  const res = await uploadHotelLogo(ctx.hotelId, bytes, check.mime)
  if (res.error) return { error: res.error }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export async function removeHotelLogoAction(slug: string): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const res = await removeHotelLogo(ctx.hotelId)
  if (res.error) return { error: res.error }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export async function updateSheetLanguagesAction(
  slug: string,
  erste: string,
  zweite: string,
): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }

  const erlaubt = GUIDE_LANGS as readonly string[]
  if (!erlaubt.includes(erste)) return { error: e.unknownLanguage }
  // Leer ist gültig und heißt „nur eine Sprache" — siehe `parseSheetLanguages`.
  if (zweite !== '' && !erlaubt.includes(zweite)) return { error: e.unknownLanguage }
  if (zweite === erste) return { error: e.secondLanguageSame }

  const admin = createAdminClient()
  const { data: hotel } = await admin
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()

  const merged = {
    ...((hotel?.policies ?? {}) as Record<string, unknown>),
    sheetLanguage: erste,
    sheetLanguage2: zweite,
  }

  const { error } = await admin
    .from('hotels').update({ policies: merged }).eq('id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}

export async function updateGuestAccessModeAction(
  slug: string,
  mode: string,
): Promise<ActionResult> {
  const e = await messages()
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: e.noPermission }
  if (mode !== 'pin' && mode !== 'link') return { error: e.unknownMode }

  const admin = createAdminClient()
  const { data: hotel } = await admin
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()

  const merged = {
    ...((hotel?.policies ?? {}) as Record<string, unknown>),
    guestAccessMode: mode,
  }

  const { error } = await admin
    .from('hotels').update({ policies: merged }).eq('id', ctx.hotelId)
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {}
}
