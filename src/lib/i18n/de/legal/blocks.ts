/**
 * Gliederung der Rechtstexte als Daten: Abschnitte mit Absätzen, Aufzählungen,
 * Unterabschnitten und Anschriften. Die Seiten unter `src/app/(legal)/` zeichnen
 * sie per `map` (`LegalView` in `ui.tsx`) — der Wortlaut steht ausschließlich
 * in der Sprachdatei.
 *
 * Texte dürfen Platzhalter tragen (`{name}`, `{email}`, `{pricePerRoom}` …,
 * Werte aus `provider.ts`, `pricing.ts`, `sim-account.ts`) und flache Tags für
 * Hervorhebung, Code und Links (`<b>`, `<code>`, `<agb>`, `<datenschutz>`,
 * `<impressum>`, `<simulatorDatenschutz>`, `<stripePrivacy>`, `<website>`).
 */

/** Bedingung an Anbieter-Daten: Zeile erscheint nur, wenn der Wert gesetzt (bzw. nicht gesetzt) ist. */
export type LegalCondition = 'phone' | 'noPhone' | 'vatId'

/** Anschrift aus `provider.ts`: `provider` = Gesellschaft, `responsible` = Verantwortlicher nach § 18 Abs. 2 MStV. */
export type LegalAddress = 'provider' | 'responsible'

export type LegalText = string | { text: string; when: LegalCondition }

export type LegalBlock =
  | LegalText
  | { list: readonly LegalText[] }
  | { sub: string; blocks: readonly LegalBlock[] }
  | { address: LegalAddress }

export type LegalSection = {
  title: string
  /** Sprungmarke, z. B. `#simulator` aus den Nutzungsbedingungen. */
  id?: string
  when?: LegalCondition
  blocks: readonly LegalBlock[]
}

export type LegalPage = {
  meta: { title: string; description: string }
  title: string
  sub?: string
  sections: readonly LegalSection[]
}
