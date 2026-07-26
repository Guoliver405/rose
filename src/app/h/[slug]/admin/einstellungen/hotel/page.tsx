import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { clampPinLength } from '@/lib/ids'
import { clampStaleMinutes, parseCleaningWindow, parseStayoverPolicy } from '@/lib/board'
import HotelSettingsForm from '../HotelSettingsForm'

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
          cleaningWindowEnabled: cleaningWindow.enabled,
          cleaningWindowStart: cleaningWindow.start,
          cleaningWindowEnd: cleaningWindow.end,
        }}
      />
    </div>
  )
}
