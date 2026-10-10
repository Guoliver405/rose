/**
 * Konto — Plan & Abrechnung, Zahlungsweg, Rechnungsdaten, Rechnungen.
 * Deutsche Texte, nur der Kontoinhaber liest (Sie).
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 */
export const billing = {
  /** Kurzbezeichnung des gewählten Zahlungswegs (Konto-Seite, Zahlungsweg-Seite). */
  kinds: {
    card: 'Karte',
    sepa_debit: 'SEPA-Lastschrift',
    bank_transfer: 'Überweisung auf Rechnung',
  },

  /** Seite „Plan & Abrechnung“ (`/admin/abrechnung`). */
  page: {
    title: 'Plan & Abrechnung',
    backToHouses: 'Häuser',
    notice: {
      testTitle: 'Testbetrieb – es wird nichts belastet.',
      testText:
        'Rechnungen werden monatlich am 1. für den Vormonat gestellt, derzeit aber über die Testumgebung unseres Zahlungsdienstleisters: Sie sind Testrechnungen, hinterlegte Karten und Konten werden nicht belastet. Vor dem Wechsel in den Echtbetrieb werden Sie in Textform informiert.',
      noneTitle: 'Aktuell wird nichts berechnet.',
      noneText:
        'Rechnungsstellung und Zahlungsweg sind noch nicht eingerichtet. Die Beträge auf dieser Seite zeigen, was das Konto nach dem Preismodell kosten würde. Vor der ersten Berechnung werden Sie in Textform informiert und können einen Zahlungsweg hinterlegen – bis dahin entstehen keine Kosten.',
    },
    free: {
      label: 'frei',
      title: 'Freier Monat: der Kalendermonat der Registrierung und der erste volle Monat danach.',
    },
    insteadOf: 'statt {amount}',
    plusVat: 'zzgl. USt.',
    plan: {
      title: 'Ihr Plan',
      perRoom: 'je Zimmer und Monat, zzgl. USt.',
      minimum: 'Mindestbetrag <b>{amount}</b> je Konto und Monat – bis {rooms} Zimmer ein Festpreis.',
      text:
        'Ein Preis für alle Hausgrößen, alle Funktionen sind enthalten. Es gibt keine Pakete und nichts, worauf Sie später hochstufen müssten. Ihr Konto besteht seit dem {registered} und ist frei bis Ende {freeUntil} – der Monat der Registrierung und der erste volle Kalendermonat danach kosten nichts.',
    },
    current: {
      title: 'Laufender Monat – {month}',
      colHouse: 'Haus',
      colRooms: 'Abrechenbare Zimmer',
      total: 'Gesamt',
      expected: 'Voraussichtlicher Betrag:',
      note:
        'Gezählt wird jedes Zimmer, das im Monat auch nur vorübergehend in Betrieb war – ein heute außer Betrieb genommenes Zimmer zählt für diesen Monat also noch mit, ein heute angelegtes ebenfalls. Die Zahl steht erst mit dem Monatsende fest.',
    },
    closed: {
      title: 'Abgeschlossene Monate',
      empty: 'Noch kein abgeschlossener Monat – der erste erscheint hier ab dem 1. des Folgemonats.',
      colMonth: 'Monat',
      colRooms: 'Zimmer',
      colAmount: 'Betrag',
      colStatus: 'Status',
      fixed: 'festgeschrieben',
      fixedTitle: 'Festgeschrieben, bevor Zimmer gelöscht wurden – diese Zahl ändert sich nicht mehr.',
      notCharged: 'nicht berechnet',
      note:
        'Abgeschlossene Monate werden festgeschrieben, sobald Zimmer gelöscht werden – sonst würde ein gelöschtes Zimmer rückwirkend aus bereits abgerechneten Zeiträumen verschwinden. Solange nichts gelöscht wird, ist die Zählung aus den Zimmern selbst ebenso verbindlich.',
    },
    paymentMethod: {
      title: 'Zahlungsweg',
      unavailable:
        'Noch kein Zahlungsweg hinterlegt – und derzeit auch keiner wählbar. Sobald die Rechnungsstellung eingerichtet ist, können Sie hier einen Zahlungsweg hinterlegen. Sie werden vorher in Textform informiert.',
      none: 'Noch kein Zahlungsweg hinterlegt.',
      invoiceTo: 'Rechnung an <b>{name}</b>, {postalCode} {city}, {country}',
      vatId: ' · USt-IdNr. {vatId}',
      detailsMissing: 'Rechnungsdaten fehlen noch.',
      change: 'Zahlungsweg und Rechnungsdaten ändern',
      add: 'Zahlungsweg hinterlegen',
    },
    invoices: {
      title: 'Rechnungen',
      emptyStripe:
        'Noch keine Rechnung. Die erste entsteht am 1. des Monats nach dem Freimonat – monatlich nachträglich, elektronisch, fällig innerhalb von 14 Tagen ohne Abzug.',
      emptyNone:
        'Noch keine Rechnungen. Rechnungen erscheinen hier, sobald die Rechnungsstellung eingerichtet ist – monatlich nachträglich, elektronisch, fällig innerhalb von 14 Tagen ohne Abzug.',
      net: '{amount} netto',
      due: 'fällig {date}',
      pdf: 'PDF',
      view: 'Ansehen',
      viewPay: 'Ansehen / bezahlen',
    },
    status: {
      draft: 'in Vorbereitung',
      open: 'offen',
      paid: 'bezahlt',
      uncollectible: 'nicht einbringlich',
      void: 'storniert',
      overdue: 'überfällig',
    },
    terms: {
      title: 'Abrechnungsmodalitäten',
      interval:
        '<b>Abrechnungsintervall:</b> Kalendermonat, monatlich nachträglich – die Rechnung kommt am 1. des Folgemonats per E-Mail und erscheint hier.',
      payment:
        '<b>Zahlung:</b> mit hinterlegter Karte oder Lastschrift wird mit Rechnungsstellung eingezogen (Lastschrift nach Vorabankündigung), sonst innerhalb von 14 Tagen per Überweisung oder über die Zahlungsseite.',
      minimum: '<b>Mindestbetrag je Konto,</b> nicht je Haus – mehrere Häuser zahlen für die Summe ihrer Zimmer.',
      inactive: '<b>Zimmer außer Betrieb</b> (Renovierung, Saison) zählen nicht, solange sie den ganzen Monat außer Betrieb sind.',
      cancel:
        '<b>Keine Laufzeit:</b> monatlich zum Monatsende kündbar. Das Löschen des Kontos unter „Daten löschen“ ist zugleich die Kündigung.',
      net: '<b>Alle Preise netto,</b> zuzüglich der gesetzlichen Umsatzsteuer.',
      details: 'Details in den <link>AGB</link>, § 6 und § 7.',
    },
  },

  /** Seite „Zahlungsweg & Rechnungsdaten“ (`/admin/abrechnung/zahlungsweg`). */
  paymentPage: {
    backToBilling: 'Plan & Abrechnung',
    title: 'Zahlungsweg & Rechnungsdaten',
    step: {
      title: 'Schritt 2 von 2 – Zahlungsweg',
      text:
        'Ihr Konto und Ihr Haus sind angelegt. Hinterlegen Sie jetzt Rechnungsdaten und Zahlungsweg – belastet wird nichts, der Monat der Registrierung und der erste volle Monat danach sind frei. Sie können diesen Schritt auch später auf der Seite „Plan & Abrechnung“ nachholen.',
      later: 'Später – weiter zum Zimmer-Setup',
    },
    saveFailed: 'Karte bzw. Konto konnte nicht gespeichert werden: {error}',
    confirmCancelled: 'Die Bestätigung von Karte bzw. Konto wurde abgebrochen. Bitte noch einmal versuchen.',
  },

  /** Formular „Rechnungsdaten“. */
  details: {
    title: 'Rechnungsdaten',
    intro:
      'Stehen auf jeder Rechnung. Die Anschrift bestimmt die Umsatzsteuer: Deutschland 19 %, Unternehmen in der EU mit USt-IdNr. ohne deutsche Steuer (Reverse Charge), außerhalb der EU ohne deutsche Steuer.',
    name: 'Rechnungsempfänger (Firma)',
    line1: 'Straße und Hausnummer',
    line2: 'Adresszusatz (optional)',
    postalCode: 'Postleitzahl',
    city: 'Ort',
    country: 'Land',
    vatId: 'USt-IdNr. {suffix}',
    vatRequired: '(Pflicht)',
    vatOptional: '(optional)',
    vatNotApplicable: '(entfällt)',
    vatStatus: 'Status: {status}',
    vatStatusText: {
      pending: 'wird geprüft',
      verified: 'geprüft',
      unverified: 'Prüfung fehlgeschlagen – bitte Nummer kontrollieren',
      unavailable: 'Prüfdienst nicht erreichbar, wird nachgeholt',
    },
    vatHint:
      'Für Unternehmen in der EU außerhalb Deutschlands ist die USt-IdNr. nötig – nur dann kann die Rechnung ohne deutsche Umsatzsteuer gestellt werden.',
    submit: 'Rechnungsdaten speichern',
    submitting: 'Wird gespeichert …',
    saved: 'Gespeichert',
  },

  /** Kasten „Zahlungsweg“ mit Stripe Payment Element. */
  panel: {
    title: 'Zahlungsweg',
    remove: 'Entfernen',
    none:
      'Noch kein Zahlungsweg hinterlegt. Drei Wege, alle über unseren Zahlungsdienstleister Stripe: Karte oder SEPA-Lastschrift werden hier gespeichert und monatlich eingezogen; bei Überweisung auf Rechnung wird nichts gespeichert, jede Rechnung nennt eine Bankverbindung mit Verwendungszweck.',
    detailsFirst:
      'Bitte zuerst die Rechnungsdaten oben speichern – sie stehen auf der Rechnung und bestimmen die Umsatzsteuer.',
    change: 'Karte oder Lastschrift ändern',
    add: 'Karte oder SEPA-Lastschrift hinterlegen',
    bankTransfer: 'Überweisung auf Rechnung',
    bankTransferChosen: 'Überweisung auf Rechnung gewählt.',
    saved: '{label} gespeichert.',
    stripeUnreachable: 'Stripe nicht erreichbar.',
    notes:
      'Überweisung: Die Rechnung nennt eine Bankverbindung unseres Zahlungsdienstleisters mit Verwendungszweck; der Eingang wird automatisch zugeordnet, Zahlungsziel 14 Tage. Lastschrift: Einzug mit Rechnungsstellung nach Vorabankündigung. Karte: Belastung mit Rechnungsstellung.',
    next: 'Weiter zum Zimmer-Setup',
    form: {
      confirmFailed: 'Bestätigung fehlgeschlagen.',
      notConfirmed: 'Karte bzw. Konto noch nicht bestätigt ({status}).',
      unknownStatus: 'unbekannt',
      submit: 'Karte bzw. Konto speichern',
      submitting: 'Wird gespeichert …',
      cancel: 'Abbrechen',
      preferTransfer:
        'Lieber keine Karte und kein Konto speichern? <link>Überweisung auf Rechnung wählen</link> – jede Rechnung nennt dann eine Bankverbindung und einen Verwendungszweck, Zahlungsziel 14 Tage.',
      noCharge:
        'Es wird nichts belastet. Karte bzw. Konto werden bei Stripe gespeichert und für die Monatsrechnungen verwendet; RoSe selbst sieht keine Karten- oder Kontodaten.',
    },
  },

  /** Kurzbezeichnung, die mit dem Zahlungsweg am Konto gespeichert wird. */
  labels: {
    card: '{brand} •••• {last4}',
    sepaDebit: 'SEPA-Lastschrift •••• {last4}',
    bankTransfer: 'Überweisung auf Rechnung',
  },

  /** Texte auf der Stripe-Rechnung (Position, Vermerk, Fußzeile). Sprache der Rechnung: heute Deutsch. */
  invoice: {
    rooms: { one: '{count} Zimmer', other: '{count} Zimmer' },
    line: 'RoSe – Nutzung im {month}: {rooms} × {price}',
    lineMinimum: 'RoSe – Nutzung im {month}: {rooms} (Mindestbetrag {minimum} je Monat)',
    memo: 'Leistungszeitraum {range}. Abgerechnet wird jedes Zimmer, das im Monat auch nur vorübergehend in Betrieb war.',
    periodField: 'Leistungszeitraum',
    managingDirector: 'Geschäftsführer {name}',
    vatId: 'USt-IdNr. {vatId}',
    due: 'Zahlbar innerhalb von {days} Tagen ohne Abzug.',
  },

  errors: {
    noPermission: 'Keine Berechtigung.',
    notReady: 'Zahlungswege sind noch nicht eingerichtet.',
    stripeUnreachable: 'Stripe nicht erreichbar.',
    invalidId: 'Ungültige Kennung.',
    /** Prüfung der Rechnungsdaten (`validateBillingDetails`). */
    vat: {
      nameMissing: 'Bitte den Rechnungsempfänger angeben.',
      countryMissing: 'Bitte ein Land auswählen.',
      line1Missing: 'Bitte Straße und Hausnummer angeben.',
      postalCodeMissing: 'Bitte die Postleitzahl angeben.',
      cityMissing: 'Bitte den Ort angeben.',
      outsideEu: 'Eine USt-IdNr. gibt es nur für Unternehmen in der EU. Bitte das Feld leer lassen.',
      format: 'Die USt-IdNr. passt nicht zum Format für {country} (Präfix {prefix}).',
      required:
        'Für Unternehmen in der EU außerhalb Deutschlands ist die USt-IdNr. Pflicht – sonst müssten wir deutsche Umsatzsteuer berechnen.',
    },
    /** Stripe-Anbindung (`utils/stripe.ts`). */
    stripe: {
      notConfigured: 'Stripe ist nicht eingerichtet.',
      accountNotFound: 'Konto nicht gefunden.',
      unreachable: 'Stripe nicht erreichbar.',
      customerFailed: 'Stripe-Kunde konnte nicht angelegt werden.',
      detailsFailed: 'Rechnungsdaten konnten nicht übertragen werden.',
      noCustomer: 'Kein Stripe-Kunde für dieses Konto.',
      wrongAccount: 'Die Zahlungsangaben gehören nicht zu diesem RoSe-Konto.',
      notConfirmed: 'Karte bzw. Konto noch nicht bestätigt ({status}).',
      missingOnIntent: 'Karte bzw. Konto fehlt in der Bestätigung.',
      unsupported: 'Zahlungsart {type} wird nicht unterstützt.',
      saveFailed: 'Karte bzw. Konto konnte nicht gespeichert werden.',
      detachFailed: 'Karte bzw. Konto konnte nicht entfernt werden.',
    },
    /** Grund, warum eine Rechnung im Entwurf bleibt (`invoices.last_error`, auf der Konto-Seite sichtbar). */
    invoicing: {
      noCustomer: 'Kein Stripe-Kunde – bitte die Seite „Zahlungsweg“ öffnen.',
      detailsMissing: 'Rechnungsdaten fehlen.',
    },
  },
}
