/**
 * Vorlagen für die Mails, die bis zum 12.09.2026 Supabase Auth verschickt hat:
 * Einladung ins Haus und Link zum Zurücksetzen des Passworts.
 *
 * Seither baut die Anwendung diese Mails selbst und übergibt sie an Resend —
 * Supabase liefert nur noch den Link (`generateLink`). Grund: Nur so gibt es
 * eine Rückmeldung über die Zustellung (Webhook, siehe `mail-status.ts`);
 * über die SMTP-Strecke von Supabase kam nichts zurück.
 *
 * I/O-frei und getestet: HTML und Reintext entstehen aus denselben Sätzen,
 * damit sie nicht auseinanderlaufen.
 */

export type MailContent = { subject: string; html: string; text: string }

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const STYLE_BODY = "font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1e293b;line-height:1.5"
const STYLE_BUTTON = 'background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold'
const STYLE_SMALL = 'margin-top:24px;font-size:13px;color:#64748b'

function knopf(url: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="${STYLE_BUTTON}">${escapeHtml(label)}</a></p>`
}

function linkZeile(url: string): string {
  const u = escapeHtml(url)
  return `<p style="${STYLE_SMALL}">Falls sich der Knopf nicht öffnen lässt:<br><a href="${u}">${u}</a></p>`
}

/**
 * Einladung als Rezeption oder Manager. Trägt Haus, Rolle und Anrede — ein
 * englischer Zweizeiler mit nacktem Link war genau das Muster, das Gmail als
 * Werbung einsortiert hat (Juli 2026).
 */
export function inviteMail(m: {
  hotelName: string
  displayName: string
  rolle: 'Rezeption' | 'Manager'
  url: string
  /** Wer eingeladen hat — steht in der Mail, damit sie sich einordnen lässt. */
  invitedBy?: string
}): MailContent {
  const hotel = escapeHtml(m.hotelName)
  const name = escapeHtml(m.displayName)
  const von = m.invitedBy ? ` von ${m.invitedBy}` : ''

  const html = `<!doctype html>
<html lang="de"><body style="${STYLE_BODY}">
  <p>Guten Tag ${name},</p>
  <p>Sie sind${escapeHtml(von)} als <strong>${escapeHtml(m.rolle)}</strong> für <strong>${hotel}</strong> in RoSe eingeladen worden.</p>
  <p>Über den folgenden Knopf vergeben Sie Ihr Passwort und melden sich danach mit dieser E-Mail-Adresse an.</p>
  ${knopf(m.url, 'Passwort vergeben')}
  ${linkZeile(m.url)}
  <p style="${STYLE_SMALL}">Der Link ist begrenzt gültig. Falls Sie diese Einladung nicht erwarten, können Sie die Mail ignorieren.</p>
</body></html>`

  const text = [
    `Guten Tag ${m.displayName},`,
    '',
    `Sie sind${von} als ${m.rolle} für ${m.hotelName} in RoSe eingeladen worden.`,
    'Über den folgenden Link vergeben Sie Ihr Passwort und melden sich danach mit dieser E-Mail-Adresse an.',
    '',
    m.url,
    '',
    'Der Link ist begrenzt gültig. Falls Sie diese Einladung nicht erwarten, können Sie die Mail ignorieren.',
  ].join('\n')

  return { subject: `Einladung: ${m.rolle} für ${m.hotelName} in RoSe`, html, text }
}

/** Link zum Zurücksetzen des Passworts (oder zum ersten Setzen nach einer Einladung). */
export function recoveryMail(m: { url: string; einladung?: boolean }): MailContent {
  const einleitung = m.einladung
    ? 'hier ist Ihr neuer Link, um das Passwort für Ihren RoSe-Zugang zu vergeben.'
    : 'für Ihren RoSe-Zugang wurde ein neues Passwort angefordert.'

  const html = `<!doctype html>
<html lang="de"><body style="${STYLE_BODY}">
  <p>Guten Tag,</p>
  <p>${escapeHtml(einleitung)}</p>
  ${knopf(m.url, m.einladung ? 'Passwort vergeben' : 'Neues Passwort setzen')}
  ${linkZeile(m.url)}
  <p style="${STYLE_SMALL}">Der Link ist begrenzt gültig und lässt sich auf jedem Gerät öffnen. Haben Sie kein neues Passwort angefordert, können Sie die Mail ignorieren — Ihr Passwort bleibt unverändert.</p>
</body></html>`

  const text = [
    'Guten Tag,',
    '',
    einleitung,
    '',
    m.url,
    '',
    'Der Link ist begrenzt gültig und lässt sich auf jedem Gerät öffnen. Haben Sie kein neues Passwort angefordert, können Sie die Mail ignorieren — Ihr Passwort bleibt unverändert.',
  ].join('\n')

  return {
    subject: m.einladung ? 'Ihr Link zum Passwort für RoSe' : 'Neues Passwort für RoSe',
    html,
    text,
  }
}
