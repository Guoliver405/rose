'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** QR-Code als <img> mit data-URL (Client-Rendering via qrcode-Paket). */
export default function QrImage({
  value,
  size = 200,
  alt,
  className,
}: {
  value: string
  size?: number
  alt: string
  className?: string
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(value, { width: size + 60, margin: 2 }).then(setDataUrl)
  }, [value, size])

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
