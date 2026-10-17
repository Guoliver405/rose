import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ChevronRight, QrCode } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { parseGuestAccessMode } from '@/lib/guest-access'
import { parseSheetLanguages } from '@/lib/guest-guide'
import GastzugangForm from '../GastzugangForm'
import { GUIDE_LANGS, sheetLanguageLabel, type GuideLang } from '@/lib/guest-guide'
import SprachenForm from '../SprachenForm'
import { UnsavedChanges } from '@/components/unsaved/UnsavedChanges'
import Rich from '@/components/i18n/Rich'
import { getMessages, parseFallbackLanguage, parseHomeLanguage } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'

/**
 * Gäste-Zugang — welcher Weg führt ins Gäste-Portal?
 *
 * Bewusst eine eigene Seite statt eines Feldes unter „Hotel & Regeln": Die
 * Wahl ist eine grundsätzliche Betriebsentscheidung, und sie braucht die
 * Gegenüberstellung beider Verfahren, um sinnvoll getroffen zu werden.
 *
 * Die QR-Aushänge hängen hier mit dran, weil sie nur im PIN-Verfahren einen
 * Sinn haben: Wer auf individuelle Zugänge umstellt, nimmt sie ab. Deshalb
 * erscheint der Abschnitt nur im PIN-Verfahren — und richtet sich nach dem
 * **gespeicherten** Verfahren, nicht nach der Karte, die gerade angeklickt ist.
 */
export default async function GastzugangPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getAdminContext(slug)
  if (!ctx) redirect(`/h/${slug}/admin/einstellungen`)
  const m = getMessages(await getAdminLocale()).admin.settings

  const supabase = await createClient()
  const { data: hotel } = await supabase
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()

  const policies = (hotel?.policies ?? {}) as Record<string, unknown>
  const mode = parseGuestAccessMode(policies)
  const [, zweite] = parseSheetLanguages(policies)

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <UnsavedChanges>
      <div className="flex items-center gap-3">
        <Link
          href={`/h/${ctx.hotelSlug}/admin/einstellungen`}
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> {m.title}
        </Link>
        <h1 className="text-xl font-black text-ink">{m.guestAccess.title}</h1>
      </div>

      <GastzugangForm
        hotelSlug={ctx.hotelSlug}
        initial={mode}
        bestaetigt={policies.guestAccessMode !== undefined}
        m={m.guestAccess}
      />

      {/* Gilt für BEIDE Verfahren: Ein Handout entsteht so oder so, und die
          Mail folgt derselben ersten Sprache. */}
      <section data-lotse="gastzugang.sprachen" className="flex flex-col gap-3 border-t border-edge pt-5">
        <h2 className="text-base font-black text-ink">{m.guestAccess.languagesSection.heading}</h2>
        <p className="text-sm text-ink-soft">
          <Rich text={m.guestAccess.languagesSection.intro} />
        </p>
        <SprachenForm
          hotelSlug={ctx.hotelSlug}
          initial={{ home: parseHomeLanguage(policies), fallback: parseFallbackLanguage(policies), second: zweite ?? null }}
          m={m.languages}
          langLabels={Object.fromEntries(GUIDE_LANGS.map(l => [l, sheetLanguageLabel(l)])) as Record<GuideLang, string>}
        />
      </section>

      {mode === 'pin' ? (
        <section data-lotse="gastzugang.aushang" className="flex flex-col gap-3 border-t border-edge pt-5">
          <h2 className="text-base font-black text-ink">{m.guestAccess.noticesSection.heading}</h2>
          <p className="text-sm text-ink-soft">{m.guestAccess.noticesSection.intro}</p>
          <Link
            href={`/h/${ctx.hotelSlug}/admin/zimmer/aushang`}
            className="flex items-center gap-4 rounded-xl border border-edge bg-surface p-4 hover:border-edge-strong"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft">
              <QrCode className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">{m.guestAccess.noticesSection.linkTitle}</span>
              <span className="block text-xs text-ink-muted">
                {m.guestAccess.noticesSection.linkDescription}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        </section>
      ) : (
        <p className="border-t border-edge pt-5 text-xs text-ink-muted">
          {m.guestAccess.noticesSection.hidden}
        </p>
      )}
      </UnsavedChanges>
    </div>
  )
}
