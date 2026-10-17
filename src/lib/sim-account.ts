/**
 * Konto des Housekeeping-Simulators (Phase 2, 26.09.2026) — Regeln
 * ohne I/O. Die Datenbankseite liegt in `@/utils/sim-account`.
 *
 * Ein Simulator-Konto ist E-Mail + Passwort + Bestätigung, ohne Zahlungsdaten
 * und ohne Rechte im Produkt. Bauplan: Sessions/Simulator-Plan-2026-09-26.md.
 */

import { format } from '@/lib/i18n/format'

/** Name des Werkzeugs auf allen Seiten (Entscheidung des Users, 26.09.2026). */
export const SIMULATOR_NAME = 'Housekeeping-Simulator'

/** Name je Sprache — im Englischen ohne Bindestrich (18.10.2026). Rechtstexte bleiben bei `SIMULATOR_NAME`. */
export const SIMULATOR_NAMES = { de: SIMULATOR_NAME, en: 'Housekeeping Simulator' } as const

export function simulatorName(locale: string): string {
  return locale === 'en' ? SIMULATOR_NAMES.en : SIMULATOR_NAMES.de
}

/**
 * Fassung der Werbe-Einwilligung. Der Wortlaut steht seit 11.10.2026 in der
 * Sprachdatei (`i18n/de/simulator/account.ts`, `marketing.text`, wortgleich
 * verschoben). Ändert sich der Text, MUSS die Version hochgezählt werden —
 * gespeichert wird, welcher Fassung zugestimmt wurde; der Test hält Text und
 * Version zusammen fest. Entscheidung des Users: ausschließlich RoSe, keine
 * Weitergabe, nicht vorausgewählt.
 */
export const MARKETING_TEXT_VERSION = '2026-09-26'

/**
 * Fassung je Sprache (18.10.2026): Eine Übersetzung ist ein eigener Wortlaut
 * und bekommt ihre eigene Version — gespeichert wird, was die Person gelesen hat.
 */
export const MARKETING_TEXT_VERSIONS = { de: MARKETING_TEXT_VERSION, en: '2026-10-18-en' } as const

export function marketingTextVersion(locale: string): string {
  return locale === 'en' ? MARKETING_TEXT_VERSIONS.en : MARKETING_TEXT_VERSIONS.de
}

export const MIN_PASSWORD = 8

/** Registrierungen je Absender-IP und Stunde. */
export const SIGNUP_MAX_PER_HOUR = 5
export const SIGNUP_WINDOW_MS = 60 * 60_000

/** Unbestätigte Konten verfallen nach so vielen Tagen. */
export const UNCONFIRMED_DAYS = 7

export type SimSignupInput = { email: string; password: string; marketing: boolean }

/** Prüfmeldungen der Registrierung — aus der Sprachdatei (`simulator.account.errors`). */
export type SignupErrorTexts = { emailInvalid: string; passwordShort: string; passwordLong: string }

export const MAX_PASSWORD = 72

/** Eingaben aus dem Formular lesen und prüfen. */
export function parseSignup(
  form: { get(name: string): unknown },
  e: SignupErrorTexts,
): { input?: SimSignupInput; error?: string } {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const password = String(form.get('password') ?? '')
  const marketing = form.get('marketing') === 'on'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: e.emailInvalid }
  }
  if (password.trim().length < MIN_PASSWORD) return { error: format(e.passwordShort, { min: MIN_PASSWORD }) }
  if (password.length > MAX_PASSWORD) return { error: format(e.passwordLong, { max: MAX_PASSWORD }) }
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
