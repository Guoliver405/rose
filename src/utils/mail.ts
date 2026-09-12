/**
 * Mail-Versand der Anwendung — **ein** Weg für alle Mails.
 *
 * Bis zum 12.09.2026 verschickte Supabase Auth Einladungen und Passwort-Links
 * über Custom SMTP (Resend), und nur der Gast-Zugang ging direkt gegen die
 * Resend-API. Das hatte zwei Löcher: Supabase meldete die Minuten-Sperre je
 * Adresse zwar als Fehler, aber nichts darüber hinaus — und **niemand erfuhr
 * von einem Bounce**. Freenet wies Mails ab, die Oberfläche sagte „verschickt".
 *
 * Seither läuft alles über `dispatch`: Zeile in `mail_log` anlegen, an Resend
 * übergeben (mit unserer Zeilen-ID als Tag), Ergebnis eintragen. Resend meldet
 * den weiteren Weg per Webhook (`/api/resend/webhook`), die Oberfläche fragt
 * `mailStatus` nach dem Senden eine Minute lang nach. Supabase liefert für
 * Einladung und Passwort nur noch den Link (`generateLink`), verschickt aber
 * nichts mehr — die Mail-Vorlagen im Supabase-Dashboard sind damit unbenutzt.
 *
 * **Adressen werden nicht gespeichert.** `stays` bleibt anonym; die Zeile
 * trägt nur den Bezug (Aufenthalt bzw. Auth-Konto), über den sie mit dessen
 * Löschung kaskadiert.
 *
 * Ohne konfigurierten Schlüssel bleibt der Versand aus — die Oberfläche bietet
 * ihn dann gar nicht erst an, statt einen Fehler zu werfen. Der Env-Name
 * `GUEST_MAIL_FROM` stammt aus der Zeit, als nur die Gast-Mail hier lief; er
 * ist heute die Absenderadresse **aller** Mails (umbenennen hieße, Vercel
 * anzufassen, ohne dass sich etwas verbessert).
 *
 * Ein `fetch` gegen die Resend-API, kein Paket.
 */

import { createAdminClient } from '@/utils/supabase/service'
import { guideLines, type GuestGuide } from '@/lib/guest-guide'
import { inviteMail, recoveryMail } from '@/lib/mail-templates'
import {
  advance, domainPattern, MAIL_COOLDOWN_SECONDS, MAIL_LOG_RETENTION_DAYS,
  recipientDomain, recipientHash, type DomainRow, type MailPurpose, type MailStatus,
} from '@/lib/mail-status'

const API = 'https://api.resend.com/emails'
const SUPPRESSIONS_API = 'https://api.resend.com/suppressions'

/** Ist der Versand eingerichtet? Steuert, ob die Oberfläche ihn anbietet. */
export function mailReady(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.GUEST_MAIL_FROM)
}

/**
 * Die Adresse steht auf der Sperrliste von Resend — der Versand wurde gar
 * nicht erst versucht. Die Oberfläche zeigt Grund und Datum und bietet die
 * Freigabe an (`release`), danach läuft derselbe Versand noch einmal.
 */
export type MailBlock = {
  /** Warum sie dort steht: harter Bounce, Spam-Beschwerde, von Hand. */
  origin: 'bounce' | 'complaint' | 'manual' | 'unknown'
  /** Seit wann (ISO), soweit bekannt. */
  since: string | null
  /** Der Grund des Empfänger-Servers aus dem eigenen Protokoll, soweit noch vorhanden. */
  detail: string | null
  /** Kann die Anwendung die Adresse selbst freigeben? (Resend-Schlüssel mit Vollzugriff) */
  canRelease: boolean
}

/** Ergebnis eines Versands: Zeilen-ID fürs Nachfragen — oder ein Fehler für die Oberfläche. */
export type MailResult = {
  logId?: string
  error?: string
  /** Sekunden bis zum nächsten erlaubten Versand. */
  wait?: number
  /** Nicht gesendet, weil die Adresse gesperrt ist — siehe `MailBlock`. */
  blocked?: MailBlock
  /**
   * Gesendet, aber mit Warnung: Dieser Provider hat zuletzt mehrere
   * verschiedene Adressen abgewiesen und nichts zugestellt.
   */
  domainWarning?: { domain: string; bounced: number; since: string }
}

/** Ein Ausschnitt aus dem Protokoll, wie ihn die Oberfläche bekommt. */
export type MailStatusView = { status: MailStatus; detail: string | null }

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Absender-Kopfzeile: **ein Anzeigename vor der festen Adresse**.
 *
 * Beim Gast steht das Haus davor — er hat bei einem Hotel eingecheckt, nicht
 * bei einer Software. Die Adresse selbst bleibt fest, weil nur ihre Domain bei
 * Resend verifiziert ist; der Anzeigename ist frei.
 *
 * Trägt `GUEST_MAIL_FROM` bereits einen Anzeigenamen (erkennbar an den spitzen
 * Klammern), bleibt der Wert unangetastet — dann hat jemand das bewusst so
 * gesetzt.
 *
 * Der Name wird bereinigt, bevor er in den Header wandert: Zeilenumbrüche
 * darin wären eine Header-Injection, Anführungszeichen und spitze Klammern
 * würden die Adresse zerlegen.
 */
function fromHeader(displayName: string): string {
  const konfiguriert = (process.env.GUEST_MAIL_FROM ?? '').trim()
  if (konfiguriert.includes('<')) return konfiguriert

  const name = displayName
    .replace(/[\r\n]+/g, ' ')
    .replace(/["\\<>]/g, '')
    .trim()
    .slice(0, 64)

  return name ? `"${name}" <${konfiguriert}>` : konfiguriert
}

// ─── Der gemeinsame Weg ──────────────────────────────────────────────────────

type Dispatch = {
  purpose: MailPurpose
  to: string
  fromName: string
  subject: string
  html: string
  text: string
  /** Bezug — genau einer davon ist die Grundlage der Drossel. */
  hotelId?: string
  userId?: string
  stayId?: string
  /**
   * Adresse vorher von der Sperrliste nehmen und senden, auch wenn sie
   * dort steht — die ausdrückliche Entscheidung der Person am Bildschirm,
   * nachdem sie Grund und Datum gesehen hat.
   */
  release?: boolean
}

// ─── Sperrliste bei Resend ───────────────────────────────────────────────────

/**
 * Resend setzt jede Adresse, die hart gebounct hat oder sich beschwert hat,
 * auf eine Sperrliste und liefert spätere Mails dorthin **still** nicht mehr
 * aus (Produktionslauf 12.09.2026: zweite Mail an eine gebouncte Adresse —
 * angenommen, nie zugestellt, kein Ereignis, solange `email.suppressed`
 * nicht abonniert ist). Ohne diese Abfrage wartete die Rezeption beim
 * zweiten Versuch vergeblich und könnte es nicht einmal lösen.
 *
 * Deshalb wird **vor** jedem Versand gefragt. Braucht einen Resend-Schlüssel
 * mit Vollzugriff; mit einem reinen Sende-Schlüssel antwortet die API 401 —
 * dann fällt die Prüfung auf das eigene Protokoll zurück (30 Tage Gedächtnis,
 * Freigabe nicht möglich).
 */
type SuppressionLookup =
  | { state: 'listed'; origin: MailBlock['origin']; since: string | null; sourceId: string | null }
  | { state: 'clear' }
  | { state: 'unavailable' }

async function lookupSuppression(email: string): Promise<SuppressionLookup> {
  try {
    const res = await fetch(`${SUPPRESSIONS_API}/${encodeURIComponent(email.trim().toLowerCase())}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })
    if (res.status === 404) return { state: 'clear' }
    if (!res.ok) {
      console.error('[mail] Sperrlisten-Abfrage antwortete', res.status, await res.text().catch(() => ''))
      return { state: 'unavailable' }
    }
    const j = (await res.json()) as { origin?: string; created_at?: string; source_id?: string | null }
    const origin = (['bounce', 'complaint', 'manual'] as const).find(o => o === j.origin) ?? 'unknown'
    return { state: 'listed', origin, since: j.created_at ?? null, sourceId: j.source_id ?? null }
  } catch (err) {
    console.error('[mail] Sperrlisten-Abfrage fehlgeschlagen:', err)
    return { state: 'unavailable' }
  }
}

/**
 * Adresse von der Sperrliste nehmen. 404 zählt als Erfolg (sie stand nicht
 * mehr darauf). Resend setzt sie beim nächsten Bounce von selbst wieder
 * darauf — die Freigabe ist also folgenlos, wenn die Adresse wirklich falsch
 * ist, und genau richtig, wenn der Fehler behoben wurde.
 */
export async function releaseSuppression(email: string): Promise<{ error?: string }> {
  try {
    const res = await fetch(`${SUPPRESSIONS_API}/${encodeURIComponent(email.trim().toLowerCase())}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })
    if (res.ok || res.status === 404) return {}
    const body = await res.text().catch(() => '')
    console.error('[mail] Freigabe antwortete', res.status, body)
    if (res.status === 401 || res.status === 403) {
      return { error: 'Die Freigabe ist mit dem hinterlegten Resend-Schlüssel nicht erlaubt (Vollzugriff nötig).' }
    }
    return { error: `Die Freigabe ist fehlgeschlagen (Resend antwortete ${res.status}).` }
  } catch (err) {
    console.error('[mail] Freigabe fehlgeschlagen:', err)
    return { error: 'Die Freigabe ist fehlgeschlagen: Resend nicht erreichbar.' }
  }
}

/**
 * Sperre feststellen — bei Resend, hilfsweise im eigenen Protokoll. Liefert
 * `null`, wenn gesendet werden darf.
 */
async function findBlock(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<MailBlock | null> {
  const hash = recipientHash(email)
  const live = await lookupSuppression(email)

  if (live.state === 'clear') return null

  // Der Grund des Empfänger-Servers steht in unserem Protokoll — über die
  // Resend-Kennung der auslösenden Mail, sonst über die jüngste Fehlzeile
  // dieser Adresse.
  let q = admin
    .from('mail_log')
    .select('status, detail, created_at')
    .in('status', ['bounced', 'complained', 'suppressed'])
    .order('created_at', { ascending: false })
    .limit(1)
  q = live.state === 'listed' && live.sourceId
    ? q.eq('resend_id', live.sourceId)
    : q.eq('recipient_hash', hash)
  const { data } = await q
  const eigene = data?.[0] ?? null

  if (live.state === 'listed') {
    return {
      origin: live.origin,
      since: live.since ?? eigene?.created_at ?? null,
      detail: eigene?.detail ?? null,
      canRelease: true,
    }
  }
  // Resend nicht fragbar (Schlüssel ohne Vollzugriff oder Störung): das
  // eigene Gedächtnis entscheidet, freigeben können wir dann nicht.
  if (!eigene) return null
  return {
    origin: eigene.status === 'complained' ? 'complaint' : 'bounce',
    since: eigene.created_at,
    detail: eigene.detail ?? null,
    canRelease: false,
  }
}

/** Provider-Muster aus dem Protokoll — siehe `domainPattern`. */
async function domainWarningFor(
  admin: ReturnType<typeof createAdminClient>,
  domain: string,
): Promise<MailResult['domainWarning']> {
  if (!domain) return undefined
  const { data } = await admin
    .from('mail_log')
    .select('recipient_hash, status, created_at')
    .eq('recipient_domain', domain)
    .in('status', ['delivered', 'bounced', 'suppressed'])
    .order('created_at', { ascending: false })
    .limit(50)
  const rows: DomainRow[] = (data ?? [])
    .filter(r => r.recipient_hash)
    .map(r => ({ recipientHash: r.recipient_hash as string, status: r.status as MailStatus, createdAt: r.created_at }))
  const muster = domainPattern(rows)
  return muster ? { domain, ...muster } : undefined
}

/**
 * Drossel: wie viele Sekunden muss dieser Bezug noch warten?
 *
 * Eine Mail je Bezug und Minute — dieselbe Regel, die Supabase je Adresse
 * hatte. Der Countdown in der Oberfläche zeigt dieselbe Zahl; hier steht sie,
 * weil ein Knopf im Browser keine Grenze ist.
 */
async function cooldown(
  admin: ReturnType<typeof createAdminClient>,
  d: Pick<Dispatch, 'purpose' | 'userId' | 'stayId'>,
): Promise<number> {
  if (!d.userId && !d.stayId) return 0
  const seit = new Date(Date.now() - MAIL_COOLDOWN_SECONDS * 1000).toISOString()
  let q = admin
    .from('mail_log')
    .select('created_at')
    .eq('purpose', d.purpose)
    .gte('created_at', seit)
    .order('created_at', { ascending: false })
    .limit(1)
  q = d.userId ? q.eq('user_id', d.userId) : q.eq('stay_id', d.stayId!)
  const { data } = await q
  const letzte = data?.[0]?.created_at
  if (!letzte) return 0
  const vergangen = (Date.now() - new Date(letzte).getTime()) / 1000
  return Math.max(1, Math.ceil(MAIL_COOLDOWN_SECONDS - vergangen))
}

/** Zeilen außerhalb der Aufbewahrung löschen — bei jedem Versand, kein Cron. */
async function aufraeumen(admin: ReturnType<typeof createAdminClient>): Promise<void> {
  const grenze = new Date(Date.now() - MAIL_LOG_RETENTION_DAYS * 86_400_000).toISOString()
  await admin.from('mail_log').delete().lt('created_at', grenze)
}

/**
 * Status nur nach vorn setzen. Der Webhook und die eigene Schreibung nach dem
 * Senden können sich überholen — `advance` entscheidet, wer gewinnt.
 */
export async function advanceMailStatus(
  logId: string,
  next: MailStatus,
  opts: { detail?: string | null; resendId?: string } = {},
): Promise<void> {
  const admin = createAdminClient()
  const { data: row } = await admin.from('mail_log').select('status').eq('id', logId).maybeSingle()
  if (!row) return
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (opts.resendId) update.resend_id = opts.resendId
  if (advance(row.status as MailStatus, next)) {
    update.status = next
    if (opts.detail !== undefined) update.detail = opts.detail
  }
  await admin.from('mail_log').update(update).eq('id', logId)
}

/** Zeile zu einer Resend-Kennung — Rückweg für Webhooks ohne unseren Tag. */
export async function mailLogIdByResendId(resendId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('mail_log').select('id').eq('resend_id', resendId).maybeSingle()
  return data?.id ?? null
}

/** Stand einer Zeile für die Oberfläche. */
export async function mailStatus(logId: string): Promise<MailStatusView | null> {
  const admin = createAdminClient()
  const { data } = await admin.from('mail_log').select('status, detail').eq('id', logId).maybeSingle()
  return data ? { status: data.status as MailStatus, detail: data.detail ?? null } : null
}

async function dispatch(d: Dispatch): Promise<MailResult> {
  if (!mailReady()) return { error: 'Mailversand ist nicht eingerichtet.' }
  if (!/^\S+@\S+\.\S+$/.test(d.to)) return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }

  const admin = createAdminClient()

  // Sperrliste zuerst: eine gesperrte Adresse kostet weder Drossel noch Zeile.
  if (d.release) {
    const { error } = await releaseSuppression(d.to)
    if (error) return { error }
  } else {
    const block = await findBlock(admin, d.to)
    if (block) return { blocked: block }
  }

  const wait = await cooldown(admin, d)
  if (wait > 0) {
    // Ohne Zahl im Text: die Oberfläche zählt daneben live herunter, eine
    // eingefrorene Sekundenangabe stünde sonst neben dem laufenden Countdown.
    return { wait, error: 'Gerade erst verschickt — bitte kurz warten, bevor erneut gesendet wird.' }
  }
  await aufraeumen(admin)

  const domain = recipientDomain(d.to)
  const domainWarning = await domainWarningFor(admin, domain)

  const { data: row, error: insErr } = await admin
    .from('mail_log')
    .insert({
      purpose: d.purpose,
      hotel_id: d.hotelId ?? null,
      user_id: d.userId ?? null,
      stay_id: d.stayId ?? null,
      recipient_hash: recipientHash(d.to),
      recipient_domain: domain || null,
    })
    .select('id')
    .single()
  if (insErr || !row) {
    console.error('[mail] mail_log insert:', insErr?.message)
    return { error: 'Die Mail konnte nicht verschickt werden.' }
  }
  const logId = row.id as string

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromHeader(d.fromName),
        to: [d.to],
        subject: d.subject,
        html: d.html,
        text: d.text,
        // Unsere Zeilen-ID reist mit und kommt im Webhook zurück — so findet
        // der Webhook die Zeile, auch wenn er die Schreibung der Resend-ID
        // unten überholt.
        tags: [{ name: 'log', value: logId }],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      // Der Klartext von Resend gehört ins Server-Log; für die Oberfläche
      // reicht die Meldung ohne Statuscode-Prosa.
      console.error('[mail] Resend antwortete', res.status, body)
      let grund = `Resend antwortete ${res.status}`
      try {
        const j = JSON.parse(body) as { message?: string }
        if (j.message) grund = j.message
      } catch { /* kein JSON */ }
      await advanceMailStatus(logId, 'failed', { detail: grund })
      return { logId, error: `Die Mail konnte nicht verschickt werden: ${grund}` }
    }

    const { id: resendId } = (await res.json()) as { id?: string }
    await advanceMailStatus(logId, 'sent', { resendId })
    return { logId, domainWarning }
  } catch (err) {
    console.error('[mail] Versand fehlgeschlagen:', err)
    await advanceMailStatus(logId, 'failed', { detail: 'Resend nicht erreichbar' })
    return { logId, error: 'Die Mail konnte nicht verschickt werden: Resend nicht erreichbar.' }
  }
}

// ─── Gast-Zugang ─────────────────────────────────────────────────────────────

export type GuestAccessMail = {
  to: string
  hotelId: string
  stayId: string
  hotelName: string
  roomNumber: string
  /** Adresse, die den Gast ins Portal bringt. */
  url: string
  /** Nur beim PIN-Verfahren. */
  pin?: string
  /**
   * Kurzanleitung — Zweck des Portals, Reinigung (Routine oder auf Wunsch,
   * je nach Policies des Hauses), Nicht stören, Services, Zugang. Dieselben
   * Sätze wie auf dem gedruckten Handout.
   */
  guide: GuestGuide
  /** Adresse vorher von der Sperrliste nehmen (Entscheidung der Rezeption). */
  release?: boolean
}

function guestHtml(m: GuestAccessMail): string {
  const hotel = escape(m.hotelName)
  const zimmer = escape(m.roomNumber)
  const url = escape(m.url)

  // Bewusst KEIN QR-Code im HTML: Gmail und andere blockieren `data:`-Bilder,
  // der Code wäre also ausgerechnet dort unsichtbar. In einer Mail genügt der
  // klickbare Link — QR-Codes braucht nur Papier.
  const pinBlock = m.pin
    ? `<p style="margin:16px 0 0">Ihre PIN: <strong style="font-size:20px;letter-spacing:3px">${escape(m.pin)}</strong></p>`
    : ''

  return `<!doctype html>
<html lang="de"><body style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1e293b;line-height:1.5">
  <p>Guten Tag,</p>
  <p>hier ist Ihr Zugang zum Gäste-Portal von <strong>${hotel}</strong>, Zimmer <strong>${zimmer}</strong>.</p>
  <p style="margin:24px 0">
    <a href="${url}" style="background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Gäste-Portal öffnen</a>
  </p>
  ${pinBlock}
  <p style="margin-top:24px;font-size:13px;color:#64748b">
    Falls sich der Knopf nicht öffnen lässt:<br><a href="${url}">${url}</a>
  </p>
  <h2 style="margin-top:28px;font-size:15px">So funktioniert das Portal</h2>
  <p>${escape(m.guide.purpose)}</p>
  <ul style="padding-left:20px">
    <li style="margin-bottom:8px"><strong>${escape(m.guide.labels.cleaning)}:</strong> ${escape(m.guide.cleaning)}</li>
    <li style="margin-bottom:8px"><strong>${escape(m.guide.labels.sustainability)}:</strong> ${escape(m.guide.sustainability)}</li>
    <li style="margin-bottom:8px"><strong>${escape(m.guide.labels.dnd)}:</strong> ${escape(m.guide.dnd)}</li>
    <li style="margin-bottom:8px"><strong>${escape(m.guide.labels.services)}:</strong> ${escape(m.guide.services)}</li>
    <li style="margin-bottom:8px"><strong>${escape(m.guide.labels.access)}:</strong> ${escape(m.guide.access)}</li>
  </ul>
</body></html>`
}

/**
 * Reintext-Fassung, inhaltlich identisch zum HTML. Eine Mail **nur** mit
 * HTML-Teil ist für Spamfilter ein Signal — Yahoo und Gmail bewerten fehlende
 * `text/plain`-Alternativen negativ, zumal bei einer Absender-Domain ohne
 * Sendehistorie. Kostet nichts und ist für Textclients ohnehin richtig.
 */
function guestText(m: GuestAccessMail): string {
  const zeilen = [
    'Guten Tag,',
    '',
    `hier ist Ihr Zugang zum Gäste-Portal von ${m.hotelName}, Zimmer ${m.roomNumber}.`,
    '',
    `Gäste-Portal öffnen: ${m.url}`,
  ]
  if (m.pin) zeilen.push('', `Ihre PIN: ${m.pin}`)
  zeilen.push('', 'So funktioniert das Portal:', '')
  for (const line of guideLines(m.guide)) zeilen.push(`- ${line}`)
  return zeilen.join('\n')
}

/** Verschickt den Gast-Zugang. Fehler formuliert für die Rezeption, nicht für den Gast. */
export function sendGuestAccessMail(m: GuestAccessMail): Promise<MailResult> {
  return dispatch({
    purpose: 'guest_access',
    to: m.to,
    fromName: m.hotelName,
    subject: `Ihr Zugang zum Gäste-Portal — ${m.hotelName}, Zimmer ${m.roomNumber}`,
    html: guestHtml(m),
    text: guestText(m),
    hotelId: m.hotelId,
    stayId: m.stayId,
    release: m.release,
  })
}

// ─── Einladung und Passwort-Link ─────────────────────────────────────────────

/** Einladung als Rezeption oder Manager — der Link kommt aus `generateLink`. */
export function sendInviteMail(m: {
  to: string
  userId: string
  hotelId: string
  hotelName: string
  displayName: string
  rolle: 'Rezeption' | 'Manager'
  url: string
  invitedBy?: string
  release?: boolean
}): Promise<MailResult> {
  const inhalt = inviteMail(m)
  return dispatch({
    purpose: 'invite',
    to: m.to,
    fromName: `${m.hotelName} via RoSe`,
    ...inhalt,
    hotelId: m.hotelId,
    userId: m.userId,
    release: m.release,
  })
}

/**
 * Passwort-Link — zum Zurücksetzen oder als erneute Einladung (dann trägt der
 * Text die Einladung, der Link ist technisch derselbe).
 */
export function sendRecoveryMail(m: {
  to: string
  userId: string
  hotelId?: string
  url: string
  einladung?: boolean
  release?: boolean
}): Promise<MailResult> {
  const inhalt = recoveryMail(m)
  return dispatch({
    purpose: m.einladung ? 'invite' : 'recovery',
    to: m.to,
    fromName: 'RoSe',
    ...inhalt,
    hotelId: m.hotelId,
    userId: m.userId,
    release: m.release,
  })
}

/**
 * Notbremse für die öffentliche Passwort-Seite: Supabase hatte dort ein
 * IP-Limit gratis, Resend nicht. Mehr als diese Zahl Passwort-Mails in einer
 * Stunde über alle Konten sind kein Nutzerverhalten, sondern jemand, der das
 * Kontingent leert — dann wird still nicht mehr verschickt.
 */
const RECOVERY_FLOOD_PER_HOUR = 30

export async function recoveryFlooded(): Promise<boolean> {
  const admin = createAdminClient()
  const seit = new Date(Date.now() - 3_600_000).toISOString()
  const { count } = await admin
    .from('mail_log')
    .select('id', { count: 'exact', head: true })
    .eq('purpose', 'recovery')
    .gte('created_at', seit)
  return (count ?? 0) >= RECOVERY_FLOOD_PER_HOUR
}

/** Basis für Links in Mails — dieselbe, die auch in den Aushängen steht. */
export function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
}

/** Der Einlöse-Link für einen `token_hash` aus `generateLink`, Ziel `/auth/confirm`. */
export function confirmUrl(tokenHash: string, type: 'invite' | 'recovery', next: string): string {
  const p = new URLSearchParams({ token_hash: tokenHash, type, next })
  return `${siteBase()}/auth/confirm?${p.toString()}`
}
