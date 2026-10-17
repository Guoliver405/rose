/**
 * Vorlagen für die Mails, die bis zum 12.09.2026 Supabase Auth verschickt hat:
 * Einladung ins Haus und Link zum Zurücksetzen des Passworts.
 *
 * Seither baut die Anwendung diese Mails selbst und übergibt sie an Resend —
 * Supabase liefert nur noch den Link (`generateLink`). Grund: Nur so gibt es
 * eine Rückmeldung über die Zustellung (Webhook, siehe `mail-status.ts`);
 * über die SMTP-Strecke von Supabase kam nichts zurück.
 *
 * Die Sätze stehen seit 10.10.2026 in der Sprachdatei (`i18n/de/mail.ts`);
 * hier steht nur noch der Aufbau. I/O-frei und getestet: HTML und Reintext
 * entstehen aus denselben Sätzen, damit sie nicht auseinanderlaufen.
 */
import { format, getMessages, parseRich, type AdminMessages, type Locale, type Vars } from './i18n'

export type MailContent = { subject: string; html: string; text: string }

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Satz aus der Sprachdatei als HTML: Text escapen, `<b>…</b>` als `<strong>`. */
export function richHtml(template: string, vars: Vars = {}): string {
  return parseRich(template, vars)
    .map(p => (p.tag === 'b' ? `<strong>${escapeHtml(p.text)}</strong>` : escapeHtml(p.text)))
    .join('')
}

/** Derselbe Satz ohne Auszeichnung — für die Reintext-Fassung. */
export function plainText(template: string, vars: Vars = {}): string {
  return parseRich(template, vars).map(p => p.text).join('')
}

const STYLE_BODY = "font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1e293b;line-height:1.5"
const STYLE_BUTTON = 'background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold'
const STYLE_SMALL = 'margin-top:24px;font-size:13px;color:#64748b'

/**
 * Texte der Vorlagen. Ohne Sprache Deutsch; seit 17.10.2026 geben Mails aus
 * der Verwaltung (Einladung, Passwort-Link) die Sprache der auslösenden
 * Person mit (`locale`).
 */
function t(locale?: Locale) {
  return getMessages(locale).mail.templates
}

function knopf(url: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="${STYLE_BUTTON}">${escapeHtml(label)}</a></p>`
}

function linkZeile(url: string, locale?: Locale): string {
  const u = escapeHtml(url)
  return `<p style="${STYLE_SMALL}">${escapeHtml(t(locale).fallback)}<br><a href="${u}">${u}</a></p>`
}

/**
 * Einladung als Rezeption oder Manager. Trägt Haus, Rolle und Anrede — ein
 * englischer Zweizeiler mit nacktem Link war genau das Muster, das Gmail als
 * Werbung einsortiert hat (Juli 2026).
 */
export function inviteMail(m: {
  locale?: Locale
  hotelName: string
  displayName: string
  /** Rolle in der Sprache der Mail (`admin.settings.myAccess.roles`). */
  rolle: string
  url: string
  /** Wer eingeladen hat — steht in der Mail, damit sie sich einordnen lässt. */
  invitedBy?: string
}): MailContent {
  const v = t(m.locale).invite
  const vars = { name: m.displayName, role: m.rolle, hotel: m.hotelName, by: m.invitedBy ?? '' }
  const satz = m.invitedBy ? v.invitedBy : v.invited

  const html = `<!doctype html>
<html lang="${m.locale ?? 'de'}"><body style="${STYLE_BODY}">
  <p>${escapeHtml(format(v.greeting, vars))}</p>
  <p>${richHtml(satz, vars)}</p>
  <p>${escapeHtml(v.body)}</p>
  ${knopf(m.url, v.button)}
  ${linkZeile(m.url, m.locale)}
  <p style="${STYLE_SMALL}">${escapeHtml(v.note)}</p>
</body></html>`

  const text = [
    format(v.greeting, vars),
    '',
    plainText(satz, vars),
    v.bodyText,
    '',
    m.url,
    '',
    v.note,
  ].join('\n')

  return { subject: format(v.subject, vars), html, text }
}

/** Link zum Zurücksetzen des Passworts (oder zum ersten Setzen nach einer Einladung). */
export function recoveryMail(m: { url: string; einladung?: boolean; locale?: Locale }): MailContent {
  const v = t(m.locale).recovery
  const einleitung = m.einladung ? v.introInvite : v.intro

  const html = `<!doctype html>
<html lang="${m.locale ?? 'de'}"><body style="${STYLE_BODY}">
  <p>${escapeHtml(t(m.locale).greeting)}</p>
  <p>${escapeHtml(einleitung)}</p>
  ${knopf(m.url, m.einladung ? v.buttonInvite : v.button)}
  ${linkZeile(m.url, m.locale)}
  <p style="${STYLE_SMALL}">${escapeHtml(v.note)}</p>
</body></html>`

  const text = [t(m.locale).greeting, '', einleitung, '', m.url, '', v.note].join('\n')

  return { subject: m.einladung ? v.subjectInvite : v.subject, html, text }
}

/**
 * Bestätigung eines Simulator-Kontos (26.09.2026). Mit gesetztem Werbe-Häkchen
 * nennt die Mail die Einwilligung ausdrücklich — der Klick bestätigt Adresse
 * und Einwilligung in einem Schritt (Double-Opt-in).
 */
export function simConfirmMail(m: { url: string; marketing: boolean; toolName: string }): MailContent {
  const v = t().simConfirm
  const zweck = format(v.purpose, { tool: m.toolName })

  const html = `<!doctype html>
<html lang="de"><body style="${STYLE_BODY}">
  <p>${escapeHtml(t().greeting)}</p>
  <p>${escapeHtml(zweck)}</p>
  ${m.marketing ? `<p>${escapeHtml(v.marketing)}</p>` : ''}
  ${knopf(m.url, v.button)}
  ${linkZeile(m.url)}
  <p style="${STYLE_SMALL}">${escapeHtml(v.note)}</p>
</body></html>`

  const text = [t().greeting, '', zweck, ...(m.marketing ? ['', v.marketing] : []), '', m.url, '', v.note].join('\n')
  return { subject: format(v.subject, { tool: m.toolName }), html, text }
}

/**
 * Registrierung mit einer Adresse, zu der es schon einen RoSe-Zugang gibt.
 * Die Seite antwortet in diesem Fall genauso wie bei einer neuen Adresse —
 * sonst verriete sie, ob es ein Konto gibt —, und die eigentliche Antwort
 * kommt per Mail an die Person, der die Adresse gehört.
 */
export function simExistsMail(m: { loginUrl: string; resetUrl: string; toolName: string }): MailContent {
  const v = t().simExists
  // Nicht „steht Ihnen zur Verfügung": Rezeptionszugänge bekommen den Simulator nicht (26.09.2026).
  const satz = format(v.text, { tool: m.toolName, url: m.loginUrl.replace(/\/login$/, '/simulator') })

  const html = `<!doctype html>
<html lang="de"><body style="${STYLE_BODY}">
  <p>${escapeHtml(t().greeting)}</p>
  <p>${escapeHtml(satz)}</p>
  ${knopf(m.loginUrl, v.button)}
  <p>${escapeHtml(v.forgot)} <a href="${escapeHtml(m.resetUrl)}">${escapeHtml(m.resetUrl)}</a></p>
  <p style="${STYLE_SMALL}">${escapeHtml(v.note)}</p>
</body></html>`

  const text = [t().greeting, '', satz, '', format(v.buttonText, { url: m.loginUrl }), '', `${v.forgot} ${m.resetUrl}`, '', v.note].join('\n')
  return { subject: v.subject, html, text }
}

type EmailChangeMails = AdminMessages['settings']['myAccess']['mails']

/**
 * Bestätigungslink an die NEUE Anmelde-Adresse (11.10.2026). Erst der Klick
 * stellt um; die Texte stehen unter „Mein Zugang“ in der Sprachdatei.
 */
export function emailChangeConfirmMail(m: { url: string; hours: number; texts: EmailChangeMails }): MailContent {
  const v = m.texts.confirm
  const note = format(v.note, { hours: m.hours })

  const html = `<!doctype html>
<html lang="de"><body style="${STYLE_BODY}">
  <p>${escapeHtml(t().greeting)}</p>
  <p>${escapeHtml(v.intro)}</p>
  ${knopf(m.url, v.button)}
  ${linkZeile(m.url)}
  <p style="${STYLE_SMALL}">${escapeHtml(note)}</p>
</body></html>`

  const text = [t().greeting, '', v.intro, '', m.url, '', note].join('\n')
  return { subject: v.subject, html, text }
}

/** Hinweis an die BISHERIGE Adresse, nachdem umgestellt wurde. */
export function emailChangedNoticeMail(m: { newEmail: string; imprintUrl: string; texts: EmailChangeMails }): MailContent {
  const v = m.texts.changed
  const vars = { email: m.newEmail, imprint: m.imprintUrl }

  const html = `<!doctype html>
<html lang="de"><body style="${STYLE_BODY}">
  <p>${escapeHtml(t().greeting)}</p>
  <p>${richHtml(v.intro, vars)}</p>
  <p>${richHtml(v.notYou, vars)}</p>
</body></html>`

  const text = [t().greeting, '', plainText(v.intro, vars), '', plainText(v.notYou, vars)].join('\n')
  return { subject: v.subject, html, text }
}
