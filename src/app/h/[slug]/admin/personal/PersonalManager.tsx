'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2, IdCard, KeyRound, Loader2, MailCheck, Pencil, Plus, Printer, Send, Sparkles, Trash2,
  UserCheck,
  UserMinus, UserRound,
} from 'lucide-react'
import {
  attachManagerAction, createMaidAction, createManagerAction, createReceptionAction,
  deleteStaffAction, getStaffDeletionImpactAction, issueMaidLoginCardAction, renameStaffAction,
  resendInvitationAction, setStaffActiveAction,
  type Einladung, type StaffDeletionImpact, type StaffKind, type Zugangsdaten,
} from './actions'

export type MaidRow = {
  id: string
  displayName: string
  username: string
  pin: string | null
  cleaningRoom: string | null
  /** gesetzt = Zugang beendet: kein Login, Historie bleibt erhalten */
  deactivatedAt: string | null
}

export type ReceptionRow = {
  id: string
  displayName: string
  email: string
  /** Eingeladen, aber noch nicht angenommen. */
  pending: boolean
  deactivatedAt: string | null
}

export type ManagerRow = {
  id: string
  displayName: string
  email: string
  /** In wie vielen Häusern des Kontos diese Person aktiv eingesetzt ist. */
  hotelCount: number
  /** Eingeladen, aber noch nicht angenommen. */
  pending: boolean
  deactivatedAt: string | null
}

/** „das übrige Haus bleibt" / „die übrigen 3 Häuser bleiben" — Singular zählt nicht mit. */
function uebrigeHaeuser(n: number): string {
  return n === 1 ? 'das übrige Haus bleibt' : `die übrigen ${n} Häuser bleiben`
}

/**
 * Eine Zeile, egal welcher Personal-Art — die gemeinsame Grundlage des
 * einheitlichen Modells. Drei parallel gepflegte Listen waren genau der Grund,
 * warum die drei Arten vorher auseinandergelaufen sind.
 */
type Entry = {
  id: string
  kind: StaffKind
  displayName: string
  /** Zweite Zeile: @benutzername oder E-Mail. */
  sub: string
  deactivatedAt: string | null
  username?: string
  pin?: string | null
  cleaningRoom?: string | null
  pending?: boolean
  hotelCount?: number
}

const panelInput =
  'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none'
const flachButton =
  'flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50'

export default function PersonalManager({
  hotelSlug,
  maids,
  receptionists,
  managers,
  verfuegbareManager,
  canManage,
  testAccounts,
  isOwner,
}: {
  hotelSlug: string
  maids: MaidRow[]
  receptionists: ReceptionRow[]
  /** Manager DIESES Hauses (aktive und beendete). */
  managers: ManagerRow[]
  /** Manager des Kontos, die hier noch nicht eingesetzt sind. */
  verfuegbareManager: ManagerRow[]
  /** false = Rezeptions-Rolle: nur Liste ansehen + Karten drucken. */
  canManage: boolean
  /**
   * Testbetrieb: Zugänge ohne Mailversand anlegen. Kommt aus
   * `ALLOW_TEST_ACCOUNTS` — ohne die Variable erscheint das Häkchen nicht.
   */
  testAccounts: boolean
  /** Nur der Kontoinhaber verwaltet Manager — sonst wäre es Rechteausweitung. */
  isOwner: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [recEinladung, setRecEinladung] = useState<Einladung | null>(null)
  const [mgrEinladung, setMgrEinladung] = useState<Einladung | null>(null)
  /**
   * Testbetrieb: frisch angelegter Zugang samt Passwort. Steht genau einmal
   * hier — danach nur noch über „Passwort zurücksetzen" erreichbar.
   */
  const [zugang, setZugang] = useState<Zugangsdaten | null>(null)

  /** Offenes Bearbeiten-Formular. */
  const [editId, setEditId] = useState<string | null>(null)
  /** Offene „Zugang beenden"-Rückfrage. */
  const [endId, setEndId] = useState<string | null>(null)
  /**
   * Offenes Löschen-Panel samt geladener Folgenanzeige. Ohne Zahlen ist „die
   * Historie geht verloren" nicht zu bewerten — eine Fehlanlage von heute und
   * eine Kraft mit zwei Jahren Arbeitsnachweis sähen sonst gleich aus.
   */
  const [deleteTarget, setDeleteTarget] = useState<(StaffDeletionImpact & { id: string }) | null>(null)
  const [confirmInput, setConfirmInput] = useState('')

  function closePanels() {
    setEditId(null)
    setEndId(null)
    setDeleteTarget(null)
  }

  const maidEntries: Entry[] = maids.map(m => ({
    id: m.id, kind: 'maid', displayName: m.displayName, sub: `@${m.username}`,
    deactivatedAt: m.deactivatedAt, username: m.username, pin: m.pin, cleaningRoom: m.cleaningRoom,
  }))
  const recEntries: Entry[] = receptionists.map(r => ({
    id: r.id, kind: 'reception', displayName: r.displayName, sub: r.email,
    deactivatedAt: r.deactivatedAt, pending: r.pending,
  }))
  const mgrEntries: Entry[] = managers.map(m => ({
    id: m.id, kind: 'manager', displayName: m.displayName, sub: m.email,
    deactivatedAt: m.deactivatedAt, pending: m.pending, hotelCount: m.hotelCount,
  }))

  // ─── Vorgänge ─────────────────────────────────────────────────────────────

  function runSetActive(e: Entry, active: boolean) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await setStaffActiveAction(hotelSlug, e.id, active)
      if (res.error) { setError(res.error); return }
      closePanels()
      if (active) {
        setNotice(
          e.kind === 'maid'
            ? `${e.displayName} ist wieder aktiv — der alte Zugang (PIN + Karte) gilt erneut.`
            : `${e.displayName} ist wieder aktiv — der Zugriff auf dieses Haus gilt sofort.`,
        )
      } else {
        const rest = res.otherHotels ?? 0
        setNotice(
          e.kind === 'manager' && rest > 0
            ? `Zugang von ${e.displayName} für dieses Haus beendet — ${uebrigeHaeuser(rest)} unberührt.`
            : `Zugang von ${e.displayName} beendet — Anmeldung gesperrt, alle Daten bleiben erhalten.`,
        )
      }
      router.refresh()
    })
  }

  function openDelete(e: Entry) {
    setError(null)
    setNotice(null)
    setConfirmInput('')
    setEditId(null)
    setEndId(null)
    startTransition(async () => {
      const res = await getStaffDeletionImpactAction(hotelSlug, e.id)
      if (!res.impact) { setError(res.error ?? 'Konnte nicht geladen werden.'); return }
      setDeleteTarget({ ...res.impact, id: e.id })
    })
  }

  function runDelete() {
    if (!deleteTarget) return
    const name = deleteTarget.displayName
    const kind = deleteTarget.kind
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await deleteStaffAction(hotelSlug, deleteTarget.id, confirmInput)
      if (res.error) { setError(res.error); return }
      setDeleteTarget(null)
      setNotice(
        res.accountKept
          ? `${name} entfernt. Das Anmeldekonto bleibt bestehen, weil Vorgänge daran hängen${
              (res.otherHotels ?? 0) > 0 ? ' bzw. die Person noch andere Häuser betreut' : ''
            }.`
          : kind === 'maid'
            ? `${name} endgültig gelöscht.`
            : `${name} entfernt — das Anmeldekonto wurde vollständig gelöscht.`,
      )
      router.refresh()
    })
  }

  function runRename(userId: string, patch: { displayName: string; username?: string }) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await renameStaffAction(hotelSlug, userId, patch)
      if (res.error) { setError(res.error); return }
      setEditId(null)
      setNotice(
        patch.username
          ? `Geändert: ${patch.displayName} (@${patch.username}). Gedruckte Karten tragen noch den alten Namen.`
          : `Geändert: ${patch.displayName}.`,
      )
      router.refresh()
    })
  }

  function runCreate(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await createMaidAction(hotelSlug, formData)
      if (res.error) { setError(res.error); return }
      form.reset()
      setNotice(`${res.card!.displayName} angelegt — Karte kann jetzt gedruckt werden.`)
      router.refresh()
    })
  }

  function runIssueCard(profileId: string, name: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await issueMaidLoginCardAction(hotelSlug, profileId)
      if (res.error) { setError(res.error); return }
      setNotice(`Neue Karte für ${name} erzeugt — die alte Karte (PIN + QR) ist ab sofort ungültig.`)
      router.refresh()
    })
  }

  function runCreateReception(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    setRecEinladung(null)
    setZugang(null)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await createReceptionAction(hotelSlug, formData)
      if (res.error) { setError(res.error); return }
      form.reset()
      setRecEinladung(res.einladung ?? null)
      setZugang(res.zugang ?? null)
      router.refresh()
    })
  }

  function runCreateManager(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    setMgrEinladung(null)
    setZugang(null)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await createManagerAction(hotelSlug, formData)
      if (res.error) { setError(res.error); return }
      form.reset()
      setMgrEinladung(res.einladung ?? null)
      setZugang(res.zugang ?? null)
      router.refresh()
    })
  }

  function runAttachManager(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    setMgrEinladung(null)
    const userId = String(new FormData(form).get('userId') ?? '')
    if (!userId) { setError('Bitte einen Manager auswählen.'); return }
    startTransition(async () => {
      const res = await attachManagerAction(hotelSlug, userId)
      if (res.error) { setError(res.error); return }
      form.reset()
      setNotice('Manager diesem Haus zugeordnet — der Zugriff gilt sofort.')
      router.refresh()
    })
  }

  /** Einladung erneut schicken — für Zugänge, die noch offen sind. */
  function runResend(userId: string, name: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await resendInvitationAction(hotelSlug, userId)
      if (res.error) { setError(res.error); return }
      setNotice(`Neuer Link an ${name} verschickt (${res.email}).`)
    })
  }

  // ─── Darstellung ──────────────────────────────────────────────────────────

  /**
   * Häkchen für den Testbetrieb — erscheint nur, wenn `ALLOW_TEST_ACCOUNTS`
   * gesetzt ist. Amber statt neutral, damit im Screenshot erkennbar bleibt,
   * dass hier ein Zugang ohne Einladung entstanden ist.
   */
  const testHaken = testAccounts ? (
    <label className="mt-3 flex w-fit cursor-pointer items-start gap-2 rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2">
      <input
        type="checkbox"
        name="ohneMail"
        className="mt-0.5 h-4 w-4 accent-[var(--color-attention-bar)]"
      />
      <span className="text-xs font-semibold text-attention-deepest">
        Ohne E-Mail anlegen (Testbetrieb)
        <span className="mt-0.5 block font-normal">
          Keine Einladung — der Zugang entsteht sofort, das Passwort wird genau einmal
          angezeigt. Damit sind auch nicht zustellbare Adressen wie
          <code className="mx-1 font-mono">tester@rose.local</code> brauchbar.
        </span>
      </span>
    </label>
  ) : null

  /**
   * Eine Personal-Zeile mit den immer gleichen Vorgängen. Bewusst eine
   * Render-Funktion statt einer eigenen Komponente: sie greift auf State und
   * Handler oben zu, und ein Dutzend durchgereichter Props hätte den Zweck
   * — eine einzige Stelle für alle drei Arten — wieder aufgeweicht.
   */
  function zeile(e: Entry) {
    const beendet = Boolean(e.deactivatedAt)
    return (
      <div
        key={e.id}
        className={`rounded-xl border px-4 py-3 ${
          beendet ? 'border-edge bg-surface-sunken' : 'border-edge bg-surface'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-40">
            <p className={`font-bold ${beendet ? 'text-ink-muted' : 'text-ink'}`}>{e.displayName}</p>
            <p className="font-mono text-xs text-ink-muted">{e.sub}</p>
          </div>

          {beendet && (
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              beendet seit {new Date(e.deactivatedAt!).toLocaleDateString('de-DE')}
            </span>
          )}
          {!beendet && e.cleaningRoom && (
            <span className="flex items-center gap-1 rounded-full bg-positive-pill px-3 py-1 text-xs font-semibold text-positive-deepest">
              <Sparkles className="h-3.5 w-3.5" /> reinigt Zimmer {e.cleaningRoom}
            </span>
          )}
          {!beendet && (e.hotelCount ?? 0) > 1 && (
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              betreut {e.hotelCount} Häuser
            </span>
          )}
          {!beendet && e.pending && (
            <>
              <span className="rounded-full bg-attention-pill px-2.5 py-0.5 text-xs font-semibold text-attention-deepest">
                Einladung offen
              </span>
              {canManage && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runResend(e.id, e.displayName)}
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" /> Erneut senden
                </button>
              )}
            </>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Reinigungs-spezifisch: PIN und Karte */}
            {e.kind === 'maid' && !beendet && (
              e.pin ? (
                <span
                  className="rounded-lg bg-surface-muted px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-ink-soft"
                  title="Aktuelle PIN"
                >
                  {e.pin}
                </span>
              ) : (
                <span className="text-xs text-ink-muted">keine Karte</span>
              )
            )}
            {e.kind === 'maid' && !beendet && e.pin && (
              <Link
                href={`/h/${hotelSlug}/admin/personal/karte/${e.id}`}
                className={flachButton}
              >
                <Printer className="h-4 w-4" /> Karte drucken
              </Link>
            )}
            {e.kind === 'maid' && !beendet && canManage && (
              <button
                type="button"
                disabled={pending}
                onClick={() => runIssueCard(e.id, e.displayName)}
                title="Neue PIN + neuer QR-Code — alte Karte wird ungültig"
                className={flachButton}
              >
                <IdCard className="h-4 w-4" /> Neue Karte
              </button>
            )}

            {/* Für alle drei Arten identisch */}
            {canManage && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => { closePanels(); setEditId(editId === e.id ? null : e.id) }}
                  title={e.kind === 'maid'
                    ? 'Anzeigename oder Benutzername korrigieren'
                    : 'Anzeigename korrigieren'}
                  className={flachButton}
                >
                  <Pencil className="h-4 w-4" /> Bearbeiten
                </button>

                {beendet ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runSetActive(e, true)}
                    className={flachButton}
                  >
                    <UserCheck className="h-4 w-4" /> Wieder aktivieren
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => { closePanels(); setEndId(e.id) }}
                    title="Anmeldung sperren, alle Daten behalten"
                    className={flachButton}
                  >
                    <UserMinus className="h-4 w-4" /> Zugang beenden
                  </button>
                )}

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openDelete(e)}
                  className="rounded-lg border border-critical-pill-edge p-1.5 text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                  aria-label={`${e.displayName} endgültig löschen`}
                  title="Endgültig löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {editId === e.id && (
          <StaffEditPanel
            displayName={e.displayName}
            username={e.kind === 'maid' ? e.username : undefined}
            pending={pending}
            hint={e.kind === 'manager' && (e.hotelCount ?? 0) > 1
              ? `Gilt für alle ${e.hotelCount} Häuser dieser Person — der Name gehört zur Person, nicht zum Haus.`
              : undefined}
            onCancel={() => setEditId(null)}
            onSave={patch => runRename(e.id, patch)}
          />
        )}

        {endId === e.id && (
          <div className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3">
            <p className="text-sm font-semibold text-ink">
              Zugang von {e.displayName} beenden?{' '}
              {e.kind === 'maid'
                ? 'Login per PIN und QR-Karte werden sofort gesperrt.'
                : 'Die Anmeldung für dieses Haus wird sofort ungültig.'}
              {' '}Alle Daten bleiben erhalten, und eine Wieder-Aktivierung stellt den Zugang her.
              {e.kind === 'manager' && (e.hotelCount ?? 0) > 1
                ? ` ${uebrigeHaeuser((e.hotelCount ?? 1) - 1).replace(/^./, c => c.toUpperCase())} unberührt.`
                : ''}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => runSetActive(e, false)}
                className="rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground disabled:opacity-50"
              >
                {pending ? 'Beenden …' : 'Ja, Zugang beenden'}
              </button>
              <button
                type="button"
                onClick={() => setEndId(null)}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {deleteTarget?.id === e.id && (
          <StaffDeletePanel
            impact={deleteTarget}
            confirmInput={confirmInput}
            setConfirmInput={setConfirmInput}
            pending={pending}
            onCancel={() => setDeleteTarget(null)}
            onDelete={runDelete}
            onEnd={beendet ? undefined : () => runSetActive(e, false)}
          />
        )}
      </div>
    )
  }

  /** Aktive zuerst, beendete darunter — in jeder der drei Listen gleich. */
  function liste(entries: Entry[], leer: React.ReactNode) {
    const aktiv = entries.filter(e => !e.deactivatedAt)
    const beendet = entries.filter(e => e.deactivatedAt)
    if (entries.length === 0) return leer
    return (
      <div className="flex flex-col gap-2">
        {aktiv.map(zeile)}
        {beendet.length > 0 && (
          <>
            <p className="mt-2 text-sm font-bold text-ink-soft">
              Beendete Zugänge
              <span className="ml-2 font-normal text-ink-muted">
                keine Anmeldung — Daten und Nachweise bleiben erhalten
              </span>
            </p>
            {beendet.map(zeile)}
          </>
        )}
      </div>
    )
  }

  const aktiveMaids = maidEntries.filter(e => !e.deactivatedAt).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">Personal — Reinigungskräfte</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
          {aktiveMaids} {aktiveMaids === 1 ? 'Kraft' : 'Kräfte'}
        </span>
      </div>

      {canManage && (
        <p className="text-xs text-ink-muted">
          Für alle Zugänge gilt dasselbe:{' '}
          <strong className="font-semibold text-ink-soft">Bearbeiten</strong> korrigiert den Namen,{' '}
          <strong className="font-semibold text-ink-soft">Zugang beenden</strong> sperrt die
          Anmeldung und lässt sich zurücknehmen,{' '}
          <strong className="font-semibold text-ink-soft">Löschen</strong> entfernt die Person —
          mit Anzeige dessen, was dabei verloren geht.
        </p>
      )}

      {/* Anlegen — nur Verwaltung */}
      {canManage && (
        <form
          onSubmit={e => { e.preventDefault(); runCreate(e.currentTarget) }}
          className="rounded-xl border border-edge bg-surface p-4"
        >
          <h2 className="mb-3 text-sm font-bold text-ink-soft">Neue Reinigungskraft anlegen</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              Anzeigename
              <input
                name="displayName"
                required
                minLength={2}
                placeholder="z. B. Maria K."
                className={`${panelInput} w-48`}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              Benutzername (Login)
              <input
                name="username"
                required
                minLength={2}
                autoCapitalize="none"
                placeholder="z. B. maria"
                pattern="[a-zA-Z0-9._\-]+"
                title="Nur Buchstaben, Ziffern, Punkt, Unterstrich, Bindestrich"
                className={`${panelInput} w-40`}
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Anlegen
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            PIN (6 Ziffern) und QR-Login-Karte werden automatisch erzeugt — danach über
            &bdquo;Karte drucken&ldquo; aushändigen.
          </p>
        </form>
      )}

      {error && (
        <p className="rounded-lg border border-critical-tint-edge bg-critical-tint px-3 py-2 text-sm font-semibold text-critical-strong">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-positive-pill-edge bg-positive-tint px-3 py-2 text-sm font-semibold text-positive-deep">
          {notice}
        </p>
      )}

      {/* Testbetrieb: Zugangsdaten genau einmal. Danach führt nur noch
          „Passwort vergessen" zu diesem Konto — bewusst, damit das Passwort
          nirgends dauerhaft ablesbar herumsteht. */}
      {zugang && (
        <div className="rounded-xl border border-attention-tint-edge bg-attention-tint p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-attention-deepest">
            <KeyRound className="h-4 w-4" /> Testzugang für {zugang.displayName} angelegt
          </p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-semibold text-attention-deepest">E-Mail</dt>
            <dd className="font-mono text-attention-deepest">{zugang.email}</dd>
            <dt className="font-semibold text-attention-deepest">Passwort</dt>
            <dd className="font-mono text-lg font-black text-attention-deepest">{zugang.password}</dd>
          </dl>
          <p className="mt-3 text-xs text-attention-deepest">
            Jetzt notieren — das Passwort steht <strong>nur hier</strong> und lässt sich später
            nicht mehr anzeigen. Es wurde keine E-Mail verschickt.
          </p>
          <button
            type="button"
            onClick={() => setZugang(null)}
            className="mt-3 rounded-lg border border-attention-tint-edge px-3 py-1.5 text-sm font-bold text-attention-deepest hover:bg-surface"
          >
            Notiert — ausblenden
          </button>
        </div>
      )}

      {liste(
        maidEntries,
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <UserRound className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
          <p className="font-semibold text-ink">Noch keine Reinigungskräfte angelegt.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Jede Kraft bekommt einen eigenen Zugang mit PIN und QR-Login-Karte fürs Reinigungsboard.
          </p>
        </div>,
      )}

      {/* Rezeptions-Zugänge — nur Verwaltung */}
      {canManage && (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-ink">Personal — Rezeption</h2>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
              {recEntries.filter(e => !e.deactivatedAt).length}{' '}
              {recEntries.filter(e => !e.deactivatedAt).length === 1 ? 'Zugang' : 'Zugänge'}
            </span>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); runCreateReception(e.currentTarget) }}
            className="rounded-xl border border-edge bg-surface p-4"
          >
            <h3 className="mb-3 text-sm font-bold text-ink-soft">Neuen Rezeptions-Zugang anlegen</h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                Anzeigename
                <input
                  name="displayName"
                  required
                  minLength={2}
                  placeholder="z. B. Front Desk Früh"
                  className={`${panelInput} w-48`}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                E-Mail (Login)
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="z. B. rezeption@meinhotel.de"
                  className={`${panelInput} w-64`}
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Anlegen
              </button>
            </div>
            {testHaken}
            <p className="mt-2 text-xs text-ink-muted">
              Rezeptions-Zugänge bedienen das Tagesgeschäft (Check-in/-out, Bestellungen,
              Drucken) — Einstellungen, Zimmer-Setup und Services bleiben der Verwaltung
              vorbehalten. Die Person bekommt eine Einladung per E-Mail und vergibt ihr Passwort
              selbst.
            </p>
          </form>

          {recEinladung && (
            <div className="rounded-xl border border-positive-pill-edge bg-positive-tint p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-positive-deep">
                <MailCheck className="h-4 w-4" /> Einladung an {recEinladung.displayName} verschickt
              </p>
              <p className="mt-1 font-mono text-sm text-positive-deep">{recEinladung.email}</p>
              <p className="mt-2 text-xs text-positive-deep">
                Sobald die Einladung angenommen ist, verschwindet der Hinweis
                &bdquo;Einladung offen&ldquo; aus der Liste.
              </p>
            </div>
          )}

          {liste(
            recEntries,
            <p className="text-sm text-ink-muted">Noch keine Rezeptions-Zugänge angelegt.</p>,
          )}
        </>
      )}

      {/* Manager — nur der Kontoinhaber. Hausbezogen wie Rezeption und
          Reinigung: hier stehen die Manager DIESES Hauses. Wer jemanden über
          mehrere Häuser einsetzt, trägt ihn im jeweiligen Haus ein — beim
          zweiten Mal ohne neuen Zugang über die Auswahl. */}
      {isOwner && (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-ink">Personal — Manager</h2>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
              {mgrEntries.filter(e => !e.deactivatedAt).length}{' '}
              {mgrEntries.filter(e => !e.deactivatedAt).length === 1 ? 'Zugang' : 'Zugänge'}
            </span>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); runCreateManager(e.currentTarget) }}
            className="rounded-xl border border-edge bg-surface p-4"
          >
            <h3 className="mb-3 text-sm font-bold text-ink-soft">Neuen Manager anlegen</h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                Anzeigename
                <input
                  name="displayName"
                  required
                  minLength={2}
                  placeholder="z. B. Nina Berg"
                  className={`${panelInput} w-48`}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                E-Mail (Login)
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="z. B. nina@meinhotel.de"
                  className={`${panelInput} w-64`}
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Anlegen
              </button>
            </div>
            {testHaken}
            <p className="mt-2 text-xs text-ink-muted">
              Manager haben im Haus dieselben Rechte wie der Inhaber — ohne Zugriff auf das Konto.
              Die Person bekommt eine Einladung per E-Mail und vergibt ihr Passwort selbst.
            </p>
          </form>

          {verfuegbareManager.length > 0 && (
            <form
              onSubmit={e => { e.preventDefault(); runAttachManager(e.currentTarget) }}
              className="rounded-xl border border-edge bg-surface p-4"
            >
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-soft">
                <Building2 className="h-4 w-4" /> Vorhandenen Manager hinzufügen
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                  Manager des Kontos
                  <select name="userId" className={`${panelInput} w-64`} defaultValue="">
                    <option value="" disabled>Bitte wählen …</option>
                    {verfuegbareManager.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} ({m.email})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Hinzufügen
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Kein neuer Zugang — dieselbe Person betreut dann ein Haus mehr.
              </p>
            </form>
          )}

          {mgrEinladung && (
            <div className="rounded-xl border border-positive-pill-edge bg-positive-tint p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-positive-deep">
                <MailCheck className="h-4 w-4" /> Einladung an {mgrEinladung.displayName} verschickt
              </p>
              <p className="mt-1 font-mono text-sm text-positive-deep">{mgrEinladung.email}</p>
            </div>
          )}

          {liste(
            mgrEntries,
            <p className="text-sm text-ink-muted">Für dieses Haus ist noch kein Manager eingetragen.</p>,
          )}
        </>
      )}
    </div>
  )
}

/**
 * Bearbeiten für alle drei Personal-Arten. Der Benutzername erscheint nur, wo
 * es einen gibt (Reinigung) — Rezeption und Manager melden sich per E-Mail an.
 */
function StaffEditPanel({
  displayName, username, pending, hint, onSave, onCancel,
}: {
  displayName: string
  username?: string
  pending: boolean
  hint?: string
  onSave: (patch: { displayName: string; username?: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(displayName)
  const [user, setUser] = useState(username ?? '')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSave(username === undefined ? { displayName: name } : { displayName: name, username: user })
      }}
      className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Anzeigename
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={2}
            className={`${panelInput} w-48`}
          />
        </label>
        {username !== undefined && (
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
            Benutzername (Login)
            <input
              value={user}
              onChange={e => setUser(e.target.value)}
              required
              minLength={2}
              autoCapitalize="none"
              pattern="[a-zA-Z0-9._\-]+"
              title="Nur Buchstaben, Ziffern, Punkt, Unterstrich, Bindestrich"
              className={`${panelInput} w-40 font-mono`}
            />
          </label>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? 'Speichern …' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft"
        >
          Abbrechen
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-ink-muted">{hint}</p>}
      {username !== undefined && user !== username && (
        <p className="mt-2 rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-xs font-semibold text-attention-deepest">
          Der QR-Code der Karte bleibt gültig, die PIN ebenfalls. Auf der
          <strong> gedruckten</strong> Karte steht aber noch der alte Benutzername —
          für die Anmeldung von Hand also neu drucken.
        </p>
      )}
    </form>
  )
}

/**
 * Löschen mit Zahlen statt mit einem Warnsatz — für alle drei Arten dieselbe
 * Darstellung. Der Unterschied steckt nur in der Sache: bei der Reinigung
 * kaskadiert `staff_log`, der Arbeitsnachweis verschwindet also wirklich. Beim
 * Management bleibt das Anmeldekonto stehen, sobald Vorgänge daran hängen —
 * bisher entschied die Anwendung das still, jetzt steht es vorher da.
 */
function StaffDeletePanel({
  impact, confirmInput, setConfirmInput, pending, onDelete, onCancel, onEnd,
}: {
  impact: StaffDeletionImpact
  confirmInput: string
  setConfirmInput: (v: string) => void
  pending: boolean
  onDelete: () => void
  onCancel: () => void
  /** Nur solange der Zugang noch aktiv ist — der schonende Ausweg. */
  onEnd?: () => void
}) {
  const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE')
  const zeitraum =
    impact.firstAt && impact.lastAt
      ? impact.firstAt === impact.lastAt
        ? ` (${datum(impact.firstAt)})`
        : ` (${datum(impact.firstAt)} bis ${datum(impact.lastAt)})`
      : ''

  const bleibt: string[] = []
  if (impact.checkIns > 0) bleibt.push(`${impact.checkIns} Check-ins`)
  if (impact.ordersDone > 0) bleibt.push(`${impact.ordersDone} erledigte Service-Anfragen`)
  if (impact.kind !== 'maid' && impact.logEntries > 0) {
    bleibt.push(`${impact.logEntries} Einträge im Tätigkeits-Protokoll`)
  }

  return (
    <div className="mt-3 rounded-lg border border-critical-tint-edge bg-critical-tint p-3">
      {impact.cleaningRoom ? (
        <p className="text-sm font-semibold text-critical-strong">
          {impact.displayName} reinigt gerade Zimmer {impact.cleaningRoom} und lässt sich nicht
          löschen — erst die Reinigung abschließen.
        </p>
      ) : impact.kind === 'maid' ? (
        impact.logEntries === 0 ? (
          <p className="text-sm font-semibold text-ink">
            {impact.displayName} hat noch keinen einzigen Eintrag im Tätigkeits-Protokoll —
            beim Löschen geht nichts verloren.
          </p>
        ) : (
          <>
            <p className="text-sm font-bold text-critical-strong">Das wird endgültig mitgelöscht:</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink-soft">
              <li>
                {impact.logEntries} Einträge im Tätigkeits-Protokoll{zeitraum} — Schichten, Pausen
                und Reinigungen verschwinden damit aus der Auswertung
              </li>
              {impact.cleanings > 0 && <li>{impact.cleanings} abgeschlossene Zimmerreinigungen</li>}
              {impact.hasCard && <li>die Login-Karte (gedruckte Karte wird ungültig)</li>}
            </ul>
          </>
        )
      ) : (
        <>
          <p className="text-sm font-semibold text-ink">
            {impact.displayName} aus diesem Haus entfernen? Der Zugriff endet sofort.
            {impact.otherHotels > 0
              ? ` ${uebrigeHaeuser(impact.otherHotels).replace(/^./, c => c.toUpperCase())} unberührt.`
              : ''}
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            {impact.accountKept
              ? 'Das Anmeldekonto bleibt bestehen — daran hängen Vorgänge, die sonst ihre Zuordnung verlören.'
              : 'An diesem Zugang hängt nichts, das Anmeldekonto wird deshalb vollständig gelöscht.'}
          </p>
        </>
      )}

      {bleibt.length > 0 && !impact.cleaningRoom && (
        <p className="mt-2 text-xs text-ink-muted">
          {bleibt.join(' und ')} <strong>bleiben erhalten</strong>
          {impact.kind === 'maid' ? ' — sie verlieren nur den Namen.' : '.'}
        </p>
      )}

      {!impact.cleaningRoom && (
        <>
          {impact.requiresPhrase && (
            <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              Zum Bestätigen &bdquo;{impact.confirmPhrase}&ldquo; eingeben
              <input
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                autoComplete="off"
                className={`${panelInput} w-48 font-mono`}
              />
            </label>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || (impact.requiresPhrase && confirmInput.trim() !== impact.confirmPhrase)}
              onClick={onDelete}
              className="rounded-lg bg-critical px-3 py-1.5 text-sm font-bold text-critical-foreground disabled:opacity-50"
            >
              {pending ? 'Löschen …' : 'Ja, endgültig löschen'}
            </button>
            {onEnd && impact.requiresPhrase && (
              <button
                type="button"
                disabled={pending}
                onClick={onEnd}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
              >
                Lieber Zugang beenden — Arbeitsnachweis bleibt
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
            >
              Abbrechen
            </button>
          </div>
        </>
      )}
      {impact.cleaningRoom && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
        >
          Schließen
        </button>
      )}
    </div>
  )
}
