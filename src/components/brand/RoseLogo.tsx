import {
  WORDMARK_VIEWBOX, WORD_R, WORD_SYM_TOP, WORD_SYM_RIGHT, WORD_SYM_LEFT, WORD_S, WORD_E,
} from './logo-paths'

/**
 * Wortmarke „RoSe“ mit Symbol als „o“ (Logo V15). Steht im Textfluss wie
 * das frühere zweifarbige „Ro<span>Se</span>“, auf der Grundlinie.
 *
 * „Se“ trägt `currentColor` und folgt damit Theme und Umgebung (dunkel
 * auf hell, weiß im Dark Mode und im Gästeportal); „R“ und Symbol tragen
 * die Markenfarben. `mono` färbt alles in `currentColor`.
 *
 * Feste Größen statt `em`, weil das Symbol mit seinen feinen Formen mehr
 * Höhe braucht als der frühere Schriftzug: `header` für Kopfzeilen (29 px),
 * `hero` über Anmeldeseiten und in der RoSe-Formel (48 px), `footer` (22 px).
 * `inline` folgt der Schrift des umgebenden Elements.
 */
const SIZES = {
  inline: 'h-[0.8em]',
  header: 'h-[1.8rem]',
  hero: 'h-12',
  footer: 'h-[1.375rem]',
} as const

export function RoseLogo({ mono = false, size = 'inline', className = '' }: {
  mono?: boolean
  size?: keyof typeof SIZES
  className?: string
}) {
  const green = mono ? 'fill-current' : 'fill-brand-green'
  const red = mono ? 'fill-current' : 'fill-brand-red'
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      role="img"
      aria-label="RoSe"
      className={`inline-block w-auto align-[-0.03em] ${SIZES[size]} ${className}`}
    >
      <path d={WORD_R} className={green} />
      <path d={WORD_SYM_TOP} className={red} />
      <path d={WORD_SYM_RIGHT} className={green} />
      <path d={WORD_SYM_LEFT} className={green} />
      <path d={WORD_S} className="fill-current" />
      <path d={WORD_E} className="fill-current" />
    </svg>
  )
}

