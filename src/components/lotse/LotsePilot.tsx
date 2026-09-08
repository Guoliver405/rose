'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Compass, X } from 'lucide-react'
import { clampStep, lotseById, type LotseBereich } from '@/lib/lotsen'
import { meldeSchritt } from './schritt'

/**
 * Der Lotse — Coach Marks über den echten Seiten.
 *
 * Vier Entscheidungen, die den Rest erklären:
 *
 * 1. **Der Schritt steht in der URL** (`?lotse=…&schritt=…`). Ein Lotse läuft
 *    über mehrere Seiten; jede davon ist ein echter Seitenwechsel mit neuem
 *    Server-Rendering. React-State überlebt das nicht, die URL schon. Innerhalb
 *    derselben Seite wird nur `history.replaceState` benutzt — ein
 *    `router.replace` würde für jeden Schritt die Server-Komponenten neu
 *    rendern, und das ist der teuerste Weg, einen Text auszutauschen.
 *
 * 2. **Nichts wird blockiert.** Alle Ebenen des Overlays sind
 *    `pointer-events-none`, nur die Karte selbst nimmt Klicks an. Die Lotsen
 *    erklären, sie fernsteuern nicht: Wer während der Erklärung etwas
 *    ausprobieren will, soll das können, ohne den Lotsen zu beenden.
 *
 * 3. **Der Anker wird gesucht, nicht vorausgesetzt.** Nach einem
 *    Seitenwechsel ist das Ziel womöglich noch nicht im DOM, und ein Board mit
 *    Realtime-Updates verschiebt sich unter dem Coach Mark. Deshalb misst ein
 *    Intervall dauerhaft nach. Bleibt der Anker aus, erscheint die Karte unten
 *    rechts statt gar nicht — und im Dev-Betrieb eine Warnung auf der Konsole,
 *    damit ein verschobener Abschnitt auffällt, bevor ein Kunde ihn findet.
 *
 * 4. **Zustand wird abgeleitet, nicht in Effekten nachgezogen.** Messung,
 *    Schritt und „beendet" hängen an einem Schlüssel aus Pfad, Lotse und
 *    Schritt; passt der Schlüssel nicht zum aktuellen Stand, gilt der Wert als
 *    veraltet. Ein `setState` im Effekt-Körper würde bei jedem Schritt eine
 *    zweite Renderrunde auslösen (und ESLint zu Recht anschlagen lassen).
 */

/** Abstand zwischen Ankerrahmen und Kartenkante. */
const LUFT = 14
/** Wie weit der Rahmen um den Anker herum greift. */
const RAND = 8
const KARTE_BREIT = 360
/** ~3 s Geduld, bis ein Anker als fehlend gilt (Intervall alle 200 ms). */
const VERSUCHE_BIS_AUFGABE = 15

const KEIN_ABO = () => () => {}

type Messung = { key: string; rect: DOMRect | null; fehlt: boolean }

function bewegungReduziert(): boolean {
  const modus = document.documentElement.dataset.motion
  if (modus === 'reduced') return true
  if (modus === 'full') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function LotsePilot({
  base,
  bereich = 'haus',
}: {
  /** Prefix aller Schritt-Pfade dieses Bereichs. */
  base: string
  /** Welchen Bereich dieser Pilot bedient; Lotsen des anderen laesst er liegen. */
  bereich?: LotseBereich
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // `createPortal` braucht ein DOM. Über den externen Store statt über einen
  // Effekt, damit kein setState im Effekt-Körper nötig ist.
  const imBrowser = useSyncExternalStore(KEIN_ABO, () => true, () => false)

  const lotseId = params.get('lotse')
  const schrittParam = params.get('schritt')
  // Haus und Konto haben je einen eigenen Piloten mit eigener Basis. Ein
  // fremder Lotse wird hier ignoriert, statt ihn mit der falschen Basis zu
  // verlinken — sonst zeigte ein Konto-Schritt auf /h/<slug>/admin/abrechnung.
  const gefunden = lotseId ? lotseById(lotseId) : null
  const lotse = gefunden && (gefunden.bereich ?? 'haus') === bereich ? gefunden : null

  // Ein Schlüssel für den Stand, den die URL beschreibt. Er ändert sich bei
  // jedem echten Seitenwechsel — und nur dann.
  const urlKey = `${pathname}|${lotseId}|${schrittParam}`

  // Schritte innerhalb derselben Seite laufen lokal; die URL wird nur
  // mitgeschrieben. Passt der Schlüssel nicht mehr, zählt wieder die URL.
  const [lokal, setLokal] = useState<{ key: string; index: number } | null>(null)
  const index = lotse
    ? (lokal?.key === urlKey ? lokal.index : clampStep(lotse, schrittParam))
    : 0

  const [verstecktKey, setVerstecktKey] = useState<string | null>(null)
  const versteckt = verstecktKey === urlKey

  const step = lotse?.steps[index] ?? null
  const anchor = step?.anchor
  const stepKey = `${urlKey}|${index}`

  const [messung, setMessung] = useState<Messung>({ key: '', rect: null, fehlt: false })
  const aktuell = messung.key === stepKey ? messung : null

  // Anker suchen, messen und nachmessen. Ein Intervall statt eines
  // MutationObservers: Es deckt zugleich Layout-Verschiebungen ab (Realtime,
  // aufklappende Abschnitte), die kein DOM-Ereignis auslösen müssen.
  useEffect(() => {
    if (!anchor || versteckt) return

    let scrolled = false
    let versuche = 0
    const messen = () => {
      const el = document.querySelector<HTMLElement>(`[data-lotse="${anchor}"]`)
      if (!el) {
        versuche += 1
        if (versuche === VERSUCHE_BIS_AUFGABE) {
          setMessung({ key: stepKey, rect: null, fehlt: true })
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[Lotse] Anker „${anchor}" nicht gefunden (Schritt ${index + 1}).`)
          }
        }
        return
      }
      if (!scrolled) {
        scrolled = true
        el.scrollIntoView({ block: 'center', behavior: bewegungReduziert() ? 'auto' : 'smooth' })
      }
      setMessung({ key: stepKey, rect: el.getBoundingClientRect(), fehlt: false })
    }

    // Erste Messung im nächsten Frame: nach dem Malen steht das Layout, und
    // der Effekt-Körper selbst schreibt keinen Zustand.
    const frame = requestAnimationFrame(messen)
    const timer = window.setInterval(messen, 200)
    window.addEventListener('scroll', messen, { passive: true, capture: true })
    window.addEventListener('resize', messen, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(timer)
      window.removeEventListener('scroll', messen, { capture: true })
      window.removeEventListener('resize', messen)
    }
  }, [anchor, index, stepKey, versteckt])

  // Auch eine echte Navigation ist ein Schrittwechsel: Wer einen Lotsen über
  // einen Link startet, ändert die Adresszeile über den Router — dabei feuert
  // weder `popstate` noch das Ereignis aus `gehe`. Ohne diese Meldung bliebe
  // eine Simulation auf der Seite in dem Zustand stehen, den der Nutzer ihr
  // zuletzt gegeben hat, statt in die Szene des ersten Schritts zu springen.
  useEffect(() => { meldeSchritt() }, [urlKey])

  // Steht in der URL ein Schritt, der auf einer anderen Seite liegt (von Hand
  // geändert, alter Link, Zurück-Taste), führt der Lotse selbst dorthin.
  // Sonst suchte er einen Anker, den es hier gar nicht geben kann, und
  // erklärte am Ende eine Seite, die niemand vor sich hat.
  const zielPfad = step ? `${base}${step.path}` : null
  useEffect(() => {
    if (!zielPfad || versteckt || zielPfad === pathname) return
    router.replace(`${zielPfad}?${params.toString()}`)
  }, [params, pathname, router, versteckt, zielPfad])

  const beenden = useCallback(() => {
    const rest = new URLSearchParams(params.toString())
    rest.delete('lotse')
    rest.delete('schritt')
    const query = rest.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    meldeSchritt()
    setVerstecktKey(urlKey)
  }, [params, pathname, urlKey])

  const gehe = useCallback((ziel: number) => {
    if (!lotse) return
    const grenze = Math.max(0, Math.min(ziel, lotse.steps.length - 1))
    const url = `${base}${lotse.steps[grenze].path}`
    const query = new URLSearchParams(params.toString())
    query.set('lotse', lotse.id)
    query.set('schritt', String(grenze))
    if (url !== pathname) {
      router.push(`${url}?${query.toString()}`)
    } else {
      window.history.replaceState(null, '', `${url}?${query.toString()}`)
      // Simulationen auf der Seite folgen dem Schritt — sie koennen die
      // Adresszeile nicht ueber Next beobachten, weil hier bewusst nicht
      // navigiert wird.
      meldeSchritt()
      setLokal({ key: urlKey, index: grenze })
    }
  }, [base, lotse, params, pathname, router, setLokal, urlKey])

  // Tastatur — aber nur, wenn gerade nicht getippt wird. Sonst würde die
  // Eingabetaste im Zimmernummern-Feld den Lotsen weiterschalten.
  useEffect(() => {
    if (!lotse || versteckt) return
    const tippt = (t: EventTarget | null) => {
      const el = t as HTMLElement | null
      if (!el?.tagName) return false
      return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { beenden(); return }
      if (tippt(e.target)) return
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        if (index + 1 >= lotse.steps.length) beenden()
        else gehe(index + 1)
      }
      if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); gehe(index - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [beenden, gehe, index, lotse, versteckt])

  if (!imBrowser || !lotse || !step || versteckt) return null

  const rect = aktuell?.fehlt ? null : aktuell?.rect ?? null
  const letzter = index + 1 >= lotse.steps.length

  // Karte unter dem Anker, wenn er in der oberen Bildhälfte liegt, sonst
  // darüber. Über `bottom` verankert braucht die Rechnung die Kartenhöhe
  // nicht zu kennen — die steht erst nach dem Rendern fest.
  let karteStil: React.CSSProperties | undefined
  if (rect) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const breite = Math.min(KARTE_BREIT, vw - 24)
    const links = Math.max(12, Math.min(rect.left + rect.width / 2 - breite / 2, vw - breite - 12))
    karteStil = rect.top + rect.height / 2 < vh / 2
      ? { left: links, top: Math.min(rect.bottom + LUFT, vh - 120), width: breite }
      : { left: links, bottom: Math.min(vh - rect.top + LUFT, vh - 120), width: breite }
  }

  const karte = (
    <div
      role="region"
      aria-label={`Lotse: ${lotse.title}`}
      style={karteStil}
      className={`pointer-events-auto flex max-h-[70vh] flex-col overflow-y-auto rounded-xl border border-edge-strong bg-surface-elevated shadow-lg ${
        rect ? 'fixed' : 'w-[min(28rem,92vw)]'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-edge px-4 py-2">
        <Compass className="h-4 w-4 shrink-0 text-action" />
        <span className="truncate text-xs font-bold text-ink-soft">{lotse.title}</span>
        <span className="ml-auto shrink-0 text-xs font-semibold text-ink-muted">
          {index + 1} / {lotse.steps.length}
        </span>
        <button
          type="button"
          onClick={beenden}
          aria-label="Lotse beenden"
          className="-mr-1 shrink-0 rounded-md p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3" aria-live="polite">
        <h2 className="text-base font-black text-ink">{step.title}</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
        {step.tun && (
          <p className="rounded-lg border border-action-tint-edge bg-action-tint px-3 py-2 text-xs font-semibold text-action-deep">
            {step.tun}
          </p>
        )}
        {aktuell?.fehlt && (
          <p className="text-xs text-ink-muted">
            Der beschriebene Bereich ist gerade nicht auf der Seite — er hängt an einer
            Einstellung, die in Ihrem Haus anders steht, oder an Daten, die es hier noch
            nicht gibt.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-edge px-4 py-2.5">
        <button
          type="button"
          onClick={() => gehe(index - 1)}
          disabled={index === 0}
          className="flex items-center gap-1 rounded-lg border border-edge px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Zurück
        </button>
        <button type="button" onClick={beenden} className="text-xs font-semibold text-ink-muted hover:text-ink">
          Beenden
        </button>
        <button
          type="button"
          onClick={() => (letzter ? beenden() : gehe(index + 1))}
          className="ml-auto flex items-center gap-1 rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground hover:bg-action-strong"
        >
          {letzter ? 'Fertig' : 'Weiter'}
          {!letzter && <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex gap-0.5 px-4 pb-3">
        {lotse.steps.map((s, i) => (
          <span
            key={`${s.path}-${s.anchor ?? i}`}
            className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-action' : 'bg-surface-muted'}`}
          />
        ))}
      </div>
    </div>
  )

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60] print:hidden">
      {rect ? (
        <>
          {/* Vier Flächen statt einer Maske — der Anker bleibt unverdeckt und,
              weil nichts Klicks annimmt, auch bedienbar. */}
          <div className="fixed inset-x-0 top-0 bg-slate-900/40" style={{ height: Math.max(0, rect.top - RAND) }} />
          <div className="fixed inset-x-0 bottom-0 bg-slate-900/40" style={{ top: rect.bottom + RAND }} />
          <div
            className="fixed left-0 bg-slate-900/40"
            style={{ top: rect.top - RAND, height: rect.height + 2 * RAND, width: Math.max(0, rect.left - RAND) }}
          />
          <div
            className="fixed right-0 bg-slate-900/40"
            style={{ top: rect.top - RAND, height: rect.height + 2 * RAND, left: rect.right + RAND }}
          />
          <div
            className="fixed rounded-lg border-2 border-action"
            style={{
              left: rect.left - RAND, top: rect.top - RAND,
              width: rect.width + 2 * RAND, height: rect.height + 2 * RAND,
            }}
          />
          {karte}
        </>
      ) : (
        // Ohne Anker gibt es nichts hervorzuheben — also auch nichts
        // abzudunkeln. Die Karte sitzt unten wie eine Bildunterschrift und
        // verdeckt insbesondere keinen geöffneten Dialog: Genau dazu laden
        // diese Schritte ja ein („Klicken Sie ruhig ein Zimmer an").
        <div className="fixed inset-x-0 bottom-0 flex justify-end p-4">{karte}</div>
      )}
    </div>,
    document.body,
  )
}
