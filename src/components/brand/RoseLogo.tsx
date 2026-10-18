import {
  WORDMARK_VIEWBOX, WORD_R, WORD_SYM_TOP, WORD_SYM_RIGHT, WORD_SYM_LEFT, WORD_S, WORD_E,
} from './logo-paths'

/**
 * Wortmarke „RoSe“ mit Symbol als „o“ (Logo V15). Steht im Textfluss wie
 * das frühere zweifarbige „Ro<span>Se</span>“: Höhe in `em`, also so groß
 * wie die Schrift des umgebenden Elements, und auf der Grundlinie.
 *
 * „Se“ trägt `currentColor` und folgt damit Theme und Umgebung (dunkel
 * auf hell, weiß im Dark Mode und im Gästeportal); „R“ und Symbol tragen
 * die Markenfarben. `mono` färbt alles in `currentColor`.
 */
export function RoseLogo({ mono = false, className = '' }: { mono?: boolean; className?: string }) {
  const green = mono ? 'fill-current' : 'fill-brand-green'
  const red = mono ? 'fill-current' : 'fill-brand-red'
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      role="img"
      aria-label="RoSe"
      className={`inline-block h-[0.8em] w-auto align-[-0.03em] ${className}`}
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

