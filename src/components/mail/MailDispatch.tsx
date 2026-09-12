'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Clock, Loader2, MailCheck, MailX } from 'lucide-react'
import { getMailStatusAction } from '@/app/mail-actions'
import {
  isFinalMailStatus, isMailFailure, MAIL_COOLDOWN_SECONDS, MAIL_WATCH_SECONDS,
  mailStatusText, type MailStatus,
} from '@/lib/mail-status'

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
  startedAt: number
  cooldownSeconds: number
}

export type MailDispatch = {
  run: MailRun | null
  status: MailStatus | null
  detail: string | null
  /** Sekunden, bis der Knopf wieder frei ist. */
  remaining: number
  /** Nachfragefenster abgelaufen, ohne dass ein Endzustand kam. */
  timedOut: boolean
  begin: (r: {
    logId?: string
    recipient?: string
    error?: string
    /** Sekunden bis zum nächsten Versand — vom Server (Drossel) oder erzwungen (Passwort-Seite ohne logId). */
    wait?: number
  }) => void
  reset: () => void
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
      startedAt: t,
      // Countdown nur, wenn tatsächlich etwas unterwegs ist oder der Server
      // eine Wartezeit nennt — nach „ungültige Adresse" darf man sofort
      // korrigieren und erneut senden.
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

  return {
    run,
    status: view?.status ?? null,
    detail: view?.detail ?? null,
    remaining,
    timedOut,
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

/**
 * Die Statuszeile unter einem Sende-Knopf. Zeigt Empfänger, Stand und den
 * Countdown; verschwindet, solange nichts gesendet wurde.
 */
export function MailStatusLine({ mail, className = '' }: { mail: MailDispatch; className?: string }) {
  const { run, status, detail, remaining, timedOut } = mail
  if (!run) return null

  const countdown = remaining > 0
    ? <span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap text-xs font-normal opacity-80"><Clock className="h-3 w-3" /> erneut in {remaining} s</span>
    : null
  const an = run.recipient ? <span className="font-mono text-xs opacity-80"> an {run.recipient}</span> : null

  // Fehler der Action ohne Protokollzeile (z. B. Drossel, ungültige Adresse).
  if (run.error && !run.logId) {
    return (
      <p className={`${TONE.critical} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-4 w-4" /> {run.error}</span>{countdown}
      </p>
    )
  }

  if (status && isMailFailure(status)) {
    return (
      <p className={`${TONE.critical} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><MailX className="h-4 w-4" /> Nicht angekommen{an}</span>
        <span className="mt-1 block">{mailStatusText(status, detail)}</span>
        <span className="mt-1 block text-xs">Adresse prüfen und erneut senden — oder den Zugang auf anderem Weg übergeben.</span>{countdown}
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
        <span className="mt-1 block">{mailStatusText('delayed', null)}</span>{countdown}
      </p>
    )
  }

  if (timedOut) {
    return (
      <p className={`${TONE.attention} ${className}`}>
        <span className="inline-flex items-center gap-1.5 font-semibold"><Clock className="h-4 w-4" /> Übergeben, Zustellung noch unbestätigt{an}</span>
        <span className="mt-1 block text-xs">Manche Anbieter bestätigen erst nach Minuten. Bitte im Postfach nachsehen (auch Spam); bei Bedarf erneut senden.</span>
      </p>
    )
  }

  return (
    <p className={`${TONE.neutral} ${className}`}>
      <span className="inline-flex items-center gap-1.5 font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Übergeben{an}</span>
      <span className="mt-1 block text-xs">{mailStatusText(status ?? 'sent', null)}</span>{countdown}
    </p>
  )
}
