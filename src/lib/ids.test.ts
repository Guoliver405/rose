import { describe, expect, it } from 'vitest'
import { clampPinLength, DEFAULT_PIN_LENGTH, generatePin, generateToken } from './ids'

describe('clampPinLength', () => {
  it('nimmt den Default, wenn die Policy nichts Brauchbares liefert', () => {
    expect(clampPinLength(undefined)).toBe(DEFAULT_PIN_LENGTH)
    expect(clampPinLength('6')).toBe(DEFAULT_PIN_LENGTH)
    expect(clampPinLength(NaN)).toBe(DEFAULT_PIN_LENGTH)
  })

  it('klemmt auf 4 bis 8 Stellen', () => {
    expect(clampPinLength(1)).toBe(4)
    expect(clampPinLength(99)).toBe(8)
    expect(clampPinLength(5)).toBe(5)
  })

  it('hält den Default seit Phase 6c bei 6', () => {
    expect(DEFAULT_PIN_LENGTH).toBe(6)
  })
})

describe('generatePin', () => {
  it('liefert genau so viele Ziffern wie gefordert', () => {
    expect(generatePin(4)).toMatch(/^\d{4}$/)
    expect(generatePin(8)).toMatch(/^\d{8}$/)
  })

  it('nutzt ohne Argument den Default', () => {
    expect(generatePin()).toHaveLength(DEFAULT_PIN_LENGTH)
  })

  it('erzeugt nicht immer dieselbe PIN', () => {
    const pins = new Set(Array.from({ length: 50 }, () => generatePin(6)))
    expect(pins.size).toBeGreaterThan(1)
  })
})

describe('generateToken', () => {
  it('ist URL-tauglich (base64url, keine Sonderzeichen)', () => {
    expect(generateToken(24)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('erzeugt unterschiedliche Token', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken(24)))
    expect(tokens.size).toBe(50)
  })
})
