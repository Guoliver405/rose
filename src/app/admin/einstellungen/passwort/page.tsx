import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getManagementContext } from '@/utils/auth'
import PasswordForm from '../PasswordForm'

export default async function PasswortPage() {
  const ctx = await getManagementContext()
  if (!ctx) redirect('/login')

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/einstellungen"
          className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Einstellungen
        </Link>
        <h1 className="text-xl font-black text-ink">Passwort</h1>
      </div>

      <PasswordForm />
    </div>
  )
}
