/**
 * Rezeption — Service-Baukasten und Verweise. Deutsche Texte, Verwaltung wird gesiezt.
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 */
export const services = {
  title: 'Service-Baukasten',
  count: {
    one: '{count} Service',
    other: '{count} Services',
  },

  /** Formular „Neuen Service anlegen“. */
  create: {
    heading: 'Neuen Service anlegen',
    kindAria: 'Art des Services',
    kindOrder: 'Bestellbar',
    kindLink: 'Verweis (Link)',
    templates: 'Vorlagen:',
    name: 'Name',
    namePlaceholder: 'z. B. Extra Handtücher',
    description: 'Beschreibung (optional)',
    descriptionPlaceholder: 'Kurzer Hinweis für den Gast',
    price: 'Preis in {currency} (optional)',
    linkUrl: 'Adresse (Link)',
    urgent: 'Dringend',
    maintenance: 'Meldung ans Haus',
    submit: 'Anlegen',
    linkExplanation:
      'Ein <b>Verweis</b> ist eine Kachel im Gästeportal, die einen Link nach außen öffnet – Trinkgeld-App für das Reinigungsteam, Lieferdienst, Taxi. Er erzeugt keine Anfrage und erscheint weder auf dem Board der Rezeption noch auf der Check-out-Aufstellung. Für Inhalt und Datenschutz des Ziels ist der Anbieter verantwortlich; das Portal bettet nichts ein, es verlinkt nur.',
    urgentExplanation:
      'Dringende Anfragen blinken bei der Rezeption rot – an der Zimmer-Kachel und in der Navigation. Optionen mit eigenen Preisen (etwa Größen) legen Sie nach dem Anlegen am Service fest.',
    maintenanceExplanation:
      '<b>Meldung ans Haus</b> ist für Defekte und Instandhaltung gedacht – etwas am Zimmer, nicht am Aufenthalt. Solche Anfragen bleiben beim Check-out offen (ein Defekt verschwindet nicht mit dem Gast), erscheinen auf keiner Check-out-Aufstellung und warnen beim nächsten Check-in.',
  },

  /** Leerer Baukasten. */
  empty: {
    title: 'Noch keine Services angelegt.',
    text: 'Gäste sehen die Services im Gästeportal und senden ihre Anfrage mit einem Tipp.',
    examples: 'Beispiel-Services anlegen',
  },

  /** Ein Service in der Liste. */
  service: {
    urgentBadge: 'dringend',
    maintenanceBadge: 'Meldung ans Haus',
    linkBadge: 'Verweis',
    urgentOff: 'Dringend aus',
    urgentOn: 'Dringend an',
    maintenanceOff: 'Meldung ans Haus aus',
    maintenanceOn: 'Meldung ans Haus an',
    archive: 'Archivieren',
    archiveConfirm:
      '„{name}“ archivieren? Der Service verschwindet aus dem Gästeportal; bestehende Anfragen bleiben erhalten.',
    archiveYes: 'Ja, archivieren',
    address: 'Adresse',
    saveAddress: 'Adresse speichern',
    test: 'Testen',
    archiveOption: 'Option archivieren',
    archiveOptionAria: '{label} archivieren',
    noOptions: 'Keine Optionen – der Gast bestellt den Service als Ganzes.',
    option: 'Option',
    optionPlaceholder: 'z. B. Handtuch groß',
    /** `{currency}` = ISO-Code der Währung des Hauses, z. B. EUR. */
    price: 'Preis in {currency} (optional)',
    wholePrice: 'Preis des Service in {currency} (optional)',
    savePrice: 'Preis speichern',
    /** `{price}` = Preis des Service, z. B. „14,50 €“. */
    wholePriceIgnored: 'Der Service hat Optionen – deren Preise gelten. Der Preis des Service ({price}) wird nicht berechnet.',
    addOption: 'Hinzufügen',
  },

  /**
   * Sprachen eines Service (17.10.2026): Das Haus legt in seiner
   * Heimatsprache an und übersetzt selbst – der Baukasten zeigt, wo etwas
   * fehlt, und sperrt nichts. `{lang}`/`{home}` = Name der Sprache.
   */
  languages: {
    label: 'Sprachen:',
    home: 'Grundtext',
    missing: 'fehlt',
    /** Sprache, die das Haus nicht gewählt hat – übersetzbar, aber ohne Mahnung. */
    optional: 'optional',
    editTitle: 'Übersetzung {lang} bearbeiten',
    editorTitle: 'Übersetzung {lang}',
    editorIntro:
      'Gäste, die das Gästeportal in {lang} sehen, bekommen diese Texte. Leer gelassene Felder sehen sie in {home}. Übersetzen dürfen Sie mit einem Werkzeug Ihrer Wahl – fügen Sie das Ergebnis einfach hier ein.',
    name: 'Name',
    description: 'Beschreibung',
    options: 'Optionen',
    original: 'Grundtext: {text}',
    save: 'Übersetzung speichern',
    close: 'Schließen',
    saved: 'Gespeichert.',
    banner: {
      one: '<b>{count} Service</b> ist noch nicht vollständig in {lang} übersetzt.',
      other: '<b>{count} Services</b> sind noch nicht vollständig in {lang} übersetzt.',
    },
    bannerHint: 'Gäste mit {lang} sehen dort die Texte in {home}. Speichern geht trotzdem – übersetzen Sie, wann es passt.',
    bannerJump: 'Zum ersten',
  },

  /**
   * Vorlagen für Verweise (`src/lib/service-link-templates.ts`). Die Dienste
   * selbst (Marke, Adresse) sind Daten; `{brand}` setzt den Markennamen ein.
   */
  linkTemplates: {
    names: {
      tip: 'Trinkgeld fürs Reinigungsteam',
      food: 'Essen bestellen – {brand}',
    },
    descriptions: {
      tip: 'Bargeldlos Danke sagen – das Trinkgeld geht an das Reinigungsteam.',
      food: 'Restaurants in der Nähe liefern direkt zu uns ins Haus.',
    },
    regions: {
      everywhere: 'überall',
      germany: 'Deutschland',
      germanyNordicsJapan: 'Deutschland, Nordeuropa, Japan',
      worldwide: 'weltweit',
      southeastAsia: 'Südostasien',
      asia: 'Asien',
    },
    hints: {
      tip: 'Die Adresse aus Ihrer Trinkgeld-App eintragen (der QR-Code der App enthält genau diesen Link). Ein Link für das ganze Team – das Gästeportal nennt keine Namen.',
      lieferando:
        'Besser als die Startseite: die Adresse Ihrer Straße oder Postleitzahl aus der Suche von {brand} einsetzen, dann sieht der Gast sofort die Restaurants, die zu Ihnen liefern.',
      wolt: 'Stadtseite von {brand} einsetzen (z. B. …/de/deu/berlin), dann landet der Gast nicht auf der Länderauswahl.',
      ubereats: 'Die Adresse mit Ihrer Stadt aus der Suche von {brand} einsetzen.',
      grab: 'Landes- oder Stadtseite von {brand} einsetzen.',
      foodpanda: 'Landesseite von {brand} einsetzen.',
    },
  },

  /** Meldungen der Server-Actions. */
  errors: {
    invalidUrl: 'Adresse nicht lesbar – sie muss mit „https://“ beginnen.',
    serviceNotFound: 'Service nicht gefunden.',
    notALink: 'Dieser Service ist kein Verweis.',
    examplesExist: 'Die Beispiel-Services existieren bereits (ggf. archiviert).',
    nameTooShort: 'Name muss mindestens {min} Zeichen haben.',
    labelMissing: 'Bezeichnung fehlt.',
    priceInvalid: 'Preis nicht lesbar – z. B. „{example}“ oder leer lassen.',
    unknownLanguage: 'Unbekannte Sprache.',
  },
}
