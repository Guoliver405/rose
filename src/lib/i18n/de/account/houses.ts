/**
 * Konto — Seite `/admin` (Häuser und Konto-Kasten), Haus anlegen, Kontoname,
 * Daten löschen, Kopfzeile des Konto-Bereichs, Logo-Prüfung.
 * Deutsche Texte, Inhaber und Manager lesen (Sie).
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 */
export const houses = {
  /** Kopfzeile des Konto-Bereichs (`KontoShell`). */
  shell: {
    logout: 'Abmelden',
  },

  /** Konto-Kasten oben auf `/admin`, nur für den Inhaber. */
  account: {
    heading: 'Konto',
    billingLink: 'Plan & Abrechnung',
    houseCount: { one: '{count} Haus', other: '{count} Häuser' },
    roomsActive: '{count} Zimmer in Betrieb',
    roomsBillable: '{count} abrechenbar im laufenden Monat',
    expected: 'voraussichtlich {amount}',
    expectedFree: 'voraussichtlich {amount} (Freimonat)',
    invoiceFailed: '<b>Eine Rechnung konnte nicht gestellt werden.</b> {reason} <link>Zur Abrechnung</link>',
    invoiceOverdue: '<b>Rechnung {number} ist überfällig.</b> Bitte begleichen Sie sie, sonst kann der Zugang nach Mahnung gesperrt werden (§ 6 Abs. 6 AGB). <link>Rechnung ansehen</link>',
    noPaymentMethod: '<b>Noch kein Zahlungsweg hinterlegt.</b> Karte, SEPA-Lastschrift oder Überweisung – <link>jetzt hinterlegen</link>. Belastet wird erst nach dem Freimonat.',
    billingRule: 'Abgerechnet wird je Zimmer und Kalendermonat; gezählt wird jedes Zimmer, das im Monat <em>auch nur vorübergehend</em> in Betrieb war.',
    billingNotSetUp: 'Rechnungsstellung und Zahlungsweg sind noch nicht eingerichtet – aktuell wird nichts berechnet.',
    billingTestMode: 'Rechnungen werden monatlich am 1. gestellt – derzeit als Testrechnungen, es wird nichts belastet.',
    billingLive: 'Rechnungen werden monatlich am 1. für den Vormonat gestellt.',
  },

  /** Liste der Häuser. */
  list: {
    heading: 'Häuser',
    rooms: '{count} Zimmer',
    toClean: '{count} zu reinigen',
    allReady: 'alles bereit',
    manager: 'Manager',
  },

  /** Karte zum Housekeeping-Simulator; der Name kommt aus `SIMULATOR_NAME`. */
  simulator: {
    text: 'Ihr Haus mit anderen Zahlen durchrechnen – Personal, Zeiten, Belegung – über viele Tage, ohne Steuerung und mit RoSe.',
  },

  /** „Haus anlegen“ (`HausAnlegen`). */
  create: {
    button: 'Haus anlegen',
    name: 'Name des Hauses',
    namePlaceholder: 'z. B. Stadthotel Krone',
    submit: 'Anlegen',
    hint: 'Die Adresse wird aus dem Namen erzeugt und ist danach unter Einstellungen → Haus & Regeln änderbar. Beispiel-Services werden mit angelegt.',
  },

  /** Kontoname mit Stift (`KontoName`). */
  accountName: {
    rename: 'Konto umbenennen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    hint: 'Der Kontoname ist unabhängig vom Namen der Häuser – beim Anlegen wurde der Name des ersten Hauses übernommen. Die Häuser selbst benennen Sie unter Einstellungen → Haus & Regeln um.',
  },

  /** Löschbegehren (`DatenLoeschen`). */
  deletion: {
    summary: 'Daten löschen',
    summaryHint: 'Haus oder Konto endgültig entfernen',
    intro: 'Entfernt <b>alles</b>: Zimmer, Aufenthalte, Anfragen, Reinigungsnachweise, Zimmer-Verlauf und die Anmeldekonten der betroffenen Personen. Nicht rückgängig zu machen und nicht wiederherstellbar – es gibt keine Sicherung. <b>Erhalten bleiben nur die Rechnungen</b>, weil sie aufbewahrt werden müssen.',
    singleHouse: 'Einzelnes Haus',
    delete: 'Löschen',
    deleteAccount: 'Gesamtes Konto löschen',
    deleteAccountHint: 'Mit allen Häusern und dem eigenen Zugang. Danach ist keine Anmeldung mehr möglich.',
    loadFailed: 'Konnte nicht geladen werden.',
    houseRemoved: '{name} wurde vollständig entfernt.',
    headingHouse: '{name} löschen – das verschwindet endgültig:',
    headingAccount: 'Konto „{name}“ löschen – das verschwindet endgültig:',
    houses: { one: '{count} Haus: {names}', other: '{count} Häuser: {names}' },
    rooms: { one: '{count} Zimmer', other: '{count} Zimmer' },
    stays: { one: '{count} Aufenthalt', other: '{count} Aufenthalte' },
    orders: { one: '{count} Anfrage', other: '{count} Anfragen' },
    staffLog: { one: '{count} Eintrag im Tätigkeitsprotokoll', other: '{count} Einträge im Tätigkeitsprotokoll' },
    transitions: { one: '{count} Eintrag im Zimmer-Verlauf', other: '{count} Einträge im Zimmer-Verlauf' },
    snapshots: { one: '{count} festgeschriebener Abrechnungsmonat', other: '{count} festgeschriebene Abrechnungsmonate' },
    authUsers: { one: '{count} Anmeldekonto samt E-Mail-Adresse', other: '{count} Anmeldekonten samt E-Mail-Adresse' },
    authUsersKept: {
      one: '{count} Anmeldekonto bleibt bestehen – diese Person ist noch in anderen Häusern eingetragen.',
      other: '{count} Anmeldekonten bleiben bestehen – diese Personen sind noch in anderen Häusern eingetragen.',
    },
    confirmLabel: 'Zum Bestätigen „{phrase}“ eingeben',
    deleting: 'Wird gelöscht …',
    confirm: 'Ja, endgültig löschen',
    cancel: 'Abbrechen',
  },

  /** Prüfung einer hochgeladenen Logo-Datei (`validateLogoUpload` liefert den Schlüssel). */
  logo: {
    empty: 'Die Datei ist leer.',
    tooLarge: 'Die Datei ist zu groß ({kb} KB). Höchstens 1 MB.',
    wrongType: 'Nur PNG, JPG oder SVG – die Datei ist keines davon.',
  },

  errors: {
    noPermission: 'Keine Berechtigung.',
    accountNameTooShort: 'Der Kontoname muss mindestens 2 Zeichen haben.',
    accountNameTooLong: 'Der Kontoname darf höchstens 80 Zeichen haben.',
    houseNameTooShort: 'Der Name des Hauses muss mindestens 2 Zeichen haben.',
    createFailed: 'Anlegen fehlgeschlagen: {message}',
    ownerOnlyDelete: 'Nur der Kontoinhaber kann Daten löschen.',
    ownerOnlyDeleteAccount: 'Nur der Kontoinhaber kann das Konto löschen.',
    houseNotFound: 'Haus nicht gefunden.',
    confirmPhrase: 'Bitte geben Sie „{phrase}“ zur Bestätigung ein.',
    deleteFailed: 'Löschen fehlgeschlagen: {message}',
  },
}
