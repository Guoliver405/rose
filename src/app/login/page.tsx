import { redirect } from 'next/navigation'
import { listAccessibleHotels } from '@/utils/auth'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  // Kein einzelnes Haus mehr prüfbar — wer irgendwo Zugriff hat, geht auf die
  // Haus-Auswahl; die leitet bei genau einem Haus direkt weiter.
  const hotels = await listAccessibleHotels()
  if (hotels.length > 0) redirect('/admin')

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Rezeption — Anmeldung</p>
      </div>
      <LoginForm />
    </main>
  )
}
