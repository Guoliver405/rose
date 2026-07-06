/**
 * Preis-Helfer für den Service-Baukasten. Preise sind reine Anzeige-Info
 * (optional, keine Abrechnung) und werden als Cents gespeichert.
 */

/** "4,50" / "4.50" / "4" → 450. Leer/ungültig → null (= ohne Preisangabe). */
export function parseEuroToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/€/g, '').replace(/\s/g, '')
  if (!cleaned) return null
  const normalized = cleaned.replace(',', '.')
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
