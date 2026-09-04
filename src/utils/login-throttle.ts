import { headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  clientIp, evaluateThrottle, hashIp, IP_MAX_FAILURES, IP_WINDOW_MS, type ThrottleVerdict,
} from '@/lib/login-throttle'

/*
 * IP-Drossel der Gast-Anmeldung — die Datenbankseite. Rechenregeln und
 * Begründung der Schwelle stehen in `@/lib/login-throttle`.
 *
 * Ablage in `guest_login_failures`: eine Zeile je Fehlversuch (IP-Hash,
 * Haus, Zeitpunkt). Ein Protokoll statt eines Zählers, weil es ohne
 * Lese-Schreib-Rennen auskommt — gleichzeitige Fehlversuche fügen einfach
 * beide ein — und weil das Fenster so wirklich gleitet. Die Tabelle bleibt
 * klein: bei jedem Fehlversuch werden alle Zeilen gelöscht, die aus dem
 * Fenster gefallen sind. Kein Cron.
 *
 * Läuft ausschließlich über den Admin-Client; die Tabelle hat keine
 * RLS-Policies, Gäste sind zu diesem Zeitpunkt nicht angemeldet.
 */

const TABLE = 'guest_login_failures'

/** Absender-IP des laufenden Requests, bereits als Pseudonym. */
export async function currentIpHash(): Promise<string> {
  const h = await headers()
  return hashIp(clientIp(name => h.get(name)))
}

/**
 * Steht diese IP gerade unter Sperre? Ein Roundtrip: die jüngsten Fehlversuche
 * im Fenster, höchstens so viele wie die Schwelle — mehr braucht die
 * Entscheidung nicht.
 */
export async function checkIpThrottle(admin: SupabaseClient, ipHash: string): Promise<ThrottleVerdict> {
  const nowMs = Date.now()
  const { data } = await admin
    .from(TABLE)
    .select('attempted_at')
    .eq('ip_hash', ipHash)
    .gte('attempted_at', new Date(nowMs - IP_WINDOW_MS).toISOString())
    .order('attempted_at', { ascending: false })
    .limit(IP_MAX_FAILURES)
  const times = (data ?? []).map(r => new Date(r.attempted_at as string).getTime())
  return evaluateThrottle(times, nowMs)
}

/**
 * Fehlversuch festhalten und nebenbei aufräumen. Beides parallel — das
 * Löschen betrifft nur, was ohnehin niemand mehr liest.
 */
export async function recordLoginFailure(
  admin: SupabaseClient,
  ipHash: string,
  hotelId: string | null,
): Promise<void> {
  const cutoff = new Date(Date.now() - IP_WINDOW_MS).toISOString()
  await Promise.all([
    admin.from(TABLE).insert({ ip_hash: ipHash, hotel_id: hotelId }),
    admin.from(TABLE).delete().lt('attempted_at', cutoff),
  ])
}
