import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ChevronRight, QrCode } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { parseGuestAccessMode } from '@/lib/guest-access'
import GastzugangForm from '../GastzugangForm'

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

  const supabase = await createClient()
  const { data: hotel } = await supabase
    .from('hotels').select('policies').eq('id', ctx.hotelId).single()

  const mode = parseGuestAccessMode((hotel?.policies ?? {}) as Record<string, unknown>)

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/h/${ctx.hotelSlug}/admin/einstellungen`}
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Einstellungen
        </Link>
        <h1 className="text-xl font-black text-ink">Gäste-Zugang</h1>
      </div>

      <GastzugangForm hotelSlug={ctx.hotelSlug} initial={mode} />

      {mode === 'pin' ? (
        <section className="flex flex-col gap-3 border-t border-edge pt-5">
          <h2 className="text-base font-black text-ink">QR-Aushänge für die Zimmer</h2>
          <p className="text-sm text-ink-soft">
            Im Verfahren mit festem Zimmer-QR braucht jedes Zimmer seinen Aushang. Die Codes
            werden einmal gedruckt und bleiben gültig — bis Sie einen Code erneuern, etwa wenn
            ein Aushang abhandenkommt.
          </p>
          <Link
            href={`/h/${ctx.hotelSlug}/admin/zimmer/aushang`}
            className="flex items-center gap-4 rounded-xl border border-edge bg-surface p-4 hover:border-edge-strong"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-soft">
              <QrCode className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">QR-Aushänge ansehen und drucken</span>
              <span className="block text-xs text-ink-muted">
                Eine Karte je Zimmer, eine Seite je Karte — fehlende Codes erzeugen, einzelne erneuern
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
          </Link>
        </section>
      ) : (
        <p className="border-t border-edge pt-5 text-xs text-ink-muted">
          Die QR-Aushänge für die Zimmer sind ausgeblendet, weil dieses Haus individuelle Zugänge
          nutzt. Sie erscheinen hier wieder, sobald Sie auf feste Zimmer-QR-Codes umstellen.
        </p>
      )}
    </div>
  )
}
