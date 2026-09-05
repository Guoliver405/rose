import Link from 'next/link'
import { redirect } from 'next/navigation'
import { landingRoute } from '@/utils/auth'
import ForgotForm from './ForgotForm'
import LegalFooter from '@/components/LegalFooter'

export default async function PasswortVergessenPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>
}) {
  const ziel = await landingRoute()
  if (ziel) redirect(ziel)

  const { fehler } = await searchParams

  return (
    <>
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Passwort zurücksetzen</p>
      </div>

      {/* Kommt von /auth/callback, wenn der Link abgelaufen, schon benutzt oder
          in einem anderen Browser geöffnet wurde. */}
      {fehler === 'link' && (
        <p className="w-full max-w-sm rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          Der Link ist abgelaufen oder wurde bereits benutzt. Bitte einen neuen
          anfordern — und ihn in demselben Browser öffnen, in dem er angefordert
          wurde.
        </p>
      )}

      <ForgotForm />

      <p className="text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-action-strong hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </main>
    <LegalFooter />
    </>
  )
}
