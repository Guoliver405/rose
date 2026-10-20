import Link from 'next/link'
import { redirect } from 'next/navigation'
import { landingRoute } from '@/utils/auth'
import SignupForm from './SignupForm'
import LegalFooter from '@/components/LegalFooter'
import Rich from '@/components/i18n/Rich'
import { ADMIN_LOCALES, getMessages } from '@/lib/i18n'
import LanguageSwitch from '@/components/LanguageSwitch'
import { getAdminLocale } from '@/utils/locale'
import { RoseLogo } from '@/components/brand/RoseLogo'
import { stripeReady } from '@/utils/stripe'

/**
 * Self-Service-Registrierung (Phase 6b).
 *
 * Erzeugt Konto, erstes Haus und Inhaber in einem Zug und führt danach direkt
 * ins Zimmer-Setup. Wer schon angemeldet ist, hat hier nichts zu suchen und
 * wird wie auf der Anmeldeseite weitergeleitet.
 */
export default async function RegistrierenPage() {
  const ziel = await landingRoute()
  if (ziel) redirect(ziel)
  const locale = await getAdminLocale()
  const m = getMessages(locale).auth.signup

  return (
    <>
    <main lang={locale} className="relative flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <LanguageSwitch current={locale} offered={ADMIN_LOCALES} />
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          <RoseLogo size="hero" />
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{m.title}</p>
        {/* Gibt es einen Zahlungsweg, folgt „Schritt 2 von 2“ — ohne Schritt 1 las sich das wie ein Sprung. */}
        {stripeReady() && <p className="mt-0.5 text-xs font-semibold text-ink-soft">{m.step}</p>}
      </div>

      <SignupForm m={m} />

      <p className="text-sm text-ink-muted">
        <Rich
          text={m.haveAccount}
          tags={{ link: c => <Link href="/login" className="font-semibold text-action-strong hover:underline">{c}</Link> }}
        />
      </p>
    </main>
    <LegalFooter />
    </>
  )
}
