// Erzeugt aus den SVGs in Design/Logo-V15 alle PNG-Fassungen des Logo-Sets
// und die App-Icons unter src/app (favicon.ico, icon.svg, apple-icon.png).
// Quelle sind allein die SVGs — wer eine Farbe ändert, ändert sie dort und
// lässt das Skript laufen:  node scripts/brand-icons.mjs
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SET = join(ROOT, 'Design', 'Logo-V15')
const APP = join(ROOT, 'src', 'app')

/** SVG in genau `width` Pixel Breite rendern (Höhe folgt dem Seitenverhältnis). */
async function png(svgFile, width, outFile, transform = s => s) {
  const svg = Buffer.from(transform(await readFile(join(SET, svgFile), 'utf8')))
  await mkdir(dirname(outFile), { recursive: true })
  const buf = await sharp(svg, { density: 600 }).resize({ width }).png().toBuffer()
  await writeFile(outFile, buf)
  return buf
}

/** ICO-Container mit eingebetteten PNGs (von allen Browsern gelesen). */
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + dir.length
  images.forEach(({ size, buf }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o); dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(offset, o + 12)
    offset += buf.length
  })
  return Buffer.concat([header, dir, ...images.map(i => i.buf)])
}

// Logo (Breite 1200 und 2400)
for (const v of ['dark', 'dark_transparent', 'light', 'light_transparent', 'mono_black', 'mono_white']) {
  for (const w of [1200, 2400]) {
    await png(`Logo/SVG/RoSe_Logo_${v}.svg`, w, join(SET, 'Logo', 'PNG', `RoSe_Logo_${v}_${w}px.png`))
  }
}
// App-Icon
for (const v of ['dark', 'light']) {
  for (const w of [180, 192, 512, 1024]) {
    await png(`Icon/SVG/RoSe_Icon_${v}.svg`, w, join(SET, 'Icon', 'PNG', `RoSe_Icon_${v}_${w}px.png`))
  }
}
// Symbol
for (const v of ['farbig', 'mono_black', 'mono_white']) {
  await png(`Symbol/RoSe_Symbol_${v}.svg`, 512, join(SET, 'Symbol', `RoSe_Symbol_${v}_512px.png`))
}

// Favicon: 16/32/48 als PNG und gebündelt als ICO
const fav = []
for (const size of [16, 32, 48]) {
  fav.push({ size, buf: await png('Favicon/favicon.svg', size, join(SET, 'Favicon', `favicon-${size}.png`)) })
}
const icoBuf = ico(fav)
await writeFile(join(SET, 'Favicon', 'favicon.ico'), icoBuf)
await writeFile(join(APP, 'favicon.ico'), icoBuf)
await copyFile(join(SET, 'Favicon', 'favicon.svg'), join(APP, 'icon.svg'))

// Apple-Icon ohne eigene Rundung: iOS rundet selbst und füllt
// durchsichtige Ecken schwarz.
const square = s => s.replace(/ rx="\d+"/, '')
const apple = await png('Favicon/favicon.svg', 180, join(APP, 'apple-icon.png'), square)
await writeFile(join(SET, 'Favicon', 'apple-touch-icon.png'), apple)

console.log('Logo-Set und App-Icons erzeugt.')
