import Link from 'next/link'
import Rich from '@/components/i18n/Rich'
import { format, type LegalMessages, type Vars } from '@/lib/i18n'
import type { LegalBlock, LegalPage, LegalText } from '@/lib/i18n/de/legal'
import type { LegalAddress, LegalCondition } from '@/lib/i18n/de/legal/blocks'
import { formatCents } from '@/lib/money'
import { MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS } from '@/lib/pricing'
import { LEGAL_VERSION, PROVIDER, providerAddressLines, providerIncomplete, providerPlaceholders } from '@/lib/provider'
import { SIMULATOR_NAME } from '@/lib/sim-account'

/**
 * Typografie-Bausteine der Rechtsseiten. Kein Typography-Plugin — die paar
 * Elemente sind schneller von Hand gesetzt als konfiguriert, und sie nutzen
 * dieselben semantischen Farben wie der Rest der Anwendung (Dark Mode
 * inklusive).
 *
 * Seit 11.10.2026 steht der Wortlaut in `src/lib/i18n/de/legal/`; `LegalView`
 * zeichnet die dort abgelegte Gliederung (Abschnitte, Absätze, Aufzählungen,
 * Unterabschnitte, Anschriften). Anbieter-Daten und Preise kommen weiter aus
 * `provider.ts` und `pricing.ts` und gehen als Platzhalter in die Texte.
 */

/** Werte für die Platzhalter der Rechtstexte — Anbieter, Produkt, Preise, Simulator. */
export function legalVars(): Vars {
  return {
    name: PROVIDER.name,
    representative: PROVIDER.representative,
    street: PROVIDER.street,
    zipCity: PROVIDER.zipCity,
    registerCourt: PROVIDER.registerCourt,
    register: PROVIDER.register,
    phone: PROVIDER.phone ?? '',
    email: PROVIDER.email,
    websiteLabel: PROVIDER.website.replace(/^https?:\/\//, ''),
    vatId: PROVIDER.vatId ?? '',
    product: PROVIDER.product,
    domain: PROVIDER.domain,
    pricePerRoom: formatCents(PRICE_PER_ROOM_CENTS),
    minMonthly: formatCents(MIN_MONTHLY_CENTS),
    simulatorName: SIMULATOR_NAME,
  }
}

function holds(cond: LegalCondition | undefined): boolean {
  switch (cond) {
    case undefined: return true
    case 'phone': return !!PROVIDER.phone
    case 'noPhone': return !PROVIDER.phone
    case 'vatId': return !!PROVIDER.vatId
  }
}

function addressLines(which: LegalAddress): string[] {
  return which === 'provider'
    ? providerAddressLines()
    : [PROVIDER.representative, PROVIDER.street, PROVIDER.zipCity]
}

/** Hervorhebung, Code und Links, die die Rechtstexte als Tags tragen. */
function richTags(strongLinks: boolean) {
  const linkClass = `${strongLinks ? 'font-semibold ' : ''}text-action-strong hover:underline`
  const internal = (href: string) =>
    function InternalLink(c: string) {
      return <Link href={href} className={linkClass}>{c}</Link>
    }
  return {
    b: (c: string) => <span className="font-semibold text-ink">{c}</span>,
    code: (c: string) => <code className="rounded bg-surface-muted px-1 text-xs text-ink">{c}</code>,
    agb: internal('/agb'),
    datenschutz: internal('/datenschutz'),
    impressum: internal('/impressum'),
    simulatorDatenschutz: internal('/datenschutz#simulator'),
    website: (c: string) => <a href={PROVIDER.website} className={linkClass} rel="noopener">{c}</a>,
    stripePrivacy: (c: string) => (
      <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener" className={linkClass}>{c}</a>
    ),
  }
}

type Tags = ReturnType<typeof richTags>

function textOf(t: LegalText): string | null {
  if (typeof t === 'string') return t
  return holds(t.when) ? t.text : null
}

function Block({ block, vars, tags }: { block: LegalBlock; vars: Vars; tags: Tags }) {
  if (typeof block === 'string' || 'text' in block) {
    const text = textOf(block)
    return text === null ? null : <P><Rich text={text} vars={vars} tags={tags} /></P>
  }
  if ('list' in block) {
    const items = block.list.map(textOf).filter((t): t is string => t !== null)
    return <List items={items.map((t, i) => <Rich key={i} text={t} vars={vars} tags={tags} />)} />
  }
  if ('sub' in block) {
    return (
      <Sub title={format(block.sub, vars)}>
        {block.blocks.map((b, i) => <Block key={i} block={b} vars={vars} tags={tags} />)}
      </Sub>
    )
  }
  return <Address lines={addressLines(block.address)} />
}

/** Eine ganze Rechtsseite aus der Sprachdatei: Titel, Hinweis auf fehlende Anbieter-Daten, Abschnitte. */
export function LegalView({
  page,
  common,
  strongLinks = false,
}: {
  page: LegalPage
  common: LegalMessages['common']
  /** Links fett setzen (Nutzungsbedingungen des Simulators). */
  strongLinks?: boolean
}) {
  const vars = legalVars()
  const tags = richTags(strongLinks)
  return (
    <>
      <Title sub={page.sub && format(page.sub, vars)} version={format(common.version, { version: LEGAL_VERSION })}>
        {format(page.title, vars)}
      </Title>
      <ProviderNotice text={common.providerIncomplete} />
      {page.sections.filter(s => holds(s.when)).map((s, i) => (
        <Section key={i} title={format(s.title, vars)} id={s.id}>
          {s.blocks.map((b, j) => <Block key={j} block={b} vars={vars} tags={tags} />)}
        </Section>
      ))}
    </>
  )
}

export function Title({ children, sub, version }: { children: React.ReactNode; sub?: string; version: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-black text-ink">{children}</h1>
      {sub && <p className="mt-2 text-ink-soft">{sub}</p>}
      <p className="mt-2 text-xs text-ink-muted">{version}</p>
    </header>
  )
}

export function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-6">
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
export function ProviderNotice({ text }: { text: string }) {
  if (!providerIncomplete()) return null
  return (
    <p className="mb-6 rounded-xl border border-caution-tint-edge bg-caution-tint px-4 py-3 text-sm font-semibold text-caution-deepest">
      {format(text, { fields: providerPlaceholders().join(', ') })}
    </p>
  )
}
