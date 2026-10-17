'use server'

import { cookies } from 'next/headers'
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n'

/**
 * Eigene Sprachwahl eines Geräts (17.10.2026) — Gästeportal und
 * Reinigungsboard teilen sich den Umschalter und das Cookie: ein Gerät, eine
 * Person, eine Sprache. Ein Jahr gültig, unabhängig von Aufenthalt und
 * Schicht. Ob ein Bereich die Sprache anbietet, entscheidet er beim Lesen
 * (`getGuestLocale`, `getServiceLocale`).
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return
  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 })
}
