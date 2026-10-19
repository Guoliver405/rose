import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/login/actions'
import { RoseLogo } from '@/components/brand/RoseLogo'

/**
 * Rahmen der Support-Seiten – bewusst schlicht und außerhalb von Haus und
 * Konto: Das RoSe-Team hat hier keine Rechte an Hotels, nur an Meldungen.
 */
export default function SupportShell({ title, logout, children }: { title: string; logout: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface-sunken">
      <header className="sticky top-0 z-40 border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-4 py-3 lg:h-[52px] lg:py-0">
          <Link href="/support" className="flex items-center gap-2 text-lg font-black text-ink">
            <RoseLogo size="header" />
            <span className="text-sm font-semibold text-ink-muted">{title}</span>
          </Link>
          <form action={logoutAction} className="ml-auto">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
            >
              <LogOut className="h-4 w-4" /> {logout}
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-4 p-4">{children}</main>
    </div>
  )
}
