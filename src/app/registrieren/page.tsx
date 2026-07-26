import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listAccessibleHotels } from '@/utils/auth'
import SignupForm from './SignupForm'

/**
 * Self-Service-Registrierung (Phase 6b).
 *
 * Erzeugt Konto, erstes Haus und Inhaber in einem Zug und führt danach direkt
 * ins Zimmer-Setup. Wer schon angemeldet ist, hat hier nichts zu suchen und
 * wird wie auf der Anmeldeseite weitergeleitet.
 */
export default async function RegistrierenPage() {
  const hotels = await listAccessibleHotels()
  if (hotels.length > 0) {
    const nurRezeption = hotels.every(h => h.role === 'reception')
    redirect(nurRezeption ? `/h/${hotels[0].slug}/admin` : '/admin')
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Konto anlegen</p>
      </div>

      <SignupForm />

      <p className="text-sm text-ink-muted">
        Schon ein Konto?{' '}
        <Link href="/login" className="font-semibold text-action-strong hover:underline">
          Anmelden
        </Link>
      </p>
    </main>
  )
}
