import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { confirmUrl, mailReady, sendSimConfirmMail, sendSimExistsMail, type MailResult } from '@/utils/mail'
import {
  MARKETING_TEXT_VERSION, SIGNUP_WINDOW_MS, UNCONFIRMED_DAYS, isExpiredUnconfirmed, signupThrottled, type SimSignupInput,
} from '@/lib/sim-account'

/*
 * Simulator-Konto — die Datenbankseite (Phase 2, 26.09.2026). Regeln und
 * Texte in `@/lib/sim-account`.
 *
 * **Die öffentliche Seite verrät nicht, ob es zu einer Adresse ein Konto
 * gibt.** Registrierung und „erneut senden" antworten immer gleich; was die
 * Person tun soll, steht in der Mail an die Adresse — Bestätigungslink für
 * ein neues oder noch unbestätigtes Simulator-Konto, sonst der Hinweis
 * „Sie haben schon einen Zugang". Dasselbe Muster wie „Passwort vergessen".
 *
 * Der Versand ist ein Parameter (`senders`), damit der Integrationstest die
 * Links abfangen kann, statt Mails an Testadressen zu schicken.
 */

type Admin = SupabaseClient

export type SimSenders = {
  confirm: (m: { to: string; userId: string; url: string; marketing: boolean }) => Promise<MailResult>
  exists: (m: { to: string; userId: string }) => Promise<MailResult>
}

export const realSenders: SimSenders = { confirm: sendSimConfirmMail, exists: sendSimExistsMail }

/** Ziel nach dem Bestätigungsklick. */
export const SIM_CONFIRMED_NEXT = '/simulator?willkommen=1'

export type SimSignupResult = { sent?: true; error?: string }

// ── Drossel ─────────────────────────────────────────────────────────────────

async function throttle(admin: Admin, ipHash: string): Promise<boolean> {
  const now = Date.now()
  const since = new Date(now - SIGNUP_WINDOW_MS).toISOString()
  const { data } = await admin
    .from('signup_attempts')
    .select('attempted_at')
    .eq('ip_hash', ipHash)
    .gte('attempted_at', since)
    .order('attempted_at', { ascending: false })
    .limit(20)
  const blocked = signupThrottled((data ?? []).map(r => new Date(r.attempted_at as string).getTime()), now)
  // Jeder Versuch zählt, auch der abgewiesene; Altes fällt dabei heraus.
  await Promise.all([
    admin.from('signup_attempts').insert({ ip_hash: ipHash }),
    admin.from('signup_attempts').delete().lt('attempted_at', since),
  ])
  return blocked
}

/**
 * Unbestätigte Konten nach sieben Tagen löschen — bei jeder Registrierung,
 * kein Cron. Nur Auth-Nutzer ohne jede Rolle im Produkt: Die Kaskade am
 * Auth-Nutzer nähme sonst Profile und Mitgliedschaften mit.
 */
export async function purgeExpiredUnconfirmed(admin: Admin, nowMs = Date.now()): Promise<number> {
  const cutoff = new Date(nowMs - UNCONFIRMED_DAYS * 86_400_000).toISOString()
  const { data } = await admin
    .from('sim_accounts')
    .select('user_id, created_at, confirmed_at')
    .is('confirmed_at', null)
    .lt('created_at', cutoff)
    .limit(25)
  let removed = 0
  for (const row of data ?? []) {
    if (!isExpiredUnconfirmed(row.created_at, row.confirmed_at, nowMs)) continue
    if (await hasProductRole(admin, row.user_id)) {
      await admin.from('sim_accounts').delete().eq('user_id', row.user_id)
      continue
    }
    const { error } = await admin.auth.admin.deleteUser(row.user_id)
    if (!error) removed++
  }
  return removed
}

/** Hat der Auth-Nutzer irgendeine Rolle im Hotelprodukt? Dann darf er als Ganzes nie gelöscht werden. */
export async function hasProductRole(admin: Admin, userId: string): Promise<boolean> {
  const [p, a, h] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('id', userId),
    admin.from('account_members').select('user_id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('hotel_members').select('user_id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  return (p.count ?? 0) + (a.count ?? 0) + (h.count ?? 0) > 0
}

// ── Registrierung ───────────────────────────────────────────────────────────

/** Fehler eines Versands, der die öffentliche Seite etwas angeht — die Drossel je Konto nicht. */
function publicError(res: MailResult): string | undefined {
  return res.error && !res.wait && !res.blocked ? res.error : undefined
}

/**
 * Für eine schon vorhandene Adresse: noch unbestätigtes Simulator-Konto →
 * Bestätigungslink erneut; alles andere → Hinweis „schon ein Zugang".
 */
async function answerExisting(admin: Admin, email: string, senders: SimSenders): Promise<SimSignupResult> {
  // Den Nutzer zur Adresse findet nur `generateLink` — die Admin-API sucht
  // nicht nach Adressen. Der Magic-Link dient zugleich als neuer
  // Bestätigungslink (sein Einlösen bestätigt die Adresse).
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const userId = link?.user?.id
  const tokenHash = link?.properties?.hashed_token
  if (error || !userId || !tokenHash) {
    console.error('[sim-signup] generateLink magiclink:', error?.message)
    return { sent: true }
  }
  const { data: sim } = await admin
    .from('sim_accounts')
    .select('confirmed_at, marketing_opt_in')
    .eq('user_id', userId)
    .maybeSingle()
  if (sim && sim.confirmed_at === null) {
    const type = (link.properties.verification_type as 'magiclink' | 'signup' | undefined) ?? 'magiclink'
    const res = await senders.confirm({ to: email, userId, url: confirmUrl(tokenHash, type, SIM_CONFIRMED_NEXT), marketing: sim.marketing_opt_in })
    const err = publicError(res)
    return err ? { error: err } : { sent: true }
  }
  const res = await senders.exists({ to: email, userId })
  const err = publicError(res)
  return err ? { error: err } : { sent: true }
}

export async function registerSimAccount(
  input: SimSignupInput,
  ipHash: string,
  senders: SimSenders = realSenders,
  /** Abgelaufene unbestätigte Konten mit aufräumen — der Integrationstest schaltet das ab (fasst nur Eigenes an). */
  opts: { purge?: boolean } = {},
): Promise<SimSignupResult> {
  if (senders === realSenders && !mailReady()) {
    return { error: 'Die Registrierung ist gerade nicht möglich (Mailversand nicht eingerichtet).' }
  }
  const admin = createAdminClient()
  if (await throttle(admin, ipHash)) {
    return { error: 'Von diesem Anschluss kamen gerade zu viele Registrierungen. Bitte in einer Stunde erneut versuchen.' }
  }
  if (opts.purge !== false) await purgeExpiredUnconfirmed(admin)

  // Neuer, unbestätigter Auth-Nutzer samt Bestätigungslink in einem Schritt.
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: 'signup', email: input.email, password: input.password,
  })
  if (error || !link?.user) {
    const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
    if (text.includes('exists') || text.includes('already')) return answerExisting(admin, input.email, senders)
    console.error('[sim-signup] generateLink signup:', error?.message)
    return { error: 'Das Konto konnte nicht angelegt werden. Bitte später erneut versuchen.' }
  }
  const userId = link.user.id

  const { error: insErr } = await admin.from('sim_accounts').insert({
    user_id: userId,
    marketing_opt_in: input.marketing,
    marketing_text_version: input.marketing ? MARKETING_TEXT_VERSION : null,
  })
  if (insErr) {
    await admin.auth.admin.deleteUser(userId)
    console.error('[sim-signup] sim_accounts:', insErr.message)
    return { error: 'Das Konto konnte nicht angelegt werden. Bitte später erneut versuchen.' }
  }

  const type = (link.properties.verification_type as 'signup' | 'magiclink' | undefined) ?? 'signup'
  const res = await senders.confirm({
    to: input.email, userId, url: confirmUrl(link.properties.hashed_token, type, SIM_CONFIRMED_NEXT), marketing: input.marketing,
  })
  const err = publicError(res)
  return err ? { error: err } : { sent: true }
}

/** „Mail erneut senden" auf der Bestätigungsseite — dieselbe Antwort für jede Adresse. */
export async function resendSimConfirmation(email: string, ipHash: string, senders: SimSenders = realSenders): Promise<SimSignupResult> {
  const admin = createAdminClient()
  if (await throttle(admin, ipHash)) {
    return { error: 'Von diesem Anschluss kamen gerade zu viele Anfragen. Bitte in einer Stunde erneut versuchen.' }
  }
  return answerExisting(admin, email.trim().toLowerCase(), senders)
}

// ── Bestätigung, Einwilligung, Löschen ──────────────────────────────────────

/**
 * Nach dem Einlösen des Links (`/auth/confirm`): Konto bestätigt, und eine
 * angekreuzte Werbe-Einwilligung wird jetzt wirksam (Double-Opt-in).
 */
export async function markSimConfirmed(userId: string): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('sim_accounts')
    .select('confirmed_at, marketing_opt_in, marketing_opt_in_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data || data.confirmed_at) return
  const now = new Date().toISOString()
  await admin
    .from('sim_accounts')
    .update({
      confirmed_at: now,
      ...(data.marketing_opt_in && !data.marketing_opt_in_at ? { marketing_opt_in_at: now } : {}),
    })
    .eq('user_id', userId)
    .is('confirmed_at', null)
}

/**
 * Einwilligung im Konto an- oder abschalten. Die Adresse ist bestätigt, das
 * Einschalten gilt damit sofort; Zeitpunkt und Textversion werden neu
 * festgehalten. Beim Abschalten bleibt nichts stehen, was nach Einwilligung
 * aussähe.
 */
export async function setSimMarketing(userId: string, on: boolean): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { data } = await admin.from('sim_accounts').select('confirmed_at').eq('user_id', userId).maybeSingle()
  const now = new Date().toISOString()
  if (!data) {
    if (!on) return {}
    // Hotelzugang ohne Simulator-Zeile: Zeile anlegen (bestätigt, die Adresse ist es schon).
    const { error } = await admin.from('sim_accounts').insert({
      user_id: userId, confirmed_at: now, marketing_opt_in: true, marketing_opt_in_at: now, marketing_text_version: MARKETING_TEXT_VERSION,
    })
    return error ? { error: 'Konnte nicht gespeichert werden.' } : {}
  }
  if (!data.confirmed_at) return { error: 'Bitte zuerst die E-Mail-Adresse bestätigen.' }
  const { error } = await admin
    .from('sim_accounts')
    .update(on
      ? { marketing_opt_in: true, marketing_opt_in_at: now, marketing_text_version: MARKETING_TEXT_VERSION }
      : { marketing_opt_in: false, marketing_opt_in_at: null, marketing_text_version: null })
    .eq('user_id', userId)
  return error ? { error: 'Konnte nicht gespeichert werden.' } : {}
}

/**
 * Simulator-Konto selbst löschen: Auth-Nutzer weg, die Kaskade nimmt
 * `sim_accounts`, `sim_scenarios` und das Zustellprotokoll mit. Gehört zum
 * Zugang auch eine Rolle im Hotelprodukt, bleibt der Zugang stehen und nur
 * die Simulator-Daten verschwinden.
 */
export async function deleteSimAccount(userId: string): Promise<{ error?: string; keptLogin?: boolean }> {
  const admin = createAdminClient()
  if (await hasProductRole(admin, userId)) {
    await Promise.all([
      admin.from('sim_scenarios').delete().eq('user_id', userId),
      admin.from('sim_accounts').delete().eq('user_id', userId),
    ])
    return { keptLogin: true }
  }
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    console.error('[sim-account] deleteUser:', error.message)
    return { error: 'Das Konto konnte nicht gelöscht werden. Bitte später erneut versuchen.' }
  }
  return {}
}
