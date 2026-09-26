import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LegalFooter from '@/components/LegalFooter'
import SimulatorApp from './SimulatorApp'

export const metadata: Metadata = {
  title: 'Simulator – RoSe',
  robots: { index: false, follow: false },
}

/**
 * Simulator, Phase 1 (26.09.2026): Rechnung und Oberfläche ohne Anmeldung.
 * Öffentlich wird er erst mit dem Konto (Phase 2) — bis dahin nur im
 * Dev-Server oder mit `SIMULATOR_PREVIEW=1` erreichbar, in Produktion 404.
 */
export default function SimulatorPage() {
  if (process.env.NODE_ENV === 'production' && process.env.SIMULATOR_PREVIEW !== '1') notFound()

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        <div>
          <Link href="/" className="text-2xl font-black text-ink" aria-label="RoSe — Startseite">
            Ro<span className="text-blocked">Se</span>
          </Link>
          <h1 className="mt-4 text-3xl font-black text-ink">Simulator</h1>
          <p className="mt-2 max-w-3xl text-ink-soft">
            Rechnen Sie Ihr Haus durch: Größe, Personal, Zeiten und Gästeverhalten. Der Simulator spielt viele Tage mit
            jeweils anderen Gästen zweimal durch – ohne Steuerung und mit RoSe – und zeigt, was die Koordination bewirkt.
            Die Regeln für „mit RoSe“ sind die des echten Reinigungsboards.
          </p>
        </div>
        <SimulatorApp />
      </main>
      <LegalFooter />
    </>
  )
}
