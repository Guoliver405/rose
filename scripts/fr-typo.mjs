/**
 * Französische Typografie in den Sprachdateien (19.10.2026):
 *
 *     node scripts/fr-typo.mjs          # schreibt src/lib/i18n/fr/**
 *     node scripts/fr-typo.mjs --check  # meldet nur, Exit 1 bei Fund
 *
 * Im Quelltext stehen normale Leerzeichen – lesbar und so, wie man tippt.
 * Das Skript macht daraus geschützte Leerzeichen, damit der Zeilenumbruch
 * nie ein Satzzeichen oder ein Anführungszeichen allein stehen lässt:
 * schmales geschütztes Leerzeichen (U+202F) vor ; ! ? und innen an « »,
 * geschütztes Leerzeichen (U+00A0) vor :. Fehlt das Leerzeichen ganz
 * („mot:“), wird es eingesetzt. Angefasst wird nur der Inhalt von
 * String-Literalen ('…'), nicht Kommentare oder Code; `https://` und
 * Uhrzeiten („10:00“) bleiben, weil vor dem Doppelpunkt dort kein Wort-
 * ende mit Leerzeichen steht bzw. eine Ziffer folgt.
 *
 * `src/lib/i18n/fr-style.test.ts` prüft dasselbe an den geladenen Texten.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const NNBSP = ' '
const NBSP = ' '

export function fixFrench(text) {
  return text
    // vorhandene Leerzeichen vor ; ! ? und vor : ersetzen
    .replace(/[   ]+([;!?])/g, `${NNBSP}$1`)
    .replace(/[   ]+:/g, `${NBSP}:`)
    // « und » innen
    .replace(/«[   ]*/g, `«${NNBSP}`)
    .replace(/[   ]*»/g, `${NNBSP}»`)
    // fehlendes Leerzeichen vor ; ! ? (nach Buchstabe oder schließendem Tag/Platzhalter)
    .replace(/([\p{L}}>»)])([;!?])(?=\s|$|['<])/gu, `$1${NNBSP}$2`)
    // fehlendes Leerzeichen vor : – nicht vor Ziffern (10:00) und nicht in URLs
    .replace(/([\p{L}}>»)])(:)(?=[  ]|$|['<])/gu, `$1${NBSP}$2`)
}

function fixSource(src) {
  // Nur einfache String-Literale; Escapes (\') werden mitgenommen.
  return src.replace(/'((?:[^'\\\n]|\\.)*)'/g, (m, body) => `'${fixFrench(body)}'`)
}

function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : []
  })
}

const check = process.argv.includes('--check')
let changed = 0
for (const file of walk('src/lib/i18n/fr')) {
  const src = readFileSync(file, 'utf8')
  const out = fixSource(src)
  if (out !== src) {
    changed++
    if (check) console.log('nicht geschützt:', file)
    else writeFileSync(file, out)
  }
}
if (check && changed) process.exit(1)
console.log(check ? 'französische Typografie in Ordnung' : `${changed} Datei(en) angepasst`)
