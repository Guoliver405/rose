'use client'

import { useState } from 'react'
import {
  ArrowLeft, Ban, BedDouble, ChevronRight, Clock, Coffee, DoorOpen, Flag,
  KeyRound, Loader2, QrCode, SlidersHorizontal, Sparkles, Target, Users,
} from 'lucide-react'
import SlideAction from '@/components/SlideAction'
import { szeneFuerSchritt } from '@/lib/lotsen'
import { useLotseSchritt } from './schritt'
import SimFrame from './SimFrame'

/**
 * Das Reinigungsboard, nachgebaut.
 *
 * Warum nachgebaut und nicht per Coach Mark auf dem echten Board erklärt: Das
 * Reinigungs-Portal liegt hinter einem eigenen Cookie-Namespace (`svc_`) und
 * einem eigenen Konto — aus einer Rezeptions-Sitzung ist es schlicht nicht
 * erreichbar. Der Nachbau ist hier aber nicht nur der Ausweg, sondern das
 * bessere Werkzeug: kein zweites Gerät, keine Testdaten, kein Zustand, den man
 * erst mühsam herstellen muss.
 *
 * Wie in [LiveDemo.tsx](../landing/LiveDemo.tsx) sind die Bausteine eigene
 * Miniaturen mit derselben Farbsprache — die echten Board-Komponenten hängen
 * an Daten, Server-Actions und Realtime. Nur der Slider ist der echte
 * `SlideAction`, weil gerade sein Verhalten erklärt werden soll.
 *
 * **Szenen:** Läuft der Lotse, versetzt jeder Schritt den Nachbau in die Szene,
 * die er erklärt (`sim` in [lotsen.ts](../../lib/lotsen.ts)) — den
 * „Reinigung abschließen"-Slider gibt es nun einmal nur während einer
 * laufenden Reinigung. Dazwischen darf frei geklickt werden; die eigene
 * Bedienung hängt am Schritt-Schlüssel und gilt, bis der nächste Schritt
 * kommt. Kein Effekt zieht Zustand nach — dieselbe Ableitung wie im
 * `LotsePilot`.
 */

const KRAFT = 'Maria'
const KOLLEGIN = 'Sofia'

type Signal = 'none' | 'clean' | 'dnd'

type Zimmer = {
  nr: string
  etage: number
  belegt: boolean
  signal: Signal
  /** Wunsch gilt erst ab dieser Uhrzeit — bis dahin nicht offen. */
  abUhr?: string
  checkout: boolean
  prio: boolean
  reinigtVon: string | null
}

type Board = {
  angemeldet: boolean
  aufSchicht: boolean
  pause: boolean
  sonstige: boolean
  /** Eingebuchte Etage; `null` = Etagen-Übersicht. */
  etage: number | null
  /** Geöffnetes Zimmer. */
  dialog: string | null
  /** Status-Seite statt Board. */
  status: boolean
  zimmer: Zimmer[]
}

function z(nr: string, etage: number, patch: Partial<Zimmer> = {}): Zimmer {
  return { nr, etage, belegt: true, signal: 'none', checkout: false, prio: false, reinigtVon: null, ...patch }
}

/** Ausgangslage: genug Vielfalt, um jede Farbe einmal zu zeigen. */
function basisZimmer(): Zimmer[] {
  return [
    z('201', 2, { signal: 'clean' }),
    z('202', 2, { belegt: false, checkout: true }),
    z('203', 2, {}),
    z('204', 2, { signal: 'dnd' }),
    z('301', 3, { belegt: false, checkout: true, prio: true }),
    z('302', 3, { signal: 'clean', abUhr: '11:00' }),
    z('303', 3, { belegt: false }),
  ]
}

const START: Board = {
  angemeldet: false, aufSchicht: false, pause: false, sonstige: false,
  etage: null, dialog: null, status: false, zimmer: basisZimmer(),
}

function szeneState(szene: string): Board {
  switch (szene) {
    case 'schicht':
      return { ...START, angemeldet: true, status: true }
    case 'etagen':
      return { ...START, angemeldet: true, aufSchicht: true }
    case 'zimmer':
      return { ...START, angemeldet: true, aufSchicht: true, etage: 2 }
    case 'dialog':
      return { ...START, angemeldet: true, aufSchicht: true, etage: 2, dialog: '201' }
    case 'reinigung':
      return {
        ...START, angemeldet: true, aufSchicht: true, etage: 2, dialog: '201',
        zimmer: basisZimmer().map(r => (r.nr === '201' ? { ...r, reinigtVon: KRAFT } : r)),
      }
    case 'status':
      return { ...START, angemeldet: true, aufSchicht: true, etage: 2, status: true }
    default:
      return START
  }
}

type Aktion =
  | { t: 'anmelden' }
  | { t: 'schicht'; an: boolean }
  | { t: 'pause' }
  | { t: 'sonstige' }
  | { t: 'etage'; nr: number | null }
  | { t: 'dialog'; nr: string | null }
  | { t: 'start'; nr: string }
  | { t: 'fertig'; nr: string }
  | { t: 'status'; auf: boolean }

function reduce(s: Board, a: Aktion): Board {
  switch (a.t) {
    case 'anmelden': return { ...s, angemeldet: true, status: true }
    case 'schicht':
      // Das Schichtende beendet Pause und sonstige Reinigung mit.
      return { ...s, aufSchicht: a.an, pause: false, sonstige: false, status: true, etage: a.an ? s.etage : null }
    case 'pause': return { ...s, pause: !s.pause, sonstige: false }
    case 'sonstige': return { ...s, sonstige: !s.sonstige, pause: false }
    case 'etage': return { ...s, etage: a.nr, dialog: null, status: false }
    case 'dialog': return { ...s, dialog: a.nr }
    case 'start':
      return { ...s, zimmer: s.zimmer.map(r => (r.nr === a.nr ? { ...r, reinigtVon: KRAFT } : r)) }
    case 'fertig':
      return {
        ...s, dialog: null,
        zimmer: s.zimmer.map(r => (r.nr === a.nr
          ? { ...r, reinigtVon: null, checkout: false, prio: false, signal: r.signal === 'clean' ? 'none' : r.signal }
          : r)),
      }
    case 'status': return { ...s, status: a.auf }
  }
}

/* ── Ableitungen, gespiegelt aus board.ts ───────────────────────── */

/** Aufgeschobener Wunsch zählt erst ab seiner Uhrzeit — hier immer „noch nicht". */
function offen(r: Zimmer): boolean {
  if (r.reinigtVon) return false
  if (r.signal === 'clean' && r.abUhr) return false
  return r.checkout || r.prio || r.signal === 'clean'
}

function gewicht(r: Zimmer): number {
  if (!offen(r)) return 0
  return (r.prio ? 3 : 0) + (r.checkout ? 2 : 0) + (r.signal === 'clean' ? 2 : 0)
}

function balken(r: Zimmer): string {
  if (r.reinigtVon) return 'bg-positive'
  if (r.prio) return 'bg-accent'
  if (r.checkout) return 'bg-caution'
  if (r.signal === 'clean' && !r.abUhr) return 'bg-attention'
  if (r.signal === 'dnd') return 'bg-blocked'
  if (r.belegt) return 'bg-fresh'
  return 'bg-positive'
}

function zustand(r: Zimmer): string {
  if (r.reinigtVon) return r.reinigtVon === KRAFT ? 'Du bist hier' : r.reinigtVon
  if (r.prio) return 'priorisiert'
  if (r.checkout) return 'ausgecheckt'
  if (r.signal === 'clean') return r.abUhr ? `Reinigung ab ${r.abUhr}` : 'Reinigung gewünscht'
  if (r.signal === 'dnd') return 'nicht stören'
  return ''
}

const ETAGEN = [3, 2]

/** Kräfte auf einer Etage — die Kollegin steht fest auf Etage 3. */
function kraefte(s: Board, etage: number): string[] {
  const fremd = etage === 3 ? [KOLLEGIN] : []
  return s.etage === etage ? [...fremd, KRAFT] : fremd
}

/**
 * Empfehlung: höchste offene Dringlichkeit geteilt durch die Zahl der Kräfte
 * vor Ort plus eins. Etagen ohne offene Arbeit fallen raus, bei Gleichstand
 * gewinnt die untere Etage.
 */
function empfohlen(s: Board): number | null {
  let beste: number | null = null
  let bester = 0
  for (const e of [...ETAGEN].sort((a, b) => a - b)) {
    const summe = s.zimmer.filter(r => r.etage === e).reduce((n, r) => n + gewicht(r), 0)
    if (summe === 0) continue
    const wert = summe / (kraefte(s, e).length + 1)
    if (wert > bester) { bester = wert; beste = e }
  }
  return beste
}

export default function SimReinigung() {
  const { lotse, schritt, key } = useLotseSchritt()
  const szene = (lotse === 'reinigung' ? szeneFuerSchritt(lotse, schritt) : null) ?? 'login'

  // Eigene Bedienung gilt, bis der Lotse den nächsten Schritt setzt; ohne
  // laufenden Lotsen ist der Schlüssel konstant und alles bleibt stehen.
  const [eigen, setEigen] = useState<{ key: string; state: Board } | null>(null)
  const s = eigen?.key === key ? eigen.state : szeneState(szene)
  const tu = (a: Aktion) => setEigen({ key, state: reduce(s, a) })

  if (!s.angemeldet) {
    return (
      <SimFrame titel="Reinigung — Anmeldung" geraet="handy">
        <div data-lotse="reinigung.login" className="flex flex-col gap-3 rounded-xl border border-edge bg-surface-elevated p-4">
          <p className="text-center text-sm font-black text-ink">Hotel Alpenblick</p>
          <button
            type="button"
            onClick={() => tu({ t: 'anmelden' })}
            className="flex items-center justify-center gap-2 rounded-lg bg-action px-3 py-3 text-sm font-bold text-action-foreground hover:bg-action-strong"
          >
            <QrCode className="h-5 w-5" /> Login-Karte scannen
          </button>
          <p className="text-center text-xs text-ink-muted">oder</p>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Benutzername
            <span className="rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-sm text-ink">maria</span>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            PIN
            <span className="rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-sm tracking-widest text-ink">••••••</span>
          </label>
          <button
            type="button"
            onClick={() => tu({ t: 'anmelden' })}
            className="flex items-center justify-center gap-2 rounded-lg border border-edge px-3 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink"
          >
            <KeyRound className="h-4 w-4" /> Anmelden
          </button>
        </div>
      </SimFrame>
    )
  }

  if (s.status) {
    return (
      <SimFrame titel="Reinigung — Status" geraet="handy">
        <button
          type="button"
          onClick={() => tu({ t: 'status', auf: false })}
          className="mb-3 flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Zum Board
        </button>

        <p className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
          s.pause ? 'bg-caution-pill text-caution-deepest'
            : s.sonstige ? 'bg-attention-pill text-attention-deepest'
              : s.aufSchicht ? 'bg-positive-pill text-positive-deepest'
                : 'bg-surface-muted text-ink-soft'
        }`}>
          {s.pause ? 'Pause' : s.sonstige ? 'Sonstige Reinigung läuft' : s.aufSchicht ? 'Auf Schicht' : 'Nicht auf Schicht'}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[['Arbeitszeit', '3:12'], ['Pause heute', '0:20'], ['Zimmer', '7']].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-edge bg-surface-elevated px-2 py-2 text-center">
              <p className="text-sm font-black text-ink">{v}</p>
              <p className="text-[10px] text-ink-muted">{l}</p>
            </div>
          ))}
        </div>

        <div data-lotse="reinigung.status" className="mt-3 flex flex-col gap-2 rounded-xl border border-edge bg-surface-elevated p-3">
          <h3 className="text-xs font-bold text-ink-soft">Status wechseln</h3>
          {!s.aufSchicht ? (
            <div data-lotse="reinigung.schicht">
              <SlideAction
                label="Schicht beginnen" variant="success" size="compact"
                onConfirm={() => tu({ t: 'schicht', an: true })}
              />
            </div>
          ) : (
            <>
              <SlideAction
                label={s.pause ? 'Pause beenden' : 'Pause beginnen'}
                variant="warning" size="compact"
                onConfirm={() => tu({ t: 'pause' })}
              />
              <SlideAction
                label={s.sonstige ? 'Sonstige Reinigung beenden' : 'Sonstige Reinigung starten'}
                variant="warning" size="compact"
                disabled={s.pause}
                onConfirm={() => tu({ t: 'sonstige' })}
              />
              {s.pause && (
                <p className="text-[11px] text-ink-muted">
                  Erst die Pause beenden — Tätigkeiten dürfen sich nicht überschneiden.
                </p>
              )}
              <SlideAction
                label="Schicht beenden" variant="danger" size="compact"
                onConfirm={() => tu({ t: 'schicht', an: false })}
              />
              <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Coffee className="h-3.5 w-3.5" /> Pause und sonstige Reinigung laufen innerhalb der Schicht.
              </p>
            </>
          )}
        </div>
      </SimFrame>
    )
  }

  const meineEtage = s.etage
  const dialogZimmer = s.dialog ? s.zimmer.find(r => r.nr === s.dialog) ?? null : null
  const empfehlung = empfohlen(s)
  const offeneGesamt = s.zimmer.filter(offen).length
  const inArbeit = s.zimmer.filter(r => r.reinigtVon).length

  return (
    <SimFrame titel="Reinigungsboard" geraet="handy">
      {/* Kompakte Statusleiste */}
      <section className="flex flex-wrap items-center gap-1.5 rounded-lg border border-edge bg-surface-elevated px-2 py-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          s.pause ? 'bg-caution-pill text-caution-deepest' : 'bg-positive-pill text-positive-deepest'
        }`}>
          {s.pause ? 'Pause' : 'Auf Schicht'}
        </span>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
          {offeneGesamt} offen
        </span>
        {inArbeit > 0 && (
          <span className="rounded-full bg-positive-pill px-2 py-0.5 text-[11px] font-semibold text-positive-deepest">
            {inArbeit} in Arbeit
          </span>
        )}
        <button
          type="button"
          onClick={() => tu({ t: 'status', auf: true })}
          className="ml-auto flex items-center gap-1 rounded-md border border-edge px-2 py-1 text-[11px] font-bold text-ink-soft hover:border-edge-strong hover:text-ink"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Status
        </button>
      </section>

      {/* Ebene 1: Etagen */}
      {meineEtage === null && (
        <div data-lotse="reinigung.etagen" className="mt-2 flex flex-col gap-1.5">
          {ETAGEN.map(e => {
            const zimmerDerEtage = s.zimmer.filter(r => r.etage === e)
            const offeneEtage = zimmerDerEtage.filter(offen).length
            const prio = zimmerDerEtage.some(r => r.prio && offen(r))
            const leute = kraefte(s, e)
            return (
              <button
                key={e}
                type="button"
                onClick={() => tu({ t: 'etage', nr: e })}
                className={`flex flex-wrap items-center gap-2 rounded-lg border bg-surface-elevated px-3 py-2 text-left hover:border-edge-strong ${
                  prio ? 'border-accent blink-ring-priority' : empfehlung === e ? 'border-action' : 'border-edge'
                } ${offeneEtage === 0 && leute.length === 0 ? 'opacity-60' : ''}`}
              >
                <span className="text-sm font-black text-ink">Etage {e}</span>
                {empfehlung === e && (
                  <span
                    data-lotse="reinigung.naechstes"
                    className="flex items-center gap-1 rounded-full bg-action px-2 py-0.5 text-[10px] font-bold text-action-foreground"
                  >
                    <Target className={`h-3 w-3 ${prio ? '' : 'blink-icon'}`} /> Als Nächstes
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  offeneEtage > 0 ? 'bg-attention-pill text-attention-deepest' : 'bg-positive-pill text-positive-deepest'
                }`}>
                  {offeneEtage > 0 ? `${offeneEtage} offen` : 'fertig'}
                </span>
                {prio && (
                  <span className="flex items-center gap-1 rounded-full bg-accent-pill px-2 py-0.5 text-[10px] font-bold text-accent-deep">
                    <Flag className="h-3 w-3" /> Prio
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2">
                  {leute.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-soft">
                      <Users className="h-3.5 w-3.5" /> {leute.join(', ')}
                    </span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-ink-muted" />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Ebene 2: Zimmer der eingebuchten Etage */}
      {meineEtage !== null && (
        <div className="relative mt-2 flex flex-col gap-2">
          <div data-lotse="reinigung.verlassen">
            <SlideAction
              label="Zurück zu allen Etagen" variant="neutral" size="compact" direction="rtl"
              onConfirm={() => tu({ t: 'etage', nr: null })}
            />
          </div>

          <section className="rounded-lg border border-edge bg-surface-elevated px-3 py-2">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-bold text-ink-soft">
              Etage {meineEtage}
              <span className="font-normal text-ink-muted">
                {s.zimmer.filter(r => r.etage === meineEtage && offen(r)).length} offen
              </span>
              {kraefte(s, meineEtage).length > 1 && (
                <span className="flex items-center gap-1 font-normal text-ink-muted">
                  <Users className="h-3 w-3" /> {kraefte(s, meineEtage).join(', ')}
                </span>
              )}
            </h3>
            <div data-lotse="reinigung.kacheln" className="grid grid-cols-2 gap-1.5">
              {s.zimmer.filter(r => r.etage === meineEtage).map(r => {
                const grau = !offen(r) && !r.reinigtVon
                return (
                  <button
                    key={r.nr}
                    type="button"
                    onClick={() => tu({ t: 'dialog', nr: r.nr })}
                    title={zustand(r) || 'nichts zu tun'}
                    className={`flex flex-col overflow-hidden rounded-md border bg-surface text-left hover:border-edge-strong ${
                      r.prio && !r.reinigtVon ? 'border-accent blink-ring-priority' : 'border-edge'
                    } ${grau ? 'opacity-50' : ''}`}
                  >
                    <span className={`h-1.5 w-full ${balken(r)}`} />
                    <span className="flex flex-col gap-0.5 px-2 py-1.5">
                      <span className="flex items-center gap-1">
                        <span className={`text-sm font-black ${grau ? 'text-ink-muted' : 'text-ink'}`}>{r.nr}</span>
                        {r.belegt && <BedDouble className="h-3 w-3 text-active-strong" />}
                        {r.signal === 'dnd' && <Ban className="h-3 w-3 text-blocked-strong" />}
                        {r.signal === 'clean' && !r.abUhr && <Sparkles className="h-3 w-3 text-attention-strong" />}
                        {r.signal === 'clean' && r.abUhr && <Clock className="h-3 w-3 text-ink-soft" />}
                        {r.checkout && <DoorOpen className="h-3 w-3 text-caution-strong" />}
                        {r.prio && <Flag className="h-3 w-3 text-accent-strong" />}
                        {r.reinigtVon && <Loader2 className="h-3 w-3 animate-spin text-positive-strong" />}
                      </span>
                      <span className="h-3.5 truncate text-[10px] font-semibold text-ink-muted">{zustand(r)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Zimmer-Dialog — im echten Board ein Overlay, hier ebenso. */}
          {dialogZimmer && (
            <div className="absolute inset-x-0 top-8 z-10 rounded-xl border border-edge-strong bg-surface p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-base font-black text-ink">Zimmer {dialogZimmer.nr}</span>
                <button
                  type="button"
                  onClick={() => tu({ t: 'dialog', nr: null })}
                  className="text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  schließen
                </button>
              </div>
              <p className="mb-2 text-xs text-ink-muted">
                Etage {dialogZimmer.etage} · {zustand(dialogZimmer) || 'nichts zu tun'}
              </p>
              {dialogZimmer.reinigtVon ? (
                <div data-lotse="reinigung.abschliessen">
                  <SlideAction
                    label="Reinigung abschließen" variant="success" size="compact"
                    onConfirm={() => tu({ t: 'fertig', nr: dialogZimmer.nr })}
                  />
                </div>
              ) : offen(dialogZimmer) ? (
                <div data-lotse="reinigung.starten">
                  <SlideAction
                    label="Reinigung starten"
                    variant={dialogZimmer.prio ? 'priority' : 'warning'}
                    size="compact"
                    disabled={s.pause || inArbeit > 0}
                    onConfirm={() => tu({ t: 'start', nr: dialogZimmer.nr })}
                  />
                  {inArbeit > 0 && (
                    <p className="mt-1 text-[11px] text-ink-muted">
                      Erst die laufende Reinigung abschließen.
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-edge bg-surface-sunken px-3 py-2 text-[11px] text-ink-soft">
                  Für dieses Zimmer liegt kein Auftrag vor — es ist nicht gesperrt, es gibt nur
                  gerade nichts zu tun.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </SimFrame>
  )
}
