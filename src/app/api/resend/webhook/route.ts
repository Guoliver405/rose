import { NextResponse } from 'next/server'
import {
  detailFromEvent, logIdFromEvent, statusFromEvent, verifyResendSignature, type ResendEvent,
} from '@/lib/mail-status'
import { advanceMailStatus, mailLogIdByResendId } from '@/utils/mail'

/**
 * Resend-Webhook — die Rückmeldung, ob eine Mail wirklich angekommen ist.
 *
 * Resend meldet je Mail `email.sent`, dann `email.delivered` — oder
 * `email.bounced` / `email.delivery_delayed` / `email.complained` mit dem
 * Grund des Empfänger-Servers. Hier landet das in `mail_log`, wo die
 * Oberfläche es nach dem Senden nachfragt.
 *
 * Signaturprüfung über `RESEND_WEBHOOK_SECRET` (Svix-Schema, nachgebaut in
 * `mail-status.ts`); ohne Variable 503. Die Zeile wird über unseren Tag
 * (`log=<id>`) gefunden, hilfsweise über die Resend-Kennung. Idempotent ohne
 * Ereignis-Tabelle: der Status geht nur nach vorn, eine doppelte Zustellung
 * ändert nichts. Antwort 200, sobald das Ereignis angenommen wurde —
 * Verarbeitungsfehler landen im Log, sonst käme das Ereignis stundenlang
 * wieder.
 *
 * Liegt außerhalb des Proxy-Matchers — richtig so, hier gibt es keine Sitzung.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook nicht eingerichtet' }, { status: 503 })

  const body = await request.text()
  const ok = verifyResendSignature({
    secret,
    id: request.headers.get('svix-id'),
    timestamp: request.headers.get('svix-timestamp'),
    signature: request.headers.get('svix-signature'),
    body,
  })
  if (!ok) return NextResponse.json({ error: 'ungültige Signatur' }, { status: 400 })

  let ev: ResendEvent
  try {
    ev = JSON.parse(body) as ResendEvent
  } catch {
    return NextResponse.json({ error: 'kein JSON' }, { status: 400 })
  }

  const status = statusFromEvent(ev.type)
  if (!status) return NextResponse.json({ received: true, ignored: true })

  try {
    const logId = logIdFromEvent(ev)
      ?? (ev.data?.email_id ? await mailLogIdByResendId(ev.data.email_id) : null)
    if (!logId) {
      // Eine Mail, die nicht von dieser Anwendung stammt (z. B. Supabase-SMTP
      // über dasselbe Resend-Konto) — nichts zu tun.
      return NextResponse.json({ received: true, unknown: true })
    }
    await advanceMailStatus(logId, status, {
      detail: detailFromEvent(ev),
      resendId: ev.data?.email_id,
    })
  } catch (err) {
    console.error('[resend/webhook] Verarbeitung fehlgeschlagen:', ev.type, err instanceof Error ? err.message : err)
  }
  return NextResponse.json({ received: true })
}
