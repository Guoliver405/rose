import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { clampPinLength } from '@/lib/ids'
import { clampStaleMinutes, parseStayoverPolicy } from '@/lib/board'
import SettingsForm from './SettingsForm'

export default async function EinstellungenPage() {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  const { data: hotel } = await supabase
    .from('hotels')
    .select('name, policies')
    .eq('id', ctx.hotelId)
    .single()

  const policies = (hotel?.policies ?? {}) as Record<string, unknown>
  const stayover = parseStayoverPolicy(policies)

  return (
    <SettingsForm
      canManageHotel={ctx.role === 'admin'}
      initial={{
        hotelName: hotel?.name ?? '',
        pinLength: clampPinLength(policies.pinLength),
        cleaningStaleMinutes: clampStaleMinutes(policies.cleaningStaleMinutes),
        stayoverAutoClean: stayover.enabled,
        stayoverAutoCleanTime: `${String(stayover.hour).padStart(2, '0')}:${String(stayover.minute).padStart(2, '0')}`,
      }}
    />
  )
}
