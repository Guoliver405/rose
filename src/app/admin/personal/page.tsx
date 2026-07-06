import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import PersonalManager, { type MaidRow } from './PersonalManager'

export default async function PersonalPage() {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  const [{ data: profiles }, { data: cards }, { data: cleanings }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, username, created_at')
      .not('username', 'is', null)
      .order('display_name'),
    supabase.from('maid_login_tokens').select('profile_id, pin'),
    supabase.from('room_states').select('cleaning_by, rooms(number)').not('cleaning_by', 'is', null),
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

  return <PersonalManager maids={maids} />
}
