import { randomBytes, randomInt } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildWorld, destroyWorld, serviceClient, type World } from './helpers/world'
import { cookieStore, type FakeCookieStore } from './helpers/cookies'
import { hashIp, IP_MAX_FAILURES } from '@/lib/login-throttle'

/**
 * Die beiden Login-Actions — `guestLoginAction` und `maidLoginAction`.
 *
 * Beide lösen eine nur JE HAUS eindeutige Kennung auf (Zimmernummer bzw.
 * Benutzername) und müssen dabei am Slug aus der URL hängen bleiben. Die
 * Testwelt hält genau diese Kollisionen bereit: Zimmer 101 in A1 und B1,
 * dieselbe Reinigungskraft „maria" in A1 und B1.
 *
 * Der wertvollste Einzelfall ist das Rate-Limit: fünf Fehlversuche sperren
 * nur den eigenen Aufenthalt — nicht das Nachbarzimmer, nicht die 101 im
 * anderen Haus. Dazu seit 05.09.2026 die zweite Schranke, die IP-Drossel über
 * alle Häuser hinweg.
 *
 * Gerüst: `next/headers` liefert einen Cookie-Speicher im Arbeitsspeicher und
 * eine steuerbare Absender-IP; `redirect()` wirft wie in Next ein Signal, das
 * die Tests auffangen und auf das Ziel prüfen.
 */
const state = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(public readonly url: string) { super(`redirect → ${url}`) }
  }
  return {
    RedirectSignal,
    store: null as FakeCookieStore | null,
    ip: '203.0.113.1',
  }
})

vi.mock('next/headers', () => ({
  cookies: async () => {
    if (!state.store) throw new Error('Kein Cookie-Speicher — frischerBrowser() vergessen?')
    return state.store
  },
  headers: async () => new Headers({ 'x-forwarded-for': state.ip }),
}))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new state.RedirectSignal(url) },
  notFound: () => { throw new Error('notFound()') },
}))

vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

// Statische Importe — `vi.mock` wird darüber gehoben und greift trotzdem.
import { guestLoginAction } from '@/app/guest/actions'
import { maidLoginAction } from '@/app/h/[slug]/service/login/actions'

let world: World
const admin = () => serviceClient()

/** Neuer Browser: leere Cookies. Optional eine andere Absender-IP. */
function frischerBrowser(ip?: string): FakeCookieStore {
  state.store = cookieStore()
  if (ip) state.ip = ip
  return state.store
}

/** Führt eine Action aus, die umleiten MUSS, und liefert das Ziel. */
async function redirectZiel(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn()
  } catch (e) {
    if (e instanceof state.RedirectSignal) return e.url
    throw e
  }
  throw new Error('Die Action hat nicht umgeleitet.')
}

/**
 * Test-IPs: zufälliges Netz je Lauf (damit sich parallele Läufe die Drossel
 * nicht teilen), fortlaufender Host innerhalb des Laufs (damit zwei Aufrufe
 * nie dieselbe IP liefern).
 */
const ipNetz = `10.${randomInt(0, 256)}.${randomInt(0, 256)}`
let ipHost = 1
function zufallsIp(): string {
  return `${ipNetz}.${ipHost++}`
}

const PIN = { a101: '111111', a102: '222222', b101: '333333' }
const TOKEN_A102 = randomBytes(24).toString('base64url')
const benutzteIps: string[] = []

async function stay(hotelId: string, roomId: string, pin: string | null): Promise<string> {
  const row = pin
    ? { hotel_id: hotelId, room_id: roomId, pin, access_mode: 'pin' }
    : { hotel_id: hotelId, room_id: roomId, pin: null, access_mode: 'link', guest_token: randomBytes(24).toString('base64url') }
  const { data, error } = await admin()
    .from('stays')
    .insert({ ...row, session_token: randomBytes(24).toString('base64url') })
    .select('id')
    .single()
  if (error || !data) throw new Error(`stay(${roomId}): ${error?.message}`)
  return data.id as string
}

async function stayZeile(roomId: string) {
  const { data } = await admin()
    .from('stays')
    .select('pin_attempts, pin_locked_until, session_token')
    .eq('room_id', roomId)
    .is('checked_out_at', null)
    .single()
  return data!
}

beforeAll(async () => {
  world = await buildWorld()
  const { alpha, beta } = world
  await Promise.all([
    stay(alpha.a1.id, alpha.a1.rooms['101'], PIN.a101),
    stay(alpha.a1.id, alpha.a1.rooms['102'], PIN.a102),
    stay(beta.b1.id, beta.b1.rooms['101'], PIN.b101),
    // A2/201 läuft im Link-Verfahren — ohne PIN.
    stay(alpha.a2.id, alpha.a2.rooms['201'], null),
    admin().from('room_guest_tokens').insert({
      room_id: alpha.a1.rooms['102'], hotel_id: alpha.a1.id, token: TOKEN_A102,
    }),
  ])
  const ip = zufallsIp()
  benutzteIps.push(ip)
  frischerBrowser(ip)
}, 120_000)

afterAll(async () => {
  // Die Fehlversuchs-Zeilen tragen zwar das Haus (Kaskade), aber bei
  // unbekanntem Slug keines — deshalb ausdrücklich über die eigenen IPs weg.
  if (benutzteIps.length > 0) {
    await admin().from('guest_login_failures').delete().in('ip_hash', benutzteIps.map(hashIp))
  }
  if (world) await destroyWorld(world)
}, 120_000)

describe('guestLoginAction — Zimmernummer + PIN unter dem Slug', () => {
  it('meldet mit richtiger PIN an: Cookie trägt den Session-Token, Ziel ist das eigene Haus', async () => {
    const store = frischerBrowser()
    const ziel = await redirectZiel(() =>
      guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '101', pin: PIN.a101 }),
    )
    expect(ziel).toBe(`/h/${world.alpha.a1.slug}/guest/status`)
    const zeile = await stayZeile(world.alpha.a1.rooms['101'])
    expect(store.map.get('rose_guest')).toBe(zeile.session_token)
  })

  it('öffnet mit der PIN aus A1 nicht die 101 im fremden Haus B1', async () => {
    frischerBrowser()
    const res = await guestLoginAction({ hotelSlug: world.beta.b1.slug, roomNumber: '101', pin: PIN.a101 })
    expect(res.error).toMatch(/fehlgeschlagen/)

    // Der Fehlversuch landet beim Aufenthalt, den man tatsächlich angesprochen hat.
    expect((await stayZeile(world.beta.b1.rooms['101'])).pin_attempts).toBe(1)
    expect((await stayZeile(world.alpha.a1.rooms['101'])).pin_attempts).toBe(0)
  })

  it('gibt bei unbekanntem Slug und unbekanntem Zimmer dieselbe generische Meldung', async () => {
    frischerBrowser()
    const fremd = await guestLoginAction({ hotelSlug: 'gibt-es-nicht', roomNumber: '101', pin: PIN.a101 })
    const leer = await guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '999', pin: PIN.a101 })
    expect(fremd.error).toBe(leer.error)
  })

  it('nimmt einen Aufenthalt im Link-Verfahren nicht einmal als Kandidaten', async () => {
    frischerBrowser()
    const res = await guestLoginAction({ hotelSlug: world.alpha.a2.slug, roomNumber: '201', pin: '000000' })
    expect(res.error).toMatch(/fehlgeschlagen/)
    // Kein Zähler läuft auf einem Aufenthalt, den niemand per PIN öffnen kann.
    expect((await stayZeile(world.alpha.a2.rooms['201'])).pin_attempts).toBe(0)
  })
})

describe('guestLoginAction — Rate-Limit je Aufenthalt', () => {
  it('sperrt nach fünf Fehlversuchen NUR den eigenen Aufenthalt', async () => {
    frischerBrowser()
    for (let i = 0; i < 5; i++) {
      const res = await guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '101', pin: '999999' })
      expect(res.error).toMatch(/fehlgeschlagen/)
    }

    // Gesperrt: auch die RICHTIGE PIN kommt nicht mehr durch.
    const gesperrt = await guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '101', pin: PIN.a101 })
    expect(gesperrt.error).toMatch(/Zu viele Fehlversuche — bitte in \d+ Min\./)
    const a101 = await stayZeile(world.alpha.a1.rooms['101'])
    expect(a101.pin_locked_until).not.toBeNull()
    expect(a101.pin_attempts).toBe(0)

    // Nachbarzimmer im selben Haus: unberührt, meldet an.
    expect((await stayZeile(world.alpha.a1.rooms['102'])).pin_attempts).toBe(0)
    frischerBrowser()
    expect(await redirectZiel(() =>
      guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '102', pin: PIN.a102 }),
    )).toBe(`/h/${world.alpha.a1.slug}/guest/status`)

    // Dieselbe Zimmernummer im anderen Haus: unberührt, meldet an.
    frischerBrowser()
    expect(await redirectZiel(() =>
      guestLoginAction({ hotelSlug: world.beta.b1.slug, roomNumber: '101', pin: PIN.b101 }),
    )).toBe(`/h/${world.beta.b1.slug}/guest/status`)
    // Der Erfolg setzt den Zähler aus dem Cross-Haus-Test oben zurück.
    expect((await stayZeile(world.beta.b1.rooms['101'])).pin_attempts).toBe(0)
  })
})

describe('guestLoginAction — Zimmer-QR (Token, mandantenfrei)', () => {
  it('meldet über den Token mit richtiger PIN an und leitet in das Haus des Aufenthalts', async () => {
    const store = frischerBrowser()
    const ziel = await redirectZiel(() => guestLoginAction({ roomToken: TOKEN_A102, pin: PIN.a102 }))
    expect(ziel).toBe(`/h/${world.alpha.a1.slug}/guest/status`)
    expect(store.map.get('rose_guest')).toBe((await stayZeile(world.alpha.a1.rooms['102'])).session_token)
  })

  it('weist einen unbekannten Token generisch ab', async () => {
    frischerBrowser()
    const res = await guestLoginAction({ roomToken: 'kein-echter-token', pin: PIN.a102 })
    expect(res.error).toMatch(/fehlgeschlagen/)
  })
})

describe('guestLoginAction — IP-Drossel über alle Häuser', () => {
  it('sperrt eine IP nach zu vielen Fehlversuchen auch für die richtige PIN — andere IPs nicht', async () => {
    const ip = zufallsIp()
    benutzteIps.push(ip)
    const hash = hashIp(ip)

    // Vorgeschichte direkt eintragen: zwei unter der Schwelle. Die letzten
    // beiden Fehlversuche laufen echt durch die Action — sie muss sie zählen.
    const jetzt = Date.now()
    await admin().from('guest_login_failures').insert(
      Array.from({ length: IP_MAX_FAILURES - 2 }, (_, i) => ({
        ip_hash: hash,
        hotel_id: world.alpha.a1.id,
        attempted_at: new Date(jetzt - (i + 1) * 1000).toISOString(),
      })),
    )

    frischerBrowser(ip)
    // Unbekannte Zimmer: kein Aufenthalts-Zähler wird berührt, nur die IP zählt.
    expect((await guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '901', pin: '000000' })).error)
      .toMatch(/fehlgeschlagen/)
    expect((await guestLoginAction({ hotelSlug: world.beta.b1.slug, roomNumber: '901', pin: '000000' })).error)
      .toMatch(/fehlgeschlagen/)

    const { count } = await admin()
      .from('guest_login_failures').select('*', { count: 'exact', head: true }).eq('ip_hash', hash)
    expect(count).toBe(IP_MAX_FAILURES)

    // Schwelle erreicht: die richtige PIN wird mit der IP-Meldung abgewiesen,
    // und es wird gar nicht erst gezählt oder am Aufenthalt gerührt.
    const gesperrt = await guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '102', pin: PIN.a102 })
    expect(gesperrt.error).toMatch(/aus diesem Netz/)
    expect((await stayZeile(world.alpha.a1.rooms['102'])).pin_attempts).toBe(0)

    // Eine andere IP ist nicht betroffen.
    const andere = zufallsIp()
    benutzteIps.push(andere)
    frischerBrowser(andere)
    expect(await redirectZiel(() =>
      guestLoginAction({ hotelSlug: world.alpha.a1.slug, roomNumber: '102', pin: PIN.a102 }),
    )).toBe(`/h/${world.alpha.a1.slug}/guest/status`)

    // Erfolge zählen nicht.
    const { count: nachErfolg } = await admin()
      .from('guest_login_failures').select('*', { count: 'exact', head: true }).eq('ip_hash', hashIp(andere))
    expect(nachErfolg).toBe(0)
  })
})

function formular(felder: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(felder)) fd.set(k, v)
  return fd
}

describe('maidLoginAction — Benutzername + PIN unter dem Slug', () => {
  it('meldet die Kraft ihres Hauses an und schreibt svc_-Cookies', async () => {
    const store = frischerBrowser()
    const { maid, a1 } = world.alpha
    const ziel = await redirectZiel(() =>
      maidLoginAction(formular({ slug: a1.slug, username: maid.username, pin: maid.password })),
    )
    expect(ziel).toBe(`/h/${a1.slug}/service`)
    const namen = [...store.map.keys()]
    expect(namen.length).toBeGreaterThan(0)
    expect(namen.every(n => n.startsWith('svc_'))).toBe(true)
  })

  it('weist die Namensvetterin des anderen Hauses mit ihrer eigenen PIN ab', async () => {
    frischerBrowser()
    const { maid: alphaMaid } = world.alpha
    const { b1 } = world.beta
    // Gleicher Benutzername, aber die PIN aus A1 — unter dem Slug von B1.
    const ziel = await redirectZiel(() =>
      maidLoginAction(formular({ slug: b1.slug, username: alphaMaid.username, pin: alphaMaid.password })),
    )
    expect(ziel).toBe(`/h/${b1.slug}/service/login?error=invalid`)
  })

  it('meldet die Namensvetterin unter IHREM Slug mit IHRER PIN an', async () => {
    frischerBrowser()
    const { maid, b1 } = world.beta
    expect(await redirectZiel(() =>
      maidLoginAction(formular({ slug: b1.slug, username: maid.username, pin: maid.password })),
    )).toBe(`/h/${b1.slug}/service`)
  })

  it('weist eine Kraft mit beendetem Zugang ab — ohne Hinweis', async () => {
    const { maid, b1 } = world.beta
    await admin().from('profiles').update({ deactivated_at: new Date().toISOString() }).eq('id', maid.id)
    try {
      frischerBrowser()
      expect(await redirectZiel(() =>
        maidLoginAction(formular({ slug: b1.slug, username: maid.username, pin: maid.password })),
      )).toBe(`/h/${b1.slug}/service/login?error=invalid`)
    } finally {
      await admin().from('profiles').update({ deactivated_at: null }).eq('id', maid.id)
    }
  })

  it('führt bei unbekanntem Slug auf die mandantenfreie Hinweisseite', async () => {
    frischerBrowser()
    expect(await redirectZiel(() =>
      maidLoginAction(formular({ slug: 'gibt-es-nicht', username: 'x', pin: 'y' })),
    )).toBe('/service/login')
  })

  it('verlangt beide Felder', async () => {
    frischerBrowser()
    expect(await redirectZiel(() =>
      maidLoginAction(formular({ slug: world.alpha.a1.slug, username: 'x', pin: '' })),
    )).toBe(`/h/${world.alpha.a1.slug}/service/login?error=missing`)
  })
})
