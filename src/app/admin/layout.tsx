import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { logoutAction } from '@/app/login/actions'
import RealtimeListener from '@/components/RealtimeListener'

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  // Offene Bestellungen als Nav-Badge — Realtime-Refresh + revalidatePath
  // ('/admin', 'layout') halten den Zähler aktuell.
  const supabase = await createClient()
  const { count: openOrders } = await supabase
    .from('service_orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="sticky top-0 z-40 border-b border-edge bg-surface print:hidden">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-3">
          <Link href="/admin" className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
            <span className="ml-2 text-sm font-semibold text-ink-muted">{ctx.hotelName}</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-semibold text-ink-soft">
            <Link href="/admin" className="hover:text-ink">Übersicht</Link>
            <Link href="/admin/zimmer" className="hover:text-ink">Zimmer</Link>
            <Link href="/admin/personal" className="hover:text-ink">Personal</Link>
            <Link href="/admin/services" className="hover:text-ink">Services</Link>
            <Link href="/admin/einstellungen" className="hover:text-ink">Einstellungen</Link>
            <Link href="/admin/bestellungen" className="flex items-center gap-1.5 hover:text-ink">
              Bestellungen
              {(openOrders ?? 0) > 0 && (
                <span className="rounded-full bg-attention-pill px-2 py-0.5 text-xs font-bold text-attention-deepest">
                  {openOrders}
                </span>
              )}
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{ctx.displayName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <RealtimeListener />

      <main className="mx-auto w-full max-w-[1400px] flex-1 p-4">{children}</main>
    </div>
  )
}
