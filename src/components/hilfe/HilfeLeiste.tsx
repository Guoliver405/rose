'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, ChevronRight, Compass, ExternalLink, List, X } from 'lucide-react'
import {
  hilfeUrl, istHilfeSeite, relativerPfad, themaBereich, themaById, themaFuerPfad, themenFuer,
  type HilfeThema,
} from '@/lib/hilfe'
import { lotseById, lotseStart } from '@/lib/lotsen'
import { HilfeBloecke } from './HilfeThema'
import { schliesseLeiste, useLeiste, waehleThema } from './leiste'

/**
 * Die Hilfe-Leiste: rechts neben dem Inhalt, vom „?" in der Kopfzeile ein-
 * und ausgeklappt.
 *
 * Warum eine Leiste und keine eigene Seite (Umbau am 14.09.2026, Rückmeldung
 * des Users nach dem ersten Blick): Wer wissen will, was ein Symbol
 * bedeutet, will das Symbol dabei **sehen**. Auf einem Quer-Monitor ist
 * seitlich Platz — der Inhalt rückt nach links, nichts wird verdeckt. Unter
 * `lg` (Tablet, Handy) legt sich die Leiste stattdessen von rechts über die
 * Seite; dort gäbe es nichts zum Danebenstellen.
 *
 * Das Thema folgt der Seite: Beim Seitenwechsel gilt wieder das Thema des
 * neuen Pfads. Was der Nutzer in der Leiste selbst wählt (Verweis, Liste),
 * ist an den Pfad gebunden, auf dem er es gewählt hat — abgeleitet, nicht in
 * einem Effekt zurückgesetzt (`leiste.ts`).
 *
 * Die Routen `…/hilfe/<thema>` bleiben für Drucken und Teilen bestehen;
 * die Leiste bietet sie als „Als Seite öffnen" an.
 */
export default function HilfeLeiste({
  slug, istVerwaltung, istInhaber,
}: {
  /** Slug des Hauses; `null` im Konto-Bereich. */
  slug: string | null
  istVerwaltung: boolean
  istInhaber: boolean
}) {
  const pathname = usePathname()
  const { offen, wahl } = useLeiste()

  // Esc schließt die Leiste — dieselbe Erwartung wie beim Lotsen. Der
  // Handler schreibt nur in den Store, kein setState im Effekt.
  useEffect(() => {
    if (!offen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') schliesseLeiste()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [offen])

  const rel = relativerPfad(pathname)
  if (!offen || !rel || istHilfeSeite(rel.pfad, rel.bereich)) return null

  const slugFuerUrl = slug ?? rel.slug
  const themaDerSeite = themaFuerPfad(rel.pfad, rel.bereich)
  const eigeneWahl = wahl && wahl.pfad === pathname ? wahl : null
  const thema = eigeneWahl ? (eigeneWahl.id ? themaById(eigeneWahl.id) : null) : themaDerSeite
  const lotse = thema?.lotse ? lotseById(thema.lotse) : null
  // Links ins Haus brauchen den Slug — im Konto-Bereich gibt es keinen.
  const kannVerlinken = (t: HilfeThema) => themaBereich(t) === 'konto' || slugFuerUrl !== null

  return (
    <aside
      aria-label="Hilfe"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col overflow-y-auto border-l border-edge bg-surface shadow-xl print:hidden lg:sticky lg:top-[53px] lg:z-auto lg:h-[calc(100vh-53px)] lg:w-[400px] lg:max-w-none lg:shrink-0 lg:shadow-none"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          {thema && (
            <button
              type="button"
              onClick={() => waehleThema(pathname, null)}
              title="Alle Themen"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <List className="h-4 w-4" />
            </button>
          )}
          <span className="flex-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Hilfe</span>
          <button
            type="button"
            onClick={schliesseLeiste}
            title="Hilfe schließen (Esc)"
            aria-label="Hilfe schließen"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {thema ? (
          <>
            <div>
              <h2 className="text-lg font-black leading-tight text-ink">{thema.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{thema.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
              {lotse && kannVerlinken(thema) && (
                <Link href={lotseStart(lotse, slugFuerUrl ?? '')} className="flex items-center gap-1 text-action hover:underline">
                  <Compass className="h-3.5 w-3.5" /> Lotse starten
                </Link>
              )}
              {kannVerlinken(thema) && (
                <Link
                  href={hilfeUrl(thema, slugFuerUrl ?? '')}
                  title="Zum Drucken oder Teilen"
                  className="flex items-center gap-1 text-ink-muted hover:text-ink hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Als Seite öffnen
                </Link>
              )}
            </div>
            <HilfeBloecke
              thema={thema}
              slug={slugFuerUrl ?? ''}
              kompakt
              onThema={id => waehleThema(pathname, id)}
            />
          </>
        ) : (
          <>
            {!themaDerSeite && !eigeneWahl && (
              <p className="text-sm text-ink-soft">
                Zu dieser Seite gibt es kein eigenes Thema. Wählen Sie eines aus der Liste — die
                Leiste bleibt offen, bis Sie sie schließen.
              </p>
            )}
            <ul className="flex flex-col divide-y divide-edge rounded-xl border border-edge bg-surface">
              {themenFuer(istVerwaltung, istInhaber).map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => waehleThema(pathname, t.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-sunken"
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-ink-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{t.title}</span>
                      <span className="block text-xs text-ink-muted">{t.subtitle}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  )
}
