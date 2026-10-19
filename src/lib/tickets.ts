/**
 * „Problem melden“ – die Rechenlogik ohne I/O: Arten und Zustände, wer ein
 * Ticket sehen darf, Prüfung von Eingaben, Bildschirmfoto und Kontext. Der
 * Datenbank- und Storage-Teil liegt in [utils/tickets.ts](../utils/tickets.ts),
 * Migration `Supabase_sql/2026-10-19_tickets.sql`.
 *
 * **Der Dialog läuft in RoSe, nicht per Mail** (Entscheidung des Users,
 * 19.10.2026): Ob die meldende Person das Postfach ihrer Anmelde-Adresse
 * liest, ist offen – an der Rezeption sitzt mal diese, mal jene. Per Mail geht
 * deshalb nur ein Hinweis mit Link, nie der Inhalt.
 *
 * **Bearbeitet wird gemeinsam**, nicht automatisch: Das RoSe-Team liest unter
 * `/support`, eine Automatik ist ausdrücklich erst später denkbar. Der Text
 * einer Meldung ist Information, keine Anweisung.
 */

export const TICKET_KINDS = ['bug', 'translation', 'question', 'idea'] as const
export type TicketKind = (typeof TICKET_KINDS)[number]

/**
 * `new` – noch von niemandem im RoSe-Team geöffnet · `open` – in Arbeit ·
 * `waiting` – wartet auf eine Antwort des Kunden · `done` – erledigt.
 */
export const TICKET_STATUSES = ['new', 'open', 'waiting', 'done'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export type TicketRole = 'admin' | 'manager' | 'reception'

export const SUBJECT_MAX = 120
export const BODY_MAX = 5000
/** Mehr Meldungen je Person und Stunde sind kein Nutzerverhalten. */
export const TICKETS_PER_HOUR = 10

export function isTicketKind(v: unknown): v is TicketKind {
  return typeof v === 'string' && (TICKET_KINDS as readonly string[]).includes(v)
}

export function isTicketStatus(v: unknown): v is TicketStatus {
  return typeof v === 'string' && (TICKET_STATUSES as readonly string[]).includes(v)
}

// ─── Sichtbarkeit ────────────────────────────────────────────────────────────

/** Zugriff der betrachtenden Person je Haus – Auszug aus `listAccessibleHotels`. */
export type ViewerAccess = { hotelId: string; accountId: string; role: TicketRole }

export type TicketScope = { accountId: string; hotelId: string | null; reporterId: string | null }

/**
 * Wer ein Ticket sieht (Entscheidung des Users, 19.10.2026): die meldende
 * Person, der Inhaber des Kontos und die Manager des betroffenen Hauses – eine
 * Meldung der Rezeption soll nicht an der Leitung vorbeilaufen.
 *
 * Die meldende Person nur, solange sie im Konto noch Zugriff hat: Wer das Haus
 * verlassen hat, liest die Gespräche seines früheren Arbeitgebers nicht weiter.
 */
export function canSeeTicket(ticket: TicketScope, userId: string, access: ViewerAccess[]): boolean {
  const imKonto = access.filter(a => a.accountId === ticket.accountId)
  if (imKonto.length === 0) return false
  if (imKonto.some(a => a.role === 'admin')) return true
  if (ticket.hotelId && imKonto.some(a => a.hotelId === ticket.hotelId && a.role === 'manager')) return true
  return ticket.reporterId === userId
}

/** Die Konten von `/support` – Auth-IDs, durch Komma oder Leerzeichen getrennt. */
export function parseSupportIds(raw: string | undefined): string[] {
  return (raw ?? '').split(/[\s,]+/).map(s => s.trim().toLowerCase()).filter(s => UUID.test(s))
}

// ─── Eingaben ────────────────────────────────────────────────────────────────

export type TicketInputError = 'kind' | 'subject' | 'body'

/** Prüft und bereinigt Art, Betreff und Text. */
export function validateTicketInput(raw: { kind: unknown; subject: unknown; body: unknown }):
  { kind: TicketKind; subject: string; body: string } | { error: TicketInputError } {
  if (!isTicketKind(raw.kind)) return { error: 'kind' }
  const subject = String(raw.subject ?? '').replace(/\s+/g, ' ').trim()
  if (!subject || subject.length > SUBJECT_MAX) return { error: 'subject' }
  const body = cleanBody(raw.body)
  if (!body) return { error: 'body' }
  return { kind: raw.kind, subject, body }
}

/** Antwort oder Meldungstext: Zeilen bleiben, Ränder und Überlängen nicht. */
export function cleanBody(raw: unknown): string | null {
  const body = String(raw ?? '').replace(/\r\n?/g, '\n').trim()
  if (!body || body.length > BODY_MAX) return null
  return body
}

// ─── Kontext ─────────────────────────────────────────────────────────────────

/**
 * Was die Meldung von selbst mitbringt, damit niemand es abtippen muss. Nichts
 * davon ist geheim; trotzdem wird alles gekürzt, weil es aus dem Browser kommt.
 */
export type TicketContext = {
  path: string | null
  locale: string | null
  viewport: string | null
  userAgent: string | null
  /** Die letzten Fehlermeldungen im Browser, jüngste zuletzt. */
  errors: string[]
}

const cut = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null
  const s = v.replace(/[\u0000-\u001f]+/g, ' ').trim()
  return s ? s.slice(0, max) : null
}

export function sanitizeContext(raw: unknown): TicketContext {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const errors = Array.isArray(o.errors) ? o.errors : []
  return {
    path: cut(o.path, 300),
    locale: cut(o.locale, 20),
    viewport: cut(o.viewport, 30),
    userAgent: cut(o.userAgent, 300),
    errors: errors.map(e => cut(e, 300)).filter((e): e is string => e !== null).slice(-10),
  }
}

/** Kontext aus einem Formularfeld (JSON). Kaputtes JSON ist kein Grund, die Meldung zu verlieren. */
export function parseContext(json: unknown): TicketContext {
  try {
    return sanitizeContext(typeof json === 'string' ? JSON.parse(json) : null)
  } catch {
    return sanitizeContext(null)
  }
}

// ─── Bildschirmfoto ──────────────────────────────────────────────────────────

/** Privater Bucket; angelegt in `2026-10-19_tickets.sql`. */
export const SCREENSHOT_BUCKET = 'ticket-screenshots'

/**
 * 1 MB – die Grenze, die Server-Actions ohne eigene Einstellung annehmen. Der
 * Browser verkleinert vorher (`TicketDialog`), ein Bildschirmfoto passt danach
 * fast immer.
 */
export const SCREENSHOT_MAX_BYTES = 1024 * 1024
/** Längste Kante nach dem Verkleinern im Browser. */
export const SCREENSHOT_MAX_EDGE = 1920

export type ScreenshotMime = 'image/png' | 'image/jpeg' | 'image/webp'
const ENDUNG: Record<ScreenshotMime, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

/** Die Bytes entscheiden, nicht Endung oder gemeldeter Typ (wie beim Logo). */
export function detectScreenshotMime(head: Uint8Array): ScreenshotMime | null {
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return 'image/png'
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg'
  if (
    head.length >= 12 &&
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  ) return 'image/webp'
  return null
}

export type ScreenshotCheck = { mime: ScreenshotMime } | { error: 'tooLarge' | 'wrongType' }

export function validateScreenshot(size: number, head: Uint8Array): ScreenshotCheck {
  if (size > SCREENSHOT_MAX_BYTES) return { error: 'tooLarge' }
  const mime = detectScreenshotMime(head)
  return mime ? { mime } : { error: 'wrongType' }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `<accountId>/<ticketId>-<8 hex>.<ext>` – der Ordner je Konto ist zugleich
 * der Weg, über den die Kontolöschung aufräumt: Storage kennt keinen
 * Fremdschlüssel.
 */
export function screenshotPath(accountId: string, ticketId: string, mime: ScreenshotMime): string {
  if (!UUID.test(accountId) || !UUID.test(ticketId)) throw new Error('screenshotPath: keine UUID')
  // Web-Crypto statt node:crypto: die Datei wird auch im Browser gelesen (Grenzen, Arten).
  const zufall = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(4)), b => b.toString(16).padStart(2, '0')).join('')
  return `${accountId}/${ticketId}-${zufall}.${ENDUNG[mime]}`
}

// ─── Mails ───────────────────────────────────────────────────────────────────

/**
 * An `.local`-Adressen (Testzugänge) und an Reinigungskräfte (Adresse aus dem
 * Benutzernamen gebaut) geht keine Mail – dort liest niemand.
 */
export function mailableAddress(email: string | null | undefined): string | null {
  if (!email) return null
  const e = email.trim()
  if (!/^\S+@\S+\.\S+$/.test(e)) return null
  if (/\.local$/i.test(e)) return null
  return e
}
