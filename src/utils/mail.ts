/**
 * Mail-Versand an Gäste — der erste eigene Versand der Anwendung.
 *
 * Bisher verschickt ausschließlich Supabase Auth (Einladungen, Passwort-Reset)
 * über Custom SMTP; im Projektcode lag bewusst kein Resend-Code. Für den
 * Gast-Zugang braucht es ihn nun doch — als **ein** HTTP-Aufruf gegen die
 * Resend-API, ohne zusätzliches Paket.
 *
 * **Die Adresse wird nicht gespeichert.** `stays` bleibt anonym: kein Name,
 * keine Adresse, kein Personenbezug. Die eingegebene Adresse lebt nur für die
 * Dauer dieses Aufrufs. Der Preis ist bewusst in Kauf genommen: Ein erneutes
 * Senden verlangt die erneute Eingabe, und es gibt keinen Nachweis darüber,
 * wohin gesendet wurde.
 *
 * Ohne konfigurierten Schlüssel bleibt der Versand schlicht aus — die
 * Oberfläche bietet ihn dann gar nicht erst an, statt einen Fehler zu werfen.
 */

const API = 'https://api.resend.com/emails'

/** Ist der Versand eingerichtet? Steuert, ob die Oberfläche ihn anbietet. */
export function mailReady(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.GUEST_MAIL_FROM)
}

export type GuestAccessMail = {
  to: string
  hotelName: string
  roomNumber: string
  /** Adresse, die den Gast ins Portal bringt. */
  url: string
  /** Nur beim PIN-Verfahren. */
  pin?: string
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Absender-Kopfzeile: **der Hotelname als Anzeigename**, nicht „RoSe".
 *
 * Der Gast hat bei einem Hotel eingecheckt, nicht bei einer Software — im
 * Postfach soll deshalb das Haus stehen. Die Adresse selbst bleibt fest, weil
 * nur ihre Domain bei Resend verifiziert ist; der Anzeigename davor ist frei.
 *
 * Trägt `GUEST_MAIL_FROM` bereits einen Anzeigenamen (erkennbar an den spitzen
 * Klammern), bleibt der Wert unangetastet — dann hat jemand das bewusst so
 * gesetzt.
 *
 * Der Hotelname wird bereinigt, bevor er in den Header wandert: Zeilenumbrüche
 * darin wären eine Header-Injection, Anführungszeichen und spitze Klammern
 * würden die Adresse zerlegen.
 */
function fromHeader(hotelName: string): string {
  const konfiguriert = (process.env.GUEST_MAIL_FROM ?? '').trim()
  if (konfiguriert.includes('<')) return konfiguriert

  const name = hotelName
    .replace(/[\r\n]+/g, ' ')
    .replace(/["\\<>]/g, '')
    .trim()
    .slice(0, 64)

  return name ? `"${name}" <${konfiguriert}>` : konfiguriert
}

function html(m: GuestAccessMail): string {
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
  <p style="margin-top:24px;font-size:13px;color:#64748b">
    Der Zugang gilt für die Dauer Ihres Aufenthalts und endet mit dem Check-out.
  </p>
</body></html>`
}

/**
 * Verschickt den Zugang. Gibt bei Fehlern eine für Gäste unverfängliche
 * Meldung zurück — die Rezeption sieht sie, nicht der Gast.
 */
export async function sendGuestAccessMail(m: GuestAccessMail): Promise<{ error?: string }> {
  if (!mailReady()) return { error: 'Mailversand ist nicht eingerichtet.' }
  if (!/^\S+@\S+\.\S+$/.test(m.to)) return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromHeader(m.hotelName),
        to: [m.to],
        subject: `Ihr Zugang zum Gäste-Portal — ${m.hotelName}, Zimmer ${m.roomNumber}`,
        html: html(m),
      }),
    })

    if (!res.ok) {
      // Der Klartext von Resend gehört ins Server-Log, nicht in die Oberfläche.
      console.error('[mail] Resend antwortete', res.status, await res.text().catch(() => ''))
      return { error: 'Die Mail konnte nicht verschickt werden. Bitte Adresse prüfen.' }
    }
    return {}
  } catch (err) {
    console.error('[mail] Versand fehlgeschlagen:', err)
    return { error: 'Die Mail konnte nicht verschickt werden.' }
  }
}
