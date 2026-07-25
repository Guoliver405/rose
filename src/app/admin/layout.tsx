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

  // Offene Service-Anfragen als Nav-Badge — Realtime-Refresh + revalidatePath
  // ('/admin', 'layout') halten den Zähler aktuell. urgent kommt aus der
  // Service-Definition; bei mindestens einer dringenden Anfrage blinkt die
  // Badge rot.
  const supabase = await createClient()

  // Access-Token für Realtime: ohne setAuth blockt RLS alle
  // postgres_changes-Events (siehe RealtimeListener).
  const { data: { session } } = await supabase.auth.getSession()
  const { data: openOrderRows } = await supabase
    .from('service_orders')
    .select('id, service_definitions(urgent)')
    .eq('status', 'open')
  const openOrders = (openOrderRows ?? []).length
  const hasUrgentOrder = (openOrderRows ?? []).some(o => {
    const def = Array.isArray(o.service_definitions) ? o.service_definitions[0] : o.service_definitions
    return def?.urgent === true
  })

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="sticky top-0 z-40 border-b border-edge bg-surface print:hidden">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-3">
          <Link href="/admin" className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
            <span className="ml-2 text-sm font-semibold text-ink-muted">{ctx.hotelName}</span>
          </Link>

          {/* Setup-Bereiche (Zimmer/Personal/Services/Aushänge) liegen im
              Einstellungen-Hub — die Nav trägt nur das Tagesgeschäft. */}
          <nav className="flex items-center gap-4 text-sm font-semibold text-ink-soft">
            <Link href="/admin" className="hover:text-ink">Übersicht</Link>
            <Link href="/admin/bestellungen" className="flex items-center gap-1.5 hover:text-ink">
              Services
              {openOrders > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    hasUrgentOrder
                      ? 'blink-icon bg-critical-pill text-critical-deepest'
                      : 'bg-attention-pill text-attention-deepest'
                  }`}
                >
                  {openOrders}
                </span>
              )}
            </Link>
            <Link href="/admin/einstellungen" className="hover:text-ink">Einstellungen</Link>
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

      <RealtimeListener token={session?.access_token} pollMs={60_000} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 p-4">{children}</main>
    </div>
  )
}
