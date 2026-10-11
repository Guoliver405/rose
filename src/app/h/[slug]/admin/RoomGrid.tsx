'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Check, History, Loader2, Luggage, Printer, ReceiptText, Users, X,
} from 'lucide-react'
import RoomSymbol from '@/components/RoomSymbol'
import { dateKeyAfterNights } from '@/lib/board'
import { ROOM_BARS, ROOM_RINGS } from '@/lib/room-symbols'
import { formatCents } from '@/lib/money'
import type { StayBill } from '@/lib/stay-bill'
import {
  checkInAction, checkOutAction, markCleanedAction, setExpectedCheckoutAction, setPriorityAction,
} from './actions'
import { getRoomBillAction } from './bill-actions'
import { markOrderDoneAction } from './bestellungen/actions'
import { getRoomHistoryAction, type RoomHistoryEvent } from './history-actions'
import { format, plural } from '@/lib/i18n/format'
import type { AdminMessages } from '@/lib/i18n'
import Rich from '@/components/i18n/Rich'

type M = AdminMessages['overview']
type C = AdminMessages['common']

export type RoomTileData = {
  id: string
  number: string
  floor: number
  building: string | null
  /** Außer Betrieb — kein Check-in, keine Reinigung, nicht auf dem Maid-Board. */
  deactivated: boolean
  occupied: boolean
  /** Nur beim Verfahren `pin` gesetzt. */
  pin: string | null
  /** Zugangsverfahren DIESES Aufenthalts — nicht das aktuell eingestellte. */
  accessMode: 'pin' | 'link'
  checkedInAt: string | null
  /** Geplanter Abreisetag (`YYYY-MM-DD`), optional — beim Check-in oder später gesetzt. */
  expectedCheckout: string | null
  /** Abreisetag ist heute: keine Routine, Reinigung erst nach dem Check-out. */
  departureToday: boolean
  guestSignal: 'none' | 'please_clean' | 'dnd'
  /** „HH:MM" — Reinigung aufgeschoben (Wunsch des Gastes oder „bitte später" an der Tür), Zeit noch nicht erreicht. */
  cleanDeferredUntil: string | null
  /** An der Tür „heute nicht" — Routine für heute erledigt. */
  declinedToday: boolean
  checkoutPending: boolean
  priority: boolean
  cleaningActive: boolean
  stayoverDue: boolean
  openOrders: number
  urgentOrders: boolean
}

export type FloorGroup = {
  building: string | null
  floor: number
  rooms: RoomTileData[]
  /** Namen der aktuell auf dieser Etage eingebuchten Reinigungskräfte. */
  maids: string[]
}

/** Farb-Vorrang: priorisiert > ausgecheckt > Reinigungswunsch/Routine > DND > belegt > frei & bereit.
    Farbsprache: Violett = priorisiert, Rot(+Blinken) = dringender Service, Rosé = DND.
    Eine LAUFENDE Reinigung ändert den Balken bewusst NICHT (nur Spinner-Icon):
    die Grundfarbe bleibt stehen, bis der Abschluss den Status wirklich ändert. */
function tileBar(t: RoomTileData): string {
  if (t.deactivated) return ROOM_BARS.deactivated.className
  if (t.priority) return ROOM_BARS.priority.className
  if (t.checkoutPending) return ROOM_BARS.checkout.className
  if ((t.guestSignal === 'please_clean' && !t.cleanDeferredUntil) || t.stayoverDue) return ROOM_BARS.wanted.className
  if (t.guestSignal === 'dnd') return ROOM_BARS.dnd.className
  if (t.occupied) return ROOM_BARS.occupied.className
  // Alle Nicht-bereit-Fälle sind oben abgefangen: ein freies Zimmer ohne
  // checkout_pending/priority ist im event-getriebenen Modell gereinigt.
  return ROOM_BARS.ready.className
}

/** Punkt-Farbe der Verlaufs-Zeitleiste (eigene Sprache, nicht die der Kacheln). */
const HISTORY_DOT: Record<string, string> = {
  guest: 'bg-attention',
  clean: 'bg-positive',
  desk: 'bg-edge-strong',
  service: 'bg-action',
}

/** `YYYY-MM-DD` → „Sa., 07.09." — kurz genug für die Status-Zeile. */
function formatDateKey(key: string, intlLocale: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString(intlLocale, {
    weekday: 'short', day: '2-digit', month: '2-digit',
  })
}

/* ── Abreise wählen: Nächte, Datum oder offen ────────────────────────────
   a) und b) sind zwei Eingabeformen für denselben Wert (gespeichert wird nur
   das Datum); c) „offen" ist die Vorgabe, damit der Check-in ein Klick
   bleibt — die Routine fällt dann auf die Check-out-Frist zurück. Mit Datum
   gilt an den Tagen davor schon die Routine-Zeit (`isKnownStayover`). */

type DepartureChoice =
  | { kind: 'open' }
  | { kind: 'nights'; nights: number }
  | { kind: 'date'; value: string }

function departureKey(choice: DepartureChoice, tz: string): string | null {
  if (choice.kind === 'open') return null
  if (choice.kind === 'nights') return dateKeyAfterNights(new Date(), choice.nights, tz)
  return /^\d{4}-\d{2}-\d{2}$/.test(choice.value) ? choice.value : null
}

function choiceFromKey(key: string | null): DepartureChoice {
  return key ? { kind: 'date', value: key } : { kind: 'open' }
}

const chip = (active: boolean) =>
  `rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
    active
      ? 'border-action bg-action text-action-foreground'
      : 'border-edge bg-surface-elevated text-ink-soft hover:border-edge-strong'
  }`

function DepartureChooser({
  value, onChange, disabled, tz, m, intlLocale,
}: {
  value: DepartureChoice
  onChange: (c: DepartureChoice) => void
  disabled?: boolean
  tz: string
  m: M['departure']
  intlLocale: string
}) {
  const nights = [1, 2, 3]
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" disabled={disabled} className={chip(value.kind === 'open')} onClick={() => onChange({ kind: 'open' })}>
          {m.open}
        </button>
        {nights.map(n => (
          <button
            key={n} type="button" disabled={disabled}
            className={chip(value.kind === 'nights' && value.nights === n)}
            onClick={() => onChange({ kind: 'nights', nights: n })}
          >
            {plural(intlLocale, n, m.nights)}
          </button>
        ))}
        <button
          type="button" disabled={disabled} className={chip(value.kind === 'date')}
          onClick={() => onChange({ kind: 'date', value: value.kind === 'date' ? value.value : dateKeyAfterNights(new Date(), 1, tz) })}
        >
          {m.date}
        </button>
      </div>
      {value.kind === 'date' && (
        <input
          type="date" value={value.value} disabled={disabled}
          min={dateKeyAfterNights(new Date(), 0, tz)}
          onChange={e => onChange({ kind: 'date', value: e.target.value })}
          className="mt-2 rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-ink focus:border-action focus:outline-none"
        />
      )}
      {value.kind === 'nights' && (
        <p className="mt-1.5 text-xs text-ink-muted">{format(m.on, { date: formatDateKey(departureKey(value, tz)!, intlLocale) })}</p>
      )}
    </div>
  )
}

function historyTime(at: string, intlLocale: string): string {
  return new Date(at).toLocaleString(intlLocale, {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function statusLabel(t: RoomTileData, m: M['status'], intlLocale: string): string {
  if (t.deactivated) return m.deactivated
  const ready = !t.occupied && !t.checkoutPending && !t.priority && !t.cleaningActive
  const parts: string[] = []
  parts.push(t.occupied ? m.occupied : ready ? m.freeReady : m.free)
  if (t.occupied && t.departureToday) parts.push(m.departureToday)
  else if (t.occupied && t.expectedCheckout) parts.push(format(m.departureOn, { date: formatDateKey(t.expectedCheckout, intlLocale) }))
  if (t.priority) parts.push(m.priority)
  if (t.cleaningActive) parts.push(m.cleaning)
  if (t.checkoutPending) parts.push(m.checkoutPending)
  if (t.guestSignal === 'please_clean') {
    // Die Uhrzeit kann das „Frühestens ab" des Gastes oder „bitte später" an der Tür sein — der Verlauf sagt, was es war.
    parts.push(t.cleanDeferredUntil ? format(m.wantsCleanFrom, { time: t.cleanDeferredUntil }) : m.wantsClean)
  } else if (t.cleanDeferredUntil) {
    parts.push(format(m.deferredAtDoor, { time: t.cleanDeferredUntil }))
  }
  if (t.stayoverDue) parts.push(m.dailyDue)
  if (t.declinedToday) parts.push(m.declined)
  if (t.guestSignal === 'dnd') parts.push(m.dnd)
  if (t.openOrders > 0) {
    parts.push(t.urgentOrders ? m.urgentOrder : plural(intlLocale, t.openOrders, m.openOrders))
  }
  return parts.join(' · ')
}

export default function RoomGrid({
  hotelSlug, floorGroups, timeZone, m, common, intlLocale,
}: {
  hotelSlug: string
  floorGroups: FloorGroup[]
  /** Zeitzone des Hauses — „heute" für die Abreise-Chips. */
  timeZone: string
  m: M
  common: C
  intlLocale: string
}) {
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

  // Die Lotsen-Anker sitzen auf der ERSTEN Etage und deren erstem Zimmer —
  // sonst trügen alle Kacheln denselben Anker und der Coach Mark zeigte auf
  // ein beliebiges davon.
  const ersteEtage = floorGroups[0]
  const floorSection = (group: FloorGroup) => (
    <section
      key={`${group.building ?? ''}#${group.floor}`}
      data-lotse={group === ersteEtage ? 'uebersicht.etage' : undefined}
      className="rounded-xl border border-edge bg-surface px-4 py-2"
    >
      <h3 className="mb-1.5 flex items-center text-sm font-bold text-ink-soft">
        {format(m.grid.floor, { floor: group.floor })}
        <span className="ml-2 font-normal text-ink-muted">{plural(intlLocale, group.rooms.length, m.grid.roomCount)}</span>
        {group.maids.length > 0 && (
          <span
            className="ml-3 flex items-center gap-1 rounded-full bg-positive-pill px-2.5 py-0.5 text-xs font-semibold text-positive-deepest"
            title={m.grid.maidsOnFloor}
          >
            <Users className="h-3 w-3" /> {group.maids.join(', ')}
          </span>
        )}
      </h3>
      <div className="flex flex-wrap gap-2 pb-1">
        {group.rooms.map((room, i) => (
          <RoomTile
            key={room.id}
            room={room}
            m={m.status}
            intlLocale={intlLocale}
            anchor={group === ersteEtage && i === 0 ? 'uebersicht.kachel' : undefined}
            onClick={() => setSelectedId(room.id)}
          />
        ))}
      </div>
    </section>
  )

  return (
    <div className="flex flex-col gap-3">
      {hasNamedBuilding
        ? byBuilding.map(b => (
            <div key={b.name ?? ''} className="flex flex-col gap-2">
              {/* „Gebäudeteil" steht dabei, weil ein Gebäudeteil wie „Haus am
                  See" neben dem Hotelnamen in der Kopfzeile sonst wie ein
                  falsch zugeordnetes Haus gelesen wird (Rückmeldung 22.09.2026). */}
              <h2 className="mt-1 flex items-center gap-2 text-base font-black text-ink">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{m.grid.building}</span>
                {b.name ?? m.grid.unnamedBuilding}
                <span className="text-xs font-semibold text-ink-muted">
                  {plural(intlLocale, b.groups.reduce((n, g) => n + g.rooms.length, 0), m.grid.roomCount)}
                </span>
              </h2>
              {b.groups.map(floorSection)}
            </div>
          ))
        : floorGroups.map(floorSection)}

      {selected && (
        <RoomDialog tz={timeZone} key={selected.id} hotelSlug={hotelSlug} room={selected} onClose={() => setSelectedId(null)} m={m} common={common} intlLocale={intlLocale} />
      )}
    </div>
  )
}

function RoomTile({
  room, onClick, anchor, m, intlLocale,
}: {
  room: RoomTileData; onClick: () => void; anchor?: string; m: M['status']; intlLocale: string
}) {
  return (
    <button
      type="button"
      data-lotse={anchor}
      onClick={onClick}
      title={statusLabel(room, m, intlLocale)}
      className={`flex w-20 flex-col overflow-hidden rounded-lg border text-left shadow-sm hover:border-edge-strong ${
        // Nur ein Ring kann blinken: Rot (dringender Service) schlägt
        // Violett (Prio) — die Prio bleibt über Balken + Flagge sichtbar.
        room.deactivated
          ? 'border-dashed border-edge-strong bg-surface-muted opacity-60'
          : room.urgentOrders
            ? `${ROOM_RINGS.urgent.className} bg-surface-elevated`
            : room.priority
              ? `${ROOM_RINGS.priority.className} bg-surface-elevated`
              : 'border-edge bg-surface-elevated'
      }`}
    >
      <span className={`h-1.5 w-full ${tileBar(room)}`} />
      <span className="flex flex-col gap-1 px-2 py-1.5">
        {/* Service-Glocke rechts neben der Nummer — dort ist immer Platz,
            die Status-Zeile darunter bleibt den Reinigungs-Symbolen. */}
        <span className="flex items-center justify-between">
          <span className={`text-sm font-black ${room.occupied || room.checkoutPending || room.priority ? 'text-ink' : 'text-ink-muted'}`}>
            {room.number}
          </span>
          {room.openOrders > 0 && <RoomSymbol id={room.urgentOrders ? 'urgent' : 'orders'} />}
        </span>
        <span className="flex h-4 items-center gap-0.5">
          {room.deactivated && <RoomSymbol id="deactivated" />}
          {room.occupied && <RoomSymbol id="occupied" />}
          {room.occupied && room.departureToday && <RoomSymbol id="departure" />}
          {room.guestSignal === 'dnd' && <RoomSymbol id="dnd" />}
          {room.guestSignal === 'please_clean' && !room.cleanDeferredUntil && <RoomSymbol id="clean" />}
          {room.cleanDeferredUntil && <RoomSymbol id="deferred" />}
          {room.declinedToday && <RoomSymbol id="declined" />}
          {room.stayoverDue && <RoomSymbol id="routine" />}
          {room.checkoutPending && <RoomSymbol id="checkout" />}
          {room.priority && <RoomSymbol id="priority" />}
          {room.cleaningActive && <RoomSymbol id="cleaning" />}
        </span>
      </span>
    </button>
  )
}

function RoomDialog({
  hotelSlug, room, onClose, tz, m, common, intlLocale,
}: {
  hotelSlug: string; room: RoomTileData; onClose: () => void; tz: string; m: M; common: C; intlLocale: string
}) {
  const d = m.dialog
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string[] | null>(null)
  const [freshPin, setFreshPin] = useState<string | null>(null)
  const [freshMode, setFreshMode] = useState<'pin' | 'link' | null>(null)
  const [confirmCheckout, setConfirmCheckout] = useState(false)
  // Abreise: beim Check-in Vorgabe „offen"; bei belegtem Zimmer der gespeicherte Stand.
  const [departure, setDeparture] = useState<DepartureChoice>(() => choiceFromKey(room.expectedCheckout))
  const departureDirty = room.occupied && departureKey(departure, tz) !== room.expectedCheckout

  // Verlauf beim Öffnen nachladen; `alive` verhindert setState nach dem
  // Schließen. `pending` triggert den Reload, damit eine gerade ausgelöste
  // Aktion (Check-in, Priorisieren …) sofort in der Zeitleiste steht.
  const [history, setHistory] = useState<RoomHistoryEvent[] | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    if (pending) return
    getRoomHistoryAction(hotelSlug, room.id).then(res => {
      if (!alive) return
      if (res.error) setHistoryError(res.error)
      else { setHistory(res.events ?? []); setHistoryError(null) }
    })
    return () => { alive = false }
  }, [hotelSlug, room.id, pending])

  // Aufstellung der Zusatzleistungen — gleiche Nachladen-Mechanik wie der
  // Verlauf, aber nur für belegte Zimmer: Ohne Aufenthalt gibt es nichts zu
  // kassieren.
  const [bill, setBill] = useState<StayBill | null>(null)
  const [stayId, setStayId] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    if (pending || !room.occupied) return
    getRoomBillAction(hotelSlug, room.id).then(res => {
      if (!alive || res.error) return
      setBill(res.bill ?? null)
      setStayId(res.stayId ?? null)
    })
    return () => { alive = false }
  }, [hotelSlug, room.id, room.occupied, pending])

  /** Nach dem Check-out: Das Zimmer ist frei, der Betrag muss trotzdem stehen bleiben. */
  const [checkedOut, setCheckedOut] = useState<{ stayId: string; bill: StayBill | null } | null>(null)

  const needsCleaning = room.checkoutPending || room.priority || room.guestSignal === 'please_clean' || room.stayoverDue

  function runCheckIn(force: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await checkInAction(hotelSlug, room.id, force, departureKey(departure, tz))
      if (res.error) { setError(res.error); setWarning(null); return }
      if (res.warning) { setWarning(res.warning.reasons); return }
      setWarning(null)
      setFreshPin(res.pin ?? null)
      // Das Verfahren kommt vom Check-in zurück: Die Zimmer-Daten der Seite
      // sind bis zum nächsten Rendern noch die von vor dem Check-in.
      setFreshMode(res.accessMode ?? null)
    })
  }

  function runCheckOut() {
    setError(null)
    startTransition(async () => {
      const res = await checkOutAction(hotelSlug, room.id)
      if (res.error) { setError(res.error); return }
      // Nicht schließen: Offene Anfragen sind eben als „nicht erbracht"
      // geschlossen worden, und die Summe soll noch am Bildschirm stehen.
      // Der Stand von vor dem Klick ist der richtige — die Aufstellung selbst
      // liegt hinter dem Link.
      if (res.stayId) setCheckedOut({ stayId: res.stayId, bill })
      else onClose()
    })
  }

  /** Offene Anfrage direkt aus dem Check-out heraus abhaken. */
  function runOrderDone(orderId: string) {
    setError(null)
    startTransition(async () => {
      const res = await markOrderDoneAction(hotelSlug, orderId)
      if (res.error) { setError(res.error); return }
      const fresh = await getRoomBillAction(hotelSlug, room.id)
      if (!fresh.error) setBill(fresh.bill ?? null)
    })
  }

  function runSaveDeparture() {
    setError(null)
    startTransition(async () => {
      const res = await setExpectedCheckoutAction(hotelSlug, room.id, departureKey(departure, tz))
      if (res.error) setError(res.error)
    })
  }

  function runPriority(value: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await setPriorityAction(hotelSlug, room.id, value)
      if (res.error) setError(res.error)
    })
  }

  function runMarkCleaned() {
    setError(null)
    startTransition(async () => {
      const res = await markCleanedAction(hotelSlug, room.id)
      if (res.error) setError(res.error)
    })
  }

  const checkedInLabel = room.checkedInAt
    ? new Date(room.checkedInAt).toLocaleString(intlLocale, {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : null

  // ── Nach dem Check-out ───────────────────────────────────────────────────
  // Eigener Bildschirm statt des üblichen Dialogs: Das Zimmer ist jetzt frei,
  // der reguläre Inhalt böte „Check-in" an — während am Tresen noch der Betrag
  // gebraucht wird.
  if (checkedOut) {
    const done = checkedOut.bill
    const c = m.checkedOut
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-2xl border border-edge bg-surface-elevated p-5 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-xl font-black text-ink">{format(c.title, { number: room.number })}</h3>
          <p className="mt-1 text-sm text-ink-muted">{c.accessEnded}</p>

          {done && done.totalCents > 0 ? (
            <div className="mt-4 rounded-xl border-2 border-attention bg-attention-tint p-4 text-center">
              <p className="text-xs font-black uppercase tracking-wider text-attention-deepest">
                {c.toCollect}
              </p>
              <p className="mt-1 text-4xl font-black text-attention-deepest">
                {formatCents(done.totalCents)}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-sm font-semibold text-ink-soft">
              {c.nothingToCollect}
            </p>
          )}

          {done && done.openMaintenanceCount > 0 && (
            <p className="mt-3 rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-xs text-attention-deepest">
              {plural(intlLocale, done.openMaintenanceCount, c.maintenanceStillOpen)}
            </p>
          )}
          {done && done.openFreeCount > 0 && (
            <p className="mt-3 rounded-lg border border-edge bg-surface-sunken px-3 py-2 text-xs text-ink-soft">
              {plural(intlLocale, done.openFreeCount, c.freeClosed)}
            </p>
          )}
          {done && done.openCount > 0 && (
            <p className="mt-3 rounded-lg border border-edge bg-surface-sunken px-3 py-2 text-xs text-ink-soft">
              {plural(intlLocale, done.openCount, c.openClosed)}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {done?.hasPositions && (
              <Link
                href={`/h/${hotelSlug}/admin/aufstellung/${checkedOut.stayId}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-action px-4 py-3 font-bold text-action-foreground hover:bg-action-strong"
              >
                <ReceiptText className="h-4 w-4" /> {c.printBill}
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-edge px-4 py-3 font-semibold text-ink-soft hover:bg-surface-muted"
            >
              {common.close}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-edge bg-surface-elevated p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-black text-ink">{format(d.title, { number: room.number })}</h3>
            <p className="text-xs text-ink-muted">
              {room.building
                ? format(d.locationInBuilding, { building: room.building, floor: room.floor })
                : format(d.location, { floor: room.floor })}
            </p>
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

        <p className="mb-4 text-sm font-semibold text-ink-soft">{statusLabel(room, m.status, intlLocale)}</p>

        {/* Gast-Zugang nach frischem Check-in ODER für belegtes Zimmer.
            Was hier steht, hängt am Verfahren DIESES Aufenthalts: beim
            PIN-Verfahren die PIN zum Vorlesen, beim individuellen Verfahren
            der Hinweis auf das auszuhändigende Handout — dort steckt der
            QR-Code, der hier nichts nützt. */}
        {(freshMode || (room.occupied && (room.pin || room.accessMode === 'link'))) && (
          <div className="mb-4 rounded-xl border border-action-tint-edge bg-action-tint p-4 text-center">
            {(freshMode ?? room.accessMode) === 'link' ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-action-deep">
                  {freshMode ? d.link.headingFresh : d.link.heading}
                </p>
                <p className="mt-2 text-sm font-bold text-action-deep">
                  {d.link.lead}
                </p>
                <p className="mt-1 text-xs text-action-deep">
                  {d.link.hint}
                  {checkedInLabel && !freshMode ? ` ${format(d.checkedInAt, { date: checkedInLabel })}` : ''}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-action-deep">
                  {freshMode ? d.pin.headingFresh : d.pin.heading}
                </p>
                <p className="mt-1 font-mono text-4xl font-black tracking-[0.3em] text-action-deep">
                  {freshPin ?? room.pin}
                </p>
                <p className="mt-2 text-xs text-action-deep">
                  {d.pin.hint}
                  {checkedInLabel && !freshMode ? ` ${format(d.checkedInAt, { date: checkedInLabel })}` : ''}
                </p>
              </>
            )}
            <Link
              href={`/h/${hotelSlug}/admin/handout/${room.id}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-action-tint-edge px-3 py-1.5 text-sm font-bold text-action-deep hover:bg-surface"
            >
              <Printer className="h-4 w-4" />
              {(freshMode ?? room.accessMode) === 'link'
                ? d.link.print
                : d.pin.print}
            </Link>
          </div>
        )}

        {/* Warnung vor Check-in auf ungereinigtes Zimmer */}
        {warning && (
          <div className="mb-4 rounded-xl border border-attention-tint-edge bg-attention-tint p-4">
            <p className="flex items-center gap-2 font-bold text-attention-deepest">
              <AlertTriangle className="h-4 w-4" /> {d.warningTitle}
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
                {d.forceCheckIn}
              </button>
              <button
                type="button"
                onClick={() => setWarning(null)}
                className="rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft"
              >
                {common.cancel}
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
          {/* Außer Betrieb: keine Tagesgeschäft-Aktionen. Zurückholen geht
              bewusst nur im Zimmer-Setup, nicht nebenbei aus der Übersicht. */}
          {room.deactivated && (
            <p className="rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-sm text-ink-soft">
              <Rich text={d.deactivated} tags={{ b: c => <span className="font-semibold">{c}</span> }} />
            </p>
          )}

          {/* Check-in / Check-out */}
          {!room.deactivated && !room.occupied && !freshPin && !warning && (
            <>
              <div className="rounded-xl border border-edge bg-surface-sunken p-3">
                <p className="mb-2 text-xs font-semibold text-ink-muted">{d.departureOptional}</p>
                <DepartureChooser value={departure} onChange={setDeparture} disabled={pending} tz={tz} m={m.departure} intlLocale={intlLocale} />
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => runCheckIn(false)}
                className="rounded-xl bg-action px-4 py-3 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? d.checkingIn : d.checkIn}
              </button>
            </>
          )}

          {/* Abreise eines laufenden Aufenthalts — nachtragen oder verlängern.
              Am Abreisetag setzt die Routine-Reinigung aus. */}
          {room.occupied && !freshMode && (
            <div className="rounded-xl border border-edge bg-surface-sunken p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                <Luggage className="h-3.5 w-3.5" />
                {room.departureToday
                  ? d.departureToday
                  : room.expectedCheckout
                    ? format(m.departure.on, { date: formatDateKey(room.expectedCheckout, intlLocale) })
                    : d.departureOpen}
              </p>
              <DepartureChooser value={departure} onChange={setDeparture} disabled={pending} tz={tz} m={m.departure} intlLocale={intlLocale} />
              {departureDirty && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={runSaveDeparture}
                  className="mt-2 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
                >
                  {pending ? common.saving : d.saveDeparture}
                </button>
              )}
            </div>
          )}

          {/* Zusatzleistungen — steht VOR dem Check-out-Knopf und ist deutlich
              hervorgehoben: Nach dem Klick ist der Gast weg, und die Frage
              „muss noch kassiert werden?" beantwortet sich nicht mehr von
              selbst. Wartung und alles ohne Preis stehen hier bewusst nicht —
              es gäbe nichts zu prüfen. */}
          {room.occupied && bill?.hasPositions && (
            <div className="rounded-xl border-2 border-attention bg-attention-tint p-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-attention-deepest">
                  <ReceiptText className="h-3.5 w-3.5" /> {d.bill.toCollect}
                </p>
                <p className="text-2xl font-black tabular-nums text-attention-deepest">
                  {formatCents(bill.totalCents)}
                </p>
              </div>

              {bill.openCount > 0 && (
                <div className="mt-2 border-t border-attention-tint-edge pt-2">
                  <p className="text-xs font-semibold text-attention-deepest">
                    {d.bill.openHint}
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {bill.positions.filter(p => p.status === 'open').map(p => (
                      <li key={p.id} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-attention-deepest">
                          {p.serviceName}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-attention-deepest">
                          {formatCents(p.totalCents)}
                        </span>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runOrderDone(p.id)}
                          className="flex items-center gap-1 rounded-lg bg-attention px-2 py-1 text-xs font-bold text-attention-foreground disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" /> {d.bill.markDone}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {stayId && (
                <Link
                  href={`/h/${hotelSlug}/admin/aufstellung/${stayId}`}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-attention-tint-edge px-3 py-1.5 text-sm font-bold text-attention-deepest hover:bg-surface"
                >
                  <Printer className="h-4 w-4" /> {d.bill.details}
                </Link>
              )}
            </div>
          )}
          {room.occupied && bill && !bill.hasPositions && (
            <p className="rounded-xl border border-edge bg-surface-sunken px-3 py-2 text-xs text-ink-soft">
              {d.bill.noPaidExtras}
              {bill.openFreeCount > 0 && (
                <>
                  {' '}{plural(intlLocale, bill.openFreeCount, d.bill.freeStillOpen)}
                </>
              )}
              {bill.openMaintenanceCount > 0 && (
                <>
                  {' '}{plural(intlLocale, bill.openMaintenanceCount, d.bill.maintenanceStaysOpen)}
                </>
              )}
            </p>
          )}

          {room.occupied && !confirmCheckout && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmCheckout(true)}
              className="rounded-xl border border-edge-strong px-4 py-3 font-bold text-ink hover:bg-surface-muted disabled:opacity-50"
            >
              {d.checkOut}
            </button>
          )}
          {room.occupied && confirmCheckout && (
            <div className="rounded-xl border border-edge bg-surface-sunken p-3">
              <p className="text-sm font-semibold text-ink">
                {d.confirmCheckOut}
              </p>
              {bill?.hasPositions && bill.totalCents > 0 && (
                <p className="mt-2 text-sm font-bold text-attention-strong">
                  {format(d.toCollectAmount, { amount: formatCents(bill.totalCents) })}
                </p>
              )}
              {bill && bill.openCount > 0 && (
                <p className="mt-1 text-xs font-semibold text-ink-soft">
                  {plural(intlLocale, bill.openCount, d.openWillClose, { amount: formatCents(bill.openCents) })}
                </p>
              )}
              {bill && bill.openFreeCount > 0 && (
                <p className="mt-1 text-xs font-semibold text-ink-soft">
                  {plural(intlLocale, bill.openFreeCount, d.freeWillClose)}
                </p>
              )}
              {bill && bill.openMaintenanceCount > 0 && (
                <p className="mt-1 text-xs font-semibold text-ink-soft">
                  {plural(intlLocale, bill.openMaintenanceCount, d.maintenanceRemains)}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={runCheckOut}
                  className="rounded-lg bg-action px-3 py-2 text-sm font-bold text-action-foreground disabled:opacity-50"
                >
                  {pending ? d.checkingOut : d.yesCheckOut}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCheckout(false)}
                  className="rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft"
                >
                  {common.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Priorisierte Reinigung */}
          {!room.deactivated && (
            <button
              type="button"
              disabled={pending}
              onClick={() => runPriority(!room.priority)}
              className={`rounded-xl px-4 py-3 font-bold disabled:opacity-50 ${
                room.priority
                  ? 'bg-accent text-accent-foreground hover:bg-accent-strong'
                  : 'border border-accent-pill-edge bg-accent-tint text-accent-strong hover:bg-accent-pill'
              }`}
            >
              {pending ? d.pleaseWait : room.priority ? d.removePriority : d.setPriority}
            </button>
          )}

          {/* Status-Korrektur */}
          {!room.deactivated && needsCleaning && (
            <button
              type="button"
              disabled={pending}
              onClick={runMarkCleaned}
              className="rounded-xl border border-positive-pill-edge bg-positive-tint px-4 py-3 font-bold text-positive-deep hover:bg-positive-pill disabled:opacity-50"
            >
              {pending ? d.pleaseWait : d.markCleaned}
            </button>
          )}
        </div>

        {/* Verlauf — Arbeitsnachweis & Beschwerde-Aufklärung */}
        <section className="mt-5 border-t border-edge pt-4">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
            <History className="h-4 w-4" /> {d.history.title}
            <span className="font-normal text-ink-muted">{d.history.range}</span>
          </h4>

          {historyError ? (
            <p className="mt-2 text-sm font-semibold text-critical-strong">{historyError}</p>
          ) : history === null ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> {d.history.loading}
            </p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">{d.history.empty}</p>
          ) : (
            <ol className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {history.map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${HISTORY_DOT[e.tone]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{e.label}</span>
                    <span className="block text-xs text-ink-muted">
                      {historyTime(e.at, intlLocale)} · {e.actor}
                      {e.stayId && (
                        <>
                          {' · '}
                          <Link
                            href={`/h/${hotelSlug}/admin/aufstellung/${e.stayId}`}
                            className="font-semibold text-action underline hover:text-action-strong"
                          >
                            {d.history.bill}
                          </Link>
                        </>
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
