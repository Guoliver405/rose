'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * QR-Code als <img> mit data-URL (Client-Rendering via qrcode-Paket).
 *
 * `size` ist das **Layout**-Maß (Bildschirm-Pixel; im Druck überschreibt eine
 * mm-Klasse es). `renderPx` ist davon getrennt die **Auflösung** des erzeugten
 * PNG: Ein 190-px-Bild auf 50 mm gedruckt sind nur ~96 dpi und weichgerechnet
 * — Druckflächen geben deshalb ~600 px mit.
 *
 * `quietModules` ist die Ruhezone in Modulen. Die Norm sieht 4 vor; der
 * Standardwert 2 bleibt, damit bestehende Karten ihr Maß behalten, die
 * gedruckten Blätter fordern 4 an.
 */
export default function QrImage({
  value,
  size = 200,
  renderPx,
  quietModules = 2,
  alt,
  className,
}: {
  value: string
  size?: number
  renderPx?: number
  quietModules?: number
  alt: string
  className?: string
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(value, { width: renderPx ?? size + 60, margin: quietModules }).then(setDataUrl)
  }, [value, size, renderPx, quietModules])

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`animate-pulse rounded-lg bg-surface-muted ${className ?? ''}`}
      />
    )
  }

  return (
    // next/image lohnt bei data:image/png;base64 nicht
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt={alt} width={size} height={size} className={className} />
  )
}
