'use client'

import { useEffect, useState } from 'react'
import { Printer, Sparkles } from 'lucide-react'
import QRCode from 'qrcode'

/**
 * Druckbare QR-Login-Karte für Reinigungskräfte (Pattern aus HotCord).
 * QR → /service/auto/<token> loggt das Tablet ohne Eingabe ein;
 * PIN ist der manuelle Fallback (Benutzername + PIN auf /service/login).
 */
export default function MaidPinCard({
  hotelName,
  displayName,
  username,
  pin,
  loginUrl,
}: {
  hotelName: string
  displayName: string
  username: string
  pin: string
  loginUrl: string // vollständige URL inkl. Origin
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(loginUrl, { width: 260, margin: 2 }).then(setQrDataUrl)
  }, [loginUrl])

  return (
    <div className="flex flex-col items-center gap-4 print:gap-0">
      <div className="w-[380px] overflow-hidden rounded-2xl border-2 border-attention-pill-edge bg-surface shadow-lg print:border-2 print:shadow-none">
        {/* Header */}
        <div className="bg-attention-strong px-8 pt-7 pb-5 text-center text-attention-foreground">
          <div className="mb-1 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">
              Personal-Zugang Reinigung
            </p>
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="mt-2 text-2xl font-black">{displayName}</h1>
          <p className="mt-1 font-mono text-sm">@{username}</p>
          <p className="mt-3 border-t border-attention/40 pt-2 text-xs">{hotelName}</p>
        </div>

        {/* QR + PIN */}
        <div className="space-y-5 px-8 py-7 text-center">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-attention-strong">
              QR scannen → automatisch eingeloggt
            </p>
            {qrDataUrl ? (
              // next/image lohnt bei data:image/png;base64 nicht
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR-Code zum Reinigungsboard"
                className="mx-auto rounded-lg border-2 border-attention-tint-edge"
                width={200}
                height={200}
              />
            ) : (
              <div className="mx-auto h-[200px] w-[200px] animate-pulse rounded-lg bg-attention-tint" />
            )}
          </div>

          <div className="border-t-2 border-dashed border-attention-tint-edge pt-5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-attention-strong">
              PIN (manuell)
            </p>
            <p className="font-mono text-5xl font-black tracking-[0.3em] text-attention-deepest">{pin}</p>
          </div>

          <p className="pt-1 text-[11px] leading-relaxed text-ink-muted">
            QR mit dem Tablet scannen oder Benutzername + PIN eintippen.
            Diese Karte vertraulich behandeln — sie öffnet das Reinigungsboard
            ohne weitere Bestätigung.
          </p>

          {/* Klartext-Link als Fallback, falls der QR-Scan nicht klappt */}
          <p className="break-all border-t border-dashed border-attention-tint-edge pt-2 text-[10px] text-ink-muted">
            {loginUrl}
          </p>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl bg-attention-strong px-5 py-2.5 font-bold text-attention-foreground shadow-sm hover:opacity-90 print:hidden"
      >
        <Printer className="h-4 w-4" />
        Karte drucken
      </button>
    </div>
  )
}
