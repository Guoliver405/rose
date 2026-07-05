'use client'

import { useMemo, useState, useTransition } from 'react'
import { BedDouble, Trash2 } from 'lucide-react'
import { createRoomsAction, deleteRoomAction } from './actions'

export type SetupRoom = {
  id: string
  number: string
  floor: number
  building: string | null
  occupied: boolean
}

/**
 * Expandiert eine Nummern-Eingabe: Kommaliste + numerische Bereiche.
 * "101-104, 110, A12" → ["101","102","103","104","110","A12"]
 */
function expandNumbers(input: string): string[] {
  const out: string[] = []
  for (const token of input.split(',').map(t => t.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      const from = parseInt(range[1], 10)
      const to = parseInt(range[2], 10)
      if (to >= from && to - from < 500) {
        for (let n = from; n <= to; n++) out.push(String(n))
        continue
      }
    }
    out.push(token)
  }
  return [...new Set(out)]
}

export default function RoomSetup({ rooms }: { rooms: SetupRoom[] }) {
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState('1')
  const [numbersInput, setNumbersInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const preview = useMemo(() => expandNumbers(numbersInput), [numbersInput])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    const floorNum = parseInt(floor, 10)
    if (!Number.isInteger(floorNum)) { setError('Bitte eine gültige Etage angeben.'); return }
    startTransition(async () => {
      const res = await createRoomsAction(building || null, floorNum, preview)
      if (res.error) { setError(res.error); return }
      setMessage(
        `${res.created} Zimmer angelegt${res.skipped ? `, ${res.skipped} übersprungen (existierten bereits)` : ''}.`,
      )
      setNumbersInput('')
    })
  }

  function handleDelete(room: SetupRoom) {
    if (!window.confirm(`Zimmer ${room.number} wirklich löschen?`)) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const res = await deleteRoomAction(room.id)
      if (res.error) setError(res.error)
    })
  }

  // Gruppierung wie in der Übersicht: Gebäude → Etage absteigend
  const groups = new Map<string, { building: string | null; floor: number; rooms: SetupRoom[] }>()
  for (const r of rooms) {
    const key = `${r.building ?? ''}#${r.floor}`
    if (!groups.has(key)) groups.set(key, { building: r.building, floor: r.floor, rooms: [] })
    groups.get(key)!.rooms.push(r)
  }
  const sorted = [...groups.values()].sort((a, b) => {
    const ba = a.building ?? ''
    const bb = b.building ?? ''
    if (ba !== bb) return ba.localeCompare(bb, 'de')
    return b.floor - a.floor
  })
  for (const g of sorted) {
    g.rooms.sort((a, b) => a.number.localeCompare(b.number, 'de', { numeric: true }))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Anlegen */}
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="font-bold text-ink">Zimmer anlegen</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-ink-soft">Gebäudeteil (optional)</span>
            <input
              type="text"
              value={building}
              onChange={e => setBuilding(e.target.value)}
              placeholder="z. B. Haupthaus"
              className="rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-active"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-ink-soft">Etage</span>
            <input
              type="number"
              required
              value={floor}
              onChange={e => setFloor(e.target.value)}
              className="rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-active"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-soft">
            Zimmernummern — einzeln, Komma-Liste oder Bereich
          </span>
          <input
            type="text"
            required
            value={numbersInput}
            onChange={e => setNumbersInput(e.target.value)}
            placeholder="z. B. 101-110 oder 201, 202, 205"
            className="rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-ink outline-none focus:border-active"
          />
        </label>
        {preview.length > 0 && (
          <p className="text-xs text-ink-muted">
            {preview.length} Zimmer werden angelegt: {preview.slice(0, 12).join(', ')}
            {preview.length > 12 ? ` … (+${preview.length - 12})` : ''}
          </p>
        )}
        {message && (
          <p className="rounded-lg border border-positive-tint-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || preview.length === 0}
          className="self-start rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? 'Anlegen …' : 'Anlegen'}
        </button>
      </form>

      {/* Bestand */}
      {sorted.length === 0 ? (
        <p className="text-sm text-ink-muted">Noch keine Zimmer vorhanden.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(group => (
            <section
              key={`${group.building ?? ''}#${group.floor}`}
              className="rounded-xl border border-edge bg-surface px-4 py-3"
            >
              <h3 className="mb-2 text-sm font-bold text-ink-soft">
                {group.building ? `${group.building} · ` : ''}Etage {group.floor}
                <span className="ml-2 font-normal text-ink-muted">{group.rooms.length} Zimmer</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.rooms.map(room => (
                  <span
                    key={room.id}
                    className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-elevated px-2.5 py-1.5 text-sm font-semibold text-ink"
                  >
                    {room.number}
                    {room.occupied ? (
                      <BedDouble className="h-3.5 w-3.5 text-active-strong" aria-label="belegt" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(room)}
                        disabled={pending}
                        className="text-ink-muted hover:text-critical-strong disabled:opacity-50"
                        aria-label={`Zimmer ${room.number} löschen`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
