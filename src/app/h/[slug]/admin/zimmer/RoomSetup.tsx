'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  BedDouble, Building2, Layers, Pencil, PowerOff, RotateCcw, SlidersHorizontal, Trash2, X,
} from 'lucide-react'
import { formatMinor } from '@/lib/money'
import { format, plural } from '@/lib/i18n/format'
import type { AdminMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'
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

type M = AdminMessages['rooms']
type Common = AdminMessages['common']

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

export default function RoomSetup({
  hotelSlug, rooms, m, common, intlLocale,
}: {
  hotelSlug: string
  rooms: SetupRoom[]
  m: M
  common: Common
  intlLocale: string
}) {
  const c = m.create
  const l = m.list
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
    if (planned.length === 0) { setError(c.errors.invalidFloors); return }
    startTransition(async () => {
      const res = await createRoomsAction(hotelSlug, building || null, planned)
      if (res.error) { setError(res.error); return }
      setMessage(
        res.skipped
          ? plural(intlLocale, res.created ?? 0, c.createdSkipped, { skipped: res.skipped })
          : plural(intlLocale, res.created ?? 0, c.created),
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
      g.rooms.sort((a, b) => a.number.localeCompare(b.number, intlLocale, { numeric: true }))
    }
    const sortedFloors = [...floors.values()].sort((a, b) => {
      const ba = a.building ?? ''
      const bb = b.building ?? ''
      if (ba !== bb) return ba.localeCompare(bb, intlLocale)
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
  }, [rooms, intlLocale])

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
        data-lotse="zimmer.anlegen"
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl border border-edge bg-surface p-4"
      >
        <h2 className="font-bold text-ink">{c.heading}</h2>

        {/* Modus-Switch */}
        <div data-lotse="zimmer.modus" className="flex w-fit rounded-lg border border-edge p-0.5" role="radiogroup" aria-label={c.modeAria}>
          {([
            ['individual', c.modeIndividual],
            ['identical', c.modeIdentical],
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
            ? c.modeIndividualHint
            : c.modeIdenticalHint}
        </p>

        <div data-lotse="zimmer.bereich" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-ink-soft">{c.buildingLabel}</span>
            <input
              type="text"
              value={building}
              onChange={e => setBuilding(e.target.value)}
              placeholder={c.buildingPlaceholder}
              className={inputClass}
            />
          </label>
          {mode === 'individual' ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-soft">{c.floorLabel}</span>
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
                {c.floorsLabel}
              </span>
              <input
                type="text"
                required
                value={floorsInput}
                onChange={e => setFloorsInput(e.target.value)}
                placeholder={c.floorsPlaceholder}
                className={`${inputClass} font-mono`}
              />
            </label>
          )}
        </div>

        <label data-lotse="zimmer.nummern" className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-soft">
            {mode === 'individual'
              ? c.numbersLabelIndividual
              : c.numbersLabelIdentical}
          </span>
          <input
            type="text"
            required
            value={numbersInput}
            onChange={e => setNumbersInput(e.target.value)}
            placeholder={mode === 'individual' ? c.numbersPlaceholderIndividual : c.numbersPlaceholderIdentical}
            className={`${inputClass} font-mono`}
          />
        </label>

        <label data-lotse="zimmer.praefix" className="flex w-fit cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={prefixFloor}
            onChange={e => setPrefixFloor(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-action-bar)]"
          />
          <span className="text-sm font-semibold text-ink-soft">
            {c.prefixFloor}
          </span>
        </label>

        {collisionWarning && (
          <p className="rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-sm font-semibold text-attention-deepest">
            {c.collisionWarning}
          </p>
        )}

        {plannedFlat.length > 0 && (
          <p className="text-xs text-ink-muted">
            {plural(intlLocale, plannedFlat.length, c.planned, {
              list: plannedFlat.length > 12
                ? format(c.plannedMore, { list: plannedFlat.slice(0, 12).join(', '), more: plannedFlat.length - 12 })
                : plannedFlat.join(', '),
            })}
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
          data-lotse="zimmer.absenden"
          type="submit"
          disabled={pending || plannedFlat.length === 0}
          className="self-start rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? c.submitting : c.submit}
        </button>
      </form>

      {/* Bestand */}
      {rooms.length === 0 ? (
        <p data-lotse="zimmer.bestand" className="text-sm text-ink-muted">{l.empty}</p>
      ) : (
        <div data-lotse="zimmer.bestand" className="flex flex-col gap-3">
          <p className="text-xs text-ink-muted">
            <Rich
              text={l.intro}
              tags={{ b: t => <strong className="font-semibold text-ink-soft">{t}</strong> }}
            />
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
                    title: b.name ?? l.noBuilding,
                    subtitle: plural(intlLocale, b.floors.length, l.buildingSubtitle, { rooms: b.rooms.length }),
                    rooms: b.rooms,
                  })}
                  className="flex items-center gap-2 rounded-lg px-1 py-1 text-left text-sm font-black text-ink hover:bg-surface-muted"
                >
                  <Building2 className="h-4 w-4 text-ink-muted" />
                  {b.name ?? l.noBuilding}
                  <span className="font-normal text-ink-muted">{plural(intlLocale, b.rooms.length, l.roomCount)}</span>
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
                        title: format(l.floor, { floor: group.floor }),
                        subtitle: `${group.building ? `${group.building}${l.separator}` : ''}${plural(intlLocale, group.rooms.length, l.roomCount)}`,
                        rooms: group.rooms,
                      })}
                      className="mb-2 flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left text-sm font-bold text-ink-soft hover:bg-surface-muted"
                    >
                      <Layers className="h-4 w-4 text-ink-muted" />
                      {format(l.floor, { floor: group.floor })}
                      <span className="font-normal text-ink-muted">
                        {plural(intlLocale, group.rooms.length, l.roomCount)}
                        {deactivated > 0 && `${l.separator}${format(l.deactivatedCount, { count: deactivated })}`}
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
                            title: format(l.room, { number: room.number }),
                            subtitle: `${room.building ? `${room.building}${l.separator}` : ''}${format(l.floor, { floor: room.floor })}`,
                            rooms: [room],
                          })}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold hover:border-edge-strong ${
                            room.deactivated
                              ? 'border-dashed border-edge-strong bg-surface-muted text-ink-muted'
                              : 'border-edge bg-surface-elevated text-ink'
                          }`}
                          title={room.deactivated ? l.deactivatedTitle : undefined}
                        >
                          {room.number}
                          {room.occupied && (
                            <BedDouble className="h-3.5 w-3.5 text-active-strong" aria-label={l.occupiedAria} />
                          )}
                          {room.deactivated && (
                            <PowerOff className="h-3.5 w-3.5" aria-label={l.deactivatedAria} />
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
          m={m}
          common={common}
          intlLocale={intlLocale}
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
  hotelSlug, target, onClose, onDone, m, common, intlLocale,
}: {
  hotelSlug: string
  target: DialogTarget
  m: M
  common: Common
  intlLocale: string
  onClose: () => void
  onDone: (message: string) => void
}) {
  const { scope, title, subtitle, rooms } = target
  const d = m.dialog
  const l = m.list
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
      const changed = res.changed ?? 0
      onDone(
        next
          ? plural(intlLocale, changed, d.reactivated)
          : res.skippedOccupied
            ? plural(intlLocale, changed, d.deactivatedSkipped, { skipped: res.skippedOccupied })
            : plural(intlLocale, changed, d.deactivated),
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
      if (!Number.isInteger(parsed)) { setError(d.errors.invalidFloor); return }
      patch.floor = parsed
    }
    patch.building = editBuilding.trim() || null

    startTransition(async () => {
      const res = await editScopeAction(hotelSlug, scope, patch)
      if (res.error) { setError(res.error); return }
      onDone(
        res.changed === 0
          ? d.noChange
          : plural(intlLocale, res.changed ?? 0, d.edited),
      )
    })
  }

  function runDelete() {
    setError(null)
    startTransition(async () => {
      const res = await deleteScopeAction(hotelSlug, scope, confirmInput)
      if (res.error) { setError(res.error); return }
      onDone(plural(intlLocale, res.deleted ?? 0, d.deleted, { label: res.label ?? '' }))
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
            aria-label={common.close}
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
              {plural(intlLocale, rooms.length, l.roomCount)}
              {occupied > 0 && `${l.separator}${format(l.occupiedCount, { count: occupied })}`}
              {deactivated > 0 && `${l.separator}${format(l.deactivatedCount, { count: deactivated })}`}
            </p>

            <button
              type="button"
              onClick={() => { setError(null); setView('edit') }}
              className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3 text-left hover:border-edge-strong"
            >
              <Pencil className="h-5 w-5 shrink-0 text-ink-soft" />
              <span>
                <span className="block text-sm font-bold text-ink">{common.edit}</span>
                <span className="block text-xs text-ink-muted">
                  {scope.kind === 'room'
                    ? d.editHintRoom
                    : scope.kind === 'floor'
                      ? d.editHintFloor
                      : d.editHintBuilding}
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
                  <span className="block text-sm font-bold text-ink">{d.deactivate}</span>
                  <span className="block text-xs text-ink-muted">
                    {d.deactivateHint}
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
                  <span className="block text-sm font-bold text-ink">{d.reactivate}</span>
                  <span className="block text-xs text-ink-muted">
                    {plural(intlLocale, deactivated, d.reactivateHint)}
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
                <span className="block text-sm font-bold text-critical-strong">{d.deleteForever}</span>
                <span className="block text-xs text-critical-strong">
                  {d.deleteHint}
                </span>
              </span>
            </button>
          </div>
        )}

        {view === 'edit' && (
          <form onSubmit={runEdit} className="flex flex-col gap-3">
            {scope.kind === 'room' && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink-soft">{d.roomNumber}</span>
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
                <span className="text-sm font-semibold text-ink-soft">{d.floor}</span>
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
              <span className="text-sm font-semibold text-ink-soft">{d.buildingOrNone}</span>
              <input
                type="text"
                value={editBuilding}
                onChange={e => setEditBuilding(e.target.value)}
                placeholder={d.buildingPlaceholder}
                className={inputClass}
              />
            </label>

            {scope.kind !== 'room' && (
              <p className="text-xs text-ink-muted">
                {plural(intlLocale, rooms.length, d.appliesToAll)}
              </p>
            )}

            {(numberChanged || buildingChanged) && (
              <p className="rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-xs font-semibold text-attention-deepest">
                <Rich text={d.reprintWarning} />
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? common.saving : common.save}
              </button>
              <button
                type="button"
                onClick={() => { setError(null); setView('menu') }}
                className="rounded-lg border border-edge px-4 py-2.5 font-semibold text-ink-soft hover:text-ink"
              >
                {common.back}
              </button>
            </div>
          </form>
        )}

        {view === 'delete' && (
          <div className="flex flex-col gap-3">
            {!impact && !error && <p className="text-sm text-ink-muted">{d.checkingImpact}</p>}

            {impact && (
              <>
                <ImpactList impact={impact} m={m.impact} intlLocale={intlLocale} />

                {impact.occupied > 0 ? (
                  <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
                    {plural(intlLocale, impact.occupied, d.occupiedBlocks)}
                  </p>
                ) : (
                  <>
                    {impact.requiresPhrase && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-ink-soft">
                          {format(d.confirmLabel, { phrase: impact.confirmPhrase })}
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
                      {pending ? d.deleting : d.deleteForever}
                    </button>
                    {impact.requiresPhrase && (
                      <button
                        type="button"
                        onClick={() => runActive(false)}
                        disabled={pending}
                        className="rounded-lg border border-edge px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
                      >
                        {d.deactivateInstead}
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
              {common.back}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Was das Löschen kostet, in Zahlen statt in Warnsätzen. */
function ImpactList({ impact, m, intlLocale }: { impact: DeletionImpact; m: M['impact']; intlLocale: string }) {
  const lost: string[] = []
  if (impact.rooms > 1) lost.push(plural(intlLocale, impact.rooms, m.rooms))
  if (impact.stays > 0) lost.push(plural(intlLocale, impact.stays, m.stays))
  if (impact.ordersOpen > 0) lost.push(plural(intlLocale, impact.ordersOpen, m.ordersOpen))
  if (impact.ordersDone > 0) {
    lost.push(
      impact.ordersDoneAmounts.length > 0
        ? plural(intlLocale, impact.ordersDone, m.ordersDoneAmount, {
            amount: impact.ordersDoneAmounts.map(a => formatMinor(a.amount, a.currency, intlLocale)).join(' + '),
          })
        : plural(intlLocale, impact.ordersDone, m.ordersDone),
    )
  }
  if (impact.transitions > 0) lost.push(plural(intlLocale, impact.transitions, m.transitions))
  if (impact.qrPosters > 0) lost.push(plural(intlLocale, impact.qrPosters, m.qrPosters))

  if (lost.length === 0) {
    return (
      <p className="rounded-lg border border-positive-tint-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
        {m.neverUsed}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-ink">{m.willBeDeleted}</p>
      <ul className="list-disc pl-5 text-sm text-ink-soft">
        {lost.map(item => <li key={item}>{item}</li>)}
      </ul>
      {impact.cleaningLogs > 0 && (
        <p className="text-xs text-ink-muted">
          <Rich text={plural(intlLocale, impact.cleaningLogs, m.cleaningLogsKept)} />
        </p>
      )}
    </div>
  )
}
