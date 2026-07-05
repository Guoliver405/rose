'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { error: 'Anmeldung fehlgeschlagen — E-Mail oder Passwort falsch.' }
  }

  // Reinigungskräfte (username gesetzt) gehören ins Reinigungs-Portal,
  // nicht in die Rezeption — Session sofort wieder beenden.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .single()

  if (!profile || profile.username !== null) {
    await supabase.auth.signOut()
    return { error: 'Dieser Zugang ist nicht für die Rezeption freigeschaltet.' }
  }

  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
