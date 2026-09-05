import { LEGAL_VERSION, providerIncomplete, providerPlaceholders } from '@/lib/provider'

/**
 * Typografie-Bausteine der Rechtsseiten. Kein Typography-Plugin — die paar
 * Elemente sind schneller von Hand gesetzt als konfiguriert, und sie nutzen
 * dieselben semantischen Farben wie der Rest der Anwendung (Dark Mode
 * inklusive).
 */

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-black text-ink">{children}</h1>
      {sub && <p className="mt-2 text-ink-soft">{sub}</p>}
      <p className="mt-2 text-xs text-ink-muted">Stand: {LEGAL_VERSION}</p>
    </header>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}

export function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-ink">{title}</h3>
      {children}
    </div>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  )
}

export function Address({ lines }: { lines: string[] }) {
  return (
    <address className="not-italic">
      {lines.map((l, i) => <span key={i} className="block">{l}</span>)}
    </address>
  )
}

/**
 * Sichtbarer Hinweis, solange Anbieter-Daten fehlen. Erscheint nur, wenn in
 * `provider.ts` noch ein `[…]`-Platzhalter steht — dann soll es niemand
 * übersehen, auch nicht in Produktion.
 */
export function ProviderNotice() {
  if (!providerIncomplete()) return null
  return (
    <p className="mb-6 rounded-xl border border-caution-tint-edge bg-caution-tint px-4 py-3 text-sm font-semibold text-caution-deepest">
      Diese Angaben sind noch unvollständig — die mit […] markierten Felder werden
      vom Anbieter nachgetragen ({providerPlaceholders().join(', ')}).
    </p>
  )
}
