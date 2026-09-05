import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BedDouble, BellRing, Check, CheckCircle2, ClipboardCheck, Clock, KeyRound,
  Moon, MousePointerClick, Printer, QrCode, ShieldCheck, Smartphone, Sparkles,
  User,
} from 'lucide-react'
import { formatCents } from '@/lib/money'
import { MIN_COVERS_ROOMS, MIN_MONTHLY_CENTS, PRICE_PER_ROOM_CENTS } from '@/lib/pricing'
import { PROVIDER } from '@/lib/provider'
import LiveDemo from '@/components/landing/LiveDemo'
import RoiCalculator from '@/components/landing/RoiCalculator'

export const metadata: Metadata = {
  title: 'RoSe — RoomService für Hotels jeder Größe',
  description:
    'Reinigungswünsche, „Bitte nicht stören" und Service-Bestellungen der Gäste landen live bei Rezeption und Housekeeping — ohne Gast-App, ohne PMS-Projekt. 0,50 € je Zimmer und Monat, erster Monat frei.',
  openGraph: {
    title: 'RoSe — RoomService für Hotels jeder Größe',
    description:
      'Check-in per Klick, Gäste per QR-Code, Reinigung im Takt. Drei Portale für Rezeption, Housekeeping und Gäste.',
    type: 'website',
    locale: 'de_DE',
    siteName: 'RoSe — RoomService',
  },
  twitter: { card: 'summary_large_image' },
}

/**
 * Marketing-Landing (Phase 6a, überarbeitet 05.09.2026).
 *
 * Die Produktvorschau ist eine **interaktive Szene** (`LiveDemo`): drei in CSS
 * nachgebaute Miniaturen der Portale an einem gemeinsamen Modell, mit
 * Bildergeschichte beim ersten Sichtbarwerden. Keine Screenshots — sie
 * veralten mit jedem UI-Feinschliff. Der Preis-Abschnitt trägt neben der
 * Preiskarte den Nutzenrechner (`RoiCalculator`, Rechnung in `roi.ts` mit
 * ausgewiesenen Annahmen und Quellen). Preise kommen aus `pricing.ts`,
 * damit Landing Page, AGB und Konto dieselben Zahlen zeigen.
 */
export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <Header />
      <main className="flex-1">
        <Hero />
        <PainPoints />
        <ProductPreview />
        <Flow />
        <FeatureGrid />
        <UseCases />
        <Pricing />
        <Faq />
        <SignupTeaser />
      </main>
      <Footer />
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

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="RoSe — Startseite">
          <Brand />
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-ink-soft sm:flex">
          <a href="#produkt" className="hover:text-ink">Produkt</a>
          <a href="#ablauf" className="hover:text-ink">So funktioniert&rsquo;s</a>
          <a href="#preise" className="hover:text-ink">Preise</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-edge bg-surface-elevated px-3 py-1.5 text-sm font-semibold text-ink hover:border-edge-strong"
          >
            Anmelden
          </Link>
          <Link
            href="/registrieren"
            className="hidden rounded-lg bg-action px-3 py-1.5 text-sm font-semibold text-action-foreground hover:bg-action-strong sm:block"
          >
            Kostenlos starten
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-14 text-center sm:pt-20">
      <p className="mx-auto mb-4 w-fit rounded-full border border-action-tint-edge bg-action-tint px-3 py-1 text-xs font-semibold text-action-deep">
        Vom Gasthof bis zur Hotelkette
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
        Reinigung, Wünsche und Services —{' '}
        <span className="text-blocked">in einem Takt</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
        Der Gast tippt „Zimmer reinigen“, die Rezeption sieht es sofort, das
        Housekeeping arbeitet es vom Board ab. RoSe verbindet die drei in
        Echtzeit — ohne Gast-App, ohne Schulung, ohne PMS-Projekt.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/registrieren"
          className="rounded-xl bg-action px-6 py-3 font-bold text-action-foreground shadow-sm hover:bg-action-strong"
        >
          Kostenlos starten
        </Link>
        <a
          href="#produkt"
          className="rounded-xl border border-edge bg-surface-elevated px-6 py-3 font-bold text-ink shadow-sm hover:border-edge-strong"
        >
          Produkt ausprobieren
        </a>
      </div>
      <p className="mt-5 text-sm text-ink-muted">
        {formatCents(PRICE_PER_ROOM_CENTS)} je Zimmer und Monat · erster Monat
        frei · läuft im Browser auf jedem Gerät · in unter einer Stunde
        eingerichtet
      </p>
    </section>
  )
}

function PainPoints() {
  const items = [
    {
      pain: '„Zimmer 204 wollte doch keine Reinigung?"',
      fix: 'Gäste melden Reinigungswunsch oder „Bitte nicht stören" selbst — das Board zeigt es live, ohne Zuruf über den Flur und ohne Türhänger.',
    },
    {
      pain: '„Wer ist gerade in welchem Zimmer?"',
      fix: 'Reinigungskräfte bestätigen Start und Abschluss mit einem Wisch — Rezeption und Kolleginnen sehen sofort, wo gearbeitet wird.',
    },
    {
      pain: '„Noch ein System, noch eine Schulung …"',
      fix: 'Drei aufgeräumte Portale, jedes zeigt nur, was die Rolle braucht. Reinigungskräfte melden sich per QR-Karte an, Gäste brauchen gar kein Konto.',
    },
  ]
  return (
    <section className="border-y border-edge bg-surface-sunken">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.pain}>
            <p className="font-bold text-ink">{it.pain}</p>
            <p className="mt-2 text-sm text-ink-soft">{it.fix}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Produktvorschau: interaktive Szene ─────────────────────────── */

function ProductPreview() {
  const portals = [
    {
      icon: User,
      bar: 'bg-action',
      title: 'Rezeption',
      lead: 'Ein Klick checkt ein, ein Klick checkt aus.',
      points: [
        'Check-in erzeugt sofort den Gast-Zugang — PIN am Bildschirm, Handout zum Drucken oder Mailen',
        'Zimmer-Übersicht mit Live-Status; Prioritäten für Beschwerden und Sonderfälle',
        'Service-Anfragen als Aufgabenliste, dringende blinken rot',
      ],
    },
    {
      icon: QrCode,
      bar: 'bg-positive',
      title: 'Gäste',
      lead: 'QR scannen — fertig. Keine App, kein Konto.',
      points: [
        'Zimmer-QR plus PIN, oder ein persönlicher Link je Aufenthalt — das Haus wählt',
        '„Zimmer reinigen" oder „Bitte nicht stören" mit einem Tipp',
        'Services bestellen — vom Extra-Handtuch bis zum Frühstück aufs Zimmer',
      ],
    },
    {
      icon: Sparkles,
      bar: 'bg-attention',
      title: 'Housekeeping',
      lead: 'Ein Board für das ganze Team.',
      points: [
        'Etagen-Ansicht: Wünsche, Abreisen, Prioritäten — mit Empfehlung, wo es sich zu starten lohnt',
        'Start und Abschluss per Wisch; „Kollegin in Zimmer X" ist live sichtbar',
        'Anmeldung per QR-Karte, Schicht und Pause mit zwei Fingertipps, Auswertung inklusive',
      ],
    },
  ]
  return (
    <section id="produkt" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">
        Drei Portale, ein Takt
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
        Jede Rolle bekommt genau die Oberfläche, die sie braucht — verbunden in
        Echtzeit. Hier läuft es live: ein Tipp, alle sehen es.
      </p>
      <div className="mt-10">
        <LiveDemo />
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

function Flow() {
  const panels = [
    {
      icon: MousePointerClick,
      tone: 'text-action bg-action-tint border-action-tint-edge',
      who: 'Rezeption',
      title: 'Check-in per Klick',
      text: 'Ein Klick auf das Zimmer — RoSe legt den anonymen Aufenthalt an und erzeugt den Zugang.',
    },
    {
      icon: QrCode,
      tone: 'text-positive-strong bg-positive-tint border-positive-tint-edge',
      who: 'Gast',
      title: 'Zugang in der Hand',
      text: 'PIN auf dem Handout, QR-Aushang im Zimmer oder Link per Mail — kein Konto, keine App.',
    },
    {
      icon: Smartphone,
      tone: 'text-attention-deepest bg-attention-tint border-attention-tint-edge',
      who: 'Gast',
      title: 'Ein Tipp im Zimmer',
      text: '„Zimmer reinigen", „Bitte nicht stören" oder eine Bestellung aus dem Service-Baukasten.',
    },
    {
      icon: BellRing,
      tone: 'text-critical-strong bg-critical-tint border-critical-tint-edge',
      who: 'Rezeption',
      title: 'Sofort sichtbar',
      text: 'Die Glocke an der Zimmer-Kachel, die Anfrage in der Liste — dringendes blinkt rot.',
    },
    {
      icon: ClipboardCheck,
      tone: 'text-accent bg-accent-tint border-accent-tint-edge',
      who: 'Housekeeping',
      title: 'Vom Board abgearbeitet',
      text: 'Wunsch auf der Etage, Start und Abschluss per Wisch — die Rezeption sieht den Fortschritt live.',
    },
  ]
  return (
    <section id="ablauf" className="scroll-mt-20 border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          So funktioniert&rsquo;s
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
          Vom Check-in bis zur fertigen Reinigung — fünf Schritte, kein Zuruf,
          kein Zettel.
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
          Check-out ist wieder ein Klick: der Zugang erlischt sofort, das Zimmer
          wandert als „ausgecheckt“ aufs Board.
        </p>
      </div>
    </section>
  )
}

function FeatureGrid() {
  const features = [
    { icon: QrCode, title: 'QR ohne Ablaufdatum', text: 'Zimmer-Aushänge einmal drucken — sie bleiben gültig, bis ihr sie bewusst erneuert.' },
    { icon: KeyRound, title: 'Sicher ohne Konten', text: 'Unerratbare Zimmer-Codes, PIN je Aufenthalt, Sperre nach Fehlversuchen — auch gegen Durchprobieren aus dem Netz.' },
    { icon: Moon, title: 'DND wird respektiert', text: '„Bitte nicht stören" graut das Zimmer auf dem Board aus — niemand klopft umsonst.' },
    { icon: Clock, title: 'Stayover-Routine', text: 'Optional: ab der zweiten Nacht setzt RoSe die Routine-Reinigung zur Wunschzeit aufs Board — auch in einem Zeitfenster.' },
    { icon: BedDouble, title: 'Service-Baukasten', text: 'Eigene Services mit Optionen, Preisen und Dringend-Markierung — Gäste bestellen, Rezeption hakt ab.' },
    { icon: Printer, title: 'Druckfertig', text: 'Gast-Handout beim Check-in, QR-Aushänge und Login-Karten fürs Team — alles aus dem Browser, oder per Mail.' },
    { icon: CheckCircle2, title: 'Vergessenes verfällt nicht', text: 'Bleibt ein Abschluss aus, gibt RoSe das Zimmer nach einstellbarer Zeit automatisch frei — nachvollziehbar im Verlauf.' },
    { icon: ShieldCheck, title: 'Nachweis statt Bauchgefühl', text: 'Zimmer-Verlauf und Arbeitszeit-Auswertung je Kraft — für Beschwerden, Lohnabrechnung und Personalplanung.' },
  ]
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">
        Durchdacht bis ins Detail
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

function UseCases() {
  const cases = [
    {
      title: 'Pension, Gasthof & Ferienwohnungen',
      text: 'Die Rezeption ist oft gleichzeitig Küche, Service und Housekeeping. RoSe hält den Überblick: Wer reist ab, wo wird Reinigung gewünscht, was wurde bestellt — ohne Zettelwirtschaft. Ab 5 € im Monat.',
    },
    {
      title: 'Boutique- & Aparthotel',
      text: 'Längere Aufenthalte, wechselnde Reinigungskräfte: QR-Login-Karten statt Passwort-Chaos, die Stayover-Automatik erinnert ab der zweiten Nacht, DND und Wünsche steuern die Gäste selbst.',
    },
    {
      title: 'Stadthotel mit mehreren Etagen',
      text: 'Eigenes oder externes Housekeeping: Das Etagen-Board empfiehlt, wo es sich zu starten lohnt, und die Rezeption sieht live, wer wo arbeitet. Die Auswertung liefert Arbeits- und Reinigungszeiten je Kraft.',
    },
    {
      title: 'Hotelkette & Resort',
      text: 'Ein Konto, beliebig viele Häuser; Manager sehen ihre Häuser, die Rezeption nur ihr eigenes. Prioritäten lenken bei Beschwerden sofort um, vergessene Abschlüsse verfallen automatisch — ohne Zimmer-Limit.',
    },
  ]
  return (
    <section className="border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          Gemacht für Häuser jeder Größe
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
          Vom Familienbetrieb bis zur Kette — RoSe skaliert mit, ohne dass
          irgendwo eine IT-Abteilung nötig wird.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {cases.map((c) => (
            <div key={c.title} className="rounded-xl border border-edge bg-surface-elevated p-6">
              <h3 className="font-bold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Preise und Nutzen ──────────────────────────────────────────── */

function Pricing() {
  const included = [
    'Alle drei Portale — Rezeption, Housekeeping, Gäste',
    'Beliebig viele Häuser, Zugänge und Reinigungskräfte',
    'Service-Baukasten, Stayover-Routine, Zeitfenster',
    'QR-Aushänge, Handouts, Login-Karten, Gast-Mail',
    'Zimmer-Verlauf und Arbeitszeit-Auswertung',
    'Hell, dunkel, barrierearm — auf jedem Gerät',
  ]
  return (
    <section id="preise" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">Ein Preis. Keine Pakete.</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
        RoSe kostet je Zimmer — nicht je Funktion. Alles ist immer drin, egal ob
        acht Zimmer oder achthundert.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-5">
        <div className="flex flex-col rounded-2xl border border-action bg-surface-elevated p-6 shadow-sm ring-1 ring-action md:col-span-2">
          <p className="w-fit rounded-full bg-action-pill px-2.5 py-0.5 text-xs font-bold text-action-deep">
            Erster Monat kostenlos
          </p>
          <p className="mt-4">
            <span className="text-5xl font-black text-ink">{formatCents(PRICE_PER_ROOM_CENTS)}</span>
          </p>
          <p className="text-sm text-ink-soft">je Zimmer und Monat, zzgl. USt.</p>
          <p className="mt-3 text-sm text-ink-soft">
            Mindestbetrag <span className="font-semibold text-ink">{formatCents(MIN_MONTHLY_CENTS)}</span> im
            Monat — bis {MIN_COVERS_ROOMS} Zimmer zahlt ihr also einen Festpreis.
          </p>
          <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-soft">
            {included.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 text-xs text-ink-muted">
            <p>
              <span className="font-semibold text-ink-soft">Was zählt als Zimmer?</span> Jedes Zimmer,
              das im Monat auch nur vorübergehend in Betrieb war. Zimmer außer Betrieb
              (Renovierung, Saison) zählen nicht.
            </p>
            <p>
              <span className="font-semibold text-ink-soft">Keine Laufzeit.</span> Monatlich kündbar,
              Abrechnung nachträglich je Kalendermonat. Der Mindestbetrag gilt je Konto,
              nicht je Haus. Details in den{' '}
              <Link href="/agb" className="underline hover:text-ink">AGB</Link>.
            </p>
          </div>
          <Link
            href="/registrieren"
            className="mt-6 rounded-xl bg-action px-4 py-2.5 text-center font-bold text-action-foreground hover:bg-action-strong"
          >
            Kostenlos starten
          </Link>
        </div>

        <div className="md:col-span-3">
          <RoiCalculator />
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const items = [
    {
      q: 'Brauchen Gäste eine App oder ein Konto?',
      a: 'Nein. Gäste scannen den QR-Code im Zimmer und geben die PIN vom Check-in ein — oder öffnen ihren persönlichen Link vom Handout bzw. aus der Mail. Alles läuft im Browser.',
    },
    {
      q: 'Ersetzt RoSe unser Buchungssystem oder PMS?',
      a: 'Bewusst nicht. RoSe kümmert sich um den Aufenthalt im Haus — Reinigung, Wünsche, Services. Buchung, Preise und Abrechnung bleiben, wo sie sind. Es gibt nichts zu integrieren.',
    },
    {
      q: 'Welche Daten speichert RoSe über Gäste?',
      a: 'Keine Namen, keine Kontaktdaten. Ein Aufenthalt ist anonym: Zimmer, Zeitraum, Zugang. Beim Check-out erlischt der Zugang sofort. Auch eine Mail-Adresse für den Zugangs-Link wird nicht gespeichert.',
    },
    {
      q: 'Wo liegen die Daten?',
      a: 'Datenbank und Serverfunktionen laufen in der EU (Irland). Zugriffe sind je Haus getrennt, Verbindungen verschlüsselt. Details stehen in der Datenschutzerklärung.',
    },
    {
      q: 'Was brauchen die Reinigungskräfte?',
      a: 'Ein beliebiges Smartphone oder Tablet. Anmeldung per gedruckter QR-Karte oder Benutzername + PIN — keine E-Mail-Adressen nötig.',
    },
    {
      q: 'Was kostet RoSe genau?',
      a: `${formatCents(PRICE_PER_ROOM_CENTS)} je Zimmer und Monat, mindestens ${formatCents(MIN_MONTHLY_CENTS)} im Monat, zzgl. USt. Der Kalendermonat der Registrierung ist frei. Keine Pakete, keine Zimmergrenzen, monatlich kündbar.`,
    },
    {
      q: 'Wie lange dauert die Einrichtung?',
      a: 'Zimmer anlegen (auch als Bereich „301–310"), Aushänge drucken, Team-Karten drucken — realistisch unter einer Stunde. Beispiel-Services sind schon da. Es gibt nichts zu installieren.',
    },
    {
      q: 'Kann ich RoSe jetzt schon ausprobieren?',
      a: 'Ja. In der Testphase ist die Registrierung noch auf eingeladene Häuser beschränkt — mit Einladungscode ist euer Konto in einer Minute angelegt, der erste Monat ist frei.',
    },
  ]
  return (
    <section id="faq" className="scroll-mt-20 border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          Häufige Fragen
        </h2>
        <div className="mt-10 space-y-6">
          {items.map((it) => (
            <div key={it.q}>
              <h3 className="font-bold text-ink">{it.q}</h3>
              <p className="mt-1 text-sm text-ink-soft">{it.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SignupTeaser() {
  return (
    <section id="registrierung" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <div className="rounded-2xl border border-action-tint-edge bg-action-tint p-8 text-center sm:p-12">
        <h2 className="text-2xl font-black text-ink sm:text-3xl">
          Haus in einer Minute anlegen
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          Konto, Haus und Beispiel-Services entstehen in einem Zug — danach nur
          noch die Zimmer eintragen. Der erste Monat ist frei; in der Testphase
          braucht ihr dafür einen Einladungscode.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/registrieren"
            className="rounded-xl bg-action px-6 py-3 font-bold text-action-foreground hover:bg-action-strong"
          >
            Kostenlos starten
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-edge bg-surface-elevated px-6 py-3 font-bold text-ink hover:border-edge-strong"
          >
            Ich habe schon einen Zugang
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-edge bg-surface-sunken">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Brand />
          <span>— RoomService, leichtgewichtig.</span>
        </div>
        <nav className="flex flex-wrap gap-4">
          <Link href="/login" className="hover:text-ink">Rezeption</Link>
          <Link href="/service/login" className="hover:text-ink">Housekeeping</Link>
          <Link href="/guest" className="hover:text-ink">Gäste-Portal</Link>
        </nav>
        <nav className="flex flex-wrap gap-4">
          <Link href="/impressum" className="hover:text-ink">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-ink">Datenschutz</Link>
          <Link href="/agb" className="hover:text-ink">AGB</Link>
        </nav>
      </div>
      <p className="mx-auto w-full max-w-5xl px-4 pb-6 text-xs text-ink-muted">
        Ein Dienst von {PROVIDER.name}.
      </p>
    </footer>
  )
}
