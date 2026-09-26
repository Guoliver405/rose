/**
 * Konto des Housekeeping-Simulators (Phase 2, 26.09.2026) — Texte und Regeln
 * ohne I/O. Die Datenbankseite liegt in `@/utils/sim-account`.
 *
 * Ein Simulator-Konto ist E-Mail + Passwort + Bestätigung, ohne Zahlungsdaten
 * und ohne Rechte im Produkt. Bauplan: Sessions/Simulator-Plan-2026-09-26.md.
 */

/** Name des Werkzeugs auf allen Seiten (Entscheidung des Users, 26.09.2026). */
export const SIMULATOR_NAME = 'Housekeeping-Simulator'

/**
 * Wortlaut der Werbe-Einwilligung. Ändert sich der Text, MUSS die Version
 * hochgezählt werden — gespeichert wird, welcher Fassung zugestimmt wurde.
 * Entscheidung des Users: ausschließlich RoSe, keine Weitergabe, nicht
 * vorausgewählt.
 */
export const MARKETING_TEXT =
  'Ja, RoSe darf mich gelegentlich per E-Mail über neue Funktionen und besondere Angebote informieren – ausschließlich zu RoSe. Meine Adresse wird nicht weitergegeben. Abbestellen jederzeit mit einem Klick oder im Konto.'
export const MARKETING_TEXT_VERSION = '2026-09-26'

export const MIN_PASSWORD = 8

/** Registrierungen je Absender-IP und Stunde. */
export const SIGNUP_MAX_PER_HOUR = 5
export const SIGNUP_WINDOW_MS = 60 * 60_000

/** Unbestätigte Konten verfallen nach so vielen Tagen. */
export const UNCONFIRMED_DAYS = 7

export type SimSignupInput = { email: string; password: string; marketing: boolean }

/** Eingaben aus dem Formular lesen und prüfen. */
export function parseSignup(form: { get(name: string): unknown }): { input?: SimSignupInput; error?: string } {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const password = String(form.get('password') ?? '')
  const marketing = form.get('marketing') === 'on'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }
  }
  if (password.trim().length < MIN_PASSWORD) return { error: `Das Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.` }
  if (password.length > 72) return { error: 'Das Passwort darf höchstens 72 Zeichen haben.' }
  return { input: { email, password, marketing } }
}

/** Liegt die IP über der Schwelle? `times` = Versuche im Fenster (ms), jüngste zuerst. */
export function signupThrottled(times: number[], nowMs: number): boolean {
  return times.filter(t => nowMs - t < SIGNUP_WINDOW_MS).length >= SIGNUP_MAX_PER_HOUR
}

/** Ist ein unbestätigtes Konto verfallen? */
export function isExpiredUnconfirmed(createdAt: string, confirmedAt: string | null, nowMs: number): boolean {
  return confirmedAt === null && nowMs - new Date(createdAt).getTime() > UNCONFIRMED_DAYS * 86_400_000
}
