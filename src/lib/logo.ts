import { randomBytes } from 'node:crypto'

/**
 * Hotel-Logo — die Rechenlogik ohne I/O: Ablagepfad, öffentliche URL und die
 * Prüfung einer hochgeladenen Datei. Der Storage-Teil liegt in
 * [utils/logo.ts](../utils/logo.ts).
 *
 * **Warum Storage und nicht die Datenbank** (09.09.2026, Bauplan
 * `Sessions/Druckblaetter-Plan-2026-09-09.md`): In `hotels.policies` darf das
 * Bild nicht liegen — die Policies hängen im `ManagementContext` und werden bei
 * JEDEM Request mitgeladen; ein 40-KB-Logo dort wäre eine Latenzregression auf
 * jeder Seite. Eine eigene Base64-Spalte wäre möglich, aber ein öffentlicher
 * Storage-Pfad hat zwei Vorteile, die wir beide noch brauchen: der Browser holt
 * das Bild über den CDN statt durch jede Seitenauslieferung, und eine echte URL
 * funktioniert später in der Mail — `data:`-URIs blockiert Gmail (beim QR-Bild
 * schon aufgefallen).
 *
 * **Der Dateiname trägt einen Zufallsanteil**, und der alte Gegenstand wird
 * nach dem Upload gelöscht. Ein fester Name mit `upsert` liefert über den CDN
 * sonst tagelang das alte Bild aus; unveränderliche URLs sind billiger als
 * Cache-Busting per `?v=`.
 *
 * **Die Bytes entscheiden, nicht die Endung und nicht der vom Browser
 * gemeldete Typ.** Ein umbenanntes ZIP soll nicht durchgehen.
 */

/** Öffentlicher Storage-Bucket; angelegt in `2026-09-09_hotels_logo.sql`. */
export const LOGO_BUCKET = 'hotel-logos'

/** 1 MB. Ein Logo, das mehr braucht, ist ein Foto. */
export const LOGO_MAX_BYTES = 1024 * 1024

/**
 * Unter dieser Breite wird ein Bitmap-Logo auf dem Blatt (55 mm) sichtbar
 * unscharf. Nur ein Hinweis, keine Ablehnung — und für SVG bedeutungslos.
 */
export const LOGO_MIN_WIDTH_PX = 400

export type LogoMime = 'image/png' | 'image/jpeg' | 'image/svg+xml'

/** Für das `accept`-Attribut der Dateiauswahl. */
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/svg+xml'

const ENDUNG: Record<LogoMime, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
}

/** So viele Bytes reichen, um den Typ zu erkennen (SVG braucht am meisten). */
export const LOGO_HEAD_BYTES = 1024

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Der Ordner eines Hauses im Bucket. Auch die Löschung räumt über ihn ab —
 * Storage-Gegenstände haben keinen Fremdschlüssel auf `hotels`, die Kaskade
 * erledigt das nicht.
 */
export function logoFolder(hotelId: string): string {
  if (!UUID.test(hotelId)) throw new Error('logoFolder: keine Hotel-UUID')
  return hotelId
}

/** `<hotelId>/logo-<8 hex>.<ext>` — der Zufallsanteil macht die URL stabil. */
export function logoObjectPath(hotelId: string, mime: LogoMime): string {
  return `${logoFolder(hotelId)}/logo-${randomBytes(4).toString('hex')}.${ENDUNG[mime]}`
}

/**
 * Öffentliche URL aus der Supabase-Basis-URL. Gespeichert wird nur der Pfad —
 * eine gespeicherte Voll-URL würde bei einem Instanzwechsel zum
 * Datenbank-Update.
 */
export function logoPublicUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${LOGO_BUCKET}/${path}`
}

/** Typ aus den ersten Bytes. `null` = keiner der erlaubten. */
export function detectLogoMime(head: Uint8Array): LogoMime | null {
  if (
    head.length >= 8 &&
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
    head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg'
  }
  // SVG ist Text: irgendwo im Kopf steht `<svg`, davor gern eine
  // XML-Deklaration oder ein Doctype.
  const text = new TextDecoder('utf-8', { fatal: false }).decode(head)
  if (/<svg[\s>]/i.test(text)) return 'image/svg+xml'
  return null
}

export type LogoCheck = { mime: LogoMime } | { error: string }

/**
 * Prüft Größe und Typ. Die Meldungen gehen so an die Rezeption bzw. den
 * Inhaber — deshalb deutsch und ohne Fachbegriffe.
 */
export function validateLogoUpload(size: number, head: Uint8Array): LogoCheck {
  if (!Number.isFinite(size) || size <= 0) return { error: 'Die Datei ist leer.' }
  if (size > LOGO_MAX_BYTES) {
    return { error: `Die Datei ist zu groß (${Math.round(size / 1024)} KB). Höchstens 1 MB.` }
  }
  const mime = detectLogoMime(head)
  if (!mime) return { error: 'Nur PNG, JPG oder SVG — die Datei ist keines davon.' }
  return { mime }
}
