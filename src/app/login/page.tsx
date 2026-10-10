import Link from 'next/link'
import { redirect } from 'next/navigation'
import { landingRoute } from '@/utils/auth'
import LoginForm from './LoginForm'
import LegalFooter from '@/components/LegalFooter'
import Rich from '@/components/i18n/Rich'
import { getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'

export default async function LoginPage() {
  const ziel = await landingRoute()
  if (ziel) redirect(ziel)
  const m = getMessages(await getLocale()).auth.login

  return (
    <>
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{m.title}</p>
      </div>
      <LoginForm m={m} />

      <p className="text-sm text-ink-muted">
        <Link href="/passwort-vergessen" className="font-semibold text-action-strong hover:underline">
          {m.forgot}
        </Link>
      </p>

      <p className="text-sm text-ink-muted">
        <Rich
          text={m.noAccount}
          tags={{ link: c => <Link href="/registrieren" className="font-semibold text-action-strong hover:underline">{c}</Link> }}
        />
      </p>
    </main>
    <LegalFooter />
    </>
  )
}
