'use client'

import { useState, useTransition } from 'react'
import { ChevronRight, Columns3, FolderOpen, Pencil, Save, Trash2 } from 'lucide-react'
import { MAX_SCENARIOS, type SimForm } from '@/lib/sim-form'
import type { ScenarioItem } from '@/utils/sim-scenarios'
import type { SimulatorMessages } from '@/lib/i18n'
import { format } from '@/lib/i18n/format'
import { deleteScenarioAction, listScenariosAction, renameScenarioAction, saveScenarioAction } from './actions'

const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink hover:border-edge-strong disabled:opacity-50'
const field = 'rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-active'

/**
 * Szenarien des Simulators (Phase 3, 26.09.2026): das aktuelle Formular unter
 * einem Namen speichern, später laden, umbenennen, löschen — und zwei bis
 * drei nebeneinander vergleichen (gerechnet wird in `SimulatorApp`).
 */
export default function ScenarioPanel({ items, setItems, form, activeId, dirty, onLoad, onCompare, busy, m, intlLocale }: {
  items: ScenarioItem[]
  setItems: (items: ScenarioItem[]) => void
  form: SimForm
  activeId: string | null
  /** Weicht das Formular vom geladenen Szenario ab? */
  dirty: boolean
  onLoad: (item: ScenarioItem | null) => void
  onCompare: (items: ScenarioItem[]) => void
  busy: boolean
  m: SimulatorMessages['app']['scenarios']
  intlLocale: string
}) {
  const dateFmt = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium', timeStyle: 'short' })
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
      setName(active ? format(m.copyName, { name: active.name }) : '')
      setNaming({ mode: 'new' })
      return
    }
    startTransition(async () => {
      const res = await saveScenarioAction(active.name, form, active.id)
      if (res.error) { setMsg(res.error); return }
      await refresh(active.id)
      setMsg(format(m.saved, { name: active.name }))
    })
  }

  const submitName = () => {
    if (!naming) return
    startTransition(async () => {
      if (naming.mode === 'new') {
        const res = await saveScenarioAction(name, form)
        if (res.error) { setMsg(res.error); return }
        await refresh(res.id)
        setMsg(format(m.saved, { name: name.trim() }))
      } else {
        const res = await renameScenarioAction(naming.id, name)
        if (res.error) { setMsg(res.error); return }
        await refresh()
      }
      setNaming(null)
    })
  }

  const remove = (item: ScenarioItem) => {
    if (!window.confirm(format(m.confirmDelete, { name: item.name }))) return
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
    <section className="rounded-2xl border border-edge bg-surface-elevated p-4 print:hidden" aria-label={m.ariaLabel}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-soft">{m.current}</span>
        <span className="font-semibold text-ink">{active ? active.name : m.unsaved}</span>
        {active && dirty && <span className="rounded-full bg-caution-tint px-2 py-0.5 text-xs font-bold text-caution-deepest">{m.changed}</span>}
        <span className="flex-1" />
        {active && (
          <button type="button" className={btn} disabled={pending || !dirty} onClick={() => save(false)}>
            <Save className="h-4 w-4" aria-hidden /> {m.save}
          </button>
        )}
        <button type="button" className={btn} disabled={pending || items.length >= MAX_SCENARIOS} onClick={() => save(true)}>
          <Save className="h-4 w-4" aria-hidden /> {active ? m.saveAs : m.saveNew}
        </button>
      </div>

      {naming && (
        <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={e => { e.preventDefault(); submitName() }}>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} maxLength={120} placeholder={m.namePlaceholder}
            aria-label={m.nameLabel} className={`${field} min-w-56 flex-1`} />
          <button type="submit" disabled={pending || !name.trim()} className="rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50">
            {naming.mode === 'new' ? m.save : m.rename}
          </button>
          <button type="button" onClick={() => setNaming(null)} className="text-sm font-semibold text-ink-soft hover:underline">{m.cancel}</button>
        </form>
      )}
      {msg && <p className="mt-2 text-sm text-ink-soft" aria-live="polite">{msg}</p>}

      {items.length > 0 && (
        <details className="group mt-3 rounded-xl border border-edge bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-90" aria-hidden />
            {format(m.list, { count: items.length })}
          </summary>
          <ul className="divide-y divide-edge border-t border-edge">
            {items.map(item => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <label className="flex min-w-0 flex-1 items-center gap-2">
                  <input type="checkbox" checked={picked.includes(item.id)} onChange={() => toggle(item.id)}
                    disabled={!picked.includes(item.id) && picked.length >= 3}
                    className="h-4 w-4 shrink-0 accent-[var(--color-action)]" aria-label={format(m.pick, { name: item.name })} />
                  <span className={`truncate text-sm ${item.id === activeId ? 'font-bold text-ink' : 'text-ink'}`}>{item.name}</span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {format(m.summary, { rooms: item.form.floors * item.form.roomsPerFloor, maids: item.form.maids, date: dateFmt.format(new Date(item.updatedAt)) })}
                  </span>
                </label>
                <button type="button" className={btn} onClick={() => onLoad(item)}><FolderOpen className="h-4 w-4" aria-hidden /> {m.load}</button>
                <button type="button" className={btn} aria-label={format(m.renameItem, { name: item.name })}
                  onClick={() => { setName(item.name); setNaming({ mode: 'rename', id: item.id }) }}><Pencil className="h-4 w-4" aria-hidden /></button>
                <button type="button" className={btn} aria-label={format(m.deleteItem, { name: item.name })} onClick={() => remove(item)}><Trash2 className="h-4 w-4" aria-hidden /></button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-edge px-3 py-2">
            <button type="button" disabled={picked.length < 2 || busy}
              onClick={() => onCompare(items.filter(i => picked.includes(i.id)))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50">
              <Columns3 className="h-4 w-4" aria-hidden /> {format(m.compare, { count: picked.length })}
            </button>
            <span className="text-xs text-ink-muted">{m.compareHint}</span>
          </div>
        </details>
      )}
    </section>
  )
}
