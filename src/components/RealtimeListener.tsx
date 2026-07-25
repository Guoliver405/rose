'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const TABLES = ['room_states', 'stays', 'staff_log', 'service_orders', 'maid_presence'] as const

/**
 * Abonniert die statusrelevanten Tabellen und ruft debounced
 * `router.refresh()` auf (200 ms Trailing-Debounce fasst Event-Kaskaden
 * zu einem Refresh zusammen — Pattern aus HotCord).
 *
 * `token`: Access-Token der Session — PFLICHT für Events unter RLS:
 * ohne `realtime.setAuth` verbindet der Browser-Client nur mit dem
 * Publishable Key und Supabase filtert alle postgres_changes weg
 * (Lese-Policies verlangen ein Mitglieds-JWT). Gilt für ALLE Portale,
 * auch wenn die Session in den Default-Cookies liegt.
 *
 * `pollMs`: Fallback-Poll — nach Ablauf des Access-Tokens (~1 h) stirbt
 * die Realtime-Verbindung leise; der Poll hält die Ansicht am Leben und
 * liefert beim Refresh serverseitig frische Daten.
 */
export default function RealtimeListener({ token, pollMs }: { token?: string; pollMs?: number }) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    if (token) {
      supabase.realtime.setAuth(token)
    }

    const poll = pollMs ? setInterval(() => router.refresh(), pollMs) : null

    const refresh = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => router.refresh(), 200)
    }

    const channels = TABLES.map(table =>
      supabase
        .channel(`rt_${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
        .subscribe(),
    )

    return () => {
      channels.forEach(c => {
        supabase.removeChannel(c)
      })
      if (poll) clearInterval(poll)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [router, token, pollMs])

  return null
}
