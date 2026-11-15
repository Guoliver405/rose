/*
 * Partnerprogramm — Rechenlogik, ohne I/O (Bauplan
 * Sessions/Affiliate-Plan-2026-11-15.md). Läuft auch im Browser: der
 * Zufalls-Code entsteht deshalb in `ids.ts`, nicht hier.
 *
 * Grundlage der Provision ist die BEZAHLTE Rechnung, nicht die Zimmerzahl:
 * Mindestbetrag und Freimonat laufen damit von selbst richtig mit.
 * `summarize` rechnet die Anzeige im Partnerbereich und später die
 * Auszahlung — dieselbe Funktion, damit beides nie auseinanderläuft.
 */

/** Ohne die Variable gibt es weder Partnerbereich noch „Empfohlen von“. */
export const affiliateEnabled = () => process.env.AFFILIATE_ENABLED === '1'

/** Vorgabe: 20 % in Basispunkten. Je Partner in `affiliates.rate_bps` abweichend. */
export const DEFAULT_RATE_BPS = 2000

/**
 * Haltefrist in Tagen, einheitlich für alle Zahlungswege (Entscheidung vom
 * 15.11.2026): SEPA-Lastschriften lassen sich acht Wochen lang zurückgeben.
 */
export const HOLD_DAYS = 60

// ── Partner-Code ────────────────────────────────────────────────────────────

/** Ohne verwechselbare Zeichen: kein 0/O, kein 1/I/L. */
export const PARTNER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const PARTNER_CODE_LENGTH = 8

const CODE_RE = new RegExp(`^[${PARTNER_CODE_ALPHABET}]{${PARTNER_CODE_LENGTH}}$`)

/**
 * Bringt eine Eingabe in die gespeicherte Form: Großbuchstaben, ohne Leer-,
 * Trenn- und unsichtbare Zeichen — ein vom Flyer abgetippter oder aus einem
 * Chat kopierter Code trägt gern etwas mit, das niemand sieht.
 */
export function normalizePartnerCode(input: string | null | undefined): string {
  return (input ?? '').replace(/[\s​-‍⁠﻿\-_.]/g, '').toUpperCase()
}

/** Hat die (normalisierte) Eingabe die Form eines Partner-Codes? */
export function isPartnerCode(code: string): boolean {
  return CODE_RE.test(code)
}

/**
 * Hängt den Code an einen internen Link — so reist er von der Landing Page
 * bis zur Registrierung in der URL, ohne Cookie. Was kein Code sein kann,
 * wird nicht weitergetragen.
 */
export function withRef(href: string, ref: string | null | undefined): string {
  const code = normalizePartnerCode(ref)
  if (!isPartnerCode(code)) return href
  const [path, hash] = href.split('#')
  return `${path}${path.includes('?') ? '&' : '?'}ref=${code}${hash ? `#${hash}` : ''}`
}

/** Der Code aus `?ref=…` in gespeicherter Form, oder leer. */
export function refFromParam(value: string | string[] | undefined): string {
  const code = normalizePartnerCode(Array.isArray(value) ? value[0] : value)
  return isPartnerCode(code) ? code : ''
}

// ── Beträge ─────────────────────────────────────────────────────────────────

/** Provision auf einen bezahlten Nettobetrag, kaufmännisch gerundet. */
export function commissionCents(netCents: number, rateBps: number = DEFAULT_RATE_BPS): number {
  if (!Number.isFinite(netCents) || !Number.isFinite(rateBps) || netCents <= 0 || rateBps <= 0) return 0
  return Math.round((netCents * rateBps) / 10000)
}

/**
 * Rücknahme bei einer Erstattung oder Rückbuchung: der Anteil der Provision,
 * der dem erstatteten Anteil der Zahlung entspricht. Liefert einen positiven
 * Betrag (gebucht wird er negativ), nie mehr als die Provision selbst.
 */
export function reversalCents(commission: number, paidCents: number, refundedCents: number): number {
  if (commission <= 0 || paidCents <= 0 || !Number.isFinite(refundedCents) || refundedCents <= 0) return 0
  const anteil = Math.min(1, refundedCents / paidCents)
  return Math.min(commission, Math.round(commission * anteil))
}

/** Ende der Haltefrist für eine Zahlung. */
export function availableAt(paidAt: Date): Date {
  return new Date(paidAt.getTime() + HOLD_DAYS * 24 * 60 * 60 * 1000)
}

// ── Selbstwerbung ───────────────────────────────────────────────────────────

/**
 * Keine Provision auf das eigene Konto. Geprüft wird zweimal: bei der
 * Zuordnung (wer legt das Konto an?) und beim Buchen (wer gehört inzwischen
 * dazu?).
 */
export function isSelfReferral(input: {
  partnerUserId: string
  /** Wer das Konto anlegt — bei der Zuordnung. */
  actingUserId?: string | null
  /** Inhaber und Mitglieder des geworbenen Kontos — beim Buchen. */
  memberUserIds?: readonly string[]
}): boolean {
  if (input.actingUserId && input.actingUserId === input.partnerUserId) return true
  return (input.memberUserIds ?? []).includes(input.partnerUserId)
}

// ── Stand eines Partners ────────────────────────────────────────────────────

export type CommissionKind = 'commission' | 'reversal'

export type CommissionEntry = {
  kind: CommissionKind
  /** Spiegel-Zeile der Rechnung; verbindet Rücknahme und Provision. */
  invoiceId: string | null
  /** Leistungsmonat, `YYYY-MM-DD`. */
  periodStart: string
  /** Provision positiv, Rücknahme negativ. */
  amountCents: number
  /** Ende der Haltefrist (ISO), nur an Provisionen. */
  availableAt: string | null
}

export type CommissionMonth = {
  periodStart: string
  /** Provision des Monats nach Rücknahmen. */
  netCents: number
  /** Davon noch in der Haltefrist. */
  pendingCents: number
  /** Zurückgenommen (positiv). */
  reversedCents: number
}

export type CommissionSummary = {
  /** Noch in der Haltefrist. */
  pendingCents: number
  /** Haltefrist abgelaufen. Kann negativ werden, wenn eine Rücknahme eine bereits freie Provision trifft. */
  availableCents: number
  /** Summe aller Rücknahmen (positiv). */
  reversedCents: number
  /** Je Leistungsmonat, neuester zuerst. */
  months: CommissionMonth[]
}

/**
 * Stand aus den Buchungen. Eine Rücknahme teilt das Schicksal ihrer
 * Provision: Liegt diese noch in der Haltefrist, mindert die Rücknahme den
 * vorgemerkten Betrag, sonst den verfügbaren. Eine Rücknahme ohne Provision
 * (darf nicht vorkommen) zählt gegen den verfügbaren Betrag.
 */
export function summarize(entries: readonly CommissionEntry[], now: Date): CommissionSummary {
  const jetzt = now.getTime()

  // Je Rechnung: liegt ihre Provision noch in der Haltefrist?
  const haelt = new Map<string, boolean>()
  for (const e of entries) {
    if (e.kind !== 'commission' || !e.invoiceId) continue
    haelt.set(e.invoiceId, e.availableAt !== null && new Date(e.availableAt).getTime() > jetzt)
  }
  const istVorgemerkt = (e: CommissionEntry) =>
    e.kind === 'commission'
      ? e.availableAt !== null && new Date(e.availableAt).getTime() > jetzt
      : e.invoiceId !== null && haelt.get(e.invoiceId) === true

  let pendingCents = 0
  let availableCents = 0
  let reversedCents = 0
  const monate = new Map<string, CommissionMonth>()

  for (const e of entries) {
    const vorgemerkt = istVorgemerkt(e)
    if (vorgemerkt) pendingCents += e.amountCents
    else availableCents += e.amountCents
    if (e.kind === 'reversal') reversedCents -= e.amountCents

    const m = monate.get(e.periodStart)
      ?? { periodStart: e.periodStart, netCents: 0, pendingCents: 0, reversedCents: 0 }
    m.netCents += e.amountCents
    if (vorgemerkt) m.pendingCents += e.amountCents
    if (e.kind === 'reversal') m.reversedCents -= e.amountCents
    monate.set(e.periodStart, m)
  }

  return {
    pendingCents,
    availableCents,
    reversedCents,
    months: [...monate.values()].sort((a, b) => b.periodStart.localeCompare(a.periodStart)),
  }
}
