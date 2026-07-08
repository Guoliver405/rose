'use client'

import { useState, useTransition } from 'react'
import { Loader2, Printer, QrCode, RefreshCw } from 'lucide-react'
import QrImage from '@/components/QrImage'
import { ensureRoomTokensAction, regenerateRoomTokenAction } from './actions'

export type RoomQrData = {
  roomId: string
  number: string
  floor: number
  building: string | null
  url: string | null // null = noch kein Token erzeugt
}

export default function RoomQrSheet({
  cards,
  hotelName,
  canRenew,
}: {
  cards: RoomQrData[]
  hotelName: string
  /** „Code erneuern" invalidiert den alten Aushang — nur für Admins. */
  canRenew: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const missing = cards.filter(c => !c.url).length

  function runEnsure() {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await ensureRoomTokensAction()
      if (res.error) { setError(res.error); return }
      setNotice(res.created === 0
        ? 'Alle Zimmer haben bereits einen QR-Code.'
        : `${res.created} QR-Code${res.created === 1 ? '' : 's'} erzeugt.`)
    })
  }

  function runRegenerate(roomId: string, number: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await regenerateRoomTokenAction(roomId)
      if (res.error) { setError(res.error); return }
      setNotice(`Neuer QR-Code für Zimmer ${number} — der alte Aushang ist ungültig.`)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="text-xl font-black text-ink">Zimmer-QR-Aushänge</h1>
        {missing > 0 ? (
          <button
            type="button"
            disabled={pending}
            onClick={runEnsure}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            {missing} fehlende QR-Codes erzeugen
          </button>
        ) : cards.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong"
          >
            <Printer className="h-4 w-4" /> Alle drucken (1 pro Seite)
          </button>
        )}
      </div>

      <p className="text-sm text-ink-muted print:hidden">
        Einmal drucken, im Zimmer aufhängen — der Gast scannt und tippt nur noch seine PIN.
        Ein neuer Code invalidiert den alten Aushang des Zimmers.
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
          Noch keine Zimmer angelegt.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:block">
          {cards.map(c => (
            <div key={c.roomId} className="print:break-after-page print:flex print:min-h-screen print:items-center print:justify-center">
              <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border-2 border-edge-strong bg-surface print:border-2">
                <div className="bg-action px-6 pt-5 pb-4 text-center text-action-foreground">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em]">Zimmerservice</p>
                  <h2 className="mt-1 text-3xl font-black">Zimmer {c.number}</h2>
                  <p className="mt-1 text-xs opacity-90">
                    {c.building ? `${c.building} · ` : ''}{hotelName}
                  </p>
                </div>
                <div className="space-y-3 px-6 py-5 text-center">
                  {c.url ? (
                    <>
                      <QrImage
                        value={c.url}
                        size={190}
                        alt={`QR-Code Zimmer ${c.number}`}
                        className="mx-auto rounded-lg border-2 border-edge"
                      />
                      <p className="text-sm font-bold text-ink">
                        Scannen → PIN eingeben → Reinigung &amp; Service bestellen
                      </p>
                      <p className="text-xs leading-relaxed text-ink-muted">
                        Die PIN bekommst du beim Check-in an der Rezeption.
                      </p>
                      <p className="break-all border-t border-dashed border-edge pt-2 text-[10px] text-ink-muted">
                        {c.url}
                      </p>
                      {canRenew && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runRegenerate(c.roomId, c.number)}
                          className="mx-auto flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-50 print:hidden"
                        >
                          <RefreshCw className="h-3 w-3" /> Code erneuern
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="py-10 text-sm font-semibold text-ink-muted">
                      Noch kein QR-Code — oben erzeugen.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
