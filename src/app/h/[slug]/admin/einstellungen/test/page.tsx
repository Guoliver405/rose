import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAdminContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import TestScenarioPanel from '../TestScenarioPanel'

// VORÜBERGEHEND — Test-Szenario-Seeding, siehe ../test-actions.ts.
export default async function TestScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getAdminContext(slug)
  if (!ctx) redirect(`/h/${slug}/admin/einstellungen`)

  const supabase = await createClient()
  const { count: roomCount } = await supabase
    .from('rooms')
    .select('id', { count: 'exact', head: true })
    .eq('hotel_id', ctx.hotelId)
    .is('deactivated_at', null)

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/h/${ctx.hotelSlug}/admin/einstellungen`}
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Einstellungen
        </Link>
        <h1 className="text-xl font-black text-ink">Test-Szenario</h1>
      </div>

      <TestScenarioPanel hotelSlug={ctx.hotelSlug} roomCount={roomCount ?? 0} />
    </div>
  )
}
