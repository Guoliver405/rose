'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Check } from 'lucide-react'

// ── Slide-to-Confirm-Button (verhindert versehentliches Auslösen) ────────────
// Port aus HotCord, Farbfamilien auf RoSe-Semantik gemappt.

export type SlideVariant = 'danger' | 'warning' | 'success' | 'neutral' | 'priority'

const SLIDE_STYLES: Record<SlideVariant, { track: string; handle: string; text: string }> = {
  danger: {
    track: 'bg-critical-tint border-critical-pill-edge',
    handle: 'bg-critical text-critical-foreground',
    text: 'text-critical-strong',
  },
  /* Priorisierte Reinigung — violett wie Balken/Flagge auf den Kacheln. */
  priority: {
    track: 'bg-accent-tint border-accent-pill-edge',
    handle: 'bg-accent text-accent-foreground',
    text: 'text-accent-strong',
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
  /**
   * Greifpunkt, Startposition und aktuelle Position des laufenden Zuges.
   * Bewusst eine Ref und kein State: Zeiger-Ereignisse können schneller
   * eintreffen, als React neu rendert — mit State-Prüfungen gingen die
   * ersten Bewegungen einer schnellen Geste verloren.
   */
  const dragRef = useRef<{ pointerStart: number; startX: number; currentX: number } | null>(null)
  const HANDLE = 48
  const PADDING = 4
  /** Antipp-Toleranz um den Griff (dicke Finger auf kleinen Displays). */
  const GRAB_SLACK = 10
  /** Praktisch die volle Bahn — der Rest ist nur Finger-Toleranz. */
  const CONFIRM_RATIO = 0.97

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

    // Der Zug muss AM GRIFF beginnen. Sprang der Griff wie früher zum
    // Berührungspunkt, genügte ein Wackeln am rechten Bahnende, um
    // auszulösen — die Sicherung wäre wirkungslos.
    const localX = e.clientX - rect.left
    const handleLeft = PADDING + x
    if (localX < handleLeft - GRAB_SLACK || localX > handleLeft + HANDLE + GRAB_SLACK) return

    setMaxX(rect.width - HANDLE - PADDING * 2)
    dragRef.current = { pointerStart: e.clientX, startX: x, currentX: x }
    setDrag(true)
    // Capture ist Komfort (Finger darf die Bahn verlassen) — schlägt es fehl,
    // funktioniert der Zug trotzdem.
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const track = trackRef.current
    if (!track) return
    const max = track.getBoundingClientRect().width - HANDLE - PADDING * 2
    // Relative Verschiebung: zurückgelegte Fingerstrecke = zurückgelegte Bahn.
    const next = Math.max(0, Math.min(max, drag.startX + (e.clientX - drag.pointerStart)))
    drag.currentX = next
    setX(next)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const track = trackRef.current
    const max = track ? track.getBoundingClientRect().width - HANDLE - PADDING * 2 : maxX
    const finalX = drag.currentX
    setDrag(false)
    dragRef.current = null
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    if (finalX >= max * CONFIRM_RATIO && max > 0) {
      setX(max)
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
      className={`relative h-14 w-full select-none touch-none overflow-hidden rounded-xl border ${styles.track} ${inactive && !done ? 'cursor-not-allowed opacity-40' : ''}`}
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
        className={`absolute top-1 flex h-12 w-12 items-center justify-center rounded-lg shadow-lg ${styles.handle} ${inactive ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {done
          ? <Check className="h-5 w-5 stroke-[3]" />
          : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        }
      </div>
    </div>
  )
}
