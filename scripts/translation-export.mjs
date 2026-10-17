/**
 * Texte eines Bereichs zum Gegenlesen exportieren (17.10.2026):
 *
 *   node --import ./scripts/ts-resolve.mjs scripts/translation-export.mjs guest en > texte.json
 *
 * Liest die Sprachdateien direkt (Node entfernt die Typen selbst) und gibt je
 * Text Schlüssel, Ort, Erläuterung, Deutsch und Zielsprache als JSON aus. Die
 * Excel-Tabelle baut `translation-sheet.py` daraus. Erläuterungen dürfen von
 * einem Abschnitt geerbt sein (`LooseContext`, Verwaltung).
 */
const [area = 'guest', lang = 'en'] = process.argv.slice(2)
const base = new URL('../src/lib/i18n/', import.meta.url)

/** Wo Texte und Erläuterungen eines Bereichs liegen. */
const AREAS = {
  guest: { file: 'guest.ts', ctx: 'de/guest.context.ts', ctxName: 'guestContext' },
  service: { file: 'service.ts', ctx: 'de/service.context.ts', ctxName: 'serviceContext' },
  admin: { file: 'admin/index.ts', ctx: 'de/admin/context.ts', ctxName: 'adminContext' },
  mail: { file: 'mail.ts', ctx: 'de/mail.context.ts', ctxName: 'mailContext' },
  print: { file: 'print.ts', ctx: 'de/print.context.ts', ctxName: 'printContext' },
  help: { file: 'help/index.ts', ctx: 'de/help/context.ts', ctxName: 'helpContext' },
  symbols: { file: 'symbols.ts', ctx: 'de/help/context.ts', ctxName: 'symbolsContext' },
}

/** Datenfelder der Hilfe-Themen (Zeichen, Farbtöne, Link-Ziele) — keine Texte. */
const DATA_KEY = /\.(art|id|ton|icon|href)$/
const a = AREAS[area]
if (!a) throw new Error(`Unbekannter Bereich: ${area}`)

const de = (await import(new URL(`de/${a.file}`, base)))[area]
const target = (await import(new URL(`${lang}/${a.file}`, base)))[area]
const context = (await import(new URL(a.ctx, base)))[a.ctxName]

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [[`${prefix}${k}`, v]] : flatten(v, `${prefix}${k}.`),
  )
}
const get = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj)
const isCtx = v => v && typeof v === 'object' && typeof v.where === 'string'

/** Nächste Erläuterung auf dem Weg zum Text — wie `contextFor` in format.ts. */
function contextFor(key) {
  let node = context
  let found = null
  for (const part of ['', ...key.split('.')]) {
    if (part) node = node?.[part]
    if (isCtx(node)) return node
    if (isCtx(node?._)) found = node._
    if (node === undefined) break
  }
  return found
}

const rows = flatten(de).filter(([key]) => !DATA_KEY.test(key)).map(([key, text]) => ({
  key,
  where: contextFor(key)?.where ?? '',
  note: contextFor(key)?.note ?? '',
  de: text,
  target: get(target, key) ?? '',
}))
process.stdout.write(JSON.stringify({ area, lang, rows }, null, 1))
