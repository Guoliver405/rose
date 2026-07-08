'use client'

import { useMemo, useState, useTransition } from 'react'
import { BedDouble, Trash2 } from 'lucide-react'
import { createRoomsAction, deleteFloorRoomsAction, deleteRoomAction } from './actions'

export type SetupRoom = {
  id: string
  number: string
  floor: number
  building: string | null
  occupied: boolean
}

/**
 * Expandiert eine Nummern-Eingabe: Kommaliste + numerische Bereiche.
 * Führende Nullen im Bereichs-Start geben die Breite vor:
 * "101-104, 110, A12" → ["101","102","103","104","110","A12"]
 * "01-03"             → ["01","02","03"]
 */
function expandNumbers(input: string): string[] {
  const out: string[] = []
  for (const token of input.split(',').map(t => t.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      const from = parseInt(range[1], 10)
      const to = parseInt(range[2], 10)
      const width = range[1].startsWith('0') ? range[1].length : 0
      if (to >= from && to - from < 500) {
        for (let n = from; n <= to; n++) {
          out.push(width ? String(n).padStart(width, '0') : String(n))
        }
        continue
      }
    }
    out.push(token)
  }
  return [...new Set(out)]
}

/** Etagen-Eingabe → Ganzzahlen ("1-3, 5" → [1,2,3,5]). */
function expandFloors(input: string): number[] {
  const floors = expandNumbers(input)
    .map(t => parseInt(t, 10))
    .filter(n => Number.isInteger(n))
  return [...new Set(floors)]
}

type Mode = 'individual' | 'identical'

export default function RoomSetup({ rooms }: { rooms: SetupRoom[] }) {
  const [mode, setMode] = useState<Mode>('individual')
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState('1')
  const [floorsInput, setFloorsInput] = useState('1-3')
  const [numbersInput, setNumbersInput] = useState('')
  const [prefixFloor, setPrefixFloor] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Geplante Zimmer: pro Etage die finalen Nummern (Präfix schon angewandt)
  const planned = useMemo(() => {
    const nums = expandNumbers(numbersInput)
    if (nums.length === 0) return []
    const floors =
      mode === 'individual'
        ? [parseInt(floor, 10)].filter(n => Number.isInteger(n))
        : expandFloors(floorsInput)
    return floors.map(f => ({
      floor: f,
      numbers: nums.map(n => (prefixFloor ? `${f}${n}` : n)),
    }))
  }, [mode, floor, floorsInput, numbersInput, prefixFloor])

  const plannedFlat = useMemo(() => planned.flatMap(g => g.numbers), [planned])

  // "Etagen identisch" ohne Präfix: Nummern sind je Gebäudeteil unique →
  // dieselbe Nummer auf mehreren Etagen kollidiert zwangsläufig.
  const collisionWarning = mode === 'identical' && !prefixFloor && planned.length > 1

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (planned.length === 0) { setError('Bitte gültige Etage(n) angeben.'); return }
    startTransition(async () => {
      const res = await createRoomsAction(building || null, planned)
      if (res.error) { setError(res.error); return }
      setMessage(
        `${res.created} Zimmer angelegt${res.skipped ? `, ${res.skipped} übersprungen (Nummer existierte bereits)` : ''}.`,
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

  function handleDeleteFloor(group: { building: string | null; floor: number; rooms: SetupRoom[] }) {
    const label = `${group.building ? `${group.building} · ` : ''}Etage ${group.floor}`
    if (!window.confirm(
      `Alle ${group.rooms.length} Zimmer von ${label} löschen? Belegte Zimmer bleiben erhalten.`,
    )) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const res = await deleteFloorRoomsAction(group.building, group.floor)
      if (res.error) { setError(res.error); return }
      setMessage(
        `${res.deleted} Zimmer gelöscht${res.skippedOccupied ? `, ${res.skippedOccupied} belegte übersprungen` : ''}.`,
      )
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

  const inputClass =
    'rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-active'

  return (
    <div className="flex flex-col gap-6">
      {/* Anlegen */}
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="font-bold text-ink">Zimmer anlegen</h2>

        {/* Modus-Switch */}
        <div className="flex w-fit rounded-lg border border-edge p-0.5" role="radiogroup" aria-label="Anlege-Modus">
          {([
            ['individual', 'Etagen individuell'],
            ['identical', 'Etagen identisch'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                mode === value
                  ? 'bg-action text-action-foreground'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          {mode === 'individual'
            ? 'Zimmernummern gelten für die eine angegebene Etage.'
            : 'Derselbe Nummernkreis wird auf jeder angegebenen Etage angelegt.'}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-ink-soft">Gebäudeteil (optional)</span>
            <input
              type="text"
              value={building}
              onChange={e => setBuilding(e.target.value)}
              placeholder="z. B. Haupthaus"
              className={inputClass}
            />
          </label>
          {mode === 'individual' ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-soft">Etage</span>
              <input
                type="number"
                required
                value={floor}
                onChange={e => setFloor(e.target.value)}
                className={inputClass}
              />
            </label>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-soft">
                Etagen — Komma-Liste oder Bereich
              </span>
              <input
                type="text"
                required
                value={floorsInput}
                onChange={e => setFloorsInput(e.target.value)}
                placeholder="z. B. 1-3"
                className={`${inputClass} font-mono`}
              />
            </label>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-soft">
            {mode === 'individual'
              ? 'Zimmernummern — einzeln, Komma-Liste oder Bereich'
              : 'Zimmernummern je Etage — einzeln, Komma-Liste oder Bereich'}
          </span>
          <input
            type="text"
            required
            value={numbersInput}
            onChange={e => setNumbersInput(e.target.value)}
            placeholder={mode === 'individual' ? 'z. B. 101-110 oder 201, 202, 205' : 'z. B. 01-10'}
            className={`${inputClass} font-mono`}
          />
        </label>

        <label className="flex w-fit cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={prefixFloor}
            onChange={e => setPrefixFloor(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-action-bar)]"
          />
          <span className="text-sm font-semibold text-ink-soft">
            Etagennummer voranstellen (Etage 2 + &bdquo;05&ldquo; &rarr; &bdquo;205&ldquo;)
          </span>
        </label>

        {collisionWarning && (
          <p className="rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-sm font-semibold text-attention-deepest">
            Ohne vorangestellte Etagennummer ist dieselbe Nummer auf mehreren
            Etagen nicht möglich — Zimmernummern sind je Gebäudeteil eindeutig.
            Nur die erste Etage würde angelegt.
          </p>
        )}

        {plannedFlat.length > 0 && (
          <p className="text-xs text-ink-muted">
            {plannedFlat.length} Zimmer werden angelegt: {plannedFlat.slice(0, 12).join(', ')}
            {plannedFlat.length > 12 ? ` … (+${plannedFlat.length - 12})` : ''}
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
          disabled={pending || plannedFlat.length === 0}
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
              <h3 className="mb-2 flex items-center text-sm font-bold text-ink-soft">
                {group.building ? `${group.building} · ` : ''}Etage {group.floor}
                <span className="ml-2 font-normal text-ink-muted">{group.rooms.length} Zimmer</span>
                <button
                  type="button"
                  onClick={() => handleDeleteFloor(group)}
                  disabled={pending}
                  className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-1 text-ink-muted hover:text-critical-strong disabled:opacity-50"
                  aria-label={`Alle Zimmer von Etage ${group.floor} löschen`}
                  title="Alle Zimmer dieser Etage löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
