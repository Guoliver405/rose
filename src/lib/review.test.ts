import { describe, expect, it } from 'vitest'
import { isWithinThankYouWindow, parseReviewUrl, reviewPlatform, showReviewHint } from './review'
import { zonedInstant } from './tz'

describe('parseReviewUrl', () => {
  it('liefert den geprüften Link', () => {
    expect(parseReviewUrl({ reviewUrl: 'https://g.page/r/abc/review' })).toBe('https://g.page/r/abc/review')
  })
  it('leer, fehlend oder unsicher ist aus', () => {
    expect(parseReviewUrl({})).toBeNull()
    expect(parseReviewUrl({ reviewUrl: '' })).toBeNull()
    expect(parseReviewUrl({ reviewUrl: 'javascript:alert(1)' })).toBeNull()
    expect(parseReviewUrl({ reviewUrl: 42 })).toBeNull()
  })
})

describe('reviewPlatform', () => {
  it.each([
    ['https://g.page/r/CabcXYZ/review', 'google'],
    ['https://search.google.com/local/writereview?placeid=x', 'google'],
    ['https://www.google.de/maps/place/x', 'google'],
    ['https://www.tripadvisor.de/UserReviewEdit-g1-d2', 'tripadvisor'],
    ['https://www.booking.com/hotel/de/x.html', 'booking'],
    ['https://www.holidaycheck.de/wcf/x', 'holidaycheck'],
    ['https://example.com/bewertung', 'other'],
    ['https://notgoogle.example/x', 'other'],
  ])('%s → %s', (url, platform) => {
    expect(reviewPlatform(url)).toBe(platform)
  })
})

describe('showReviewHint', () => {
  const tz = 'Europe/Berlin'
  const checkIn = zonedInstant(tz, 2026, 10, 16, 22, 30).toISOString()
  it('nicht am Anreisetag', () => {
    expect(showReviewHint(checkIn, zonedInstant(tz, 2026, 10, 16, 23, 59), tz)).toBe(false)
  })
  it('ab dem nächsten Ortstag, auch kurz nach Mitternacht', () => {
    expect(showReviewHint(checkIn, zonedInstant(tz, 2026, 10, 17, 0, 5), tz)).toBe(true)
  })
  it('rechnet in der Zeitzone des Hauses, nicht in UTC', () => {
    // 23:30 Berlin = 21:30 UTC am selben Tag; 00:30 Berlin ist UTC noch der Vortag.
    const lateIn = zonedInstant(tz, 2026, 7, 1, 23, 30).toISOString()
    expect(showReviewHint(lateIn, zonedInstant(tz, 2026, 7, 2, 0, 30), tz)).toBe(true)
  })
})

describe('isWithinThankYouWindow', () => {
  const out = '2026-10-10T10:00:00.000Z'
  it('innerhalb von sieben Tagen', () => {
    expect(isWithinThankYouWindow(out, new Date('2026-10-17T09:59:00.000Z'))).toBe(true)
  })
  it('danach nicht mehr', () => {
    expect(isWithinThankYouWindow(out, new Date('2026-10-17T10:01:00.000Z'))).toBe(false)
  })
})
