'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import QrImage from '@/components/QrImage'
import type { PartnerMessages } from '@/lib/i18n'

/** Link, Code und QR-Code des Partners, je mit „Kopieren“. */
export default function PartnerLink({ url, code, m }: { url: string; code: string; m: PartnerMessages['link'] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="flex min-w-0 flex-col gap-3">
        <CopyRow label={m.linkLabel} value={url} m={m} />
        <CopyRow label={m.codeLabel} value={code} m={m} mono />
        <p className="text-xs text-ink-muted">{m.qrHint}</p>
      </div>
      {/* Weißer Grund, damit der Code auch im Dark Mode lesbar und speicherbar bleibt. */}
      <div className="self-center rounded-xl bg-white p-2" data-theme="light">
        <QrImage value={url} size={148} renderPx={600} quietModules={4} alt={m.qrAlt} />
      </div>
    </div>
  )
}

function CopyRow({ label, value, mono = false, m }: { label: string; value: string; mono?: boolean; m: PartnerMessages['link'] }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ohne Zwischenablage (altes Gerät, kein HTTPS) bleibt der Text zum Markieren stehen.
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`min-w-0 flex-1 select-all break-all rounded-lg border border-edge bg-surface-sunken px-3 py-2 text-sm text-ink ${mono ? 'font-mono tracking-widest' : ''}`}>
          {value}
        </span>
        <button type="button" onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink hover:border-edge-strong">
          {copied ? <Check className="h-4 w-4 text-positive-strong" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          <span aria-live="polite">{copied ? m.copied : m.copy}</span>
        </button>
      </div>
    </div>
  )
}
