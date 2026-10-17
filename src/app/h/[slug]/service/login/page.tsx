import { redirect } from 'next/navigation'
import { KeyRound, User } from 'lucide-react'
import {
  createServicePortalClient,
  getServicePortalSession,
} from '@/utils/supabase/service-portal'
import { requireHotelBySlug } from '@/utils/hotel'
import { getMaidContext } from '@/utils/maid-auth'
import { maidLoginAction } from './actions'
import LegalFooter from '@/components/LegalFooter'
import { getMessages, SERVICE_LOCALES } from '@/lib/i18n'
import { getServiceLocale } from '@/utils/locale'
import LanguageSwitch from '@/components/LanguageSwitch'

export default async function ServiceLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { slug } = await params
  const { error } = await searchParams
  const hotel = await requireHotelBySlug(slug)

  // Bereits eingeloggt → direkt aufs Board. Maßgeblich ist getMaidContext,
  // NICHT die rohe Session: eine deaktivierte Kraft behält ihr Cookie, darf
  // aber nicht aufs Board — mit `if (session)` entstünde eine Redirect-
  // Schleife zwischen Login und Board. Weitergeleitet wird nur, wenn die
  // Sitzung zu DIESEM Haus gehört; sonst bleibt das Formular stehen.
  // Ausnahme: Nach einem fehlgeschlagenen Versuch (`?error=…`) bleibt das
  // Formular mit der Meldung stehen. Sonst schluckt eine Sitzung aus einem
  // zweiten Fenster (Cookies gelten browserweit) die Ablehnung, und ein
  // falscher Benutzername sieht aus wie eine gelungene Anmeldung.
  const svcClient = await createServicePortalClient()
  const { session } = await getServicePortalSession(svcClient)
  const maid = session ? await getMaidContext() : null
  if (maid?.hotelId === hotel.id && !error) redirect(`/h/${hotel.slug}/service`)
  const deactivated = Boolean(session) && !maid
  const locale = await getServiceLocale(hotel.policies)
  const m = getMessages(locale).service

  const errorMessage =
    error === 'invalid' ? m.login.invalid :
    error === 'missing' ? m.login.missing :
    error === 'auto_login_failed' ? m.login.cardInvalid :
    // Beendeter Zugang per QR: dieselbe Aussage wie beim PIN-Login — eine
    // neue Karte hilft hier nicht.
    error === 'deactivated' ? m.login.deactivated : null

  return (
    <div lang={locale} className="relative flex min-h-screen flex-1 items-center justify-center bg-surface-sunken p-6">
      <LanguageSwitch current={locale} offered={SERVICE_LOCALES} />
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-edge bg-surface-elevated">
            <KeyRound className="h-8 w-8 text-attention-strong" />
          </div>
          <h1 className="text-2xl font-black text-ink">
            Ro<span className="text-blocked">Se</span> {m.brand.board}
          </h1>
          {/* Hotelname kommt aus dem Slug der URL — früher stand hier das
              erstbeste Hotel der Datenbank (limit(1)), also ein fremder Name. */}
          <p className="mt-1 font-medium text-ink-muted">{hotel.name}</p>
        </div>

        {deactivated && !errorMessage && (
          <div className="rounded-xl border border-caution-pill-edge bg-caution-tint px-4 py-3 text-center text-sm font-bold text-caution-deepest">
            {m.login.deactivated}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-critical-tint-edge bg-critical-tint px-4 py-3 text-center text-sm font-bold text-critical-strong">
            {errorMessage}
          </div>
        )}

        <form action={maidLoginAction} className="space-y-4">
          <input type="hidden" name="slug" value={hotel.slug} />

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              {m.login.username}
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
                placeholder={m.login.usernamePlaceholder}
                aria-describedby="username-hint"
                className="w-full rounded-xl border border-edge bg-surface-elevated py-4 pl-11 pr-4 text-lg font-bold text-ink placeholder:text-ink-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-attention"
              />
            </div>
            {/* „Benutzername" heißt für viele der eigene Name. Gemeint ist der
                kurze Anmeldename, den das Management vergeben hat — er steht
                auf der Zugangskarte hinter dem @. */}
            <p id="username-hint" className="text-xs leading-relaxed text-ink-muted">
              {m.login.usernameHint}
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pin" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              {m.login.pin}
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
            {m.login.submit}
          </button>
        </form>

        <p className="text-center text-xs text-ink-muted">
          {m.login.lostCard}
        </p>
        <LegalFooter />
      </div>
    </div>
  )
}
