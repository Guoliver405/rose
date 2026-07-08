'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, BedDouble, DoorOpen, Loader2, Moon, Printer, RefreshCw, Sparkles, X,
} from 'lucide-react'
import {
  checkInAction, checkOutAction, markCleanedAction, setPriorityAction,
} from './actions'

export type RoomTileData = {
  id: string
  number: string
  floor: number
  building: string | null
  occupied: boolean
  pin: string | null
  checkedInAt: string | null
  guestSignal: 'none' | 'please_clean' | 'dnd'
  checkoutPending: boolean
  priority: boolean
  cleaningActive: boolean
  stayoverDue: boolean
}

export type FloorGroup = {
  building: string | null
  floor: number
  rooms: RoomTileData[]
}

/** Farb-Vorrang: priorisiert > in Arbeit > ausgecheckt > Reinigungswunsch/Routine > DND > belegt > frei */
function tileBar(t: RoomTileData): string {
  if (t.priority) return 'bg-critical'
  if (t.cleaningActive) return 'bg-positive-soft'
  if (t.checkoutPending) return 'bg-caution'
  if (t.guestSignal === 'please_clean' || t.stayoverDue) return 'bg-attention'
  if (t.guestSignal === 'dnd') return 'bg-blocked'
  if (t.occupied) return 'bg-fresh'
  return 'bg-edge'
}

function statusLabel(t: RoomTileData): string {
  const parts: string[] = []
  parts.push(t.occupied ? 'Belegt' : 'Frei')
  if (t.priority) parts.push('priorisierte Reinigung')
  if (t.cleaningActive) parts.push('Reinigung läuft')
  if (t.checkoutPending) parts.push('Reinigung nach Check-out offen')
  if (t.guestSignal === 'please_clean') parts.push('Gast wünscht Reinigung')
  if (t.stayoverDue) parts.push('Routine-Reinigung fällig')
  if (t.guestSignal === 'dnd') parts.push('Bitte nicht stören')
  return parts.join(' · ')
}

export default function RoomGrid({ floorGroups }: { floorGroups: FloorGroup[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Gebäude-Ebene: sobald irgendein Zimmer einen Gebäudeteil hat, werden die
  // Etagen darunter gruppiert. Ohne Gebäudeteile bleibt die flache Ansicht.
  const hasNamedBuilding = floorGroups.some(g => g.building !== null)
  const byBuilding: { name: string | null; groups: FloorGroup[] }[] = []
  for (const g of floorGroups) {
    const last = byBuilding[byBuilding.length - 1]
    if (last && last.name === g.building) last.groups.push(g)
    else byBuilding.push({ name: g.building, groups: [g] })
  }

  const selected = selectedId
    ? floorGroups.flatMap(g => g.rooms).find(r => r.id === selectedId) ?? null
    : null

  const floorSection = (group: FloorGroup) => (
    <section
      key={`${group.building ?? ''}#${group.floor}`}
      className="rounded-xl border border-edge bg-surface px-4 py-2"
    >
      <h3 className="mb-1.5 text-sm font-bold text-ink-soft">
        Etage {group.floor}
        <span className="ml-2 font-normal text-ink-muted">{group.rooms.length} Zimmer</span>
      </h3>
      <div className="flex flex-wrap gap-2 pb-1">
        {group.rooms.map(room => (
          <RoomTile key={room.id} room={room} onClick={() => setSelectedId(room.id)} />
        ))}
      </div>
    </section>
  )

  return (
    <div className="flex flex-col gap-3">
      {hasNamedBuilding
        ? byBuilding.map(b => (
            <div key={b.name ?? ''} className="flex flex-col gap-2">
              <h2 className="mt-1 flex items-center gap-2 text-base font-black text-ink">
                {b.name ?? 'Ohne Gebäudeteil'}
                <span className="text-xs font-semibold text-ink-muted">
                  {b.groups.reduce((n, g) => n + g.rooms.length, 0)} Zimmer
                </span>
              </h2>
              {b.groups.map(floorSection)}
            </div>
          ))
        : floorGroups.map(floorSection)}

      {selected && (
        <RoomDialog key={selected.id} room={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}

function RoomTile({ room, onClick }: { room: RoomTileData; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={statusLabel(room)}
      className={`flex w-20 flex-col overflow-hidden rounded-lg border bg-surface-elevated text-left shadow-sm hover:border-edge-strong ${
        room.priority ? 'border-critical blink-ring-overdue' : 'border-edge'
      }`}
    >
      <span className={`h-1.5 w-full ${tileBar(room)}`} />
      <span className="flex flex-col gap-1 px-2 py-1.5">
        <span className={`text-sm font-black ${room.occupied || room.checkoutPending || room.priority ? 'text-ink' : 'text-ink-muted'}`}>
          {room.number}
        </span>
        <span className="flex h-4 items-center gap-1">
          {room.occupied && <BedDouble className="h-3.5 w-3.5 text-active-strong" />}
          {room.guestSignal === 'dnd' && <Moon className="h-3.5 w-3.5 text-blocked-strong" />}
          {room.guestSignal === 'please_clean' && <Sparkles className="h-3.5 w-3.5 text-attention-strong" />}
          {room.stayoverDue && <RefreshCw className="h-3.5 w-3.5 text-attention-strong" />}
          {room.checkoutPending && <DoorOpen className="h-3.5 w-3.5 text-caution-strong" />}
          {room.priority && <AlertTriangle className="h-3.5 w-3.5 text-critical-strong" />}
          {room.cleaningActive && <Loader2 className="h-3.5 w-3.5 animate-spin text-positive-strong" />}
        </span>
      </span>
    </button>
  )
}

function RoomDialog({ room, onClose }: { room: RoomTileData; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string[] | null>(null)
  const [freshPin, setFreshPin] = useState<string | null>(null)
  const [confirmCheckout, setConfirmCheckout] = useState(false)

  const needsCleaning = room.checkoutPending || room.priority || room.guestSignal === 'please_clean' || room.stayoverDue

  function runCheckIn(force: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await checkInAction(room.id, force)
      if (res.error) { setError(res.error); setWarning(null); return }
      if (res.warning) { setWarning(res.warning.reasons); return }
      setWarning(null)
      setFreshPin(res.pin ?? null)
    })
  }

  function runCheckOut() {
    setError(null)
    startTransition(async () => {
      const res = await checkOutAction(room.id)
      if (res.error) { setError(res.error); return }
      onClose()
    })
  }

  function runPriority(value: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await setPriorityAction(room.id, value)
      if (res.error) setError(res.error)
    })
  }

  function runMarkCleaned() {
    setError(null)
    startTransition(async () => {
      const res = await markCleanedAction(room.id)
      if (res.error) setError(res.error)
    })
  }

  const checkedInLabel = room.checkedInAt
    ? new Date(room.checkedInAt).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-edge bg-surface-elevated p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-ink">Zimmer {room.number}</h3>
            <p className="text-xs text-ink-muted">
              {room.building ? `${room.building} · ` : ''}Etage {room.floor}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm font-semibold text-ink-soft">{statusLabel(room)}</p>

        {/* PIN-Anzeige nach frischem Check-in ODER für belegtes Zimmer */}
        {(freshPin || (room.occupied && room.pin)) && (
          <div className="mb-4 rounded-xl border border-action-tint-edge bg-action-tint p-4 text-center">
            <p className="text-xs font-semibold tracking-wide text-action-deep">
              {freshPin ? 'CHECK-IN ERFOLGREICH — GAST-PIN' : 'GAST-PIN'}
            </p>
            <p className="mt-1 font-mono text-4xl font-black tracking-[0.3em] text-action-deep">
              {freshPin ?? room.pin}
            </p>
            <p className="mt-2 text-xs text-action-deep">
              Dem Gast mitteilen — Anmeldung mit Zimmernummer + PIN im Gäste-Portal.
              {checkedInLabel && !freshPin ? ` Eingecheckt am ${checkedInLabel}.` : ''}
            </p>
            <Link
              href={`/admin/handout/${room.id}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-action-tint-edge px-3 py-1.5 text-sm font-bold text-action-deep hover:bg-surface"
            >
              <Printer className="h-4 w-4" /> Gast-Handout drucken
            </Link>
          </div>
        )}

        {/* Warnung vor Check-in auf ungereinigtes Zimmer */}
        {warning && (
          <div className="mb-4 rounded-xl border border-attention-tint-edge bg-attention-tint p-4">
            <p className="flex items-center gap-2 font-bold text-attention-deepest">
              <AlertTriangle className="h-4 w-4" /> Zimmer nicht bereit
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm text-attention-deepest">
              {warning.map(r => <li key={r}>{r}</li>)}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => runCheckIn(true)}
                className="rounded-lg bg-attention px-3 py-2 text-sm font-bold text-attention-foreground disabled:opacity-50"
              >
                Trotzdem einchecken
              </button>
              <button
                type="button"
                onClick={() => setWarning(null)}
                className="rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {/* Check-in / Check-out */}
          {!room.occupied && !freshPin && !warning && (
            <button
              type="button"
              disabled={pending}
              onClick={() => runCheckIn(false)}
              className="rounded-xl bg-action px-4 py-3 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
            >
              {pending ? 'Check-in …' : 'Check-in'}
            </button>
          )}

          {room.occupied && !confirmCheckout && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmCheckout(true)}
              className="rounded-xl border border-edge-strong px-4 py-3 font-bold text-ink hover:bg-surface-muted disabled:opacity-50"
            >
              Check-out
            </button>
          )}
          {room.occupied && confirmCheckout && (
            <div className="rounded-xl border border-edge bg-surface-sunken p-3">
              <p className="text-sm font-semibold text-ink">
                Check-out bestätigen? Der Gast-Zugang wird sofort beendet.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={runCheckOut}
                  className="rounded-lg bg-action px-3 py-2 text-sm font-bold text-action-foreground disabled:opacity-50"
                >
                  {pending ? 'Check-out …' : 'Ja, auschecken'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCheckout(false)}
                  className="rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Priorisierte Reinigung */}
          <button
            type="button"
            disabled={pending}
            onClick={() => runPriority(!room.priority)}
            className={`rounded-xl px-4 py-3 font-bold disabled:opacity-50 ${
              room.priority
                ? 'bg-critical text-critical-foreground hover:bg-critical-strong'
                : 'border border-critical-pill-edge bg-critical-tint text-critical-strong hover:bg-critical-pill'
            }`}
          >
            {room.priority ? 'Priorisierung aufheben' : 'Reinigung priorisieren'}
          </button>

          {/* Status-Korrektur */}
          {needsCleaning && (
            <button
              type="button"
              disabled={pending}
              onClick={runMarkCleaned}
              className="rounded-xl border border-positive-pill-edge bg-positive-tint px-4 py-3 font-bold text-positive-deep hover:bg-positive-pill disabled:opacity-50"
            >
              Reinigung als erledigt markieren
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
