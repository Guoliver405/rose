import { describe, expect, it } from 'vitest'
import {
  clientIp, evaluateThrottle, hashIp, IP_MAX_FAILURES, IP_WINDOW_MS, UNKNOWN_IP,
} from './login-throttle'

const MIN = 60_000

function headers(map: Record<string, string>) {
  return (name: string) => map[name] ?? null
}

describe('clientIp', () => {
  it('nimmt aus x-forwarded-for den Ursprung, also den ersten Eintrag', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' }))).toBe('203.0.113.7')
  })

  it('kommt mit IPv6 und Leerzeichen zurecht', () => {
    expect(clientIp(headers({ 'x-forwarded-for': ' 2001:db8::1 ,10.0.0.1' }))).toBe('2001:db8::1')
  })

  it('fällt auf x-real-ip zurück', () => {
    expect(clientIp(headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4')
  })

  it('liefert ohne jeden Header den Ersatzschlüssel — die Drossel gilt weiter', () => {
    expect(clientIp(headers({}))).toBe(UNKNOWN_IP)
    expect(clientIp(headers({ 'x-forwarded-for': ' , ' }))).toBe(UNKNOWN_IP)
  })
})

describe('hashIp', () => {
  it('ist stabil für dieselbe IP und verschieden für verschiedene', () => {
    expect(hashIp('203.0.113.7')).toBe(hashIp('203.0.113.7'))
    expect(hashIp('203.0.113.7')).not.toBe(hashIp('203.0.113.8'))
    expect(hashIp('203.0.113.7')).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe('evaluateThrottle', () => {
  const now = 1_800_000_000_000

  it('lässt unterhalb der Schwelle durch', () => {
    const failures = Array.from({ length: IP_MAX_FAILURES - 1 }, (_, i) => now - i * 1000)
    expect(evaluateThrottle(failures, now)).toEqual({ blocked: false })
  })

  it('sperrt ab der Schwelle', () => {
    const failures = Array.from({ length: IP_MAX_FAILURES }, (_, i) => now - i * 1000)
    expect(evaluateThrottle(failures, now)).toMatchObject({ blocked: true })
  })

  it('zählt nur Fehlversuche innerhalb des Fensters', () => {
    // 29 frische + beliebig viele alte: das Fenster ist gleitend, alte fallen raus.
    const fresh = Array.from({ length: IP_MAX_FAILURES - 1 }, (_, i) => now - i * 1000)
    const stale = Array.from({ length: 50 }, (_, i) => now - IP_WINDOW_MS - (i + 1) * 1000)
    expect(evaluateThrottle([...fresh, ...stale], now)).toEqual({ blocked: false })
  })

  it('nennt die Restzeit, bis der schwellenbildende Versuch aus dem Fenster fällt', () => {
    // 3 Versuche bei Schwelle 3: der älteste (vor 10 min) ist der Pivot,
    // Fenster 15 min → noch 5 Minuten.
    const verdict = evaluateThrottle([now - 1 * MIN, now - 4 * MIN, now - 10 * MIN], now, { max: 3 })
    expect(verdict).toEqual({ blocked: true, retryAfterMinutes: 5 })
  })

  it('rundet die Restzeit auf volle Minuten auf, mindestens eine', () => {
    const verdict = evaluateThrottle([now - 14 * MIN - 59_000], now, { max: 1 })
    expect(verdict).toEqual({ blocked: true, retryAfterMinutes: 1 })
  })

  it('verlässt sich nicht auf die Sortierung der Eingabe', () => {
    const asc = [now - 10 * MIN, now - 4 * MIN, now - 1 * MIN]
    expect(evaluateThrottle(asc, now, { max: 3 })).toEqual({ blocked: true, retryAfterMinutes: 5 })
  })
})
