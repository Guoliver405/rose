'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Check } from 'lucide-react'

// ── Slide-to-Confirm-Button (verhindert versehentliches Auslösen) ────────────
// Port aus HotCord, Farbfamilien auf RoSe-Semantik gemappt.
//
// Gehärtet (25.07.2026): Der Zug muss AM GRIFF beginnen und die Bahn nahezu
// vollständig zurücklegen. Vorher sprang der Griff zum Berührungspunkt und
// löste ab 85 % aus — ein Wackeln am Bahnende genügte.
//
// Intern zählt `travel` die vom Ruhepunkt zurückgelegte Strecke (0…max),
// nicht die Position auf der Bahn. Dadurch ist die Laufrichtung nur noch ein
// Vorzeichen plus die Frage, an welcher Kante der Griff verankert wird.

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
  size = 'default',
  direction = 'ltr',
  onConfirm,
}: {
  label: string
  doneLabel?: string
  done?: boolean
  disabled?: boolean
  variant: SlideVariant
  /** `compact` = flache Zeile (40 px) für Nebenwege wie „Etage verlassen". */
  size?: 'default' | 'compact'
  /** `rtl` = von rechts nach links ziehen — passend für Zurück-Wege. */
  direction?: 'ltr' | 'rtl'
  onConfirm: () => void
}) {
  const compact = size === 'compact'
  const rtl = direction === 'rtl'

  const trackRef = useRef<HTMLDivElement>(null)
  /** Zurückgelegte Strecke ab Ruhepunkt (0 = Ausgangslage). */
  const [travel, setTravel] = useState(0)
  const [dragging, setDrag] = useState(false)
  /**
   * Greifpunkt und Stand des laufenden Zuges. Bewusst eine Ref und kein
   * State: Zeiger-Ereignisse können schneller eintreffen, als React neu
   * rendert — mit State-Prüfungen gingen die ersten Bewegungen einer
   * schnellen Geste verloren.
   */
  const dragRef = useRef<{ pointerStart: number; startTravel: number; current: number } | null>(null)

  const HANDLE = compact ? 32 : 48
  const PADDING = 4
  /** Antipp-Toleranz um den Griff (dicke Finger auf kleinen Displays). */
  const GRAB_SLACK = 10
  /** Praktisch die volle Bahn — der Rest ist nur Finger-Toleranz. */
  const CONFIRM_RATIO = 0.97

  /**
   * Bahnlänge. In den Zeiger-Handlern IMMER frisch aus dem DOM messen
   * (`measureMax`) — ein State-Wert wäre beim ersten Zug nach dem Mount
   * womöglich noch nicht gesetzt und der Griff bliebe kleben. Der State
   * dient nur der Anzeige (aria-valuenow, gepinnter Griff bei `done`),
   * wo die Ref nicht gelesen werden darf.
   */
  const [max, setMax] = useState(0)
  const measureMax = () => {
    const track = trackRef.current
    if (!track) return 0
    return Math.max(0, track.getBoundingClientRect().width - HANDLE - PADDING * 2)
  }
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(() => {
      setMax(Math.max(0, track.getBoundingClientRect().width - HANDLE - PADDING * 2))
    })
    observer.observe(track)
    return () => observer.disconnect()
  }, [HANDLE])

  const styles = SLIDE_STYLES[variant]
  const inactive = disabled || done
  // `done` von außen: Griff steht am Ziel — ohne den Zustand zu spiegeln.
  const shownTravel = done ? max : travel

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (inactive) return
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()

    // Der Zug muss AM GRIFF beginnen — sonst genügte ein Wackeln am Ende
    // der Bahn und die Sicherung wäre wirkungslos.
    const localX = e.clientX - rect.left
    const handleLeft = rtl
      ? rect.width - PADDING - HANDLE - travel
      : PADDING + travel
    if (localX < handleLeft - GRAB_SLACK || localX > handleLeft + HANDLE + GRAB_SLACK) return

    dragRef.current = { pointerStart: e.clientX, startTravel: travel, current: travel }
    setMax(measureMax())
    setDrag(true)
    // Capture ist Komfort (Finger darf die Bahn verlassen) — schlägt es fehl,
    // funktioniert der Zug trotzdem.
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    // Fingerstrecke in Zugrichtung = zurückgelegte Bahn.
    const delta = rtl ? drag.pointerStart - e.clientX : e.clientX - drag.pointerStart
    const next = Math.max(0, Math.min(measureMax(), drag.startTravel + delta))
    drag.current = next
    setTravel(next)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const finalTravel = drag.current
    const trackMax = measureMax()
    setDrag(false)
    dragRef.current = null
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}

    if (trackMax > 0 && finalTravel >= trackMax * CONFIRM_RATIO) {
      setTravel(trackMax)
      onConfirm()
      // Kurz Erfolg anzeigen, dann zurücksetzen — falls die Komponente nicht
      // ohnehin durch ein Re-Render ihren `done`-Zustand ändert oder verschwindet.
      window.setTimeout(() => setTravel(0), 400)
    } else {
      setTravel(0)
    }
  }

  const arrow = rtl ? '←' : '→'

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`relative w-full select-none touch-none overflow-hidden border ${compact ? 'h-10 rounded-lg' : 'h-14 rounded-xl'} ${styles.track} ${inactive && !done ? 'cursor-not-allowed opacity-40' : ''}`}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={max > 0 ? Math.round((shownTravel / max) * 100) : 0}
    >
      <div className={`pointer-events-none absolute inset-0 flex items-center justify-center font-black ${compact ? 'text-xs' : 'text-sm'} ${styles.text}`}>
        {done ? (doneLabel ?? label) : rtl ? `${arrow}  ${label}` : `${label}  ${arrow}`}
      </div>
      <div
        style={{
          [rtl ? 'right' : 'left']: PADDING,
          transform: `translateX(${rtl ? -shownTravel : shownTravel}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease-out',
        }}
        className={`absolute top-1 flex items-center justify-center shadow-lg ${compact ? 'h-8 w-8 rounded-md' : 'h-12 w-12 rounded-lg'} ${styles.handle} ${inactive ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {done
          ? <Check className={`stroke-[3] ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
          : (
            <svg
              className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} ${rtl ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )
        }
      </div>
    </div>
  )
}
