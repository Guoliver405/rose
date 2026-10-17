/**
 * Texte eines Bereichs zum Gegenlesen exportieren (17.10.2026):
 *
 *   node scripts/translation-export.mjs guest en > texte.json
 *
 * Liest die Sprachdateien direkt (Node entfernt die Typen selbst) und gibt je
 * Text Schlüssel, Ort, Erläuterung, Deutsch und Zielsprache als JSON aus. Die
 * Excel-Tabelle baut `translation-sheet.py` daraus.
 */
const [area = 'guest', lang = 'en'] = process.argv.slice(2)
const base = new URL('../src/lib/i18n/', import.meta.url)

const de = (await import(new URL(`de/${area}.ts`, base)))[area]
const target = (await import(new URL(`${lang}/${area}.ts`, base)))[area]
const context = (await import(new URL(`de/${area}.context.ts`, base)))[`${area}Context`]

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' || (v && typeof v.where === 'string')
      ? [[`${prefix}${k}`, v]]
      : flatten(v, `${prefix}${k}.`),
  )
}
const get = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj)

const rows = flatten(de).map(([key, text]) => ({
  key,
  where: get(context, key)?.where ?? '',
  note: get(context, key)?.note ?? '',
  de: text,
  target: get(target, key) ?? '',
}))
process.stdout.write(JSON.stringify({ area, lang, rows }, null, 1))
