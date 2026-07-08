import { createClient } from '@/utils/supabase/server'

export type ManagementContext = {
  userId: string
  hotelId: string
  displayName: string
  hotelName: string
  /** 'admin' = Inhaber/Management (alles), 'reception' = Tagesgeschäft. */
  role: 'admin' | 'reception'
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
    .select('hotel_id, display_name, username, role')
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
    role: profile.role === 'reception' ? 'reception' : 'admin',
  }
}

/**
 * Wie getManagementContext, aber nur für die Admin-Rolle — Rezeptions-
 * Zugänge (und alles andere) liefern `null`.
 *
 * Admin-only-Pages: `if (!await getAdminContext()) redirect('/admin')`
 * (Layout hat Nicht-Angemeldete schon nach /login geschickt).
 * Admin-only-Actions: bei `null` mit `{ error: 'Keine Berechtigung.' }`.
 */
export async function getAdminContext(): Promise<ManagementContext | null> {
  const ctx = await getManagementContext()
  return ctx?.role === 'admin' ? ctx : null
}
