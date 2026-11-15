import { createAdminClient } from '@/utils/supabase/service'
import { getMessages } from '@/lib/i18n'
import { getAdminLocale } from '@/utils/locale'
import { affiliateEnabled, isPartnerCode, isSelfReferral, normalizePartnerCode } from '@/lib/affiliate'
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
