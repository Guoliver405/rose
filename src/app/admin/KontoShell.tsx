import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/login/actions'

/**
 * Rahmen der Konto-Seiten außerhalb von `/h/<slug>/`: Logo, Name der
 * angemeldeten Person, Abmelden. Bewusst kein Layout (`layout.tsx`), weil
 * `/admin` selbst entscheidet, ob es rendert oder auf `/login` umleitet —
 * ein Layout würde die Kopfzeile auch um diese Umleitung herum zeichnen.
 */
export default function KontoShell({
  who, children,
}: {
  who: string | undefined
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-[900px] items-center gap-4 px-4 py-3">
          <span className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            {who && <span className="hidden text-sm text-ink-muted sm:inline">{who}</span>}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 p-4">
        {children}
      </main>
    </div>
  )
}
