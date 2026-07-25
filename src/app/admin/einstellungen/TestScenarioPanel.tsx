'use client'

// VORÜBERGEHEND — UI zum Test-Szenario-Seeding, siehe test-actions.ts.

import { useState, useTransition } from 'react'
import { FlaskConical, Loader2, Trash2 } from 'lucide-react'
import { resetTestScenarioAction, seedTestScenarioAction, type SeedSummary } from './test-actions'

const SIGNAL_LABEL = { none: '—', please_clean: 'Reinigung gewünscht', dnd: 'Nicht stören' } as const

export default function TestScenarioPanel({ roomCount }: { roomCount: number }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SeedSummary | null>(null)
  const [resetDone, setResetDone] = useState(false)

  // Praxisnahe Defaults aus der Zimmerzahl abgeleitet.
  const defOccupied = Math.max(1, Math.round(roomCount * 0.4))
  const defCheckedOut = Math.min(roomCount - defOccupied, Math.max(1, Math.round(roomCount * 0.25)))

  function submitSeed(form: HTMLFormElement) {
    if (!window.confirm('Achtung: Alle aktuellen Aufenthalte werden ausgecheckt und alle Zimmerstatus zurückgesetzt, bevor das Szenario aufgebaut wird. Fortfahren?')) return
    const fd = new FormData(form)
    const num = (name: string) => Number(fd.get(name) ?? 0)
    setError(null); setSummary(null); setResetDone(false)
    startTransition(async () => {
      const res = await seedTestScenarioAction({
        occupied: num('occupied'),
        pleaseClean: num('pleaseClean'),
        dnd: num('dnd'),
        checkedOut: num('checkedOut'),
        priority: num('priority'),
        orders: num('orders'),
      })
      if (res.error) { setError(res.error); return }
      setSummary(res.summary ?? null)
    })
  }

  function submitReset() {
    if (!window.confirm('Alle aktiven Aufenthalte auschecken, Zimmerstatus neutralisieren und offene Bestellungen löschen?')) return
    setError(null); setSummary(null); setResetDone(false)
    startTransition(async () => {
      const res = await resetTestScenarioAction()
      if (res.error) { setError(res.error); return }
      setResetDone(true)
    })
  }

  const inputClass =
    'w-20 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none'

  const fields = [
    { name: 'occupied', label: 'Belegte Zimmer', def: defOccupied },
    { name: 'pleaseClean', label: 'davon Reinigungswunsch', def: Math.ceil(defOccupied / 3) },
    { name: 'dnd', label: 'davon „Nicht stören“', def: defOccupied >= 3 ? 1 : 0 },
    { name: 'checkedOut', label: 'Ausgecheckt (ungereinigt)', def: defCheckedOut },
    { name: 'priority', label: 'Priorisiert', def: 1 },
    { name: 'orders', label: 'Offene Bestellungen', def: Math.min(2, defOccupied) },
  ]

  return (
    <form
      onSubmit={e => { e.preventDefault(); submitSeed(e.currentTarget) }}
      className="flex flex-col gap-4 rounded-xl border border-attention-tint-edge bg-attention-tint p-4"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-attention-deepest">
        <FlaskConical className="h-4 w-4" /> Test-Szenario (vorübergehend)
      </h2>
      <p className="text-xs text-ink-muted">
        Erzeugt eine fingierte Belegungs- und Reinigungslage zum Durchspielen der Portale —
        mit echten Aufenthalten (PINs funktionieren im Gastportal), verteilt über die Etagen.
        Vorher wird der aktuelle Stand komplett zurückgesetzt.
      </p>

      <div className="flex flex-wrap gap-4">
        {fields.map(f => (
          <label key={f.name} className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            {f.label}
            <input name={f.name} type="number" min={0} max={roomCount} defaultValue={f.def} className={inputClass} />
          </label>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
      {resetDone && !error && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          Alles zurückgesetzt — keine aktiven Aufenthalte, keine offenen Wünsche oder Bestellungen mehr.
        </p>
      )}

      {summary && !error && (
        <div className="flex flex-col gap-2 rounded-lg border border-edge bg-surface p-3 text-sm text-ink">
          <p className="font-bold">Szenario steht:</p>
          {summary.stays.length > 0 && (
            <table className="w-fit text-left text-xs">
              <thead>
                <tr className="text-ink-muted">
                  <th className="pr-4 font-semibold">Zimmer</th>
                  <th className="pr-4 font-semibold">Gast-PIN</th>
                  <th className="pr-4 font-semibold">Signal</th>
                  <th className="font-semibold">seit</th>
                </tr>
              </thead>
              <tbody>
                {summary.stays.map(s => (
                  <tr key={s.room}>
                    <td className="pr-4 font-bold">{s.room}</td>
                    <td className="pr-4 font-mono">{s.pin}</td>
                    <td className="pr-4">{SIGNAL_LABEL[s.signal]}</td>
                    <td>{s.sinceYesterday ? 'gestern' : 'heute'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-ink-muted">
            Ausgecheckt: {summary.checkedOut.length > 0 ? summary.checkedOut.join(', ') : 'keine'} ·
            Priorisiert: {summary.priority.length > 0 ? summary.priority.join(', ') : 'keine'} ·
            Bestellungen: {summary.orders}
          </p>
          {summary.notes.map(n => (
            <p key={n} className="text-xs font-semibold text-attention-strong">{n}</p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-attention px-4 py-2 text-sm font-bold text-attention-foreground hover:bg-attention-strong disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          Szenario erzeugen
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={submitReset}
          className="flex items-center gap-1.5 rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" /> Alles zurücksetzen
        </button>
      </div>
    </form>
  )
}
