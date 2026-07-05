import { randomBytes, randomInt } from 'node:crypto'

/** Unguessbarer URL-Token (base64url), z. B. für Zimmer-QR und Stay-Sessions. */
export function generateToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url')
}

/** Numerische Gast-PIN mit kryptographischem RNG. */
export function generatePin(length = 4): string {
  return Array.from({ length }, () => randomInt(0, 10)).join('')
}

/** PIN-Länge aus der Hotel-Policy, geclampt auf 4–8. */
export function clampPinLength(value: unknown): number {
  const n = typeof value === 'number' ? Math.floor(value) : 4
  return Math.min(8, Math.max(4, Number.isFinite(n) ? n : 4))
}
