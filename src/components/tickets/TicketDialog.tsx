'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckCircle2, ImagePlus, MessageSquareWarning, X } from 'lucide-react'
import { format } from '@/lib/i18n/format'
import { SCREENSHOT_MAX_BYTES, SCREENSHOT_MAX_EDGE, SUBJECT_MAX, TICKET_KINDS, ticketRef, type TicketKind } from '@/lib/tickets'
import { reportProblemAction } from '@/app/tickets/actions'
import { useHelpMessages } from '@/components/hilfe/HelpMessages'
import { installErrorBuffer, recentErrors } from './error-buffer'

/**
 * „Problem melden“ – Knopf und Formular. Sitzt in der Hilfe-Leiste und auf der
 * Seite „Meine Meldungen“. Der Kontext (Seite, Sprache, Bildschirm, Browser,
 * letzte Fehler) wird beim Senden eingesammelt, nicht abgefragt.
 *
 * Das Bildschirmfoto wird **im Browser verkleinert** (längste Kante
 * `SCREENSHOT_MAX_EDGE`, JPEG): Server-Actions nehmen ohne eigene Einstellung
 * nur 1 MB an, und ein volles 4K-Foto braucht ohnehin niemand.
 */
export default function TicketButton({ slug, className, label }: { slug: string | null; className?: string; label?: string }) {
  const { help } = useHelpMessages()
  const [open, setOpen] = useState(false)
  useEffect(() => { installErrorBuffer() }, [])
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <MessageSquareWarning className="h-4 w-4" /> {label ?? help.tickets.report.button}
      </button>
      {open && createPortal(<TicketDialog slug={slug} onClose={() => setOpen(false)} />, document.body)}
    </>
  )
}

/** Bild verkleinern und als JPEG neu kodieren; `null`, wenn der Browser es nicht lesen kann. */
async function shrink(file: Blob): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, SCREENSHOT_MAX_EDGE / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    for (const q of [0.85, 0.7, 0.5]) {
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', q))
      if (blob && blob.size <= SCREENSHOT_MAX_BYTES) return blob
    }
    return null
  } catch {
    return null
  }
}

function TicketDialog({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const { help } = useHelpMessages()
  const t = help.tickets
  const r = t.report
  const pathname = usePathname()
  const [kind, setKind] = useState<TicketKind | null>(null)
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ number: number; url: string } | null>(null)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Vorschau-URL beim Wechsel oder Schließen freigeben.
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url) }, [shot])

  async function takeImage(file: Blob | null | undefined) {
    if (!file) return
    const small = await shrink(file)
    if (!small) {
      setError(file.type.startsWith('image/') ? t.errors.screenshotTooLarge : t.errors.screenshotWrongType)
      return
    }
    setError(null)
    setShot({ blob: small, url: URL.createObjectURL(small) })
  }

  function onPaste(e: React.ClipboardEvent) {
    const item = [...e.clipboardData.items].find(i => i.type.startsWith('image/'))
    if (item) {
      e.preventDefault()
      void takeImage(item.getAsFile())
    }
  }

  function submit(formData: FormData) {
    formData.set('slug', slug ?? '')
    formData.set('kind', kind ?? '')
    formData.set('context', JSON.stringify({
      path: pathname,
      locale: document.documentElement.lang,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      userAgent: navigator.userAgent,
      errors: recentErrors(),
    }))
    formData.delete('screenshotFile')
    if (shot) formData.set('screenshot', new File([shot.blob], 'screenshot.jpg', { type: 'image/jpeg' }))
    start(async () => {
      const res = await reportProblemAction(formData)
      if ('error' in res) setError(res.error)
      else setDone(res)
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-edge bg-surface-elevated p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
        onPaste={onPaste}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 id="ticket-title" className="text-xl font-black text-ink">{r.title}</h3>
          <button type="button" onClick={onClose} aria-label={r.close} className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-positive-strong" />
            <p className="text-lg font-bold text-ink">{r.done}</p>
            <p className="rounded-lg border border-edge px-3 py-1.5 text-sm text-ink-soft">{format(r.doneRef, { ref: ticketRef(done.number) })}</p>
            <p className="text-sm text-ink-soft">{r.doneHint}</p>
            <div className="mt-2 flex gap-2">
              <Link href={done.url} onClick={onClose} className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong">
                {r.toList}
              </Link>
              <button type="button" onClick={onClose} className="rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink">
                {r.close}
              </button>
            </div>
          </div>
        ) : (
          <form action={submit} className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">{r.intro}</p>

            <fieldset>
              <legend className="mb-1.5 text-sm font-bold text-ink">{r.kind}</legend>
              <div className="flex flex-wrap gap-2">
                {TICKET_KINDS.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      kind === k ? 'border-action bg-action-tint text-ink' : 'border-edge text-ink-soft hover:border-edge-strong hover:text-ink'
                    }`}
                  >
                    {t.kinds[k]}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-ink">{r.subject}</span>
              <input
                name="subject"
                required
                maxLength={SUBJECT_MAX}
                placeholder={r.subjectPlaceholder}
                className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-ink">{r.body}</span>
              <textarea
                name="body"
                required
                rows={5}
                maxLength={5000}
                placeholder={r.bodyPlaceholder}
                className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-ink">{r.screenshot}</span>
              {shot ? (
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau aus dem Browser */}
                  <img src={shot.url} alt="" className="max-h-32 rounded-lg border border-edge" />
                  <button type="button" onClick={() => setShot(null)} className="text-sm font-semibold text-ink-muted hover:text-ink hover:underline">
                    {r.screenshotRemove}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 font-semibold text-ink-soft hover:border-edge-strong hover:text-ink"
                  >
                    <ImagePlus className="h-4 w-4" /> {r.screenshotPick}
                  </button>
                  <span>{r.screenshotPaste}</span>
                  <input
                    ref={fileRef}
                    name="screenshotFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => void takeImage(e.target.files?.[0])}
                  />
                </div>
              )}
              <span className="text-xs text-ink-muted">{r.screenshotPrivacy}</span>
            </div>

            <p className="text-xs text-ink-muted">{r.context}</p>

            {error && <p className="rounded-lg bg-critical-tint px-3 py-2 text-sm text-critical-deepest">{error}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink">
                {r.cancel}
              </button>
              <button
                type="submit"
                disabled={pending || !kind}
                className="rounded-lg bg-action px-4 py-2 text-sm font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
              >
                {pending ? r.sending : r.send}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
