import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALLE_LOTSEN, alleAnker } from './lotsen'

/**
 * Der Wächter gegen verrottende Anker.
 *
 * Ein Lotsen-Schritt zeigt auf ein `data-lotse`-Attribut irgendwo im JSX. Das
 * ist eine Zeichenkette, kein Typ — verschiebt oder löscht jemand einen
 * Abschnitt, merkt es weder `tsc` noch ESLint, und der Lotse zeigt still ins
 * Leere. Deshalb liest dieser Test ausnahmsweise die Quellen: Er ist die
 * einzige Stelle im Projekt, an der ein Unit-Test I/O macht, und genau das ist
 * hier der Zweck.
 */

const SRC = join(process.cwd(), 'src')

function sammle(dir: string, treffer: string[] = []): string[] {
  for (const eintrag of readdirSync(dir)) {
    const pfad = join(dir, eintrag)
    if (statSync(pfad).isDirectory()) sammle(pfad, treffer)
    else if (/\.tsx?$/.test(eintrag) && !/\.test\.tsx?$/.test(eintrag)) treffer.push(pfad)
  }
  return treffer
}

/**
 * Der Quelltext aller Seiten und Komponenten — ohne den Katalog selbst und
 * ohne den Piloten, der den Selektor zur Laufzeit zusammenbaut. Beide würden
 * jeden Anker „finden", ohne dass er irgendwo gesetzt wäre.
 */
const quellen = sammle(SRC)
  .filter(p => !/[\\/]lib[\\/]lotsen[.a-z]*\.tsx?$/.test(p))
  .filter(p => !/LotsePilot\.tsx$/.test(p))
  .map(p => readFileSync(p, 'utf8'))

/** Anker, die als festes Attribut im JSX stehen. */
const alsAttribut = (() => {
  const gefunden = new Set<string>()
  for (const inhalt of quellen) {
    for (const treffer of inhalt.matchAll(/data-lotse=(?:"([^"]+)"|\{[^}]*?'([^']+)'[^}]*?\})/g)) {
      const wert = treffer[1] ?? treffer[2]
      if (wert) gefunden.add(wert)
    }
  }
  return gefunden
})()

/**
 * Kommt der Anker irgendwo als Zeichenkette vor? Deckt zusätzlich den Fall ab,
 * dass er als Prop durchgereicht wird (`anchor={… ? 'uebersicht.kachel' : …}`)
 * und erst die Komponente daraus `data-lotse` macht.
 */
function kommtVor(anker: string): boolean {
  return quellen.some(q => q.includes(`'${anker}'`) || q.includes(`"${anker}"`))
}

describe('Lotsen-Anker', () => {
  it('findet jeden Anker aus dem Katalog auch im Code', () => {
    const fehlend = alleAnker().filter(a => !kommtVor(a))
    expect(fehlend).toEqual([])
  })

  it('lässt keinen Anker im Code liegen, den kein Lotse benutzt', () => {
    // Ein verwaister Anker ist harmlos, aber er ist ein Hinweis auf einen
    // gelöschten Schritt — und Ballast, den niemand mehr zuordnen kann.
    const katalog = new Set(alleAnker())
    expect([...alsAttribut].filter(a => !katalog.has(a)).sort()).toEqual([])
  })

  it('benennt Anker nach dem Muster <lotse>.<stelle>', () => {
    for (const anker of alleAnker()) {
      expect(anker).toMatch(/^[a-z]+\.[a-z]+$/)
    }
  })

  it('verwendet innerhalb eines Lotsen keinen Anker doppelt', () => {
    for (const lotse of ALLE_LOTSEN) {
      if (lotse.id === 'einrichtung') continue // erbt die Schritte der Fach-Lotsen
      const anker = lotse.steps.map(s => s.anchor).filter(Boolean)
      expect(new Set(anker).size).toBe(anker.length)
    }
  })
})
