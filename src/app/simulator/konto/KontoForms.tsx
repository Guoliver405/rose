'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { MARKETING_TEXT } from '@/lib/sim-account'
import { simDeleteAccountAction, simMarketingAction } from '../actions'

const card = 'rounded-2xl border border-edge bg-surface-elevated p-5'
const dateFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeStyle: 'short' })

export default function KontoForms({ email, kind, marketingOptInAt }: {
  email: string
  kind: 'sim' | 'hotel'
  marketingOptInAt: string | null
}) {
  const [optIn, setOptIn] = useState(marketingOptInAt !== null)
  const [since, setSince] = useState(marketingOptInAt)
  const [msg, setMsg] = useState<string | null>(null)
  const [phrase, setPhrase] = useState('')
  const [delError, setDelError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const toggle = (on: boolean) => {
    setMsg(null)
    startTransition(async () => {
      const res = await simMarketingAction(on)
      if (res.error) { setMsg(res.error); return }
      setOptIn(on)
      setSince(on ? new Date().toISOString() : null)
      setMsg(on ? 'Gespeichert – danke!' : 'Abbestellt. Sie erhalten keine Werbe-Mails mehr.')
    })
  }

  return (
    <>
      <section className={card}>
        <h2 className="font-bold text-ink">Zugang</h2>
        <p className="mt-2 text-sm text-ink-soft">E-Mail: <span className="font-mono text-ink">{email}</span></p>
        <p className="mt-1 text-sm text-ink-soft">
          Passwort ändern: über{' '}
          <Link href="/passwort-vergessen" className="font-semibold text-action-strong hover:underline">Passwort vergessen</Link>
          {' '}– Sie bekommen einen Link an diese Adresse.
        </p>
        {kind === 'hotel' && (
          <p className="mt-2 text-sm text-ink-soft">Dieser Zugang gehört zu einem Hotelkonto; den Simulator nutzen Sie damit ohne eigenes Konto.</p>
        )}
      </section>

      <section className={card}>
        <h2 className="font-bold text-ink">Informationen zu RoSe per E-Mail</h2>
        <label className="mt-3 flex items-start gap-2.5">
          <input type="checkbox" checked={optIn} disabled={pending} onChange={e => toggle(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-action)]" />
          <span className="text-sm text-ink">{MARKETING_TEXT}</span>
        </label>
        <p className="mt-2 text-xs text-ink-muted" aria-live="polite">
          {msg ?? (optIn && since ? `Eingewilligt am ${dateFmt.format(new Date(since))}.` : 'Nicht eingewilligt.')}
        </p>
      </section>

      <section className={`${card} border-critical-tint-edge`}>
        <h2 className="font-bold text-ink">{kind === 'sim' ? 'Konto löschen' : 'Simulator-Daten löschen'}</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {kind === 'sim'
            ? 'Löscht Ihren Zugang, gespeicherte Szenarien und die Einwilligung sofort und endgültig.'
            : 'Löscht Ihre gespeicherten Szenarien und die Einwilligung. Ihr Hotelzugang bleibt bestehen.'}
        </p>
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={e => {
          e.preventDefault()
          setDelError(null)
          startTransition(async () => {
            const res = await simDeleteAccountAction(phrase)
            if (res?.error) setDelError(res.error)
          })
        }}>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-soft">Zur Bestätigung „LÖSCHEN“ eintippen</span>
            <input value={phrase} onChange={e => setPhrase(e.target.value)} autoComplete="off"
              className="rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-active" />
          </label>
          <button type="submit" disabled={pending || phrase.trim().toUpperCase() !== 'LÖSCHEN'}
            className="flex items-center gap-1.5 rounded-lg bg-critical px-4 py-2 text-sm font-bold text-critical-foreground hover:opacity-90 disabled:opacity-50">
            <Trash2 className="h-4 w-4" aria-hidden /> Endgültig löschen
          </button>
        </form>
        {delError && <p className="mt-2 text-sm font-semibold text-critical-strong">{delError}</p>}
      </section>
    </>
  )
}
