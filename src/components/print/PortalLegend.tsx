import { ConciergeBell, Moon, Sparkles } from 'lucide-react'
import type { GuestSheetText } from '@/lib/guest-guide'

/**
 * Die Legende zum Bildschirm: ein Handy-Umriss mit den drei Knöpfen, wie sie
 * im Gästeportal stehen.
 *
 * **Warum Knöpfe und keine Sinnbilder** (Bauplan
 * `Sessions/Druckblaetter-Plan-2026-09-09.md`): Ein Besen bedeutet „Reinigung",
 * aber „nur auf Wunsch" ist eine **Bedingung** — dafür gibt es kein
 * Piktogramm. Zeigt das Blatt dagegen die Schaltflächen, wie sie nach dem
 * Scannen erscheinen, erkennt der Gast wieder, statt zu deuten. Deshalb sind
 * Beschriftung, Icon und Farbfamilie dieselben wie in
 * `GuestSignalPanel`/`GuestServicesPanel` — **wer dort umbenennt oder ein
 * anderes Icon nimmt, muss hier nachziehen** (die Beschriftungen selbst kommen
 * aus `guest-guide.ts` und sind dort getestet).
 *
 * **Print:** Die Knöpfe stehen im *unberührten* Zustand da — Rahmen und
 * getönte Icon-Fläche, dunkler Text. Genau so sieht der Gast sie beim ersten
 * Öffnen, und genau das druckt zuverlässig: Browser drucken Hintergrundflächen
 * standardmäßig nicht, ein saturierter Knopf mit heller Schrift käme leer aus
 * dem Drucker.
 */

/**
 * Die drei Knöpfe in der Reihenfolge des Portals — eine Quelle für die große
 * Legende und die Kurzfassung auf dem kompakten Zettel.
 */
export const KNOEPFE = [
  { key: 'clean', Icon: Sparkles, ton: 'attention' },
  { key: 'dnd', Icon: Moon, ton: 'blocked' },
  { key: 'services', Icon: ConciergeBell, ton: 'action' },
] as const

/** Farbfamilien wie im Portal — als Tönung, nie als saturierte Fläche. */
export const TON = {
  attention: 'border-attention-tint-edge bg-attention-tint text-attention-deepest',
  blocked: 'border-blocked-tint-edge bg-blocked-tint text-blocked-deepest',
  // Die `action`-Familie hat kein `deepest` — `deep` ist ihre dunkelste Stufe.
  action: 'border-action-tint-edge bg-action-tint text-action-deep',
} as const

export default function PortalLegend({ texts }: { texts: GuestSheetText[] }) {
  const [erste, zweite] = texts

  return (
    <div className="rounded-[20px] border-2 border-edge-strong p-3.5">
      {/* Handy-Andeutung: die Hörmuschel-Leiste macht aus dem Rahmen einen
          Bildschirm, ohne eine Fläche zu drucken. */}
      <div className="mx-auto mb-3 h-1 w-14 rounded-full border-2 border-edge" />

      <ul className="flex flex-col gap-2.5">
        {KNOEPFE.map(({ key, Icon, ton }) => (
          <li
            key={key}
            className="flex items-center gap-3.5 rounded-2xl border-2 border-edge px-3.5 py-2.5"
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${TON[ton]}`}>
              <Icon className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="min-w-0">
              <span className="block text-[17px] font-black leading-tight text-ink">
                {erste.buttons[key].label}
              </span>
              <span className="block text-[13.5px] leading-snug text-ink">
                {erste.buttons[key].hint}
              </span>
              {zweite && (
                <span className="block text-[12px] leading-snug text-ink-soft">
                  {zweite.buttons[key].hint}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
