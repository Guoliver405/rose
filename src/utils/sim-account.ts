import { randomUUID } from 'node:crypto'
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
  exists: (m: { to: string; userId: string | null }) => Promise<MailResult>
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
 * Was Supabase zu einer Adresse sagt, ermittelt über `generateLink({ type:
 * 'signup' })` — die Admin-API sucht nicht nach Adressen. Nachgemessen
 * (26.09.2026) und die Grundlage der Fallunterscheidung:
 *
 *  - unbekannte Adresse → neuer, unbestätigter Nutzer samt Link;
 *  - bestätigte Adresse → Fehler `email_exists`;
 *  - **unbestätigte Adresse → derselbe Nutzer, KEIN Fehler**, neuer Link (der
 *    alte wird ungültig), das Passwort bleibt das alte.
 *
 * Den dritten Fall erkennt zuerst die Konto-Zeile in `sim_accounts`, ohne sie
 * das Anlegedatum. Die erste Fassung hielt den Nutzer für neu, scheiterte an
 * der schon vorhandenen Konto-Zeile und löschte ihn beim Zurückrollen. `magiclink` taugt als Suche nicht: für eine
 * unbekannte Adresse legt er einen Nutzer an.
 *
 * Nebenwirkung, bewusst in Kauf genommen: Eine noch nicht angenommene
 * Einladung ins Hotelprodukt (unbestätigter Nutzer) verliert ihren Link, wenn
 * jemand dieselbe Adresse im Simulator registriert — die Einladung lässt sich
 * erneut senden.
 */
type Probe =
  | { kind: 'confirmed' }
  | { kind: 'new'; userId: string; url: string }
  /** Unbestätigtes Simulator-Konto — Einwilligung wie bei der Registrierung. */
  | { kind: 'unconfirmedSim'; userId: string; url: string; marketing: boolean }
  /** Anderer unbestätigter Nutzer, etwa eine offene Einladung ins Hotelprodukt. */
  | { kind: 'unconfirmedOther' }
  | { kind: 'error' }

/** Spielraum für die Uhren von Server und Datenbank. */
const FRESH_MS = 15_000

async function probe(admin: Admin, email: string, password: string): Promise<Probe> {
  const startedAt = Date.now()
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'signup', email, password })
  if (error || !link?.user) {
    if (error?.code === 'email_exists' || /already/i.test(error?.message ?? '')) return { kind: 'confirmed' }
    console.error('[sim-signup] generateLink signup:', error?.code, error?.message)
    return { kind: 'error' }
  }
  const type = (link.properties.verification_type as 'signup' | 'magiclink' | undefined) ?? 'signup'
  const url = confirmUrl(link.properties.hashed_token, type, SIM_CONFIRMED_NEXT)
  const userId = link.user.id
  const { data: sim } = await admin.from('sim_accounts').select('marketing_opt_in').eq('user_id', userId).maybeSingle()
  if (sim) return { kind: 'unconfirmedSim', userId, url, marketing: sim.marketing_opt_in }
  return Date.parse(link.user.created_at) >= startedAt - FRESH_MS ? { kind: 'new', userId, url } : { kind: 'unconfirmedOther' }
}

const FAILED = 'Das Konto konnte nicht angelegt werden. Bitte später erneut versuchen.'

/** Hinweis „schon ein Zugang" — ohne Nutzer-ID, damit keine Suche nötig ist; die Drossel je IP genügt. */
async function sendExists(email: string, senders: SimSenders): Promise<SimSignupResult> {
  const err = publicError(await senders.exists({ to: email, userId: null }))
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

  const p = await probe(admin, input.email, input.password)
  if (p.kind === 'error') return { error: FAILED }
  // Bestätigter Zugang oder offene Einladung: nicht anfassen, nur der Hinweis.
  if (p.kind === 'confirmed' || p.kind === 'unconfirmedOther') return sendExists(input.email, senders)
  if (p.kind === 'unconfirmedSim') {
    // Neuer Link, Einwilligung wie beim ersten Mal; das Passwort bleibt das alte.
    const err = publicError(await senders.confirm({ to: input.email, userId: p.userId, url: p.url, marketing: p.marketing }))
    return err ? { error: err } : { sent: true }
  }

  const { error: insErr } = await admin.from('sim_accounts').insert({
    user_id: p.userId,
    marketing_opt_in: input.marketing,
    marketing_text_version: input.marketing ? MARKETING_TEXT_VERSION : null,
  })
  if (insErr) {
    // Nur ein in diesem Aufruf angelegter Nutzer wird zurückgerollt — und nie
    // einer, zu dem inzwischen eine Konto-Zeile existiert (gleichzeitige Registrierung).
    const { data: raced } = await admin.from('sim_accounts').select('user_id').eq('user_id', p.userId).maybeSingle()
    if (!raced) await admin.auth.admin.deleteUser(p.userId)
    console.error('[sim-signup] sim_accounts:', insErr.message)
    return { error: FAILED }
  }
  const err = publicError(await senders.confirm({ to: input.email, userId: p.userId, url: p.url, marketing: input.marketing }))
  return err ? { error: err } : { sent: true }
}

/**
 * „Mail erneut senden" — dieselbe Antwort für jede Adresse. Die Probe braucht
 * ein Passwort; ein Zufallswert ändert bei einem bestehenden Nutzer nichts
 * (nachgemessen), und ein dabei neu entstandener Nutzer wird sofort wieder
 * gelöscht — für eine unbekannte Adresse geht keine Mail hinaus.
 */
export async function resendSimConfirmation(email: string, ipHash: string, senders: SimSenders = realSenders): Promise<SimSignupResult> {
  const admin = createAdminClient()
  if (await throttle(admin, ipHash)) {
    return { error: 'Von diesem Anschluss kamen gerade zu viele Anfragen. Bitte in einer Stunde erneut versuchen.' }
  }
  const address = email.trim().toLowerCase()
  const p = await probe(admin, address, `${randomUUID()}!Aa1`)
  if (p.kind === 'error') return { sent: true }
  if (p.kind === 'new') {
    await admin.auth.admin.deleteUser(p.userId)
    return { sent: true }
  }
  if (p.kind === 'confirmed' || p.kind === 'unconfirmedOther') return sendExists(address, senders)
  const err = publicError(await senders.confirm({ to: address, userId: p.userId, url: p.url, marketing: p.marketing }))
  return err ? { error: err } : { sent: true }
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
