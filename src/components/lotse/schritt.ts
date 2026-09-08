'use client'

import { useSyncExternalStore } from 'react'

/**
 * Der aktuelle Lotsen-Schritt, gelesen aus der Adresszeile.
 *
 * Warum nicht `useSearchParams()`? Weil der Lotse Schritte **innerhalb**
 * derselben Seite über `history.replaceState` schreibt — genau der Fall bei
 * den beiden Simulationen, die als Ganzes auf einer Seite liegen. Next
 * bekommt davon nichts mit, `useSearchParams` liefert weiter den Stand vom
 * Seitenaufruf, und die Simulation bliebe in der ersten Szene stehen.
 *
 * Deshalb ein externer Store: Die Wahrheit steht in `location.search`, und
 * `LotsePilot` schlägt bei jedem Schritt einmal an. Als Momentaufnahme dient
 * eine Zeichenkette, damit `useSyncExternalStore` sie vergleichen kann, ohne
 * bei jedem Rendern ein neues Objekt zu sehen.
 */

export const SCHRITT_EREIGNIS = 'lotse:schritt'

/** Meldet einen Schrittwechsel an alle Simulationen auf der Seite. */
export function meldeSchritt(): void {
  window.dispatchEvent(new Event(SCHRITT_EREIGNIS))
}

function abonniere(melde: () => void): () => void {
  window.addEventListener(SCHRITT_EREIGNIS, melde)
  // Zurück-Taste und externe Navigation ändern die Adresszeile ebenfalls.
  window.addEventListener('popstate', melde)
  return () => {
    window.removeEventListener(SCHRITT_EREIGNIS, melde)
    window.removeEventListener('popstate', melde)
  }
}

function momentaufnahme(): string {
  const p = new URLSearchParams(window.location.search)
  return `${p.get('lotse') ?? ''}|${p.get('schritt') ?? ''}`
}

/** Auf dem Server gibt es keine Adresszeile — und keinen laufenden Lotsen. */
const LEER = '|'

export type LotseSchritt = {
  /** Kennung des laufenden Lotsen, `null` wenn keiner läuft. */
  lotse: string | null
  /** Schritt als Zeichenkette, so wie er in der URL steht. */
  schritt: string | null
  /** Stabiler Schlüssel für „dieser Schritt" — Grundlage abgeleiteter Zustände. */
  key: string
}

export function useLotseSchritt(): LotseSchritt {
  const key = useSyncExternalStore(abonniere, momentaufnahme, () => LEER)
  const [lotse, schritt] = key.split('|')
  return { lotse: lotse || null, schritt: schritt || null, key }
}
