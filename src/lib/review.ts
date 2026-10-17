/**
 * Bitte um eine Bewertung (17.10.2026).
 *
 * Das Haus trägt EINEN Link zu seiner Bewertungsseite ein (`policies.reviewUrl`,
 * leer = aus). Das Gästeportal zeigt ihn an zwei Stellen: ab dem zweiten Tag
 * als ruhige Zeile unten im Portal und nach dem Check-out auf der Danke-Seite.
 *
 * Bewusst KEINE Bewertung in RoSe und keine Weiche „zufrieden → Google,
 * unzufrieden → intern“ (Review Gating: von Google verboten, wettbewerbsrechtlich
 * heikel). Die Plattform wählt das Haus nicht aus — sie ergibt sich aus der
 * Adresse und bestimmt nur die Beschriftung des Knopfes.
 *
 * I/O-frei, getestet in `review.test.ts`.
 */
import { normalizeLinkUrl } from './service-link-templates'
import { zonedDateKey } from './tz'

/** So lange nach dem Check-out zeigt das Cookie noch die Danke-Seite. */
export const THANK_YOU_DAYS = 7

export type ReviewPlatform = 'google' | 'tripadvisor' | 'booking' | 'holidaycheck' | 'other'

/** Gespeicherter Link des Hauses, geprüft — sonst null (aus). */
export function parseReviewUrl(policies: Record<string, unknown>): string | null {
  const raw = policies.reviewUrl
  return typeof raw === 'string' ? normalizeLinkUrl(raw) : null
}

/** Plattform aus dem Host — nur für die Beschriftung. */
export function reviewPlatform(url: string): ReviewPlatform {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return 'other'
  }
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`)
  if (is('g.page') || is('goo.gl') || is('google.com') || host.startsWith('google.') || host.includes('.google.')) return 'google'
  if (host.includes('tripadvisor.')) return 'tripadvisor'
  if (is('booking.com')) return 'booking'
  if (host.includes('holidaycheck.')) return 'holidaycheck'
  return 'other'
}

/**
 * Zeile im Portal: ab dem zweiten Ortstag des Aufenthalts. Am Anreiseabend
 * hat der Gast noch keinen Eindruck, um den man ihn bitten könnte.
 */
export function showReviewHint(checkedInAt: string, now: Date, timeZone: string): boolean {
  return zonedDateKey(now, timeZone) > zonedDateKey(new Date(checkedInAt), timeZone)
}

/** Danke-Seite: Check-out höchstens `THANK_YOU_DAYS` Tage her. */
export function isWithinThankYouWindow(checkedOutAt: string, now: Date): boolean {
  const ms = now.getTime() - new Date(checkedOutAt).getTime()
  return ms >= 0 && ms <= THANK_YOU_DAYS * 24 * 60 * 60 * 1000
}
