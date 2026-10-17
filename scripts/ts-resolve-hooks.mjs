/** Haken zu `ts-resolve.mjs`: relative Importe ohne Endung auf `.ts` bzw. `/index.ts` auflösen. */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export async function resolve(specifier, context, next) {
  const relative = specifier.startsWith('./') || specifier.startsWith('../')
  if (relative && !/\.[a-z]+$/.test(specifier) && context.parentURL) {
    for (const suffix of ['.ts', '/index.ts']) {
      const url = new URL(specifier + suffix, context.parentURL)
      if (existsSync(fileURLToPath(url))) return next(url.href, context)
    }
  }
  return next(specifier, context)
}
