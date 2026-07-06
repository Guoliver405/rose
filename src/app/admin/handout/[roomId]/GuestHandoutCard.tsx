'use client'

import { Printer } from 'lucide-react'
import QrImage from '@/components/QrImage'

/** Druckbares Gast-Handout (Pendant zur Maid-Karte, Gast-Branding). */
export default function GuestHandoutCard({
  hotelName,
  roomNumber,
  building,
  pin,
  url,
  deepLink,
}: {
  hotelName: string
  roomNumber: string
  building: string | null
  pin: string
  url: string
  deepLink: boolean
}) {
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

          <div className="border-t-2 border-dashed border-edge pt-5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">
              Deine PIN
            </p>
            <p className="font-mono text-5xl font-black tracking-[0.3em] text-ink">{pin}</p>
          </div>

          <p className="pt-1 text-[11px] leading-relaxed text-ink-muted">
            {deepLink
              ? 'Scannen und PIN eingeben — dann Reinigung anfordern, „Nicht stören" setzen und Services bestellen.'
              : 'Scannen, Zimmernummer + PIN eingeben — dann Reinigung anfordern, „Nicht stören" setzen und Services bestellen.'}
            {' '}Die PIN gilt bis zum Check-out.
          </p>

          <p className="break-all border-t border-dashed border-edge pt-2 text-[10px] text-ink-muted">
            {url}
          </p>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl bg-action px-5 py-2.5 font-bold text-action-foreground shadow-sm hover:bg-action-strong print:hidden"
      >
        <Printer className="h-4 w-4" />
        Handout drucken
      </button>
    </div>
  )
}
