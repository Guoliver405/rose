'use client'

import { useState, useTransition } from 'react'
import { Loader2, Mail, Printer } from 'lucide-react'
import QrImage from '@/components/QrImage'
import { mailGuestAccessAction } from '../../actions'
import type { GuestAccessMode } from '@/lib/guest-access'
import type { GuestGuide } from '@/lib/guest-guide'

/**
 * Druckbares Gast-Handout (Pendant zur Maid-Karte, Gast-Branding) — plus
 * Versand per Mail.
 *
 * Beim Verfahren `link` trägt der Zettel **keine PIN**: Der QR-Code selbst ist
 * der Zugang. Beim Verfahren `pin` ist er nur der Einstieg, die PIN darunter
 * der zweite Faktor.
 */
export default function GuestHandoutCard({
  hotelSlug,
  roomId,
  hotelName,
  roomNumber,
  building,
  accessMode,
  pin,
  url,
  manualUrl,
  deepLink,
  mailReady,
  guide,
}: {
  hotelSlug: string
  roomId: string
  hotelName: string
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
  /** Kurzanleitung — aus den Hotel-Policies gebaut (Routine oder auf Wunsch?). */
  guide: GuestGuide
}) {
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [mailNotice, setMailNotice] = useState<string | null>(null)
  const [mailError, setMailError] = useState<string | null>(null)

  function sendMail(e: React.FormEvent) {
    e.preventDefault()
    setMailNotice(null)
    setMailError(null)
    startTransition(async () => {
      const res = await mailGuestAccessAction(hotelSlug, roomId, email)
      if (res.error) { setMailError(res.error); return }
      // Die Absender-Domain ist jung und hat kaum Sendehistorie — bis sich
      // Reputation aufgebaut hat, sortieren manche Anbieter die Mail in den
      // Spam-Ordner. Der Hinweis gehört an die Rezeption, die es dem Gast sagt.
      setMailNotice(`Zugang an ${email} verschickt. Bitte den Gast darauf hinweisen, notfalls im Spam-Ordner nachzusehen.`)
      setEmail('')
    })
  }

  const individuell = accessMode === 'link'

  return (
    <div className="flex flex-col items-center gap-4 print:gap-0">
      <div className="w-[380px] overflow-hidden rounded-2xl border-2 border-edge-strong bg-surface shadow-lg print:shadow-none">
        <div className="bg-action px-8 pt-7 pb-5 text-center text-action-foreground">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">Willkommen</p>
          <h1 className="mt-2 text-3xl font-black">Zimmer {roomNumber}</h1>
          <p className="mt-3 border-t border-action-tint-edge/40 pt-2 text-xs">
            {building ? `${building} · ` : ''}{hotelName}
          </p>
        </div>

        <div className="space-y-5 px-8 py-7 text-center">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">
              QR scannen → Zimmerservice öffnen
            </p>
            <QrImage
              value={url}
              size={200}
              alt="QR-Code zum Zimmerservice"
              className="mx-auto rounded-lg border-2 border-edge"
            />
          </div>

          {pin && (
            <div className="border-t-2 border-dashed border-edge pt-5">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">
                Ihre PIN
              </p>
              <p className="font-mono text-5xl font-black tracking-[0.3em] text-ink">{pin}</p>
            </div>
          )}

          {/* Kurzanleitung: Zweck, Reinigung (Routine oder auf Wunsch — der
              Satz hängt an den Policies des Hauses), Nicht stören, Services,
              Zugang. Dieselben Sätze stehen in der Mail. */}
          <div className="border-t-2 border-dashed border-edge pt-4 text-left">
            <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">
              So funktioniert&rsquo;s
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-ink-soft">{guide.purpose}</p>
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-ink-muted">
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-ink-soft">Reinigung</span>
                <span>{guide.cleaning}</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-ink-soft">Ruhe</span>
                <span>{guide.dnd}</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-ink-soft">Services</span>
                <span>{guide.services}</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-ink-soft">Zugang</span>
                <span>{guide.access}</span>
              </li>
            </ul>
          </div>

          {individuell && (
            <p className="rounded-lg bg-surface-muted px-3 py-2 text-[10px] leading-relaxed text-ink-muted">
              Bitte bewahren Sie diesen Zettel auf — er ist Ihr Zugang. Wer ihn
              hat, kann den Zimmerservice Ihres Zimmers bedienen.
            </p>
          )}

          <p className="break-all border-t border-dashed border-edge pt-2 text-[10px] text-ink-muted">
            {url}
          </p>

          {/* Der Token ist zu lang zum Abtippen — beim PIN-Verfahren ist die
              Hotel-Adresse der Weg von Hand (Zimmernummer + PIN). Beim
              individuellen Verfahren gibt es diesen Weg bewusst nicht. */}
          {deepLink && !individuell && (
            <p className="break-all text-[10px] text-ink-muted">
              Ohne QR-Code: {manualUrl}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-action px-5 py-2.5 font-bold text-action-foreground shadow-sm hover:bg-action-strong"
        >
          <Printer className="h-4 w-4" />
          Handout drucken
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
                disabled={pending}
                className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Senden
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              Die Adresse wird <strong>nicht gespeichert</strong> — sie dient nur diesem Versand.
            </p>
            {mailNotice && (
              <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
                {mailNotice}
              </p>
            )}
            {mailError && (
              <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
                {mailError}
              </p>
            )}
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
