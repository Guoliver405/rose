'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Leaf, Loader2, Play, RotateCcw, Square } from 'lucide-react'
import CleaningSimulation from '@/components/landing/CleaningSimulation'
import { LIMITS, MIX_KEYS, buildScenario, clockLabel, paramsFor, type MixKey, type Policy, type ScenarioConfig, type SimDurations, type SimTimes } from '@/lib/cleaning-sim'
import { ROI_DEFAULTS, DAYS_PER_MONTH } from '@/lib/roi'
import { validateRun, workload, type Dist, type SideSummary, type SimMessage, type SimRequest, type Summary } from '@/lib/sim-batch'
import { DEFAULT_FORM, configFromForm, sharesTotal, type GuestKey, type SimForm } from '@/lib/sim-form'

/**
 * Simulator (Phase 1, 26.09.2026, Bauplan Sessions/Simulator-Plan-2026-09-26.md):
 * das eigene Haus einstellen, über viele Tage rechnen, den mittleren Tag
 * ansehen. Gerechnet wird im Web Worker (`sim.worker.ts` → `runBatch`), die
 * Seite zeichnet nur. Noch ohne Anmeldung und nur lokal erreichbar.
 */

const MIX_LABEL: Record<MixKey, string> = {
  departure: 'Abreisen',
  empty: 'Leer',
  declines: 'Bleibt im Zimmer, will keine Reinigung',
  outWants: 'Geht tagsüber, will Reinigung',
  outNoRequest: 'Geht tagsüber, braucht keine Reinigung',
}

const GUEST_LABEL: Record<GuestKey, [string, string]> = {
  dndMorning: ['Morgens „Nicht stören“', 'Anteil der Bleibegäste mit Schild am Morgen.'],
  dndAllDay: ['… davon den ganzen Tag', 'Der Rest nimmt das Schild beim Gehen ab.'],
  dndLiftSignals: ['Schild ab, Wunsch an', 'Wer das Schild abnimmt und Reinigung will, zeigt es dabei an.'],
  notBefore: ['„Frühestens ab“', 'Anteil der Gäste mit Wunsch, die in RoSe eine Uhrzeit nennen; ohne Software hängt bis dahin „Nicht stören“.'],
  signals: ['Wunsch beim Gehen angezeigt', 'Bei täglicher Reinigung: Anhänger bzw. Tipp. Auf Wunsch zeigt ihn jeder an.'],
}

type TimeKey = keyof SimTimes
const TIME_LABEL: Record<TimeKey, [string, string]> = {
  shiftStart: ['Schichtbeginn', 'Ab dann sind alle Kräfte im Haus.'],
  checkoutUntil: ['Check-out bis', 'Ohne Software sind Abreisen erst ab dieser Frist sicher frei.'],
  checkinFrom: ['Check-in ab', 'Bis dahin sollen alle Abreisezimmer fertig sein.'],
  stayRoutineFrom: ['Tägliche Reinigung ab', 'Für Bleibezimmer, in beiden Bildern gleich.'],
  dndGiveUp: ['„Nicht stören“ aufgeben ab', 'Danach schaut niemand mehr nach.'],
  complaintAt: ['Sonderfall gemeldet um', 'Ein Gast meldet ein Problem in einem schon gereinigten Zimmer.'],
  departFrom: ['Frühester Check-out', 'Check-outs bis zur Frist, gehäuft gegen Ende.'],
  leaveFrom: ['Gäste gehen ab', 'Bleibegäste verlassen das Zimmer gleichverteilt …'],
  leaveUntil: ['… bis', '… in diesem Fenster.'],
  shiftEnd: ['Spätestes Arbeitsende', 'Die Rechnung hört hier auf; was dann offen ist, bleibt liegen.'],
}

const DURATION_LABEL: Record<keyof SimDurations, [string, string]> = {
  departure: ['Reinigung Abreise', 'Eher knapp; gemessen wurden 35–43 min.'],
  stay: ['Reinigung Bleibe', 'Eher knapp; gemessen wurden 20–25 min.'],
  complaint: ['Sonderfall', 'Nacharbeit im Zimmer.'],
  knock: ['Klopfen', 'Klopfen, warten, kurzer Wortwechsel.'],
  skip: ['Schild sehen', 'Vor der Tür stehen, „Nicht stören“ sehen, notieren.'],
  retry: ['Wieder hin nach', 'Nach Klopfen oder Schild frühestens so viel später.'],
  walkRoom: ['Zum nächsten Zimmer', 'Auf derselben Etage.'],
  walkFloor: ['Etagenwechsel', 'Mit Wäschewagen und Aufzug.'],
  complaintReach: ['Rezeption erreicht Kraft', 'Ohne Software: anrufen, suchen.'],
}

const GROUP_TIMES: TimeKey[] = ['shiftStart', 'shiftEnd', 'checkoutUntil', 'checkinFrom', 'stayRoutineFrom', 'dndGiveUp', 'complaintAt']
const GUEST_TIMES: TimeKey[] = ['departFrom', 'leaveFrom', 'leaveUntil']

const field = 'w-full rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-ink tabular-nums outline-none focus:border-active'

type Running = { id: number; done: number; total: number }
type Result = { summary: Summary; config: ScenarioConfig; days: number }

export default function SimulatorApp() {
  const [form, setForm] = useState<SimForm>(DEFAULT_FORM)
  const [running, setRunning] = useState<Running | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [runErrors, setRunErrors] = useState<string[]>([])
  const [policy, setPolicy] = useState<Policy>('routine')
  const worker = useRef<Worker | null>(null)
  const nextId = useRef(1)

  const { config, errors: formErrors } = useMemo(() => configFromForm(form), [form])
  const errors = useMemo(() => [...formErrors, ...validateRun(config, form.days)], [formErrors, config, form.days])
  const stale = result !== null && (JSON.stringify(result.config) !== JSON.stringify(config) || result.days !== form.days)

  useEffect(() => () => worker.current?.terminate(), [])

  const stop = () => {
    worker.current?.terminate()
    worker.current = null
    setRunning(null)
  }

  const run = () => {
    if (errors.length > 0) return
    stop()
    const id = nextId.current++
    const w = new Worker(new URL('../../components/simulator/sim.worker.ts', import.meta.url))
    worker.current = w
    const snapshot = { config, days: form.days }
    setRunErrors([])
    setRunning({ id, done: 0, total: form.days })
    w.onmessage = (e: MessageEvent<SimMessage>) => {
      const msg = e.data
      if (msg.id !== id) return
      if (msg.type === 'progress') setRunning({ id, done: msg.done, total: msg.total })
      else if (msg.type === 'invalid') { setRunErrors(msg.errors); stop() }
      else { setResult({ summary: msg.summary, ...snapshot }); stop() }
    }
    w.onerror = () => { setRunErrors(['Die Rechnung ist abgebrochen. Bitte erneut versuchen.']); stop() }
    const req: SimRequest = { type: 'run', id, config, days: form.days }
    w.postMessage(req)
  }

  const set = (patch: Partial<SimForm>) => setForm(f => ({ ...f, ...patch }))
  // Rechnerisch zu wenig Zeit? Nur prüfen, wenn die Eingaben gültig sind.
  const overload = errors.length > 0 ? [] : (['routine', 'onDemand'] as const).flatMap(p => {
    const w = workload(config, p)
    return w.needMinutes > w.haveMinutes ? [{ p, ...w }] : []
  })
  const rooms = form.floors * form.roomsPerFloor

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <Group title="Haus" onReset={() => set({ floors: DEFAULT_FORM.floors, roomsPerFloor: DEFAULT_FORM.roomsPerFloor, shares: DEFAULT_FORM.shares })}>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Etagen" hint={`1 bis ${LIMITS.floors}`} value={form.floors} onChange={v => set({ floors: v })} />
            <NumberField label="Zimmer je Etage" hint={`1 bis ${LIMITS.roomsPerFloor}`} value={form.roomsPerFloor} onChange={v => set({ roomsPerFloor: v })} />
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-ink-soft">Belegung an einem gewöhnlichen Tag</legend>
            <div className="mt-2 flex flex-col gap-2">
              {MIX_KEYS.map(k => (
                <label key={k} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-ink">{MIX_LABEL[k]}</span>
                  <span className="w-12 text-right text-xs tabular-nums text-ink-muted">{Number.isInteger(rooms) && rooms > 0 ? `${config.mix[k]} Zi.` : ''}</span>
                  <PercentInput value={form.shares[k]} onChange={v => set({ shares: { ...form.shares, [k]: v } })} label={MIX_LABEL[k]} />
                </label>
              ))}
            </div>
            <p className={`mt-2 text-xs ${Math.abs(sharesTotal(form) - 100) > 0.05 ? 'font-semibold text-critical-strong' : 'text-ink-muted'}`}>
              Summe {String(sharesTotal(form)).replace('.', ',')} % von {Number.isFinite(rooms) ? rooms : '–'} Zimmern
            </p>
          </fieldset>
        </Group>

        <Group title="Personal und Zeiten" onReset={() => set({ maids: DEFAULT_FORM.maids, times: { ...form.times, ...pick(DEFAULT_FORM.times, GROUP_TIMES) } })}>
          <NumberField label="Reinigungskräfte" hint={`Ohne Software je Kraft feste Etagen (Rest reihum); 1 bis ${LIMITS.maids}`}
            value={form.maids} onChange={v => set({ maids: v })} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {GROUP_TIMES.map(k => (
              <TimeField key={k} label={TIME_LABEL[k][0]} hint={TIME_LABEL[k][1]} value={form.times[k]}
                onChange={v => set({ times: { ...form.times, [k]: v } })} />
            ))}
          </div>
        </Group>

        <Group title="Gäste" onReset={() => set({ guest: DEFAULT_FORM.guest, times: { ...form.times, ...pick(DEFAULT_FORM.times, GUEST_TIMES) } })}>
          <div className="grid grid-cols-3 gap-3">
            {GUEST_TIMES.map(k => (
              <TimeField key={k} label={TIME_LABEL[k][0]} hint={TIME_LABEL[k][1]} value={form.times[k]}
                onChange={v => set({ times: { ...form.times, [k]: v } })} />
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {(Object.keys(GUEST_LABEL) as GuestKey[]).map(k => (
              <label key={k} className="flex items-start gap-3">
                <span className="flex-1">
                  <span className="block text-sm text-ink">{GUEST_LABEL[k][0]}</span>
                  <span className="block text-xs text-ink-muted">{GUEST_LABEL[k][1]}</span>
                </span>
                <PercentInput value={form.guest[k]} onChange={v => set({ guest: { ...form.guest, [k]: v } })} label={GUEST_LABEL[k][0]} />
              </label>
            ))}
          </div>
        </Group>

        <Group title="Betrieb" onReset={() => set({ duration: DEFAULT_FORM.duration, days: DEFAULT_FORM.days })}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(Object.keys(DURATION_LABEL) as (keyof SimDurations)[]).map(k => (
              <NumberField key={k} label={DURATION_LABEL[k][0]} hint={DURATION_LABEL[k][1]} unit="min" value={form.duration[k]}
                onChange={v => set({ duration: { ...form.duration, [k]: v } })} />
            ))}
          </div>
          <div className="mt-4 max-w-48">
            <NumberField label="Gerechnete Tage" hint={`Jeder Tag mit anderen Gästen; 1 bis ${LIMITS.days}`} value={form.days} onChange={v => set({ days: v })} />
          </div>
        </Group>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-elevated p-4">
        <div className="flex flex-wrap items-center gap-3">
          {running ? (
            <button type="button" onClick={stop}
              className="flex items-center gap-1.5 rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink hover:bg-surface-sunken">
              <Square className="h-4 w-4" aria-hidden /> Abbrechen
            </button>
          ) : (
            <button type="button" onClick={run} disabled={errors.length > 0}
              className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50">
              <Play className="h-4 w-4" aria-hidden /> {result ? 'Neu rechnen' : 'Rechnen'}
            </button>
          )}
          <button type="button" onClick={() => setForm(DEFAULT_FORM)}
            className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunken">
            <RotateCcw className="h-4 w-4" aria-hidden /> Alles auf Vorgabe
          </button>
          {running && (
            <div className="flex min-w-48 flex-1 items-center gap-3" role="status">
              <Loader2 className="h-4 w-4 animate-spin text-ink-muted" aria-hidden />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full bg-action" style={{ width: `${(running.done / running.total) * 100}%` }} />
              </div>
              <span className="text-sm tabular-nums text-ink-soft">Tag {running.done} von {running.total}</span>
            </div>
          )}
          {!running && stale && <span className="text-sm font-semibold text-caution-strong">Einstellungen geändert – das Ergebnis unten gilt noch für die alten.</span>}
        </div>
        {overload.length > 0 && (
          <p className="flex items-start gap-1.5 text-sm text-caution-strong">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Rechnerisch reicht die Zeit nicht{overload.length === 1 ? (overload[0].p === 'routine' ? ' bei täglicher Reinigung' : ' auf Wunsch') : ''}:
              rund {hours(overload[0].needMinutes)} Reinigung an einem gewöhnlichen Tag, aber nur {hours(overload[0].haveMinutes)} Dienstzeit
              aller Kräfte bis zum Arbeitsende. Das Ergebnis zeigt dann vor allem, was liegen bleibt.
            </span>
          </p>
        )}
        {[...errors, ...runErrors].length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-critical-strong">
            {[...errors, ...runErrors].map(e => (
              <li key={e} className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{e}</li>
            ))}
          </ul>
        )}
      </div>

      {result && <Results result={result} policy={policy} onPolicy={setPolicy} />}
    </div>
  )
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>
}

function Group({ title, onReset, children }: { title: string; onReset: () => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface-elevated p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-action-strong hover:underline">
          Vorgabe wiederherstellen
        </button>
      </div>
      {children}
    </section>
  )
}

function NumberField({ label, hint, unit, value, onChange }: { label: string; hint?: string; unit?: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-ink-soft">{label}{unit ? ` (${unit})` : ''}</span>
      <input type="number" inputMode="numeric" className={field} value={Number.isFinite(value) ? value : ''}
        onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

function TimeField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <input type="time" step={300} className={field} value={value} onChange={e => onChange(e.target.value)} />
      <span className="text-xs text-ink-muted">{hint}</span>
    </label>
  )
}

function PercentInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <span className="flex w-24 shrink-0 items-center gap-1">
      <input type="number" inputMode="decimal" step={0.1} min={0} max={100} aria-label={`${label} in Prozent`} className={field}
        value={Number.isFinite(value) ? value : ''} onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
      <span className="text-sm text-ink-muted">%</span>
    </span>
  )
}

// ── Ergebnis ──────────────────────────────────────────────────────────────

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
const percent = (v: number) => `${num.format(v * 100)} %`
const hours = (min: number) => `${num.format(min / 60)} h`

function Results({ result, policy, onPolicy }: { result: Result; policy: Policy; onPolicy: (p: Policy) => void }) {
  const { summary, config, days } = result
  const P = paramsFor(config.times, config.duration)
  const s = summary[policy]
  const clock = (m: number) => (m >= P.horizon ? 'nicht fertig' : clockLabel(Math.round(m), P.shiftStart))
  const typical = useMemo(() => buildScenario(summary.typicalSeed, config), [summary.typicalSeed, config])
  const savedMonthly = (s.savedMinutes.median / 60) * (ROI_DEFAULTS.hourlyCostCents / 100) * DAYS_PER_MONTH
  const rooms = config.floors * config.roomsPerFloor
  /** Ohne und mit RoSe an jedem Tag verpasst — dann sagt der Vorsprung in Minuten nichts. */
  const neverDone = s.paper.missedCheckin === 1 && s.rose.missedCheckin === 1

  const rows: { label: string; hint?: string; value: (x: SideSummary) => ReactNode }[] = [
    { label: 'Abreisen bezugsfertig', hint: 'letzte Abreise', value: x => <DistCell d={x.departuresReady} fmt={clock} /> },
    { label: `Check-in um ${clockLabel(P.checkinAt, P.shiftStart)} verpasst`, hint: 'Anteil der Tage', value: x => percent(x.missedCheckin) },
    { label: 'Abreisen zum Check-in noch offen', value: x => <DistCell d={x.departuresOpenAtCheckin} fmt={v => String(v)} /> },
    { label: 'Alles fertig', value: x => <DistCell d={x.finishedAt} fmt={clock} /> },
    { label: `Um ${clockLabel(P.horizon, P.shiftStart)} liegen geblieben`, hint: 'Zimmer, die frei gewesen wären', value: x => <DistCell d={x.leftUndone} fmt={v => String(v)} /> },
    { label: 'Vergeblich an der Tür', hint: 'Gast da, lehnt ab, Schild', value: x => <DistCell d={x.turnedAway} fmt={v => `${v}×`} /> },
    { label: 'Wege', hint: 'alle Kräfte, mit Etagen abgehen', value: x => <DistCell d={x.walkMinutes} fmt={hours} /> },
    { label: 'An der Tür ohne Reinigung', hint: 'alle Kräfte', value: x => <DistCell d={x.doorMinutes} fmt={hours} /> },
    { label: 'Warten ohne Arbeit', hint: 'alle Kräfte', value: x => <DistCell d={x.idleMinutes} fmt={hours} /> },
    { label: 'Anteil Reinigen', hint: 'an der Zeit bis Feierabend', value: x => <DistCell d={x.cleaningShare} fmt={percent} /> },
    { label: 'Sonderfall erledigt nach', value: x => (x.complaintMinutes ? <DistCell d={x.complaintMinutes} fmt={v => `${Math.round(v)} min`} /> : '–') },
  ]

  return (
    <section className="flex flex-col gap-6" aria-labelledby="ergebnis">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="ergebnis" className="text-2xl font-black text-ink">Ergebnis über {days} Tage</h2>
        <PolicySwitch policy={policy} onPolicy={onPolicy} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {neverDone ? (
          <Kpi label="Zum Check-in mehr Abreisen fertig" value={`${s.departuresReadyMore.median > 0 ? '+' : ''}${s.departuresReadyMore.median}`}
            sub={`im Median; das Team schafft an keinem Tag alle Abreisen bis ${clockLabel(P.checkinAt, P.shiftStart)}`} />
        ) : (
          <Kpi label="Abreisen früher fertig" value={`${Math.round(s.departureLead.median)} min`}
            sub={`im Median; an 8 von 10 Tagen zwischen ${Math.round(s.departureLead.p10)} und ${Math.round(s.departureLead.p90)} min`} />
        )}
        <Kpi label="Eingesparte Arbeitszeit" value={`${hours(s.savedMinutes.median)} je Tag`}
          sub={`Wege und vergebliche Gänge; ≈ ${euro.format(savedMonthly)} im Monat bei ${euro.format(ROI_DEFAULTS.hourlyCostCents / 100)} je Stunde`} />
        <Kpi label="Mit RoSe früher fertig" value={percent(s.roseFinishesEarlier)} sub="Anteil der Tage, an denen alles früher erledigt ist" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-edge">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="bg-surface-sunken text-left text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-semibold">Median, darunter 10.–90. Perzentil</th>
              <th className="px-3 py-2 font-semibold">Ohne Steuerung</th>
              <th className="px-3 py-2 font-semibold">Mit RoSe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-t border-edge align-top">
                <th scope="row" className="px-3 py-2 text-left font-medium text-ink">
                  {r.label}
                  {r.hint && <span className="block text-xs font-normal text-ink-muted">{r.hint}</span>}
                </th>
                <td className="px-3 py-2 tabular-nums text-ink">{r.value(s.paper)}</td>
                <td className="px-3 py-2 tabular-nums text-ink">{r.value(s.rose)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-muted">
        Modellrechnung, keine Zusicherung: {rooms} Zimmer auf {config.floors} Etagen, {config.maids} Reinigungskräfte, {days} Tage
        mit jeweils anderen Gästen. Beide Spalten rechnen dieselben Gäste und dieselbe Reinigungspolitik; verglichen wird nur die
        Koordination. Ohne Software arbeitet jede Kraft zuerst ihre festen Etagen ab und sieht Anhänger und Schilder erst auf der
        Etage; mit RoSe wählt sie wie das echte Board. Die Euro-Angabe rechnet die eingesparten Stunden mit den Vollkosten aus dem
        Nutzenrechner hoch – Geld wird daraus nur, wenn die Einsatzplanung angepasst wird.
      </p>

      <div>
        <h2 className="text-2xl font-black text-ink">Der mittlere Tag</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Aus den {days} gerechneten der Tag, der beim Vorsprung der Abreisen in beiden Stellungen der Mitte am nächsten liegt.
        </p>
        <div className="mt-4">
          <CleaningSimulation scenario={typical} caption={
            <p>
              Tag {summary.typicalSeed} von {days}. {rooms} Zimmer auf {config.floors} Etagen, {config.maids} Reinigungskräfte ab{' '}
              {clockLabel(0, P.shiftStart)}, Check-out bis {clockLabel(P.checkoutAt, P.shiftStart)}, Check-in ab{' '}
              {clockLabel(P.checkinAt, P.shiftStart)}. Reinigungsdauer Abreise {config.duration.departure} min, Bleibe{' '}
              {config.duration.stay} min, Etagenwechsel {config.duration.walkFloor} min. Modellrechnung.
            </p>
          } />
        </div>
      </div>
    </section>
  )
}

function DistCell({ d, fmt }: { d: Dist; fmt: (v: number) => string }) {
  return (
    <>
      <span className="font-semibold">{fmt(d.median)}</span>
      <span className="block text-xs text-ink-muted">{fmt(d.p10)} – {fmt(d.p90)}</span>
    </>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface-elevated p-4">
      <div className="text-sm font-semibold text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-xs text-ink-muted">{sub}</div>
    </div>
  )
}

function PolicySwitch({ policy, onPolicy }: { policy: Policy; onPolicy: (p: Policy) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-ink-soft">Bleibezimmer reinigen:</span>
      <div role="group" aria-label="Reinigung der Bleibezimmer" className="inline-flex rounded-lg border border-edge bg-surface p-0.5">
        {([['routine', 'täglich'], ['onDemand', 'nur auf Wunsch']] as const).map(([p, label]) => (
          <button key={p} type="button" aria-pressed={policy === p} onClick={() => onPolicy(p)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold ${
              policy === p ? 'bg-action text-action-foreground' : 'text-ink-soft hover:bg-surface-sunken'
            }`}>
            {p === 'onDemand' && <Leaf className="h-4 w-4" aria-hidden />}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
