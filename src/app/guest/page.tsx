import { KeyRound, QrCode } from 'lucide-react'
import { getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'

/**
 * Mandantenfreier Einstieg — bewusst nur ein Hinweis.
 *
 * Das Gast-Portal braucht den Mandanten (`/h/<slug>/guest`), weil
 * Zimmernummern nur je Hotel eindeutig sind. Hier wird KEIN Hotel zur Auswahl
 * angeboten und auch kein Code-Feld: beides gäbe ein Verzeichnis aller Kunden
 * preis bzw. ließe sich durchprobieren.
 */
export default async function GuestGenericEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  // `link` kommt von /guest/s/<token>: der Aufenthalts-Link eines bereits
  // ausgecheckten (oder unbekannten) Gastes. In einem Link-Haus hängt kein
  // QR im Zimmer — der allgemeine Text („QR im Zimmer scannen") führte hier
  // in die Irre. Die Route kennt den Mandanten nicht mehr, also bleibt die
  // Seite mandantenfrei; sie nennt aber den Grund.
  const linkErloschen = error === 'link'
  const m = getMessages(await getLocale()).guest

  return (
    <main className="flex flex-1 flex-col justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{m.brand.portal}</p>
      </div>

      <div className="space-y-4 rounded-xl border border-edge bg-surface-elevated px-5 py-6 text-center">
        {linkErloschen ? (
          <>
            <KeyRound className="mx-auto h-10 w-10 text-ink-muted" />
            <p className="font-bold text-ink">{m.entry.expiredTitle}</p>
            <p className="text-sm leading-relaxed text-ink-soft">{m.entry.expiredText}</p>
          </>
        ) : (
          <>
            <QrCode className="mx-auto h-10 w-10 text-ink-muted" />
            <p className="font-bold text-ink">{m.entry.scanTitle}</p>
            <p className="text-sm leading-relaxed text-ink-soft">{m.entry.scanText}</p>
          </>
        )}
      </div>
    </main>
  )
}
