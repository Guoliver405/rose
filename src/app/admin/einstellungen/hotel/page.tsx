import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { clampPinLength } from '@/lib/ids'
import { clampStaleMinutes, parseStayoverPolicy } from '@/lib/board'
import HotelSettingsForm from '../HotelSettingsForm'

export default async function HotelSettingsPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/admin/einstellungen')

  const supabase = await createClient()
  const { data: hotel } = await supabase
    .from('hotels')
    .select('name, policies')
    .eq('id', ctx.hotelId)
    .single()

  const policies = (hotel?.policies ?? {}) as Record<string, unknown>
  const stayover = parseStayoverPolicy(policies)

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/einstellungen"
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Einstellungen
        </Link>
        <h1 className="text-xl font-black text-ink">Hotel &amp; Regeln</h1>
      </div>

      <HotelSettingsForm
        initial={{
          hotelName: hotel?.name ?? '',
          pinLength: clampPinLength(policies.pinLength),
          cleaningStaleMinutes: clampStaleMinutes(policies.cleaningStaleMinutes),
          stayoverAutoClean: stayover.enabled,
          stayoverAutoCleanTime: `${String(stayover.hour).padStart(2, '0')}:${String(stayover.minute).padStart(2, '0')}`,
        }}
      />
    </div>
  )
}
