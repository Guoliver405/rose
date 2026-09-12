'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, Clock, Copy, Loader2, MailCheck, MailX, ShieldAlert } from 'lucide-react'
import { getMailStatusAction } from '@/app/mail-actions'
import {
  isFinalMailStatus, isMailFailure, MAIL_COOLDOWN_SECONDS, MAIL_WATCH_SECONDS,
  mailStatusText, type MailStatus,
} from '@/lib/mail-status'
import type { MailBlock, MailResult } from '@/utils/mail'

/**
 * Countdown und Zustellstatus nach dem Senden einer Mail — für **alle**
 * Sende-Knöpfe der Anwendung dieselbe Mechanik (12.09.2026).
 *
 * Zwei Dinge, die vorher fehlten: (1) Die Minuten-Sperre nach einem Versand
 * war unsichtbar — wer zweimal klickte, bekam einen Fehler, den er als
 * „ignoriert" las. Jetzt zählt der Knopf sichtbar herunter und blockt solange.
 * (2) Ob die Mail ankam, wusste niemand. Jetzt fragt der Hook den Stand aus
 * `mail_log` alle drei Sekunden nach, bis Resend „zugestellt" oder
 * „abgewiesen" gemeldet hat — oder das Fenster (90 s) um ist.
 *
 * **Sperrliste** (zweiter Schritt desselben Tages): Nach einem harten Bounce
 * liefert Resend an diese Adresse still nicht mehr aus. Der Server fragt das
 * vor jedem Versand ab und antwortet dann mit `blocked` statt mit einer
 * Zeile — die Statuszeile zeigt Grund und Datum, und der Aufrufer hängt die
 * Auswege als `children` darunter (freigeben und erneut senden, Link
 * anzeigen). Die Person am Bildschirm löst das selbst; kein Support-Fall.
 *
 * `begin()` wird nach der Server-Antwort aufgerufen: mit `logId` beginnt das
 * Nachfragen, mit `wait` (Drossel des Servers) nur der Countdown. Zustand
 * bleibt am Hook — je Sendestelle eine Instanz, damit das Formular
 * „Rezeption" nicht den Knopf „Erneut senden" in der Liste sperrt.
 */
export type MailRun = {
  logId: string | null
  recipient: string | null
  /** Fehler der Server-Action — steht statt des Status. */
  error: string | null
  /** Nicht gesendet: Adresse auf der Sperrliste. */
  blocked: MailBlock | null
  domainWarning: MailResult['domainWarning'] | null
  startedAt: number
  cooldownSeconds: number
}

export type MailBegin = {
  logId?: string
  recipient?: string
  error?: string
  /** Sekunden bis zum nächsten Versand — vom Server (Drossel) oder erzwungen (Passwort-Seite ohne logId). */
  wait?: number
  blocked?: MailBlock
  domainWarning?: MailResult['domainWarning']
}

export type MailDispatch = {
  run: MailRun | null
  status: MailStatus | null
  detail: string | null
  /** Sekunden, bis der Knopf wieder frei ist. */
  remaining: number
  /** Nachfragefenster abgelaufen, ohne dass ein Endzustand kam. */
  timedOut: boolean
  /** Die Mail ist nachweislich nicht angekommen oder wurde gar nicht gesendet — Zeit für einen Ausweg. */
  failed: boolean
  begin: (r: MailBegin) => void
  reset: () => void
}

/** Das Ergebnis einer Sende-Action in `begin()` übersetzen. */
export function beginFrom(res: MailResult, recipient?: string | null): MailBegin {
  return {
    logId: res.logId,
    recipient: recipient ?? undefined,
    error: res.error,
    wait: res.wait,
    blocked: res.blocked,
    domainWarning: res.domainWarning,
  }
}

export function useMailDispatch(): MailDispatch {
  const [run, setRun] = useState<MailRun | null>(null)
  const [view, setView] = useState<{ status: MailStatus; detail: string | null } | null>(null)
  const [now, setNow] = useState(0)

  const begin = useCallback<MailDispatch['begin']>(r => {
    const t = Date.now()
    setView(null)
    setNow(t)
    setRun({
      logId: r.logId ?? null,
      recipient: r.recipient ?? null,
      error: r.error ?? null,
      blocked: r.blocked ?? null,
      domainWarning: r.domainWarning ?? null,
      startedAt: t,
      // Countdown nur, wenn tatsächlich etwas unterwegs ist oder der Server
      // eine Wartezeit nennt — nach „ungültige Adresse" oder einer Sperre
      // darf man sofort handeln.
      cooldownSeconds: r.wait ?? (r.logId ? MAIL_COOLDOWN_SECONDS : 0),
    })
  }, [])

  const reset = useCallback(() => { setRun(null); setView(null) }, [])

  // Sekundentakt für den Countdown — nur solange einer läuft.
  useEffect(() => {
    if (!run) return
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [run])

  // Nachfragen, bis ein Endzustand da ist oder das Fenster um ist.
  const logId = run?.logId ?? null
  const startedAt = run?.startedAt ?? 0
  useEffect(() => {
    if (!logId) return
    let fertig = false
    const frage = async () => {
      const v = await getMailStatusAction(logId)
      if (fertig || !v) return
      setView(v)
      if (isFinalMailStatus(v.status)) { fertig = true; clearInterval(iv) }
    }
    const iv = setInterval(() => {
      if (Date.now() - startedAt > MAIL_WATCH_SECONDS * 1000) { fertig = true; clearInterval(iv); return }
      void frage()
    }, 3000)
    void frage()
    return () => { fertig = true; clearInterval(iv) }
  }, [logId, startedAt])

  const elapsed = run ? (now - run.startedAt) / 1000 : 0
  const remaining = run ? Math.max(0, Math.ceil(run.cooldownSeconds - elapsed)) : 0
  const timedOut = Boolean(run?.logId) && elapsed > MAIL_WATCH_SECONDS
    && (!view || !isFinalMailStatus(view.status))
  const failed = Boolean(run?.blocked) || Boolean(view && isMailFailure(view.status))

  return {
    run,
    status: view?.status ?? null,
    detail: view?.detail ?? null,
    remaining,
    timedOut,
    failed,
    begin,
    reset,
  }
}

/** Beschriftung eines Sende-Knopfs mit laufendem Countdown. */
export function sendLabel(base: string, mail: MailDispatch): string {
  return mail.remaining > 0 ? `${base} (${mail.remaining} s)` : base
}

const BOX = 'rounded-lg border px-3 py-2 text-sm'
const TONE = {
  neutral: `${BOX} border-edge bg-surface-muted text-ink-soft`,
  positive: `${BOX} border-positive-pill-edge bg-positive-tint text-positive-deep`,
  attention: `${BOX} border-attention-tint-edge bg-attention-tint text-attention-deepest`,
  critical: `${BOX} border-critical-tint-edge bg-critical-tint text-critical-strong`,
}

function datum(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
}

function originText(b: MailBlock): string {
  switch (b.origin) {
    case 'bounce': return 'Der Empfänger-Server hat eine frühere Mail an diese Adresse abgewiesen'
    case 'complaint': return 'Der Empfänger hat eine frühere Mail als Spam gemeldet'
    case 'manual': return 'Die Adresse wurde von Hand auf die Sperrliste gesetzt'
    default: return 'Eine frühere Mail an diese Adresse ist nicht angekommen'
  }
}

/**
 * Die Statuszeile unter einem Sende-Knopf. Zeigt Empfänger, Stand und den
 * Countdown; verschwindet, solange nichts gesendet wurde. `children` sind die
 * Auswege des Aufrufers und erscheinen nur, wenn etwas schiefgegangen ist.
 */
export function MailStatusLine({
  mail, className = '', children,
}: { mail: MailDispatch; className?: string; children?: ReactNode }) {
  const { run, status, detail, remaining, timedOut } = mail
  if (!run) return null

  const countdown = remaining > 0
    ? <span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap text-xs font-normal opacity-80"><Clock className="h-3 w-3" /> erneut in {remaining} s</span>
    : null
  const an = run.recipient ? <span className="font-mono text-xs opacity-80"> an {run.recipient}</span> : null
  const auswege = children ? <span className="mt-2 flex flex-wrap gap-2">{children}</span> : null

  // Gesperrt: gar nicht erst gesendet. Grund, Datum, Auswege.
  if (run.blocked) {
    const b = run.blocked
    return (
      <p className={`${TONE.critical} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><ShieldAlert className="h-4 w-4" /> Nicht gesendet — Adresse gesperrt{an}</span>
        <span className="mt-1 block">
          {originText(b)}{b.since ? ` (${datum(b.since)})` : ''}. Der Versanddienst liefert an diese Adresse nichts mehr aus, bis sie freigegeben wird.
        </span>
        {b.detail && <span className="mt-1 block text-xs">Grund damals: {b.detail}</span>}
        <span className="mt-1 block text-xs">
          {b.canRelease
            ? 'Stimmt die Adresse? Dann freigeben und erneut senden. Bounct sie wieder, steht der neue Grund hier.'
            : 'Die Freigabe ist derzeit nicht aus der Anwendung möglich — bitte die Adresse prüfen oder den Zugang auf anderem Weg übergeben.'}
        </span>
        {auswege}
      </p>
    )
  }

  // Fehler der Action ohne Protokollzeile (z. B. Drossel, ungültige Adresse).
  if (run.error && !run.logId) {
    return (
      <p className={`${TONE.critical} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-4 w-4" /> {run.error}</span>{countdown}
      </p>
    )
  }

  const providerHinweis = run.domainWarning ? (
    <span className="mt-2 block rounded border border-attention-tint-edge bg-attention-tint px-2 py-1 text-xs text-attention-deepest">
      Hinweis: Bei <span className="font-mono">{run.domainWarning.domain}</span> wurden zuletzt {run.domainWarning.bounced} verschiedene
      Adressen abgewiesen und keine zugestellt (seit {datum(run.domainWarning.since)}). Dieser Anbieter nimmt unsere Mails
      derzeit womöglich nicht an — falls nichts ankommt, den Zugang auf anderem Weg übergeben.
    </span>
  ) : null

  if (status && isMailFailure(status)) {
    return (
      <p className={`${TONE.critical} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><MailX className="h-4 w-4" /> Nicht angekommen{an}</span>
        <span className="mt-1 block">{mailStatusText(status, detail)}</span>
        <span className="mt-1 block text-xs">
          {status === 'suppressed'
            ? 'Stimmt die Adresse? Dann freigeben und erneut senden — sonst den Zugang auf anderem Weg übergeben.'
            : 'Adresse prüfen und erneut senden — oder den Zugang auf anderem Weg übergeben. Die Adresse steht jetzt auf der Sperrliste; ein erneuter Versand gibt sie vorher frei.'}
        </span>
        {providerHinweis}
        {auswege}{countdown}
      </p>
    )
  }

  if (status === 'delivered') {
    return (
      <p className={`${TONE.positive} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><MailCheck className="h-4 w-4" /> Zugestellt{an}</span>
        <span className="mt-1 block text-xs">Der Empfänger-Server hat die Mail angenommen. Landet sie nicht im Posteingang, lohnt ein Blick in den Spam-Ordner.</span>{countdown}
      </p>
    )
  }

  if (status === 'delayed') {
    return (
      <p className={`${TONE.attention} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><Clock className="h-4 w-4" /> Verzögert{an}</span>
        <span className="mt-1 block">{mailStatusText('delayed', null)}</span>{providerHinweis}{countdown}
      </p>
    )
  }

  if (timedOut) {
    return (
      <p className={`${TONE.attention} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><Clock className="h-4 w-4" /> Übergeben, Zustellung noch unbestätigt{an}</span>
        <span className="mt-1 block text-xs">Manche Anbieter bestätigen erst nach Minuten. Bitte im Postfach nachsehen (auch Spam); bei Bedarf erneut senden.</span>
        {providerHinweis}{auswege}
      </p>
    )
  }

  return (
    <p className={`${TONE.neutral} ${className}`}>
      <span className="inline-flex items-center gap-1.5 font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Übergeben{an}</span>
      <span className="mt-1 block text-xs">{mailStatusText(status ?? 'sent', null)}</span>{providerHinweis}{countdown}
    </p>
  )
}

/** Knopf-Stil für die Auswege in der Statuszeile. */
export const auswegButton = 'inline-flex items-center gap-1.5 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold hover:bg-surface disabled:opacity-50'

/**
 * Der Einladungslink zum Kopieren — der Ausweg, wenn keine Mail ankommt.
 * Wer den Link hat, kann das Passwort dieses Zugangs setzen; deshalb steht
 * das dabei, und der Link ist einmalig und begrenzt gültig.
 */
export function InviteLinkBox({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  async function kopieren() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* Zwischenablage nicht erlaubt — der Text bleibt markierbar */ }
  }
  return (
    <span className="mt-2 block rounded-lg border border-edge bg-surface p-3 text-ink">
      <span className="block text-xs font-semibold text-ink-soft">Einladungslink — per Messenger, SMS oder Zettel übergeben</span>
      <span className="mt-1 block break-all rounded bg-surface-muted px-2 py-1 font-mono text-xs select-all">{url}</span>
      <span className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={kopieren} className={`${auswegButton} text-ink`}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Kopiert' : 'Link kopieren'}
        </button>
        <button type="button" onClick={onClose} className="text-xs text-ink-muted hover:underline">Ausblenden</button>
      </span>
      <span className="mt-2 block text-xs text-ink-muted">
        Wer diesen Link öffnet, vergibt das Passwort für diesen Zugang. Er gilt einmal und nur begrenzte Zeit.
        Nutzt ihn jemand anderes zuerst, scheitert die eingeladene Person und meldet sich — dann einfach einen neuen erzeugen.
      </span>
    </span>
  )
}
