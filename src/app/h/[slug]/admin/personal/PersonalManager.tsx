'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2, IdCard, Loader2, MailCheck, Pencil, Plus, Printer, Send, Sparkles, Trash2, UserCheck,
  UserMinus, UserRound,
} from 'lucide-react'
import {
  attachManagerAction, createMaidAction, createManagerAction, createReceptionAction,
  deleteMaidAction, deleteReceptionAction, detachManagerAction, getMaidDeletionImpactAction,
  issueMaidLoginCardAction, renameStaffAction, resendInvitationAction, setMaidActiveAction,
  type Einladung, type MaidDeletionImpact,
} from './actions'

export type MaidRow = {
  id: string
  displayName: string
  username: string
  pin: string | null
  cleaningRoom: string | null
  /** gesetzt = ausgeschieden: kein Login, Historie bleibt erhalten */
  deactivatedAt: string | null
}

export type ReceptionRow = {
  id: string
  displayName: string
  email: string
  /** Eingeladen, aber noch nicht angenommen. */
  pending: boolean
}

/** „das übrige Haus bleibt" / „die übrigen 3 Häuser bleiben" — Singular zählt nicht mit. */
function uebrigeHaeuser(n: number): string {
  return n === 1 ? 'das übrige Haus bleibt' : `die übrigen ${n} Häuser bleiben`
}

export type ManagerRow = {
  id: string
  displayName: string
  email: string
  /** Wie viele Häuser des Kontos diese Person insgesamt betreut. */
  hotelCount: number
  /** Eingeladen, aber noch nicht angenommen. */
  pending: boolean
}

export default function PersonalManager({
  hotelSlug,
  maids,
  receptionists,
  managers,
  verfuegbareManager,
  canManage,
  isOwner,
}: {
  hotelSlug: string
  maids: MaidRow[]
  receptionists: ReceptionRow[]
  /** Manager DIESES Hauses. */
  managers: ManagerRow[]
  /** Manager des Kontos, die hier noch nicht eingesetzt sind. */
  verfuegbareManager: ManagerRow[]
  /** false = Rezeptions-Rolle: nur Liste ansehen + Karten drucken. */
  canManage: boolean
  /** Nur der Kontoinhaber verwaltet Manager — sonst wäre es Rechteausweitung. */
  isOwner: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  /**
   * Löschen einer Reinigungskraft: erst die Auswirkungen laden, dann fragen.
   * Ohne Zahlen ist „die Historie geht verloren" nicht zu bewerten — eine
   * Fehlanlage von heute und eine Kraft mit zwei Jahren Arbeitsnachweis sahen
   * bisher gleich aus.
   */
  const [deleteTarget, setDeleteTarget] = useState<MaidDeletionImpact & { id: string } | null>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null)
  /** Offenes Bearbeiten-Formular (Reinigung, Rezeption oder Manager). */
  const [editId, setEditId] = useState<string | null>(null)
  const [recEinladung, setRecEinladung] = useState<Einladung | null>(null)
  const [confirmRecDeleteId, setConfirmRecDeleteId] = useState<string | null>(null)
  const [mgrEinladung, setMgrEinladung] = useState<Einladung | null>(null)
  const [confirmMgrRemoveId, setConfirmMgrRemoveId] = useState<string | null>(null)

  const activeMaids = maids.filter(m => !m.deactivatedAt)
  const inactiveMaids = maids.filter(m => m.deactivatedAt)

  function runSetActive(profileId: string, active: boolean, name: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await setMaidActiveAction(hotelSlug, profileId, active)
      if (res.error) { setError(res.error); return }
      setConfirmDeactivateId(null)
      setNotice(active
        ? `${name} ist wieder aktiv — der alte Zugang (PIN + Karte) gilt erneut.`
        : `${name} deaktiviert — Login und Karte sind gesperrt, die Tätigkeits-Historie bleibt erhalten.`)
    })
  }

  function runCreateReception(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    setRecEinladung(null)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await createReceptionAction(hotelSlug, formData)
      if (res.error) { setError(res.error); return }
      form.reset()
      setRecEinladung(res.einladung!)
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

  function runDeleteReception(profileId: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await deleteReceptionAction(hotelSlug, profileId)
      if (res.error) { setError(res.error); return }
      setConfirmRecDeleteId(null)
    })
  }

  function runCreateManager(form: HTMLFormElement) {
    setError(null)
    setNotice(null)
    setMgrEinladung(null)
    const formData = new FormData(form)
    startTransition(async () => {
      const res = await createManagerAction(hotelSlug, formData)
      if (res.error) { setError(res.error); return }
      form.reset()
      setMgrEinladung(res.einladung!)
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
    })
  }

  function runDetachManager(userId: string, name: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await detachManagerAction(hotelSlug, userId)
      if (res.error) { setError(res.error); return }
      setConfirmMgrRemoveId(null)
      const rest = res.nochInHaeusern ?? 0
      setNotice(
        rest > 0
          ? `${name} verwaltet dieses Haus nicht mehr — ${uebrigeHaeuser(rest)} unberührt.`
          : res.kept
            ? `${name} verwaltet kein Haus mehr. Der Zugang ist entzogen; der Datensatz bleibt als Nachweis früherer Vorgänge bestehen.`
            : `${name} entfernt.`,
      )
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
    })
  }

  function runIssueCard(profileId: string, name: string) {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await issueMaidLoginCardAction(hotelSlug, profileId)
      if (res.error) { setError(res.error); return }
      setNotice(`Neue Karte für ${name} erzeugt — die alte Karte (PIN + QR) ist ab sofort ungültig.`)
    })
  }

  /** Auswirkungen laden, dann erst fragen. */
  function openDelete(profileId: string) {
    setError(null)
    setNotice(null)
    setConfirmInput('')
    startTransition(async () => {
      const res = await getMaidDeletionImpactAction(hotelSlug, profileId)
      if (!res.impact) { setError(res.error ?? 'Konnte nicht geladen werden.'); return }
      setDeleteTarget({ ...res.impact, id: profileId })
    })
  }

  function runDelete() {
    if (!deleteTarget) return
    setError(null)
    setNotice(null)
    const name = deleteTarget.displayName
    startTransition(async () => {
      const res = await deleteMaidAction(hotelSlug, deleteTarget.id, confirmInput)
      if (res.error) { setError(res.error); return }
      setDeleteTarget(null)
      setNotice(`${name} endgültig gelöscht.`)
    })
  }

  /** Anzeigename (alle Personal-Arten) und Benutzername (nur Reinigung). */
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black text-ink">Personal — Reinigungskräfte</h1>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
          {activeMaids.length} {activeMaids.length === 1 ? 'Kraft' : 'Kräfte'}
        </span>
      </div>

      {/* Anlegen — nur Admin */}
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
              className="w-48 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
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
              className="w-40 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
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
          PIN (6 Ziffern) und QR-Login-Karte werden automatisch erzeugt — danach über &bdquo;Karte drucken&ldquo; aushändigen.
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

      {/* Liste — aktive Kräfte */}
      {activeMaids.length === 0 ? (
        <div className="rounded-xl border border-edge bg-surface p-8 text-center">
          <UserRound className="mx-auto mb-2 h-8 w-8 text-ink-muted" />
          <p className="font-semibold text-ink">Noch keine Reinigungskräfte angelegt.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Jede Kraft bekommt einen eigenen Zugang mit PIN und QR-Login-Karte fürs Reinigungsboard.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeMaids.map(m => (
            <div key={m.id} className="rounded-xl border border-edge bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-40">
                  <p className="font-bold text-ink">{m.displayName}</p>
                  <p className="font-mono text-xs text-ink-muted">@{m.username}</p>
                </div>

                {m.cleaningRoom && (
                  <span className="flex items-center gap-1 rounded-full bg-positive-pill px-3 py-1 text-xs font-semibold text-positive-deepest">
                    <Sparkles className="h-3.5 w-3.5" /> reinigt Zimmer {m.cleaningRoom}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {m.pin ? (
                    <span className="rounded-lg bg-surface-muted px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-ink-soft" title="Aktuelle PIN">
                      {m.pin}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-muted">keine Karte</span>
                  )}

                  {m.pin && (
                    <Link
                      href={`/h/${hotelSlug}/admin/personal/karte/${m.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
                    >
                      <Printer className="h-4 w-4" /> Karte drucken
                    </Link>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => runIssueCard(m.id, m.displayName)}
                      title="Neue PIN + neuer QR-Code — alte Karte wird ungültig"
                      className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                    >
                      <IdCard className="h-4 w-4" /> Neue Karte
                    </button>
                  )}

                  {canManage && (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => { setEditId(editId === m.id ? null : m.id); setDeleteTarget(null) }}
                        title="Anzeigename oder Benutzername korrigieren"
                        className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" /> Bearbeiten
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setConfirmDeactivateId(m.id)}
                        title="Ausgeschieden — Zugang sperren, Historie behalten"
                        className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                      >
                        <UserMinus className="h-4 w-4" /> Deaktivieren
                      </button>
                      {/* Auch an der aktiven Kraft erreichbar: eine Fehlanlage
                          erst deaktivieren zu müssen, um sie löschen zu können,
                          liest sich wie ein Verbot. */}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => { setDeleteTarget(null); setEditId(null); openDelete(m.id) }}
                        className="rounded-lg border border-critical-pill-edge p-1.5 text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                        aria-label={`${m.displayName} endgültig löschen`}
                        title="Endgültig löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {confirmDeactivateId === m.id && (
                <div className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3">
                  <p className="text-sm font-semibold text-ink">
                    {m.displayName} deaktivieren? Login per PIN und QR-Karte werden sofort
                    gesperrt. Die Tätigkeits-Historie bleibt für Auswertungen erhalten, und
                    eine spätere Reaktivierung stellt den Zugang wieder her.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => runSetActive(m.id, false, m.displayName)}
                      className="rounded-lg bg-action px-3 py-1.5 text-sm font-bold text-action-foreground disabled:opacity-50"
                    >
                      {pending ? 'Deaktivieren …' : 'Ja, deaktivieren'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeactivateId(null)}
                      className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
              {editId === m.id && (
                <StaffEditPanel
                  displayName={m.displayName}
                  username={m.username}
                  pending={pending}
                  onCancel={() => setEditId(null)}
                  onSave={patch => runRename(m.id, patch)}
                />
              )}

              {deleteTarget?.id === m.id && (
                <MaidDeletePanel
                  impact={deleteTarget}
                  confirmInput={confirmInput}
                  setConfirmInput={setConfirmInput}
                  pending={pending}
                  onCancel={() => setDeleteTarget(null)}
                  onDelete={runDelete}
                  onDeactivate={() => runSetActive(m.id, false, m.displayName)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Deaktivierte Kräfte — Zugang gesperrt, Historie erhalten */}
      {inactiveMaids.length > 0 && (
        <section className="rounded-xl border border-edge bg-surface-sunken p-4">
          <h2 className="mb-2 text-sm font-bold text-ink-soft">
            Deaktiviert
            <span className="ml-2 font-normal text-ink-muted">
              kein Login — Tätigkeits-Historie bleibt in der Auswertung sichtbar
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {inactiveMaids.map(m => (
              <div key={m.id} className="rounded-lg border border-edge bg-surface px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-40">
                    <p className="font-bold text-ink-muted">{m.displayName}</p>
                    <p className="font-mono text-xs text-ink-muted">@{m.username}</p>
                  </div>
                  <span className="text-xs text-ink-muted">
                    seit {new Date(m.deactivatedAt!).toLocaleDateString('de-DE')}
                  </span>

                  {canManage && (
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => runSetActive(m.id, true, m.displayName)}
                        className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                      >
                        <UserCheck className="h-4 w-4" /> Reaktivieren
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => { setEditId(editId === m.id ? null : m.id); setDeleteTarget(null) }}
                        title="Anzeigename oder Benutzername korrigieren"
                        className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" /> Bearbeiten
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => { setDeleteTarget(null); setEditId(null); openDelete(m.id) }}
                        className="rounded-lg border border-critical-pill-edge p-1.5 text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                        aria-label={`${m.displayName} endgültig löschen`}
                        title="Endgültig löschen — entfernt auch die Historie"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editId === m.id && (
                  <StaffEditPanel
                    displayName={m.displayName}
                    username={m.username}
                    pending={pending}
                    onCancel={() => setEditId(null)}
                    onSave={patch => runRename(m.id, patch)}
                  />
                )}

                {deleteTarget?.id === m.id && (
                  <MaidDeletePanel
                    impact={deleteTarget}
                    confirmInput={confirmInput}
                    setConfirmInput={setConfirmInput}
                    pending={pending}
                    onCancel={() => setDeleteTarget(null)}
                    onDelete={runDelete}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rezeptions-Zugänge — nur Admin */}
      {canManage && (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-ink">Personal — Rezeption</h2>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-ink-soft">
              {receptionists.length} {receptionists.length === 1 ? 'Zugang' : 'Zugänge'}
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
                  className="w-48 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                E-Mail (Login)
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="z. B. rezeption@meinhotel.de"
                  className="w-64 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
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
              Rezeptions-Zugänge bedienen das Tagesgeschäft (Check-in/-out, Bestellungen,
              Drucken) — Einstellungen, Zimmer-Setup und Services bleiben dem Admin vorbehalten.
              Die Person bekommt eine Einladung per E-Mail und vergibt ihr Passwort selbst.
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

          {receptionists.length > 0 && (
            <div className="flex flex-col gap-2">
              {receptionists.map(r => (
                <div key={r.id} className="rounded-xl border border-edge bg-surface px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-40">
                      <p className="font-bold text-ink">{r.displayName}</p>
                      <p className="font-mono text-xs text-ink-muted">{r.email}</p>
                    </div>
                    {r.pending && (
                      <>
                        <span className="rounded-full bg-attention-pill px-2.5 py-0.5 text-xs font-semibold text-attention-deepest">
                          Einladung offen
                        </span>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runResend(r.id, r.displayName)}
                          className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" /> Erneut senden
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setEditId(editId === r.id ? null : r.id)}
                      title="Anzeigename korrigieren"
                      className="ml-auto flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" /> Bearbeiten
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmRecDeleteId(r.id)}
                      className="rounded-lg border border-critical-pill-edge p-1.5 text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                      aria-label={`${r.displayName} löschen`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {editId === r.id && (
                    <StaffEditPanel
                      displayName={r.displayName}
                      pending={pending}
                      onCancel={() => setEditId(null)}
                      onSave={patch => runRename(r.id, patch)}
                    />
                  )}

                  {confirmRecDeleteId === r.id && (
                    <div className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3">
                      <p className="text-sm font-semibold text-ink">
                        {r.displayName} wirklich löschen? Der Login wird sofort ungültig.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runDeleteReception(r.id)}
                          className="rounded-lg bg-critical px-3 py-1.5 text-sm font-bold text-critical-foreground disabled:opacity-50"
                        >
                          {pending ? 'Löschen …' : 'Ja, löschen'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRecDeleteId(null)}
                          className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
              {managers.length} {managers.length === 1 ? 'Zugang' : 'Zugänge'}
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
                  className="w-48 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                E-Mail (Login)
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="z. B. nina@meinhotel.de"
                  className="w-64 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
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
              Ein Manager verwaltet dieses Haus vollständig — Zimmer, Personal,
              Services, Einstellungen. Auf das Konto (Plan, weitere Häuser,
              Manager) hat er keinen Zugriff. Die Person bekommt eine Einladung
              per E-Mail und vergibt ihr Passwort selbst.
            </p>
          </form>

          {verfuegbareManager.length > 0 && (
            <form
              onSubmit={e => { e.preventDefault(); runAttachManager(e.currentTarget) }}
              className="rounded-xl border border-edge bg-surface p-4"
            >
              <h3 className="mb-3 text-sm font-bold text-ink-soft">
                Vorhandenen Manager hinzufügen
              </h3>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
                  Manager aus diesem Konto
                  <select
                    name="userId"
                    defaultValue=""
                    className="w-80 rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none"
                  >
                    <option value="" disabled>Bitte auswählen …</option>
                    {verfuegbareManager.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} — {m.email}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-lg border border-edge px-4 py-2 text-sm font-bold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                  Hinzufügen
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Dieselbe Person, derselbe Zugang — sie betreut dieses Haus dann
                zusätzlich.
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

          {managers.length === 0 ? (
            <p className="rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink-muted">
              Für dieses Haus ist kein Manager eingetragen.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {managers.map(m => (
                <div key={m.id} className="rounded-xl border border-edge bg-surface px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-40">
                      <p className="font-bold text-ink">{m.displayName}</p>
                      <p className="font-mono text-xs text-ink-muted">{m.email}</p>
                    </div>
                    {m.hotelCount > 1 && (
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                        betreut {m.hotelCount} Häuser
                      </span>
                    )}
                    {m.pending && (
                      <>
                        <span className="rounded-full bg-attention-pill px-2.5 py-0.5 text-xs font-semibold text-attention-deepest">
                          Einladung offen
                        </span>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runResend(m.id, m.displayName)}
                          className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" /> Erneut senden
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setEditId(editId === m.id ? null : m.id)}
                      title="Anzeigename korrigieren"
                      className="ml-auto flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-edge-strong hover:text-ink disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" /> Bearbeiten
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmMgrRemoveId(m.id)}
                      className="rounded-lg border border-critical-pill-edge p-1.5 text-critical-strong hover:bg-critical-tint disabled:opacity-50"
                      aria-label={`${m.displayName} aus diesem Haus entfernen`}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>

                  {editId === m.id && (
                    <StaffEditPanel
                      displayName={m.displayName}
                      pending={pending}
                      hint={m.hotelCount > 1
                        ? `Gilt für alle ${m.hotelCount} Häuser dieser Person — der Name gehört zur Person, nicht zum Haus.`
                        : undefined}
                      onCancel={() => setEditId(null)}
                      onSave={patch => runRename(m.id, patch)}
                    />
                  )}

                  {confirmMgrRemoveId === m.id && (
                    <div className="mt-3 rounded-lg border border-edge bg-surface-sunken p-3">
                      <p className="text-sm font-semibold text-ink">
                        {m.displayName} aus diesem Haus entfernen? Der Zugriff endet sofort.
                        {m.hotelCount > 1
                          ? ` ${uebrigeHaeuser(m.hotelCount - 1).replace(/^./, c => c.toUpperCase())} unberührt.`
                          : ' Es ist das letzte Haus dieser Person.'}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => runDetachManager(m.id, m.displayName)}
                          className="rounded-lg bg-critical px-3 py-1.5 text-sm font-bold text-critical-foreground disabled:opacity-50"
                        >
                          {pending ? 'Entfernen …' : 'Ja, entfernen'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmMgrRemoveId(null)}
                          className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const panelInput =
  'rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm font-semibold text-ink focus:border-action focus:outline-none'

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
 * Löschen mit Zahlen statt mit einem Warnsatz. Hier ist die Warnung berechtigt:
 * `staff_log` hängt per `on delete cascade` am Zugang, der Arbeitsnachweis
 * verschwindet also wirklich — anders als beim Löschen eines Zimmers.
 */
function MaidDeletePanel({
  impact, confirmInput, setConfirmInput, pending, onDelete, onCancel, onDeactivate,
}: {
  impact: MaidDeletionImpact
  confirmInput: string
  setConfirmInput: (v: string) => void
  pending: boolean
  onDelete: () => void
  onCancel: () => void
  /** Nur bei aktiven Kräften — der schonende Ausweg. */
  onDeactivate?: () => void
}) {
  const datum = (iso: string) => new Date(iso).toLocaleDateString('de-DE')
  const zeitraum =
    impact.firstAt && impact.lastAt
      ? impact.firstAt === impact.lastAt
        ? ` (${datum(impact.firstAt)})`
        : ` (${datum(impact.firstAt)} bis ${datum(impact.lastAt)})`
      : ''

  return (
    <div className="mt-3 rounded-lg border border-critical-tint-edge bg-critical-tint p-3">
      {impact.cleaningRoom ? (
        <p className="text-sm font-semibold text-critical-strong">
          {impact.displayName} reinigt gerade Zimmer {impact.cleaningRoom} und lässt sich nicht
          löschen — erst die Reinigung abschließen.
        </p>
      ) : impact.logEntries === 0 ? (
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
          {(impact.checkIns > 0 || impact.ordersDone > 0) && (
            <p className="mt-2 text-xs text-ink-muted">
              {impact.checkIns > 0 && `${impact.checkIns} Check-ins`}
              {impact.checkIns > 0 && impact.ordersDone > 0 && ' und '}
              {impact.ordersDone > 0 && `${impact.ordersDone} erledigte Service-Anfragen`}{' '}
              <strong>bleiben erhalten</strong> — sie verlieren nur den Namen.
            </p>
          )}
        </>
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
            {onDeactivate && impact.requiresPhrase && (
              <button
                type="button"
                disabled={pending}
                onClick={onDeactivate}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
              >
                Lieber deaktivieren — Arbeitsnachweis bleibt
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
