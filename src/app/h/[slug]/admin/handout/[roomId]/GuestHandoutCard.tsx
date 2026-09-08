'use client'

import { useState, useTransition } from 'react'
import { Leaf, Loader2, Mail, Printer, QrCode } from 'lucide-react'
import QrImage from '@/components/QrImage'
import { mailGuestAccessAction } from '../../actions'
import type { GuestAccessMode } from '@/lib/guest-access'
import { GUIDE_LANGS, sheetLabels, type GuestGuide } from '@/lib/guest-guide'

/**
 * Druckbares Gast-Handout auf DIN A4 — plus Versand per Mail.
 *
 * **Warum A4 und zweispaltig** (08.09.2026): Der Zugang selbst braucht wenig
 * Platz (QR, PIN, Adresse), die Anleitung dagegen viel — sie steht in vier
 * Sprachen da. Also links eine schmale Zugangs-Spalte, rechts die Anleitung
 * in Deutsch, Englisch, Spanisch und Französisch untereinander. Ein Gast, der
 * kein Deutsch liest, soll den Zettel nicht weglegen müssen.
 *
 * **Print-Robustheit:** Die Kopfzeile ist bewusst NICHT farbig gefüllt.
 * Browser drucken Hintergrundflächen standardmäßig nicht — ein weißer Balken
 * mit weißer Schrift wäre unlesbar. Die Farbe trägt deshalb eine Linie
 * (Rahmen drucken immer), der Text bleibt dunkel. Aus demselben Grund
 * strukturieren Rahmen und Linien die Sprachblöcke, keine Flächen.
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
  guides,
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
  /** Kurzanleitung je Sprache — aus den Hotel-Policies gebaut. */
  guides: GuestGuide[]
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
  const alleLabels = GUIDE_LANGS.map(sheetLabels)
  /** „Willkommen · Welcome · Bienvenido · Bienvenue" */
  const viersprachig = (feld: 'welcome' | 'room' | 'scan' | 'withoutQr') =>
    alleLabels.map(l => l[feld]).join(' · ')

  return (
    <div className="flex w-full flex-col items-center gap-5 print:gap-0">
      {/* Das Blatt. Auf dem Bildschirm eine Karte, im Druck der Seiteninhalt. */}
      <article className="w-full max-w-[820px] rounded-2xl border border-edge bg-surface p-8 shadow-lg print:w-[186mm] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-t-4 border-action pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-action">
            {viersprachig('welcome')}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-4xl font-black leading-none text-ink">
              <span className="mr-2 align-middle text-sm font-bold uppercase tracking-wider text-ink-muted">
                {viersprachig('room')}
              </span>
              {roomNumber}
            </h1>
            <p className="text-sm font-semibold text-ink-soft">
              {building ? `${building} · ` : ''}{hotelName}
            </p>
          </div>
        </header>

        {/* Zwei Zeilen statt vier gestapelter Sprachen: Untereinander ergaben
            die vier Blöcke 280 mm und liefen damit auf eine zweite Seite,
            während unter dem QR-Bereich 130 mm leer blieben. Jetzt stehen die
            ersten beiden Sprachen neben dem Zugang, die anderen beiden darunter
            über die volle Breite. Nachgemessen: knapp unter 250 mm. */}
        <div className="mt-5 grid grid-cols-[minmax(0,34%)_minmax(0,66%)] gap-x-6 gap-y-5">
          {/* ── Zugang ───────────────────────────────────────────────── */}
          <aside className="flex flex-col gap-4 border-r border-edge pr-6">
            <div>
              <QrImage
                value={url}
                size={190}
                alt="QR-Code zum Gäste-Portal"
                className="w-full rounded-lg border-2 border-edge"
              />
              <p className="mt-2 flex items-start gap-1.5 text-[9px] font-semibold leading-tight text-ink-muted">
                <QrCode className="mt-px h-3 w-3 shrink-0" />
                <span>{viersprachig('scan')}</span>
              </p>
            </div>

            {pin && (
              <div className="border-t-2 border-dashed border-edge pt-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ink-soft">PIN</p>
                <p className="font-mono text-4xl font-black tracking-[0.2em] text-ink">{pin}</p>
              </div>
            )}

            <div className="border-t border-dashed border-edge pt-3">
              <p className="break-all text-[9px] leading-snug text-ink-muted">{url}</p>
              {/* Der Token ist zu lang zum Abtippen — beim PIN-Verfahren ist
                  die Hotel-Adresse der Weg von Hand (Zimmernummer + PIN).
                  Beim individuellen Verfahren gibt es diesen Weg bewusst nicht. */}
              {deepLink && !individuell && (
                <p className="mt-2 break-all text-[9px] leading-snug text-ink-muted">
                  <span className="font-semibold">{viersprachig('withoutQr')}:</span> {manualUrl}
                </p>
              )}
            </div>

            {individuell && (
              <ul className="border-t border-dashed border-edge pt-3 text-[9px] leading-snug text-ink-muted">
                {alleLabels.map((l, i) => (
                  <li key={GUIDE_LANGS[i]}>{l.keep}</li>
                ))}
              </ul>
            )}
          </aside>

          {/* ── Anleitung: erste zwei Sprachen neben dem Zugang ──────── */}
          <section className="flex flex-col gap-4">
            {guides.slice(0, 2).map(g => <Sprachblock key={g.lang} guide={g} />)}
          </section>

          {/* ── … die übrigen darunter über die volle Breite ─────────── */}
          <section className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-edge pt-4">
            {guides.slice(2).map(g => <Sprachblock key={g.lang} guide={g} />)}
          </section>
        </div>
      </article>

      {/* ── Bedienung, nie gedruckt ────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-action px-5 py-2.5 font-bold text-action-foreground shadow-sm hover:bg-action-strong"
        >
          <Printer className="h-4 w-4" />
          Handout drucken (DIN A4)
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
              Die Mail geht auf Deutsch heraus; die vier Sprachen stehen nur auf dem Ausdruck.
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

/** Ein Sprachblock der Anleitung — Überschrift, Zweck, fünf Punkte. */
function Sprachblock({ guide: g }: { guide: GuestGuide }) {
  return (
    <div className="border-l-2 border-action-tint-edge pl-3">
      <p className="flex items-baseline gap-2">
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-action">
          {g.langLabel}
        </span>
        <span className="text-[10px] font-semibold text-ink-muted">{g.heading}</span>
      </p>
      <p className="mt-1 text-[10px] font-semibold leading-tight text-ink-soft">{g.purpose}</p>
      <ul className="mt-1 space-y-1 text-[10px] leading-tight text-ink-muted">
        <Punkt label={g.labels.cleaning}>{g.cleaning}</Punkt>
        <Punkt label={g.labels.sustainability} gruen>{g.sustainability}</Punkt>
        <Punkt label={g.labels.dnd}>{g.dnd}</Punkt>
        <Punkt label={g.labels.services}>{g.services}</Punkt>
        <Punkt label={g.labels.access}>{g.access}</Punkt>
      </ul>
    </div>
  )
}

/** Ein Punkt der Aufzählung: fette Beschriftung, dann der Satz. */
function Punkt({
  label, children, gruen,
}: {
  label: string
  children: React.ReactNode
  /** Nachhaltigkeit bekommt als einziger Punkt ein Zeichen — sie ist ein Angebot, keine Regel. */
  gruen?: boolean
}) {
  return (
    <li className="flex gap-1.5">
      <span className={`shrink-0 font-black ${gruen ? 'text-positive-deep' : 'text-ink-soft'}`}>
        {gruen && <Leaf className="mr-0.5 inline h-2.5 w-2.5 align-[-1px]" />}
        {label}
      </span>
      <span>{children}</span>
    </li>
  )
}
