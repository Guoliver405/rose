'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-Client — ausschließlich für Realtime-Subscriptions und
 * lesende Client-Zugriffe. Alle Mutationen laufen über Server-Actions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
