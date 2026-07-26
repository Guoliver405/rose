/**
 * Hotel-Slug — der Mandant in der URL (`/h/<slug>/guest`).
 *
 * Regeln: nur `[a-z0-9-]`, keine Bindestriche am Rand, max. 60 Zeichen.
 * Deutsche Umlaute werden entfaltet (ä → ae), damit „Café Röslein" nicht zu
 * `caf-r-slein` zerfällt. Dieselben Regeln standen als `rose_slugify` in der
 * Backfill-Migration `Supabase_sql/archive/2026-07-26_hotels_slug.sql` — die
 * SQL-Fassung war einmalig für den Bestand (und wird dort am Ende wieder
 * gedroppt), maßgeblich ist ab jetzt diese hier.
 */

export const SLUG_MAX_LENGTH = 60

const UMLAUTE: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue', ß: 'ss',
}

/** Kombinierende Akzente aus der NFD-Zerlegung (é → e + U+0301). */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Hotelname → Slug-Kandidat. Liefert `'hotel'`, wenn nichts übrig bleibt. */
export function slugify(raw: string): string {
  const slug = raw
    .replace(/[äöüÄÖÜß]/g, c => UMLAUTE[c])
    .toLowerCase()
    // Akzente (é, à, ñ …) auf den Grundbuchstaben zurückführen, statt sie
    // wie jedes andere Sonderzeichen zu einem Bindestrich zu machen.
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '')

  return slug || 'hotel'
}

/** Prüft einen vom Nutzer eingegebenen Slug (Hotel-Einstellungen). */
export function isValidSlug(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= SLUG_MAX_LENGTH &&
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value)
  )
}

/**
 * Freien Slug finden: `basis`, sonst `basis-2`, `basis-3`, … Der Zähler startet
 * bei 2, damit das erste Hotel den unverzierten Slug behält.
 */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let n = 2; n < 1000; n++) {
    const suffix = `-${n}`
    const candidate = base.slice(0, SLUG_MAX_LENGTH - suffix.length) + suffix
    if (!used.has(candidate)) return candidate
  }
  throw new Error('Kein freier Slug gefunden')
}
