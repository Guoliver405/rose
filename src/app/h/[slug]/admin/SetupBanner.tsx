import Link from 'next/link'
import { ArrowRight, ListChecks } from 'lucide-react'
import { offeneEinrichtung, type SetupKonfig } from '@/lib/lotsen'

/**
 * Schmales Band auf der Übersicht, solange die Einrichtung unfertig ist.
 *
 * Warum überhaupt: Die Einrichtungs-Checkliste weiß, was fehlt — aber nur,
 * wer den Hilfe-Bereich aufruft, sieht es. Wer die Einrichtung nach der
 * Registrierung abbricht, bekam bisher keinen Anstoß mehr.
 *
 * Drei Dinge halten es klein:
 * 1. **Es endet von selbst.** Sobald die vier Konfigurations-Punkte stehen,
 *    ist das Band weg — es hat kein „Später" und braucht keinen gespeicherten
 *    Ausblend-Zustand, den man über Geräte hinweg mitschleppen müsste.
 * 2. **Es nennt genau einen nächsten Schritt**, nicht die ganze Liste. Die
 *    steht im Hilfe-Bereich, und dorthin führt der zweite Link.
 * 3. **Nur die Verwaltung sieht es.** Die Rezeption kann keinen dieser Punkte
 *    erledigen; für sie wäre es ein Vorwurf ohne Handlungsmöglichkeit.
 *
 * Der erste Check-in und die Zusatzleistungen zählen bewusst NICHT mit: Der
 * eine ist ein Meilenstein, kein Einrichtungsschritt, die anderen sind
 * freiwillig. Sonst stünde das Band bei einem Haus ohne Zusatzleistungen für
 * immer da.
 */
export default function SetupBanner({
  base,
  konfig,
}: {
  /** `/h/<slug>/admin` */
  base: string
  konfig: SetupKonfig
}) {
  const offen = offeneEinrichtung(konfig)
  if (offen.length === 0) return null

  const naechster = offen[0]
  const gesamt = 4

  return (
    <section className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-attention-tint-edge bg-attention-tint px-4 py-2.5 text-sm print:hidden">
      <ListChecks className="h-4 w-4 shrink-0 text-attention-deepest" />
      <span className="font-bold text-attention-deepest">
        Einrichtung: noch {offen.length} von {gesamt} Schritten
      </span>
      <span className="min-w-0 text-attention-deepest">
        Als Nächstes: <strong className="font-semibold">{naechster.todo}</strong>
        <span className="hidden text-xs sm:inline"> — {naechster.hint}</span>
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-3">
        <Link
          href={`${base}/hilfe`}
          className="text-xs font-semibold text-attention-deepest underline hover:no-underline"
        >
          Alle Schritte
        </Link>
        <Link
          href={
            naechster.lotse
              ? `${base}${naechster.path ?? ''}?lotse=${naechster.lotse}&schritt=0`
              : `${base}${naechster.path ?? ''}`
          }
          className="flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-xs font-bold text-action-foreground hover:bg-action-strong"
        >
          Weiter einrichten <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </span>
    </section>
  )
}
