'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, DoorOpen, KeyRound, Loader2, QrCode, TriangleAlert } from 'lucide-react'
import { updateGuestAccessModeAction } from './actions'
import type { GuestAccessMode } from '@/lib/guest-access'

type Karte = {
  mode: GuestAccessMode
  titel: string
  untertitel: string
  ablauf: string[]
  dafuer: string[]
  dagegen: string[]
  passt: string[]
}

/**
 * Die Erläuterung ist hier kein Beiwerk, sondern der Zweck der Seite: Die Wahl
 * ist eine grundsätzliche Betriebsentscheidung, die ein Haus einmal trifft und
 * dann selten ändert. Wer sie trifft, muss die Abwägung kennen — vor allem den
 * fehlenden zweiten Faktor beim individuellen Verfahren.
 */
const KARTEN: Karte[] = [
  {
    mode: 'pin',
    titel: 'Fester QR-Code je Zimmer',
    untertitel: 'Standard — QR hängt im Zimmer, Gast tippt seine PIN',
    ablauf: [
      'Jedes Zimmer bekommt einmalig einen QR-Code zum Aushängen oder Aufstellen.',
      'Beim Check-in erhält der Gast eine PIN — ausgedruckt oder mündlich.',
      'Der Gast scannt den QR im Zimmer und gibt die PIN ein.',
      'Danach bleibt er auf seinem Gerät angemeldet und muss nichts mehr eingeben.',
    ],
    dafuer: [
      'Der Zugang hängt im Zimmer und geht nicht verloren — auch wenn der Gast seinen Zettel wegwirft.',
      'Es muss nichts gedruckt werden: Die PIN kann auch mündlich genannt werden.',
      'Die QR-Codes werden einmal gedruckt und bleiben dauerhaft gültig.',
      'Jedes Gerät einer Reisegruppe meldet sich selbst an.',
    ],
    dagegen: [
      'Der Gast muss eine PIN eintippen — ein Schritt mehr.',
      'Die PIN muss bei jedem Check-in mitgeteilt werden.',
      'Die Aushänge müssen einmalig ins Zimmer.',
    ],
    passt: [
      'Sie haben Aushänge oder Aufsteller im Zimmer — oder möchten welche.',
      'Ihre Rezeption soll zügig abfertigen können, ohne zu drucken.',
      'Sie haben viele Kurzaufenthalte oder wechselnde Belegung.',
    ],
  },
  {
    mode: 'link',
    titel: 'Individueller Zugang je Aufenthalt',
    untertitel: 'QR-Code oder Link beim Check-in — ohne PIN',
    ablauf: [
      'Beim Check-in entsteht ein persönlicher Zugang für genau diesen Aufenthalt.',
      'Der Gast bekommt ihn ausgedruckt oder per E-Mail zugeschickt.',
      'Scannen oder antippen genügt — es gibt keine PIN.',
      'Mit dem Check-out erlischt der Zugang von selbst.',
    ],
    dafuer: [
      'Ein Schritt weniger für den Gast: nichts eintippen.',
      'Im Zimmer muss kein QR-Code hängen — hilft, wo Aushänge stören.',
      'Der Zugang endet automatisch mit dem Check-out.',
      'Per E-Mail zustellbar: Der Gast hat ihn auf dem Handy, bevor er das Zimmer betritt.',
    ],
    dagegen: [
      'Der Zugang IST der Link — wer ihn sieht, kann den Zimmerservice dieses Zimmers bedienen, bis ausgecheckt wird. Ein liegengelassener Ausdruck ist ein offener Zugang.',
      'Der Gast braucht Zettel oder Mail. Verliert er beides, muss die Rezeption neu ausgeben.',
      'Bei jedem Check-in muss etwas ausgehändigt werden.',
      'Ohne E-Mail-Adresse des Gastes bleibt nur der Ausdruck.',
    ],
    passt: [
      'Sie möchten keine QR-Codes in den Zimmern — wegen Optik, Denkmalschutz oder häufiger Renovierung.',
      'Ihre Gäste bekommen beim Check-in ohnehin Unterlagen ausgehändigt.',
      'Ihnen ist der bequemste Weg für den Gast wichtiger als der zweite Faktor.',
    ],
  },
]

export default function GastzugangForm({
  hotelSlug, initial,
}: {
  hotelSlug: string
  initial: GuestAccessMode
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [gewaehlt, setGewaehlt] = useState<GuestAccessMode>(initial)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const geaendert = gewaehlt !== initial

  function speichern() {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const res = await updateGuestAccessModeAction(hotelSlug, gewaehlt)
      if (res.error) { setError(res.error); return }
      setNotice(
        gewaehlt === 'link'
          ? 'Umgestellt auf individuelle Zugänge. Ab dem nächsten Check-in bekommt jeder Gast seinen eigenen QR-Code — bitte die Aushänge aus den Zimmern nehmen.'
          : 'Umgestellt auf feste Zimmer-QR-Codes. Ab dem nächsten Check-in gilt wieder QR im Zimmer plus PIN — die Aushänge finden Sie jetzt unten auf dieser Seite.',
      )
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        Wie kommt Ihr Gast ins Gäste-Portal? Es gibt zwei Wege. Die Wahl gilt
        <strong> nur für dieses Haus</strong> — ein Konto mit mehreren Häusern kann sie
        unterschiedlich treffen.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {KARTEN.map(k => {
          const aktiv = gewaehlt === k.mode
          const istAktuell = initial === k.mode
          return (
            <button
              key={k.mode}
              type="button"
              onClick={() => setGewaehlt(k.mode)}
              className={`flex flex-col gap-3 rounded-xl border-2 bg-surface p-4 text-left ${
                aktiv
                  // Kein Tint-Hintergrund: die Tints sind nur für Light
                  // definiert, im Dark Mode stünde Ink-Text auf Blau-50.
                  // Die Auswahl trägt Rahmen, Ring und Icon in Aktionsfarbe.
                  ? 'border-action ring-2 ring-action/25'
                  : 'border-edge hover:border-edge-strong'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    aktiv ? 'bg-action text-action-foreground' : 'bg-surface-muted text-ink-soft'
                  }`}
                >
                  {k.mode === 'pin' ? <QrCode className="h-5 w-5" /> : <DoorOpen className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-ink">{k.titel}</span>
                    {istAktuell && (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                        derzeit aktiv
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{k.untertitel}</span>
                </span>
                {aktiv && <Check className="h-5 w-5 shrink-0 text-action" />}
              </div>

              <div>
                <p className="text-xs font-bold text-ink-soft">So läuft es</p>
                <ol className="mt-1 list-decimal pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.ablauf.map(z => <li key={z}>{z}</li>)}
                </ol>
              </div>

              <div>
                <p className="text-xs font-bold text-positive-deep">Dafür spricht</p>
                <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.dafuer.map(z => <li key={z}>{z}</li>)}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold text-caution-deepest">Dagegen spricht</p>
                <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.dagegen.map(z => <li key={z}>{z}</li>)}
                </ul>
              </div>

              <div className="rounded-lg bg-surface-muted p-3">
                <p className="text-xs font-bold text-ink-soft">Passt zu Ihnen, wenn …</p>
                <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-ink-soft">
                  {k.passt.map(z => <li key={z}>{z}</li>)}
                </ul>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-edge bg-surface p-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink-soft">
          <KeyRound className="h-4 w-4" /> Was beim Umstellen passiert
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-ink-soft">
          <li>
            <strong>Laufende Aufenthalte bleiben unberührt.</strong> Wer bereits eingecheckt
            ist, behält seinen ausgegebenen Zugang bis zum Check-out. Erst der nächste
            Check-in folgt dem neuen Verfahren.
          </li>
          <li>
            Beim Wechsel auf <strong>individuelle Zugänge</strong> sollten die Aushänge aus den
            Zimmern verschwinden — sie führen sonst auf eine PIN-Eingabe, die niemand mehr
            bedienen kann.
          </li>
          <li>
            Beim Wechsel auf <strong>feste Zimmer-QR-Codes</strong> brauchen Sie die Aushänge im
            Zimmer. Sie erscheinen dann unten auf dieser Seite.
          </li>
        </ul>
      </div>

      {gewaehlt === 'link' && (
        <p className="flex items-start gap-2 rounded-xl border border-attention-tint-edge bg-attention-tint px-4 py-3 text-sm font-semibold text-attention-deepest">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Beim individuellen Zugang gibt es keinen zweiten Faktor: Der Link ist der
            Schlüssel. Weisen Sie Ihre Gäste darauf hin, den Zettel wie einen Zimmerschlüssel
            zu behandeln.
          </span>
        </p>
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

      <button
        type="button"
        onClick={speichern}
        disabled={pending || !geaendert}
        className="flex w-fit items-center gap-1.5 rounded-lg bg-action px-4 py-2.5 font-bold text-action-foreground hover:bg-action-strong disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {geaendert ? 'Verfahren umstellen' : 'Bereits eingestellt'}
      </button>
    </div>
  )
}
