import { redirect } from 'next/navigation'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import PersonalManager, { type MaidRow, type ManagerRow, type ReceptionRow } from './PersonalManager'

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
        .select('user_id, display_name, deactivated_at')
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
        return {
          id: p.user_id,
          displayName: p.display_name,
          email: data?.user?.email ?? '—',
          // Eingeladen, aber noch nie angenommen: Supabase bestätigt die
          // Adresse erst, wenn die Person den Link geöffnet hat.
          pending: !data?.user?.email_confirmed_at,
          deactivatedAt: p.deactivated_at,
        }
      }),
    )
  }

  // Manager DIESES Hauses — und die übrigen Manager des Kontos, die sich hier
  // zusätzlich einsetzen lassen. Beides nur für den Kontoinhaber: ein Manager,
  // der Mit-Manager ernennt, wäre eine Rechteausweitung.
  let managers: ManagerRow[] = []
  let verfuegbareManager: ManagerRow[] = []
  if (ctx.isOwner) {
    const admin = createAdminClient()

    const { data: ownHotels } = await admin
      .from('hotels').select('id').eq('account_id', ctx.accountId)
    const ownIds = (ownHotels ?? []).map(h => h.id)

    const { data: rows } = await admin
      .from('hotel_members')
      .select('user_id, hotel_id, display_name, deactivated_at')
      .eq('role', 'manager')
      .in('hotel_id', ownIds)

    // Beendete Zugänge dieses Hauses gehören mit in die Liste — nur dort
    // lassen sie sich wieder aktivieren.
    const hierRows = (rows ?? []).filter(r => r.hotel_id === ctx.hotelId)
    const hierIds = new Set(hierRows.map(r => r.user_id))
    const beendetHier = new Map(hierRows.map(r => [r.user_id, r.deactivated_at as string | null]))

    // Wie viele Häuser betreut die Person insgesamt? Macht sichtbar, dass ein
    // Entzug hier die anderen Häuser nicht berührt — beendete zählen nicht mit.
    const haeuserProUser = new Map<string, number>()
    const nameProUser = new Map<string, string>()
    for (const r of rows ?? []) {
      if (!r.deactivated_at) {
        haeuserProUser.set(r.user_id, (haeuserProUser.get(r.user_id) ?? 0) + 1)
      }
      nameProUser.set(r.user_id, r.display_name)
    }

    const zeile = async (userId: string): Promise<ManagerRow> => {
      const { data } = await admin.auth.admin.getUserById(userId)
      return {
        id: userId,
        displayName: nameProUser.get(userId) ?? '—',
        email: data?.user?.email ?? '—',
        hotelCount: haeuserProUser.get(userId) ?? 0,
        pending: !data?.user?.email_confirmed_at,
        deactivatedAt: beendetHier.get(userId) ?? null,
      }
    }

    managers = await Promise.all([...hierIds].map(zeile))
    verfuegbareManager = await Promise.all(
      [...new Set((rows ?? []).map(r => r.user_id))]
        .filter(userId => !hierIds.has(userId))
        .map(zeile),
    )

    const nachName = (a: ManagerRow, b: ManagerRow) =>
      a.displayName.localeCompare(b.displayName, 'de')
    managers.sort(nachName)
    verfuegbareManager.sort(nachName)
  }

  return (
    <PersonalManager
      hotelSlug={ctx.hotelSlug}
      maids={maids}
      receptionists={receptionists}
      managers={managers}
      verfuegbareManager={verfuegbareManager}
      canManage={ctx.role !== 'reception'}
      isOwner={ctx.isOwner}
    />
  )
}
