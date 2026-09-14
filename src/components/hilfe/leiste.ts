'use client'

import { useSyncExternalStore } from 'react'

/**
 * Zustand der Hilfe-Leiste: auf oder zu, und welches Thema der Nutzer in der
 * Leiste selbst gewählt hat.
 *
 * Ein externer Store statt React-Kontext, weil Knopf (Kopfzeile), Leiste
 * (neben dem Inhalt) und die Karten des Hilfe-Hubs in drei verschiedenen
 * Bäumen sitzen — und weil der Zustand den Wechsel zwischen Haus-Layout und
 * Konto-Rahmen überleben soll: Wer im Hub „Erklärung" zu „Plan & Abrechnung"
 * wählt, landet auf `/admin/abrechnung` mit offener Leiste.
 *
 * „Offen" wird im Browser gemerkt (`localStorage`), damit ein Neuladen die
 * Leiste nicht schließt — eine Rezeption, die sich einarbeitet, lässt sie
 * tagelang offen. Die Themenwahl dagegen ist flüchtig und **an den Pfad
 * gebunden**, auf dem sie getroffen wurde: Beim Seitenwechsel gilt wieder das
 * Thema der Seite. So muss kein Effekt die Wahl „zurücksetzen" — sie ist auf
 * dem neuen Pfad schlicht nicht mehr gültig (abgeleitet, nicht nachgezogen).
 */

const EREIGNIS = 'hilfe:leiste'
const SCHLUESSEL = 'rose.hilfe.leiste'

export type LeisteZustand = {
  offen: boolean
  /**
   * Vom Nutzer in der Leiste gewähltes Thema; `id: null` heißt „Themenliste".
   * Gilt nur, solange `pfad` der aktuelle Pfad ist.
   */
  wahl: { pfad: string; id: string | null } | null
}

const ZU: LeisteZustand = { offen: false, wahl: null }

let zustand: LeisteZustand | null = null

function lies(): LeisteZustand {
  if (zustand) return zustand
  let offen = false
  try {
    offen = localStorage.getItem(SCHLUESSEL) === '1'
  } catch {
    // Privatfenster, gesperrter Speicher — dann eben zu.
  }
  zustand = { offen, wahl: null }
  return zustand
}

function schreibe(neu: LeisteZustand): void {
  zustand = neu
  try {
    localStorage.setItem(SCHLUESSEL, neu.offen ? '1' : '0')
  } catch {
    // s. o.
  }
  window.dispatchEvent(new Event(EREIGNIS))
}

export function oeffneLeiste(): void {
  schreibe({ ...lies(), offen: true })
}

export function schliesseLeiste(): void {
  schreibe({ ...lies(), offen: false })
}

export function schalteLeiste(): void {
  schreibe({ ...lies(), offen: !lies().offen })
}

/** Thema in der Leiste wählen — `null` zeigt die Themenliste. */
export function waehleThema(pfad: string, id: string | null): void {
  schreibe({ offen: true, wahl: { pfad, id } })
}

function abonniere(melde: () => void): () => void {
  window.addEventListener(EREIGNIS, melde)
  // Ein zweites Fenster desselben Browsers schreibt denselben Schlüssel.
  window.addEventListener('storage', melde)
  return () => {
    window.removeEventListener(EREIGNIS, melde)
    window.removeEventListener('storage', melde)
  }
}

/**
 * Momentaufnahme als Zeichenkette, damit `useSyncExternalStore` sie
 * vergleichen kann. Themen-Kennungen sind nie leer, deshalb steht `''` für
 * „Themenliste" ohne Mehrdeutigkeit.
 */
function momentaufnahme(): string {
  const z = lies()
  return `${z.offen ? 1 : 0}|${z.wahl ? 1 : 0}|${z.wahl?.pfad ?? ''}|${z.wahl?.id ?? ''}`
}

/** Auf dem Server ist die Leiste zu — der Browser holt den gemerkten Stand nach. */
const SERVER = '0|0||'

export function useLeiste(): LeisteZustand {
  const key = useSyncExternalStore(abonniere, momentaufnahme, () => SERVER)
  if (key === SERVER) return ZU
  const [offen, hatWahl, pfad, id] = key.split('|')
  return {
    offen: offen === '1',
    wahl: hatWahl === '1' ? { pfad, id: id || null } : null,
  }
}
