import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import PersonalManager, { type MaidRow, type ReceptionRow } from './PersonalManager'

export default async function PersonalPage() {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  const [{ data: profiles }, { data: cards }, { data: cleanings }, { data: recProfiles }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, username, created_at')
        .not('username', 'is', null)
        .order('display_name'),
      supabase.from('maid_login_tokens').select('profile_id, pin'),
      supabase.from('room_states').select('cleaning_by, rooms(number)').not('cleaning_by', 'is', null),
      supabase
        .from('profiles')
        .select('id, display_name')
        .is('username', null)
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
  }))

  // E-Mails der Rezeptions-Zugänge stehen nur in auth.users → Admin-API.
  // Nur für Admins geladen — Rezeption sieht die Sektion ohnehin nicht.
  let receptionists: ReceptionRow[] = []
  if (ctx.role === 'admin' && (recProfiles ?? []).length > 0) {
    const admin = createAdminClient()
    receptionists = await Promise.all(
      (recProfiles ?? []).map(async p => {
        const { data } = await admin.auth.admin.getUserById(p.id)
        return { id: p.id, displayName: p.display_name, email: data?.user?.email ?? '—' }
      }),
    )
  }

  return (
    <PersonalManager
      maids={maids}
      receptionists={receptionists}
      canManage={ctx.role === 'admin'}
    />
  )
}
