'use client'

import { useState, useTransition } from 'react'
import { ChevronRight, Columns3, FolderOpen, Pencil, Save, Trash2 } from 'lucide-react'
import { MAX_SCENARIOS, type SimForm } from '@/lib/sim-form'
import type { ScenarioItem } from '@/utils/sim-scenarios'
import { deleteScenarioAction, listScenariosAction, renameScenarioAction, saveScenarioAction } from './actions'

const dateFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink hover:border-edge-strong disabled:opacity-50'
const field = 'rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-active'

/**
 * Szenarien des Simulators (Phase 3, 26.09.2026): das aktuelle Formular unter
 * einem Namen speichern, später laden, umbenennen, löschen — und zwei bis
 * drei nebeneinander vergleichen (gerechnet wird in `SimulatorApp`).
 */
export default function ScenarioPanel({ items, setItems, form, activeId, dirty, onLoad, onCompare, busy }: {
  items: ScenarioItem[]
  setItems: (items: ScenarioItem[]) => void
  form: SimForm
  activeId: string | null
  /** Weicht das Formular vom geladenen Szenario ab? */
  dirty: boolean
  onLoad: (item: ScenarioItem | null) => void
  onCompare: (items: ScenarioItem[]) => void
  busy: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [naming, setNaming] = useState<{ mode: 'new' } | { mode: 'rename'; id: string } | null>(null)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const active = items.find(i => i.id === activeId) ?? null

  const refresh = async (select?: string) => {
    const res = await listScenariosAction()
    if (res.items) {
      setItems(res.items)
      if (select) onLoad(res.items.find(i => i.id === select) ?? null)
    }
  }

  const save = (asNew: boolean) => {
    setMsg(null)
    if (asNew || !active) {
      setName(active ? `${active.name} (Kopie)` : '')
      setNaming({ mode: 'new' })
      return
    }
    startTransition(async () => {
      const res = await saveScenarioAction(active.name, form, active.id)
      if (res.error) { setMsg(res.error); return }
      await refresh(active.id)
      setMsg(`„${active.name}“ gespeichert.`)
    })
  }

  const submitName = () => {
    if (!naming) return
    startTransition(async () => {
      if (naming.mode === 'new') {
        const res = await saveScenarioAction(name, form)
        if (res.error) { setMsg(res.error); return }
        await refresh(res.id)
        setMsg(`„${name.trim()}“ gespeichert.`)
      } else {
        const res = await renameScenarioAction(naming.id, name)
        if (res.error) { setMsg(res.error); return }
        await refresh()
      }
      setNaming(null)
    })
  }

  const remove = (item: ScenarioItem) => {
    if (!window.confirm(`Szenario „${item.name}“ löschen?`)) return
    startTransition(async () => {
      const res = await deleteScenarioAction(item.id)
      if (res.error) { setMsg(res.error); return }
      setPicked(p => p.filter(id => id !== item.id))
      if (item.id === activeId) onLoad(null)
      await refresh()
    })
  }

  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : p.length >= 3 ? p : [...p, id]))

  return (
    <section className="rounded-2xl border border-edge bg-surface-elevated p-4 print:hidden" aria-label="Szenarien">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-soft">Szenario:</span>
        <span className="font-semibold text-ink">{active ? active.name : 'nicht gespeichert'}</span>
        {active && dirty && <span className="rounded-full bg-caution-tint px-2 py-0.5 text-xs font-bold text-caution-deepest">geändert</span>}
        <span className="flex-1" />
        {active && (
          <button type="button" className={btn} disabled={pending || !dirty} onClick={() => save(false)}>
            <Save className="h-4 w-4" aria-hidden /> Speichern
          </button>
        )}
        <button type="button" className={btn} disabled={pending || items.length >= MAX_SCENARIOS} onClick={() => save(true)}>
          <Save className="h-4 w-4" aria-hidden /> {active ? 'Speichern als …' : 'Speichern …'}
        </button>
      </div>

      {naming && (
        <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={e => { e.preventDefault(); submitName() }}>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={120} placeholder="Name, z. B. „Sommer, 6 Kräfte“"
            aria-label="Name des Szenarios" className={`${field} min-w-56 flex-1`} />
          <button type="submit" disabled={pending || !name.trim()} className="rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50">
            {naming.mode === 'new' ? 'Speichern' : 'Umbenennen'}
          </button>
          <button type="button" onClick={() => setNaming(null)} className="text-sm font-semibold text-ink-soft hover:underline">Abbrechen</button>
        </form>
      )}
      {msg && <p className="mt-2 text-sm text-ink-soft" aria-live="polite">{msg}</p>}

      {items.length > 0 && (
        <details className="group mt-3 rounded-xl border border-edge bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-90" aria-hidden />
            Gespeicherte Szenarien ({items.length})
          </summary>
          <ul className="divide-y divide-edge border-t border-edge">
            {items.map(item => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input type="checkbox" checked={picked.includes(item.id)} onChange={() => toggle(item.id)}
                    disabled={!picked.includes(item.id) && picked.length >= 3}
                    className="h-4 w-4 shrink-0 accent-[var(--color-action)]" aria-label={`„${item.name}“ zum Vergleich auswählen`} />
                  <span className={`truncate text-sm ${item.id === activeId ? 'font-bold text-ink' : 'text-ink'}`}>{item.name}</span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {item.form.floors * item.form.roomsPerFloor} Zi., {item.form.maids} Kräfte · {dateFmt.format(new Date(item.updatedAt))}
                  </span>
                </label>
                <button type="button" className={btn} onClick={() => onLoad(item)}><FolderOpen className="h-4 w-4" aria-hidden /> Laden</button>
                <button type="button" className={btn} aria-label={`„${item.name}“ umbenennen`}
                  onClick={() => { setName(item.name); setNaming({ mode: 'rename', id: item.id }) }}><Pencil className="h-4 w-4" aria-hidden /></button>
                <button type="button" className={btn} aria-label={`„${item.name}“ löschen`} onClick={() => remove(item)}><Trash2 className="h-4 w-4" aria-hidden /></button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-edge px-3 py-2">
            <button type="button" disabled={picked.length < 2 || busy}
              onClick={() => onCompare(items.filter(i => picked.includes(i.id)))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50">
              <Columns3 className="h-4 w-4" aria-hidden /> Ausgewählte vergleichen ({picked.length})
            </button>
            <span className="text-xs text-ink-muted">Zwei oder drei Szenarien ankreuzen.</span>
          </div>
        </details>
      )}
    </section>
  )
}
