'use client'

import { useState, useTransition } from 'react'
import { Loader2, Mail, Printer } from 'lucide-react'
import { GuestSheetA4, GuestSheetCompact, type GuestSheetProps } from '@/components/print/GuestSheet'
import { mailGuestAccessAction } from '../../actions'
import { MailStatusLine, sendLabel, useMailDispatch } from '@/components/mail/MailDispatch'
import type { GuestAccessMode } from '@/lib/guest-access'
import type { GuestSheetText } from '@/lib/guest-guide'

/**
 * Druckbares Gast-Handout — plus Versand per Mail.
 *
 * **Zwei Formate, ein Blatt** (09.09.2026, Bauplan
 * `Sessions/Druckblaetter-Plan-2026-09-09.md`): DIN A4 für die Zimmermappe, den
 * Aufsteller oder den Rahmen; kompakt für den Zettel in die Hand am Tresen. Das
 * Blatt selbst liegt in [GuestSheet](../../../../../../components/print/GuestSheet.tsx)
 * und ist dasselbe, das der Zimmer-Aushang druckt — die beiden Flächen
 * unterscheiden sich nur im Zugangsblock.
 *
 * Die Wahl des Formats wird **nicht gespeichert**: Sie hängt daran, was gerade
 * gebraucht wird (Mappe oder Tresen), nicht am Haus.
 *
 * Beim Verfahren `link` trägt der Zettel **keine PIN** — der QR-Code selbst ist
 * der Zugang. Beim Verfahren `pin` ist er nur der Einstieg, die PIN darunter
 * der zweite Faktor.
 */
export default function GuestHandoutCard({
  hotelSlug,
  roomId,
  hotelName,
  logoUrl,
  roomNumber,
  building,
  accessMode,
  pin,
  url,
  manualUrl,
  deepLink,
  mailReady,
  texts,
}: {
  hotelSlug: string
  roomId: string
  hotelName: string
  logoUrl: string | null
  roomNumber: string
  building: string | null
  accessMode: GuestAccessMode
  /** Nur beim Verfahren `pin` gesetzt. */
  pin: string | null
  url: string
  /** Abtippbare Hotel-Adresse (`/h/<slug>/guest`) — Weg ohne QR-Code. */
  manualUrl: string
  deepLink: boolean
  mailReady: boolean
  /** Ein bis zwei Sprachblöcke, wie das Haus sie gewählt hat. */
  texts: GuestSheetText[]
}) {
  const [pending, startTransition] = useTransition()
  const [format, setFormat] = useState<'a4' | 'kompakt'>('a4')
  const [email, setEmail] = useState('')
  /**
   * Countdown und Zustellstatus (12.09.2026): nach dem Senden zählt der Knopf
   * eine Minute herunter, und die Zeile darunter zeigt, ob der Empfänger-
   * Server die Mail angenommen oder abgewiesen hat — vorher hieß es
   * „verschickt", auch wenn Freenet sie eine Sekunde später zurückwies.
   */
  const mail = useMailDispatch()

  function sendMail(e: React.FormEvent) {
    e.preventDefault()
    const to = email.trim()
    startTransition(async () => {
      const res = await mailGuestAccessAction(hotelSlug, roomId, to)
      mail.begin({ logId: res.logId, recipient: to, error: res.error, wait: res.wait })
      // Die Adresse bleibt im Feld: bei einem Bounce ist der nächste Schritt
      // „Schreibweise prüfen", nicht „noch einmal tippen".
    })
  }

  const individuell = accessMode === 'link'
  const blatt: GuestSheetProps = {
    variant: 'handout',
    hotelName,
    logoUrl,
    roomNumber,
    building,
    qrUrl: url,
    // Der Token ist zu lang zum Abtippen — beim PIN-Verfahren ist die
    // Hotel-Adresse der Weg von Hand (Zimmernummer + PIN). Beim individuellen
    // Verfahren gibt es diesen Weg bewusst nicht.
    manualUrl: deepLink && !individuell ? manualUrl : null,
    pin,
    individuell,
    texts,
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 print:gap-0">
      {/* ── Format wählen, nie gedruckt ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
        <FormatKnopf aktiv={format === 'a4'} onClick={() => setFormat('a4')}>
          DIN A4 — Mappe, Aufsteller, Rahmen
        </FormatKnopf>
        <FormatKnopf aktiv={format === 'kompakt'} onClick={() => setFormat('kompakt')}>
          Kompakt — Zettel für die Hand
        </FormatKnopf>
      </div>

      {format === 'a4' ? <GuestSheetA4 {...blatt} /> : <GuestSheetCompact {...blatt} />}

      {/* ── Bedienung, nie gedruckt ────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-action px-5 py-2.5 font-bold text-action-foreground shadow-sm hover:bg-action-strong"
        >
          <Printer className="h-4 w-4" />
          {format === 'a4' ? 'Handout drucken (DIN A4)' : 'Zettel drucken (kompakt)'}
        </button>

        {mailReady ? (
          <form
            onSubmit={sendMail}
            className="flex w-[380px] flex-col gap-2 rounded-xl border border-edge bg-surface p-4"
          >
            <p className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
              <Mail className="h-4 w-4" /> Stattdessen per E-Mail schicken
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="adresse@beispiel.de"
                className="flex-1 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending || mail.remaining > 0}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {sendLabel('Senden', mail)}
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              Die Adresse wird <strong>nicht gespeichert</strong> — sie dient nur diesem Versand.
              Die Mail geht in der ersten Sprache des Hauses heraus; Piktogramme und die
              zweite Sprache stehen nur auf dem Ausdruck.
            </p>
            <MailStatusLine mail={mail} />
          </form>
        ) : (
          <p className="w-[380px] rounded-xl border border-edge bg-surface px-4 py-3 text-xs text-ink-muted">
            Versand per E-Mail ist nicht eingerichtet — dafür braucht es
            <code className="mx-1 font-mono">RESEND_API_KEY</code> und
            <code className="mx-1 font-mono">GUEST_MAIL_FROM</code> in den
            Umgebungsvariablen.
          </p>
        )}
      </div>
    </div>
  )
}

/** Umschalter zwischen den beiden Formaten — Auswahl über Rahmen, nicht Fläche. */
function FormatKnopf({
  aktiv, onClick, children,
}: {
  aktiv: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktiv}
      className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold ${
        aktiv
          ? 'border-action bg-action-tint text-action-deep'
          : 'border-edge bg-surface text-ink-soft hover:border-edge-strong'
      }`}
    >
      {children}
    </button>
  )
}
