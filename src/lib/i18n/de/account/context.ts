import type { LooseContext } from '../../format'
import type { AccountMessages } from './index'

/**
 * Erläuterungen zu Konto und Abrechnung für Übersetzer (17.10.2026). Leser:
 * Kontoinhaber (Abrechnung) bzw. Inhaber und Manager (Häuser-Seite), gesiezt.
 * Steuer- und Vertragsbegriffe genau übersetzen (USt-IdNr. = VAT ID, Reverse
 * Charge, AGB = terms and conditions); Beträge kommen fertig formatiert.
 */
export const accountContext = {
  houses: {
    _: { where: 'Konto → Seite „Häuser“ (/admin): Konto-Kasten, Liste der Häuser, Haus anlegen, Daten löschen', note: '{count}, {amount}, {name}, {names}, {month}, {rooms}, {phrase}, {message}, {reason}, {number}, {n}, {kb}. <link>…</link> wird zum Link, <b>/<em> sind Hervorhebungen. „§ 6 Abs. 6 AGB“ = Abschnitt der Geschäftsbedingungen.' },
  },
  billing: {
    _: { where: 'Konto → „Plan & Abrechnung“ und „Zahlungsweg & Rechnungsdaten“ (nur Kontoinhaber)', note: 'Rechnungs- und Steuerbegriffe genau; {amount}, {month}, {rooms}, {registered}, {freeUntil}, {date}, {name}, {postalCode}, {city}, {country}, {vatId}, {suffix}, {status}, {label}, {error}, {brand}, {last4}, {type}, {prefix}.' },
    invoice: { where: 'Texte auf der Stripe-Rechnung (Position, Vermerk, Fußzeile)', note: 'Rechnungen gehen in der Sprache des Landes der Rechnungsanschrift heraus (deutschsprachige Länder Deutsch, sonst Englisch). {month}, {rooms}, {price}, {minimum}, {range}, {name}, {vatId}, {days}.' },
  },
} satisfies LooseContext<AccountMessages>
