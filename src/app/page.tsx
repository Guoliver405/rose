import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BedDouble, Check, CheckCircle2, Clock, KeyRound, Moon, Printer,
  QrCode, Sparkles, User,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'RoSe — RoomService für kleine Hotels & Pensionen',
  description:
    'Check-in per Klick, Gäste per QR-Code, Reinigung im Takt: RoSe verbindet Rezeption, Housekeeping und Gäste — ohne Gast-App, ohne PMS-Projekt.',
}

/** Marketing-Landing (Phase 6a). Die Portale selbst: /admin, /service, /guest. */
export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-surface">
      <Header />
      <main className="flex-1">
        <Hero />
        <PainPoints />
        <Portals />
        <HowItWorks />
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
          <a href="#portale" className="hover:text-ink">Funktionen</a>
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
          <a
            href="#registrierung"
            className="hidden rounded-lg bg-action px-3 py-1.5 text-sm font-semibold text-action-foreground hover:bg-action-strong sm:block"
          >
            Zugang anfragen
          </a>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-14 text-center sm:pt-20">
      <p className="mx-auto mb-4 w-fit rounded-full border border-action-tint-edge bg-action-tint px-3 py-1 text-xs font-semibold text-action-deep">
        Für kleine Hotels, Pensionen &amp; Aparthotels
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight text-ink sm:text-5xl">
        Zimmerservice &amp; Housekeeping —{' '}
        <span className="text-blocked">ohne Reibung</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
        Check-in per Klick, Gäste per QR-Code, Reinigung im Takt. RoSe verbindet
        Rezeption, Housekeeping und Gäste in drei schlanken Portalen — ohne
        Gast-App, ohne Schulungsaufwand, ohne PMS-Projekt.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#registrierung"
          className="rounded-xl bg-action px-6 py-3 font-bold text-action-foreground shadow-sm hover:bg-action-strong"
        >
          Zugang anfragen
        </a>
        <a
          href="#ablauf"
          className="rounded-xl border border-edge bg-surface-elevated px-6 py-3 font-bold text-ink shadow-sm hover:border-edge-strong"
        >
          So funktioniert&rsquo;s
        </a>
      </div>
      <p className="mt-5 text-sm text-ink-muted">
        Läuft im Browser auf jedem Gerät · Gäste bleiben anonym · in unter einer
        Stunde eingerichtet
      </p>
    </section>
  )
}

function PainPoints() {
  const items = [
    {
      pain: '„Zimmer 204 wollte doch keine Reinigung?"',
      fix: 'Gäste melden Reinigungswunsch oder DND selbst — das Board zeigt es live, ohne Zuruf über den Flur.',
    },
    {
      pain: '„Wer ist gerade in welchem Zimmer?"',
      fix: 'Reinigungskräfte taggen Start und Abschluss mit einem Wisch — Rezeption und Kolleginnen sehen es sofort.',
    },
    {
      pain: '„Noch ein System, noch eine Schulung …"',
      fix: 'Drei aufgeräumte Portale, jedes zeigt nur, was die jeweilige Rolle braucht. Kein Handbuch nötig.',
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

function Portals() {
  const portals = [
    {
      icon: User,
      bar: 'bg-action',
      title: 'Rezeption',
      lead: 'Ein Klick checkt ein, ein Klick checkt aus.',
      points: [
        'Check-in erzeugt sofort die Gast-PIN — ablesbar am Bildschirm, druckbar als Handout',
        'Zimmer-Übersicht mit Live-Status, Prioritäten für Sonderfälle',
        'Bestellungen der Gäste als Aufgabenliste mit Dringend-Markierung',
      ],
    },
    {
      icon: QrCode,
      bar: 'bg-positive',
      title: 'Gäste',
      lead: 'QR scannen, PIN eingeben — fertig.',
      points: [
        'Keine App, kein Konto: Zimmer-QR oder Zimmernummer + PIN genügen',
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
        'Etagen-Ansicht: was ist gewünscht, was ist ausgecheckt, was hat Priorität',
        'Start und Abschluss per Wisch — „Kollegin in Zimmer X" ist live sichtbar',
        'Login per QR-Karte, Schicht und Pause mit zwei Fingertipps',
      ],
    },
  ]
  return (
    <section id="portale" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">
        Drei Portale, ein Takt
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
        Jede Rolle bekommt genau die Oberfläche, die sie braucht — verbunden in
        Echtzeit.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {portals.map((p) => (
          <div
            key={p.title}
            className="overflow-hidden rounded-2xl border border-edge bg-surface-elevated shadow-sm"
          >
            <div className={`h-1.5 ${p.bar}`} />
            <div className="p-6">
              <p.icon className="h-6 w-6 text-ink-soft" aria-hidden />
              <h3 className="mt-3 text-xl font-bold text-ink">{p.title}</h3>
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

function HowItWorks() {
  const steps = [
    {
      title: 'Zimmer anlegen, QR-Aushänge drucken',
      text: 'Zimmernummern eintippen (auch als Bereich „301–310"), Aushänge einmal drucken und in die Zimmer kleben.',
    },
    {
      title: 'Check-in per Klick',
      text: 'Die Rezeption klickt das Zimmer an — RoSe erzeugt den anonymen Aufenthalt und eine PIN für den Gast.',
    },
    {
      title: 'Gast scannt und legt los',
      text: 'QR im Zimmer scannen, PIN eingeben: Reinigungswunsch, DND oder Bestellung — alles landet live an der richtigen Stelle.',
    },
    {
      title: 'Housekeeping arbeitet das Board ab',
      text: 'Das Etagen-Board priorisiert automatisch nach Abreisen, Wünschen und Prioritäten. Check-out beendet den Aufenthalt — die PIN ist sofort ungültig.',
    },
  ]
  return (
    <section id="ablauf" className="scroll-mt-20 border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          So funktioniert&rsquo;s
        </h2>
        <ol className="mx-auto mt-10 max-w-2xl space-y-8">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action font-bold text-action-foreground">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function FeatureGrid() {
  const features = [
    { icon: QrCode, title: 'QR ohne Ablaufdatum', text: 'Zimmer-Aushänge einmal drucken — sie bleiben gültig, bis ihr sie bewusst erneuert.' },
    { icon: KeyRound, title: 'Sicher ohne Konten', text: 'Unerratbare Zimmer-Codes plus Aufenthalts-PIN mit Sperre nach Fehlversuchen.' },
    { icon: Moon, title: 'DND wird respektiert', text: '„Bitte nicht stören" graut das Zimmer auf dem Board aus — niemand klopft umsonst.' },
    { icon: Clock, title: 'Stayover-Routine', text: 'Optional: ab der zweiten Nacht erinnert RoSe zur Wunschzeit an die Routine-Reinigung.' },
    { icon: BedDouble, title: 'Service-Baukasten', text: 'Eigene Services mit Optionen und optionalen Preisen — Gäste bestellen, Rezeption hakt ab.' },
    { icon: Printer, title: 'Druckfertig', text: 'Gast-Handout beim Check-in, QR-Aushänge und Login-Karten fürs Team — alles aus dem Browser.' },
    { icon: CheckCircle2, title: 'Vergessenes verfällt nicht', text: 'Bleibt ein Abschluss aus, gibt RoSe das Zimmer nach einstellbarer Zeit automatisch wieder frei.' },
    { icon: Sparkles, title: 'Hell, dunkel, barrierearm', text: 'Dark Mode, Kontrast- und Farbfehlsicht-Modi, kompakte Ansichten — eingebaut, nicht angeflanscht.' },
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
      title: 'Pension & Gasthof',
      text: 'Die Rezeption ist oft gleichzeitig Küche, Service und Housekeeping. RoSe hält den Überblick: Wer reist ab, wo wird Reinigung gewünscht, was wurde bestellt — ohne Zettelwirtschaft.',
    },
    {
      title: 'Boutique-Hotel',
      text: 'Externe oder wechselnde Reinigungskräfte? QR-Login-Karten statt Passwort-Chaos, ein gemeinsames Board statt Einweisung — und die Rezeption sieht live, was erledigt ist.',
    },
    {
      title: 'Aparthotel & Ferienwohnungen',
      text: 'Gäste bleiben länger, Routine-Reinigung im Takt: die Stayover-Automatik erinnert ab der zweiten Nacht, DND und Wünsche steuern die Gäste selbst per QR.',
    },
  ]
  return (
    <section className="border-y border-edge bg-surface-sunken">
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-black text-ink">
          Gemacht für Häuser ohne IT-Abteilung
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
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

function Pricing() {
  const tiers = [
    {
      name: 'Starter',
      price: '0 €',
      cadence: 'für immer',
      highlight: false,
      features: ['Bis 10 Zimmer', 'Alle drei Portale', 'QR-Aushänge & Handouts', 'Service-Baukasten'],
    },
    {
      name: 'Pro',
      price: '49 €',
      cadence: 'pro Monat',
      highlight: true,
      features: ['Bis 50 Zimmer', 'Alles aus Starter', 'Stayover-Automatik', 'Bevorzugter Support'],
    },
    {
      name: 'Haus-Gruppe',
      price: 'Auf Anfrage',
      cadence: 'mehrere Häuser',
      highlight: false,
      features: ['Über 50 Zimmer', 'Mehrere Properties', 'Persönliche Einrichtung', 'Individuelle Wünsche'],
    },
  ]
  return (
    <section id="preise" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-16">
      <h2 className="text-center text-3xl font-black text-ink">Preise</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-muted">
        RoSe ist in der Beta-Phase — die Pakete sind vorläufig und können sich
        bis zum offiziellen Start noch ändern.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-2xl border bg-surface-elevated p-6 shadow-sm ${
              t.highlight ? 'border-action ring-1 ring-action' : 'border-edge'
            }`}
          >
            {t.highlight && (
              <p className="mb-2 w-fit rounded-full bg-action-pill px-2.5 py-0.5 text-xs font-bold text-action-deep">
                Beliebt
              </p>
            )}
            <h3 className="text-lg font-bold text-ink">{t.name}</h3>
            <p className="mt-2">
              <span className="text-3xl font-black text-ink">{t.price}</span>{' '}
              <span className="text-sm text-ink-muted">{t.cadence}</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#registrierung"
              className={`mt-6 rounded-xl px-4 py-2.5 text-center font-bold ${
                t.highlight
                  ? 'bg-action text-action-foreground hover:bg-action-strong'
                  : 'border border-edge text-ink hover:border-edge-strong'
              }`}
            >
              Zugang anfragen
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

function Faq() {
  const items = [
    {
      q: 'Brauchen Gäste eine App oder ein Konto?',
      a: 'Nein. Gäste scannen den QR-Code im Zimmer (oder tippen die Zimmernummer ein) und geben die PIN vom Check-in ein — alles läuft im Browser.',
    },
    {
      q: 'Ersetzt RoSe unser Buchungssystem oder PMS?',
      a: 'Bewusst nicht. RoSe kümmert sich um den Aufenthalt im Haus — Reinigung, Wünsche, Services. Buchung, Preise und Abrechnung bleiben, wo sie sind.',
    },
    {
      q: 'Welche Daten speichert RoSe über Gäste?',
      a: 'Keine Namen, keine Kontaktdaten. Ein Aufenthalt ist anonym: Zimmer, Zeitraum, PIN. Beim Check-out wird die PIN sofort ungültig.',
    },
    {
      q: 'Was brauchen die Reinigungskräfte?',
      a: 'Ein beliebiges Smartphone oder Tablet. Login per gedruckter QR-Karte oder Benutzername + PIN — keine E-Mail-Adressen nötig.',
    },
    {
      q: 'Wie lange dauert die Einrichtung?',
      a: 'Zimmer anlegen, Aushänge drucken, Team-Karten drucken — realistisch unter einer Stunde. Es gibt nichts zu installieren.',
    },
    {
      q: 'Kann ich RoSe jetzt schon ausprobieren?',
      a: 'Die Self-Service-Registrierung öffnet in Kürze. Bis dahin richten wir Testzugänge persönlich ein — einfach Zugang anfragen.',
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
          Registrierung öffnet in Kürze
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          Wir schalten die Self-Service-Registrierung gerade frei. Bis dahin
          richten wir Zugänge persönlich ein — melde dich, und dein Haus ist
          meist noch am selben Tag startklar.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-xl bg-action px-6 py-3 font-bold text-action-foreground opacity-90">
            Zugang anfragen — Kontakt folgt
          </span>
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
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <Brand />
          <span>— RoomService, leichtgewichtig.</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login" className="hover:text-ink">Rezeption</Link>
          <Link href="/service/login" className="hover:text-ink">Housekeeping</Link>
          <Link href="/guest" className="hover:text-ink">Gäste-Portal</Link>
        </nav>
      </div>
    </footer>
  )
}
