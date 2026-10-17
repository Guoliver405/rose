import { cookies, headers } from 'next/headers'
import { ADMIN_LOCALES, DEFAULT_LOCALE, GUEST_LOCALES, LOCALE_COOKIE, parseFallbackLanguage, resolveLocale, SERVICE_LOCALES, type Locale } from '@/lib/i18n'

/**
 * Sprache der laufenden Anfrage für alle Bereiche außer dem Gästeportal —
 * dort ist noch nichts übersetzt, also Deutsch. Sobald ein Bereich eine
 * zweite Sprache bekommt, wählt er hier wie das Gästeportal.
 */
export async function getLocale(): Promise<Locale> {
  return DEFAULT_LOCALE
}

/**
 * Sprache des Gastes (seit 17.10.2026): eigene Wahl über den Umschalter
 * (Cookie) → Sprache des Handys → Rückfallsprache des Hauses → Vorgabe.
 * Unabhängig von der Sprache des Hauses und vom Aufenthalt. Seiten ohne
 * Mandant (`/guest`, Zimmer-QR vor der Auflösung) rufen ohne Policies auf.
 */
export async function getGuestLocale(policies?: Record<string, unknown> | null): Promise<Locale> {
  return deviceLocale(GUEST_LOCALES, policies)
}

/**
 * Sprache der Reinigungskraft (seit 17.10.2026) — dieselbe Reihenfolge wie
 * beim Gast. Reinigungsteams sprechen oft andere Sprachen als die Rezeption;
 * die Sprache folgt deshalb dem Gerät, nicht dem Haus.
 */
export async function getServiceLocale(policies?: Record<string, unknown> | null): Promise<Locale> {
  return deviceLocale(SERVICE_LOCALES, policies)
}

/**
 * Sprache der Verwaltung — Rezeption, Inhaber, Manager (seit 17.10.2026):
 * eigene Wahl unter „Mein Zugang“ → Sprache des Geräts → Deutsch. Ohne die
 * Rückfallsprache des Hauses: Server-Actions kennen das Haus oft erst nach
 * der ersten Meldung, und Seite und Meldung sollen dieselbe Sprache sprechen.
 */
export async function getAdminLocale(): Promise<Locale> {
  return deviceLocale(ADMIN_LOCALES, null)
}

async function deviceLocale(offered: readonly Locale[], policies?: Record<string, unknown> | null): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
  return resolveLocale({
    chosen: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get('accept-language'),
    fallback: policies ? parseFallbackLanguage(policies) : undefined,
    offered,
  })
}
