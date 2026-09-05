/**
 * Kurzanleitung fürs Gäste-Portal — der Text, der dem Gast erklärt, wozu das
 * Portal da ist und was er tun muss (und was nicht).
 *
 * Eine Quelle für Handout (Druck) und Mail, damit beide dasselbe sagen. Der
 * entscheidende Satz hängt an den Hotel-Policies: Bei eingeschalteter
 * Routine-Reinigung (`stayoverAutoClean`) muss der Gast NICHTS anfordern —
 * ohne sie wird nur auf Wunsch gereinigt, und genau das muss der Gast wissen,
 * sonst wartet er vergeblich. Das Zeitfenster (`cleaningWindow*`) kommt dazu,
 * wenn es gesetzt ist.
 *
 * Ohne I/O: Policies rein, Text raus — testbar in `guest-guide.test.ts`.
 */
import { parseCleaningWindow, parseStayoverPolicy, stayoverDueTime } from './board'
import type { GuestAccessMode } from './guest-access'

export type GuestGuide = {
  /** Wozu das Portal da ist. */
  purpose: string
  /** Reinigung: Routine oder auf Wunsch — der Satz, der an den Policies hängt. */
  cleaning: string
  /** „Bitte nicht stören". */
  dnd: string
  /** Service-Anfragen. */
  services: string
  /** Wie man hineinkommt und wie lange der Zugang gilt. */
  access: string
}

export type GuestGuideOptions = {
  /** Verfahren DIESES Aufenthalts (`stays.access_mode`). */
  accessMode: GuestAccessMode
  /** Führt QR/Link direkt ins Zimmer (true) oder nur auf die Hotel-Adresse (false)? */
  deepLink: boolean
}

function hhmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function buildGuestGuide(
  policies: Record<string, unknown>,
  opts: GuestGuideOptions,
): GuestGuide {
  const stayover = parseStayoverPolicy(policies)
  const window = parseCleaningWindow(policies)

  const windowSentence = window.enabled
    ? ` Reinigungswünsche nimmt das Portal täglich von ${window.start} bis ${window.end} Uhr entgegen.`
    : ''

  // Genannt wird die Zeit, ab der die Routine WIRKLICH fällig wird — nie vor
  // der Check-out-Frist des Hauses (siehe `stayoverDueTime`).
  const due = stayoverDueTime(stayover)
  const cleaning = stayover.enabled
    ? `Ihr Zimmer wird täglich ab ${hhmm(due.hour, due.minute)} Uhr gereinigt — Sie müssen nichts anfordern; ` +
      `am Abreisetag nach dem Check-out. ` +
      `Möchten Sie zwischendurch eine Reinigung, fordern Sie sie im Portal an.${windowSentence}`
    : `Ihr Zimmer wird auf Wunsch gereinigt: Bitte fordern Sie die Reinigung im Portal an, ` +
      `sobald es Ihnen passt — ohne Anforderung bleibt das Zimmer unberührt.${windowSentence}`

  const access =
    opts.accessMode === 'link'
      ? 'Der QR-Code bzw. Link ist Ihr persönlicher Zugang — ohne PIN. Er gilt nur für diesen Aufenthalt und erlischt mit dem Check-out.'
      : opts.deepLink
        ? 'QR-Code scannen und PIN eingeben — danach bleiben Sie angemeldet. Die PIN gilt bis zum Check-out.'
        : 'Adresse öffnen, Zimmernummer und PIN eingeben — danach bleiben Sie angemeldet. Die PIN gilt bis zum Check-out.'

  return {
    purpose:
      'Über das Gäste-Portal erreichen Sie die Rezeption direkt vom Zimmer aus — rund um die Uhr, ohne Anruf.',
    cleaning,
    dnd: '„Bitte nicht stören" im Portal hält das Personal von Ihrem Zimmer fern, bis Sie es wieder zurücknehmen.',
    services:
      'Wünsche wie frische Handtücher oder eine Reparatur bestellen Sie direkt im Portal — die Rezeption sieht Ihre Anfrage sofort.',
    access,
  }
}

/** Die Punkte in Lesereihenfolge — für Reintext und Aufzählungen. */
export function guideLines(g: GuestGuide): string[] {
  return [g.purpose, g.cleaning, g.dnd, g.services, g.access]
}
