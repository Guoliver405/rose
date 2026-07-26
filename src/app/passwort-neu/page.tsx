import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import NewPasswordForm from './NewPasswordForm'

/**
 * Neues Passwort setzen — Ziel des Links aus der Mail.
 *
 * Hierher kommt man über `/auth/callback`, das den Code aus der Mail gegen eine
 * Sitzung getauscht hat. Ohne Sitzung ist der Link abgelaufen, schon benutzt
 * oder in einem anderen Browser geöffnet worden; dann wird nicht kommentarlos
 * weitergeleitet, sondern erklärt, was zu tun ist.
 */
export default async function PasswortNeuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Neues Passwort vergeben</p>
      </div>

      {user ? (
        <>
          <p className="max-w-sm text-center text-sm text-ink-soft">
            Für <span className="font-semibold text-ink">{user.email}</span>.
            Nach dem Speichern bist du direkt angemeldet.
          </p>
          <NewPasswordForm />
        </>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
            Dieser Link ist nicht (mehr) gültig. Das passiert, wenn er abgelaufen
            ist, schon benutzt wurde oder in einem anderen Browser geöffnet wird
            als dem, in dem er angefordert wurde.
          </p>
          <Link
            href="/passwort-vergessen"
            className="rounded-lg bg-action px-4 py-3 text-center font-bold text-action-foreground hover:bg-action-strong"
          >
            Neuen Link anfordern
          </Link>
        </div>
      )}

      <p className="text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-action-strong hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </main>
  )
}
