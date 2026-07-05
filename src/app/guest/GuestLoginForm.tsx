'use client'

import { useState, useTransition } from 'react'
import { guestLoginAction } from './actions'

type Props = {
  /** QR-Deep-Link: Zimmer ist über den Token vorbestimmt. */
  roomToken?: string
  /** Anzeige-Nummer beim Deep-Link (rein informativ). */
  roomNumber?: string
}

export default function GuestLoginForm({ roomToken, roomNumber }: Props) {
  const [number, setNumber] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await guestLoginAction(
        roomToken ? { roomToken, pin } : { roomNumber: number, pin },
      )
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {roomToken ? (
        <p className="rounded-xl border border-edge bg-surface-elevated px-4 py-3 text-center font-bold text-ink">
          Zimmer {roomNumber}
        </p>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink-soft">Zimmernummer</span>
          <input
            type="text"
            required
            autoComplete="off"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="z. B. 101"
            className="rounded-xl border border-edge bg-surface-elevated px-4 py-3 text-lg text-ink outline-none focus:border-active"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink-soft">PIN</span>
        <input
          type="password"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          autoComplete="one-time-code"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="rounded-xl border border-edge bg-surface-elevated px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-ink outline-none focus:border-active"
        />
      </label>

      {error && (
        <p className="rounded-xl border border-critical-pill-edge bg-critical-pill px-4 py-3 text-sm font-semibold text-critical-deepest">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || pin.length < 4}
        className="rounded-xl bg-action px-4 py-3.5 text-lg font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
      >
        {pending ? 'Anmelden …' : 'Anmelden'}
      </button>

      <p className="text-center text-xs text-ink-muted">
        Die PIN erhältst du beim Check-in an der Rezeption.
      </p>
    </form>
  )
}
