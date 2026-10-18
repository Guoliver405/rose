import type { Metadata } from 'next'
import LegalFooter from '@/components/LegalFooter'
import Rich from '@/components/i18n/Rich'
import { getMessages } from '@/lib/i18n'
import { maskEmail } from '@/lib/email-change'
import { getAdminLocale } from '@/utils/locale'
import { peekEmailChange } from '@/utils/email-change'
import ConfirmEmailForm from './ConfirmEmailForm'
import { RoseLogo } from '@/components/brand/RoseLogo'

export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * Ziel des Bestätigungslinks an die neue Anmelde-Adresse (11.10.2026).
 *
 * Das Öffnen ändert noch nichts — erst der Knopf. Virenscanner mancher
 * Mail-Anbieter rufen Links vorab auf; bei einem Link, der beim Öffnen
 * umstellt, wäre der Schlüssel verbraucht, bevor die Person klickt. Eine
 * Anmeldung braucht die Seite nicht: Der Schlüssel im Link genügt, damit sie
 * auch auf dem Handy funktioniert, auf dem die E-Mail gelesen wird.
 */
export default async function EmailBestaetigenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const m = getMessages(await getAdminLocale()).admin.settings.myAccess.confirm
  const offen = await peekEmailChange(token)

  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-ink">
            <RoseLogo size="hero" />
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{m.title}</p>
        </div>

        {offen && token ? (
          <div className="flex w-full max-w-sm flex-col gap-4">
            <p className="text-center text-sm text-ink-soft">
              <Rich
                text={m.intro}
                vars={{ email: maskEmail(offen.email) }}
                tags={{ b: c => <span className="font-mono font-semibold text-ink">{c}</span> }}
              />
            </p>
            <ConfirmEmailForm token={token} m={m} />
          </div>
        ) : (
          <p className="w-full max-w-sm rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            {m.invalid}
          </p>
        )}
      </main>
      <LegalFooter />
    </>
  )
}
