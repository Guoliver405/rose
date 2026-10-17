'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2 } from 'lucide-react'
import { LOCALE_NAMES, type Locale } from '@/lib/i18n/locales'
import { setLocaleAction } from '@/app/locale-actions'

/**
 * Sprach-Umschalter der Gastseiten (17.10.2026): Kürzel-Taste oben rechts,
 * darüber unsichtbar eine native Auswahl — am Handy öffnet sich die Liste
 * des Systems. Sprachen in eigener Schreibweise, keine Flaggen (Sprache ≠
 * Land). Die Wahl liegt als Cookie im Browser und gilt über den Aufenthalt
 * hinaus.
 */
export default function LanguageSwitch({ current, offered, inline = false }: {
  current: Locale
  offered: readonly Locale[]
  /** Im Textfluss statt oben rechts — etwa auf „Mein Status“ der Reinigung, wo die Ecke belegt ist. */
  inline?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  if (offered.length < 2) return null

  return (
    <div className={inline ? 'relative inline-block' : 'absolute right-5 top-5 z-10'}>
      <span className="pointer-events-none flex items-center gap-1 rounded-lg border border-edge bg-surface-elevated px-2.5 py-1.5 text-xs font-bold uppercase text-ink-soft">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : current}
        <ChevronDown className="h-3.5 w-3.5" />
      </span>
      <select
        aria-label="Sprache · Language"
        value={current}
        disabled={pending}
        onChange={e => {
          const next = e.target.value
          startTransition(async () => {
            await setLocaleAction(next)
            router.refresh()
          })
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {offered.map(l => (
          <option key={l} value={l} lang={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
    </div>
  )
}
