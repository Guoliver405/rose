// Baut das RoSe-Symbol (das „o“ der Wortmarke) als Vektor und schreibt es
// in alle SVGs unter Design/Logo-V15 und in src/components/brand/logo-paths.ts.
// Danach `node scripts/brand-icons.mjs` für die PNGs und Favicons.
//
//   node scripts/brand-symbol.mjs          # nur Werte ausgeben
//   node scripts/brand-symbol.mjs --write  # Dateien aktualisieren
//
// Form (19.10.2026, nach Kritik „liest sich wie ein A“): regelmäßiges
// Sechseck mit flacher Ober- und Unterkante statt des Umrisses von V15, der
// oben schmal und unten breit war. Ein Y-förmiger Steg aus der Mitte (Arme
// nach oben links und oben rechts, Stamm nach unten) teilt es in drei gleich
// große Fünfecke: rote Blüte oben, zwei grüne Blätter unten.
//
// Alle Maße hängen an der Höhe H des Sechsecks, auch der Steg: eine Breite
// für Wortmarke und Icon (15 %, etwas breiter als V15 mit 13 % bzw. 17 %),
// damit das Symbol überall gleich aussieht. Im 16-px-Favicon (Symbol ~11 px
// hoch) bleiben davon ~1,7 px Lücke, in der Fußzeile (~17 px) ~2,6 px.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SET = join(ROOT, 'Design', 'Logo-V15')

/** Breite des Y-Stegs als Anteil der Sechseck-Höhe. */
const GAP = 0.15

const PRESETS = {
  // Wortmarke: gleiche Höhe und Mitte wie V15 (Oberkante 66,05, Unterkante
  // 184,35 — leichter Überhang über die Grundlinie wie bei runden Buchstaben).
  wordmark: { cx: 245.6, cy: 125.2, h: 118.3, gap: GAP },
  // Icon-Raster 512 × 512: Sechseck 420 breit, mittig.
  icon: { cx: 256, cy: 256, h: 210 * Math.sqrt(3), gap: GAP },
}
// Eckenradien als Anteil von H: außen deutlich gerundet (macht das Sechseck
// zum „o“), an Steg und Mitte nur gebrochen.
const R_OUTER = 0.075
const R_GAP = 0.025
const R_APEX = 0.025

const deg = a => (a * Math.PI) / 180
const dir = a => [Math.cos(deg(a)), -Math.sin(deg(a))] // Bildschirm: y nach unten

/** Polygon an der Halbebene „links von der Geraden p + t·d, um off nach innen versetzt“ beschneiden. */
function clip(poly, p, d, side, off) {
  const n = side > 0 ? [-d[1], d[0]] : [d[1], -d[0]]
  const f = q => (q[0] - p[0]) * n[0] + (q[1] - p[1]) * n[1] - off
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]
    const fa = f(a), fb = f(b)
    if (fa >= 0) out.push(a)
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb)
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  }
  return out
}

/** Ecken eines konvexen Polygons (im Uhrzeigersinn) mit Radius je Ecke abrunden. */
function rounded(poly, radii) {
  const n = poly.length
  const pts = poly.map((p, i) => {
    const a = poly[(i + n - 1) % n], b = poly[(i + 1) % n]
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1])
    const u = [(a[0] - p[0]) / la, (a[1] - p[1]) / la], v = [(b[0] - p[0]) / lb, (b[1] - p[1]) / lb]
    const theta = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1])))
    let r = radii[i]
    let t = r / Math.tan(theta / 2)
    const tMax = Math.min(la, lb) / 2
    if (t > tMax) { t = tMax; r = t * Math.tan(theta / 2) }
    return { in: [p[0] + u[0] * t, p[1] + u[1] * t], out: [p[0] + v[0] * t, p[1] + v[1] * t], r }
  })
  const f = x => (Math.round(x * 100) / 100).toFixed(2).replace(/\.?0+$/, '')
  let d = `M${f(pts[0].out[0])} ${f(pts[0].out[1])}`
  for (let i = 1; i <= n; i++) {
    const c = pts[i % n]
    d += `L${f(c.in[0])} ${f(c.in[1])}A${f(c.r)} ${f(c.r)} 0 0 1 ${f(c.out[0])} ${f(c.out[1])}`
  }
  return d + 'Z'
}

/** Die drei Teile: oben (rot), rechts und links (grün). */
export function symbolPaths({ cx, cy, h, gap }) {
  const R = h / Math.sqrt(3)
  // Sechseck mit flacher Ober- und Unterkante, im Uhrzeigersinn (Bildschirm).
  const hex = [0, -60, -120, -180, -240, -300].map(a => {
    const [x, y] = dir(a)
    return [cx + R * x, cy + R * y]
  })
  const c = [cx, cy], g = (gap * h) / 2
  const arm = { ur: dir(30), ul: dir(150), dn: dir(270) }
  // Jedes Teil liegt zwischen zwei Armen; Halbebenen um den halben Steg versetzt.
  const piece = (a, b) => clip(clip(hex, c, a, -1, g), c, b, 1, g)
  const parts = {
    top: piece(arm.ur, arm.ul),
    right: piece(arm.dn, arm.ur),
    left: piece(arm.ul, arm.dn),
  }
  const isHexVertex = p => hex.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6)
  const isApex = p => Math.hypot(p[0] - cx, p[1] - cy) < gap * h * 1.2
  const out = {}
  for (const [k, poly] of Object.entries(parts)) {
    const radii = poly.map(p => h * (isHexVertex(p) ? R_OUTER : isApex(p) ? R_APEX : R_GAP))
    out[k] = rounded(poly, radii)
  }
  return out
}

export { PRESETS }
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const word = symbolPaths(PRESETS.wordmark)
const icon = symbolPaths(PRESETS.icon)

if (!process.argv.includes('--write')) {
  console.log({ word, icon })
  process.exit(0)
}

/** Ersetzt die d-Attribute der <path>-Elemente an den Positionen `at`. */
async function patchSvg(file, at, paths) {
  const full = join(SET, file)
  let i = 0
  const src = await readFile(full, 'utf8')
  const next = src.replace(/<path d="[^"]*"/g, m => {
    const k = at.indexOf(i++)
    return k < 0 ? m : `<path d="${paths[k]}"`
  })
  await writeFile(full, next)
}

const W = [word.top, word.right, word.left]
const I = [icon.top, icon.right, icon.left]
for (const v of ['dark', 'dark_transparent', 'light', 'light_transparent', 'mono_black', 'mono_white']) {
  await patchSvg(`Logo/SVG/RoSe_Logo_${v}.svg`, [1, 2, 3], W)
}
for (const f of ['Icon/SVG/RoSe_Icon_dark.svg', 'Icon/SVG/RoSe_Icon_light.svg', 'Favicon/favicon.svg',
  'Symbol/RoSe_Symbol_farbig.svg', 'Symbol/RoSe_Symbol_mono_black.svg', 'Symbol/RoSe_Symbol_mono_white.svg']) {
  await patchSvg(f, [0, 1, 2], I)
}

const ts = join(ROOT, 'src', 'components', 'brand', 'logo-paths.ts')
let src = await readFile(ts, 'utf8')
const set = (name, d) => { src = src.replace(new RegExp(`(export const ${name} = )'[^']*'`), `$1'${d}'`) }
set('WORD_SYM_TOP', word.top); set('WORD_SYM_RIGHT', word.right); set('WORD_SYM_LEFT', word.left)
set('SYMBOL_TOP', icon.top); set('SYMBOL_RIGHT', icon.right); set('SYMBOL_LEFT', icon.left)
await writeFile(ts, src)
console.log('Symbol in Logo-Set und logo-paths.ts geschrieben.')
}
