import { Leaf, QrCode } from 'lucide-react'
import QrImage from '@/components/QrImage'
import type { GuestSheetText } from '@/lib/guest-guide'
import HotelLogo from './HotelLogo'
import PortalLegend, { KNOEPFE, TON } from './PortalLegend'

/**
 * Das gedruckte Gäste-Blatt — DIN A4 und kompakt, aus **einer** Props-Quelle.
 *
 * Beide Druckflächen des Portals rendern dasselbe Blatt und unterscheiden sich
 * nur im Zugangsblock (Bauplan `Sessions/Druckblaetter-Plan-2026-09-09.md`):
 *
 * - `variant="aushang"` … fester Zimmer-QR, die PIN kommt vom Check-in. Das
 *   Blatt hängt **permanent** im Zimmer und druckt deshalb **keine Regel und
 *   keine Uhrzeit**: beides hängt an den Policies und veraltet stillschweigend,
 *   wenn das Haus umstellt. Statt dessen der policy-neutrale
 *   Nachhaltigkeits-Satz.
 * - `variant="handout"` … Zugang dieses Aufenthalts (QR + PIN, oder
 *   individueller QR ohne PIN). Entsteht bei jedem Check-in neu und darf
 *   deshalb die vollen Sätze mit Uhrzeiten tragen.
 *
 * **Drei Print-Regeln stecken im Markup:**
 *
 * 1. **Keine Farbfläche mit heller Schrift.** Browser drucken Hintergründe
 *    standardmäßig nicht — ein gefüllter Kopfbalken käme weiß auf weiß aus dem
 *    Drucker (genau der Fehler des alten Zimmer-Aushangs). Farbe tragen Linien
 *    und helle Tönungen mit dunklem Text.
 * 2. **`data-theme="light"` am Blatt.** Die Vorschau soll aussehen wie das
 *    Papier, auch wenn die Rezeption im Dark Mode arbeitet. Die Token sind auf
 *    einem einfachen Attribut-Selektor definiert, also genügt das Attribut an
 *    der Wurzel des Blattes.
 * 3. **Kein Seitenumbruch hier drin.** Wie viele Blätter auf eine Seite gehen,
 *    entscheidet die aufrufende Seite — ein `break-after` in der Komponente
 *    erzeugte beim Einzeldruck eine leere Seite.
 *
 * Maße in mm für den Druck, px für die Vorschau. Der QR ist 55 mm (A4) bzw.
 * 42 mm (kompakt) — Faustregel Kantenlänge ≈ Leseabstand ÷ 10, gerechnet für
 * den Rahmen an der Wand (~50 cm) und den Zettel in der Hand (~30 cm).
 */

export type GuestSheetVariant = 'aushang' | 'handout'

export type GuestSheetProps = {
  variant: GuestSheetVariant
  hotelName: string
  /** Öffentliche Logo-URL oder `null` — dann steht der Hausname im Kopf. */
  logoUrl: string | null
  roomNumber: string
  building: string | null
  /** Ziel des QR: Zimmer-Token, Aufenthalts-Token oder die Hotel-Adresse. */
  qrUrl: string
  /** Abtippbare Hotel-Adresse — nur wo sie zum Zugang passt, sonst `null`. */
  manualUrl: string | null
  /** Nur beim Handout im PIN-Verfahren. */
  pin: string | null
  /** Verfahren `link`: Der Zettel IST der Zugang und darf nicht im Zimmer bleiben. */
  individuell: boolean
  /** Ein bis zwei Sprachblöcke, in Druckreihenfolge (`parseSheetLanguages`). */
  texts: GuestSheetText[]
}

/* ── DIN A4 ─────────────────────────────────────────────────────────────── */

export function GuestSheetA4(p: GuestSheetProps) {
  const [erste, zweite] = p.texts
  const zweisprachig = (lies: (t: GuestSheetText) => string) => ({
    erste: lies(erste),
    zweite: zweite ? lies(zweite) : null,
  })
  const willkommen = p.texts.map(t => t.welcome).join(' · ')
  const zimmer = p.texts.map(t => t.room).join(' · ')

  return (
    <article
      data-theme="light"
      className="w-full max-w-[820px] rounded-2xl border border-edge bg-surface p-8 shadow-lg print:w-[186mm] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      {/* ── Kopf: Logo links, Zimmernummer rechts ──────────────────────── */}
      <header className="border-t-4 border-action pt-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 pt-1">
            <HotelLogo url={p.logoUrl} hotelName={p.hotelName} variant="a4" />
            <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-action">
              {willkommen}
            </p>
            {p.logoUrl && (
              <p className="text-[11px] font-semibold text-ink-soft">
                {p.building ? `${p.building} · ` : ''}{p.hotelName}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">{zimmer}</p>
            <p className="text-[60px] font-black leading-none text-ink">{p.roomNumber}</p>
            {!p.logoUrl && p.building && (
              <p className="mt-1 text-[11px] font-semibold text-ink-soft">{p.building}</p>
            )}
          </div>
        </div>
      </header>

      {/* ── Zugang: QR links, PIN und Adresse rechts ───────────────────── */}
      <section className="mt-6 flex items-start gap-7 border-y border-edge py-5">
        <div className="shrink-0">
          <QrImage
            value={p.qrUrl}
            size={224}
            renderPx={700}
            quietModules={4}
            alt="QR-Code zum Gäste-Portal"
            className="h-[224px] w-[224px] rounded-lg border-2 border-edge print:h-[55mm] print:w-[55mm]"
          />
          <p className="mt-2 flex items-start gap-1.5 text-[12px] font-bold leading-tight text-ink">
            <QrCode className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            <span>{erste.scan}</span>
          </p>
          {zweite && <p className="text-[11px] leading-tight text-ink-soft">{zweite.scan}</p>}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {p.pin ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ink-soft">
                {p.texts.map(t => t.pinLabel).join(' · ')}
              </p>
              <p className="font-mono text-[46px] font-black leading-none tracking-[0.18em] text-ink">
                {p.pin}
              </p>
            </div>
          ) : (
            <Doppelsatz
              {...zweisprachig(t => t.pinFromReception)}
              klasse="text-[14px] font-bold leading-snug text-ink"
              kleinKlasse="text-[12px] leading-snug text-ink-soft"
            />
          )}

          <Doppelsatz
            {...zweisprachig(t => t.access)}
            klasse="text-[13.5px] leading-snug text-ink"
            kleinKlasse="text-[12px] leading-snug text-ink-soft"
          />

          {p.individuell && (
            <Doppelsatz
              {...zweisprachig(t => t.keep)}
              klasse="text-[13px] font-bold leading-snug text-attention-deepest"
              kleinKlasse="text-[11.5px] leading-snug text-ink-soft"
            />
          )}

          {p.manualUrl && (
            <p className="border-t border-dashed border-edge pt-2 text-[11.5px] leading-snug text-ink-soft">
              <span className="font-bold">{p.texts.map(t => t.withoutQr).join(' · ')}:</span>{' '}
              <span className="break-all">{p.manualUrl}</span>
            </p>
          )}
        </div>
      </section>

      {/* ── Legende der Portal-Knöpfe ──────────────────────────────────── */}
      <section className="mt-5">
        <PortalLegend texts={p.texts} />
      </section>

      {/* ── Variabler Block: Regel nur aufs Handout ────────────────────── */}
      <section className="mt-5 flex flex-col gap-2.5">
        {p.variant === 'handout' && (
          <Doppelsatz
            {...zweisprachig(t => t.cleaningRule)}
            klasse="text-[13.5px] leading-snug text-ink"
            kleinKlasse="text-[12px] leading-snug text-ink-soft"
          />
        )}
        <div className="flex items-start gap-2 rounded-xl border border-positive-tint-edge bg-positive-tint px-3 py-2.5">
          <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-positive-strong" strokeWidth={2.5} />
          <div className="min-w-0">
            <Doppelsatz
              {...zweisprachig(t =>
                p.variant === 'handout' ? t.sustainability : t.sustainabilityNeutral,
              )}
              klasse="text-[13.5px] font-semibold leading-snug text-positive-deepest"
              kleinKlasse="text-[12px] leading-snug text-positive-deep"
            />
          </div>
        </div>
      </section>

      <footer className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 border-t border-edge pt-2">
        <p className="text-[11px] font-semibold text-ink-soft">{p.hotelName}</p>
        <p className="text-[11px] text-ink-muted">
          {p.texts.map(t => t.footer).join(' · ')}
        </p>
      </footer>
    </article>
  )
}

/* ── Kompakt (Zettel in die Hand, vier pro A4-Seite) ─────────────────────── */

/**
 * Absichtlich **kein** Handy-Umriss und keine Hinweiszeilen: Auf 92 × 130 mm
 * hätten sie keinen Platz, und dieser Zettel wandert in die Tasche, nicht an
 * die Wand. Er trägt den Zugang plus die drei Knopf-Namen als Vorschau.
 *
 * Die Maße sind knapp unter A6 (105 × 148,5 mm): Vier echte A6-Karten ergeben
 * exakt 297 mm, und kein Standarddrucker druckt randlos — die äußeren Kanten
 * würden abgeschnitten. Bei 92 × 130 mm bleiben vier Karten samt Schnittrand
 * sicher im druckbaren Bereich.
 */
export function GuestSheetCompact(p: GuestSheetProps) {
  const [erste, zweite] = p.texts

  return (
    <article
      data-theme="light"
      className="flex w-full max-w-[320px] flex-col rounded-xl border-2 border-dashed border-edge-strong bg-surface p-4 print:h-[130mm] print:w-[92mm] print:max-w-none print:rounded-none"
    >
      <header className="flex items-start justify-between gap-3 border-b border-edge pb-2">
        <div className="min-w-0">
          <HotelLogo url={p.logoUrl} hotelName={p.hotelName} variant="compact" />
          {p.logoUrl && (
            <p className="mt-0.5 truncate text-[9px] font-semibold text-ink-muted">{p.hotelName}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            {erste.room}
          </p>
          <p className="text-[26px] font-black leading-none text-ink">{p.roomNumber}</p>
        </div>
      </header>

      <div className="mt-3 flex items-start gap-3">
        <QrImage
          value={p.qrUrl}
          size={151}
          renderPx={600}
          quietModules={4}
          alt="QR-Code zum Gäste-Portal"
          className="h-[145px] w-[145px] shrink-0 rounded border border-edge print:h-[42mm] print:w-[42mm]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {p.pin ? (
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-ink-soft">
                {p.texts.map(t => t.pinLabel).join(' · ')}
              </p>
              <p className="font-mono text-[28px] font-black leading-none tracking-[0.14em] text-ink">
                {p.pin}
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-bold leading-snug text-ink">{erste.pinFromReception}</p>
              {zweite && (
                <p className="text-[9.5px] leading-snug text-ink-soft">{zweite.pinFromReception}</p>
              )}
            </>
          )}
          <div>
            <p className="text-[10px] font-semibold leading-snug text-ink">{erste.scan}</p>
            {zweite && <p className="text-[9px] leading-snug text-ink-soft">{zweite.scan}</p>}
          </div>
          {p.individuell && (
            <p className="text-[9.5px] font-bold leading-snug text-attention-deepest">{erste.keep}</p>
          )}
        </div>
      </div>

      {/* Vorschau der drei Knöpfe — Icon und Name wie im Portal, ohne
          Erläuterung: die liefert der Bildschirm nach dem Scannen. */}
      <ul className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-edge pt-2.5">
        {KNOEPFE.map(({ key, Icon, ton }) => (
          <li key={key} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${TON[ton]}`}>
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="truncate text-[11px] font-bold leading-tight text-ink">
              {erste.buttons[key].label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        <p className="text-[9px] leading-snug text-ink-soft">{erste.footer}</p>
        {p.manualUrl && (
          <p className="mt-1 break-all text-[8px] leading-snug text-ink-muted">{p.manualUrl}</p>
        )}
      </div>
    </article>
  )
}

/** Erste Sprache groß, zweite klein darunter — oder nur die erste. */
function Doppelsatz({
  erste, zweite, klasse, kleinKlasse,
}: {
  erste: string
  zweite: string | null
  klasse: string
  kleinKlasse: string
}) {
  return (
    <div>
      <p className={klasse}>{erste}</p>
      {zweite && <p className={`mt-0.5 ${kleinKlasse}`}>{zweite}</p>}
    </div>
  )
}
