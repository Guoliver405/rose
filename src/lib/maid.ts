/**
 * Interne Auth-E-Mail für Reinigungskräfte (Pattern aus HotCord).
 *
 * Supabase Auth braucht eine E-Mail — Reinigungskräfte haben keine, also
 * wird eine synthetische aus Benutzername + Hotel-ID gebaut. Die Domain
 * `.rose.svc` ist nicht routbar; E-Mails werden nie verschickt
 * (createUser mit email_confirm: true).
 */
export function buildMaidEmail(username: string, hotelId: string): string {
  return `${username.trim().toLowerCase()}@${hotelId}.rose.svc`
}

/** Benutzername-Normalisierung: lowercase, nur [a-z0-9._-]. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
}
