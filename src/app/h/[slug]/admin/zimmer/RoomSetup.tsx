'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  BedDouble, Building2, Layers, Pencil, PowerOff, RotateCcw, SlidersHorizontal, Trash2, X,
} from 'lucide-react'
import { formatCents } from '@/lib/money'
import {
  createRoomsAction, deleteScopeAction, editScopeAction, getDeletionImpactAction,
  setScopeActiveAction, type DeletionImpact, type RoomScope,
} from './actions'

export type SetupRoom = {
  id: string
  number: string
  floor: number
  building: string | null
  occupied: boolean
  /** Außer Betrieb — nicht auf den Boards, kein Check-in, kein QR-Aushang. */
  deactivated: boolean
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

type FloorGroup = { building: string | null; floor: number; rooms: SetupRoom[] }
type BuildingGroup = { name: string | null; floors: FloorGroup[]; rooms: SetupRoom[] }

/** Was der Bereichs-Dialog gerade bearbeitet. */
type DialogTarget = {
  scope: RoomScope
  title: string
  subtitle: string
  rooms: SetupRoom[]
}

const inputClass =
  'rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-active'

export default function RoomSetup({ hotelSlug, rooms }: { hotelSlug: string; rooms: SetupRoom[] }) {
  const [mode, setMode] = useState<Mode>('individual')
  const [building, setBuilding] = useState('')
  const [floor, setFloor] = useState('1')
  const [floorsInput, setFloorsInput] = useState('1-3')
  const [numbersInput, setNumbersInput] = useState('')
  /**
   * Voranstellen der Etagennummer — Vorbelegung hängt am Modus (Befund 2 des
   * Testplan-Durchlaufs vom 25.07.2026):
   *
   * - „Etagen individuell": AUS. Der Platzhalter schlägt volle Nummern vor
   *   („z. B. 101-110"); vorausgewählt wurde daraus stillschweigend 1101-1110.
   * - „Etagen identisch": AN. Genau dafür ist die Option da — einmal „01-10"
   *   eingeben und 101-110, 201-210, 301-310 bekommen. Ohne sie kollidieren
   *   die Etagen miteinander (Zimmernummern sind je Gebäudeteil eindeutig).
   *
   * Der Moduswechsel setzt die Vorbelegung zurück, weil sich mit ihm die
   * Bedeutung des Nummernfelds ändert (volle Nummern vs. Suffixe).
   */
  const [prefixFloor, setPrefixFloor] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setPrefixFloor(next === 'identical')
  }
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  /** Rückmeldung aus dem Bereichs-Dialog (Bearbeiten, außer Betrieb, Löschen). */
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogTarget | null>(null)

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
      const res = await createRoomsAction(hotelSlug, building || null, planned)
      if (res.error) { setError(res.error); return }
      setMessage(
        `${res.created} Zimmer angelegt${res.skipped ? `, ${res.skipped} übersprungen (Nummer existierte bereits)` : ''}.`,
      )
      setNumbersInput('')
    })
  }

  // Bestand gruppieren: Gebäudeteil → Etage (absteigend), wie in der Übersicht.
  const buildings = useMemo(() => {
    const floors = new Map<string, FloorGroup>()
    for (const r of rooms) {
      const key = `${r.building ?? ''}#${r.floor}`
      if (!floors.has(key)) floors.set(key, { building: r.building, floor: r.floor, rooms: [] })
      floors.get(key)!.rooms.push(r)
    }
    for (const g of floors.values()) {
      g.rooms.sort((a, b) => a.number.localeCompare(b.number, 'de', { numeric: true }))
    }
    const sortedFloors = [...floors.values()].sort((a, b) => {
      const ba = a.building ?? ''
      const bb = b.building ?? ''
      if (ba !== bb) return ba.localeCompare(bb, 'de')
      return b.floor - a.floor
    })
    const out: BuildingGroup[] = []
    for (const g of sortedFloors) {
      const last = out[out.length - 1]
      if (last && last.name === g.building) {
        last.floors.push(g)
        last.rooms.push(...g.rooms)
      } else {
        out.push({ name: g.building, floors: [g], rooms: [...g.rooms] })
      }
    }
    return out
  }, [rooms])

  /**
   * Die Gebäude-Ebene erscheint nur, wenn sie etwas unterscheidet. Bei einem
   * einzigen namenlosen Gebäudeteil wäre „Gebäudeteil löschen" gleichbedeutend
   * mit „alle Zimmer des Hauses löschen" — ohne jeden Nutzen und mit dem
   * größtmöglichen Fehlklick.
   */
  const showBuildingLevel = buildings.length > 1 || buildings[0]?.name !== null

  function openDialog(target: DialogTarget) {
    setNotice(null)
    setDialog(target)
  }

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
              onClick={() => switchMode(value)}
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
      {rooms.length === 0 ? (
        <p className="text-sm text-ink-muted">Noch keine Zimmer vorhanden.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-muted">
            Zimmer, Etage oder Gebäudeteil anklicken, um sie zu <strong className="font-semibold text-ink-soft">bearbeiten</strong>,{' '}
            <strong className="font-semibold text-ink-soft">außer Betrieb zu nehmen</strong> oder{' '}
            <strong className="font-semibold text-ink-soft">zu löschen</strong>. Verschrieben?
            Bearbeiten ändert Nummer, Etage und Gebäudeteil, ohne dass etwas verloren geht.
          </p>

          {notice && (
            <p className="rounded-lg border border-positive-tint-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
              {notice}
            </p>
          )}

          {buildings.map(b => (
            <div key={b.name ?? ''} className="flex flex-col gap-2">
              {showBuildingLevel && (
                <button
                  type="button"
                  onClick={() => openDialog({
                    scope: { kind: 'building', building: b.name },
                    title: b.name ?? 'Ohne Gebäudeteil',
                    subtitle: `${b.rooms.length} Zimmer auf ${b.floors.length} Etage${b.floors.length === 1 ? '' : 'n'}`,
                    rooms: b.rooms,
                  })}
                  className="flex items-center gap-2 rounded-lg px-1 py-1 text-left text-sm font-black text-ink hover:bg-surface-muted"
                >
                  <Building2 className="h-4 w-4 text-ink-muted" />
                  {b.name ?? 'Ohne Gebäudeteil'}
                  <span className="font-normal text-ink-muted">{b.rooms.length} Zimmer</span>
                  <SlidersHorizontal className="h-3.5 w-3.5 text-ink-muted" />
                </button>
              )}

              {b.floors.map(group => {
                const deactivated = group.rooms.filter(r => r.deactivated).length
                return (
                  <section
                    key={`${group.building ?? ''}#${group.floor}`}
                    className={`rounded-xl border border-edge bg-surface px-4 py-3 ${showBuildingLevel ? 'ml-3' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => openDialog({
                        scope: { kind: 'floor', building: group.building, floor: group.floor },
                        title: `Etage ${group.floor}`,
                        subtitle: `${group.building ? `${group.building} · ` : ''}${group.rooms.length} Zimmer`,
                        rooms: group.rooms,
                      })}
                      className="mb-2 flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left text-sm font-bold text-ink-soft hover:bg-surface-muted"
                    >
                      <Layers className="h-4 w-4 text-ink-muted" />
                      Etage {group.floor}
                      <span className="font-normal text-ink-muted">
                        {group.rooms.length} Zimmer
                        {deactivated > 0 && ` · ${deactivated} außer Betrieb`}
                      </span>
                      <SlidersHorizontal className="ml-auto h-3.5 w-3.5 text-ink-muted" />
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {group.rooms.map(room => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => openDialog({
                            scope: { kind: 'room', roomId: room.id },
                            title: `Zimmer ${room.number}`,
                            subtitle: `${room.building ? `${room.building} · ` : ''}Etage ${room.floor}`,
                            rooms: [room],
                          })}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold hover:border-edge-strong ${
                            room.deactivated
                              ? 'border-dashed border-edge-strong bg-surface-muted text-ink-muted'
                              : 'border-edge bg-surface-elevated text-ink'
                          }`}
                          title={room.deactivated ? 'Außer Betrieb' : undefined}
                        >
                          {room.number}
                          {room.occupied && (
                            <BedDouble className="h-3.5 w-3.5 text-active-strong" aria-label="belegt" />
                          )}
                          {room.deactivated && (
                            <PowerOff className="h-3.5 w-3.5" aria-label="außer Betrieb" />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <ScopeDialog
          key={JSON.stringify(dialog.scope)}
          hotelSlug={hotelSlug}
          target={dialog}
          onClose={() => setDialog(null)}
          onDone={text => { setDialog(null); setNotice(text) }}
        />
      )}
    </div>
  )
}

/**
 * Ein Dialog für alle drei Ebenen. Bewusst identisch aufgebaut: die
 * Rückmeldung des Testers vom 03.09.2026 war nicht „Löschen fehlt", sondern
 * „hier geht offenbar nur Deaktivieren" — die Aktionen müssen also auf jeder
 * Ebene an derselben Stelle stehen und ihren Namen tragen.
 */
function ScopeDialog({
  hotelSlug, target, onClose, onDone,
}: {
  hotelSlug: string
  target: DialogTarget
  onClose: () => void
  onDone: (message: string) => void
}) {
  const { scope, title, subtitle, rooms } = target
  const [view, setView] = useState<'menu' | 'edit' | 'delete'>('menu')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const first = rooms[0]
  const [editNumber, setEditNumber] = useState(first?.number ?? '')
  const [editFloor, setEditFloor] = useState(String(first?.floor ?? 0))
  const [editBuilding, setEditBuilding] = useState(first?.building ?? '')

  const [impact, setImpact] = useState<DeletionImpact | null>(null)
  const [confirmInput, setConfirmInput] = useState('')

  const occupied = rooms.filter(r => r.occupied).length
  const deactivated = rooms.filter(r => r.deactivated).length
  const active = rooms.length - deactivated

  // Auswirkungen erst laden, wenn der Löschweg betreten wird — im Menü wäre
  // es eine Abfrage pro geöffnetem Dialog ohne Gegenwert.
  useEffect(() => {
    if (view !== 'delete') return
    let alive = true
    getDeletionImpactAction(hotelSlug, scope).then(res => {
      if (!alive) return
      if (res.error) setError(res.error)
      else setImpact(res.impact ?? null)
    })
    return () => { alive = false }
  }, [view, hotelSlug, scope])

  function runActive(next: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await setScopeActiveAction(hotelSlug, scope, next)
      if (res.error) { setError(res.error); return }
      const skipped = res.skippedOccupied
        ? `, ${res.skippedOccupied} belegte übersprungen`
        : ''
      onDone(
        next
          ? `${res.changed} Zimmer wieder in Betrieb.`
          : `${res.changed} Zimmer außer Betrieb${skipped} — Historie bleibt erhalten.`,
      )
    })
  }

  function runEdit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const patch: { number?: string; floor?: number; building?: string | null } = {}
    if (scope.kind === 'room') patch.number = editNumber
    if (scope.kind !== 'building') {
      const parsed = parseInt(editFloor, 10)
      if (!Number.isInteger(parsed)) { setError('Bitte eine gültige Etage angeben.'); return }
      patch.floor = parsed
    }
    patch.building = editBuilding.trim() || null

    startTransition(async () => {
      const res = await editScopeAction(hotelSlug, scope, patch)
      if (res.error) { setError(res.error); return }
      onDone(
        res.changed === 0
          ? 'Keine Änderung — alles war bereits so eingetragen.'
          : `${res.changed} Zimmer geändert.`,
      )
    })
  }

  function runDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteScopeAction(hotelSlug, scope, confirmInput)
      if (res.error) { setError(res.error); return }
      onDone(`${res.label} gelöscht (${res.deleted} Zimmer).`)
    })
  }

  const numberChanged = scope.kind === 'room' && editNumber.trim() !== (first?.number ?? '')
  const buildingChanged = (editBuilding.trim() || null) !== (first?.building ?? null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-edge bg-surface-elevated p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-ink">{title}</h3>
            <p className="text-xs text-ink-muted">{subtitle}</p>
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

        {error && (
          <p className="mb-3 rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}

        {view === 'menu' && (
          <div className="flex flex-col gap-2">
            <p className="mb-1 text-sm text-ink-soft">
              {rooms.length} Zimmer
              {occupied > 0 && ` · ${occupied} belegt`}
              {deactivated > 0 && ` · ${deactivated} außer Betrieb`}
            </p>

            <button
              type="button"
              onClick={() => { setError(null); setView('edit') }}
              className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3 text-left hover:border-edge-strong"
            >
              <Pencil className="h-5 w-5 shrink-0 text-ink-soft" />
              <span>
                <span className="block text-sm font-bold text-ink">Bearbeiten</span>
                <span className="block text-xs text-ink-muted">
                  {scope.kind === 'room'
                    ? 'Nummer, Etage oder Gebäudeteil korrigieren'
                    : scope.kind === 'floor'
                      ? 'Etage verschieben oder Gebäudeteil wechseln'
                      : 'Gebäudeteil umbenennen'}
                  {' '}— nichts geht verloren
                </span>
              </span>
            </button>

            {active > 0 && (
              <button
                type="button"
                onClick={() => runActive(false)}
                disabled={pending}
                className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3 text-left hover:border-edge-strong disabled:opacity-50"
              >
                <PowerOff className="h-5 w-5 shrink-0 text-caution-deepest" />
                <span>
                  <span className="block text-sm font-bold text-ink">Außer Betrieb nehmen</span>
                  <span className="block text-xs text-ink-muted">
                    Verschwindet von Boards und Aushängen, Historie bleibt vollständig
                  </span>
                </span>
              </button>
            )}

            {deactivated > 0 && (
              <button
                type="button"
                onClick={() => runActive(true)}
                disabled={pending}
                className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3 text-left hover:border-edge-strong disabled:opacity-50"
              >
                <RotateCcw className="h-5 w-5 shrink-0 text-positive-deep" />
                <span>
                  <span className="block text-sm font-bold text-ink">Wieder in Betrieb nehmen</span>
                  <span className="block text-xs text-ink-muted">
                    {deactivated} Zimmer zurückholen
                  </span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { setError(null); setImpact(null); setConfirmInput(''); setView('delete') }}
              className="flex items-center gap-3 rounded-xl border border-critical-tint-edge bg-critical-tint p-3 text-left hover:border-critical"
            >
              <Trash2 className="h-5 w-5 shrink-0 text-critical-strong" />
              <span>
                <span className="block text-sm font-bold text-critical-strong">Endgültig löschen</span>
                <span className="block text-xs text-critical-strong">
                  Mit allen Aufenthalten und Vorgängen — nicht rückgängig zu machen
                </span>
              </span>
            </button>
          </div>
        )}

        {view === 'edit' && (
          <form onSubmit={runEdit} className="flex flex-col gap-3">
            {scope.kind === 'room' && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink-soft">Zimmernummer</span>
                <input
                  type="text"
                  required
                  value={editNumber}
                  onChange={e => setEditNumber(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </label>
            )}
            {scope.kind !== 'building' && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink-soft">Etage</span>
                <input
                  type="number"
                  required
                  value={editFloor}
                  onChange={e => setEditFloor(e.target.value)}
                  className={inputClass}
                />
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-soft">Gebäudeteil (leer = ohne)</span>
              <input
                type="text"
                value={editBuilding}
                onChange={e => setEditBuilding(e.target.value)}
                placeholder="z. B. Haupthaus"
                className={inputClass}
              />
            </label>

            {scope.kind !== 'room' && (
              <p className="text-xs text-ink-muted">
                Gilt für alle {rooms.length} Zimmer dieses Bereichs.
              </p>
            )}

            {(numberChanged || buildingChanged) && (
              <p className="rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-xs font-semibold text-attention-deepest">
                Die QR-Codes bleiben gültig — sie hängen am Zimmer, nicht an der
                Nummer. Bereits <strong>gedruckte</strong> Aushänge und Handouts
                tragen aber die alte Beschriftung und sollten neu gedruckt werden.
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? 'Speichern …' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => { setError(null); setView('menu') }}
                className="rounded-lg border border-edge px-4 py-2.5 font-semibold text-ink-soft hover:text-ink"
              >
                Zurück
              </button>
            </div>
          </form>
        )}

        {view === 'delete' && (
          <div className="flex flex-col gap-3">
            {!impact && !error && <p className="text-sm text-ink-muted">Auswirkungen werden geprüft …</p>}

            {impact && (
              <>
                <ImpactList impact={impact} />

                {impact.occupied > 0 ? (
                  <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
                    {impact.occupied === 1
                      ? 'Das Zimmer ist belegt und lässt sich nicht löschen — bitte zuerst auschecken.'
                      : `${impact.occupied} Zimmer sind belegt und lassen sich nicht löschen — bitte zuerst auschecken.`}
                  </p>
                ) : (
                  <>
                    {impact.requiresPhrase && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-ink-soft">
                          Zum Bestätigen &bdquo;{impact.confirmPhrase}&ldquo; eingeben
                        </span>
                        <input
                          type="text"
                          value={confirmInput}
                          onChange={e => setConfirmInput(e.target.value)}
                          autoComplete="off"
                          className={`${inputClass} font-mono`}
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={runDelete}
                      disabled={pending || (impact.requiresPhrase && confirmInput.trim() !== impact.confirmPhrase)}
                      className="rounded-lg bg-critical px-4 py-2.5 font-bold text-critical-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {pending ? 'Löschen …' : `Endgültig löschen`}
                    </button>
                    {impact.requiresPhrase && (
                      <button
                        type="button"
                        onClick={() => runActive(false)}
                        disabled={pending}
                        className="rounded-lg border border-edge px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
                      >
                        Lieber außer Betrieb nehmen — Belege bleiben erhalten
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => { setError(null); setView('menu') }}
              className="self-start text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Zurück
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** „1 Aufenthalt" statt „1 Aufenthalte" — der Dialog soll Vertrauen tragen. */
function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Was das Löschen kostet, in Zahlen statt in Warnsätzen. */
function ImpactList({ impact }: { impact: DeletionImpact }) {
  const lost: string[] = []
  if (impact.rooms > 1) lost.push(`${impact.rooms} Zimmer`)
  if (impact.stays > 0) lost.push(plural(impact.stays, 'Aufenthalt', 'Aufenthalte'))
  if (impact.ordersOpen > 0) {
    lost.push(plural(impact.ordersOpen, 'offene Service-Anfrage', 'offene Service-Anfragen'))
  }
  if (impact.ordersDone > 0) {
    lost.push(
      plural(impact.ordersDone, 'erledigte Service-Anfrage', 'erledigte Service-Anfragen') +
        (impact.ordersDoneCents > 0 ? ` (${formatCents(impact.ordersDoneCents)})` : ''),
    )
  }
  if (impact.transitions > 0) {
    lost.push(plural(impact.transitions, 'Eintrag im Zimmer-Verlauf', 'Einträge im Zimmer-Verlauf'))
  }
  if (impact.qrPosters > 0) {
    lost.push(`${plural(impact.qrPosters, 'QR-Code', 'QR-Codes')} — gedruckte Aushänge werden ungültig`)
  }

  if (lost.length === 0) {
    return (
      <p className="rounded-lg border border-positive-tint-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
        Noch nie benutzt — beim Löschen gehen keine Daten verloren.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-ink">Das wird endgültig mitgelöscht:</p>
      <ul className="list-disc pl-5 text-sm text-ink-soft">
        {lost.map(item => <li key={item}>{item}</li>)}
      </ul>
      {impact.cleaningLogs > 0 && (
        <p className="text-xs text-ink-muted">
          {plural(impact.cleaningLogs, 'Reinigungs-Stich bleibt', 'Reinigungs-Stiche bleiben')}{' '}
          <strong>erhalten</strong> — die Arbeitszeiten in der Auswertung verlieren nur den
          Zimmerbezug.
        </p>
      )}
    </div>
  )
}
