/**
 * Werkzeuge für die Sprachdateien (seit 10.10.2026, Vorbereitung der
 * Mehrsprachigkeit, Entscheidungen in `Sessions/Begriffe-Entscheidungen.md`).
 *
 * Bewusst ohne Bibliothek, nach dem Muster der Next.js-Doku
 * (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`):
 * je Sprache ein typisiertes Objekt mit Texten, Platzhalter in geschweiften
 * Klammern. Drei Gründe: (1) Ein fehlender Schlüssel fällt beim Type-Check
 * auf, nicht im Browser — dieselbe Haltung wie `room-symbols.ts`. (2) Das
 * Gästeportal hat keine Sprache in der URL; gedruckte QR-Codes müssen jeden
 * Umbau überleben, Routing-Bibliotheken bringen hier nichts. (3) Texte sind
 * reine Strings und gehen damit unverändert als Props in Client-Komponenten.
 *
 * Ohne I/O, getestet in `format.test.ts`.
 */

export type Vars = Record<string, string | number>

/** `{name}` durch Werte ersetzen. Fehlt ein Wert, bleibt der Platzhalter sichtbar — ein Fehler soll auffallen, nicht verschwinden. */
export function format(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) =>
    key in vars ? String(vars[key]) : all,
  )
}

/** Pluralformen nach den Regeln der Sprache (`Intl.PluralRules`); `other` ist Pflicht, weil jede Sprache sie kennt. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

/**
 * Form zur Anzahl wählen und `{count}` (plus weitere Werte) einsetzen.
 * Deutsch braucht nur `one`/`other`, Polnisch oder Arabisch mehr — deshalb
 * entscheidet `Intl`, nicht ein `n === 1` im Code.
 */
export function plural(intlLocale: string, count: number, forms: PluralForms, vars: Vars = {}): string {
  const rule = new Intl.PluralRules(intlLocale).select(count)
  return format(forms[rule] ?? forms.other, { count, ...vars })
}

/** Abschnitt eines Textes: schlichter Text oder der Inhalt eines Tags wie `<b>…</b>`. */
export type RichPart = { text: string; tag?: string }

/**
 * Text mit Hervorhebungen in Abschnitte zerlegen: „bis <b>{limit} Uhr</b> aufschieben“.
 * Übersetzungen dürfen die Reihenfolge der Satzteile ändern — deshalb steht der
 * ganze Satz in der Sprachdatei und nicht in Stücken im Code. Nur flache Tags,
 * keine Verschachtelung; Platzhalter werden vorher ersetzt.
 */
export function parseRich(template: string, vars: Vars = {}): RichPart[] {
  const text = format(template, vars)
  const parts: RichPart[] = []
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) })
    parts.push({ text: m[2], tag: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

/**
 * Alle Texte einer Sprachdatei mit ihrem Schlüsselpfad (`signal.dnd.label`) —
 * für die Wächter-Tests und für die Liste zum Gegenlesen.
 */
export function flattenMessages(obj: object, prefix = ''): [string, string][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string'
      ? [[`${prefix}${k}`, v] as [string, string]]
      : flattenMessages(v as object, `${prefix}${k}.`),
  )
}

/**
 * Form einer Sprachdatei: dieselben Schlüssel wie die deutsche, aber beliebige
 * Texte. Weitere Sprachen schreiben `satisfies Shape<typeof de>` — fehlt
 * dort ein Schlüssel, scheitert der Type-Check.
 */
export type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> }

/**
 * Erläuterung eines Textes für Übersetzer (seit 17.10.2026): `where` = Ort
 * auf dem Bildschirm, `note` = was man zum Übersetzen wissen muss (wann der
 * Text erscheint, wer ihn liest, Längengrenze, Platzhalter und Tags).
 */
export type TextContext = { where: string; note: string }

/** Erläuterungen zu einer Sprachdatei — dieselben Schlüssel, je Text ein `TextContext`. */
export type ContextShape<T> = { [K in keyof T]: T[K] extends string ? TextContext : ContextShape<T[K]> }

/** Alle Erläuterungen mit ihrem Schlüsselpfad — passend zu `flattenMessages`. */
export function flattenContext(obj: object, prefix = ''): [string, TextContext][] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof (v as TextContext).where === 'string'
      ? [[`${prefix}${k}`, v as TextContext] as [string, TextContext]]
      : flattenContext(v as object, `${prefix}${k}.`),
  )
}
