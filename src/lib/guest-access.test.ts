import { describe, expect, it } from 'vitest'
import { parseGuestAccessMode, roomAccessUrl, stayAccessUrl } from './guest-access'

describe('parseGuestAccessMode', () => {
  it('ist ohne Einstellung der Zimmer-QR mit PIN', () => {
    // Der Default muss der Weg sein, der ohne ausgehändigtes Papier
    // funktioniert — sonst käme ein frisch registriertes Haus nicht ins
    // Gästeportal.
    expect(parseGuestAccessMode({})).toBe('pin')
  })

  it('erkennt das individuelle Verfahren', () => {
    expect(parseGuestAccessMode({ guestAccessMode: 'link' })).toBe('link')
  })

  it('fällt bei unbekannten Werten auf den sicheren Weg zurück', () => {
    // Ein Tippfehler in den Policies darf nicht dazu führen, dass Aufenthalte
    // ohne zweiten Faktor entstehen.
    expect(parseGuestAccessMode({ guestAccessMode: 'Link' })).toBe('pin')
    expect(parseGuestAccessMode({ guestAccessMode: true })).toBe('pin')
    expect(parseGuestAccessMode({ guestAccessMode: '' })).toBe('pin')
  })
})

describe('Zugangs-Adressen', () => {
  it('baut den Zimmer-QR', () => {
    expect(roomAccessUrl('https://rose-roomservice.app', 'abc')).toBe(
      'https://rose-roomservice.app/guest/r/abc',
    )
  })

  it('baut den Aufenthalts-Link', () => {
    expect(stayAccessUrl('https://rose-roomservice.app', 'xyz')).toBe(
      'https://rose-roomservice.app/guest/s/xyz',
    )
  })

  it('verträgt einen Schrägstrich am Ende der Basis', () => {
    // NEXT_PUBLIC_SITE_URL wird von Hand gepflegt — ein doppelter Schrägstrich
    // im gedruckten QR-Code fällt erst auf, wenn er nicht funktioniert.
    expect(stayAccessUrl('https://rose-roomservice.app/', 'xyz')).toBe(
      'https://rose-roomservice.app/guest/s/xyz',
    )
  })
})
