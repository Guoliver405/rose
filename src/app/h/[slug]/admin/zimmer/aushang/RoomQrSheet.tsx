'use client'

import { useState, useTransition } from 'react'
import { Loader2, Printer, QrCode, RefreshCw } from 'lucide-react'
import { GuestSheetA4, GuestSheetCompact } from '@/components/print/GuestSheet'
import type { GuestSheetText } from '@/lib/guest-guide'
import { format as fill, plural } from '@/lib/i18n/format'
import type { PrintMessages } from '@/lib/i18n'
import { ensureRoomTokensAction, regenerateRoomTokenAction } from './actions'

export type RoomQrData = {
  roomId: string
  number: string
  floor: number
  building: string | null
  url: string | null // null = noch kein Token erzeugt
}

/**
 * Zimmer-QR-Aushänge — dasselbe Blatt wie das Gast-Handout, nur mit dem
 * Zugangsblock des Zimmers (fester QR, PIN kommt vom Check-in).
 *
 * **Zwei Formate** (09.09.2026, Bauplan `Sessions/Druckblaetter-Plan-2026-09-09.md`):
 *
 * - **DIN A4**, eine Seite je Zimmer — für Rahmen, Aufsteller oder Mappe.
 * - **Kompakt, vier je Seite** zum Auseinanderschneiden. Vorher druckte jede
 *   Karte ihre eigene Seite: bei 60 Zimmern 60 Blatt für 9-cm-Kärtchen.
 *
 * Das Blatt trägt **keine Reinigungsregel und keine Uhrzeit** — es hängt
 * permanent im Zimmer, und beides hängt an den Policies. Ein gedruckter Satz
 * würde stillschweigend falsch, sobald das Haus umstellt.
 *
 * „Code erneuern" sitzt jetzt **neben** dem Blatt statt darin: Das Blatt ist
 * eine reine Druckdarstellung und kennt keine Knöpfe.
 */
export default function RoomQrSheet({
  hotelSlug,
  cards,
  hotelName,
  logoUrl,
  texts,
  manualUrl,
  canRenew,
  m,
  intlLocale,
}: {
  hotelSlug: string
  cards: RoomQrData[]
  hotelName: string
  logoUrl: string | null
  /** Ein bis zwei Sprachblöcke, wie das Haus sie gewählt hat. */
  texts: GuestSheetText[]
  /** Abtippbare Hotel-Adresse — der Weg, wenn der QR-Code beschädigt ist. */
  manualUrl: string
  /** „Code erneuern" invalidiert den alten Aushang — nur für Admins. */
  canRenew: boolean
  m: PrintMessages['roomSigns']
  /** Sprach-Tag für Pluralformen („de-DE“). */
  intlLocale: string
}) {
  const [pending, startTransition] = useTransition()
  const [format, setFormat] = useState<'a4' | 'kompakt'>('a4')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const missing = cards.filter(c => !c.url).length

  function runEnsure() {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await ensureRoomTokensAction(hotelSlug)
      if (res.error) { setError(res.error); return }
      setNotice(res.created === 0 ? m.allHaveCodes : plural(intlLocale, res.created ?? 0, m.created))
    })
  }

  function runRegenerate(roomId: string, number: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await regenerateRoomTokenAction(hotelSlug, roomId)
      if (res.error) { setError(res.error); return }
      setNotice(fill(m.renewed, { number }))
    })
  }

  /** Vier je Seite: Die Gruppen stehen im Markup, nicht im CSS — ein
   *  Umbruch, den der Browser selbst rechnet, verschiebt gern die vierte
   *  Karte auf die nächste Seite. */
  const seiten: RoomQrData[][] = []
  for (let i = 0; i < cards.length; i += 4) seiten.push(cards.slice(i, i + 4))

  return (
    <div className="flex flex-col gap-4">
      <div data-lotse="aushang.knopf" className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="text-xl font-black text-ink">{m.title}</h1>
        {missing > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={runEnsure}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            {plural(intlLocale, missing, m.createMissing)}
          </button>
        ) : cards.length > 0 && (
          <>
            <FormatKnopf aktiv={format === 'a4'} onClick={() => setFormat('a4')}>
              {m.formatA4}
            </FormatKnopf>
            <FormatKnopf aktiv={format === 'kompakt'} onClick={() => setFormat('kompakt')}>
              {m.formatCompact}
            </FormatKnopf>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong"
            >
              <Printer className="h-4 w-4" />
              {plural(intlLocale, format === 'a4' ? cards.length : seiten.length, m.printAll)}
            </button>
          </>
        )}
      </div>

      <p data-lotse="aushang.hinweis" className="text-sm text-ink-muted print:hidden">
        {m.hint}
      </p>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong print:hidden">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep print:hidden">
          {notice}
        </p>
      )}

      {cards.length === 0 ? (
        <p className="rounded-xl border border-edge bg-surface p-8 text-center font-semibold text-ink">
          {m.noRooms}
        </p>
      ) : format === 'a4' ? (
        <div className="flex flex-col items-center gap-6 print:block print:gap-0">
          {cards.map((c, i) => (
            <div
              key={c.roomId}
              data-lotse={i === 0 ? 'aushang.karte' : undefined}
              className="flex w-full flex-col items-center gap-2 print:break-after-page"
            >
              {c.url ? (
                <GuestSheetA4
                  variant="aushang"
                  hotelName={hotelName}
                  logoUrl={logoUrl}
                  roomNumber={c.number}
                  building={c.building}
                  qrUrl={c.url}
                  manualUrl={manualUrl}
                  pin={null}
                  individuell={false}
                  texts={texts}
                />
              ) : (
                <OhneCode number={c.number} text={m.noCode} />
              )}
              {canRenew && c.url && (
                <ErneuernKnopf
                  ersteKarte={i === 0}
                  pending={pending}
                  onClick={() => runRegenerate(c.roomId, c.number)}
                  label={m.renew}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6 print:gap-0">
          {seiten.map((seite, s) => (
            <div
              key={seite[0].roomId}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid print:grid-cols-2 print:gap-0 print:break-after-page"
            >
              {seite.map((c, i) => (
                <div
                  key={c.roomId}
                  data-lotse={s === 0 && i === 0 ? 'aushang.karte' : undefined}
                  className="flex flex-col items-center gap-2"
                >
                  {c.url ? (
                    <GuestSheetCompact
                      variant="aushang"
                      hotelName={hotelName}
                      logoUrl={logoUrl}
                      roomNumber={c.number}
                      building={c.building}
                      qrUrl={c.url}
                      manualUrl={manualUrl}
                      pin={null}
                      individuell={false}
                      texts={texts}
                    />
                  ) : (
                    <OhneCode number={c.number} text={m.noCode} />
                  )}
                  {canRenew && c.url && (
                    <ErneuernKnopf
                      ersteKarte={s === 0 && i === 0}
                      pending={pending}
                      onClick={() => runRegenerate(c.roomId, c.number)}
                      label={m.renew}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OhneCode({ number, text }: { number: string; text: string }) {
  return (
    <p className="rounded-xl border-2 border-dashed border-edge-strong bg-surface px-6 py-10 text-center text-sm font-semibold text-ink-muted">
      {fill(text, { number })}
    </p>
  )
}

function ErneuernKnopf({
  ersteKarte, pending, onClick, label,
}: {
  ersteKarte: boolean
  pending: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      data-lotse={ersteKarte ? 'aushang.erneuern' : undefined}
      disabled={pending}
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50 print:hidden"
    >
      <RefreshCw className="h-3 w-3" /> {label}
    </button>
  )
}

/** Umschalter zwischen den Formaten — Auswahl über Rahmen, nicht Fläche. */
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
