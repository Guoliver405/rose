import { NextResponse } from 'next/server'
import { runMonthlyInvoicing } from '@/utils/invoicing'
import { stripeReady } from '@/utils/stripe'

/**
 * Monatslauf — von Vercel Cron am 1. jeden Monats aufgerufen (vercel.json).
 *
 * Vercel schickt `Authorization: Bearer <CRON_SECRET>`; ohne passende
 * Variable antwortet die Route mit 503 statt zu laufen — ein vergessenes
 * Secret darf den Lauf nicht öffentlich machen. Der Lauf ist idempotent, ein
 * zweiter Aufruf erzeugt keine zweite Rechnung; `/admin` zieht den Lauf für
 * das eigene Konto ohnehin nach, der Cron ist der Komfort.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET nicht gesetzt' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!stripeReady()) return NextResponse.json({ skipped: 'Stripe nicht eingerichtet' })

  const summary = await runMonthlyInvoicing()
  console.log('[billing/run]', JSON.stringify(summary))
  return NextResponse.json(summary)
}
