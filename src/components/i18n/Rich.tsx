import { Fragment, type ReactNode } from 'react'
import { parseRich, type Vars } from '@/lib/i18n/format'

/**
 * Text aus der Sprachdatei mit Hervorhebungen: `<b>…</b>` im Text wird über
 * `tags.b` gezeichnet (Vorgabe: `<strong>`). So bleibt der Satz in der
 * Sprachdatei ganz, und die Übersetzung darf seine Teile umstellen.
 * Ohne Hooks — läuft in Server- und Client-Komponenten.
 */
export default function Rich({
  text,
  vars,
  tags = {},
}: {
  text: string
  vars?: Vars
  tags?: Record<string, (chunk: string) => ReactNode>
}) {
  return (
    <>
      {parseRich(text, vars).map((p, i) => (
        <Fragment key={i}>
          {p.tag ? (tags[p.tag] ?? (c => <strong>{c}</strong>))(p.text) : p.text}
        </Fragment>
      ))}
    </>
  )
}
