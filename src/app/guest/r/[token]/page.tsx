import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/service'
import { getGuestContext } from '@/utils/guest'
import GuestLoginForm from '../../GuestLoginForm'

/**
 * QR-Deep-Link: der statische Zimmer-Token (klebt im Zimmer) bestimmt das
 * Zimmer, der Gast tippt nur noch die PIN. Der Token ist unguessbar —
 * ohne physischen Zutritt zum Zimmer ist diese Seite nicht auffindbar.
 */
export default async function GuestRoomEntryPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const ctx = await getGuestContext()
  if (ctx) redirect('/guest/status')

  const admin = createAdminClient()
  const { data: tokenRow } = await admin
    .from('room_guest_tokens')
    .select('room_id')
    .eq('token', token)
    .maybeSingle()

  const { data: room } = tokenRow
    ? await admin.from('rooms').select('number').eq('id', tokenRow.room_id).single()
    : { data: null }

  return (
    <main className="flex flex-1 flex-col justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Zimmerservice — Anmeldung</p>
      </div>

      {room ? (
        <GuestLoginForm roomToken={token} roomNumber={room.number} />
      ) : (
        <div className="rounded-xl border border-critical-pill-edge bg-critical-pill px-4 py-3 text-center">
          <p className="font-bold text-critical-deepest">Dieser Link ist ungültig.</p>
          <p className="mt-1 text-sm text-critical-deepest">
            Bitte melde dich an der Rezeption — oder nutze die Anmeldung mit
            Zimmernummer und PIN.
          </p>
        </div>
      )}
    </main>
  )
}
