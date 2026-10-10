'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import type { SimulatorMessages } from '@/lib/i18n'
import { format } from '@/lib/i18n/format'
import Rich from '@/components/i18n/Rich'
import { simDeleteAccountAction, simMarketingAction } from '../actions'

const card = 'rounded-2xl border border-edge bg-surface-elevated p-5'

export default function KontoForms({ email, kind, marketingOptInAt, m, marketing, deletePhrase, intlLocale }: {
  email: string
  kind: 'sim' | 'hotel'
  marketingOptInAt: string | null
  m: SimulatorMessages['account']['konto']
  marketing: SimulatorMessages['account']['marketing']
  /** Bestätigungswort beim Löschen — der Server prüft dasselbe Wort. */
  deletePhrase: string
  intlLocale: string
}) {
  const dateFmt = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'long', timeStyle: 'short' })
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
      setMsg(on ? m.marketing.saved : m.marketing.unsubscribed)
    })
  }

  return (
    <>
      <section className={card}>
        <h2 className="font-bold text-ink">{m.access.title}</h2>
        <p className="mt-2 text-sm text-ink-soft">
          <Rich text={m.access.email} vars={{ email }} tags={{ code: c => <span className="font-mono text-ink">{c}</span> }} />
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          <Rich text={m.access.password} tags={{
            link: c => <Link href="/passwort-vergessen" className="font-semibold text-action-strong hover:underline">{c}</Link>,
          }} />
        </p>
        {kind === 'hotel' && (
          <p className="mt-2 text-sm text-ink-soft">{m.access.hotel}</p>
        )}
      </section>

      <section className={card}>
        <h2 className="font-bold text-ink">{m.marketing.title}</h2>
        <label className="mt-3 flex items-start gap-2.5">
          <input type="checkbox" checked={optIn} disabled={pending} onChange={e => toggle(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-action)]" />
          <span className="text-sm text-ink">{marketing.text}</span>
        </label>
        <p className="mt-2 text-xs text-ink-muted" aria-live="polite">
          {msg ?? (optIn && since ? format(m.marketing.since, { date: dateFmt.format(new Date(since)) }) : m.marketing.none)}
        </p>
      </section>

      <section className={`${card} border-critical-tint-edge`}>
        <h2 className="font-bold text-ink">{kind === 'sim' ? m.delete.titleSim : m.delete.titleHotel}</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {kind === 'sim' ? m.delete.textSim : m.delete.textHotel}
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
            <span className="text-xs font-semibold text-ink-soft">{format(m.delete.confirmLabel, { phrase: deletePhrase })}</span>
            <input value={phrase} onChange={e => setPhrase(e.target.value)} autoComplete="off"
              className="rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-active" />
          </label>
          <button type="submit" disabled={pending || phrase.trim().toUpperCase() !== deletePhrase}
            className="flex items-center gap-1.5 rounded-lg bg-critical px-4 py-2 text-sm font-bold text-critical-foreground hover:opacity-90 disabled:opacity-50">
            <Trash2 className="h-4 w-4" aria-hidden /> {m.delete.submit}
          </button>
        </form>
        {delError && <p className="mt-2 text-sm font-semibold text-critical-strong">{delError}</p>}
      </section>
    </>
  )
}
