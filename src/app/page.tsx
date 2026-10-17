import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BedDouble, BellRing, Check, ClipboardCheck, Clock, Droplets, Equal, KeyRound, Leaf,
  Moon, MousePointerClick, Plus, Printer, QrCode, ShieldCheck, Smartphone, Sparkles,
  User,
} from 'lucide-react'
import { formatCents } from '@/lib/money'
import { MIN_COVERS_ROOMS, MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS } from '@/lib/pricing'
import { PROVIDER } from '@/lib/provider'
import LiveDemo from '@/components/landing/LiveDemo'
import RoiCalculator from '@/components/landing/RoiCalculator'
import CleaningSimulation from '@/components/landing/CleaningSimulation'
import Rich from '@/components/i18n/Rich'
import { getMessages, intlLocale, type LandingMessages, type SimulatorMessages } from '@/lib/i18n'
import { format } from '@/lib/i18n/format'
import { getAdminLocale } from '@/utils/locale'
import LanguageSwitch from '@/components/LanguageSwitch'
import { ADMIN_LOCALES, type Locale } from '@/lib/i18n/locales'

type M = LandingMessages['page']

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAdminLocale()
  const m = getMessages(locale).landing.page.meta
  return {
    title: m.title,
    description: format(m.description, { price: formatCents(PRICE_PER_ROOM_CENTS, intlLocale(locale)) }),
    openGraph: {
      title: m.title,
      description: m.ogDescription,
      type: 'website',
      locale: m.ogLocale,
      siteName: m.siteName,
    },
    twitter: { card: 'summary_large_image' },
  }
}

/**
 * Marketing-Landing (Phase 6a, überarbeitet 05.09.2026).
 *
 * Die Produktvorschau ist eine **interaktive Szene** (`LiveDemo`): drei in CSS
 * nachgebaute Miniaturen der Portale an einem gemeinsamen Modell, mit
 * Bildergeschichte beim ersten Sichtbarwerden. Keine Screenshots — sie
 * veralten mit jedem UI-Feinschliff. Der Preis-Abschnitt trägt neben der
 * Preiskarte den Nutzenrechner (`RoiCalculator`, Rechnung in `roi.ts` mit
 * ausgewiesenen Annahmen und Quellen). Hinter dem Ablauf zeigt
 * `CleaningSimulation` denselben Tag ohne Steuerung und mit RoSe, umschaltbar
 * zwischen täglicher Reinigung und Reinigung auf Wunsch (Rechnung in `cleaning-sim.ts`). Preise kommen aus `pricing.ts`,
 * damit Landing Page, AGB und Konto dieselben Zahlen zeigen.
 */
export default async function LandingPage() {
  const locale = await getAdminLocale()
  const messages = getMessages(locale)
  const lm = messages.landing
  const m = lm.page
  const intl = intlLocale(locale)
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <Header m={m.header} locale={locale} />
      <main className="flex-1">
        <Hero m={m.hero} />
        <PainPoints m={m.painPoints} />
        <Formula m={m.formula} intl={intl} />
        <Sustainability m={m.sustainability} />
        <ProductPreview m={m.product} demo={lm.demo} intlLocale={intl} />
        <Flow m={m.flow} />
        <DayComparison m={m.comparison} day={lm.day} texts={messages.simulator.app.day} intlLocale={intl} />
        <FeatureGrid m={m.features} />
        <UseCases m={m.useCases} intl={intl} />
        <Pricing m={m.pricing} roi={lm.roi} intlLocale={intl} />
        <Faq m={m.faq} intl={intl} />
        <SignupTeaser m={m.signup} />
      </main>
      <Footer m={m.footer} />
    </div>
  )
}

/* ── Bausteine ──────────────────────────────────────────────────── */

function Brand() {
  return (
    <span className="text-xl font-black text-ink">
      Ro<span className="text-blocked">Se</span>
    </span>
  )
}

function Header({ m, locale }: { m: M['header']; locale: Locale }) {
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label={m.homeAria}>
          <Brand />
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-ink-soft sm:flex">
          <a href="#produkt" className="hover:text-ink">{m.nav.product}</a>
          <a href="#ablauf" className="hover:text-ink">{m.nav.flow}</a>
          <a href="#preise" className="hover:text-ink">{m.nav.pricing}</a>
          <a href="#faq" className="hover:text-ink">{m.nav.faq}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitch current={locale} offered={ADMIN_LOCALES} inline />
          <Link
            href="/login"
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-ink hover:border-edge-strong"
          >
            {m.signIn}
          </Link>
          <Link
            href="/registrieren"
            className="hidden rounded-lg bg-action px-3 py-1.5 text-sm font-semibold text-action-foreground hover:bg-action-strong sm:block"
          >
            {m.start}
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero({ m }: { m: M['hero'] }) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-14 text-center sm:pt-20">
      <p className="mx-auto mb-4 w-fit rounded-full border border-action-tint-edge bg-action-tint px-3 py-1 text-xs font-semibold text-action-deep">
        {m.badge}
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
        <Rich text={m.title} tags={{ hl: c => <span className="text-blocked">{c}</span> }} />
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
        {m.text}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/registrieren"
          className="rounded-xl bg-action px-6 py-3 font-bold text-action-foreground shadow-sm hover:bg-action-strong"
        >
          {m.start}
        </Link>
        <a
          href="#produkt"
          className="rounded-xl border border-edge bg-surface-elevated px-6 py-3 font-bold text-ink shadow-sm hover:border-edge-strong"
        >
          {m.demo}
        </a>
      </div>
    </section>
  )
}

function PainPoints({ m }: { m: M['painPoints'] }) {
  return (
    <section className="border-y border-edge bg-surface-sunken">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 sm:grid-cols-3">
        {m.map((it) => (
          <div key={it.pain}>
            <p className="font-bold text-ink">{it.pain}</p>
            <p className="mt-2 text-sm text-ink-soft">{it.fix}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── RoSe-Formel: der Nutzen auf einen Blick ────────────────────── */

/**
 * Die drei Verkaufsargumente als Gleichung (User, 27.09.2026): oben das
 * Mittel, unten die Wirkung. Jede Kachel springt auf den Abschnitt, der das
 * Versprechen belegt. Bewusst drei Glieder — die Einstiegshürde ist kein
 * weiterer Nutzen, sondern der Grund, es auszuprobieren, und steht darunter.
 * Farbe nur als Linie und Tönung (Farbsprache der Boards).
 */
function Formula({ m, intl }: { m: M['formula']; intl: string }) {
  const terms = [
    {
      href: '#produkt',
      icon: Smartphone,
      ...m.terms.portal,
      box: 'border-fresh-tint-edge bg-fresh-tint hover:border-fresh-bar',
      tone: 'text-fresh-deep',
    },
    {
      href: '#vergleich',
      icon: Sparkles,
      ...m.terms.cleaning,
      box: 'border-positive-tint-edge bg-positive-tint hover:border-positive-bar',
      tone: 'text-positive-deep',
    },
    {
      href: '#ablauf',
      icon: ClipboardCheck,
      ...m.terms.flow,
      box: 'border-accent-tint-edge bg-accent-tint hover:border-accent-bar',
      tone: 'text-accent-deep',
    },
  ]
  return (
    <section id="formel" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 pt-16">
      <h2 className="text-center text-sm font-bold uppercase tracking-widest text-ink-muted">
        {m.heading}
      </h2>
      <div className="mt-6 flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {terms.map((t, i) => (
          <div key={t.href} className="contents">
            {i > 0 && (
              <Plus aria-hidden className="mx-auto h-7 w-7 shrink-0 text-ink-muted md:mx-1" strokeWidth={2.5} />
            )}
            <a
              href={t.href}
              className={`flex flex-1 flex-col items-center rounded-2xl border-2 p-5 text-center transition-colors ${t.box}`}
            >
              <t.icon aria-hidden className={`h-8 w-8 ${t.tone}`} />
              <span className="mt-3 font-black text-ink">{t.means}</span>
              <span className={`mt-3 w-full border-t border-edge pt-3 text-sm font-semibold ${t.tone}`}>
                {t.effect}
              </span>
            </a>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-center justify-center gap-3 text-2xl font-black text-ink">
        <Equal aria-hidden className="h-7 w-7 text-ink-muted" strokeWidth={2.5} />
        <Brand />
      </p>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-ink-muted">
        {format(m.footnote, { price: formatCents(PRICE_PER_ROOM_CENTS, intl) })}
      </p>
    </section>
  )
}

/* ── Nachhaltigkeit: Reinigung nur auf Wunsch ───────────────────── */

/**
 * Der Haupt-Einspar-Fall, aber bewusst NICHT als Kostenargument erzählt — das
 * übernimmt der Nutzenrechner weiter unten. Hier geht es um Wasser,
 * Waschmittel, Energie und das Nachhaltigkeits-Profil des Hauses: Häuser, die
 * als nachhaltig gelten, genießen ein gutes Image (User, 05.09.2026). Die
 * einzige Zahl (70 %) ist dieselbe wie Quelle Q1 des Rechners (AHLA 2022).
 */
function Sustainability({ m }: { m: M['sustainability'] }) {
  const wins = [
    { icon: Droplets, ...m.wins.water },
    { icon: Leaf, ...m.wins.energy },
    { icon: Sparkles, ...m.wins.guests },
  ]
  return (
    <section id="nachhaltig" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-positive-tint-edge bg-positive-tint p-6 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          {/* Plakette */}
          <div className="mx-auto flex h-40 w-40 shrink-0 flex-col items-center justify-center rounded-full border-4 border-positive bg-surface-elevated text-center shadow-sm">
            <Leaf className="h-9 w-9 text-positive-strong" aria-hidden />
            <span className="mt-1 text-[11px] font-black uppercase tracking-widest text-positive-deepest">{m.sealTop}</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-positive-deepest">{m.sealBottom}</span>
          </div>
          <div>
            <p className="w-fit rounded-full bg-positive px-3 py-1 text-xs font-bold text-positive-foreground">
              {m.badge}
            </p>
            <h2 className="mt-3 text-3xl font-black text-ink">
              {m.heading}
            </h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              {m.text}
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {wins.map((w) => (
                <li key={w.title} className="rounded-xl border border-positive-tint-edge bg-surface-elevated p-4">
                  <w.icon className="h-5 w-5 text-positive-strong" aria-hidden />
                  <p className="mt-2 font-bold text-ink">{w.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{w.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-muted">
              {m.footnote}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Produktvorschau: interaktive Szene ─────────────────────────── */

function ProductPreview({ m, demo, intlLocale }: { m: M['product']; demo: LandingMessages['demo']; intlLocale: string }) {
  const portals = [
    { icon: User, bar: 'bg-action', ...m.portals.reception },
    { icon: QrCode, bar: 'bg-positive', ...m.portals.guests },
    { icon: Sparkles, bar: 'bg-attention', ...m.portals.housekeeping },
  ]
  return (
    <section id="produkt" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">
        {m.heading}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
        {m.intro}
      </p>
      <div className="mt-10">
        <LiveDemo m={demo} intlLocale={intlLocale} />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {portals.map((p) => (
          <div key={p.title} className="overflow-hidden rounded-2xl border border-edge bg-surface-elevated">
            <div className={`h-1.5 ${p.bar}`} />
            <div className="p-5">
              <div className="flex items-center gap-2">
                <p.icon className="h-5 w-5 text-ink-soft" aria-hidden />
                <h3 className="text-xl font-bold text-ink">{p.title}</h3>
              </div>
              <p className="mt-1 text-sm font-medium text-ink-soft">{p.lead}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" aria-hidden />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Ablauf als Bildergeschichte ────────────────────────────────── */

function Flow({ m }: { m: M['flow'] }) {
  const panels = [
    { icon: MousePointerClick, tone: 'text-action bg-action-tint border-action-tint-edge', ...m.panels.checkin },
    { icon: QrCode, tone: 'text-positive-strong bg-positive-tint border-positive-tint-edge', ...m.panels.access },
    { icon: Smartphone, tone: 'text-attention-deepest bg-attention-tint border-attention-tint-edge', ...m.panels.tap },
    { icon: BellRing, tone: 'text-critical-strong bg-critical-tint border-critical-tint-edge', ...m.panels.visible },
    { icon: ClipboardCheck, tone: 'text-accent bg-accent-tint border-accent-tint-edge', ...m.panels.board },
  ]
  return (
    <section id="ablauf" className="scroll-mt-20 border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          {m.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
          {m.intro}
        </p>
        <ol className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <span className="absolute left-0 right-0 top-7 hidden h-0.5 bg-edge lg:block" aria-hidden />
          {panels.map((p, i) => (
            <li key={p.title} className="relative flex flex-col items-center text-center">
              <span className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border ${p.tone}`}>
                <p.icon className="h-6 w-6" aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-surface">
                  {i + 1}
                </span>
              </span>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{p.who}</p>
              <h3 className="mt-0.5 font-bold text-ink">{p.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{p.text}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-ink-muted">
          {m.checkout}
        </p>
      </div>
    </section>
  )
}

/* ── Derselbe Tag, mit und ohne RoSe ───────────────────────────────────────── */

function DayComparison({ m, day, texts, intlLocale }: {
  m: M['comparison']
  day: LandingMessages['day']
  texts: SimulatorMessages['app']['day']
  intlLocale: string
}) {
  return (
    <section id="vergleich" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">{m.heading}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
        {m.intro}
      </p>
      <div className="mt-10">
        <CleaningSimulation texts={texts} m={day} intlLocale={intlLocale} />
      </div>
      {/* Simulator Phase 3 (26.09.2026): derselbe Rechenkern mit den Zahlen des eigenen Hauses. */}
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-edge bg-surface-elevated px-6 py-6 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <p className="text-lg font-bold text-ink">{m.simulatorTitle}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {m.simulatorText}
          </p>
        </div>
        <Link href="/simulator"
          className="shrink-0 rounded-lg bg-action px-5 py-3 font-bold text-action-foreground hover:bg-action-strong">
          {m.simulatorLink}
        </Link>
      </div>
    </section>
  )
}

function FeatureGrid({ m }: { m: M['features'] }) {
  const f = m.items
  const features = [
    { icon: QrCode, ...f.qr },
    { icon: KeyRound, ...f.secure },
    { icon: Moon, ...f.dnd },
    { icon: Clock, ...f.daily },
    { icon: BedDouble, ...f.services },
    { icon: Printer, ...f.print },
    { icon: Leaf, ...f.green },
    { icon: ShieldCheck, ...f.proof },
  ]
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">
        {m.heading}
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-edge bg-surface-elevated p-5">
            <f.icon className="h-5 w-5 text-action" aria-hidden />
            <h3 className="mt-3 font-bold text-ink">{f.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function UseCases({ m, intl }: { m: M['useCases']; intl: string }) {
  const cases = [m.items.small, m.items.boutique, m.items.city, m.items.chain]
  return (
    <section className="border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          {m.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
          {m.intro}
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {cases.map((c) => (
            <div key={c.title} className="rounded-xl border border-edge bg-surface-elevated p-6">
              <h3 className="font-bold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{format(c.text, { min: formatCents(MIN_MONTHLY_CENTS, intl) })}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Preise und Nutzen ──────────────────────────────────────────── */

function Pricing({ m, roi, intlLocale }: { m: M['pricing']; roi: LandingMessages['roi']; intlLocale: string }) {
  const label = (c: string) => <span className="font-semibold text-ink-soft">{c}</span>
  return (
    <section id="preise" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">{m.heading}</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
        {m.intro}
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-5">
        <div className="flex flex-col rounded-2xl border border-action bg-surface-elevated p-6 shadow-sm ring-1 ring-action md:col-span-2">
          <p className="w-fit rounded-full bg-action-pill px-2.5 py-0.5 text-xs font-bold text-action-deep">
            {m.badge}
          </p>
          <p className="mt-4">
            <span className="text-5xl font-black text-ink">{formatCents(PRICE_PER_ROOM_CENTS, intlLocale)}</span>
          </p>
          <p className="text-sm text-ink-soft">{m.perRoom}</p>
          <p className="mt-3 text-sm text-ink-soft">
            <Rich text={m.minimum} vars={{ min: formatCents(MIN_MONTHLY_CENTS, intlLocale), rooms: MIN_COVERS_ROOMS }}
              tags={{ b: c => <span className="font-semibold text-ink">{c}</span> }} />
          </p>
          <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-soft">
            {m.included.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 text-xs text-ink-muted">
            <p>
              <Rich text={m.whatCounts} tags={{ b: label }} />
            </p>
            <p>
              <Rich text={m.terms} tags={{
                b: label,
                link: c => <Link href="/agb" className="underline hover:text-ink">{c}</Link>,
              }} />
            </p>
          </div>
          <Link
            href="/registrieren"
            className="mt-6 rounded-xl bg-action px-4 py-2.5 text-center font-bold text-action-foreground hover:bg-action-strong"
          >
            {m.start}
          </Link>
        </div>

        <div className="md:col-span-3">
          <RoiCalculator m={roi} intlLocale={intlLocale} />
        </div>
      </div>
    </section>
  )
}

function Faq({ m, intl }: { m: M['faq']; intl: string }) {
  const prices = { price: formatCents(PRICE_PER_ROOM_CENTS, intl), min: formatCents(MIN_MONTHLY_CENTS, intl) }
  return (
    <section id="faq" className="scroll-mt-20 border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          {m.heading}
        </h2>
        <div className="mt-10 space-y-6">
          {m.items.map((it) => (
            <div key={it.q}>
              <h3 className="font-bold text-ink">{it.q}</h3>
              <p className="mt-1 text-sm text-ink-soft">{format(it.a, prices)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SignupTeaser({ m }: { m: M['signup'] }) {
  return (
    <section id="registrierung" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <div className="rounded-2xl border border-action-tint-edge bg-action-tint p-8 text-center sm:p-12">
        <h2 className="text-2xl font-black text-ink sm:text-3xl">
          {m.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          {m.text}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/registrieren"
            className="rounded-xl bg-action px-6 py-3 font-bold text-action-foreground hover:bg-action-strong"
          >
            {m.start}
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-edge bg-surface-elevated px-6 py-3 font-bold text-ink hover:border-edge-strong"
          >
            {m.haveAccess}
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer({ m }: { m: M['footer'] }) {
  return (
    <footer className="border-t border-edge bg-surface-sunken">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Brand />
          <span>{m.tagline}</span>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/login" className="hover:text-ink">{m.reception}</Link>
          <Link href="/service/login" className="hover:text-ink">{m.housekeeping}</Link>
          <Link href="/guest" className="hover:text-ink">{m.guests}</Link>
        </nav>
        <nav className="flex flex-wrap gap-4">
          <Link href="/impressum" className="hover:text-ink">{m.imprint}</Link>
          <Link href="/datenschutz" className="hover:text-ink">{m.privacy}</Link>
          <Link href="/agb" className="hover:text-ink">{m.terms}</Link>
        </nav>
      </div>
      <p className="mx-auto w-full max-w-5xl px-4 pb-6 text-xs text-ink-muted">
        © {new Date().getFullYear()} {PROVIDER.name}
      </p>
    </footer>
  )
}
