import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { clampPinLength } from '@/lib/ids'
import { clampStaleMinutes, parseCleanDefer, parseCleaningWindow, parseStayoverPolicy } from '@/lib/board'
import { listTimeZones, parseTimeZone } from '@/lib/tz'
import { logoUrlFor } from '@/utils/logo'
import HotelSettingsForm from '../HotelSettingsForm'
import LogoForm from '../LogoForm'

export default async function HotelSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getAdminContext(slug)
  if (!ctx) redirect(`/h/${slug}/admin/einstellungen`)

  const supabase = await createClient()
  const { data: hotel } = await supabase
    .from('hotels')
    .select('name, slug, policies')
    .eq('id', ctx.hotelId)
    .single()

  const policies = (hotel?.policies ?? {}) as Record<string, unknown>
  const stayover = parseStayoverPolicy(policies)
  const cleaningWindow = parseCleaningWindow(policies)
  const defer = parseCleanDefer(policies)
  const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/h/${ctx.hotelSlug}/admin/einstellungen`}
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Einstellungen
        </Link>
        <h1 className="text-xl font-black text-ink">Hotel &amp; Regeln</h1>
      </div>

      <section data-lotse="regeln.logo" className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-ink-soft">Logo</h2>
        <p className="text-sm text-ink-soft">
          Ihr Logo steht im Kopf der gedruckten Blätter — Zimmer-Aushang und Gast-Handout.
          Ohne Logo steht dort der Name des Hauses.
        </p>
        <LogoForm
          hotelSlug={ctx.hotelSlug}
          hotelName={ctx.hotelName}
          logoUrl={logoUrlFor(ctx.logoPath)}
        />
      </section>

      <HotelSettingsForm
        hotelSlug={ctx.hotelSlug}
        initial={{
          hotelName: hotel?.name ?? '',
          slug: hotel?.slug ?? '',
          portalOrigin: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
          pinLength: clampPinLength(policies.pinLength),
          cleaningStaleMinutes: clampStaleMinutes(policies.cleaningStaleMinutes),
          stayoverAutoClean: stayover.enabled,
          stayoverAutoCleanTime: `${String(stayover.hour).padStart(2, '0')}:${String(stayover.minute).padStart(2, '0')}`,
          checkoutUntil: `${String(stayover.checkoutHour).padStart(2, '0')}:${String(stayover.checkoutMinute).padStart(2, '0')}`,
          cleanDeferEnabled: defer.enabled,
          cleanDeferUntil: hhmm(defer.hour, defer.minute),
          timeZone: parseTimeZone(policies),
          timeZones: listTimeZones(),
          cleaningWindowEnabled: cleaningWindow.enabled,
          cleaningWindowStart: cleaningWindow.start,
          cleaningWindowEnd: cleaningWindow.end,
        }}
      />
    </div>
  )
}
