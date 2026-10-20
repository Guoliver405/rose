'use client'

import { siteUrl } from '@/lib/site'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2, IdCard, KeyRound, Link2, Loader2, MailCheck, Pencil, Plus, Printer, RotateCw, Send, Sparkles, Trash2,
  UserCheck,
  UserMinus, UserRound,
} from 'lucide-react'
import {
  attachManagerAction, createMaidAction, createManagerAction, createReceptionAction,
  deleteStaffAction, getStaffDeletionImpactAction, issueMaidLoginCardAction, renameStaffAction,
  inviteLinkAction, resendInvitationAction, setStaffActiveAction,
  type Einladung, type StaffDeletionImpact, type StaffKind, type Zugangsdaten,
} from './actions'
import {
  auswegButton, beginFrom, InviteLinkBox, MailStatusLine, sendLabel, useMailDispatch, type MailDispatch,
} from '@/components/mail/MailDispatch'
import Rich from '@/components/i18n/Rich'
import { format, plural } from '@/lib/i18n/format'
import type { AdminMessages } from '@/lib/i18n'

type Msg = AdminMessages['staff']['personal']
type Common = AdminMessages['common']

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

/**
 * Eine Zeile, egal welcher Personal-Art — die gemeinsame Grundlage des
 * einheitlichen Modells. Drei parallel gepflegte Listen waren genau der Grund,
 * warum die drei Arten vorher auseinandergelaufen sind.
 */
type Entry = {
  id: string
  kind: StaffKind
  displayName: string
  /** Zweite Zeile: „Benutzername: …" (Reinigung) oder E-Mail. */
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
  m,
  c,
  intlLocale,
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
  m: Msg
  c: Common
  intlLocale: string
}) {
  const n = m.notices
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [recEinladung, setRecEinladung] = useState<Einladung | null>(null)
  const [mgrEinladung, setMgrEinladung] = useState<Einladung | null>(null)
  /**
   * Countdown und Zustellstatus je Sendestelle (12.09.2026). Drei Instanzen,
   * damit das Formular „Rezeption" nicht den Knopf „Erneut senden" in der
   * Liste sperrt. Für „Erneut senden" merkt `resendTarget`, an welcher Zeile
   * die Statuszeile erscheint — vorher stand die Meldung ganz oben über der
   * Reinigungsliste, während der Knopf weit unten sitzt; wer dort klickte, sah
   * keine Reaktion und hielt den Versand für ignoriert.
   */
  const recMail = useMailDispatch()
  const mgrMail = useMailDispatch()
  const resendMail = useMailDispatch()
  const [resendTarget, setResendTarget] = useState<string | null>(null)
  /** Angezeigter Einladungslink (Ausweg ohne Mail), je Zugang. */
  const [inviteLink, setInviteLink] = useState<{ userId: string; url: string } | null>(null)
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

  const maidEntries: Entry[] = maids.map(x => ({
    id: x.id, kind: 'maid', displayName: x.displayName, sub: format(m.usernameSub, { username: x.username }),
    deactivatedAt: x.deactivatedAt, username: x.username, pin: x.pin, cleaningRoom: x.cleaningRoom,
  }))
  const recEntries: Entry[] = receptionists.map(r => ({
    id: r.id, kind: 'reception', displayName: r.displayName, sub: r.email,
    deactivatedAt: r.deactivatedAt, pending: r.pending,
  }))
  const mgrEntries: Entry[] = managers.map(x => ({
    id: x.id, kind: 'manager', displayName: x.displayName, sub: x.email,
    deactivatedAt: x.deactivatedAt, pending: x.pending, hotelCount: x.hotelCount,
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
          format(e.kind === 'maid' ? n.reactivatedMaid : n.reactivated, { name: e.displayName }),
        )
      } else {
        const rest = res.otherHotels ?? 0
        setNotice(
          e.kind === 'manager' && rest > 0
            ? plural(intlLocale, rest, n.endedHere, { name: e.displayName })
            : format(n.ended, { name: e.displayName }),
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
      if (!res.impact) { setError(res.error ?? n.loadFailed); return }
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
      setNotice(format(
        res.accountKept
          ? (res.otherHotels ?? 0) > 0 ? n.deletedAccountKeptOther : n.deletedAccountKept
          : kind === 'maid'
            ? n.deletedMaid
            : n.deletedAccount,
        { name },
      ))
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
          ? format(n.renamedWithUsername, { name: patch.displayName, username: patch.username })
          : format(n.renamed, { name: patch.displayName }),
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
      setNotice(format(n.created, { name: res.card!.displayName }))
      router.refresh()
    })
  }

  function runIssueCard(profileId: string, name: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await issueMaidLoginCardAction(hotelSlug, profileId)
      if (res.error) { setError(res.error); return }
      setNotice(format(n.cardIssued, { name }))
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
      if (res.einladung) recMail.begin(beginFrom(res.einladung.mail, res.einladung.email))
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
      if (res.einladung) mgrMail.begin(beginFrom(res.einladung.mail, res.einladung.email))
      setZugang(res.zugang ?? null)
      router.refresh()
    })
  }

  function runAttachManager(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    setMgrEinladung(null)
    const userId = String(new FormData(form).get('userId') ?? '')
    if (!userId) { setError(n.chooseManager); return }
    startTransition(async () => {
      const res = await attachManagerAction(hotelSlug, userId)
      if (res.error) { setError(res.error); return }
      form.reset()
      setNotice(n.managerAttached)
      router.refresh()
    })
  }

  /**
   * Einladung erneut schicken — für Zugänge, die noch offen sind. Meldung
   * und Status erscheinen AN DER ZEILE, nicht im Banner oben.
   */
  function runResend(userId: string, opts: { release?: boolean; into?: MailDispatch } = {}) {
    setError(null)
    setNotice(null)
    setInviteLink(null)
    const ziel = opts.into ?? resendMail
    if (!opts.into) setResendTarget(userId)
    startTransition(async () => {
      const res = await resendInvitationAction(hotelSlug, userId, { release: opts.release })
      ziel.begin(res.mail ? beginFrom(res.mail, res.email) : { error: res.error, recipient: res.email })
    })
  }

  /** Einladungslink anzeigen — der Ausweg, wenn keine Mail ankommt. */
  function runInviteLink(userId: string) {
    setError(null)
    startTransition(async () => {
      const res = await inviteLinkAction(hotelSlug, userId)
      if (res.error || !res.url) { setError(res.error ?? n.linkFailed); return }
      setInviteLink({ userId, url: res.url })
    })
  }

  /**
   * Die Auswege unter einer Statuszeile: freigeben und erneut senden, Link
   * anzeigen. Erscheinen nur, wenn die Mail nachweislich nicht ankam oder
   * gar nicht gesendet wurde.
   */
  function auswege(userId: string, mail: MailDispatch) {
    if (!mail.failed) return null
    const kannFreigeben = mail.run?.blocked?.canRelease !== false
    return (
      <>
        {kannFreigeben && (
          <button
            type="button"
            disabled={pending || mail.remaining > 0}
            onClick={() => runResend(userId, { release: true, into: mail })}
            className={`${auswegButton} text-critical-strong`}
          >
            <RotateCw className="h-3.5 w-3.5" /> {m.releaseAndResend}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => runInviteLink(userId)}
          className={`${auswegButton} text-critical-strong`}
        >
          <Link2 className="h-3.5 w-3.5" /> {m.showInviteLink}
        </button>
      </>
    )
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
        {m.testNoMail}
        <span className="mt-0.5 block font-normal">
          <Rich text={m.testNoMailHint} tags={{ code: t => <code className="font-mono">{t}</code> }} />
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
  function zeile(e: Entry, i = 0) {
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
              {format(m.endedSince, { date: new Date(e.deactivatedAt!).toLocaleDateString(intlLocale) })}
            </span>
          )}
          {!beendet && e.cleaningRoom && (
            <span className="flex items-center gap-1 rounded-full bg-positive-pill px-3 py-1 text-xs font-semibold text-positive-deepest">
              <Sparkles className="h-3.5 w-3.5" /> {format(m.cleaningRoom, { room: e.cleaningRoom })}
            </span>
          )}
          {!beendet && (e.hotelCount ?? 0) > 1 && (
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              {plural(intlLocale, e.hotelCount ?? 0, m.hotelCount)}
            </span>
          )}
          {!beendet && e.pending && (
            <>
              <span className="rounded-full bg-attention-pill px-2.5 py-0.5 text-xs font-semibold text-attention-deepest">
                {m.invitePending}
              </span>
              {canManage && (
                <button
                  type="button"
                  disabled={pending || resendMail.remaining > 0}
                  onClick={() => runResend(e.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {resendTarget === e.id ? sendLabel(m.resend, resendMail) : m.resend}
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
                  title={m.currentPin}
                >
                  {e.pin}
                </span>
              ) : (
                <span className="text-xs text-ink-muted">{m.noCard}</span>
              )
            )}
            {e.kind === 'maid' && !beendet && e.pin && (
              <Link
                href={`/h/${hotelSlug}/admin/personal/karte/${e.id}`}
                data-lotse={i === 0 ? 'aushang.login' : undefined}
                className={flachButton}
              >
                <Printer className="h-4 w-4" /> {m.printCard}
              </Link>
            )}
            {e.kind === 'maid' && !beendet && canManage && (
              <button
                type="button"
                disabled={pending}
                onClick={() => runIssueCard(e.id, e.displayName)}
                title={m.newCardTitle}
                className={flachButton}
              >
                <IdCard className="h-4 w-4" /> {m.newCard}
              </button>
            )}

            {/* Für alle drei Arten identisch */}
            {canManage && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => { closePanels(); setEditId(editId === e.id ? null : e.id) }}
                  title={e.kind === 'maid' ? m.editTitleMaid : m.editTitle}
                  className={flachButton}
                >
                  <Pencil className="h-4 w-4" /> {c.edit}
                </button>

                {beendet ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runSetActive(e, true)}
                    className={flachButton}
                  >
                    <UserCheck className="h-4 w-4" /> {m.reactivate}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => { closePanels(); setEndId(e.id) }}
                    title={m.endAccessTitle}
                    className={flachButton}
                  >
                    <UserMinus className="h-4 w-4" /> {m.endAccess}
                  </button>
                )}

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openDelete(e)}
                  className="rounded-lg border border-critical-pill-edge p-1.5 text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                  aria-label={format(m.deleteAria, { name: e.displayName })}
                  title={m.deleteTitle}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {resendTarget === e.id && (
          <MailStatusLine mail={resendMail} className="mt-3">{auswege(e.id, resendMail)}</MailStatusLine>
        )}
        {/* Der Link steht an der Zeile — außer der Einladungskasten oben zeigt ihn schon. */}
        {inviteLink?.userId === e.id && recEinladung?.userId !== e.id && mgrEinladung?.userId !== e.id && (
          <InviteLinkBox url={inviteLink.url} onClose={() => setInviteLink(null)} />
        )}

        {editId === e.id && (
          <StaffEditPanel
            displayName={e.displayName}
            username={e.kind === 'maid' ? e.username : undefined}
            pending={pending}
            hint={e.kind === 'manager' && (e.hotelCount ?? 0) > 1
              ? format(m.editHintManager, { count: e.hotelCount ?? 0 })
              : undefined}
            m={m}
            c={c}
            onCancel={() => setEditId(null)}
            onSave={patch => runRename(e.id, patch)}
          />
        )}

        {endId === e.id && (
          <div className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3">
            <p className="text-sm font-semibold text-ink">
              {format(e.kind === 'maid' ? m.endConfirmMaid : m.endConfirm, { name: e.displayName })}
              {e.kind === 'manager' && (e.hotelCount ?? 0) > 1
                ? ` ${plural(intlLocale, (e.hotelCount ?? 1) - 1, m.otherHotelsUntouched)}`
                : ''}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => runSetActive(e, false)}
                className="rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground disabled:opacity-50"
              >
                {pending ? m.ending : m.confirmEnd}
              </button>
              <button
                type="button"
                onClick={() => setEndId(null)}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
              >
                {c.cancel}
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
            m={m}
            c={c}
            intlLocale={intlLocale}
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
              {m.endedHeading}
              <span className="ml-2 font-normal text-ink-muted">
                {m.endedHint}
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
        <h1 className="text-xl font-black text-ink">{m.headingMaids}</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
          {plural(intlLocale, aktiveMaids, m.maidCount)}
        </span>
      </div>

      {canManage && (
        <p data-lotse="personal.liste" className="text-xs text-ink-muted">
          <Rich text={m.intro} tags={{ b: t => <strong className="font-semibold text-ink-soft">{t}</strong> }} />
        </p>
      )}

      {/* Anlegen — nur Verwaltung */}
      {canManage && (
        <form
          data-lotse="personal.reinigung"
          onSubmit={e => { e.preventDefault(); runCreate(e.currentTarget) }}
          className="rounded-xl border border-edge bg-surface p-4"
        >
          <h2 className="mb-3 text-sm font-bold text-ink-soft">{m.createMaid}</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              {m.displayName}
              <input
                name="displayName"
                required
                minLength={2}
                placeholder={m.maidNamePlaceholder}
                className={`${panelInput} w-48`}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              {m.username}
              <input
                name="username"
                required
                minLength={2}
                autoCapitalize="none"
                placeholder={m.usernamePlaceholder}
                pattern="[a-zA-Z0-9._\-]+"
                title={m.usernamePatternTitle}
                className={`${panelInput} w-40`}
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {m.create}
            </button>
          </div>
          <p data-lotse="personal.karte" className="mt-2 text-xs text-ink-muted">
            <Rich text={m.maidHint} />
          </p>
          <p className="mt-1 [overflow-wrap:anywhere] text-xs text-ink-muted">
            {format(m.maidLogin, { url: `${siteUrl()}/h/${hotelSlug}/service/login` })}
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
            <KeyRound className="h-4 w-4" /> {format(m.testAccessCreated, { name: zugang.displayName })}
          </p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-semibold text-attention-deepest">{m.emailLabel}</dt>
            <dd className="font-mono text-attention-deepest">{zugang.email}</dd>
            <dt className="font-semibold text-attention-deepest">{m.passwordLabel}</dt>
            <dd className="font-mono text-lg font-black text-attention-deepest">{zugang.password}</dd>
          </dl>
          <p className="mt-3 text-xs text-attention-deepest">
            <Rich text={m.testAccessNote} />
          </p>
          <button
            type="button"
            onClick={() => setZugang(null)}
            className="mt-3 rounded-lg border border-attention-tint-edge px-3 py-1.5 text-sm font-bold text-attention-deepest hover:bg-surface"
          >
            {m.testAccessDismiss}
          </button>
        </div>
      )}

      {liste(
        maidEntries,
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <UserRound className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
          <p className="font-semibold text-ink">{m.emptyMaids}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {m.emptyMaidsHint}
          </p>
        </div>,
      )}

      {/* Rezeptions-Zugänge — nur Verwaltung */}
      {canManage && (
        <>
          <div data-lotse="personal.rezeption" className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-ink">{m.headingReception}</h2>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
              {plural(intlLocale, recEntries.filter(e => !e.deactivatedAt).length, m.accessCount)}
            </span>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); runCreateReception(e.currentTarget) }}
            className="rounded-xl border border-edge bg-surface p-4"
          >
            <h3 className="mb-3 text-sm font-bold text-ink-soft">{m.createReception}</h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                {m.displayName}
                <input
                  name="displayName"
                  required
                  minLength={2}
                  placeholder={m.receptionNamePlaceholder}
                  className={`${panelInput} w-48`}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                {m.email}
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={m.receptionEmailPlaceholder}
                  className={`${panelInput} w-64`}
                />
              </label>
              <button
                type="submit"
                disabled={pending || recMail.remaining > 0}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {sendLabel(m.create, recMail)}
              </button>
            </div>
            {testHaken}
            <p className="mt-2 text-xs text-ink-muted">
              {m.receptionHint}
            </p>
          </form>

          {recEinladung && (
            <div className="rounded-xl border border-edge bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <MailCheck className="h-4 w-4" /> {format(m.accessCreated, { name: recEinladung.displayName })}
              </p>
              <MailStatusLine mail={recMail} className="mt-2">{auswege(recEinladung.userId, recMail)}</MailStatusLine>
              {inviteLink?.userId === recEinladung.userId && (
                <InviteLinkBox url={inviteLink.url} onClose={() => setInviteLink(null)} />
              )}
              <p className="mt-2 text-xs text-ink-muted">
                {m.receptionInviteHint}
              </p>
            </div>
          )}

          {liste(
            recEntries,
            <p className="text-sm text-ink-muted">{m.emptyReception}</p>,
          )}
        </>
      )}

      {/* Manager — nur der Kontoinhaber. Hausbezogen wie Rezeption und
          Reinigung: hier stehen die Manager DIESES Hauses. Wer jemanden über
          mehrere Häuser einsetzt, trägt ihn im jeweiligen Haus ein — beim
          zweiten Mal ohne neuen Zugang über die Auswahl. */}
      {isOwner && (
        <>
          <div data-lotse="personal.manager" className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-ink">{m.headingManagers}</h2>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
              {plural(intlLocale, mgrEntries.filter(e => !e.deactivatedAt).length, m.accessCount)}
            </span>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); runCreateManager(e.currentTarget) }}
            className="rounded-xl border border-edge bg-surface p-4"
          >
            <h3 className="mb-3 text-sm font-bold text-ink-soft">{m.createManager}</h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                {m.displayName}
                <input
                  name="displayName"
                  required
                  minLength={2}
                  placeholder={m.managerNamePlaceholder}
                  className={`${panelInput} w-48`}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                {m.email}
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={m.managerEmailPlaceholder}
                  className={`${panelInput} w-64`}
                />
              </label>
              <button
                type="submit"
                disabled={pending || mgrMail.remaining > 0}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {sendLabel(m.create, mgrMail)}
              </button>
            </div>
            {testHaken}
            <p className="mt-2 text-xs text-ink-muted">
              {m.managerHint}
            </p>
          </form>

          {verfuegbareManager.length > 0 && (
            <form
              onSubmit={e => { e.preventDefault(); runAttachManager(e.currentTarget) }}
              className="rounded-xl border border-edge bg-surface p-4"
            >
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-soft">
                <Building2 className="h-4 w-4" /> {m.attachTitle}
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                  {m.attachLabel}
                  <select name="userId" className={`${panelInput} w-64`} defaultValue="">
                    <option value="" disabled>{m.attachChoose}</option>
                    {verfuegbareManager.map(x => (
                      <option key={x.id} value={x.id}>
                        {format(m.attachOption, { name: x.displayName, email: x.email })}
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
                  {m.attach}
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {m.attachHint}
              </p>
            </form>
          )}

          {mgrEinladung && (
            <div className="rounded-xl border border-edge bg-surface p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <MailCheck className="h-4 w-4" /> {format(m.accessCreated, { name: mgrEinladung.displayName })}
              </p>
              <MailStatusLine mail={mgrMail} className="mt-2">{auswege(mgrEinladung.userId, mgrMail)}</MailStatusLine>
              {inviteLink?.userId === mgrEinladung.userId && (
                <InviteLinkBox url={inviteLink.url} onClose={() => setInviteLink(null)} />
              )}
              <p className="mt-2 text-xs text-ink-muted">
                {m.managerInviteHint}
              </p>
            </div>
          )}

          {liste(
            mgrEntries,
            <p className="text-sm text-ink-muted">{m.emptyManagers}</p>,
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
  displayName, username, pending, hint, onSave, onCancel, m, c,
}: {
  displayName: string
  username?: string
  pending: boolean
  hint?: string
  m: Msg
  c: Common
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
          {m.displayName}
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
            {m.username}
            <input
              value={user}
              onChange={e => setUser(e.target.value)}
              required
              minLength={2}
              autoCapitalize="none"
              pattern="[a-zA-Z0-9._\-]+"
              title={m.usernamePatternTitle}
              className={`${panelInput} w-40 font-mono`}
            />
          </label>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
        >
          {pending ? c.saving : c.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-edge px-3 py-2 text-sm font-semibold text-ink-soft"
        >
          {c.cancel}
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-ink-muted">{hint}</p>}
      {username !== undefined && user !== username && (
        <p className="mt-2 rounded-lg border border-attention-tint-edge bg-attention-tint px-3 py-2 text-xs font-semibold text-attention-deepest">
          <Rich text={m.usernameChangedHint} />
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
  impact, confirmInput, setConfirmInput, pending, onDelete, onCancel, onEnd, m, c, intlLocale,
}: {
  impact: StaffDeletionImpact
  confirmInput: string
  setConfirmInput: (v: string) => void
  pending: boolean
  onDelete: () => void
  onCancel: () => void
  /** Nur solange der Zugang noch aktiv ist — der schonende Ausweg. */
  onEnd?: () => void
  m: Msg
  c: Common
  intlLocale: string
}) {
  const d = m.deletePanel
  const datum = (iso: string) => new Date(iso).toLocaleDateString(intlLocale)
  const zeitraum =
    impact.firstAt && impact.lastAt
      ? impact.firstAt === impact.lastAt
        ? format(d.periodOne, { date: datum(impact.firstAt) })
        : format(d.periodRange, { from: datum(impact.firstAt), to: datum(impact.lastAt) })
      : ''

  const bleibt: string[] = []
  if (impact.checkIns > 0) bleibt.push(plural(intlLocale, impact.checkIns, d.checkIns))
  if (impact.ordersDone > 0) bleibt.push(plural(intlLocale, impact.ordersDone, d.ordersDone))
  if (impact.kind !== 'maid' && impact.logEntries > 0) {
    bleibt.push(plural(intlLocale, impact.logEntries, d.logEntries))
  }

  return (
    <div className="mt-3 rounded-lg border border-critical-tint-edge bg-critical-tint p-3">
      {impact.cleaningRoom ? (
        <p className="text-sm font-semibold text-critical-strong">
          {format(d.cleaningNow, { name: impact.displayName, room: impact.cleaningRoom })}
        </p>
      ) : impact.kind === 'maid' ? (
        impact.logEntries === 0 ? (
          <p className="text-sm font-semibold text-ink">
            {format(d.nothingLost, { name: impact.displayName })}
          </p>
        ) : (
          <>
            <p className="text-sm font-bold text-critical-strong">{d.willBeDeleted}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink-soft">
              <li>{plural(intlLocale, impact.logEntries, d.logEntriesLost, { period: zeitraum })}</li>
              {impact.cleanings > 0 && <li>{plural(intlLocale, impact.cleanings, d.cleaningsLost)}</li>}
              {impact.hasCard && <li>{d.cardLost}</li>}
            </ul>
          </>
        )
      ) : (
        <>
          <p className="text-sm font-semibold text-ink">
            {format(d.removeFromHouse, { name: impact.displayName })}
            {impact.otherHotels > 0
              ? ` ${plural(intlLocale, impact.otherHotels, m.otherHotelsUntouched)}`
              : ''}
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            {impact.accountKept
              ? d.accountKept
              : d.accountDeleted}
          </p>
        </>
      )}

      {bleibt.length > 0 && !impact.cleaningRoom && (
        <p className="mt-2 text-xs text-ink-muted">
          <Rich
            text={impact.kind === 'maid' ? d.keptMaid : d.kept}
            vars={{ list: new Intl.ListFormat(intlLocale, { type: 'conjunction' }).format(bleibt) }}
          />
        </p>
      )}

      {!impact.cleaningRoom && (
        <>
          {impact.requiresPhrase && (
            <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              {format(d.confirmPrompt, { phrase: impact.confirmPhrase })}
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
              {pending ? d.deleting : d.confirmDelete}
            </button>
            {onEnd && impact.requiresPhrase && (
              <button
                type="button"
                disabled={pending}
                onClick={onEnd}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
              >
                {d.endInstead}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
            >
              {c.cancel}
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
          {c.close}
        </button>
      )}
    </div>
  )
}
