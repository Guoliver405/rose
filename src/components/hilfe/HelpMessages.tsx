'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { HelpMessages, SymbolsMessages } from '@/lib/i18n'

/**
 * Texte des Hilfe-Bereichs für die Client-Komponenten in den beiden Rahmen
 * (Haus-Layout und `KontoShell`): „?“-Knopf, Leiste und Lotsen-Karte sitzen
 * auf jeder Seite und folgen der Navigation, ohne dass der Server neu rendert
 * – sie brauchen deshalb die Texte aller Themen und Lotsen auf einmal. Der
 * Rahmen reicht sie in der Sprache der Anfrage herein; im Browser-Bundle steht
 * keine Sprachdatei (siehe `MessagesProvider`). Dazu die Zeichensprache der
 * Kacheln für die Legende.
 */
export type HelpClientMessages = { help: HelpMessages; symbols: SymbolsMessages }

const Ctx = createContext<HelpClientMessages | null>(null)

export default function HelpMessagesProvider({ value, children }: { value: HelpClientMessages; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHelpMessages(): HelpClientMessages {
  const v = useContext(Ctx)
  if (!v) throw new Error('HelpMessagesProvider fehlt im Rahmen.')
  return v
}
