'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, CircleDot, Loader2, RotateCcw, Save } from 'lucide-react'

/**
 * Ungespeicherte Änderungen auf langen Einstellungsseiten (26.09.2026).
 *
 * Auf „Hotel & Regeln" und „Gäste-Zugang" steht der Speichern-Knopf weit
 * unten — und immer mehr Programme speichern Einstellungen sofort, Nutzer
 * suchen den Knopf also gar nicht erst. Deshalb: Sobald ein Abschnitt der Seite
 * geändert ist, klebt unten eine Leiste mit „Speichern" und „Verwerfen".
 * Sofortiges Speichern je Feld ist bewusst nicht der Weg — die Regeln wirken
 * direkt auf den Betrieb, und manche Felder gelten nur zusammen (Zeitfenster).
 *
 * Nur für diese langen Seiten gedacht, nicht für Dialoge oder kurze Formulare.
 * Mehrere Formulare einer Seite melden sich hier an; die Leiste speichert alle
 * geänderten nacheinander. Die inline-Knöpfe der Formulare bleiben.
 *
 * Verlassen mit offenen Änderungen fragt nach: `beforeunload` für Neuladen und
 * Schließen, ein Klick-Abfang für Links innerhalb der App (davon erfährt
 * `beforeunload` nichts).
 */

export type UnsavedSection = {
  /** Kurzname für die Leiste, z. B. „Regeln". */
  label: string
  dirty: boolean
  /** Speichert; `false` bei Fehler — die Meldung zeigt das Formular selbst. */
  save: () => Promise<boolean>
  /** Stellt den gespeicherten Stand wieder her. */
  discard: () => void
}

type Registry = {
  set: (id: string, section: UnsavedSection | null) => void
}

const Ctx = createContext<Registry | null>(null)

const LEAVE_QUESTION = 'Es gibt ungespeicherte Änderungen. Seite trotzdem verlassen?'

export function UnsavedChanges({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<string, UnsavedSection>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [failed, setFailed] = useState(false)

  const set = useCallback((id: string, section: UnsavedSection | null) => {
    setSections(prev => {
      if (!section) {
        if (!(id in prev)) return prev
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: section }
    })
  }, [])
  const registry = useMemo(() => ({ set }), [set])

  const dirty = Object.values(sections).filter(s => s.dirty)
  const anyDirty = dirty.length > 0
  const dirtyRef = useRef(anyDirty)
  useEffect(() => { dirtyRef.current = anyDirty }, [anyDirty])

  // Verlassen mit offenen Änderungen: Neuladen/Schließen und Links der App.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) return
      if (window.confirm(LEAVE_QUESTION)) return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  // „Gespeichert" kurz stehen lassen, dann verschwindet die Leiste.
  useEffect(() => {
    if (!saved) return
    const id = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(id)
  }, [saved])

  async function saveAll() {
    setSaving(true)
    setFailed(false)
    let ok = true
    for (const s of dirty) {
      if (!(await s.save())) { ok = false; break }
    }
    setSaving(false)
    if (ok) setSaved(true)
    else setFailed(true)
  }

  function discardAll() {
    setFailed(false)
    for (const s of dirty) s.discard()
  }

  const visible = anyDirty || saving || saved

  return (
    <Ctx.Provider value={registry}>
      {children}
      {visible && (
        <div className="sticky bottom-3 z-20 mt-2" data-unsaved-bar>
          <div
            role="status"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-edge-strong bg-surface-elevated px-4 py-3 shadow-lg"
          >
            {saved && !anyDirty ? (
              <p className="flex items-center gap-1.5 text-sm font-bold text-positive-deep">
                <CheckCircle2 className="h-4 w-4" /> Gespeichert.
              </p>
            ) : (
              <>
                <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-bold text-ink">
                  <CircleDot className="h-4 w-4 shrink-0 text-attention" />
                  <span>
                    Ungespeicherte Änderungen
                    {dirty.length > 0 && (
                      <span className="font-semibold text-ink-muted"> · {dirty.map(s => s.label).join(', ')}</span>
                    )}
                    {failed && (
                      <span className="block text-xs font-semibold text-critical-strong">
                        Nicht gespeichert — der Hinweis steht beim Abschnitt.
                      </span>
                    )}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={discardAll}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-sunken disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" /> Verwerfen
                </button>
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Speichern
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

/**
 * Meldet einen Abschnitt bei der Leiste an. Ohne umgebendes `UnsavedChanges`
 * wirkungslos — das Formular funktioniert dann wie bisher mit seinem Knopf.
 */
export function useUnsavedSection(id: string, section: UnsavedSection) {
  const registry = useContext(Ctx)
  // Die Funktionen ändern sich bei jedem Render; die Leiste ruft immer die neuesten.
  const latest = useRef(section)
  useEffect(() => { latest.current = section })
  const { label, dirty } = section
  useEffect(() => {
    if (!registry) return
    registry.set(id, {
      label,
      dirty,
      save: () => latest.current.save(),
      discard: () => latest.current.discard(),
    })
  }, [registry, id, label, dirty])
  useEffect(() => () => registry?.set(id, null), [registry, id])
}
