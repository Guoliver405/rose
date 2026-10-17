import Link from 'next/link'
import { format, getMessages } from '@/lib/i18n'
import { PROVIDER } from '@/lib/provider'
import { getAdminLocale } from '@/utils/locale'

/**
 * Fußzeile mit den Pflichtlinks — Impressum, Datenschutz, AGB — und der
 * Copyright-Zeile.
 *
 * Steht auf jeder öffentlichen Seite (Landing, Anmeldungen, Registrierung,
 * Passwort, Gäste- und Reinigungs-Einstiege): Das Impressum muss von jeder
 * Seite des Dienstes aus leicht erkennbar und unmittelbar erreichbar sein
 * (§ 5 DDG). Die Portale hinter der Anmeldung tragen sie über ihre Shells.
 *
 * Die Copyright-Zeile steht bewusst HIER und nicht am Logo (Anregung von
 * Bernd, 05.09.2026): Urheberrecht entsteht in Deutschland ohne Vermerk, und
 * ein zweifarbiger Schriftzug erreicht die Schöpfungshöhe ohnehin kaum — das
 * © ist ein Hinweis, wem die Seite gehört, kein Schutz des Logos. Der Name
 * wird über eine Wortmarke geschützt (TODO), und erst mit deren Eintragung
 * dürfte ein ® ans Logo; ein ® ohne Eintragung wäre irreführend (§ 5 UWG).
 *
 * Server-Komponente (Texte aus `legal.common`); darf deshalb nur in
 * Server-Komponenten gerendert werden.
 */
export default async function LegalFooter({ className = '' }: { className?: string }) {
  const m = getMessages(await getAdminLocale()).legal.common
  return (
    <footer className={`px-4 py-4 text-center text-xs text-ink-muted ${className}`}>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/impressum" className="hover:text-ink hover:underline">{m.nav.impressum}</Link>
        <Link href="/datenschutz" className="hover:text-ink hover:underline">{m.nav.datenschutz}</Link>
        <Link href="/agb" className="hover:text-ink hover:underline">{m.nav.agb}</Link>
      </nav>
      <p className="mt-1.5">{format(m.copyright, { year: new Date().getFullYear(), name: PROVIDER.name })}</p>
    </footer>
  )
}
