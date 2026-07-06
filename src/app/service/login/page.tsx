import { redirect } from 'next/navigation'
import { KeyRound, User } from 'lucide-react'
import {
  createServicePortalClient,
  getServicePortalSession,
} from '@/utils/supabase/service-portal'
import { createAdminClient } from '@/utils/supabase/service'
import { maidLoginAction } from './actions'

export default async function ServiceLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  // Bereits eingeloggt → direkt aufs Board.
  const svcClient = await createServicePortalClient()
  const { session } = await getServicePortalSession(svcClient)
  if (session) redirect('/service')

  // Hotelname fürs Branding (Single-Property: das eine Hotel).
  const { data: hotel } = await createAdminClient()
    .from('hotels')
    .select('name')
    .limit(1)
    .maybeSingle()

  const errorMessage =
    error === 'invalid' ? 'Benutzername oder PIN ist falsch.' :
    error === 'missing' ? 'Bitte alle Felder ausfüllen.' :
    error === 'auto_login_failed'
      ? 'QR-Code ist nicht mehr gültig. Bitte mit Benutzername und PIN anmelden oder eine neue Karte beim Management anfordern.'
      : null

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-sunken p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-edge bg-surface-elevated">
            <KeyRound className="h-8 w-8 text-attention-strong" />
          </div>
          <h1 className="text-2xl font-black text-ink">
            Ro<span className="text-blocked">Se</span> Reinigungsboard
          </h1>
          {hotel?.name && <p className="mt-1 font-medium text-ink-muted">{hotel.name}</p>}
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-critical-tint-edge bg-critical-tint px-4 py-3 text-center text-sm font-bold text-critical-strong">
            {errorMessage}
          </div>
        )}

        <form action={maidLoginAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Benutzername
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                placeholder="benutzername"
                className="w-full rounded-xl border border-edge bg-surface-elevated py-4 pl-11 pr-4 text-lg font-bold text-ink placeholder:text-ink-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-attention"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pin" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              PIN
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                id="pin"
                name="pin"
                type="password"
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                className="w-full rounded-xl border border-edge bg-surface-elevated py-4 pl-11 pr-4 text-2xl font-black tracking-[0.5em] text-ink placeholder:text-ink-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-attention"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-attention py-4 text-lg font-black text-attention-foreground shadow-lg transition-all hover:opacity-90 active:scale-95"
          >
            Anmelden
          </button>
        </form>

        <p className="text-center text-xs text-ink-muted">
          Zugangskarte mit QR-Code verloren? Das Management kann jederzeit eine neue drucken.
        </p>
      </div>
    </div>
  )
}
