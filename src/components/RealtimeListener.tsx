'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const TABLES = ['room_states', 'stays', 'staff_log', 'service_orders'] as const

/**
 * Abonniert die statusrelevanten Tabellen und ruft debounced
 * `router.refresh()` auf (200 ms Trailing-Debounce fasst Event-Kaskaden
 * zu einem Refresh zusammen — Pattern aus HotCord).
 *
 * `token`: Access-Token für Portale, deren Session nicht in den
 * Default-Cookies liegt (Service-Portal, svc_-Namespace) — ohne
 * `realtime.setAuth` würde RLS die postgres_changes-Events blocken.
 */
export default function RealtimeListener({ token }: { token?: string }) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    if (token) {
      supabase.realtime.setAuth(token)
    }

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
      if (timer.current) clearTimeout(timer.current)
    }
  }, [router, token])

  return null
}
