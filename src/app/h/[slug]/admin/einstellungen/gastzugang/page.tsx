import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
    </div>
  )
}
