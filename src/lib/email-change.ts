/**
 * Anmelde-Adresse ändern — die I/O-freie Hälfte (Rest in
 * `src/utils/email-change.ts`).
 *
 * Ablauf (11.10.2026): aktuelles Passwort + neue Adresse → Link an die NEUE
 * Adresse → erst der Klick dort stellt um → Hinweis an die ALTE Adresse. Der
 * Link trägt einen Zufallsschlüssel; gespeichert wird nur sein Hash.
 */
import { createHash, randomBytes } from 'node:crypto'

/** Wie lange der Bestätigungslink gilt. */
export const EMAIL_CHANGE_TTL_HOURS = 24

/** Vergleichsform einer Adresse: getrimmt, klein geschrieben. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Dieselbe Formprüfung wie beim Mail-Versand (`dispatch`). */
export function isPlausibleEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email) && email.length <= 254
}

export type NewEmailCheck =
  | { ok: true; email: string }
  | { ok: false; reason: 'invalid' | 'same' }

/**
 * Neue Adresse prüfen. Ob sie schon einem anderen Zugang gehört, wird hier
 * bewusst NICHT gefragt — die Antwort an die Person am Bildschirm verriete,
 * ob es ein Konto gibt. Das entscheidet erst die Umstellung, und die sieht
 * nur, wer das Postfach der neuen Adresse hat.
 */
export function checkNewEmail(input: string, currentEmail: string): NewEmailCheck {
  const email = normalizeEmail(input)
  if (!isPlausibleEmail(email)) return { ok: false, reason: 'invalid' }
  if (email === normalizeEmail(currentEmail)) return { ok: false, reason: 'same' }
  return { ok: true, email }
}

/** Hash, unter dem ein Link-Schlüssel gespeichert wird. */
export function hashEmailChangeToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Neuer Link-Schlüssel (256 Bit, URL-tauglich) samt Hash und Ablauf. */
export function newEmailChangeToken(now: Date = new Date()): { token: string; hash: string; expiresAt: string } {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    hash: hashEmailChangeToken(token),
    expiresAt: new Date(now.getTime() + EMAIL_CHANGE_TTL_HOURS * 3_600_000).toISOString(),
  }
}

export function isEmailChangeExpired(expiresAt: string, now: Date = new Date()): boolean {
  return Date.parse(expiresAt) <= now.getTime()
}

/** Form eines Link-Schlüssels — alles andere wird gar nicht erst nachgeschlagen. */
export function isWellFormedEmailChangeToken(token: string | null | undefined): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
}

/**
 * Adresse für die Anzeige auf der Bestätigungsseite: Die Seite ist über den
 * Link erreichbar, der Link kann weitergeleitet werden — der Name vor dem @
 * wird deshalb bis auf das erste Zeichen ausgeblendet.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at <= 0) return email
  const name = email.slice(0, at)
  return `${name[0]}${'•'.repeat(Math.min(Math.max(name.length - 1, 2), 6))}${email.slice(at)}`
}
