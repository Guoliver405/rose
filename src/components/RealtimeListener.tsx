'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const TABLES = ['room_states', 'stays', 'staff_log', 'service_orders'] as const

/**
 * Abonniert die statusrelevanten Tabellen und ruft debounced
 * `router.refresh()` auf (200 ms Trailing-Debounce fasst Event-Kaskaden
 * zu einem Refresh zusammen — Pattern aus HotCord).
 */
export default function RealtimeListener() {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

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
  }, [router])

  return null
}
