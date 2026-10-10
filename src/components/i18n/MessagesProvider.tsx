'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AdminMessages, MailMessages } from '@/lib/i18n'

/**
 * Texte für Client-Komponenten, die an vielen Stellen sitzen und deshalb nicht
 * von jeder Seite einzeln Props bekommen sollen (bisher: die Statuszeile des
 * Mail-Versands). Das Root-Layout reicht nur diesen kleinen Ausschnitt herein —
 * die ganze Sprachdatei im Browser-Bundle wäre Ballast. Alles andere bekommt
 * seine Texte weiter als Props von der Server-Seite. Dazu die Leiste
 * „Ungespeicherte Änderungen“, die auf mehreren Einstellungsseiten gleich lautet.
 */
export type ClientMessages = {
  mail: Pick<MailMessages, 'status' | 'line'>
  unsaved: AdminMessages['overview']['unsaved']
}

const Ctx = createContext<ClientMessages | null>(null)

export default function MessagesProvider({ value, children }: { value: ClientMessages; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useClientMessages(): ClientMessages {
  const v = useContext(Ctx)
  if (!v) throw new Error('MessagesProvider fehlt im Root-Layout.')
  return v
}
