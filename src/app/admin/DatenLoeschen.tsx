'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  deleteAccountAction, deleteHotelAction, getDeletionPreviewAction,
} from './actions'
import type { DeletionPreview } from '@/utils/deletion'

type Target = {
  /** undefined = das ganze Konto. */
  hotelId?: string
  label: string
  preview: DeletionPreview
  confirmPhrase: string
}

const input =
  'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none'

/** „1 Aufenthalt" statt „1 Aufenthalte" — in einer Löschbestätigung zählt jedes Wort. */
function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/**
 * Löschbegehren — Haus oder ganzes Konto restlos entfernen.
 *
 * Bewusst eingeklappt und ganz unten: Der Bereich wird selten gebraucht und
 * soll nicht zum Fehlklick einladen. Die eigentliche Sicherung ist trotzdem
 * nicht das Zuklappen, sondern die abgetippte Bezeichnung und die Vorschau
 * dessen, was verschwindet.
 */
export default function DatenLoeschen({
  hotels, accountName,
}: {
  hotels: { id: string; name: string }[]
  accountName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [confirmInput, setConfirmInput] = useState('')

  function open(hotelId: string | undefined, label: string) {
    setError(null)
    setNotice(null)
    setConfirmInput('')
    setTarget(null)
    startTransition(async () => {
      const res = await getDeletionPreviewAction(hotelId)
      if (!res.preview || !res.confirmPhrase) {
        setError(res.error ?? 'Konnte nicht geladen werden.')
        return
      }
      setTarget({ hotelId, label, preview: res.preview, confirmPhrase: res.confirmPhrase })
    })
  }

  function run() {
    if (!target) return
    setError(null)
    startTransition(async () => {
      if (target.hotelId) {
        const res = await deleteHotelAction(target.hotelId, confirmInput)
        if (res.error) { setError(res.error); return }
        setTarget(null)
        setNotice(`${target.label} wurde vollständig entfernt.`)
        router.refresh()
      } else {
        const res = await deleteAccountAction(confirmInput)
        if (res.error) { setError(res.error); return }
        // Das eigene Anmeldekonto ist mit gelöscht — die Sitzung existiert
        // nicht mehr. Harter Wechsel statt router.push, damit kein Rest der
        // alten Sitzung im Client-Cache weiterlebt.
        window.location.href = '/login'
      }
    })
  }

  const p = target?.preview

  return (
    <details className="rounded-xl border border-edge bg-surface">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-ink-soft">
        Daten löschen
        <span className="ml-2 font-normal text-ink-muted">
          Haus oder Konto endgültig entfernen
        </span>
      </summary>

      <div className="flex flex-col gap-3 border-t border-edge p-4">
        <p className="text-xs text-ink-muted">
          Entfernt <strong>alles</strong>: Zimmer, Aufenthalte, Service-Anfragen,
          Reinigungsnachweise, Zimmer-Verlauf, Abrechnungsbelege und die
          Anmeldekonten der betroffenen Personen. Nicht rückgängig zu machen und
          nicht wiederherstellbar — es gibt keine Sicherung.
        </p>

        {error && (
          <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
            {notice}
          </p>
        )}

        {hotels.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-ink-soft">Einzelnes Haus</p>
            {hotels.map(h => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="min-w-40 text-sm font-semibold text-ink">{h.name}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => open(h.id, h.name)}
                  className="flex items-center gap-1.5 rounded-lg border border-critical-pill-edge px-3 py-1.5 text-sm font-semibold text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Löschen
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-1 border-t border-edge pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => open(undefined, accountName)}
            className="flex items-center gap-1.5 rounded-lg border border-critical-pill-edge px-3 py-1.5 text-sm font-bold text-critical-strong hover:bg-critical-tint disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" /> Gesamtes Konto löschen
          </button>
          <p className="mt-1.5 text-xs text-ink-muted">
            Mit allen Häusern und dem eigenen Zugang. Danach ist keine Anmeldung mehr möglich.
          </p>
        </div>

        {target && p && (
          <div className="mt-2 rounded-xl border border-critical-tint-edge bg-critical-tint p-4">
            <p className="text-sm font-bold text-critical-strong">
              {target.hotelId ? `${target.label} löschen` : `Konto „${target.label}" löschen`} — das
              verschwindet endgültig:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
              {!target.hotelId && p.hotels.length > 0 && (
                <li>{p.hotels.length} {p.hotels.length === 1 ? 'Haus' : 'Häuser'}: {p.hotels.map(h => h.name).join(', ')}</li>
              )}
              {p.rooms > 0 && <li>{p.rooms} Zimmer</li>}
              {p.stays > 0 && <li>{plural(p.stays, 'Aufenthalt', 'Aufenthalte')}</li>}
              {p.orders > 0 && (
                <li>{plural(p.orders, 'Service-Anfrage', 'Service-Anfragen')}</li>
              )}
              {p.staffLog > 0 && (
                <li>
                  {plural(p.staffLog, 'Eintrag', 'Einträge')} im Tätigkeits-Protokoll
                </li>
              )}
              {p.transitions > 0 && (
                <li>{plural(p.transitions, 'Eintrag', 'Einträge')} im Zimmer-Verlauf</li>
              )}
              {p.snapshots > 0 && (
                <li>
                  {plural(p.snapshots, 'festgeschriebener Abrechnungsmonat', 'festgeschriebene Abrechnungsmonate')}
                </li>
              )}
              {p.authUsers > 0 && (
                <li className="font-semibold">
                  {plural(p.authUsers, 'Anmeldekonto', 'Anmeldekonten')} samt E-Mail-Adresse
                </li>
              )}
            </ul>

            {p.authUsersKept > 0 && (
              <p className="mt-2 text-xs text-ink-muted">
                {p.authUsersKept}{' '}
                {p.authUsersKept === 1 ? 'Anmeldekonto bleibt' : 'Anmeldekonten bleiben'} bestehen —
                {p.authUsersKept === 1 ? ' diese Person ist' : ' diese Personen sind'} noch in
                anderen Häusern eingetragen.
              </p>
            )}

            <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              Zum Bestätigen &bdquo;{target.confirmPhrase}&ldquo; eingeben
              <input
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                autoComplete="off"
                className={`${input} w-72`}
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || confirmInput.trim() !== target.confirmPhrase}
                onClick={run}
                className="rounded-lg bg-critical px-4 py-2 text-sm font-bold text-critical-foreground disabled:opacity-50"
              >
                {pending ? 'Wird gelöscht …' : 'Ja, endgültig löschen'}
              </button>
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </details>
  )
}
