import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import PersonalManager, { type MaidRow, type ReceptionRow } from './PersonalManager'

export default async function PersonalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/admin')

  const supabase = await createClient()
  const [{ data: profiles }, { data: cards }, { data: cleanings }, { data: recProfiles }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, username, created_at, deactivated_at')
        .eq('hotel_id', ctx.hotelId)
        .not('username', 'is', null)
        .order('display_name'),
      supabase.from('maid_login_tokens').select('profile_id, pin').eq('hotel_id', ctx.hotelId),
      supabase.from('room_states').select('cleaning_by, rooms(number)').eq('hotel_id', ctx.hotelId).not('cleaning_by', 'is', null),
      // Rezeptions-Zugänge stehen seit Phase 6d in hotel_members — die
      // Berechtigung hängt dort, nicht mehr an profiles.role.
      supabase
        .from('hotel_members')
        .select('user_id, display_name')
        .eq('hotel_id', ctx.hotelId)
        .eq('role', 'reception')
        .order('display_name'),
    ])

  const pinByProfile = new Map((cards ?? []).map(c => [c.profile_id, c.pin]))
  const roomByCleaner = new Map(
    (cleanings ?? []).map(c => {
      const room = c.rooms as unknown as { number: string } | null
      return [c.cleaning_by as string, room?.number ?? '?']
    }),
  )

  const maids: MaidRow[] = (profiles ?? []).map(p => ({
    id: p.id,
    displayName: p.display_name,
    username: p.username as string,
    pin: pinByProfile.get(p.id) ?? null,
    cleaningRoom: roomByCleaner.get(p.id) ?? null,
    deactivatedAt: p.deactivated_at,
  }))

  // E-Mails der Rezeptions-Zugänge stehen nur in auth.users → Admin-API.
  // Nur für die Verwaltung geladen — die Rezeption sieht die Sektion nicht.
  let receptionists: ReceptionRow[] = []
  if (ctx.role !== 'reception' && (recProfiles ?? []).length > 0) {
    const admin = createAdminClient()
    receptionists = await Promise.all(
      (recProfiles ?? []).map(async p => {
        const { data } = await admin.auth.admin.getUserById(p.user_id)
        return { id: p.user_id, displayName: p.display_name, email: data?.user?.email ?? '—' }
      }),
    )
  }

  return (
    <PersonalManager
      hotelSlug={ctx.hotelSlug}
      maids={maids}
      receptionists={receptionists}
      canManage={ctx.role !== 'reception'}
    />
  )
}
