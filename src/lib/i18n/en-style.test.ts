import { describe, expect, it } from 'vitest'
import { getMessages } from './index'
import { flattenMessages } from './format'

/*
 * Schreibweise aller englischen Texte (17.10.2026): amerikanische Regeln,
 * einheitlich über alle Bereiche — Punkt und Komma stehen innerhalb der
 * Anführungszeichen (“End.”). Ausnahme sind wörtliche Werte, bei denen das
 * Satzzeichen sonst zum Wert gehörte (eine Adresse, eine Zimmernummer).
 * Das Komma vor dem letzten Glied einer Aufzählung („A, B, and C“) lässt
 * sich nicht maschinell prüfen; es wird beim Übersetzen gesetzt.
 */
const LITERALS = ['“https://”.', '“205”.']

describe('Englisch — einheitliche Schreibweise', () => {
  const all = flattenMessages(getMessages('en')).filter(([k]) => !/\.(art|id|ton|icon|href)$/.test(k))

  it('setzt Punkt und Komma innerhalb der Anführungszeichen', () => {
    const hits = all.filter(([, t]) => {
      let rest = t
      for (const lit of LITERALS) rest = rest.split(lit).join('')
      return /”[.,]/.test(rest)
    })
    expect(hits).toEqual([])
  })
})
