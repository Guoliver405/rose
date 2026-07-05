import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import { logoutAction } from '@/app/login/actions'
import RealtimeListener from '@/components/RealtimeListener'

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="sticky top-0 z-40 border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-3">
          <Link href="/admin" className="text-lg font-black text-ink">
            Ro<span className="text-blocked">Se</span>
            <span className="ml-2 text-sm font-semibold text-ink-muted">{ctx.hotelName}</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-semibold text-ink-soft">
            <Link href="/admin" className="hover:text-ink">Übersicht</Link>
            <Link href="/admin/zimmer" className="hover:text-ink">Zimmer</Link>
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
