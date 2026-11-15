import { createAdminClient } from '@/utils/supabase/service'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import {
  affiliateEnabled, availableAt, commissionCents, isPartnerCode, isSelfReferral, normalizePartnerCode, reversalCents,
} from '@/lib/affiliate'
import { checkInviteCode, hotelSignupOpen, normalizeCode } from '@/utils/hotel-account'

/*
 * Partnerprogramm — Zugriffe auf die Datenbank (Bauplan
 * Sessions/Affiliate-Plan-2026-11-15.md). Die Rechnung steht in
 * `@/lib/affiliate`.
 *
 * Zuordnung ohne Cookie: Der Code reist in der URL bis ins Formular, hier
 * wird er aufgelöst. Geschrieben wird `accounts.referred_by` nur beim Anlegen
 * des Kontos (`createHotelAccount`).
 */

type Admin = ReturnType<typeof createAdminClient>

export type PartnerRef = { id: string; userId: string; approved: boolean }

/** Partner zu einem eingegebenen Code; `null`, wenn es ihn nicht gibt. */
export async function findPartnerByCode(admin: Admin, input: string): Promise<PartnerRef | null> {
  const code = normalizePartnerCode(input)
  if (!isPartnerCode(code)) return null
  const { data } = await admin.from('affiliates').select('id, user_id, approved_at').eq('code', code).maybeSingle()
  return data ? { id: data.id, userId: data.user_id, approved: data.approved_at !== null } : null
}

/** Code zu einem Partner — für das vorausgefüllte Feld bei der Umwandlung. */
export async function partnerCodeById(affiliateId: string | null | undefined): Promise<string> {
  if (!affiliateId) return ''
  const { data } = await createAdminClient().from('affiliates').select('code').eq('id', affiliateId).maybeSingle()
  return data?.code ?? ''
}

/** Code des Partners, über den dieses Simulator-Konto kam — oder leer. */
export async function referralCodeForSimUser(userId: string): Promise<string> {
  if (!affiliateEnabled()) return ''
  const { data } = await createAdminClient().from('sim_accounts').select('referred_by').eq('user_id', userId).maybeSingle()
  return partnerCodeById(data?.referred_by)
}

/**
 * Nur die Zuordnung, ohne Zugangsprüfung — für die Registrierung im
 * Simulator, die jedem offensteht. Ein unbekannter Code ist ein Fehler, damit
 * ein Tippfehler nicht still die Zuordnung kostet; leer ist erlaubt.
 */
export async function resolveReferral(partnerCode: string): Promise<{ affiliateId: string | null; error?: string }> {
  if (!affiliateEnabled() || !normalizePartnerCode(partnerCode)) return { affiliateId: null }
  const partner = await findPartnerByCode(createAdminClient(), partnerCode)
  if (!partner) return { affiliateId: null, error: getMessages(await getAdminLocale()).auth.errors.partnerCodeUnknown }
  return { affiliateId: partner.id }
}

/**
 * Darf dieses Hotelkonto angelegt werden, und wem wird es zugeordnet?
 *
 * Solange die Registrierung geschlossen ist, kommt herein, wer den
 * Einladungscode ODER den Code eines FREIGESCHALTETEN Partners mitbringt
 * (Entscheidung vom 15.11.2026). Der Code eines nicht freigeschalteten
 * Partners ordnet zu, öffnet aber nichts — sonst wäre jedes Simulator-Konto
 * ein Einladungscode für alle. Fehlt `SIGNUP_INVITE_CODE`, bleibt die
 * Registrierung für alle zu: ein vergessenes Env-Var darf das Tor nicht öffnen.
 *
 * `actingUserId` ist der Zugang, der das Konto anlegt, sofern es ihn schon
 * gibt (Umwandlung aus dem Simulator): Der eigene Code ordnet nicht zu.
 */
export async function checkSignupAccess(input: {
  inviteCode: string
  partnerCode: string
  actingUserId?: string | null
}): Promise<{ affiliateId: string | null; error?: string }> {
  if (!affiliateEnabled()) {
    const error = await checkInviteCode(input.inviteCode)
    return error ? { affiliateId: null, error } : { affiliateId: null }
  }
  const e = getMessages(await getAdminLocale()).auth.errors
  if (!hotelSignupOpen()) return { affiliateId: null, error: e.signupClosed }

  let partner: PartnerRef | null = null
  if (normalizePartnerCode(input.partnerCode)) {
    partner = await findPartnerByCode(createAdminClient(), input.partnerCode)
    if (!partner) return { affiliateId: null, error: e.partnerCodeUnknown }
  }

  if (!partner?.approved) {
    if (!normalizeCode(input.inviteCode)) {
      return { affiliateId: null, error: partner ? e.partnerCodeNotOpen : e.codeMissing }
    }
    const error = await checkInviteCode(input.inviteCode)
    if (error) return { affiliateId: null, error }
  }

  const self = partner !== null && isSelfReferral({ partnerUserId: partner.userId, actingUserId: input.actingUserId })
  return { affiliateId: partner && !self ? partner.id : null }
}

// ── Provisionsbuch ──────────────────────────────────────────────────────────

/**
 * Bucht die Provision für eine BEZAHLTE Rechnung — aufgerufen vom Stripe-
 * Webhook (`invoice.paid`), vom Abgleich offener Rechnungen und direkt nach
 * einem sofort gelungenen Einzug. Idempotent über `source`: der zweite Aufruf
 * für dieselbe Rechnung ist ein No-op.
 *
 * Gelesen wird der Partner von der RECHNUNG (`invoices.affiliate_id`), nicht
 * vom Konto: die Schlussrechnung wird bezahlt, wenn das Konto schon gelöscht
 * ist. Gibt es den Partner nicht mehr (Zugang gelöscht), verfällt die
 * Provision. Läuft unabhängig von `AFFILIATE_ENABLED` — der Schalter regelt
 * die Oberfläche; was zugeordnet ist, wird gebucht.
 */
export async function recordCommissionForInvoice(invoiceId: string): Promise<'recorded' | 'skipped'> {
  const admin = createAdminClient()
  const { data: inv } = await admin
    .from('invoices')
    .select('id, account_id, period_start, net_cents, status, paid_at, stripe_invoice_id, affiliate_id')
    .eq('id', invoiceId).maybeSingle()
  if (!inv || inv.status !== 'paid' || !inv.affiliate_id) return 'skipped'

  const { data: partner } = await admin
    .from('affiliates').select('id, user_id, rate_bps').eq('id', inv.affiliate_id).maybeSingle()
  if (!partner) return 'skipped'

  // Selbstwerbung: gehört der Partner inzwischen zum geworbenen Konto?
  if (isSelfReferral({ partnerUserId: partner.user_id, memberUserIds: await accountUserIds(admin, inv.account_id) })) {
    return 'skipped'
  }

  const amount = commissionCents(inv.net_cents as number, partner.rate_bps as number)
  if (amount <= 0) return 'skipped'

  const paidAt = inv.paid_at ? new Date(inv.paid_at as string) : new Date()
  const { error } = await admin.from('affiliate_commissions').insert({
    affiliate_id: partner.id,
    account_id: inv.account_id,
    invoice_id: inv.id,
    kind: 'commission',
    source: commissionSource(inv),
    period_start: inv.period_start,
    base_cents: inv.net_cents,
    rate_bps: partner.rate_bps,
    amount_cents: amount,
    available_at: availableAt(paidAt).toISOString(),
  })
  if (error) {
    if (error.code === '23505') return 'skipped'
    throw new Error(`affiliate_commissions: ${error.message}`)
  }
  return 'recorded'
}

const commissionSource = (inv: { id: string; stripe_invoice_id: string | null }) =>
  `${inv.stripe_invoice_id ?? inv.id}:paid`

/** Inhaber, Manager und Rezeption eines Kontos — leer, wenn es das Konto nicht mehr gibt. */
async function accountUserIds(admin: Admin, accountId: string): Promise<string[]> {
  const [{ data: owners }, { data: hotels }] = await Promise.all([
    admin.from('account_members').select('user_id').eq('account_id', accountId),
    admin.from('hotels').select('id').eq('account_id', accountId),
  ])
  const hotelIds = (hotels ?? []).map(h => h.id as string)
  const { data: members } = hotelIds.length
    ? await admin.from('hotel_members').select('user_id').in('hotel_id', hotelIds)
    : { data: [] }
  return [...(owners ?? []), ...(members ?? [])].map(r => r.user_id as string)
}

export type ReversalInput = {
  /** Stripe-ID der Rechnung, deren Zahlung zurückging. */
  stripeInvoiceId: string
  /** Gezahlter Betrag der Zahlung (brutto). */
  paidCents: number
} & (
  /** Erstattung: `refundedCents` ist der bisher INSGESAMT erstattete Betrag der Zahlung. */
  | { kind: 'refund'; chargeId: string; refundedCents: number }
  /** Rückbuchung: Geld abgezogen. */
  | { kind: 'dispute_withdrawn'; disputeId: string; disputedCents: number }
  /** Rückbuchung gewonnen: Geld wieder da. */
  | { kind: 'dispute_reinstated'; disputeId: string }
)

/**
 * Nimmt Provision zurück, wenn die Zahlung einer Rechnung (teilweise)
 * zurückgeht. Eine eigene, negative Buchung — anteilig zum zurückgegangenen
 * Betrag und nie mehr, als von der Provision dieser Rechnung noch steht.
 *
 * Erstattungen meldet Stripe mit dem bisher insgesamt erstatteten Betrag;
 * gebucht wird deshalb nur die Differenz zu dem, was für diese Zahlung schon
 * zurückgenommen ist. Der Schlüssel `source` macht jede Meldung idempotent.
 */
export async function recordReversal(input: ReversalInput): Promise<'recorded' | 'skipped'> {
  const admin = createAdminClient()
  const { data: inv } = await admin
    .from('invoices').select('id').eq('stripe_invoice_id', input.stripeInvoiceId).maybeSingle()
  if (!inv) return 'skipped'

  const { data: rows } = await admin
    .from('affiliate_commissions')
    .select('affiliate_id, account_id, kind, source, period_start, base_cents, rate_bps, amount_cents')
    .eq('invoice_id', inv.id)
  const commission = (rows ?? []).find(r => r.kind === 'commission')
  if (!commission) return 'skipped'
  const stand = (rows ?? []).reduce((s, r) => s + (r.amount_cents as number), 0)

  let source: string
  let amount: number
  if (input.kind === 'refund') {
    const prefix = `${input.chargeId}:refund:`
    const schon = -(rows ?? []).filter(r => (r.source as string).startsWith(prefix))
      .reduce((s, r) => s + (r.amount_cents as number), 0)
    const soll = reversalCents(commission.amount_cents as number, input.paidCents, input.refundedCents)
    source = `${prefix}${input.refundedCents}`
    amount = -Math.min(Math.max(0, soll - schon), Math.max(0, stand))
  } else if (input.kind === 'dispute_withdrawn') {
    source = `${input.disputeId}:withdrawn`
    amount = -Math.min(
      reversalCents(commission.amount_cents as number, input.paidCents, input.disputedCents),
      Math.max(0, stand),
    )
  } else {
    // Zurückgewonnen: genau das wieder gutschreiben, was die Rückbuchung genommen hat.
    const genommen = (rows ?? []).find(r => r.source === `${input.disputeId}:withdrawn`)
    source = `${input.disputeId}:reinstated`
    amount = genommen ? -(genommen.amount_cents as number) : 0
  }
  if (amount === 0) return 'skipped'

  const { error } = await admin.from('affiliate_commissions').insert({
    affiliate_id: commission.affiliate_id,
    account_id: commission.account_id,
    invoice_id: inv.id,
    kind: 'reversal',
    source,
    period_start: commission.period_start,
    base_cents: commission.base_cents,
    rate_bps: commission.rate_bps,
    amount_cents: amount,
    available_at: null,
  })
  if (error) {
    if (error.code === '23505') return 'skipped'
    throw new Error(`affiliate_commissions: ${error.message}`)
  }
  return 'recorded'
}
