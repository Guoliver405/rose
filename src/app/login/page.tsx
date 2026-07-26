import { redirect } from 'next/navigation'
import { listAccessibleHotels } from '@/utils/auth'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  // Wohin nach dem Anmelden? Wer die Häuser-Seite überhaupt bedienen kann —
  // Inhaber und Manager — landet dort: sie trägt Konto, Häuser und den Weg,
  // ein weiteres anzulegen. Die Rezeption kennt nur ihr eigenes Haus und hat
  // dort nichts zu holen, sie geht direkt ins Tagesgeschäft.
  const hotels = await listAccessibleHotels()
  if (hotels.length > 0) {
    const nurRezeption = hotels.every(h => h.role === 'reception')
    redirect(nurRezeption ? `/h/${hotels[0].slug}/admin` : '/admin')
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-ink">
          Ro<span className="text-blocked">Se</span>
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Rezeption — Anmeldung</p>
      </div>
      <LoginForm />
    </main>
  )
}
