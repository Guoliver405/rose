import { KeyRound, QrCode } from 'lucide-react'
import LegalFooter from '@/components/LegalFooter'

/**
 * Mandantenfreie Reinigungs-Anmeldung — bewusst nur ein Hinweis.
 *
 * Benutzernamen sind nur je Hotel eindeutig, die Anmeldung braucht also den
 * Mandanten aus der URL (`/h/<slug>/service/login`). Hier wird KEIN Hotel zur
 * Auswahl gestellt: das wäre ein Verzeichnis aller Kunden.
 *
 * Zusätzlich landet hier der Auto-Login, wenn die QR-Karte ungültig ist —
 * dann ist der Mandant unbekannt und die Kraft braucht eine neue Karte.
 */
export default async function ServiceGenericLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const cardFailed = error === 'auto_login_failed'

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-sunken p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-edge bg-surface-elevated">
            <KeyRound className="h-8 w-8 text-attention-strong" />
          </div>
          <h1 className="text-2xl font-black text-ink">
            Ro<span className="text-blocked">Se</span> Reinigungsboard
          </h1>
        </div>

        {cardFailed && (
          <div className="rounded-xl border border-critical-tint-edge bg-critical-tint px-4 py-3 text-center text-sm font-bold text-critical-strong">
            QR-Code ist nicht mehr gültig. Bitte eine neue Zugangskarte beim
            Management anfordern.
          </div>
        )}

        <div className="space-y-4 rounded-xl border border-edge bg-surface-elevated px-5 py-6 text-center">
          <QrCode className="mx-auto h-10 w-10 text-ink-muted" />
          <p className="font-bold text-ink">Bitte die Zugangskarte scannen.</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            Für die Anmeldung mit Benutzername und PIN wird die Adresse deines
            Hotels gebraucht — sie steht auf der Zugangskarte. Das Management
            kann jederzeit eine neue Karte drucken.
          </p>
        </div>
        <LegalFooter />
      </div>
    </div>
  )
}
