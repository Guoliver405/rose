/**
 * Zustellstatus einer verschickten Mail — die I/O-freie Hälfte des
 * Mail-Versands (Rest in `src/utils/mail.ts`).
 *
 * **Warum es das gibt (12.09.2026):** Bis dahin sah die Anwendung nur, ob der
 * Versand *angenommen* wurde — Supabase-SMTP bzw. Resend antworteten 200, und
 * damit war die Sache erledigt. Ob Freenet die Mail eine Sekunde später
 * abwies, stand allein im Resend-Log. Die Rezeption sagte dem Gast „ist
 * unterwegs", die Mail kam nie an. Jetzt meldet Resend jeden Schritt per
 * Webhook zurück (`email.sent` → `email.delivered` oder `email.bounced`), die
 * Anwendung hält ihn in `mail_log` fest, und die Oberfläche fragt ihn nach
 * dem Senden für eine Minute nach.
 *
 * Die Zustände sind **geordnet**: Ein Webhook kann die eigene „übergeben"-
 * Schreibung überholen (Resend liefert `email.sent` teils schneller, als der
 * Server seine Antwort verarbeitet). Deshalb wird ein Status nur nach vorn
 * gesetzt, nie zurück — `advance` entscheidet das ohne Uhrzeitvergleich.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

export type MailPurpose = 'invite' | 'recovery' | 'guest_access'

export type MailStatus =
  | 'queued'      // Zeile angelegt, Resend noch nicht gefragt
  | 'sent'        // Resend hat angenommen (oder `email.sent` gemeldet)
  | 'delayed'     // Empfänger-Server nimmt gerade nicht an, Resend versucht weiter
  | 'delivered'   // Empfänger-Server hat angenommen
  | 'complained'  // Empfänger hat als Spam gemeldet
  | 'bounced'     // Empfänger-Server hat abgewiesen
  | 'failed'      // Resend konnte gar nicht senden (oder hat abgelehnt)

/**
 * Sperre nach einem Versand, in Sekunden — für die Oberfläche (Countdown)
 * **und** den Server (Drossel je Empfänger-Bezug). Supabase hatte dieselbe
 * Minute je Adresse; sie bleibt, damit ein Doppelklick keine zwei Mails
 * erzeugt und ein Tester nicht in Sekunden das Kontingent leert.
 */
export const MAIL_COOLDOWN_SECONDS = 60

/** Wie lange die Oberfläche nach dem Senden auf eine Rückmeldung wartet. */
export const MAIL_WATCH_SECONDS = 90

/** Aufbewahrung der Protokollzeilen — sie tragen Bounce-Texte, die Adressen enthalten können. */
export const MAIL_LOG_RETENTION_DAYS = 30

const RANK: Record<MailStatus, number> = {
  queued: 0,
  sent: 1,
  delayed: 2,
  delivered: 3,
  complained: 4,
  bounced: 5,
  failed: 5,
}

/** Darf `next` den Stand `current` ersetzen? Nur nach vorn. */
export function advance(current: MailStatus, next: MailStatus): boolean {
  return RANK[next] > RANK[current]
}

/** Endzustand — die Oberfläche hört auf zu fragen. */
export function isFinalMailStatus(status: MailStatus): boolean {
  return status === 'delivered' || status === 'bounced' || status === 'complained' || status === 'failed'
}

/** Ist die Mail nachweislich NICHT angekommen? */
export function isMailFailure(status: MailStatus): boolean {
  return status === 'bounced' || status === 'failed' || status === 'complained'
}

/**
 * Resend-Ereignistyp → Status. Öffnen/Klicken interessieren nicht (und sind
 * ohne Tracking-Pixel ohnehin aus).
 */
export function statusFromEvent(type: string): MailStatus | null {
  switch (type) {
    case 'email.sent': return 'sent'
    case 'email.delivery_delayed': return 'delayed'
    case 'email.delivered': return 'delivered'
    case 'email.complained': return 'complained'
    case 'email.bounced': return 'bounced'
    case 'email.failed': return 'failed'
    default: return null
  }
}

/** Gestalt des Webhook-Payloads, soweit wir ihn lesen. */
export type ResendEvent = {
  type: string
  data?: {
    email_id?: string
    /** Beim Senden als Liste übergeben, im Webhook teils als Objekt geliefert. */
    tags?: Record<string, string> | { name: string; value: string }[]
    bounce?: { message?: string; type?: string; subType?: string }
    failed?: { reason?: string }
  }
}

/** Unsere Protokoll-ID aus den Tags — so findet der Webhook die Zeile, auch wenn er die eigene Schreibung der Resend-ID überholt. */
export function logIdFromEvent(ev: ResendEvent): string | null {
  const tags = ev.data?.tags
  if (!tags) return null
  if (Array.isArray(tags)) {
    return tags.find(t => t.name === 'log')?.value ?? null
  }
  return typeof tags.log === 'string' ? tags.log : null
}

/** Der Grund, wie ihn der Empfänger-Server oder Resend genannt hat. */
export function detailFromEvent(ev: ResendEvent): string | null {
  const b = ev.data?.bounce
  if (b?.message) {
    const art = [b.type, b.subType].filter(Boolean).join('/')
    return art ? `${b.message} (${art})` : b.message
  }
  if (ev.data?.failed?.reason) return ev.data.failed.reason
  return null
}

/** Text für die Oberfläche. */
export function mailStatusText(status: MailStatus, detail: string | null): string {
  switch (status) {
    case 'queued': return 'Wird übergeben …'
    case 'sent': return 'An den Versand übergeben — warte auf die Zustellbestätigung …'
    case 'delayed': return 'Zustellung verzögert: Der Empfänger-Server nimmt gerade nicht an, es wird weiter versucht.'
    case 'delivered': return 'Zugestellt.'
    case 'complained': return 'Der Empfänger hat die Mail als Spam gemeldet.'
    case 'bounced': return detail
      ? `Vom Empfänger-Server abgewiesen: ${detail}`
      : 'Vom Empfänger-Server abgewiesen.'
    case 'failed': return detail
      ? `Konnte nicht verschickt werden: ${detail}`
      : 'Konnte nicht verschickt werden.'
  }
}

// ── Webhook-Signatur (Svix-Format, wie Resend es benutzt) ───────────────────

/** Toleranz für den Zeitstempel im Signatur-Header, Sekunden. */
const SIGNATURE_TOLERANCE_S = 5 * 60

/**
 * Prüft die Signatur eines Resend-Webhooks.
 *
 * Resend signiert nach dem Svix-Schema: `HMAC-SHA256(secret, "<id>.<ts>.<body>")`,
 * Base64, im Header `svix-signature` als `v1,<sig>` — bei rotiertem Geheimnis
 * mehrere, durch Leerzeichen getrennt. Das Geheimnis kommt als `whsec_<base64>`.
 * Ohne Paket nachgebaut, weil es zwanzig Zeilen sind und `svix` sonst nur für
 * diese eine Funktion im Bundle läge.
 */
export function verifyResendSignature(opts: {
  secret: string
  id: string | null
  timestamp: string | null
  signature: string | null
  body: string
  /** Sekunden seit Epoche — Parameter, damit der Test die Uhr stellt. */
  nowSeconds?: number
}): boolean {
  const { secret, id, timestamp, signature, body } = opts
  if (!id || !timestamp || !signature) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > SIGNATURE_TOLERANCE_S) return false

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  if (key.length === 0) return false
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest()

  for (const teil of signature.split(' ')) {
    const [version, sig] = teil.split(',')
    if (version !== 'v1' || !sig) continue
    const given = Buffer.from(sig, 'base64')
    if (given.length === expected.length && timingSafeEqual(given, expected)) return true
  }
  return false
}
