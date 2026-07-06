'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Check } from 'lucide-react'

// ── Slide-to-Confirm-Button (verhindert versehentliches Auslösen) ────────────
// Port aus HotCord, Farbfamilien auf RoSe-Semantik gemappt.

export type SlideVariant = 'danger' | 'warning' | 'success' | 'neutral'

const SLIDE_STYLES: Record<SlideVariant, { track: string; handle: string; text: string }> = {
  danger: {
    track: 'bg-critical-tint border-critical-pill-edge',
    handle: 'bg-critical text-critical-foreground',
    text: 'text-critical-strong',
  },
  warning: {
    track: 'bg-attention-tint border-attention-tint-edge',
    handle: 'bg-attention text-attention-foreground',
    text: 'text-attention-deepest',
  },
  success: {
    track: 'bg-positive-tint border-positive-pill-edge',
    handle: 'bg-positive text-positive-foreground',
    text: 'text-positive-deep',
  },
  neutral: {
    track: 'bg-surface-muted border-edge-strong',
    handle: 'bg-action text-action-foreground',
    text: 'text-ink-muted',
  },
}

export default function SlideAction({
  label,
  doneLabel,
  done = false,
  disabled = false,
  variant,
  onConfirm,
}: {
  label: string
  doneLabel?: string
  done?: boolean
  disabled?: boolean
  variant: SlideVariant
  onConfirm: () => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const [maxX, setMaxX] = useState(0)
  const [dragging, setDrag] = useState(false)
  const HANDLE = 48
  const PADDING = 4

  // Wenn done von außen gesetzt wird: Handle ans Ende pinnen, sonst zurücksetzen
  useEffect(() => {
    if (done && trackRef.current) {
      const w = trackRef.current.getBoundingClientRect().width
      const max = w - HANDLE - PADDING * 2
      setMaxX(max)
      setX(max)
    } else {
      setX(0)
    }
  }, [done])

  const styles = SLIDE_STYLES[variant]
  const inactive = disabled || done

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (inactive) return
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    setMaxX(rect.width - HANDLE - PADDING * 2)
    setDrag(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const max = rect.width - HANDLE - PADDING * 2
    const next = Math.max(0, Math.min(max, e.clientX - rect.left - HANDLE / 2 - PADDING))
    setX(next)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setDrag(false)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    if (x >= maxX * 0.85 && maxX > 0) {
      setX(maxX)
      onConfirm()
      // Kurz Erfolg anzeigen, dann zurücksetzen — falls die Komponente nicht
      // ohnehin durch ein Re-Render ihren `done`-Zustand ändert oder verschwindet.
      window.setTimeout(() => setX(0), 400)
    } else {
      setX(0)
    }
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`relative h-14 w-full select-none touch-none overflow-hidden rounded-xl border ${styles.track} ${inactive && !done ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'}`}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={maxX > 0 ? Math.round((x / maxX) * 100) : 0}
    >
      <div className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-black ${styles.text}`}>
        {done ? (doneLabel ?? label) : `${label}  →`}
      </div>
      <div
        style={{
          left: PADDING,
          transform: `translateX(${x}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease-out',
        }}
        className={`absolute top-1 flex h-12 w-12 items-center justify-center rounded-lg shadow-lg ${styles.handle}`}
      >
        {done
          ? <Check className="h-5 w-5 stroke-[3]" />
          : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        }
      </div>
    </div>
  )
}
