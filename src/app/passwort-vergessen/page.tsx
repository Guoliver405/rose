import Link from 'next/link'
import { redirect } from 'next/navigation'
import { landingRoute } from '@/utils/auth'
import ForgotForm from './ForgotForm'
import LegalFooter from '@/components/LegalFooter'
import { ADMIN_LOCALES, getMessages } from '@/lib/i18n'
import LanguageSwitch from '@/components/LanguageSwitch'
import { getAdminLocale } from '@/utils/locale'
import { RoseLogo } from '@/components/brand/RoseLogo'

export default async function PasswortVergessenPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string }>
}) {
  const ziel = await landingRoute()
  if (ziel) redirect(ziel)

  const { fehler } = await searchParams
  const locale = await getAdminLocale()
  const m = getMessages(locale).auth.forgot

  return (
    <>
    <main lang={locale} className="relative flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <LanguageSwitch current={locale} offered={ADMIN_LOCALES} />
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          <RoseLogo size="hero" />
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{m.title}</p>
      </div>

      {/* Kommt von /auth/callback, wenn der Link abgelaufen, schon benutzt oder
          in einem anderen Browser geöffnet wurde. */}
      {fehler === 'link' && (
        <p className="w-full max-w-sm rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {m.linkInvalid}
        </p>
      )}

      <ForgotForm m={m} />

      <p className="text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-action-strong hover:underline">
          {m.backToLogin}
        </Link>
      </p>
    </main>
    <LegalFooter />
    </>
  )
}
