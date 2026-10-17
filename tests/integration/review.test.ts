import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { buildWorld, destroyWorld, serviceClient, type World } from './helpers/world'
import { cookieStore, type FakeCookieStore } from './helpers/cookies'

/**
 * Danke-Seite nach dem Check-out (17.10.2026).
 *
 * Das Cookie eines beendeten Aufenthalts öffnet nichts mehr außer einer
 * Danke-Seite — und die nur unter dem eigenen Haus und nur sieben Tage lang.
 * Geprüft an der Quelle (`getEndedStay`), an den beiden Seiten und am
 * Aufenthalts-Link aus der Mail.
 */
const state = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(public readonly url: string) { super(`redirect → ${url}`) }
  }
  return { RedirectSignal, store: null as FakeCookieStore | null }
})

vi.mock('next/headers', () => ({
  cookies: async () => {
    if (!state.store) throw new Error('Kein Cookie-Speicher')
    return state.store
  },
  headers: async () => new Headers(),
}))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new state.RedirectSignal(url) },
  notFound: () => { throw new Error('notFound()') },
}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import { GUEST_COOKIE, getEndedStay } from '@/utils/guest'
import GuestThanksPage from '@/app/h/[slug]/guest/danke/page'
import GuestStatusPage from '@/app/h/[slug]/guest/status/page'
import { GET as stayLinkRoute } from '@/app/guest/s/[token]/route'

let world: World
const admin = () => serviceClient()
const REVIEW = 'https://g.page/r/itest/review'
const DAY = 24 * 60 * 60 * 1000

/** Ausgecheckter Aufenthalt; liefert Sitzungs- und ggf. Link-Token. */
async function endedStay(hotelId: string, roomId: string, daysAgo: number, link = false) {
  const session = randomBytes(24).toString('base64url')
  const guestToken = link ? randomBytes(24).toString('base64url') : null
  const { error } = await admin().from('stays').insert({
    hotel_id: hotelId, room_id: roomId, session_token: session,
    ...(link ? { access_mode: 'link', pin: null, guest_token: guestToken } : { access_mode: 'pin', pin: '123456' }),
    checked_in_at: new Date(Date.now() - (daysAgo + 2) * DAY).toISOString(),
    checked_out_at: new Date(Date.now() - daysAgo * DAY).toISOString(),
  })
  if (error) throw new Error(`endedStay: ${error.message}`)
  return { session, guestToken }
}

function browserWith(session: string) {
  state.store = cookieStore()
  state.store.set(GUEST_COOKIE, session)
}

async function redirectZiel(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn()
    return null
  } catch (e) {
    if (e instanceof state.RedirectSignal) return e.url
    throw e
  }
}

let recent: string
let old: string

beforeAll(async () => {
  world = await buildWorld()
  const { a1 } = world.alpha
  const { data: h } = await admin().from('hotels').select('policies').eq('id', a1.id).single()
  await admin().from('hotels')
    .update({ policies: { ...((h?.policies ?? {}) as object), reviewUrl: REVIEW } })
    .eq('id', a1.id)
  recent = (await endedStay(a1.id, a1.rooms['101'], 1)).session
  old = (await endedStay(a1.id, a1.rooms['102'], 8)).session
}, 120_000)

afterAll(async () => {
  if (world) await destroyWorld(world)
}, 120_000)

describe('getEndedStay', () => {
  it('liefert Haus und Bewertungslink eines kürzlich beendeten Aufenthalts', async () => {
    browserWith(recent)
    const ended = await getEndedStay()
    expect(ended?.hotelId).toBe(world.alpha.a1.id)
    expect(ended?.reviewUrl).toBe(REVIEW)
  })
  it('nach sieben Tagen nicht mehr', async () => {
    browserWith(old)
    expect(await getEndedStay()).toBeNull()
  })
})

describe('Danke-Seite und Portal', () => {
  const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

  it('Statusseite leitet nach dem Check-out auf die Danke-Seite', async () => {
    browserWith(recent)
    const { a1 } = world.alpha
    expect(await redirectZiel(() => GuestStatusPage(params(a1.slug)))).toBe(`/h/${a1.slug}/guest/danke`)
  })

  it('Danke-Seite rendert unter dem eigenen Haus', async () => {
    browserWith(recent)
    expect(await redirectZiel(() => GuestThanksPage(params(world.alpha.a1.slug)))).toBeNull()
  })

  it('unter einem fremden Haus nur die dortige Anmeldung', async () => {
    browserWith(recent)
    const { b1 } = world.beta
    expect(await redirectZiel(() => GuestStatusPage(params(b1.slug)))).toBe(`/h/${b1.slug}/guest`)
    expect(await redirectZiel(() => GuestThanksPage(params(b1.slug)))).toBe(`/h/${b1.slug}/guest`)
  })

  it('nach sieben Tagen wieder die Anmeldung', async () => {
    browserWith(old)
    const { a1 } = world.alpha
    expect(await redirectZiel(() => GuestStatusPage(params(a1.slug)))).toBe(`/h/${a1.slug}/guest`)
  })
})

describe('Aufenthalts-Link aus der Mail nach dem Check-out', () => {
  it('führt auf die Danke-Seite und setzt das Cookie', async () => {
    const { a2 } = world.alpha
    const { session, guestToken } = await endedStay(a2.id, a2.rooms['201'], 2, true)
    state.store = cookieStore()
    const res = await stayLinkRoute(
      new NextRequest(`http://localhost/guest/s/${guestToken}`),
      { params: Promise.resolve({ token: guestToken! }) },
    )
    expect(res.headers.get('location')).toBe(`http://localhost/h/${a2.slug}/guest/danke`)
    expect(state.store.get(GUEST_COOKIE)?.value).toBe(session)
  })
})
