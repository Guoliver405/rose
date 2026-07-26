import { randomBytes, randomInt } from 'node:crypto'

/** Unguessbarer URL-Token (base64url), z. B. für Zimmer-QR und Stay-Sessions. */
export function generateToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url')
}

/**
 * Standard-Länge der Gast-PIN. 4 Ziffern (10.000 Kombinationen) tragen bei
 * einem Haus, nicht bei tausenden gleichzeitigen Aufenthalten über alle
 * Mandanten — deshalb seit dem Mandanten-Umbau 6. Pro Hotel weiter über
 * `policies.pinLength` einstellbar (4–8).
 */
export const DEFAULT_PIN_LENGTH = 6

/** Numerische Gast-PIN mit kryptographischem RNG. */
export function generatePin(length = DEFAULT_PIN_LENGTH): string {
  return Array.from({ length }, () => randomInt(0, 10)).join('')
}

/** PIN-Länge aus der Hotel-Policy, geclampt auf 4–8. */
export function clampPinLength(value: unknown): number {
  const n = typeof value === 'number' ? Math.floor(value) : DEFAULT_PIN_LENGTH
  return Math.min(8, Math.max(4, Number.isFinite(n) ? n : DEFAULT_PIN_LENGTH))
}
