import Link from 'next/link'
import LegalFooter from '@/components/LegalFooter'
import { getMessages } from '@/lib/i18n'
import { getLocale } from '@/utils/locale'
import { RoseLogo } from '@/components/brand/RoseLogo'

/**
 * Rahmen der Rechtsseiten (Impressum, Datenschutz, AGB): schmale Lesespalte,
 * Kopfzeile mit Rückweg zur Startseite, Pflichtlinks unten. Bewusst ohne
 * Sitzung und ohne Mandant — die Seiten sind für jeden lesbar.
 */
export default async function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const m = getMessages(await getLocale()).legal.common
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label={m.homeLabel} className="text-xl font-black text-ink">
            <RoseLogo />
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft">
            <Link href="/impressum" className="hover:text-ink">{m.nav.impressum}</Link>
            <Link href="/datenschutz" className="hover:text-ink">{m.nav.datenschutz}</Link>
            <Link href="/agb" className="hover:text-ink">{m.nav.agb}</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>
      <LegalFooter className="border-t border-edge" />
    </div>
  )
}
