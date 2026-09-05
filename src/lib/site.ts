/**
 * Öffentliche Basis-Adresse des Dienstes.
 *
 * Kommt aus `NEXT_PUBLIC_SITE_URL` (in Produktion `https://rose-roomservice.app`,
 * lokal `http://localhost:3000`) — dieselbe Quelle wie QR-Links, Aushänge und
 * Handouts. Ohne die Variable fällt es auf die Produktionsdomain zurück, damit
 * robots.txt und Sitemap im Build mit Platzhalter-Keys keine Localhost-Adresse
 * ausliefern.
 */
export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim()
  return (raw || 'https://rose-roomservice.app').replace(/\/+$/, '')
}
