'use client'

import { useState } from 'react'
import { Check, CheckCircle2, Clock, KeyRound, Leaf, Moon, QrCode, Sparkles } from 'lucide-react'
import { szeneFuerSchritt } from '@/lib/lotsen'
import Rich from '@/components/i18n/Rich'
import { format, plural } from '@/lib/i18n/format'
import type { GuestMessages, HelpMessages } from '@/lib/i18n'
import { useLotseSchritt } from './schritt'
import SimFrame from './SimFrame'

/**
 * Das Gäste-Portal, nachgebaut.
 *
 * Erreichbar ist das echte Portal nur mit einem laufenden Aufenthalt samt PIN
 * — aus einer Rezeptions-Sitzung also gar nicht. Der Nachbau zeigt dieselben
 * Elemente in derselben Farbsprache; er schreibt nichts und ruft nichts auf.
 *
 * Die Werte („Alpenblick", Zimmer 202, Grenze 11:00 Uhr) sind Beispiel und
 * bewusst nicht aus dem eigenen Haus geladen: Der Nachbau soll auch dann
 * etwas zeigen, wenn im Haus noch kein einziges Zimmer angelegt ist — genau
 * dann sieht man ihn sich nämlich an.
 *
 * Szenen und eigene Bedienung funktionieren wie in
 * [SimReinigung.tsx](./SimReinigung.tsx), die Texte ebenso: Was das echte
 * Portal zeigt, kommt wortgleich aus dessen Sprachdatei (`guest`), Erklärzeilen
 * und Beispielwerte aus `help.sim`.
 */

/** Texte des echten Gästeportals, die der Nachbau wortgleich zeigt. */
export type SimGuestTexts = Pick<GuestMessages, 'brand' | 'login' | 'status' | 'signal' | 'services'>

const ZIMMER = '202'
const GRENZE = '11:00'

type ServiceId = keyof HelpMessages['sim']['gast']['services']

/** `meldung` = Meldung ans Haus: Knopf „Melden“ statt „Bestellen“, wie im echten Portal. */
const SERVICES: { id: ServiceId; dringend: boolean; meldung: boolean }[] = [
  { id: 'towels', dringend: false, meldung: false },
  { id: 'breakfast', dringend: false, meldung: false },
  { id: 'technician', dringend: true, meldung: true },
]

const STUNDEN = ['09:00', '10:00', '11:00']

type Signal = 'none' | 'clean' | 'dnd'

type Gast = {
  angemeldet: boolean
  signal: Signal
  /** Gewählte Uhrzeit für „frühestens ab", solange kein Wunsch aktiv ist. */
  abUhr: string | null
  /** Gesetzte Uhrzeit am aktiven Wunsch. */
  aktivAb: string | null
  /** „Heute keine Reinigung" (nur bei täglicher Routine des Hauses). */
  verzicht: boolean
  bestellt: ServiceId[]
}

const START: Gast = { angemeldet: false, signal: 'none', abUhr: null, aktivAb: null, verzicht: false, bestellt: [] }

function szeneState(szene: string): Gast {
  switch (szene) {
    case 'portal':
    case 'services':
      return { ...START, angemeldet: true }
    case 'aufschub':
      return { ...START, angemeldet: true, abUhr: '10:00' }
    case 'gewuenscht':
      return { ...START, angemeldet: true, signal: 'clean', aktivAb: '10:00' }
    case 'verzicht':
      return { ...START, angemeldet: true, verzicht: true }
    case 'dnd':
      return { ...START, angemeldet: true, signal: 'dnd' }
    case 'bestellt':
      return { ...START, angemeldet: true, bestellt: ['towels'] }
    default:
      return START
  }
}

type Aktion =
  | { t: 'anmelden' }
  | { t: 'signal'; signal: Signal }
  | { t: 'abUhr'; uhr: string | null }
  | { t: 'bestellen'; id: ServiceId }
  | { t: 'verzicht' }

function reduce(s: Gast, a: Aktion): Gast {
  switch (a.t) {
    case 'anmelden':
      return { ...s, angemeldet: true }
    case 'signal': {
      // Erneut tippen nimmt zurück; ein Wunsch übernimmt die gewählte Uhrzeit.
      const neu: Signal = s.signal === a.signal ? 'none' : a.signal
      // Ein Wunsch hebt den Verzicht für heute auf.
      return { ...s, signal: neu, aktivAb: neu === 'clean' ? s.abUhr : null, verzicht: neu === 'clean' ? false : s.verzicht }
    }
    case 'verzicht':
      return { ...s, verzicht: !s.verzicht, signal: !s.verzicht && s.signal === 'clean' ? 'none' : s.signal, aktivAb: null }
    case 'abUhr':
      return { ...s, abUhr: a.uhr }
    case 'bestellen':
      return { ...s, bestellt: [...s.bestellt, a.id] }
  }
}

export default function SimGast({
  m,
  guest,
  intlLocale,
}: {
  /** `help.sim` – Rahmen, Erklärzeilen, Beispielwerte. */
  m: HelpMessages['sim']
  guest: SimGuestTexts
  intlLocale: string
}) {
  const t = m.gast
  const sig = guest.signal
  const { lotse, schritt, key } = useLotseSchritt()
  const szene = (lotse === 'gast' ? szeneFuerSchritt(lotse, schritt) : null) ?? 'zugang'

  const [eigen, setEigen] = useState<{ key: string; state: Gast } | null>(null)
  const s = eigen?.key === key ? eigen.state : szeneState(szene)
  const tu = (a: Aktion) => setEigen({ key, state: reduce(s, a) })

  if (!s.angemeldet) {
    return (
      <SimFrame titel={guest.brand.signIn} badge={m.frame.badge} geraet="handy">
        <div data-lotse="gast.zugang" className="flex flex-col gap-3 rounded-xl border border-edge bg-surface-elevated p-4 text-center">
          <QrCode className="mx-auto h-10 w-10 text-ink-muted" />
          <p className="text-sm font-black text-ink">{m.house}</p>
          <p className="text-xs text-ink-muted">{t.scanned}</p>
          <span className="mx-auto rounded-lg border border-edge bg-surface px-4 py-2 font-mono text-lg tracking-[0.4em] text-ink">
            ••••
          </span>
          <button
            type="button"
            onClick={() => tu({ t: 'anmelden' })}
            className="flex items-center justify-center gap-2 rounded-lg bg-action px-3 py-2.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
          >
            <KeyRound className="h-4 w-4" /> {guest.login.submit}
          </button>
          <p className="text-[11px] text-ink-muted">{t.otherMode}</p>
        </div>
      </SimFrame>
    )
  }

  return (
    <SimFrame titel={t.frame.portal} badge={m.frame.badge} geraet="handy">
      <div data-lotse="gast.portal" className="mb-3 text-center">
        <p className="text-[11px] text-ink-muted">{m.house}</p>
        <p className="text-lg font-black text-ink">{format(guest.status.room, { number: ZIMMER })}</p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-lotse="gast.reinigen"
          onClick={() => tu({ t: 'signal', signal: 'clean' })}
          className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
            s.signal === 'clean'
              ? 'border-attention bg-attention text-attention-foreground'
              : 'border-edge bg-surface-elevated text-ink hover:border-edge-strong'
          }`}
        >
          <Sparkles className="h-5 w-5 shrink-0" />
          <span data-lotse="gast.aktiv">
            <span className="block text-base font-bold">{sig.clean.label}</span>
            <span className={`block text-xs ${s.signal === 'clean' ? '' : 'text-ink-muted'}`}>
              {s.signal === 'clean'
                ? s.aktivAb
                  ? format(sig.clean.activeFrom, { time: s.aktivAb })
                  : sig.clean.active
                : s.abUhr
                  ? format(sig.clean.idleFrom, { time: s.abUhr })
                  : sig.clean.idle}
            </span>
          </span>
        </button>

        {/* „Frühestens ab" — nur, solange kein Wunsch aktiv ist. */}
        {s.signal !== 'clean' && (
          <div data-lotse="gast.aufschub" className="rounded-xl border border-edge bg-surface-sunken px-3 py-2.5">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
              <Clock className="h-3.5 w-3.5 text-ink-muted" /> {sig.defer.title}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => tu({ t: 'abUhr', uhr: null })}
                className={chip(s.abUhr === null)}
              >
                {sig.defer.now}
              </button>
              {STUNDEN.map(u => (
                <button key={u} type="button" onClick={() => tu({ t: 'abUhr', uhr: u })} className={chip(s.abUhr === u)}>
                  {u}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-muted">
              <Rich text={sig.defer.limit} vars={{ limit: GRENZE }} tags={{ b: c => <strong className="font-bold text-ink-soft">{c}</strong> }} />
            </p>
          </div>
        )}

        <button
          type="button"
          data-lotse="gast.verzicht"
          onClick={() => tu({ t: 'verzicht' })}
          className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
            s.verzicht
              ? 'border-positive bg-positive text-positive-foreground'
              : 'border-edge bg-surface-elevated text-ink hover:border-edge-strong'
          }`}
        >
          <Leaf className="h-5 w-5 shrink-0" />
          <span>
            <span className="block text-base font-bold">{sig.skip.label}</span>
            <span className={`block text-xs ${s.verzicht ? '' : 'text-ink-muted'}`}>
              {s.verzicht ? sig.skip.active : sig.skip.idle}
            </span>
          </span>
        </button>
        <p className="-mt-1 px-1 text-[10px] text-ink-muted">{t.onlyDaily}</p>

        <button
          type="button"
          data-lotse="gast.dnd"
          onClick={() => tu({ t: 'signal', signal: 'dnd' })}
          className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
            s.signal === 'dnd'
              ? 'border-blocked bg-blocked text-blocked-foreground'
              : 'border-edge bg-surface-elevated text-ink hover:border-edge-strong'
          }`}
        >
          <Moon className="h-5 w-5 shrink-0" />
          <span>
            <span className="block text-base font-bold">{sig.dnd.label}</span>
            <span className={`block text-xs ${s.signal === 'dnd' ? '' : 'text-ink-muted'}`}>
              {s.signal === 'dnd' ? sig.dnd.active : sig.dnd.idle}
            </span>
          </span>
        </button>
      </div>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{guest.services.heading}</p>
      <div data-lotse="gast.services" className="mt-1 flex flex-col gap-1">
        {SERVICES.map(sv => {
          const offen = s.bestellt.includes(sv.id)
          const text = t.services[sv.id]
          return (
            <div
              key={sv.id}
              className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 ${
                sv.dringend ? 'border-critical-tint-edge bg-critical-tint' : 'border-edge bg-surface-elevated'
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ink">{text.name}</span>
                <span className={`text-[11px] ${sv.dringend ? 'font-bold text-critical-strong' : 'text-ink-muted'}`}>
                  {text.meta}
                </span>
              </span>
              {offen ? (
                <span className="flex shrink-0 items-center gap-1 rounded bg-positive-pill px-2 py-1 text-[10px] font-bold text-positive-deepest">
                  <Check className="h-3 w-3" /> {t.requested}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => tu({ t: 'bestellen', id: sv.id })}
                  className="shrink-0 rounded bg-action px-2 py-1 text-[10px] font-bold text-action-foreground hover:bg-action-strong"
                >
                  {sv.meldung ? guest.services.report : guest.services.order}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div data-lotse="gast.bestellt" className="mt-3">
        {s.bestellt.length > 0 ? (
          <p className="flex items-center gap-2 rounded-xl border border-positive-pill-edge bg-positive-tint px-3 py-2 text-xs font-semibold text-positive-deep">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {plural(intlLocale, s.bestellt.length, t.openRequests)}
          </p>
        ) : (
          <p className="text-center text-[11px] text-ink-muted">{t.noRequests}</p>
        )}
      </div>
    </SimFrame>
  )
}

function chip(aktiv: boolean): string {
  return `rounded-lg border px-2.5 py-1 text-xs font-bold ${
    aktiv
      ? 'border-attention bg-attention text-attention-foreground'
      : 'border-edge bg-surface-elevated text-ink-soft hover:border-edge-strong'
  }`
}
