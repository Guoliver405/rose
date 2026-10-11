/**
 * Anmelde-Adresse ändern — der I/O-Teil (Rechenlogik in `lib/email-change.ts`).
 *
 * **Warum nicht Supabases `email_change`** (11.10.2026 nachgemessen): Im
 * Projekt ist „Secure email change“ aktiv. Ein bestätigter Link an die neue
 * Adresse ändert dann nichts; es braucht zusätzlich eine Bestätigung an der
 * alten. Das sperrte genau die aus, deren alte Adresse nicht mehr erreichbar
 * ist (Postfach eines früheren Arbeitgebers, aufgegebener Anbieter) — der
 * häufigste Grund für eine Änderung. Und der Ablauf hinge an einem Schalter
 * im Dashboard, den der Code nicht sieht: Würde er umgelegt, bräche die
 * Umstellung still ab oder geschähe ohne Bestätigung.
 *
 * Stattdessen: eigener Link-Schlüssel (`email_change_requests`, nur der Hash
 * gespeichert), umgestellt wird per Admin-API mit `email_confirm: true`. Die
 * Sicherung gegen eine Übernahme tragen drei Dinge: das **aktuelle Passwort**
 * (eine offen stehende Sitzung genügt nicht), der **Klick an der neuen
 * Adresse** (ein Tippfehler landet nicht still in einem fremden Postfach) und
 * der **Hinweis an die alte Adresse** (wer Passwort und Sitzung gestohlen hat,
 * fällt auf).
 *
 * **Vergebene Adresse:** Ob die neue Adresse schon zu einem Zugang gehört,
 * erfährt die Person am Bildschirm nie — der Link geht in jedem Fall raus, und
 * erst die Umstellung scheitert. Das sieht nur, wer das Postfach hat, und der
 * weiß es ohnehin.
 *
 * **Was hängt an der Adresse — und was nicht:** Nur `auth.users.email`. Rollen,
 * Profile, Simulator-Konto (`sim_accounts`), Stripe-Kunde und Freimonat hängen
 * an der Nutzer- bzw. Konto-ID; der Freimonat am Registrierungsdatum des
 * Kontos (`accounts.created_at`). Eine neue Adresse öffnet also keinen
 * zweiten Freimonat. Beim Inhaber zieht die E-Mail des Stripe-Kunden mit,
 * damit die Rechnungen ankommen.
 */
import { createClient as createPlainClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import {
  checkNewEmail, EMAIL_CHANGE_TTL_HOURS, hashEmailChangeToken, isEmailChangeExpired,
  isWellFormedEmailChangeToken, newEmailChangeToken,
} from '@/lib/email-change'
import {
  mailReady, sendEmailChangeConfirmMail, sendEmailChangedNoticeMail, siteBase, type MailResult,
} from '@/utils/mail'
import { syncOwnerStripeEmail } from '@/utils/stripe'

/** Was der Ablauf nach außen tut — im Integrationstest ersetzt (kein Versand, kein Stripe). */
export type EmailChangeEffects = {
  confirm: (m: { to: string; userId: string; url: string; hours: number }) => Promise<MailResult>
  notice: (m: { to: string; userId: string; newEmail: string }) => Promise<MailResult>
  stripe: (userId: string, email: string) => Promise<void>
}

export const realEffects: EmailChangeEffects = {
  confirm: sendEmailChangeConfirmMail,
  notice: sendEmailChangedNoticeMail,
  stripe: syncOwnerStripeEmail,
}

export function emailChangeUrl(token: string): string {
  return `${siteBase()}/auth/email-bestaetigen?token=${encodeURIComponent(token)}`
}

export type RequestResult =
  | { kind: 'error'; reason: 'invalid' | 'same' | 'currentMissing' | 'currentWrong' | 'notAllowed' | 'notConfigured' | 'failed'; message?: string }
  /** Versand versucht — `mail` trägt Zeile, Drossel, Sperre oder Fehler wie bei jeder Mail. */
  | { kind: 'sent'; email: string; mail: MailResult; expiresAt: string | null }

/**
 * Änderung anfordern: Passwort prüfen, Link an die neue Adresse senden und —
 * nur wenn die Mail wirklich übergeben wurde — die offene Änderung ablegen.
 * Eine vorher offene Änderung wird dabei ersetzt; ihr Link gilt nicht mehr.
 */
export async function requestEmailChange(
  p: { userId: string; currentEmail: string; password: string; newEmail: string; release?: boolean },
  fx: EmailChangeEffects = realEffects,
): Promise<RequestResult> {
  if (fx === realEffects && !mailReady()) return { kind: 'error', reason: 'notConfigured' }
  const check = checkNewEmail(p.newEmail, p.currentEmail)
  if (!check.ok) return { kind: 'error', reason: check.reason }
  if (!p.password) return { kind: 'error', reason: 'currentMissing' }

  const admin = createAdminClient()

  // Reinigungskräfte haben eine aus dem Benutzernamen gebaute Adresse, an der
  // ihre Anmeldung hängt — die darf hier nie umgestellt werden.
  const [{ data: profil }, passwortOk] = await Promise.all([
    admin.from('profiles').select('username').eq('id', p.userId).maybeSingle(),
    passwordMatches(p.currentEmail, p.password),
  ])
  if (profil?.username) return { kind: 'error', reason: 'notAllowed' }
  if (!passwortOk) return { kind: 'error', reason: 'currentWrong' }

  // Abgelaufene Anfragen aller Personen mit abräumen — kein Cron.
  await admin.from('email_change_requests').delete().lt('expires_at', new Date().toISOString())

  const t = newEmailChangeToken()
  const mail = await fx.confirm({ to: check.email, userId: p.userId, url: emailChangeUrl(t.token), hours: EMAIL_CHANGE_TTL_HOURS })
  // Nicht übergeben (Drossel, Sperrliste, Fehler): nichts ablegen — eine
  // vorher offene Änderung mit gültigem Link bleibt dann stehen.
  if (!mail.logId || mail.error) return { kind: 'sent', email: check.email, mail, expiresAt: null }

  const { error } = await admin.from('email_change_requests').upsert({
    user_id: p.userId,
    new_email: check.email,
    token_hash: t.hash,
    created_at: new Date().toISOString(),
    expires_at: t.expiresAt,
  })
  if (error) return { kind: 'error', reason: 'failed', message: error.message }
  return { kind: 'sent', email: check.email, mail, expiresAt: t.expiresAt }
}

/** Passwort gegenprüfen — über einen Client ohne Cookies, sonst überschriebe das die laufende Sitzung. */
async function passwordMatches(email: string, password: string): Promise<boolean> {
  const pruefung = createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { error } = await pruefung.auth.signInWithPassword({ email, password })
  return !error
}

/** Offene Änderung der Person — für „Mein Zugang“. */
export async function pendingEmailChange(userId: string): Promise<{ email: string; expiresAt: string } | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('email_change_requests').select('new_email, expires_at').eq('user_id', userId).maybeSingle()
  if (!data || isEmailChangeExpired(data.expires_at as string)) return null
  return { email: data.new_email as string, expiresAt: data.expires_at as string }
}

export async function cancelEmailChange(userId: string): Promise<void> {
  await createAdminClient().from('email_change_requests').delete().eq('user_id', userId)
}

type Row = { user_id: string; new_email: string; expires_at: string }

async function findRequest(token: string | null | undefined): Promise<Row | null> {
  if (!isWellFormedEmailChangeToken(token)) return null
  const { data } = await createAdminClient()
    .from('email_change_requests')
    .select('user_id, new_email, expires_at')
    .eq('token_hash', hashEmailChangeToken(token))
    .maybeSingle()
  if (!data || isEmailChangeExpired(data.expires_at as string)) return null
  return data as Row
}

/** Für die Bestätigungsseite: Gehört der Link zu einer offenen Änderung, und zu welcher Adresse? */
export async function peekEmailChange(token: string | null | undefined): Promise<{ email: string } | null> {
  const row = await findRequest(token)
  return row ? { email: row.new_email } : null
}

function isEmailExists(error: { code?: string; message: string }): boolean {
  return error.code === 'email_exists' || /already/i.test(error.message)
}

/**
 * Gehört die Adresse schon einem anderen Zugang? `updateUserById` meldet das
 * nicht sauber, sondern mit einem leeren 500er (11.10.2026 nachgemessen: die
 * Datenbank weist die doppelte Adresse ab, GoTrue reicht nur „{}“ durch).
 * `generateLink({ type: 'email_change_new' })` prüft dagegen ausdrücklich und
 * antwortet `email_exists` — ohne Versand. Nur im Fehlerfall gefragt.
 */
async function addressTaken(currentEmail: string | null, newEmail: string): Promise<boolean> {
  if (!currentEmail) return false
  const { error } = await createAdminClient().auth.admin.generateLink({
    type: 'email_change_new', email: currentEmail, newEmail,
  })
  return Boolean(error && isEmailExists(error))
}

export type ConfirmResult =
  | { kind: 'ok'; email: string }
  | { kind: 'invalid' }
  | { kind: 'taken' }
  | { kind: 'failed' }

/**
 * Umstellen. Läuft hinter einem Knopf auf der Bestätigungsseite, nicht beim
 * bloßen Öffnen des Links — Virenscanner mancher Mail-Anbieter rufen Links
 * vorab auf und verbrauchten sonst den Schlüssel.
 */
export async function confirmEmailChange(
  token: string | null | undefined,
  fx: EmailChangeEffects = realEffects,
): Promise<ConfirmResult> {
  const row = await findRequest(token)
  if (!row) return { kind: 'invalid' }
  const admin = createAdminClient()

  // Den Schlüssel zuerst verbrauchen — bedingt auf genau diesen Hash, damit
  // zwei gleichzeitige Klicks nicht zweimal umstellen.
  const { data: weg } = await admin
    .from('email_change_requests').delete()
    .eq('user_id', row.user_id).eq('token_hash', hashEmailChangeToken(token as string))
    .select('user_id')
  if (!weg?.length) return { kind: 'invalid' }

  const { data: vorher } = await admin.auth.admin.getUserById(row.user_id)
  const alteAdresse = vorher.user?.email ?? null
  if (!vorher.user) return { kind: 'invalid' }

  const { error } = await admin.auth.admin.updateUserById(row.user_id, { email: row.new_email, email_confirm: true })
  if (error) {
    if (isEmailExists(error) || await addressTaken(alteAdresse, row.new_email)) return { kind: 'taken' }
    console.error('[email-change] updateUserById:', error.status, error.code, error.message)
    return { kind: 'failed' }
  }

  // Nachlauf: Fehler hier ändern nichts mehr an der Umstellung.
  await Promise.all([
    alteAdresse
      ? fx.notice({ to: alteAdresse, userId: row.user_id, newEmail: row.new_email })
          .catch(err => { console.error('[email-change] Hinweis an die alte Adresse:', err) })
      : Promise.resolve(),
    fx.stripe(row.user_id, row.new_email)
      .catch(err => { console.error('[email-change] Stripe:', err) }),
  ])
  return { kind: 'ok', email: row.new_email }
}
