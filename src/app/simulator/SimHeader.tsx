import Link from 'next/link'
import { SIMULATOR_NAME } from '@/lib/sim-account'
import { simLogoutAction } from './actions'

/** Kopfzeile aller Seiten des Housekeeping-Simulators. */
export default function SimHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="border-b border-edge bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/simulator" className="flex min-w-0 items-baseline gap-2">
          <span className="text-xl font-black text-ink">Ro<span className="text-blocked">Se</span></span>
          <span className="truncate text-sm font-semibold text-ink-soft">{SIMULATOR_NAME}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm">
          {signedIn ? (
            <>
              <Link href="/simulator/konto" className="rounded-lg px-2 py-1.5 font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink">
                Mein Konto
              </Link>
              <form action={simLogoutAction}>
                <button type="submit" className="rounded-lg border border-edge px-3 py-1.5 font-semibold text-ink hover:border-edge-strong">
                  Abmelden
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border border-edge px-3 py-1.5 font-semibold text-ink hover:border-edge-strong">
                Anmelden
              </Link>
              <Link href="/simulator/registrieren" className="hidden rounded-lg bg-action px-3 py-1.5 font-semibold text-action-foreground hover:bg-action-strong sm:block">
                Kostenlos registrieren
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
