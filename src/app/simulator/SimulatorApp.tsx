'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronRight, Dices, Leaf, Loader2, Play, Printer, RotateCcw, Square, X } from 'lucide-react'
import CleaningSimulation from '@/components/landing/CleaningSimulation'
import DistributionChart from '@/components/simulator/DistributionChart'
import type { ScenarioItem } from '@/utils/sim-scenarios'
import ScenarioPanel from './ScenarioPanel'
import ConvertCard from './ConvertCard'
import { LIMITS, buildScenario, clockLabel, paramsFor, type MixKey, type Policy, type ScenarioConfig, type SimDurations, type SimTimes } from '@/lib/cleaning-sim'
import { ROI_DEFAULTS, DAYS_PER_MONTH } from '@/lib/roi'
import { validateRun, workload, type DayRun, type Dist, type SideSummary, type SimMessage, type SimRequest, type Summary } from '@/lib/sim-batch'
import {
  DEFAULT_FORM, DETAIL_DURATIONS, ESSENTIAL_DURATIONS, RADIO_DURATIONS, ESSENTIAL_TIMES, changedDetails, configFromForm,
  dayRangeLabel, occupancyOf, randomFirstDay, sharesTotal, withOccupancy, type GuestKey, type SimForm,
} from '@/lib/sim-form'
import type { LandingMessages, SimulatorMessages } from '@/lib/i18n'
import { format, plural } from '@/lib/i18n/format'

/**
 * Simulator (Phase 1, 26.09.2026, Bauplan Sessions/Simulator-Plan-2026-09-26.md):
 * das eigene Haus einstellen, über viele Tage rechnen, den mittleren Tag
 * ansehen. Gerechnet wird im Web Worker (`sim.worker.ts` → `runBatch`), die
 * Seite zeichnet nur.
 *
 * Aufbau (Rückmeldung des Users, 26.09.2026): Einstellungen → der mittlere
 * Tag als Bild → Kennzahlen. Überall zuerst das Wesentliche, Details
 * eingeklappt — die vielen Angaben erschlugen einen. Am eingeklappten Kopf
 * steht, wie viele Annahmen von der Vorgabe abweichen, damit keine
 * Verstellung unbemerkt bleibt.
 */

type M = SimulatorMessages['app']
type TimeKey = keyof SimTimes
/** Beschriftung und Hinweis je Eingabe — Schlüssel wie im Formular, Texte aus `form` der Sprachdatei. */
type LabelHint = { label: string; hint: string }
const guestLabel = (m: M, k: GuestKey): LabelHint => m.form.guest[k]
const timeLabel = (m: M, k: TimeKey): LabelHint => m.form.times[k]
const durationLabel = (m: M, k: keyof SimDurations): LabelHint => m.form.durations[k]
const mixLabel = (m: M, k: MixKey): string => m.form.mix[k]
/** Abgebrochener Lauf — kein Fehler für die Oberfläche. */
const ABORTED = 'aborted'

const GROUP_TIMES: TimeKey[] = ['shiftEnd', 'stayRoutineFrom', 'dndGiveUp', 'complaintAt']
const GUEST_TIMES: TimeKey[] = ['departFrom', 'leaveFrom', 'leaveUntil']
const STAY_MIX: MixKey[] = ['declines', 'outWants', 'outNoRequest']

const field = 'w-full rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-ink tabular-nums outline-none focus:border-active'

type Running = { done: number; total: number; label?: string }
type Result = { summary: Summary; runs: DayRun[]; config: ScenarioConfig; days: number; firstDay: number }
type Compared = { name: string; summary: Summary; config: ScenarioConfig; days: number }

/** Zahlen, Prozent, Stunden und Euro in der Sprache der Seite. */
function formatters(intlLocale: string, m: M) {
  const num = new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1 })
  return {
    num,
    euro: new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
    percent: (v: number) => format(m.results.percent, { count: num.format(v * 100) }),
    hours: (min: number) => format(m.results.hours, { count: num.format(min / 60) }),
  }
}
type Fmt = ReturnType<typeof formatters>

export default function SimulatorApp({ initialScenarios = [], convert, m, day, intlLocale }: {
  initialScenarios?: ScenarioItem[]
  /** Nur eigene Simulator-Konten: „Als Hotel bei RoSe starten“ (Phase 4); `open` = Registrierung freigeschaltet. */
  convert?: { open: boolean; m: SimulatorMessages['account']['convert'] }
  m: M
  /** Oberfläche des Tagesbilds (Legende, Spaltentitel) — `landing.day` der Sprachdatei. */
  day: LandingMessages['day']
  intlLocale: string
}) {
  const [form, setForm] = useState<SimForm>(DEFAULT_FORM)
  const [running, setRunning] = useState<Running | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [runErrors, setRunErrors] = useState<string[]>([])
  const [policy, setPolicy] = useState<Policy>('routine')
  const [scenarios, setScenarios] = useState<ScenarioItem[]>(initialScenarios)
  const [active, setActive] = useState<ScenarioItem | null>(null)
  const [compared, setCompared] = useState<Compared[] | null>(null)
  const worker = useRef<Worker | null>(null)
  const abort = useRef<(() => void) | null>(null)
  const nextId = useRef(1)

  const fmt = useMemo(() => formatters(intlLocale, m), [intlLocale, m])
  const { config, errors: formErrors } = useMemo(() => configFromForm(form, m.validation, intlLocale), [form, m, intlLocale])
  const errors = useMemo(() => [...formErrors, ...validateRun(config, form.days, m.validation)], [formErrors, config, form.days, m])
  const stale = result !== null && (JSON.stringify(result.config) !== JSON.stringify(config) || result.days !== form.days || result.firstDay !== form.firstDay)
  const dirty = active !== null && JSON.stringify(active.form) !== JSON.stringify(form)

  useEffect(() => () => worker.current?.terminate(), [])

  /**
   * Ein Lauf im Worker. Je Lauf ein frischer Worker; Abbrechen beendet ihn
   * (`terminate`) — ein synchron rechnender Worker nähme eine Nachricht erst
   * nach dem Lauf entgegen.
   */
  const runJob = (cfg: ScenarioConfig, days: number, firstDay: number, onProgress: (done: number, total: number) => void) =>
    new Promise<{ runs: DayRun[]; summary: Summary }>((resolve, reject) => {
      worker.current?.terminate()
      const id = nextId.current++
      const w = new Worker(new URL('../../components/simulator/sim.worker.ts', import.meta.url))
      worker.current = w
      abort.current = () => reject(new Error(ABORTED))
      w.onmessage = (e: MessageEvent<SimMessage>) => {
        const msg = e.data
        if (msg.id !== id) return
        if (msg.type === 'progress') onProgress(msg.done, msg.total)
        else if (msg.type === 'invalid') { w.terminate(); reject(new Error(msg.errors.join(' '))) }
        else { w.terminate(); resolve({ runs: msg.runs, summary: msg.summary }) }
      }
      w.onerror = () => { w.terminate(); reject(new Error(m.run.workerFailed)) }
      const req: SimRequest = { type: 'run', id, config: cfg, days, firstSeed: firstDay, texts: m.validation }
      w.postMessage(req)
    })

  const stop = () => {
    worker.current?.terminate()
    worker.current = null
    abort.current?.()
    abort.current = null
    setRunning(null)
  }

  const fail = (err: unknown) => {
    if (err instanceof Error && err.message !== ABORTED) setRunErrors([err.message])
  }

  const run = (firstDay = form.firstDay) => {
    if (errors.length > 0) return
    const snapshot = { config, days: form.days, firstDay }
    setRunErrors([])
    setRunning({ done: 0, total: form.days })
    runJob(config, form.days, firstDay, (done, total) => setRunning({ done, total }))
      .then(r => setResult({ ...r, ...snapshot }))
      .catch(fail)
      .finally(() => setRunning(null))
  }

  /** Zwei bis drei gespeicherte Szenarien nacheinander rechnen und nebeneinanderstellen. */
  const compare = async (items: ScenarioItem[]) => {
    setRunErrors([])
    setCompared(null)
    const out: Compared[] = []
    try {
      for (const [i, item] of items.entries()) {
        const { config: cfg, errors: errs } = configFromForm(item.form, m.validation, intlLocale)
        const bad = [...errs, ...validateRun(cfg, item.form.days, m.validation)]
        if (bad.length > 0) throw new Error(format(m.run.scenarioErrors, { name: item.name, errors: bad.join(' ') }))
        const label = format(m.run.compareLabel, { index: i + 1, count: items.length, name: item.name })
        setRunning({ done: 0, total: item.form.days, label })
        const r = await runJob(cfg, item.form.days, item.form.firstDay, (done, total) => setRunning({ done, total, label }))
        out.push({ name: item.name, summary: r.summary, config: cfg, days: item.form.days })
      }
      setCompared(out)
    } catch (err) {
      fail(err)
    } finally {
      setRunning(null)
    }
  }

  const load = (item: ScenarioItem | null) => {
    setActive(item)
    if (item) setForm(item.form)
  }

  const set = (patch: Partial<SimForm>) => setForm(f => ({ ...f, ...patch }))
  // Rechnerisch zu wenig Zeit? Nur prüfen, wenn die Eingaben gültig sind.
  const overload = errors.length > 0 ? [] : (['routine', 'onDemand'] as const).flatMap(p => {
    const w = workload(config, p)
    return w.needMinutes > w.haveMinutes ? [{ p, ...w }] : []
  })
  const rooms = form.floors * form.roomsPerFloor
  const detailChanges = changedDetails(form)

  return (
    <div className="flex flex-col gap-8">
      <ScenarioPanel items={scenarios} setItems={setScenarios} form={form} activeId={active?.id ?? null} dirty={dirty}
        onLoad={load} onCompare={items => { void compare(items) }} busy={running !== null} m={m.scenarios} intlLocale={intlLocale} />

      <section className="rounded-2xl border border-edge bg-surface-elevated p-4 sm:p-5 print:border-0 print:p-0" aria-labelledby="ihr-haus">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="ihr-haus" className="text-lg font-bold text-ink">{m.form.heading}</h2>
          <button type="button" onClick={() => setForm(DEFAULT_FORM)} className="flex items-center gap-1 text-xs font-semibold text-action-strong hover:underline">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {m.form.resetAll}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <NumberField label={m.form.floors} value={form.floors} onChange={v => set({ floors: v })} />
          <NumberField label={m.form.roomsPerFloor} value={form.roomsPerFloor} onChange={v => set({ roomsPerFloor: v })} />
          <NumberField label={m.form.maids} value={form.maids} onChange={v => set({ maids: v })} />
          <NumberField label={m.form.occupied} unit={m.form.unitPercent} value={occupancyOf(form)}
            onChange={v => setForm(f => withOccupancy(f, v, f.shares.departure))} />
          <NumberField label={m.form.departures} unit={m.form.unitPercentRooms} value={form.shares.departure}
            onChange={v => setForm(f => withOccupancy(f, occupancyOf(f), v))} />
          {ESSENTIAL_TIMES.map(k => (
            <TimeField key={k} label={timeLabel(m, k).label} value={form.times[k]} onChange={v => set({ times: { ...form.times, [k]: v } })} />
          ))}
          {ESSENTIAL_DURATIONS.map(k => (
            <NumberField key={k} label={durationLabel(m, k).label} unit={m.form.unitMinutes} value={form.duration[k]}
              onChange={v => set({ duration: { ...form.duration, [k]: v } })} />
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          {format(m.form.houseSummary, {
            rooms: Number.isFinite(rooms) ? rooms : '–',
            departures: config.mix.departure,
            stays: config.mix.declines + config.mix.outWants + config.mix.outNoRequest,
          })}
        </p>

        <details className="group mt-4 rounded-xl border border-edge bg-surface">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-90" aria-hidden />
            {m.form.details}
            <span className="text-sm font-normal text-ink-muted">{m.form.detailsHint}</span>
            {detailChanges > 0 && (
              <span className="ml-auto rounded-full bg-caution-tint px-2 py-0.5 text-xs font-bold text-caution-deepest">
                {format(m.form.detailsChanged, { count: detailChanges })}
              </span>
            )}
          </summary>
          <div className="grid gap-4 border-t border-edge p-4 lg:grid-cols-2">
            <Group title={m.form.stays.heading} resetLabel={m.form.resetGroup} onReset={() => setForm(f => withOccupancy({ ...f, shares: { ...f.shares, ...pick(DEFAULT_FORM.shares, STAY_MIX) } }, occupancyOf(f), f.shares.departure))}>
              <p className="mb-2 text-xs text-ink-muted">{m.form.stays.intro}</p>
              <div className="flex flex-col gap-2">
                {STAY_MIX.map(k => (
                  <label key={k} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-ink">{mixLabel(m, k)}</span>
                    <span className="w-12 text-right text-xs tabular-nums text-ink-muted">{Number.isInteger(rooms) && rooms > 0 ? format(m.form.stays.rooms, { count: config.mix[k] }) : ''}</span>
                    <PercentInput value={form.shares[k]} onChange={v => set({ shares: { ...form.shares, [k]: v } })}
                      aria={format(m.form.percentLabel, { label: mixLabel(m, k) })} unit={m.form.unitPercent} />
                  </label>
                ))}
              </div>
              <p className={`mt-2 text-xs ${Math.abs(sharesTotal(form) - 100) > 0.05 ? 'font-semibold text-critical-strong' : 'text-ink-muted'}`}>
                {format(m.form.stays.total, { total: fmt.num.format(sharesTotal(form)) })}
              </p>
            </Group>

            <Group title={m.form.guestHeading} resetLabel={m.form.resetGroup} onReset={() => set({ guest: DEFAULT_FORM.guest, times: { ...form.times, ...pick(DEFAULT_FORM.times, GUEST_TIMES) } })}>
              <div className="grid grid-cols-3 gap-3">
                {GUEST_TIMES.map(k => (
                  <TimeField key={k} label={timeLabel(m, k).label} hint={timeLabel(m, k).hint} value={form.times[k]}
                    onChange={v => set({ times: { ...form.times, [k]: v } })} />
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {(Object.keys(m.form.guest) as GuestKey[]).map(k => (
                  <label key={k} className="flex items-start gap-3">
                    <span className="flex-1">
                      <span className="block text-sm text-ink">{guestLabel(m, k).label}</span>
                      <span className="block text-xs text-ink-muted">{guestLabel(m, k).hint}</span>
                    </span>
                    <PercentInput value={form.guest[k]} onChange={v => set({ guest: { ...form.guest, [k]: v } })}
                      aria={format(m.form.percentLabel, { label: guestLabel(m, k).label })} unit={m.form.unitPercent} />
                  </label>
                ))}
              </div>
            </Group>

            <Group title={m.form.baselineHeading} resetLabel={m.form.resetGroup} onReset={() => set({ baseline: DEFAULT_FORM.baseline, duration: { ...form.duration, ...pick(DEFAULT_FORM.duration, [...RADIO_DURATIONS]) } })}>
              <p className="mb-3 text-xs text-ink-muted">
                {m.form.baselineIntro}
              </p>
              <div className="flex flex-col gap-3">
                <Choice label={m.form.baselineDepartures} value={form.baseline.departures}
                  options={[['radio', m.form.baselineDeparturesRadio], ['list', m.form.baselineDeparturesList]]}
                  onChange={v => set({ baseline: { departures: v, floors: v === 'list' ? 'fixed' : form.baseline.floors } })} />
                <Choice label={m.form.baselineFloors} value={form.baseline.floors}
                  options={[['fixed', m.form.baselineFloorsFixed], ['free', m.form.baselineFloorsFree]]}
                  disabled={form.baseline.departures === 'list' ? ['free'] : []}
                  onChange={v => set({ baseline: { ...form.baseline, floors: v } })} />
                {form.baseline.departures === 'list' && (
                  <p className="text-xs text-ink-muted">
                    {m.form.baselineNoRadio}
                  </p>
                )}
              </div>
              {form.baseline.departures === 'radio' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {RADIO_DURATIONS.filter(k => k !== 'radioAnnounce' || form.baseline.floors === 'free').map(k => (
                    <NumberField key={k} label={durationLabel(m, k).label} hint={durationLabel(m, k).hint} unit={m.form.unitMinutes} value={form.duration[k]}
                      onChange={v => set({ duration: { ...form.duration, [k]: v } })} />
                  ))}
                </div>
              )}
            </Group>

            <Group title={m.form.timesHeading} resetLabel={m.form.resetGroup} onReset={() => set({ times: { ...form.times, ...pick(DEFAULT_FORM.times, GROUP_TIMES) } })}>
              <div className="grid grid-cols-2 gap-3">
                {GROUP_TIMES.map(k => (
                  <TimeField key={k} label={timeLabel(m, k).label} hint={timeLabel(m, k).hint} value={form.times[k]}
                    onChange={v => set({ times: { ...form.times, [k]: v } })} />
                ))}
              </div>
            </Group>

            <Group title={m.form.waysHeading} resetLabel={m.form.resetGroup} onReset={() => set({ duration: { ...form.duration, ...pick(DEFAULT_FORM.duration, [...DETAIL_DURATIONS]) }, days: DEFAULT_FORM.days })}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DETAIL_DURATIONS.map(k => (
                  <NumberField key={k} label={durationLabel(m, k).label} hint={durationLabel(m, k).hint} unit={m.form.unitMinutes} value={form.duration[k]}
                    onChange={v => set({ duration: { ...form.duration, [k]: v } })} />
                ))}
              </div>
              <div className="mt-4 max-w-48">
                <NumberField label={m.form.days} hint={format(m.form.daysHint, { max: LIMITS.days })} value={form.days} onChange={v => set({ days: v })} />
              </div>
            </Group>
          </div>
        </details>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-elevated p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {running ? (
            <button type="button" onClick={stop}
              className="flex items-center gap-1.5 rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink hover:bg-surface-sunken">
              <Square className="h-4 w-4" aria-hidden /> {m.run.cancel}
            </button>
          ) : (
            <>
              {/* Dieselben Tage mit denselben Einstellungen ergäben dasselbe — dann gibt es nichts zu rechnen. */}
              <button type="button" onClick={() => run()} disabled={errors.length > 0 || (result !== null && !stale)}
                title={result !== null && !stale ? m.run.upToDate : undefined}
                className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50">
                <Play className="h-4 w-4" aria-hidden /> {m.run.run}
              </button>
              <button type="button" disabled={errors.length > 0}
                onClick={() => { const f = randomFirstDay(); set({ firstDay: f }); run(f) }}
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-sunken disabled:opacity-50">
                <Dices className="h-4 w-4" aria-hidden /> {m.run.reroll}
              </button>
              <span className="text-sm text-ink-muted">
                {dayRangeLabel(form.firstDay, form.days, m.run.dayRange, intlLocale)}
                {form.firstDay !== 1 && <>{' · '}
                  <button type="button" onClick={() => set({ firstDay: 1 })} className="font-semibold text-action-strong hover:underline">{m.run.backToDayOne}</button>
                </>}
              </span>
            </>
          )}
          {running && (
            <div className="flex min-w-48 flex-1 items-center gap-3" role="status">
              <Loader2 className="h-4 w-4 animate-spin text-ink-muted" aria-hidden />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full bg-action" style={{ width: `${(running.done / running.total) * 100}%` }} />
              </div>
              <span className="text-sm tabular-nums text-ink-soft">{running.label
                ? format(m.run.progressLabeled, { label: running.label, done: running.done, total: running.total })
                : format(m.run.progress, { done: running.done, total: running.total })}</span>
            </div>
          )}
          {!running && stale && <span className="text-sm font-semibold text-caution-strong">{m.run.stale}</span>}
        </div>
        {overload.length > 0 && (
          <p className="flex items-start gap-1.5 text-sm text-caution-strong">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {format(overload.length === 1 ? m.run.overload[overload[0].p] : m.run.overload.both, {
                need: fmt.hours(overload[0].needMinutes),
                have: fmt.hours(overload[0].haveMinutes),
              })}
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

      {compared && <Comparison items={compared} policy={policy} onPolicy={setPolicy} onClose={() => setCompared(null)} m={m} fmt={fmt} />}
      {result && <Results result={result} policy={policy} onPolicy={setPolicy} m={m} day={day} fmt={fmt} intlLocale={intlLocale} />}
      {convert && <ConvertCard form={form} policy={policy} signupOpen={convert.open} m={convert.m} intlLocale={intlLocale} />}
    </div>
  )
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>
}

function Group({ title, resetLabel, onReset, children }: { title: string; resetLabel: string; onReset: () => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface-elevated p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <button type="button" onClick={onReset} className="text-xs font-semibold text-action-strong hover:underline">
          {resetLabel}
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

function Choice<T extends string>({ label, value, options, onChange, disabled = [] }: {
  label: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
  disabled?: T[]
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink-soft">{label}</legend>
      <div className="mt-1 flex flex-col gap-1">
        {options.map(([v, text]) => (
          <label key={v} className={`flex items-center gap-2 text-sm ${disabled.includes(v) ? 'text-ink-muted' : 'text-ink'}`}>
            <input type="radio" checked={value === v} disabled={disabled.includes(v)} onChange={() => onChange(v)}
              className="h-4 w-4 accent-[var(--color-action)]" />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function TimeField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <input type="time" step={300} className={field} value={value} onChange={e => onChange(e.target.value)} />
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

function PercentInput({ value, onChange, aria, unit }: { value: number; onChange: (v: number) => void; aria: string; unit: string }) {
  return (
    <span className="flex w-24 shrink-0 items-center gap-1">
      <input type="number" inputMode="decimal" step={0.1} min={0} max={100} aria-label={aria} className={field}
        value={Number.isFinite(value) ? value : ''} onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
      <span className="text-sm text-ink-muted">{unit}</span>
    </span>
  )
}

// ── Ergebnis ──────────────────────────────────────────────────────────────

function Results({ result, policy, onPolicy, m, day, fmt, intlLocale }: {
  result: Result
  policy: Policy
  onPolicy: (p: Policy) => void
  m: M
  day: LandingMessages['day']
  fmt: Fmt
  intlLocale: string
}) {
  const { summary, config, days } = result
  const { num, euro, percent, hours } = fmt
  const r = m.results
  const P = paramsFor(config.times, config.duration)
  const s = summary[policy]
  const clock = (min: number) => (min >= P.horizon ? r.notDone : clockLabel(Math.round(min), P.shiftStart))
  const typical = useMemo(() => buildScenario(summary.typicalSeed, config), [summary.typicalSeed, config])
  const savedMonthly = (s.savedMinutes.median / 60) * (ROI_DEFAULTS.hourlyCostCents / 100) * DAYS_PER_MONTH
  const rooms = config.floors * config.roomsPerFloor
  /** Ohne und mit RoSe an jedem Tag verpasst — dann sagt der Vorsprung in Minuten nichts. */
  const neverDone = s.paper.missedCheckin === 1 && s.rose.missedCheckin === 1
  const times = (v: number) => format(r.times, { count: v })

  const rows: { label: string; hint?: string; value: (x: SideSummary) => ReactNode }[] = [
    { ...r.rows.departuresReady, value: x => <DistCell d={x.departuresReady} fmt={clock} /> },
    { label: format(r.rows.missedCheckin.label, { time: clockLabel(P.checkinAt, P.shiftStart) }), hint: r.rows.missedCheckin.hint, value: x => percent(x.missedCheckin) },
    { ...r.rows.finished, value: x => <DistCell d={x.finishedAt} fmt={clock} /> },
    { ...r.rows.turnedAway, value: x => <DistCell d={x.turnedAway} fmt={times} /> },
    { ...r.rows.openAtCheckin, value: x => <DistCell d={x.departuresOpenAtCheckin} fmt={v => String(v)} /> },
    { label: format(r.rows.leftUndone.label, { time: clockLabel(P.horizon, P.shiftStart) }), hint: r.rows.leftUndone.hint, value: x => <DistCell d={x.leftUndone} fmt={v => String(v)} /> },
    { ...r.rows.walk, value: x => <DistCell d={x.walkMinutes} fmt={hours} /> },
    { ...r.rows.door, value: x => <DistCell d={x.doorMinutes} fmt={hours} /> },
    { ...r.rows.radio, value: x => <DistCell d={x.radioMinutes} fmt={hours} /> },
    { ...r.rows.radioMessages, value: x => <DistCell d={x.radioMessages} fmt={v => String(v)} /> },
    { ...r.rows.idle, value: x => <DistCell d={x.idleMinutes} fmt={hours} /> },
    { ...r.rows.cleaningShare, value: x => <DistCell d={x.cleaningShare} fmt={percent} /> },
    { ...r.rows.complaint, value: x => (x.complaintMinutes ? <DistCell d={x.complaintMinutes} fmt={v => format(r.minutes, { count: Math.round(v) })} /> : '–') },
  ]

  const [metric, setMetric] = useState<'departures' | 'finished'>('departures')
  const values = (c: 'paper' | 'rose') => result.runs.map(run =>
    metric === 'departures' ? run[policy][c].departuresReadyAt ?? P.horizon : run[policy][c].finishedAt)
  const coreRows = rows.slice(0, 4)
  const moreRows = rows.slice(4)
  const table = (list: typeof rows) => (
    <div className="overflow-x-auto rounded-2xl border border-edge">
      <table className="w-full min-w-[34rem] text-sm">
        <thead className="bg-surface-sunken text-left text-ink-soft">
          <tr>
            <th className="px-3 py-2 font-semibold">{r.tableHead}</th>
            <th className="px-3 py-2 font-semibold">{r.without}</th>
            <th className="px-3 py-2 font-semibold">{r.withRose}</th>
          </tr>
        </thead>
        <tbody>
          {list.map(row => (
            <tr key={row.label} className="border-t border-edge align-top">
              <th scope="row" className="px-3 py-2 text-left font-medium text-ink">
                {row.label}
                {row.hint && <span className="block text-xs font-normal text-ink-muted">{row.hint}</span>}
              </th>
              <td className="px-3 py-2 tabular-nums text-ink">{row.value(s.paper)}</td>
              <td className="px-3 py-2 tabular-nums text-ink">{row.value(s.rose)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const captionVars = {
    day: result.firstDay === 1 ? summary.typicalSeed : num.format(summary.typicalSeed),
    days,
    range: dayRangeLabel(result.firstDay, days, m.run.dayRange, intlLocale),
    rooms,
    floors: config.floors,
    maids: config.maids,
    start: clockLabel(0, P.shiftStart),
    checkout: clockLabel(P.checkoutAt, P.shiftStart),
    checkin: clockLabel(P.checkinAt, P.shiftStart),
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="ergebnis">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="ergebnis" className="text-2xl font-black text-ink">{plural(intlLocale, days, r.heading, { count: days })}</h2>
        <PolicySwitch policy={policy} onPolicy={onPolicy} m={r} />
        <span className="flex-1" />
        <button type="button" onClick={printPage}
          className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink hover:border-edge-strong print:hidden">
          <Printer className="h-4 w-4" aria-hidden /> {r.print}
        </button>
      </div>

      <div className="break-inside-avoid">
        <h3 className="text-lg font-bold text-ink">{r.typicalHeading}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {plural(intlLocale, days, r.typicalIntro, { count: days })}
        </p>
        <div className="mt-3">
          <CleaningSimulation scenario={typical} policy={policy} detailLog texts={m.day} m={day} intlLocale={intlLocale} caption={
            <p>{format(result.firstDay === 1 ? r.captionFirst : r.captionOther, captionVars)}</p>
          } />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-ink">{plural(intlLocale, days, r.kpiHeading, { count: days })}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {neverDone ? (
            <Kpi label={r.kpi.moreReady} value={`${s.departuresReadyMore.median > 0 ? '+' : ''}${s.departuresReadyMore.median}`}
              sub={format(r.kpi.moreReadySub, { time: clockLabel(P.checkinAt, P.shiftStart) })} />
          ) : (
            <Kpi label={r.kpi.earlier} value={format(r.kpi.earlierValue, { minutes: Math.round(s.departureLead.median) })}
              sub={format(r.kpi.earlierSub, { p10: Math.round(s.departureLead.p10), p90: Math.round(s.departureLead.p90) })} />
          )}
          <Kpi label={r.kpi.saved} value={format(r.kpi.savedValue, { hours: hours(s.savedMinutes.median) })}
            sub={format(r.kpi.savedSub, { month: euro.format(savedMonthly), rate: euro.format(ROI_DEFAULTS.hourlyCostCents / 100) })} />
          <Kpi label={r.kpi.finishesEarlier} value={percent(s.roseFinishesEarlier)} sub={r.kpi.finishesEarlierSub} />
        </div>
        <div className="break-inside-avoid rounded-2xl border border-edge bg-surface-elevated p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 print:hidden">
            <span className="text-sm font-semibold text-ink-soft">{r.distribution}</span>
            {([['departures', r.metricDepartures], ['finished', r.metricFinished]] as const).map(([k, label]) => (
              <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)}
                className={`rounded-md px-2.5 py-1 text-sm font-semibold ${metric === k ? 'bg-surface-sunken text-ink ring-1 ring-edge-strong' : 'text-ink-soft hover:bg-surface-sunken'}`}>
                {label}
              </button>
            ))}
          </div>
          <DistributionChart
            title={metric === 'departures' ? r.chartTitleDepartures : r.chartTitleFinished}
            rows={[
              { key: 'paper', label: r.without, values: values('paper'), color: 'var(--color-chart-context)' },
              { key: 'rose', label: r.withRose, values: values('rose'), color: 'var(--color-action)' },
            ]}
            horizon={P.horizon} shiftStart={P.shiftStart} checkinAt={metric === 'departures' ? P.checkinAt : undefined}
            m={m.chart} intlLocale={intlLocale} />
        </div>
        {table(coreRows)}
        <details className="group rounded-xl border border-edge">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-90" aria-hidden />
            {r.more}
            <span className="text-sm font-normal text-ink-muted">{r.moreHint}</span>
          </summary>
          <div className="flex flex-col gap-4 border-t border-edge p-4">
            {table(moreRows)}
            <p className="text-xs text-ink-muted">
              {format(r.assumptions, {
                rooms,
                floors: config.floors,
                maids: config.maids,
                days,
                departures: config.baseline.departures === 'radio' ? m.day.lead.departuresRadio : m.day.lead.departuresList,
                floorRule: config.baseline.floors === 'free' ? m.day.lead.floorsFree : m.day.lead.floorsFixed,
              })}
            </p>
          </div>
        </details>
        <p className="text-xs text-ink-muted">{r.disclaimer}</p>
      </div>
    </section>
  )
}

/**
 * Drucken ohne PDF-Bibliothek: vorher alle eingeklappten Teile öffnen (ein
 * geschlossenes <details> druckt nur seine Überschrift), danach zurück.
 */
function printPage() {
  const closed = [...document.querySelectorAll('details:not([open])')] as HTMLDetailsElement[]
  closed.forEach(d => { d.open = true })
  window.addEventListener('afterprint', () => closed.forEach(d => { d.open = false }), { once: true })
  window.print()
}

// ── Vergleich gespeicherter Szenarien ──────────────────────────────────────

function Comparison({ items, policy, onPolicy, onClose, m, fmt }: {
  items: Compared[]
  policy: Policy
  onPolicy: (p: Policy) => void
  onClose: () => void
  m: M
  fmt: Fmt
}) {
  const { percent, hours } = fmt
  const cm = m.comparison
  const times = (v: number) => format(m.results.times, { count: v })
  const rows: { label: string; value: (c: Compared) => ReactNode }[] = [
    { label: cm.house, value: c => format(cm.houseValue, { rooms: c.config.floors * c.config.roomsPerFloor, maids: c.config.maids, days: c.days }) },
    { label: cm.departuresReady, value: c => {
      const P = paramsFor(c.config.times, c.config.duration)
      const f = (min: number) => (min >= P.horizon ? m.results.notDone : clockLabel(Math.round(min), P.shiftStart))
      const s = c.summary[policy]
      return <>{f(s.paper.departuresReady.median)} → <span className="font-bold">{f(s.rose.departuresReady.median)}</span></>
    } },
    { label: cm.missedCheckin, value: c => {
      const s = c.summary[policy]
      return <>{percent(s.paper.missedCheckin)} → <span className="font-bold">{percent(s.rose.missedCheckin)}</span></>
    } },
    { label: cm.finished, value: c => {
      const P = paramsFor(c.config.times, c.config.duration)
      const f = (min: number) => (min >= P.horizon ? m.results.notDone : clockLabel(Math.round(min), P.shiftStart))
      const s = c.summary[policy]
      return <>{f(s.paper.finishedAt.median)} → <span className="font-bold">{f(s.rose.finishedAt.median)}</span></>
    } },
    { label: cm.saved, value: c => format(m.results.kpi.savedValue, { hours: hours(c.summary[policy].savedMinutes.median) }) },
    { label: cm.turnedAway, value: c => {
      const s = c.summary[policy]
      return <>{times(s.paper.turnedAway.median)} → <span className="font-bold">{times(s.rose.turnedAway.median)}</span></>
    } },
  ]
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-elevated p-4" aria-labelledby="vergleich-szenarien">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="vergleich-szenarien" className="text-xl font-black text-ink">{cm.heading}</h2>
        <PolicySwitch policy={policy} onPolicy={onPolicy} m={m.results} />
        <span className="flex-1" />
        <button type="button" onClick={onClose} aria-label={cm.close}
          className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink print:hidden"><X className="h-5 w-5" aria-hidden /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="text-left text-ink-soft">
            <tr>
              <th className="px-3 py-2 font-semibold">{cm.tableHead}</th>
              {items.map(c => <th key={c.name} className="px-3 py-2 font-bold text-ink">{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-t border-edge align-top">
                <th scope="row" className="px-3 py-2 text-left font-medium text-ink">{r.label}</th>
                {items.map(c => <td key={c.name} className="px-3 py-2 tabular-nums text-ink">{r.value(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-muted">{cm.footnote}</p>
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

function PolicySwitch({ policy, onPolicy, m }: { policy: Policy; onPolicy: (p: Policy) => void; m: M['results'] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-ink-soft">{m.policy}</span>
      <div role="group" aria-label={m.policyAria} className="inline-flex rounded-lg border border-edge bg-surface p-0.5">
        {([['routine', m.policyRoutine], ['onDemand', m.policyOnDemand]] as const).map(([p, label]) => (
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
