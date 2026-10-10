'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUp, Loader2, Trash2, TriangleAlert } from 'lucide-react'
import { LOGO_ACCEPT, LOGO_MAX_BYTES, LOGO_MIN_WIDTH_PX } from '@/lib/logo'
import { removeHotelLogoAction, uploadHotelLogoAction } from './actions'
import { format } from '@/lib/i18n/format'
import type { AdminMessages } from '@/lib/i18n'

/**
 * Hotel-Logo für die gedruckten Blätter.
 *
 * **Die Vorschau steht auf weißem Grund** (`data-theme="light"`), nicht in der
 * Theme-Fläche: Ein für dunkle Hintergründe gebautes weißes Logo ist auf
 * Papier unsichtbar — das muss vor dem Druck auffallen, nicht danach.
 *
 * **Der Auflösungs-Hinweis ist ein Hinweis, keine Ablehnung.** Unter
 * ~400 px Breite wird ein Bitmap-Logo auf 55 mm sichtbar unscharf; ob das
 * stört, entscheidet das Haus. SVG ist davon ausgenommen — es skaliert.
 *
 * Bewusst **außerhalb** des großen Regeln-Formulars: Ein Datei-Upload im
 * selben `<form>` würde dessen Speichern-Knopf einen zweiten Zustand
 * aufbürden.
 */
export default function LogoForm({
  hotelSlug, hotelName, logoUrl, m,
}: {
  hotelSlug: string
  hotelName: string
  logoUrl: string | null
  m: AdminMessages['settings']['logo']
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warnung, setWarnung] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function gewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0]
    if (!datei) return
    setError(null)
    setWarnung(null)

    if (datei.size > LOGO_MAX_BYTES) {
      setError(format(m.tooLarge, { kb: Math.round(datei.size / 1024) }))
      e.target.value = ''
      return
    }

    // Auflösung nur zur Warnung — SVG hat keine feste Pixelbreite.
    if (datei.type !== 'image/svg+xml') {
      const url = URL.createObjectURL(datei)
      const bild = new Image()
      bild.onload = () => {
        if (bild.naturalWidth < LOGO_MIN_WIDTH_PX) {
          setWarnung(format(m.lowResolution, { width: bild.naturalWidth, min: LOGO_MIN_WIDTH_PX }))
        }
        URL.revokeObjectURL(url)
      }
      bild.src = url
    }

    const formData = new FormData()
    formData.append('logo', datei)
    startTransition(async () => {
      const res = await uploadHotelLogoAction(hotelSlug, formData)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
    e.target.value = ''
  }

  function entfernen() {
    setError(null)
    setWarnung(null)
    startTransition(async () => {
      const res = await removeHotelLogoAction(hotelSlug)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-edge bg-surface p-4">
        {/* Vorschau wie auf Papier: weißer Grund, unabhängig vom Theme. */}
        <div
          data-theme="light"
          className="flex h-24 w-56 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface p-3"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={hotelName} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-center text-xs font-semibold text-ink-muted">
              {m.none}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={LOGO_ACCEPT}
            onChange={gewaehlt}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
              {logoUrl ? m.replace : m.upload}
            </button>
            {logoUrl && (
              <button
                type="button"
                disabled={pending}
                onClick={entfernen}
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> {m.remove}
              </button>
            )}
          </div>
          <p className="text-xs text-ink-muted">{m.hint}</p>
        </div>
      </div>

      {warnung && (
        <p className="flex items-start gap-2 rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-sm font-semibold text-attention-deepest">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{warnung}</span>
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
    </div>
  )
}
