'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/service'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext, getManagementContext } from '@/utils/auth'
import { generatePin, generateToken } from '@/lib/ids'
import { buildMaidEmail, normalizeUsername } from '@/lib/maid'
import { testzugaengeErlaubt } from '@/lib/test-accounts'

export type MaidLoginCard = {
  profileId: string
  username: string
  displayName: string
  pin: string
  token: string
}

export type CreateMaidResult = { card?: MaidLoginCard; error?: string }

/**
 * Reinigungskraft anlegen: Auth-User (synthetische E-Mail, PIN als Passwort)
 * + Profil mit username-Discriminator + Login-Karte (Token + PIN als Einheit).
 */
export async function createMaidAction(slug: string, formData: FormData): Promise<CreateMaidResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const displayName = ((formData.get('displayName') as string) ?? '').trim()
  const username = normalizeUsername((formData.get('username') as string) ?? '')

  if (displayName.length < 2) return { error: 'Name muss mindestens 2 Zeichen haben.' }
  if (username.length < 2) return { error: 'Benutzername muss mindestens 2 Zeichen haben (a–z, 0–9, . _ -).' }

  const pin = generatePin(6)
  const email = buildMaidEmail(username, ctx.hotelId)
  const admin = createAdminClient()

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true, // keine Bestätigungs-E-Mail — Adresse ist synthetisch
  })
  if (authErr || !authUser.user) {
    if (authErr?.message?.includes('already')) {
      return { error: 'Benutzername bereits vergeben. Bitte anderen wählen.' }
    }
    return { error: authErr?.message ?? 'Konto konnte nicht erstellt werden.' }
  }

  const { error: profileErr } = await admin.from('profiles').insert({
    id: authUser.user.id,
    hotel_id: ctx.hotelId,
    display_name: displayName,
    username,
  })
  if (profileErr) {
    // Rollback: Auth-User ohne Profil wäre eine Leiche
    await admin.auth.admin.deleteUser(authUser.user.id)
    if (profileErr.code === '23505') {
      return { error: 'Benutzername bereits in diesem Hotel vergeben.' }
    }
    return { error: `Profil konnte nicht angelegt werden: ${profileErr.message}` }
  }

  // Login-Karte: Token + PIN als Einheit (UPSERT auf PK invalidiert bei
  // späteren Neudrucken die alte Karte).
  const token = generateToken(24)
  const { error: tokenErr } = await admin.from('maid_login_tokens').upsert(
    { profile_id: authUser.user.id, hotel_id: ctx.hotelId, token, pin },
    { onConflict: 'profile_id' },
  )
  if (tokenErr) {
    // Nicht-fatal: Login per Username + PIN funktioniert trotzdem;
    // Karte kann über "Neue Karte" nachgeholt werden.
    console.error('[maid_login_tokens] upsert fehlgeschlagen:', tokenErr.message)
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return { card: { profileId: authUser.user.id, username, displayName, pin, token } }
}

/**
 * Neue Zugangskarte erzeugen: neue PIN + neuer Token in einem Schritt.
 * Die alte gedruckte Karte wird als Einheit ungültig (PIN = Auth-Passwort
 * wird ersetzt, Token wird per UPSERT überschrieben).
 */
export async function issueMaidLoginCardAction(
  slug: string,
  profileId: string,
): Promise<{ card?: MaidLoginCard; error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, hotel_id, username, display_name')
    .eq('id', profileId)
    .maybeSingle()
  if (!profile || profile.hotel_id !== ctx.hotelId) return { error: 'Profil nicht gefunden.' }
  if (!profile.username) return { error: 'Profil ist kein Reinigungs-Zugang.' }

  const pin = generatePin(6)
  const token = generateToken(24)

  const { error: pinErr } = await admin.auth.admin.updateUserById(profileId, { password: pin })
  if (pinErr) return { error: pinErr.message }

  const { error: tokenErr } = await admin.from('maid_login_tokens').upsert(
    { profile_id: profileId, hotel_id: ctx.hotelId, token, pin },
    { onConflict: 'profile_id' },
  )
  if (tokenErr) return { error: `Karte konnte nicht gespeichert werden: ${tokenErr.message}` }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  return {
    card: { profileId, username: profile.username, displayName: profile.display_name, pin, token },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EIN MODELL FÜR ALLE DREI PERSONAL-ARTEN (03.09.2026)
//
// Vorher gab es drei Muster: Reinigung kannte „deaktivieren" (umkehrbar) und
// „löschen", Rezeption und Manager nur „entfernen" — wobei die Anwendung still
// im Hintergrund entschied, ob dabei auch das Konto verschwindet. Für den
// Bediener sahen das drei verschiedene Systeme.
//
// Jetzt gilt überall dieselbe Zwei-Stufen-Logik:
//
//   1. Zugang beenden  — Login sofort tot, nichts geht verloren, umkehrbar
//   2. Endgültig löschen — mit bezifferter Folgenanzeige davor
//
// Der Unterschied liegt nur noch dort, wo er sachlich begründet ist: Bei der
// Reinigung hängt die Identität an EINEM Haus (`profiles`), beim Management an
// einer Mitgliedschaft je Haus (`hotel_members`) — „beenden" wirkt deshalb beim
// Manager nur auf DIESES Haus. Und Stufe 2 ist nur bei der Reinigung wirklich
// destruktiv, weil allein dort `staff_log` mitkaskadiert.
// ═══════════════════════════════════════════════════════════════════════════

export type StaffKind = 'maid' | 'reception' | 'manager'

type ResolvedStaff = {
  kind: StaffKind
  displayName: string
  /** Nur die Reinigung hat einen Benutzernamen. */
  username: string | null
  deactivatedAt: string | null
}

/** Welche Art von Personal ist das — und gehört es zu diesem Haus? */
async function resolveStaff(
  admin: SupabaseClient,
  hotelId: string,
  userId: string,
): Promise<ResolvedStaff | null> {
  const [{ data: profile }, { data: member }] = await Promise.all([
    admin.from('profiles')
      .select('hotel_id, username, display_name, deactivated_at').eq('id', userId).maybeSingle(),
    admin.from('hotel_members')
      .select('role, display_name, deactivated_at').eq('hotel_id', hotelId).eq('user_id', userId).maybeSingle(),
  ])

  if (profile?.username && profile.hotel_id === hotelId) {
    return {
      kind: 'maid',
      displayName: profile.display_name,
      username: profile.username,
      deactivatedAt: profile.deactivated_at,
    }
  }
  if (member) {
    return {
      kind: member.role === 'manager' ? 'manager' : 'reception',
      displayName: member.display_name,
      username: null,
      deactivatedAt: member.deactivated_at,
    }
  }
  return null
}

/** Manager verwaltet nur der Kontoinhaber — sonst wäre es Rechteausweitung. */
function darfVerwalten(kind: StaffKind, isOwner: boolean): boolean {
  return kind !== 'manager' || isOwner
}

export type SetStaffActiveResult = { error?: string; kind?: StaffKind; otherHotels?: number }

/**
 * Stufe 1 — Zugang beenden oder wieder aktivieren. Der Regelweg beim
 * Ausscheiden: nichts geht verloren, alles ist umkehrbar.
 *
 * Reinigung: `profiles.deactivated_at`. Das Profil bleibt samt `staff_log`
 * erhalten (Arbeitsnachweis!), Login per Username+PIN und per QR-Karte wird
 * abgewiesen. Die Login-Karte bleibt absichtlich gespeichert — bei beendetem
 * Zugang wirkungslos, und eine Wieder-Aktivierung stellt den alten Zugang ohne
 * Neudruck her.
 *
 * Management: `hotel_members.deactivated_at`, also **nur für dieses Haus**.
 * Andere Häuser derselben Person bleiben unberührt.
 */
export async function setStaffActiveAction(
  slug: string,
  userId: string,
  active: boolean,
): Promise<SetStaffActiveResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (userId === ctx.userId) return { error: 'Der eigene Zugang lässt sich hier nicht beenden.' }
  const admin = createAdminClient()

  const staff = await resolveStaff(admin, ctx.hotelId, userId)
  if (!staff) return { error: 'Zugang nicht gefunden.' }
  if (!darfVerwalten(staff.kind, ctx.isOwner)) {
    return { error: 'Nur der Kontoinhaber kann Manager verwalten.' }
  }

  if (!active && staff.kind === 'maid') {
    const { data: cleaning } = await admin
      .from('room_states').select('room_id').eq('cleaning_by', userId).limit(1)
    if (cleaning && cleaning.length > 0) {
      return { error: 'Diese Kraft reinigt gerade ein Zimmer. Erst die Reinigung abschließen (oder im Board als erledigt markieren).' }
    }
  }

  const stamp = active ? null : new Date().toISOString()

  if (staff.kind === 'maid') {
    const { error } = await admin
      .from('profiles').update({ deactivated_at: stamp }).eq('id', userId).eq('hotel_id', ctx.hotelId)
    if (error) return { error: error.message }
    // Verortung endet mit dem Zugang.
    if (!active) await admin.from('maid_presence').delete().eq('profile_id', userId)
  } else {
    const { error } = await admin
      .from('hotel_members').update({ deactivated_at: stamp })
      .eq('hotel_id', ctx.hotelId).eq('user_id', userId)
    if (error) return { error: error.message }
  }

  // Wie viele Häuser betreut die Person sonst noch (aktiv)?
  let otherHotels = 0
  if (staff.kind === 'manager') {
    const { data: rest } = await admin
      .from('hotel_members').select('hotel_id')
      .eq('user_id', userId).is('deactivated_at', null).neq('hotel_id', ctx.hotelId)
    otherHotels = (rest ?? []).length
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath(`/h/${ctx.hotelSlug}/service`)
  revalidatePath('/admin')
  return { kind: staff.kind, otherHotels }
}

/**
 * Anzeigename (alle Personal-Arten) und Benutzername (nur Reinigung) ändern.
 *
 * Der häufigste Grund, eine Person löschen zu wollen, ist ein Vertipper beim
 * Anlegen — und dafür war Löschen und Neuanlegen bisher der einzige Weg. Bei
 * Reinigungskräften kostete das zusätzlich eine **neu gedruckte Karte**.
 *
 * Der Anzeigename wird in allen Tabellen zugleich gesetzt (`profiles`,
 * `hotel_members`, `account_members`), sonst laufen sie auseinander — dieselbe
 * Regel wie unter „Mein Zugang". Berührt werden dabei nur Zeilen des **eigenen
 * Kontos**: dieselbe Person kann in einem fremden Konto sitzen, und deren
 * Anzeigename geht dieses Haus nichts an.
 */
export type StaffPatch = { displayName?: string; username?: string }

export async function renameStaffAction(
  slug: string,
  userId: string,
  patch: StaffPatch,
): Promise<{ error?: string; changed?: boolean }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const displayName = patch.displayName === undefined ? undefined : patch.displayName.trim()
  if (displayName !== undefined && displayName.length < 2) {
    return { error: 'Name muss mindestens 2 Zeichen haben.' }
  }
  if (displayName !== undefined && displayName.length > 80) {
    return { error: 'Name ist zu lang (maximal 80 Zeichen).' }
  }

  const [{ data: profile }, { data: member }] = await Promise.all([
    admin.from('profiles').select('id, hotel_id, username, display_name').eq('id', userId).maybeSingle(),
    admin.from('hotel_members').select('role').eq('hotel_id', ctx.hotelId).eq('user_id', userId).maybeSingle(),
  ])

  const istReinigung = Boolean(profile?.username) && profile?.hotel_id === ctx.hotelId
  if (!istReinigung && !member) return { error: 'Zugang nicht gefunden.' }
  // Gleiche Grenze wie beim Entfernen: ein Manager, der Mit-Manager umbenennt,
  // wäre zwar harmlos — aber die Manager-Verwaltung liegt geschlossen beim
  // Kontoinhaber, und geteilte Zuständigkeit verwirrt mehr, als sie nützt.
  if (member?.role === 'manager' && !ctx.isOwner) {
    return { error: 'Nur der Kontoinhaber kann Manager verwalten.' }
  }

  const username = patch.username === undefined ? undefined : normalizeUsername(patch.username)
  if (username !== undefined) {
    if (!istReinigung) return { error: 'Nur Reinigungs-Zugänge haben einen Benutzernamen.' }
    if (username.length < 2) {
      return { error: 'Benutzername muss mindestens 2 Zeichen haben (a–z, 0–9, . _ -).' }
    }
  }

  if (displayName === undefined && username === undefined) return { error: 'Nichts zu ändern.' }

  // Bewusst ohne Kurzschluss bei unverändertem Wert: der Anzeigename steht in
  // drei Tabellen, und ein Schreibvorgang mit gleichem Wert gleicht eine
  // auseinandergelaufene Zeile nebenbei wieder an.
  const usernameGleich = username === undefined || username === profile?.username

  if (username !== undefined && !usernameGleich) {
    const { data: clash } = await admin
      .from('profiles').select('id').eq('hotel_id', ctx.hotelId).eq('username', username).maybeSingle()
    if (clash && clash.id !== userId) {
      return { error: `Benutzername „${username}" ist in diesem Haus bereits vergeben.` }
    }
    // Der PIN-Login baut seine Auth-Adresse aus dem Benutzernamen
    // (`buildMaidEmail`) — ohne diesen Schritt käme die Kraft nicht mehr rein.
    // Der QR-Login liest den Benutzernamen ohnehin frisch aus `profiles`.
    const { error: mailErr } = await admin.auth.admin.updateUserById(userId, {
      email: buildMaidEmail(username, ctx.hotelId),
    })
    if (mailErr) return { error: `Login konnte nicht umgestellt werden: ${mailErr.message}` }
  }

  const profilePatch: { display_name?: string; username?: string } = {}
  if (displayName !== undefined) profilePatch.display_name = displayName
  if (username !== undefined) profilePatch.username = username
  if (Object.keys(profilePatch).length > 0) {
    const { error } = await admin.from('profiles').update(profilePatch).eq('id', userId)
    if (error) return { error: `Ändern fehlgeschlagen: ${error.message}` }
  }

  if (displayName !== undefined) {
    const { data: ownHotels } = await admin
      .from('hotels').select('id').eq('account_id', ctx.accountId)
    const ownIds = (ownHotels ?? []).map(h => h.id)
    if (ownIds.length > 0) {
      await admin.from('hotel_members')
        .update({ display_name: displayName }).eq('user_id', userId).in('hotel_id', ownIds)
    }
    await admin.from('account_members')
      .update({ display_name: displayName }).eq('user_id', userId).eq('account_id', ctx.accountId)
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath('/admin')
  return { changed: true }
}

/**
 * Was das Löschen einer Reinigungskraft kostet.
 *
 * Anders als beim Zimmer ist die Warnung hier **berechtigt**:
 * `staff_log.profile_id` steht auf `on delete cascade` — der komplette
 * Arbeitsnachweis (Schichten, Pausen, Reinigungen) verschwindet mit dem
 * Zugang. `stays.created_by` und `service_orders.done_by` stehen dagegen auf
 * `on delete set null`: diese Einträge bleiben, verlieren aber den Namen.
 */
export type StaffDeletionImpact = {
  kind: StaffKind
  displayName: string
  /** Nur die Reinigung hat einen Benutzernamen. */
  username: string | null
  /** Bei drohendem Datenverlust abzutippen; sonst leer. */
  confirmPhrase: string
  requiresPhrase: boolean
  logEntries: number
  cleanings: number
  firstAt: string | null
  lastAt: string | null
  checkIns: number
  ordersDone: number
  hasCard: boolean
  /** Gesetzt = reinigt gerade, Löschen ist gesperrt. */
  cleaningRoom: string | null
  /** Management: weitere Häuser derselben Person, die unberührt bleiben. */
  otherHotels: number
  /**
   * Management: Das Anmeldekonto bleibt bestehen, weil Vorgänge daran hängen
   * oder die Person noch woanders eingesetzt ist. Bisher entschied die
   * Anwendung das still — jetzt steht es vorher da.
   */
  accountKept: boolean
}

export async function getStaffDeletionImpactAction(
  slug: string,
  userId: string,
): Promise<{ impact?: StaffDeletionImpact; error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  const admin = createAdminClient()

  const staff = await resolveStaff(admin, ctx.hotelId, userId)
  if (!staff) return { error: 'Zugang nicht gefunden.' }
  if (!darfVerwalten(staff.kind, ctx.isOwner)) {
    return { error: 'Nur der Kontoinhaber kann Manager verwalten.' }
  }

  const [log, cleanings, checkIns, ordersDone, card, cleaning, firstRow, lastRow, otherRows, ownerRow] =
    await Promise.all([
      admin.from('staff_log').select('*', { count: 'exact', head: true }).eq('profile_id', userId),
      admin.from('staff_log').select('*', { count: 'exact', head: true }).eq('profile_id', userId).eq('kind', 'clean_done'),
      admin.from('stays').select('*', { count: 'exact', head: true }).eq('created_by', userId),
      admin.from('service_orders').select('*', { count: 'exact', head: true }).eq('done_by', userId),
      admin.from('maid_login_tokens').select('profile_id').eq('profile_id', userId).maybeSingle(),
      admin.from('room_states').select('room_id').eq('cleaning_by', userId).maybeSingle(),
      admin.from('staff_log').select('at').eq('profile_id', userId).order('at').limit(1).maybeSingle(),
      admin.from('staff_log').select('at').eq('profile_id', userId).order('at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('hotel_members').select('hotel_id').eq('user_id', userId).neq('hotel_id', ctx.hotelId),
      admin.from('account_members').select('account_id').eq('user_id', userId).limit(1),
    ])

  let cleaningRoom: string | null = null
  if (cleaning.data?.room_id) {
    const { data: room } = await admin
      .from('rooms').select('number').eq('id', cleaning.data.room_id).maybeSingle()
    cleaningRoom = room?.number ?? '?'
  }

  const logEntries = log.count ?? 0
  const otherHotels = (otherRows.data ?? []).length
  const hatVorgaenge = logEntries > 0 || (checkIns.count ?? 0) > 0 || (ordersDone.count ?? 0) > 0

  // Nur bei der Reinigung ist Löschen wirklich destruktiv: dort kaskadiert
  // `staff_log`. Beim Management bleibt das Konto stehen, sobald etwas daran
  // hängt — dann gibt es nichts zu verlieren und der Abtipp-Riegel wäre
  // Ritual statt Schutz.
  const accountKept =
    staff.kind !== 'maid' && (hatVorgaenge || otherHotels > 0 || (ownerRow.data ?? []).length > 0)
  const requiresPhrase = staff.kind === 'maid' && logEntries > 0
  const phrase = staff.kind === 'maid' ? (staff.username ?? '') : staff.displayName

  return {
    impact: {
      kind: staff.kind,
      displayName: staff.displayName,
      username: staff.username,
      confirmPhrase: requiresPhrase ? phrase : '',
      requiresPhrase,
      logEntries,
      cleanings: cleanings.count ?? 0,
      firstAt: firstRow.data?.at ?? null,
      lastAt: lastRow.data?.at ?? null,
      checkIns: checkIns.count ?? 0,
      ordersDone: ordersDone.count ?? 0,
      hasCard: Boolean(card.data),
      cleaningRoom,
      otherHotels,
      accountKept,
    },
  }
}

export type DeleteStaffResult = {
  error?: string
  kind?: StaffKind
  /** Konto blieb bestehen, weil Vorgänge daran hängen. */
  accountKept?: boolean
  otherHotels?: number
}

/**
 * Stufe 2 — endgültig löschen. „Zugang beenden" bleibt der Regelweg.
 *
 * Reinigung: Der Auth-User geht, und die CASCADE räumt Profil, Login-Karte UND
 * `staff_log` ab — der Arbeitsnachweis ist damit wirklich weg. Deshalb verlangt
 * eine Kraft mit Tätigkeits-Historie den abgetippten Benutzernamen; eine
 * Fehlanlage ohne jeden Stich lässt sich direkt entfernen.
 *
 * Management: Die Mitgliedschaft dieses Hauses wird gelöscht. Das Anmeldekonto
 * verschwindet nur, wenn nichts mehr daran hängt — `profiles` ist Ziel von
 * `stays.created_by` und `service_orders.done_by`, und `staff_log` kaskadiert
 * (die Rezeption sticht `clean_done`). Beim Management geht also nie etwas
 * verloren, und ein Abtipp-Riegel wäre hier Ritual statt Schutz.
 */
export async function deleteStaffAction(
  slug: string,
  userId: string,
  confirmPhrase = '',
): Promise<DeleteStaffResult> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }
  if (userId === ctx.userId) return { error: 'Der eigene Zugang lässt sich hier nicht löschen.' }
  const admin = createAdminClient()

  const { impact, error: impactErr } = await getStaffDeletionImpactAction(slug, userId)
  if (!impact) return { error: impactErr ?? 'Zugang nicht gefunden.' }

  if (impact.cleaningRoom) {
    return { error: `Diese Kraft reinigt gerade Zimmer ${impact.cleaningRoom}. Erst die Reinigung abschließen (oder im Board als erledigt markieren).` }
  }
  if (impact.requiresPhrase && confirmPhrase.trim() !== impact.confirmPhrase) {
    return { error: `Bitte „${impact.confirmPhrase}" zur Bestätigung eingeben.` }
  }

  if (impact.kind !== 'maid') {
    const { error: memberErr } = await admin
      .from('hotel_members').delete().eq('hotel_id', ctx.hotelId).eq('user_id', userId)
    if (memberErr) return { error: memberErr.message }
  }

  if (!impact.accountKept) {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { error: error.message }
  }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath('/admin')
  return { kind: impact.kind, accountKept: impact.accountKept, otherHotels: impact.otherHotels }
}

/** Rückmeldung nach einer verschickten Einladung. */
export type Einladung = { displayName: string; email: string }

/**
 * Profil + Hausmitgliedschaft für einen frisch erzeugten Auth-Nutzer.
 *
 * Die `profiles`-Zeile ist PFLICHT, auch für Management: `stays.created_by`
 * und `service_orders.done_by` zeigen darauf. `hotel_id` ist dort nur das
 * Stammhaus, NICHT die Berechtigung — die steht in `hotel_members`.
 *
 * Scheitert einer der beiden Schritte, wird der Auth-Nutzer wieder entfernt:
 * ein Konto ohne Profil wäre eine Leiche, die sich anmelden kann.
 *
 * Gibt eine Fehlermeldung zurück oder `null`.
 */
async function legeMitgliedschaftAn(
  admin: SupabaseClient,
  userId: string,
  opts: { displayName: string; hotelId: string; role: 'reception' | 'manager' },
): Promise<string | null> {
  const { displayName, hotelId, role } = opts

  const { error: profileErr } = await admin
    .from('profiles')
    .insert({ id: userId, hotel_id: hotelId, display_name: displayName })
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId)
    return `Profil konnte nicht angelegt werden: ${profileErr.message}`
  }

  const { error: memberErr } = await admin
    .from('hotel_members')
    .insert({ hotel_id: hotelId, user_id: userId, role, display_name: displayName })
  if (memberErr) {
    await admin.auth.admin.deleteUser(userId)
    return `Zuordnung konnte nicht angelegt werden: ${memberErr.message}`
  }

  return null
}

/**
 * Gemeinsamer Einladungs-Pfad für Rezeption und Manager.
 *
 * Statt ein Passwort zu erzeugen und vorlesen zu lassen, verschickt Supabase
 * eine Einladung über dieselbe SMTP-Strecke wie der Passwort-Reset. Die
 * eingeladene Person vergibt ihr Passwort selbst — es existiert zu keinem
 * Zeitpunkt außerhalb ihres Kopfes.
 *
 * **Kein Resend-Code nötig:** `inviteUserByEmail` geht denselben Weg wie
 * `resetPasswordForEmail`. Der Resend-Schlüssel lebt weiterhin ausschließlich
 * in Supabases SMTP-Einstellung, nicht im Projekt.
 *
 * Der Link in der Mail muss auf `/auth/confirm` zeigen (Vorlage in Supabase) —
 * PKCE scheidet bei Einladungen aus, weil der einladende Browser ein anderer
 * ist als der annehmende.
 */
/**
 * Zugangsdaten eines **Testzugangs** — nur im Testbetrieb, siehe
 * [test-accounts.ts](src/lib/test-accounts.ts). Das Passwort wird genau einmal
 * angezeigt.
 */
export type Zugangsdaten = { displayName: string; email: string; password: string }

async function ladeEin(opts: {
  email: string
  displayName: string
  hotelId: string
  hotelSlug: string
  hotelName: string
  role: 'reception' | 'manager'
  /** Testbetrieb: Zugang direkt anlegen, Passwort anzeigen, keine Mail. */
  ohneMail?: boolean
}): Promise<{ einladung?: Einladung; zugang?: Zugangsdaten; error?: string }> {
  const { email, displayName, hotelId, hotelSlug, hotelName, role, ohneMail } = opts
  const admin = createAdminClient()

  // ── Testbetrieb: ohne Mail, Passwort einmal anzeigen ───────────────────
  // Der Weg existiert nur, wenn ALLOW_TEST_ACCOUNTS gesetzt ist; die Prüfung
  // steht hier und nicht nur in der Oberfläche, weil das Formular manipulierbar
  // ist. `email_confirm: true` umgeht jeden Bestätigungslauf — dadurch sind
  // auch nicht zustellbare Adressen (`…@rose.local`) brauchbar, an denen der
  // Mailversand ohnehin scheitern würde.
  if (ohneMail) {
    if (!testzugaengeErlaubt()) return { error: 'Testzugänge sind nicht freigeschaltet.' }

    const password = generateToken(9)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (createErr || !created?.user) {
      if (createErr?.message?.toLowerCase().includes('already')) {
        return { error: 'Für diese E-Mail-Adresse gibt es bereits einen Zugang.' }
      }
      return { error: createErr?.message ?? 'Zugang konnte nicht erstellt werden.' }
    }

    const fehler = await legeMitgliedschaftAn(admin, created.user.id, {
      displayName, hotelId, role,
    })
    if (fehler) return { error: fehler }

    revalidatePath(`/h/${hotelSlug}/admin`, 'layout')
    revalidatePath('/admin')
    return { zugang: { displayName, email, password } }
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${base}/auth/confirm?next=/passwort-neu`,
    // Landet in `user_metadata` und ist in der Mail-Vorlage als
    // `{{ .Data.hotel }}` / `{{ .Data.rolle }}` / `{{ .Data.name }}` verfügbar.
    // Damit liest sich die Einladung als konkrete Nachricht statt als
    // Rundschreiben — was auch Gmails Einsortierung zugutekommt.
    //
    // ACHTUNG: `user_metadata` ist vom Nutzer selbst änderbar. Es ist hier
    // reine Anzeige für die Mail und darf NIE für Berechtigungen herangezogen
    // werden — die stehen in `hotel_members` bzw. `account_members`.
    data: {
      name: displayName,
      hotel: hotelName,
      rolle: role === 'manager' ? 'Manager' : 'Rezeption',
    },
  })
  if (inviteErr || !invited?.user) {
    if (inviteErr?.message?.toLowerCase().includes('already')) {
      return {
        error: 'Für diese E-Mail-Adresse gibt es bereits einen Zugang. War die Person hier schon einmal tätig, steht sie unter „Beendete Zugänge" und lässt sich dort wieder aktivieren.',
      }
    }
    console.error('[inviteUserByEmail]', {
      status: inviteErr?.status, code: inviteErr?.code, message: inviteErr?.message,
    })
    return { error: 'Die Einladung konnte nicht verschickt werden. Bitte die Adresse prüfen.' }
  }
  const fehler = await legeMitgliedschaftAn(admin, invited.user.id, {
    displayName, hotelId, role,
  })
  if (fehler) return { error: fehler }

  revalidatePath(`/h/${hotelSlug}/admin`, 'layout')
  revalidatePath('/admin')
  return { einladung: { displayName, email } }
}

/**
 * Einladung erneut schicken — für Zugänge, die noch nicht angenommen wurden.
 *
 * Bewusst über `resetPasswordForEmail` statt eines zweiten `invite`: der Nutzer
 * existiert bereits, eine erneute Einladung würde daran scheitern. Das Ergebnis
 * ist dasselbe — ein Link, über den sich ein Passwort setzen lässt.
 */
export async function resendInvitationAction(
  slug: string,
  userId: string,
): Promise<{ error?: string; email?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const admin = createAdminClient()

  // Nur Zugänge DIESES Hauses — die userId kommt aus dem Formular.
  const { data: member } = await admin
    .from('hotel_members')
    .select('role')
    .eq('hotel_id', ctx.hotelId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!member) return { error: 'Zugang nicht gefunden.' }
  if (member.role === 'manager' && !ctx.isOwner) {
    return { error: 'Nur der Kontoinhaber kann Manager verwalten.' }
  }

  const { data: user } = await admin.auth.admin.getUserById(userId)
  const email = user?.user?.email
  if (!email) return { error: 'Zugang hat keine E-Mail-Adresse.' }

  const supabase = await createClient()
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/confirm?next=/passwort-neu`,
  })
  if (error) {
    console.error('[resendInvitation]', { status: error.status, message: error.message })
    return { error: 'Der Link konnte nicht verschickt werden.' }
  }
  return { email }
}

/**
 * Rezeptions-Zugang anlegen: E-Mail-Login, hausintern.
 *
 * Die Berechtigung steht seit Phase 6d in `hotel_members`; die `profiles`-
 * Zeile bleibt als Identitäts- und Fremdschlüssel-Anker nötig
 * (`stays.created_by`, `service_orders.done_by` zeigen darauf).
 *
 * Das generierte Passwort wird genau einmal angezeigt. Mittelfristig soll das
 * auf Einladungs-Mails per Resend umgestellt werden.
 */
export async function createReceptionAction(
  slug: string,
  formData: FormData,
): Promise<{ einladung?: Einladung; zugang?: Zugangsdaten; error?: string }> {
  const ctx = await getAdminContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const displayName = ((formData.get('displayName') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()

  if (displayName.length < 2) return { error: 'Name muss mindestens 2 Zeichen haben.' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }

  return ladeEin({
    email, displayName,
    hotelId: ctx.hotelId, hotelSlug: ctx.hotelSlug, hotelName: ctx.hotelName,
    role: 'reception',
    ohneMail: formData.get('ohneMail') === 'on',
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// MANAGER — hausbezogen, wie Rezeption und Reinigung.
//
// Ein Manager kann mehrere Häuser betreuen; verwaltet wird er trotzdem je
// Haus: die Personal-Seite von Haus X zeigt und ändert ausschließlich die
// Manager VON Haus X. Wer jemanden über drei Häuser einsetzen will, trägt ihn
// in drei Häusern ein — beim zweiten und dritten Mal per Auswahl aus den
// bereits vorhandenen Managern des Kontos, ohne neuen Zugang.
//
// Der Riegel ist hier bewusst STRENGER als bei Reinigung und Rezeption:
// `getAdminContext` ließe auch Manager durch, und ein Manager, der sich
// Mit-Manager ernennt, wäre eine Rechteausweitung. Deshalb `isOwner`.
// ═══════════════════════════════════════════════════════════════════════════

/** Kontext für Manager-Verwaltung: nur der Kontoinhaber DIESES Hauses. */
async function requireOwner(slug: string) {
  const ctx = await getManagementContext(slug)
  if (!ctx || !ctx.isOwner) return null
  return ctx
}

/** Neuen Manager anlegen und diesem Haus zuordnen. */
export async function createManagerAction(
  slug: string,
  formData: FormData,
): Promise<{ einladung?: Einladung; zugang?: Zugangsdaten; error?: string }> {
  const ctx = await requireOwner(slug)
  if (!ctx) return { error: 'Nur der Kontoinhaber kann Manager verwalten.' }

  const displayName = ((formData.get('displayName') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()

  if (displayName.length < 2) return { error: 'Name muss mindestens 2 Zeichen haben.' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse angeben.' }

  const res = await ladeEin({
    email, displayName,
    hotelId: ctx.hotelId, hotelSlug: ctx.hotelSlug, hotelName: ctx.hotelName,
    role: 'manager',
    ohneMail: formData.get('ohneMail') === 'on',
  })
  // Beim Manager gibt es für „schon vergeben" einen zweiten Weg — darauf
  // hinweisen, statt den Nutzer im Regen stehen zu lassen.
  if (res.error?.includes('bereits einen Zugang')) {
    return { error: 'Für diese E-Mail-Adresse gibt es bereits einen Zugang. Ist die Person schon Manager im Konto, über „Vorhandenen Manager hinzufügen" auswählen.' }
  }
  return res
}

/**
 * Vorhandenen Manager des Kontos zusätzlich diesem Haus zuordnen.
 *
 * Der Weg für den zweiten und jeden weiteren Einsatzort — kein neuer Zugang,
 * dieselbe Person.
 */
export async function attachManagerAction(slug: string, userId: string): Promise<{ error?: string }> {
  const ctx = await requireOwner(slug)
  if (!ctx) return { error: 'Nur der Kontoinhaber kann Manager verwalten.' }

  const admin = createAdminClient()

  // Die userId kommt aus dem Formular, ist also ungeprüft: sie muss zu einem
  // Manager gehören, der bereits in EINEM Haus DIESES Kontos sitzt.
  const { data: ownHotels } = await admin
    .from('hotels').select('id').eq('account_id', ctx.accountId)
  const ownIds = (ownHotels ?? []).map(h => h.id)

  const { data: existing } = await admin
    .from('hotel_members')
    .select('display_name, hotel_id, role')
    .eq('user_id', userId)
    .eq('role', 'manager')
    .in('hotel_id', ownIds)
  if (!existing || existing.length === 0) return { error: 'Manager nicht gefunden.' }

  // Für DIESES Haus kann bereits eine Zeile existieren — auch eine beendete
  // oder eine mit anderer Rolle. Der Primärschlüssel ist (hotel_id, user_id),
  // ein blindes INSERT liefe also in einen Konflikt.
  const { data: hier } = await admin
    .from('hotel_members')
    .select('role, deactivated_at')
    .eq('hotel_id', ctx.hotelId)
    .eq('user_id', userId)
    .maybeSingle()

  if (hier && !hier.deactivated_at) {
    return {
      error: hier.role === 'manager'
        ? 'Diese Person ist hier bereits Manager.'
        : 'Diese Person hat hier bereits einen Rezeptions-Zugang. Erst dort beenden.',
    }
  }

  const { error } = hier
    ? await admin.from('hotel_members')
        .update({ role: 'manager', deactivated_at: null, display_name: existing[0].display_name })
        .eq('hotel_id', ctx.hotelId).eq('user_id', userId)
    : await admin.from('hotel_members').insert({
        hotel_id: ctx.hotelId,
        user_id: userId,
        role: 'manager',
        display_name: existing[0].display_name,
      })
  if (error) return { error: error.message }

  revalidatePath(`/h/${ctx.hotelSlug}/admin`, 'layout')
  revalidatePath('/admin')
  return {}
}
