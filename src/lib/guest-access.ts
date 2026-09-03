/**
 * Gast-Zugangsverfahren — zwei Wege ins Gästeportal.
 *
 * - `pin`  … Fester QR-Code je Zimmer (hängt im Zimmer) + PIN je Aufenthalt.
 *            Der Standardfall: Der QR ist öffentlich sichtbar, deshalb schützt
 *            die PIN den Zugang.
 * - `link` … Individueller Zugang je Aufenthalt, ohne PIN. Wird beim Check-in
 *            ausgehändigt und erlischt mit dem Check-out. Hier **ist** der
 *            Link das Geheimnis — es gibt keinen zweiten Faktor.
 *
 * Die Wahl steht in `hotels.policies.guestAccessMode` und gilt **je Haus**: ein
 * Konto mit mehreren Häusern kann sie unterschiedlich setzen.
 *
 * Beim Check-in wird sie am Aufenthalt festgehalten (`stays.access_mode`) —
 * ein späterer Wechsel berührt laufende Aufenthalte deshalb nicht.
 */

export type GuestAccessMode = 'pin' | 'link'

/** Default ist `pin`: der Weg, der ohne Aushändigung von Papier funktioniert. */
export function parseGuestAccessMode(policies: Record<string, unknown>): GuestAccessMode {
  return policies?.guestAccessMode === 'link' ? 'link' : 'pin'
}

function base(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, '')
}

/** Zimmer-QR (`pin`-Verfahren): global eindeutiger Zimmer-Token, dann PIN. */
export function roomAccessUrl(siteUrl: string, roomToken: string): string {
  return `${base(siteUrl)}/guest/r/${roomToken}`
}

/** Aufenthalts-Link (`link`-Verfahren): meldet ohne weitere Eingabe an. */
export function stayAccessUrl(siteUrl: string, guestToken: string): string {
  return `${base(siteUrl)}/guest/s/${guestToken}`
}
