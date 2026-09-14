import { Suspense } from 'react'
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/login/actions'
import HilfeKnopf from '@/components/hilfe/HilfeKnopf'
import HilfeLeiste from '@/components/hilfe/HilfeLeiste'
import LotsePilot from '@/components/lotse/LotsePilot'

/**
 * Rahmen der Konto-Seiten außerhalb von `/h/<slug>/`: Logo, Name der
 * angemeldeten Person, Abmelden. Bewusst kein Layout (`layout.tsx`), weil
 * `/admin` selbst entscheidet, ob es rendert oder auf `/login` umleitet —
 * ein Layout würde die Kopfzeile auch um diese Umleitung herum zeichnen.
 */
export default function KontoShell({
  who, istInhaber, children,
}: {
  who: string | undefined
  /** Für den Themenfilter der Hilfe-Leiste; Manager sehen „Plan & Abrechnung" nicht. */
  istInhaber: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      {/* Sticky wie im Haus-Layout, damit die Hilfe-Leiste darunter
          andocken kann (sie hängt an derselben Kopfzeilen-Höhe). */}
      <header className="sticky top-0 z-40 border-b border-edge bg-surface print:hidden">
        {/* Feste Höhe ab `lg` wie im Haus-Layout — die Hilfe-Leiste hängt daran. */}
        <div className="mx-auto flex max-w-[900px] items-center gap-4 px-4 py-3 lg:h-[52px] lg:py-0">
          <span className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            {/* Kontexthilfe wie im Haus-Layout. */}
            <HilfeKnopf />
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

      {/* Eigener Lotse für den Konto-Bereich: Er liegt außerhalb von
          `/h/<slug>/` und damit außerhalb des Haus-Layouts, in dem der andere
          Pilot hängt. Beide unterscheiden sich nur in Basis und Bereich. */}
      <Suspense fallback={null}>
        <LotsePilot base="/admin" bereich="konto" />
      </Suspense>

      <div className="flex flex-1 justify-center">
        <main className="flex w-full min-w-0 max-w-[900px] flex-1 flex-col gap-6 p-4">
          {children}
        </main>
        {/* Kein Slug im Konto-Bereich — die Leiste verlinkt dann nicht ins Haus. */}
        <HilfeLeiste slug={null} istVerwaltung istInhaber={istInhaber} />
      </div>
    </div>
  )
}
