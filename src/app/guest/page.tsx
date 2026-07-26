import { QrCode } from 'lucide-react'

/**
 * Mandantenfreier Einstieg — bewusst nur ein Hinweis.
 *
 * Das Gast-Portal braucht den Mandanten (`/h/<slug>/guest`), weil
 * Zimmernummern nur je Hotel eindeutig sind. Hier wird KEIN Hotel zur Auswahl
 * angeboten und auch kein Code-Feld: beides gäbe ein Verzeichnis aller Kunden
 * preis bzw. ließe sich durchprobieren.
 */
export default function GuestGenericEntryPage() {
  return (
    <main className="flex flex-1 flex-col justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Zimmerservice</p>
      </div>

      <div className="space-y-4 rounded-xl border border-edge bg-surface-elevated px-5 py-6 text-center">
        <QrCode className="mx-auto h-10 w-10 text-ink-muted" />
        <p className="font-bold text-ink">Bitte den QR-Code im Zimmer scannen.</p>
        <p className="text-sm leading-relaxed text-ink-soft">
          Alternativ funktioniert die Adresse deines Hotels — sie steht auf dem
          Zettel, den du beim Check-in bekommen hast. Die Rezeption hilft dir
          jederzeit weiter.
        </p>
      </div>
    </main>
  )
}
