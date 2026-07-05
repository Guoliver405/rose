import { createClient } from '@/utils/supabase/server'

export type ManagementContext = {
  userId: string
  hotelId: string
  displayName: string
  hotelName: string
}

/**
 * Liefert den eingeloggten Management-Kontext — oder `null`, wenn niemand
 * angemeldet ist oder der User eine Reinigungskraft ist (username gesetzt).
 *
 * Pages: `const ctx = await getManagementContext(); if (!ctx) redirect('/login')`
 * Actions: bei `null` mit `{ error }` zurückkehren, dann Admin-Client nutzen.
 */
export async function getManagementContext(): Promise<ManagementContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('hotel_id, display_name, username')
    .eq('id', user.id)
    .single()

  if (!profile || profile.username !== null) return null

  const { data: hotel } = await supabase
    .from('hotels')
    .select('name')
    .eq('id', profile.hotel_id)
    .single()

  return {
    userId: user.id,
    hotelId: profile.hotel_id,
    displayName: profile.display_name,
    hotelName: hotel?.name ?? 'Hotel',
  }
}
