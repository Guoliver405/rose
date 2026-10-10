'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/service'
import { getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'

export async function loginAction(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const e = getMessages(await getLocale()).auth.errors
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    // Unbestätigtes Simulator-Konto: Supabase verweigert die Anmeldung. Das
    // verrät nur, wer das richtige Passwort kennt — also die Person selbst.
    if (error?.code === 'email_not_confirmed') {
      return { error: e.confirmEmailFirst }
    }
    return { error: e.loginFailed }
  }

  // Reinigungskräfte (username gesetzt) gehören ins Reinigungs-Portal,
  // nicht in die Rezeption — Session sofort wieder beenden.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile) {
    // Kein Profil: vielleicht ein Konto des Housekeeping-Simulators.
    const { data: sim } = await createAdminClient()
      .from('sim_accounts')
      .select('confirmed_at')
      .eq('user_id', data.user.id)
      .maybeSingle()
    if (sim?.confirmed_at) redirect('/simulator')
    await supabase.auth.signOut()
    return sim
      ? { error: e.confirmEmailFirst }
      : { error: e.notForReception }
  }
  if (profile.username !== null) {
    await supabase.auth.signOut()
    return { error: e.notForReception }
  }

  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
