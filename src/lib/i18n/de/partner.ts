/**
 * Partnerprogramm (`/partner`, Bauplan Sessions/Affiliate-Plan-2026-11-15.md).
 * Leser: Inhaber, Manager, Rezeption und Simulator-Konten — gesiezt.
 * Die Seite verspricht nur, was es gibt: Auszahlungen folgen später.
 */
export const partner = {
  metaTitle: 'Partnerprogramm – RoSe',

  /** Kopfzeile des Partnerbereichs. */
  header: {
    title: 'Partnerprogramm',
    backHouses: 'Häuser',
    backHouse: 'Zur Übersicht',
    backSimulator: 'Simulator',
    signOut: 'Abmelden',
  },

  /** Karte bzw. Zeile, die in den Partnerbereich führt (`/admin`, „Mein Zugang“, Konto des Simulators). */
  entry: {
    title: 'Partnerprogramm',
    text: 'RoSe empfehlen und an jeder bezahlten Rechnung mitverdienen.',
    open: 'Öffnen',
  },

  /** Wer noch kein Partner ist. `{rate}` = Satz, z. B. „20 %“. */
  join: {
    title: 'RoSe empfehlen und mitverdienen',
    intro: 'Empfehlen Sie RoSe an Häuser, die Sie kennen. Von jedem Haus, das sich über Ihren Link registriert, erhalten Sie {rate} jeder bezahlten Rechnung – dauerhaft, solange das Haus Kunde bleibt.',
    points: [
      'Ihr persönlicher Link und ein QR-Code zum Weitergeben',
      'Provision auf jede bezahlte Rechnung, ohne Befristung',
      'Übersicht über geworbene Konten und Ihre Provision',
    ],
    payoutNote: 'Auszahlungen folgen in einem späteren Schritt. Ihre Provision wird vom ersten Tag an gesammelt.',
    terms: 'Ich habe die <terms>Partnerbedingungen</terms> gelesen und stimme ihnen zu.',
    submit: 'Partner werden',
    submitting: 'Wird angelegt …',
  },

  /** Link, Code und QR-Code des Partners. */
  link: {
    title: 'Ihr Link',
    text: 'Wer sich über diesen Link registriert, wird Ihnen zugeordnet. Der Code lässt sich bei der Registrierung auch von Hand unter „Empfohlen von“ eintragen.',
    linkLabel: 'Link',
    codeLabel: 'Code',
    copy: 'Kopieren',
    copied: 'Kopiert',
    qrAlt: 'QR-Code mit Ihrem Partner-Link',
    qrHint: 'Zum Drucken oder Weitergeben: Rechtsklick oder langer Druck auf den QR-Code, dann speichern.',
  },

  /** Hinweis, solange der Partner nicht freigeschaltet ist. `{email}` = Adresse des RoSe-Teams. */
  notApproved: {
    title: 'Noch nicht freigeschaltet',
    text: 'Die Registrierung ist derzeit nur mit Einladung offen. Ihr Link ordnet Registrierungen bereits zu, öffnet sie aber erst, wenn wir Sie freigeschaltet haben. Schreiben Sie uns dafür an {email}.',
  },

  /** Kennzahlen. `{count}`, `{month}`, `{days}` werden eingesetzt. */
  stats: {
    title: 'Ihre Zahlen',
    accounts: 'Geworbene Konten',
    accountsPaying: 'davon {count} mit bezahlter Rechnung',
    rooms: 'Zimmer',
    roomsHint: 'abgerechnet für {month}',
    roomsNone: 'noch keine Abrechnung',
    pending: 'Vorgemerkt',
    pendingHint: 'wird {days} Tage nach der Zahlung frei',
    available: 'Verfügbar',
    availableHint: 'Auszahlungen folgen',
    reversed: 'Zurückgenommen',
    reversedHint: 'nach Erstattung oder Rückbuchung',
    privacy: 'Sie sehen Zahlen, keine Namen der geworbenen Häuser.',
  },

  /** Tabelle je Leistungsmonat. */
  months: {
    title: 'Provision je Monat',
    month: 'Leistungsmonat',
    amount: 'Provision',
    pending: 'davon vorgemerkt',
    reversed: 'zurückgenommen',
    empty: 'Noch keine Provision. Sie entsteht, sobald ein geworbenes Haus seine erste Rechnung bezahlt hat.',
  },

  errors: {
    signInAgain: 'Bitte melden Sie sich erneut an.',
    notEligible: 'Mit diesem Zugang können Sie nicht Partner werden.',
    termsMissing: 'Bitte stimmen Sie den Partnerbedingungen zu.',
    failed: 'Das hat nicht geklappt. Bitte versuchen Sie es erneut.',
  },
}

export type PartnerMessages = typeof partner
