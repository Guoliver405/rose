'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { unreadTicketsAction } from '@/app/tickets/actions'

/**
 * Wie viele Meldungen eine ungelesene Antwort tragen – für den Punkt am „?“
 * und den Zähler in der Leiste. Ein kleiner Store, damit Knopf und Leiste
 * dieselbe Zahl zeigen und nur einmal fragen.
 *
 * Gefragt wird im Browser nach jedem Seitenwechsel, nicht beim Rendern auf
 * dem Server: Keine Seite soll auf diese Zahl warten (Roundtrips sind die
 * Latenz).
 */
const EREIGNIS = 'tickets:unread'
let count = 0
let lastPath: string | null = null

export function refreshUnread(): void {
  unreadTicketsAction()
    .then(n => {
      if (n === count) return
      count = n
      window.dispatchEvent(new Event(EREIGNIS))
    })
    .catch(() => { /* still: der Punkt fehlt dann eben */ })
}

function subscribe(cb: () => void) {
  window.addEventListener(EREIGNIS, cb)
  return () => window.removeEventListener(EREIGNIS, cb)
}

/** Zahl der ungelesenen Antworten; fragt neu, wenn sich der Pfad ändert. */
export function useUnreadTickets(pathname: string): number {
  useEffect(() => {
    if (pathname === lastPath) return
    lastPath = pathname
    refreshUnread()
  }, [pathname])
  return useSyncExternalStore(subscribe, () => count, () => 0)
}
