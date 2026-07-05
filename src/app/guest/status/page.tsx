import { redirect } from 'next/navigation'
import { getGuestContext } from '@/utils/guest'
import { guestLogoutAction } from '../actions'
import GuestSignalPanel from './GuestSignalPanel'

export default async function GuestStatusPage() {
  const ctx = await getGuestContext()
  if (!ctx) redirect('/guest')

  return (
    <main className="flex flex-1 flex-col gap-6 py-4">
      <header className="text-center">
        <p className="text-sm text-ink-muted">{ctx.hotelName}</p>
        <h1 className="text-2xl font-black text-ink">Zimmer {ctx.roomNumber}</h1>
      </header>

      <GuestSignalPanel signal={ctx.guestSignal} cleaningActive={ctx.cleaningActive} />

      <div className="mt-auto pt-6 text-center">
        <form action={guestLogoutAction}>
          <button
            type="submit"
            className="text-sm font-semibold text-ink-muted underline hover:text-ink"
          >
            Abmelden
          </button>
        </form>
      </div>
    </main>
  )
}
