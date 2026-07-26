import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import ZugangForm from '../ZugangForm'

/**
 * „Mein Zugang" — Anzeigename und Passwort der angemeldeten Person.
 *
 * Löst die frühere Seite `…/einstellungen/passwort` ab. Der Anzeigename kam
 * dazu, weil er bis dahin **gar nicht** änderbar war: die Kontoinhaber der
 * ersten Stunde hießen in der Kopfzeile „Rezeption", weil die Migration diesen
 * Namen aus den Alt-Profilen übernommen hatte, und es gab keinen Weg, das
 * selbst zu korrigieren.
 *
 * Für jede Rolle zugänglich — es geht um den eigenen Zugang, nicht um das Haus.
 */
const ROLLEN_TEXT = {
  admin: 'Inhaber',
  manager: 'Manager',
  reception: 'Rezeption',
} as const

export default async function ZugangPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getManagementContext(slug)
  if (!ctx) redirect('/login')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/h/${ctx.hotelSlug}/admin/einstellungen`}
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Einstellungen
        </Link>
        <h1 className="text-xl font-black text-ink">Mein Zugang</h1>
      </div>

      <ZugangForm
        hotelSlug={ctx.hotelSlug}
        displayName={ctx.displayName}
        email={user?.email ?? '—'}
        rolle={ROLLEN_TEXT[ctx.role]}
      />
    </div>
  )
}
