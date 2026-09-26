import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import LegalFooter from '@/components/LegalFooter'
import { getSimContext } from '@/utils/auth'
import { SIMULATOR_NAME } from '@/lib/sim-account'
import SimHeader from './SimHeader'
import SimulatorApp from './SimulatorApp'

export const metadata: Metadata = {
  title: `${SIMULATOR_NAME} – RoSe`,
  description: 'Rechnen Sie Ihr Haus durch: Housekeeping ohne Steuerung und mit RoSe, über viele Tage.',
  // Bis der Aufruf auf der Landing Page steht (Phase 3), nicht im Suchindex.
  robots: { index: false, follow: false },
}

/**
 * Housekeeping-Simulator (Phase 1 und 2, 26.09.2026). Angemeldet — eigenes
 * Simulator-Konto oder ein Hotelzugang — gibt es das Werkzeug, sonst die
 * Vorstellung mit Registrierung. Der feste Tagesvergleich bleibt öffentlich
 * auf der Landing Page.
 */
export default async function SimulatorPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [ctx, sp] = await Promise.all([getSimContext(), searchParams])

  return (
    <>
      <SimHeader signedIn={!!ctx} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        {sp.willkommen && ctx && (
          <p className="flex items-center gap-2 rounded-xl border border-positive-pill-edge bg-positive-tint px-4 py-3 text-sm font-semibold text-positive-deep">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /> Adresse bestätigt – willkommen im {SIMULATOR_NAME}.
          </p>
        )}
        {sp.geloescht && ctx && (
          <p className="rounded-xl border border-edge bg-surface-sunken px-4 py-3 text-sm text-ink">
            Ihre Simulator-Daten sind gelöscht. Ihr Hotelzugang bleibt bestehen.
          </p>
        )}
        <div>
          <h1 className="text-3xl font-black text-ink">{SIMULATOR_NAME}</h1>
          <p className="mt-2 max-w-3xl text-ink-soft">
            Rechnen Sie Ihr Haus durch: Größe, Personal, Zeiten und Gästeverhalten. Der Simulator spielt viele Tage mit
            jeweils anderen Gästen zweimal durch – ohne Steuerung und mit RoSe – und zeigt, was die Koordination bewirkt.
            Die Regeln für „mit RoSe“ sind die des echten Reinigungsboards. Derzeit nur auf Deutsch.
          </p>
        </div>
        {ctx ? <SimulatorApp /> : <Intro />}
      </main>
      <LegalFooter />
    </>
  )
}

function Intro() {
  const points = [
    'Ihr Haus: Etagen, Zimmer, Belegung, Reinigungskräfte, Check-out und Check-in',
    'Ihre Annahmen: Reinigungsdauern, Wege, wie Gäste Reinigung wünschen oder ablehnen',
    'Viele Tage statt eines Beispieltags – Median und Spanne, verpasste Check-ins, eingesparte Stunden',
    'Täglich oder nur auf Wunsch reinigen – beides auf denselben Gästen',
  ]
  return (
    <section className="grid gap-6 rounded-2xl border border-edge bg-surface-elevated p-6 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h2 className="text-xl font-bold text-ink">Kostenlos, mit E-Mail-Adresse – ohne Zahlungsdaten</h2>
        <ul className="mt-3 flex flex-col gap-2 text-ink-soft">
          {points.map(p => (
            <li key={p} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" aria-hidden /> {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          Einen festen Beispieltag ohne Anmeldung zeigt die{' '}
          <Link href="/#vergleich" className="font-semibold text-action-strong hover:underline">Startseite</Link>.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/simulator/registrieren"
          className="rounded-lg bg-action px-5 py-3 text-center font-bold text-action-foreground hover:bg-action-strong">
          Kostenlos registrieren
        </Link>
        <Link href="/login" className="rounded-lg border border-edge px-5 py-2.5 text-center font-semibold text-ink hover:border-edge-strong">
          Schon registriert? Anmelden
        </Link>
      </div>
    </section>
  )
}
