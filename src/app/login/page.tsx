import Link from 'next/link'
import { redirect } from 'next/navigation'
import { landingRoute } from '@/utils/auth'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const ziel = await landingRoute()
  if (ziel) redirect(ziel)

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Rezeption — Anmeldung</p>
      </div>
      <LoginForm />

      <p className="text-sm text-ink-muted">
        <Link href="/passwort-vergessen" className="font-semibold text-action-strong hover:underline">
          Passwort vergessen?
        </Link>
      </p>

      <p className="text-sm text-ink-muted">
        Noch kein Konto?{' '}
        <Link href="/registrieren" className="font-semibold text-action-strong hover:underline">
          Haus registrieren
        </Link>
      </p>
    </main>
  )
}
