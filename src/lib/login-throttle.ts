import { createHash } from 'node:crypto'

/**
 * IP-Drossel für die Gast-Anmeldung — der I/O-freie Kern.
 *
 * Das Rate-Limit je Aufenthalt (`stays.pin_attempts`, 5 Fehlversuche → 15 min
 * Sperre) schützt die PIN eines einzelnen Zimmers. Es schützt NICHT gegen
 * jemanden, der von außen alle Zimmernummern eines Hauses durchprobiert: der
 * lernt aus der Antwortzeit nichts, sperrt aber mit fünf Versuchen je Zimmer
 * nacheinander jeden echten Gast aus — und sieht, welche Nummern es gibt.
 *
 * Deshalb zusätzlich ein Zähler je Absender-IP über alle Häuser hinweg, als
 * gleitendes Fenster: mehr als `IP_MAX_FAILURES` Fehlversuche in den letzten
 * `IP_WINDOW_MINUTES` Minuten, und die Anmeldung wird für diese IP abgewiesen —
 * auch mit richtiger PIN. Erfolge zählen nicht; das Fenster gleitet, eine
 * Sperre läuft also von selbst aus, sobald genug Fehlversuche alt genug sind.
 *
 * **Die Schwelle ist bewusst hoch.** Alle Gäste eines Hauses teilen sich
 * hinter dem Hotel-WLAN meist EINE öffentliche IP. Fünf Fehlversuche pro IP
 * würden am Anreisetag das ganze Haus aussperren, sobald ein paar Gäste sich
 * vertippen. Dreißig Fehlversuche in einer Viertelstunde kommen dagegen im
 * Betrieb nicht zusammen, begrenzen einen Angreifer aber auf sechs Zimmer je
 * Viertelstunde statt auf alle.
 */
export const IP_MAX_FAILURES = 30
export const IP_WINDOW_MINUTES = 15
export const IP_WINDOW_MS = IP_WINDOW_MINUTES * 60_000

/** Ersatzschlüssel, wenn kein Header die IP nennt — die Drossel gilt trotzdem. */
export const UNKNOWN_IP = 'unknown'

/**
 * Absender-IP aus den Request-Headern. Auf Vercel trägt `x-forwarded-for` die
 * Adresse des Clients (vom Edge gesetzt, nicht vom Client beeinflussbar); bei
 * mehreren Stationen steht der Ursprung vorn. `x-real-ip` ist der Rückfall.
 *
 * Nimmt eine `get`-Funktion statt eines `Headers`-Objekts, damit die Logik
 * ohne Next.js testbar bleibt.
 */
export function clientIp(get: (name: string) => string | null | undefined): string {
  const forwarded = get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',').map(s => s.trim()).find(Boolean)
    if (first) return first
  }
  const real = get('x-real-ip')?.trim()
  return real || UNKNOWN_IP
}

/**
 * Pseudonym der IP für die Ablage. Eine IP-Adresse ist personenbezogen; in
 * der Tabelle steht deshalb nur ihr Hash, und die Zeilen leben ohnehin nur
 * bis das Fenster über sie hinweggeglitten ist. Der Hash muss nicht
 * rückrechenbar sein — er muss nur für dieselbe IP gleich bleiben.
 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

export type ThrottleVerdict =
  | { blocked: false }
  | { blocked: true; retryAfterMinutes: number }

/**
 * Entscheidet über eine IP anhand ihrer Fehlversuche im Fenster.
 *
 * @param failuresDesc Zeitpunkte der Fehlversuche innerhalb des Fenstern,
 *   neueste zuerst (Epoch-ms). Mehr als `max` Einträge werden ignoriert.
 *
 * Die Sperre endet, wenn der `max`-te jüngste Fehlversuch aus dem Fenster
 * fällt — genau dann sind wieder weniger als `max` Versuche im Fenster.
 */
export function evaluateThrottle(
  failuresDesc: number[],
  nowMs: number,
  opts: { max?: number; windowMs?: number } = {},
): ThrottleVerdict {
  const max = opts.max ?? IP_MAX_FAILURES
  const windowMs = opts.windowMs ?? IP_WINDOW_MS
  const inWindow = failuresDesc.filter(t => t > nowMs - windowMs)
  if (inWindow.length < max) return { blocked: false }

  const pivot = [...inWindow].sort((a, b) => b - a)[max - 1]
  const liftsAt = pivot + windowMs
  return { blocked: true, retryAfterMinutes: Math.max(1, Math.ceil((liftsAt - nowMs) / 60_000)) }
}

export function throttleMessage(retryAfterMinutes: number): string {
  return `Zu viele Fehlversuche aus diesem Netz — bitte in ${retryAfterMinutes} Min. erneut versuchen.`
}
