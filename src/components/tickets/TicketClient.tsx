'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  markTicketSeenAction, replyTicketAction, supportOpenedAction, supportReplyAction, supportStatusAction,
} from '@/app/tickets/actions'
import { BODY_MAX, TICKET_STATUSES, type TicketStatus } from '@/lib/tickets'
import type { HelpMessages } from '@/lib/i18n'
import { refreshUnread } from './unread'

type T = HelpMessages['tickets']

/** Öffnen einer Meldung mit neuer Antwort nimmt den Punkt am „?“ weg. */
export function MarkSeen({ ticketId }: { ticketId: string }) {
  useEffect(() => {
    markTicketSeenAction(ticketId).then(refreshUnread).catch(() => {})
  }, [ticketId])
  return null
}

/** Das RoSe-Team öffnet eine neue Meldung – sie steht dann „in Bearbeitung“. */
export function SupportOpened({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  useEffect(() => {
    supportOpenedAction(ticketId).then(() => router.refresh()).catch(() => {})
  }, [ticketId, router])
  return null
}

/** Antwort im Verlauf – vom Kunden. */
export function CustomerReply({ ticketId, status, t }: { ticketId: string; status: TicketStatus; t: T }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function send() {
    start(async () => {
      const r = await replyTicketAction(ticketId, body)
      if (r.error) setError(r.error)
      else {
        setBody('')
        setError(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-edge bg-surface p-4">
      <label htmlFor="reply" className="text-sm font-bold text-ink">{t.thread.reply}</label>
      <textarea
        id="reply"
        rows={4}
        maxLength={BODY_MAX}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={t.thread.replyPlaceholder}
        className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink"
      />
      {status === 'done' && <p className="text-xs text-ink-muted">{t.thread.reopens}</p>}
      {error && <p className="rounded-lg bg-critical-tint px-3 py-2 text-sm text-critical-deepest">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={send}
          disabled={pending || !body.trim()}
          className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? t.thread.sending : t.thread.send}
        </button>
      </div>
    </div>
  )
}

/** Antwort und Zustand – das RoSe-Team. */
export function SupportControls({ ticketId, status, t }: { ticketId: string; status: TicketStatus; t: T }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  // Nach einer Antwort wartet die Meldung meist auf den Kunden.
  const [next, setNext] = useState<TicketStatus>('waiting')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  function reply() {
    start(async () => {
      const r = await supportReplyAction(ticketId, body, next)
      if (r.error) setMsg({ ok: false, text: r.error })
      else {
        setBody('')
        setMsg({ ok: true, text: t.support.saved })
        router.refresh()
      }
    })
  }

  function changeStatus(s: TicketStatus) {
    start(async () => {
      const r = await supportStatusAction(ticketId, s)
      setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: t.support.saved })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border border-edge bg-surface p-4">
        <label htmlFor="support-reply" className="text-sm font-bold text-ink">{t.support.reply}</label>
        <textarea
          id="support-reply"
          rows={5}
          maxLength={BODY_MAX}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={t.support.replyPlaceholder}
          className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            {t.support.replyStatus}
            <select
              value={next}
              onChange={e => setNext(e.target.value as TicketStatus)}
              className="rounded-lg border border-edge bg-surface px-2 py-1.5 text-sm text-ink"
            >
              {TICKET_STATUSES.filter(s => s !== 'new').map(s => <option key={s} value={s}>{t.support.status[s]}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={reply}
            disabled={pending || !body.trim()}
            className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
          >
            {t.support.send}
          </button>
        </div>
        {next === 'done' && <p className="text-xs text-ink-muted">{t.support.doneDeletesScreenshot}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold text-ink-soft">{t.support.setStatus}</span>
        {TICKET_STATUSES.map(s => (
          <button
            key={s}
            type="button"
            disabled={pending || s === status}
            onClick={() => changeStatus(s)}
            className={`rounded-full border px-3 py-1 font-semibold ${
              s === status ? 'border-action bg-action-tint text-ink' : 'border-edge text-ink-soft hover:border-edge-strong hover:text-ink'
            }`}
          >
            {t.support.status[s]}
          </button>
        ))}
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? 'text-positive-strong' : 'text-critical-deepest'}`}>{msg.text}</p>
      )}
    </div>
  )
}
