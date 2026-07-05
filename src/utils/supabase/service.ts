import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// Dieser Client benutzt den Secret Key (Service Role) und UMGEHT ALLE
// RLS-REGELN! Er darf AUSSCHLIESSLICH serverseitig in Server-Actions
// oder Route-Handlern verwendet werden, niemals im Client-Code.
//
// Faustregel (aus HotCord übernommen): Alle Server-Actions, die schreiben
// oder löschen, verwenden diesen Client NACH manueller Auth-Prüfung —
// Supabase gibt bei RLS-blockierten DELETE/UPDATE keinen Fehler zurück
// ({ data: [], error: null }), Fehler würden sonst lautlos verschluckt.

export const createAdminClient = (): SupabaseClient => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
