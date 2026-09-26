'use client'

import { useState, useTransition } from 'react'
import { Building2 } from 'lucide-react'
import type { Policy } from '@/lib/cleaning-sim'
import { formatCents } from '@/lib/money'
import { MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS, monthlyPriceCents } from '@/lib/pricing'
import type { SimForm } from '@/lib/sim-form'
import { convertToHotelAction } from './actions'

const field = 'rounded-lg border border-edge bg-surface px-3 py-2 text-ink outline-none focus:border-active'

/**
 * „Als Hotel bei RoSe starten" (Simulator Phase 4, 26.09.2026). Derselbe
 * Zugang wird Inhaber eines neuen Hotelkontos, ohne neue Anmeldung; was im
 * Simulator eingestellt ist, wird mitgenommen (Entscheidung 1 des Users).
 * Solange die Registrierung geschlossen ist, braucht es den Einladungscode
 * wie auf `/registrieren`.
 */
export default function ConvertCard({ form, policy, signupOpen }: { form: SimForm; policy: Policy; signupOpen: boolean }) {
  const [open, setOpen] = useState(false)
  const [takeRooms, setTakeRooms] = useState(true)
  const [takeRules, setTakeRules] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const rooms = Number.isInteger(form.floors * form.roomsPerFloor) ? form.floors * form.roomsPerFloor : 0

  return (
    <section className="rounded-2xl border border-action bg-surface-elevated p-5 print:hidden" aria-labelledby="hotel-starten">
      <div className="flex flex-wrap items-center gap-3">
        <Building2 className="h-6 w-6 text-action-strong" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="hotel-starten" className="text-lg font-bold text-ink">Als Hotel bei RoSe starten</h2>
          <p className="text-sm text-ink-soft">
            Ihr Zugang wird Inhaber eines neuen Hotelkontos – ohne neue Anmeldung, Ihre Szenarien bleiben.{' '}
            {formatCents(PRICE_PER_ROOM_CENTS)} je Zimmer und Monat, mindestens {formatCents(MIN_MONTHLY_CENTS)}, der erste Monat ist frei.
          </p>
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)}
            className="rounded-lg bg-action px-4 py-2 font-bold text-action-foreground hover:bg-action-strong">
            Weiter
          </button>
        )}
      </div>

      {open && !signupOpen && (
        <p className="mt-4 rounded-lg border border-edge bg-surface-sunken p-3 text-sm text-ink">
          Die Anmeldung als Hotel ist derzeit nur mit Einladung möglich und gerade nicht freigeschaltet. Schreiben Sie uns — die
          Adresse steht im Impressum.
        </p>
      )}

      {open && signupOpen && (
        <form className="mt-4 flex flex-col gap-4" onSubmit={e => {
          e.preventDefault()
          setError(null)
          const fd = new FormData(e.currentTarget)
          startTransition(async () => {
            const res = await convertToHotelAction({
              code: String(fd.get('code') ?? ''),
              hotelName: String(fd.get('hotelName') ?? ''),
              displayName: String(fd.get('displayName') ?? ''),
              form, policy, takeRooms, takeRules,
            })
            if (res?.error) setError(res.error)
          })
        }}>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-soft">Name des Hauses</span>
              <input name="hotelName" required minLength={2} className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-soft">Ihr Name</span>
              <input name="displayName" required minLength={2} autoComplete="name" className={field} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-ink-soft">Einladungscode</span>
              <input name="code" required autoComplete="off" className={field} />
            </label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-ink-soft">Aus dem Simulator übernehmen</legend>
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={takeRooms} onChange={e => setTakeRooms(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-action)]" />
              <span className="text-sm text-ink">
                {rooms} Zimmer auf {form.floors} Etagen, nummeriert 101, 102 … – im Zimmer-Setup jederzeit änderbar
                <span className="block text-xs text-ink-muted">
                  Voraussichtlich {formatCents(monthlyPriceCents(takeRooms ? rooms : 0))} im Monat, sobald der freie Monat vorbei ist.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked={takeRules} onChange={e => setTakeRules(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-action)]" />
              <span className="text-sm text-ink">
                Regeln: Bleibezimmer {policy === 'routine' ? `täglich reinigen ab ${form.times.stayRoutineFrom}` : 'nur auf Wunsch reinigen'},
                Check-out bis {form.times.checkoutUntil}, Check-in ab {form.times.checkinFrom}
                <span className="block text-xs text-ink-muted">Folgt dem Umschalter „täglich / nur auf Wunsch“ oben; unter „Hotel &amp; Regeln“ änderbar.</span>
              </span>
            </label>
          </fieldset>

          {error && <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending}
              className="rounded-lg bg-action px-4 py-2 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-60">
              {pending ? 'Wird angelegt …' : 'Hotelkonto anlegen'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink-soft hover:underline">Abbrechen</button>
            <span className="text-xs text-ink-muted">Danach: Zahlungsweg (überspringbar) und Einrichtung. Es gelten die AGB.</span>
          </div>
        </form>
      )}
    </section>
  )
}
