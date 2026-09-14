import Link from 'next/link'
import {
  ArrowLeft, Check, Compass, ExternalLink, Flag, IdCard, Pencil, Printer, Siren, Target, Trash2,
  UserMinus, Users, type LucideIcon,
} from 'lucide-react'
import RoomSymbol from '@/components/RoomSymbol'
import {
  bereichBasis, hilfeHub, hilfeUrl, themaBereich, themaById,
  type HilfeBlock, type HilfeThema as Thema, type IconId, type LegendeEintrag, type PillenTon,
  type Verweis, type Zeichen,
} from '@/lib/hilfe'
import { lotseById, lotseStart } from '@/lib/lotsen'
import { ROOM_BARS, ROOM_RINGS, ROOM_SYMBOLS } from '@/lib/room-symbols'

/**
 * Zeichnet ein Hilfe-Thema aus dem Katalog (`lib/hilfe.ts`).
 *
 * Bewusst eine Server-Komponente ohne Zustand: Die Hilfe ist eine Seite zum
 * Lesen und Drucken. Alles Interaktive (Lotse starten) ist ein Link.
 *
 * Die Legende zeichnet Kachel-Symbole, Balken und Ringe **mit denselben
 * Klassen wie die Boards** — über `RoomSymbol` bzw. `room-symbols.ts`. Ein
 * blinkender Ring blinkt deshalb auch hier; das ist gewollt, die Legende
 * zeigt, was man sieht.
 */

/** Sonstige Icons — `Record` über alle IDs, damit keines fehlen kann. */
const ICONS: Record<IconId, LucideIcon> = {
  siren: Siren,
  target: Target,
  users: Users,
  flag: Flag,
  check: Check,
  printer: Printer,
  idcard: IdCard,
  pencil: Pencil,
  userminus: UserMinus,
  trash: Trash2,
}

/** Pillen wie auf den Boards — dieselben Token, dieselben Familien. */
const PILLE: Record<PillenTon, string> = {
  positive: 'bg-positive-pill text-positive-deepest',
  caution: 'bg-caution-pill text-caution-deepest',
  attention: 'bg-attention-pill text-attention-deepest',
  critical: 'bg-critical-pill text-critical-deepest',
  accent: 'bg-accent-pill text-accent-deep',
  // „Als Nächstes" ist auf dem Board eine saturierte Fläche — hier genauso.
  action: 'bg-action text-action-foreground',
  neutral: 'bg-surface-muted text-ink-soft',
  outline: 'border border-edge-strong text-[10px] uppercase tracking-wide text-ink-muted',
}

/** Kasten um ein einzelnes Icon, in der Tönung seiner Familie. */
const KASTEN: Record<PillenTon, string> = {
  positive: 'bg-positive-tint text-positive-deepest',
  caution: 'bg-caution-tint text-caution-deepest',
  attention: 'bg-attention-tint text-attention-deepest',
  critical: 'bg-critical-tint text-critical-deepest',
  accent: 'bg-accent-tint text-accent-deep',
  action: 'bg-action-tint text-action-deep',
  neutral: 'bg-surface-muted text-ink-soft',
  outline: 'border border-edge-strong text-ink-muted',
}

/** Beschriftung und Text eines Eintrags — aus den Tabellen, sofern der Eintrag nichts Eigenes trägt. */
function beschriftung(e: LegendeEintrag): { label: string; text: string } {
  const z = e.zeichen
  const quelle =
    z.art === 'symbol' ? ROOM_SYMBOLS[z.id]
    : z.art === 'balken' ? ROOM_BARS[z.id]
    : z.art === 'ring' ? ROOM_RINGS[z.id]
    : null
  return {
    label: e.label ?? quelle?.label ?? '',
    text: e.text ?? quelle?.text ?? '',
  }
}

function ZeichenBild({ z }: { z: Zeichen }) {
  switch (z.art) {
    case 'symbol':
      return (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface-elevated">
          <RoomSymbol id={z.id} size="lg" />
        </span>
      )
    case 'balken':
      // Eine Mini-Kachel: Balken oben, darunter die Andeutung einer Nummer.
      return (
        <span className="flex h-10 w-10 shrink-0 flex-col overflow-hidden rounded-lg border border-edge bg-surface-elevated">
          <span className={`h-1.5 w-full ${ROOM_BARS[z.id].className}`} />
          <span className="mx-2 mt-2 h-1.5 w-4 rounded-sm bg-edge" />
        </span>
      )
    case 'ring':
      return (
        <span className={`flex h-10 w-10 shrink-0 flex-col overflow-hidden rounded-lg border bg-surface-elevated ${ROOM_RINGS[z.id].className}`}>
          <span className="h-1.5 w-full bg-edge" />
          <span className="mx-2 mt-2 h-1.5 w-4 rounded-sm bg-edge" />
        </span>
      )
    case 'icon': {
      const Icon = ICONS[z.id]
      return (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KASTEN[z.ton ?? 'neutral']}`}>
          <Icon className={`h-5 w-5 ${z.blink ? 'blink-icon' : ''}`} />
        </span>
      )
    }
    case 'pille': {
      const Icon = z.icon ? ICONS[z.icon] : null
      return (
        <span className="flex h-10 w-28 shrink-0 items-center">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${PILLE[z.ton]}`}>
            {Icon && <Icon className={`h-3.5 w-3.5 ${z.blink ? 'blink-icon' : ''}`} />}
            {z.text}
          </span>
        </span>
      )
    }
  }
}

const VERWEIS_KLASSE = 'flex w-full items-center gap-3 rounded-lg border border-edge bg-surface px-3 py-2 text-left hover:border-edge-strong'

function VerweisLink({
  v, slug, bereich, onThema,
}: {
  v: Verweis; slug: string; bereich: 'haus' | 'konto'; onThema?: (id: string) => void
}) {
  const z = v.ziel
  // In der Leiste wechselt ein Themen-Verweis das Thema an Ort und Stelle —
  // die Seite dahinter bleibt stehen, das ist der Sinn der Leiste.
  if (z.art === 'thema' && onThema) {
    return (
      <button type="button" onClick={() => onThema(z.id)} className={VERWEIS_KLASSE}>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">{v.label}</span>
          {v.hinweis && <span className="block text-xs text-ink-muted">{v.hinweis}</span>}
        </span>
      </button>
    )
  }
  let href: string
  let extern = false
  if (z.art === 'thema') {
    const thema = themaById(z.id)
    href = thema ? hilfeUrl(thema, slug) : hilfeHub(slug)
  } else if (z.art === 'lotse') {
    const lotse = lotseById(z.id)
    href = lotse ? lotseStart(lotse, slug) : hilfeHub(slug)
  } else if (z.art === 'seite') {
    href = `${bereichBasis(z.bereich ?? bereich, slug)}${z.path}`
  } else {
    href = z.href
    extern = true
  }
  return (
    <Link href={href} className={VERWEIS_KLASSE}>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{v.label}</span>
        {v.hinweis && <span className="block text-xs text-ink-muted">{v.hinweis}</span>}
      </span>
      {extern && <ExternalLink className="h-4 w-4 shrink-0 text-ink-muted" />}
    </Link>
  )
}

type BlockProps = {
  b: HilfeBlock
  slug: string
  bereich: 'haus' | 'konto'
  /** Leisten-Fassung: eine Spalte, keine Breitengrenzen. */
  kompakt?: boolean
  onThema?: (id: string) => void
}

function Block({ b, slug, bereich, kompakt, onThema }: BlockProps) {
  const breite = kompakt ? '' : 'max-w-2xl'
  switch (b.art) {
    case 'text':
      return (
        <section className="flex flex-col gap-2">
          {b.titel && <h2 className="text-base font-black text-ink">{b.titel}</h2>}
          {b.absaetze.map((a, i) => (
            <p key={i} className={`${breite} text-sm leading-relaxed text-ink-soft`}>{a}</p>
          ))}
        </section>
      )
    case 'legende':
      return (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-black text-ink">{b.titel}</h2>
            {b.hinweis && <p className="text-xs text-ink-muted">{b.hinweis}</p>}
          </div>
          <ul className="flex flex-col divide-y divide-edge rounded-xl border border-edge bg-surface">
            {b.eintraege.map((e, i) => {
              const { label, text } = beschriftung(e)
              return (
                <li key={i} className="flex items-start gap-3 px-3 py-2.5">
                  <ZeichenBild z={e.zeichen} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">{label}</span>
                    <span className="block text-sm leading-relaxed text-ink-soft">{text}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )
    case 'fragen':
      return (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-black text-ink">{b.titel ?? 'Fragen'}</h2>
          <dl className="flex flex-col divide-y divide-edge rounded-xl border border-edge bg-surface">
            {b.eintraege.map((e, i) => (
              <div key={i} className="px-3 py-2.5">
                <dt className="text-sm font-bold text-ink">{e.frage}</dt>
                <dd className={`mt-1 ${breite} text-sm leading-relaxed text-ink-soft`}>{e.antwort}</dd>
              </div>
            ))}
          </dl>
        </section>
      )
    case 'verweise':
      return (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-black text-ink">{b.titel ?? 'Siehe auch'}</h2>
          <div className={`grid grid-cols-1 gap-2 ${kompakt ? '' : 'sm:grid-cols-2'}`}>
            {b.eintraege.map((v, i) => (
              <VerweisLink key={i} v={v} slug={slug} bereich={bereich} onThema={onThema} />
            ))}
          </div>
        </section>
      )
  }
}

/**
 * Nur die Blöcke — für die Leiste (kompakt, Themenwechsel an Ort und Stelle)
 * und für Seiten mit eigenem Kopf.
 */
export function HilfeBloecke({
  thema, slug, kompakt, onThema,
}: {
  thema: Thema; slug: string; kompakt?: boolean; onThema?: (id: string) => void
}) {
  const bereich = themaBereich(thema)
  return (
    <div className={`flex flex-col ${kompakt ? 'gap-5' : 'gap-6'}`}>
      {thema.bloecke.map((b, i) => (
        <Block key={i} b={b} slug={slug} bereich={bereich} kompakt={kompakt} onThema={onThema} />
      ))}
    </div>
  )
}

/**
 * Die ganze Hilfe-Seite: Rücklink, Titel, „Lotse starten", Blöcke.
 * `zurueck` ist der Weg aus der Seite heraus — im Haus der Hub, im
 * Konto-Bereich die Häuser-Seite (dort gibt es keinen Hub).
 */
export default function HilfeThema({
  thema, slug, zurueck,
}: {
  thema: Thema
  slug: string
  zurueck: { href: string; label: string }
}) {
  const lotse = thema.lotse ? lotseById(thema.lotse) : null
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={zurueck.href} className="flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink print:hidden">
            <ArrowLeft className="h-4 w-4" /> {zurueck.label}
          </Link>
          {lotse && (
            <Link
              href={lotseStart(lotse, slug)}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong print:hidden"
            >
              <Compass className="h-4 w-4" /> Lotse starten
            </Link>
          )}
        </div>
        <h1 className="text-xl font-black text-ink">{thema.title}</h1>
        <p className="max-w-2xl text-sm text-ink-soft">{thema.subtitle}</p>
      </div>
      <HilfeBloecke thema={thema} slug={slug} />
    </div>
  )
}
