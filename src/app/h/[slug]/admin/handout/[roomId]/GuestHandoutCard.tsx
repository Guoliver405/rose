'use client'

import { useState, useTransition } from 'react'
import { Loader2, Mail, Printer } from 'lucide-react'
import { GuestSheetA4, GuestSheetCompact, type GuestSheetProps } from '@/components/print/GuestSheet'
import { mailGuestAccessAction } from '../../actions'
import { auswegButton, beginFrom, MailStatusLine, sendLabel, useMailDispatch } from '@/components/mail/MailDispatch'
import { RotateCw } from 'lucide-react'
import type { GuestAccessMode } from '@/lib/guest-access'
import type { GuestSheetText } from '@/lib/guest-guide'
import type { PrintMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'

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
  m,
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
  m: PrintMessages['checkinSheet']
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

  function sendMail(e: React.FormEvent, release = false) {
    e.preventDefault()
    const to = email.trim()
    startTransition(async () => {
      const res = await mailGuestAccessAction(hotelSlug, roomId, to, { release })
      mail.begin(beginFrom(res, to))
      // Die Adresse bleibt im Feld: bei einem Bounce ist der nächste Schritt
      // „Schreibweise prüfen", nicht „noch einmal tippen".
    })
  }

  /** Ausweg nach Sperre oder Bounce: Adresse freigeben und denselben Versand wiederholen. */
  const freigeben = mail.failed && mail.run?.blocked?.canRelease !== false ? (
    <button
      type="button"
      disabled={pending || mail.remaining > 0}
      onClick={e => sendMail(e, true)}
      className={`${auswegButton} text-critical-strong`}
    >
      <RotateCw className="h-3.5 w-3.5" /> {m.release}
    </button>
  ) : null

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
          {m.formatA4}
        </FormatKnopf>
        <FormatKnopf aktiv={format === 'kompakt'} onClick={() => setFormat('kompakt')}>
          {m.formatCompact}
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
          {format === 'a4' ? m.printA4 : m.printCompact}
        </button>

        {mailReady ? (
          <form
            onSubmit={sendMail}
            className="flex w-[380px] flex-col gap-2 rounded-xl border border-edge bg-surface p-4"
          >
            <p className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
              <Mail className="h-4 w-4" /> {m.mailTitle}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={m.mailPlaceholder}
                className="flex-1 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending || mail.remaining > 0}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {sendLabel(m.send, mail)}
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              <Rich text={m.mailHint} />
            </p>
            <MailStatusLine mail={mail}>
              {freigeben}
              {mail.failed && (
                <span className="self-center text-xs text-ink-muted">{m.orPrint}</span>
              )}
            </MailStatusLine>
          </form>
        ) : (
          <p className="w-[380px] rounded-xl border border-edge bg-surface px-4 py-3 text-xs text-ink-muted">
            <Rich text={m.mailNotConfigured} tags={{ code: c => <code className="mx-1 font-mono">{c}</code> }} />
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
