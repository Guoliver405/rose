import Link from 'next/link'
import { PROVIDER } from '@/lib/provider'

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
 */
export default function LegalFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`px-4 py-4 text-center text-xs text-ink-muted ${className}`}>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/impressum" className="hover:text-ink hover:underline">Impressum</Link>
        <Link href="/datenschutz" className="hover:text-ink hover:underline">Datenschutz</Link>
        <Link href="/agb" className="hover:text-ink hover:underline">AGB</Link>
      </nav>
      <p className="mt-1.5">© {new Date().getFullYear()} {PROVIDER.name}</p>
    </footer>
  )
}
