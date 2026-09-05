import Link from 'next/link'

/**
 * Fußzeile mit den Pflichtlinks — Impressum, Datenschutz, AGB.
 *
 * Steht auf jeder öffentlichen Seite (Landing, Anmeldungen, Registrierung,
 * Passwort, Gäste- und Reinigungs-Einstiege): Das Impressum muss von jeder
 * Seite des Dienstes aus leicht erkennbar und unmittelbar erreichbar sein
 * (§ 5 DDG). Die Portale hinter der Anmeldung tragen sie über ihre Shells.
 */
export default function LegalFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`px-4 py-4 text-center text-xs text-ink-muted ${className}`}>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/impressum" className="hover:text-ink hover:underline">Impressum</Link>
        <Link href="/datenschutz" className="hover:text-ink hover:underline">Datenschutz</Link>
        <Link href="/agb" className="hover:text-ink hover:underline">AGB</Link>
      </nav>
    </footer>
  )
}
