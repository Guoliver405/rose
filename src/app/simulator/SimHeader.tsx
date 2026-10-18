import Link from 'next/link'
import { simulatorName } from '@/lib/sim-account'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { simLogoutAction } from './actions'
import LanguageSwitch from '@/components/LanguageSwitch'
import { ADMIN_LOCALES } from '@/lib/i18n/locales'
import { RoseLogo } from '@/components/brand/RoseLogo'

/** Kopfzeile aller Seiten des Housekeeping-Simulators. */
export default async function SimHeader({ signedIn, hotel = false }: {
  signedIn: boolean
  /** Zugang mit Hotelkonto: Rückweg ins Portal. */
  hotel?: boolean
}) {
  const locale = await getAdminLocale()
  const m = getMessages(locale).simulator.app.header
  return (
    <header className="border-b border-edge bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/simulator" className="flex min-w-0 items-baseline gap-2">
          <span className="text-xl font-black text-ink"><RoseLogo size="header" /></span>
          <span className="truncate text-sm font-semibold text-ink-soft">{simulatorName(locale)}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm">
          <LanguageSwitch current={locale} offered={ADMIN_LOCALES} inline />
          {signedIn ? (
            <>
              {hotel && (
                <Link href="/admin" className="rounded-lg px-2 py-1.5 font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink">
                  {m.houses}
                </Link>
              )}
              <Link href="/simulator/konto" className="rounded-lg px-2 py-1.5 font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink">
                {m.account}
              </Link>
              <form action={simLogoutAction}>
                <button type="submit" className="rounded-lg border border-edge px-3 py-1.5 font-semibold text-ink hover:border-edge-strong">
                  {m.signOut}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border border-edge px-3 py-1.5 font-semibold text-ink hover:border-edge-strong">
                {m.signIn}
              </Link>
              <Link href="/simulator/registrieren" className="hidden rounded-lg bg-action px-3 py-1.5 font-semibold text-action-foreground hover:bg-action-strong sm:block">
                {m.signup}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
