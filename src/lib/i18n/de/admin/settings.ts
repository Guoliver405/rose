/**
 * Rezeption — Einstellungen: Hub, Haus & Regeln, Gästezugang, Sprachen, Logo, Mein Zugang, Test-Szenario. Deutsche Texte, Verwaltung wird gesiezt.
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`.
 */
export const settings = {
  /** Überschrift des Hubs und Beschriftung des Rückwegs dorthin. */
  title: 'Einstellungen',

  hub: {
    tiles: {
      house: {
        title: 'Haus & Regeln',
        description: 'Name des Hauses, Länge der Gast-PIN, Zeitlimit der Reinigung, tägliche Reinigung',
      },
      guestAccess: {
        title: 'Gästezugang',
        description: 'Fester QR-Code je Zimmer mit PIN (samt Aushängen) oder individueller Zugang je Aufenthalt',
      },
      rooms: {
        title: 'Zimmer',
        description: 'Zimmer anlegen und verwalten – Nummern, Etagen, Gebäudeteile',
      },
      staff: {
        title: 'Personal',
        description: 'Reinigungskräfte und Zugänge der Rezeption, Zugangskarten',
      },
      services: {
        title: 'Service-Baukasten',
        description: 'Services einrichten, die Gäste anfragen können',
      },
      myAccess: {
        title: 'Mein Zugang',
        description: 'Eigene Anmelde-Adresse, Anzeigenamen und Passwort ändern',
      },
      testScenario: {
        title: 'Test-Szenario',
        description: 'Vorübergehend: fingierte Belegungs- und Reinigungslage zum Testen',
      },
      notices: {
        title: 'Aushänge',
        description: 'Aushänge der Zimmer mit QR-Code zum Drucken',
      },
      staffCards: {
        title: 'Zugangskarten',
        description: 'Zugangskarten der Reinigungskräfte ansehen und drucken',
      },
    },
  },

  house: {
    title: 'Haus & Regeln',
    unsavedLabel: 'Haus & Regeln',
    logo: {
      heading: 'Logo',
      intro: 'Ihr Logo steht im Kopf der gedruckten Blätter – Aushang und Check-in-Blatt. Ohne Logo steht dort der Name des Hauses.',
    },
    name: 'Name des Hauses',
    slug: {
      label: 'Adresse des Hauses (nur Kleinbuchstaben, Ziffern, Bindestriche)',
      guestPortal: 'Gästeportal:',
      cleaning: 'Reinigung:',
      hint: 'Zimmernummern und Benutzernamen sind nur innerhalb des Hauses eindeutig – deshalb steht die Adresse in beiden Anmeldungen. Gedruckte QR-Codes (Aushang, Zugangskarte) bleiben bei einer Änderung gültig; nur die abgetippte Adresse auf älteren Check-in-Blättern stimmt dann nicht mehr.',
    },
    pinLength: 'Länge der Gast-PIN (4–8)',
    staleMinutes: 'Vergessener Abschluss: Zimmer wieder freigeben nach … Minuten',
    staleHint: 'Wurde eine Reinigung gestartet, aber nicht abgeschlossen, steht das Zimmer nach dieser Zeit wieder offen auf dem Board. Im Verlauf steht dann „Reinigung nicht abgeschlossen (Zeitlimit)“.',
    daily: {
      label: 'Belegte Zimmer täglich reinigen',
      hint: 'Belegte Zimmer erscheinen ab dem Tag nach der Anreise zur gewählten Uhrzeit von selbst auf dem Reinigungsboard, bis sie an dem Tag gereinigt wurden. Ausgenommen sind „Bitte nicht stören“, „Heute keine Reinigung“ und der Abreisetag.',
      /** `<time></time>` ist das Uhrzeit-Feld. */
      from: 'täglich ab <time></time> Uhr',
    },
    checkoutUntil: {
      /** `<time></time>` ist das Uhrzeit-Feld. */
      label: 'Check-out bis <time></time> Uhr',
      hint: 'Solange RoSe nicht weiß, ob der Gast heute abreist, wird die tägliche Reinigung nicht vor dieser Uhrzeit fällig. So wird kein Abreisezimmer vor dem Check-out gereinigt und danach noch einmal. Ist beim Aufenthalt ein Abreisedatum eingetragen, gilt an den Tagen davor die normale Uhrzeit, und am Abreisetag entfällt die tägliche Reinigung.',
    },
    checkinFrom: {
      label: 'Check-in ab <time></time> Uhr',
      hint: 'Bis dahin sollen die Abreisezimmer bezugsfertig sein. Das Reinigungsboard rechnet damit: Je mehr Abreisen noch offen sind und je näher der Check-in rückt, desto stärker zieht es Reinigungskräfte auf die Etagen mit Abreisen – an ruhigen Tagen kaum, an vollen deutlich.',
    },
    defer: {
      label: 'Gäste dürfen die Reinigung aufschieben („frühestens ab“)',
      hint: 'Der Gast wünscht Reinigung, aber nicht vor einer Uhrzeit – etwa, weil er ausschlafen will. Bis dahin gilt das Zimmer auf dem Board als nicht offen. Eine Einschränkung, kein Termin: Das Housekeeping kommt danach, wann es passt.',
      until: 'aufschieben bis spätestens <time></time> Uhr',
      untilHint: 'So wählen, dass die Reinigung danach noch in der Schicht liegt: Arbeitet das Housekeeping bis 15:00, ist 13:00 ein guter Wert. Der Gast sieht diese Grenze im Gästeportal.',
    },
    timeZone: {
      label: 'Zeitzone des Hauses',
      hint: 'Alle Uhrzeiten dieser Seite und die Tagesgrenzen der Auswertung gelten in dieser Zeitzone. Steht hier die falsche, liegen alle Regeln um den Zeitunterschied daneben.',
    },
    tracking: {
      heading: 'Tätigkeiten der Reinigung',
      person: {
        label: 'Je Kraft',
        hint: 'Auswertung mit Tabelle und Tagesprotokoll je Reinigungskraft, Namen im Zimmer-Verlauf. Vorgabe.',
      },
      team: {
        label: 'Nur als Team',
        hint: 'Für Länder und Betriebe, in denen die Arbeit einzelner Reinigungskräfte nicht gemessen werden darf oder soll. Das Haus sieht weiterhin, wann welches Zimmer gereinigt wurde und wie viel das Team leistet – aber nicht, wer: keine Tabelle je Reinigungskraft, kein Tagesprotokoll, im Zimmer-Verlauf steht „Reinigungsteam“.',
        warning: '<b>Achtung:</b> Beim Umstellen verlieren auch alle bisherigen Einträge ihre Person, neue spätestens nach 24 Stunden. Sie können später wieder auf „Je Kraft“ zurückstellen, dann werden neue Schichten wieder mit Namen erfasst. Die Namen bereits anonymisierter Einträge lassen sich aber nicht wiederherstellen.',
      },
      note: 'Unverändert bleiben die Live-Anzeigen zur Koordination (wer gerade auf welcher Etage ist, wer welches Zimmer reinigt) – sie verschwinden mit dem Schichtende. Ist nur eine Reinigungskraft im Dienst, lässt sich ein gereinigtes Zimmer trotzdem ihr zuordnen, wie bei einem Dienstplan auf Papier. Das ließe sich nur verhindern, indem auch die Uhrzeiten wegfielen.',
    },
    window: {
      label: 'Reinigungswunsch nur innerhalb fester Zeiten',
      hint: 'Außerhalb des Zeitfensters können Gäste im Gästeportal keinen Reinigungswunsch mehr absetzen – sie sehen stattdessen einen Hinweis mit den Reinigungszeiten. „Bitte nicht stören“ und das Zurücknehmen eines Wunsches bleiben jederzeit möglich.',
      /** `<start></start>` und `<end></end>` sind die Uhrzeit-Felder. */
      range: 'von <start></start> bis <end></end> Uhr',
    },
    saved: 'Gespeichert.',
    save: 'Speichern',
  },

  guestAccess: {
    title: 'Gästezugang',
    unsavedLabel: 'Verfahren',
    intro: 'Wie kommt Ihr Gast ins Gästeportal? Es gibt zwei Wege. Die Wahl gilt <b>nur für dieses Haus</b> – ein Konto mit mehreren Häusern kann sie unterschiedlich treffen.',
    modes: {
      pin: {
        title: 'Fester QR-Code je Zimmer',
        subtitle: 'Standard – der QR-Code steht im Zimmer, der Gast tippt seine PIN',
        steps: [
          'Jedes Zimmer bekommt einmalig einen QR-Code zum Aushängen oder Aufstellen.',
          'Beim Check-in erhält der Gast eine PIN – ausgedruckt oder mündlich.',
          'Der Gast scannt den QR-Code im Zimmer und gibt die PIN ein.',
          'Danach bleibt er auf seinem Gerät angemeldet und muss nichts mehr eingeben.',
        ],
        pros: [
          'Der QR-Code bleibt im Zimmer und geht nicht verloren; die PIN kann die Rezeption jederzeit noch einmal nennen.',
          'Es muss nichts gedruckt werden: Die PIN kann auch mündlich genannt werden.',
          'Die QR-Codes werden einmal gedruckt und bleiben dauerhaft gültig.',
          'Jedes Gerät einer Reisegruppe meldet sich selbst an.',
        ],
        cons: [
          'Der Gast muss eine PIN eintippen – ein Schritt mehr.',
          'Die PIN muss bei jedem Check-in mitgeteilt werden.',
          'Die Aushänge müssen einmalig ins Zimmer.',
        ],
        fits: [
          'Sie haben Aushänge oder Aufsteller im Zimmer – oder möchten welche.',
          'Ihre Rezeption soll zügig abfertigen können, ohne zu drucken.',
          'Sie haben viele Kurzaufenthalte oder wechselnde Belegung.',
        ],
      },
      link: {
        title: 'Individueller Zugang je Aufenthalt',
        subtitle: 'QR-Code oder Link beim Check-in – ohne PIN',
        steps: [
          'Beim Check-in entsteht ein persönlicher Zugang für genau diesen Aufenthalt.',
          'Der Gast bekommt ihn ausgedruckt oder per E-Mail zugeschickt.',
          'Scannen oder antippen genügt – es gibt keine PIN.',
          'Mit dem Check-out erlischt der Zugang von selbst.',
        ],
        pros: [
          'Ein Schritt weniger für den Gast: nichts eintippen.',
          'Im Zimmer muss kein QR-Code hängen – hilft, wo Aushänge stören.',
          'Der Zugang endet automatisch mit dem Check-out.',
          'Per E-Mail zustellbar: Der Gast hat ihn auf dem Handy, bevor er das Zimmer betritt.',
        ],
        cons: [
          'Der Link ist der Zugang: Wer ihn sieht, kann das Gästeportal dieses Zimmers bedienen, bis ausgecheckt wird. Ein liegengelassener Ausdruck ist ein offener Zugang.',
          'Der Gast braucht Blatt oder E-Mail. Verliert er beides, muss die Rezeption neu ausgeben.',
          'Bei jedem Check-in muss etwas ausgehändigt werden.',
          'Ohne E-Mail-Adresse des Gastes bleibt nur der Ausdruck.',
        ],
        fits: [
          'Sie möchten keine QR-Codes in den Zimmern – wegen Optik, Denkmalschutz oder häufiger Renovierung.',
          'Ihre Gäste bekommen beim Check-in ohnehin Unterlagen ausgehändigt.',
          'Ihnen ist der bequemste Weg für den Gast wichtiger als der zweite Faktor.',
        ],
      },
    },
    badgeActive: 'derzeit aktiv',
    badgeDefault: 'Vorgabe',
    howItWorks: 'So läuft es',
    pros: 'Dafür spricht',
    cons: 'Dagegen spricht',
    fits: 'Passt zu Ihnen, wenn …',
    switching: {
      heading: 'Was beim Umstellen passiert',
      running: '<b>Laufende Aufenthalte bleiben unberührt.</b> Wer bereits eingecheckt ist, behält seinen ausgegebenen Zugang bis zum Check-out. Erst der nächste Check-in folgt dem neuen Verfahren.',
      toLink: 'Beim Wechsel auf <b>individuelle Zugänge</b> können die Aushänge aus einem Zimmer, sobald der dortige Gast ausgecheckt hat – danach führen sie auf eine PIN-Eingabe, die niemand mehr bedienen kann.',
      toPin: 'Beim Wechsel auf <b>feste QR-Codes je Zimmer</b> brauchen Sie die Aushänge im Zimmer. Sie erscheinen dann unten auf dieser Seite.',
    },
    linkWarning: 'Beim individuellen Zugang gibt es keinen zweiten Faktor: Der Link ist der Schlüssel. Das Check-in-Blatt weist den Gast darauf hin; am Tresen gehören ausgedruckte Blätter behandelt wie Zimmerschlüssel.',
    notices: {
      confirmed: 'Verfahren bestätigt – es gilt weiter wie bisher. Der Punkt „Gästezugang“ in der Einrichtung ist damit erledigt.',
      switchedToLink: 'Umgestellt auf individuelle Zugänge. Ab dem nächsten Check-in bekommt jeder Gast seinen eigenen QR-Code. Die Aushänge nehmen Sie aus einem Zimmer, sobald der dortige Gast ausgecheckt hat.',
      switchedToPin: 'Umgestellt auf feste QR-Codes je Zimmer. Ab dem nächsten Check-in gilt wieder QR-Code im Zimmer plus PIN – die Aushänge finden Sie jetzt unten auf dieser Seite.',
    },
    confirmHint: 'Bisher gilt die Vorgabe (fester QR-Code je Zimmer). Bestätigen Sie die Wahl einmal – auch wenn Sie dabei bleiben. Erst dann hält das Haus das Verfahren fest, und der Punkt gilt in der Einrichtung als erledigt.',
    buttons: {
      switch: 'Verfahren umstellen',
      alreadySet: 'Bereits eingestellt',
      confirm: 'Verfahren bestätigen',
    },
    languagesSection: {
      heading: 'Sprachen der Ausdrucke',
      intro: 'Die gedruckten Blätter erklären das Gästeportal mit Piktogrammen seiner Knöpfe – dazu Text in einer Hauptsprache und wahlweise einer zweiten. Die <b>erste</b> Sprache ist zugleich die der Zugangs-E-Mail.',
    },
    noticesSection: {
      heading: 'Aushänge für die Zimmer',
      intro: 'Im Verfahren mit festem QR-Code je Zimmer braucht jedes Zimmer seinen Aushang. Die Codes werden einmal gedruckt und bleiben gültig – bis Sie einen Code erneuern, etwa wenn ein Aushang abhandenkommt.',
      linkTitle: 'Aushänge ansehen und drucken',
      linkDescription: 'DIN A4 je Zimmer oder vier kompakte Karten je Seite – fehlende Codes erzeugen, einzelne erneuern',
      hidden: 'Die Aushänge für die Zimmer sind ausgeblendet, weil dieses Haus individuelle Zugänge nutzt. Sie erscheinen hier wieder, sobald Sie auf feste QR-Codes je Zimmer umstellen.',
    },
  },

  languages: {
    unsavedLabel: 'Sprachen',
    first: 'Erste Sprache',
    firstHint: 'Größer gesetzt · Sprache der E-Mail',
    second: 'Zweite Sprache',
    secondHint: 'Kleiner darunter · nur auf dem Ausdruck',
    none: '– keine –',
    save: 'Sprachen speichern',
    alreadySet: 'Bereits eingestellt',
    saved: 'Gespeichert. Die nächsten Ausdrucke und E-Mails folgen der neuen Wahl.',
    recommendation: 'Englisch als zweite Sprache ist die Empfehlung: Wer weder Ihre Landessprache noch Englisch liest, kommt über die Piktogramme und den QR-Code weiter – im Gästeportal kann er den Text mit dem Handy übersetzen. Eine dritte und vierte Sprache auf Papier hilft weniger, als sie an Platz kostet.',
  },

  logo: {
    none: 'Kein Logo – die Blätter tragen den Namen des Hauses',
    upload: 'Logo hochladen',
    replace: 'Logo austauschen',
    remove: 'Entfernen',
    hint: 'PNG, JPG oder SVG, höchstens 1 MB. Auf dem Blatt steht es oben links, höchstens 55 × 16 mm. Ein helles Logo für dunkle Hintergründe ist auf weißem Papier unsichtbar – die Vorschau links zeigt es so, wie es gedruckt wird.',
    tooLarge: 'Die Datei ist zu groß ({kb} KB). Höchstens 1 MB.',
    lowResolution: 'Das Bild ist nur {width} px breit. Auf dem Blatt wird es rund 55 mm breit gedruckt und wirkt dann unscharf – ab {min} px sieht es sauber aus.',
  },

  myAccess: {
    title: 'Mein Zugang',
    roles: {
      admin: 'Inhaber',
      manager: 'Manager',
      reception: 'Rezeption',
    },
    signIn: {
      heading: 'Anmeldung',
      email: 'E-Mail (Anmeldung)',
      role: 'Rolle in diesem Haus',
      hint: 'Mit dieser Adresse melden Sie sich an. Ändern lässt sie sich weiter unten.',
    },
    email: {
      heading: 'Anmelde-Adresse ändern',
      current: 'Aktuelles Passwort',
      next: 'Neue E-Mail-Adresse',
      hint: 'An die neue Adresse geht ein Bestätigungslink; erst der Klick darauf stellt um. Bis dahin melden Sie sich weiter mit der bisherigen Adresse an. Danach bekommt die bisherige Adresse einen Hinweis. Passwort, Rollen und Verlauf bleiben, wie sie sind.',
      ownerHint: 'Als Inhaber bekommen Sie Rechnungen künftig an die neue Adresse. Rechnungsdaten, Zahlungsweg und Plan bleiben unverändert.',
      send: 'Bestätigungslink senden',
      releaseAndResend: 'Adresse freigeben und erneut senden',
      sentTo: 'Bestätigungslink an {email} verschickt. Bitte im Postfach dieser Adresse auf den Link klicken – er gilt {hours} Stunden.',
      pending: 'Offene Änderung: Bestätigung an {email} ausstehend, gültig bis {until}.',
      cancel: 'Änderung abbrechen',
      cancelled: 'Änderung abgebrochen. Der verschickte Link gilt nicht mehr.',
      notConfigured: 'Der E-Mail-Versand ist nicht eingerichtet – ohne Bestätigungslink lässt sich die Adresse nicht ändern.',
      errors: {
        invalid: 'Bitte eine gültige E-Mail-Adresse angeben.',
        same: 'Das ist bereits Ihre Anmelde-Adresse.',
        currentMissing: 'Bitte das aktuelle Passwort eingeben.',
        currentWrong: 'Das aktuelle Passwort stimmt nicht.',
        notAllowed: 'Für diesen Zugang lässt sich die Adresse hier nicht ändern.',
        failed: 'Die Änderung konnte nicht angelegt werden: {message}',
      },
    },
    /** Seite hinter dem Bestätigungslink (`/auth/email-bestaetigen`). */
    confirm: {
      title: 'Neue Anmelde-Adresse bestätigen',
      intro: 'Ab dem Bestätigen melden Sie sich bei RoSe mit <b>{email}</b> an. Passwort und Rollen bleiben, wie sie sind.',
      button: 'Adresse bestätigen',
      done: 'Erledigt – Ihre Anmelde-Adresse lautet jetzt <b>{email}</b>. Melden Sie sich ab sofort damit an.',
      toLogin: 'Zur Anmeldung',
      invalid: 'Dieser Link ist ungültig, abgelaufen oder wurde schon benutzt. Fordern Sie unter „Mein Zugang“ einen neuen an.',
      taken: 'Zu dieser Adresse gibt es bereits einen Zugang zu RoSe. Eine Adresse kann nur zu einem Zugang gehören – die Anmelde-Adresse wurde nicht geändert.',
      failed: 'Die Umstellung ist fehlgeschlagen. Bitte später erneut versuchen oder unter „Mein Zugang“ einen neuen Link anfordern.',
    },
    /** E-Mails des Ablaufs: Bestätigung an die neue Adresse, Hinweis an die bisherige. */
    mails: {
      confirm: {
        subject: 'Bitte bestätigen: neue Anmelde-Adresse für RoSe',
        intro: 'für Ihren RoSe-Zugang wurde diese Adresse als neue Anmelde-Adresse angegeben. Erst mit dem Klick auf den Knopf wird sie wirksam.',
        button: 'Adresse bestätigen',
        note: 'Der Link gilt {hours} Stunden. Haben Sie diese Änderung nicht veranlasst, ignorieren Sie die E-Mail einfach – dann ändert sich nichts.',
      },
      changed: {
        subject: 'Ihre Anmelde-Adresse für RoSe wurde geändert',
        intro: 'die Anmelde-Adresse Ihres RoSe-Zugangs wurde soeben geändert. Neue Adresse: <b>{email}</b>. An diese Adresse gehen künftig alle E-Mails von RoSe, auch Links zum Zurücksetzen des Passworts.',
        notYou: 'Waren Sie das nicht? Dann hat jemand Ihr Passwort benutzt. Wenden Sie sich sofort an den Inhaber Ihres Hauses; ist der Inhaberzugang selbst betroffen, an uns – die Kontaktadresse steht im Impressum: {imprint}',
      },
    },
    displayName: {
      heading: 'Anzeigename',
      label: 'Name',
      hint: 'Steht in der Kopfzeile und im Zimmer-Verlauf – dort zeigt er an, wer eingecheckt oder eine Anfrage erledigt hat. Betreuen Sie mehrere Häuser, gilt der Name in allen.',
      saved: 'Name gespeichert.',
      save: 'Namen speichern',
    },
    password: {
      heading: 'Passwort ändern',
      current: 'Aktuelles Passwort',
      next: 'Neues Passwort (mind. 8 Zeichen)',
      repeat: 'Wiederholen',
      hint: 'Das aktuelle Passwort wird abgefragt, damit eine offen stehende Sitzung nicht genügt, um Sie aus Ihrem Zugang auszusperren. Vergessen? Dann über „Passwort vergessen“ auf der Anmeldeseite.',
      saved: 'Passwort geändert.',
      save: 'Passwort ändern',
    },
  },

  testScenario: {
    title: 'Test-Szenario',
    heading: 'Test-Szenario (vorübergehend)',
    intro: 'Erzeugt eine fingierte Belegungs- und Reinigungslage zum Durchspielen der Portale – mit echten Aufenthalten (PINs funktionieren im Gästeportal), zufällig über die Zimmer verteilt. Gleicher Seed ergibt dieselbe Verteilung. Vorher wird der aktuelle Stand komplett zurückgesetzt.',
    signals: {
      none: '–',
      please_clean: 'Reinigung gewünscht',
      dnd: 'Bitte nicht stören',
    },
    confirmSeed: 'Achtung: Alle aktuellen Aufenthalte werden ausgecheckt und alle Zimmerstatus zurückgesetzt, bevor das Szenario aufgebaut wird. Fortfahren?',
    confirmReset: 'Alle aktiven Aufenthalte auschecken, Zimmerstatus neutralisieren und offene Anfragen löschen?',
    confirmPurge: 'Testdaten vollständig entfernen?\n\nGelöscht werden ALLE Aufenthalte, Anfragen, Zimmer-Verläufe und Einträge der Reinigung dieses Hauses – auch die, die nicht aus einem Szenario stammen. Zimmer und Personal bleiben.\n\nDanach sind alle Zimmer wieder ohne Historie und lassen sich ohne Datenverlust löschen.',
    sliders: {
      occupied: 'Belegte Zimmer',
      pleaseClean: 'davon Reinigungswunsch',
      dnd: 'davon „Bitte nicht stören“',
      checkedOut: 'Freie Zimmer ausgecheckt & ungereinigt',
      /** Live-Vorschau neben dem Schieber. */
      preview: '{count} von {total}',
    },
    priority: 'Priorisiert (absolut)',
    orders: 'Anfragen (absolut)',
    seed: 'Seed',
    rollSeed: 'Neuen Seed würfeln',
    resetDone: 'Alles zurückgesetzt – keine aktiven Aufenthalte, keine offenen Wünsche oder Anfragen mehr.',
    purged: 'Testdaten entfernt: {stays}, {orders}, {transitions}, {staffLog}. Alle Zimmer sind wieder ohne Historie.',
    purgedCounts: {
      stays: { one: '{count} Aufenthalt', other: '{count} Aufenthalte' },
      orders: { one: '{count} Anfrage', other: '{count} Anfragen' },
      transitions: { one: '{count} Verlaufseintrag', other: '{count} Verlaufseinträge' },
      staffLog: { one: '{count} Eintrag der Reinigung', other: '{count} Einträge der Reinigung' },
    },
    summaryTitle: 'Szenario steht (Seed {seed}):',
    table: {
      room: 'Zimmer',
      pin: 'Gast-PIN',
      signal: 'Signal',
      since: 'seit',
      yesterday: 'gestern',
      today: 'heute',
    },
    summaryLine: 'Ausgecheckt: {checkedOut} · Priorisiert: {priority} · Anfragen: {orders}',
    noneListed: 'keine',
    create: 'Szenario erzeugen',
    reset: 'Alles zurücksetzen',
    purge: 'Testdaten vollständig entfernen',
    purgeTitle: 'Aufenthalte, Anfragen, Verlauf und Einträge der Reinigung des Hauses löschen',
    footnote: '„Alles zurücksetzen“ checkt nur aus – die Belege bleiben stehen, und damit bleibt jedes Zimmer historienbehaftet. „Testdaten vollständig entfernen“ räumt sie ab, sodass Zimmer danach wieder spurlos gelöscht werden können.',
    notes: {
      ordersCapped: {
        one: 'Nur {count} belegtes Zimmer – Anfragen auf {orders} gekappt.',
        other: 'Nur {count} belegte Zimmer – Anfragen auf {orders} gekappt.',
      },
      noServices: 'Keine Services eingerichtet – Anfragen übersprungen.',
      ordersFailed: 'Anfragen anlegen fehlgeschlagen: {message}',
    },
  },

  errors: {
    houseNameTooShort: 'Der Name des Hauses muss mindestens 2 Zeichen haben.',
    slugInvalid: 'Die Adresse darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten (höchstens {max} Zeichen, nicht mit einem Bindestrich beginnen oder enden).',
    dailyTimeMissing: 'Uhrzeit für die tägliche Reinigung fehlt (z. B. 10:00).',
    checkoutMissing: 'Uhrzeit für „Check-out bis“ fehlt (z. B. 11:00).',
    checkinMissing: 'Uhrzeit für „Check-in ab“ fehlt (z. B. 15:00).',
    deferMissing: 'Uhrzeit, bis zu der Gäste aufschieben dürfen, fehlt (z. B. 11:00).',
    timeZoneInvalid: 'Die Zeitzone ist ungültig.',
    windowMissing: 'Für das Zeitfenster der Reinigung fehlen Start- und Endzeit.',
    windowSame: 'Start- und Endzeit des Zeitfensters dürfen nicht gleich sein.',
    slugTaken: 'Diese Adresse ist bereits vergeben.',
    displayNameTooShort: 'Der Name muss mindestens 2 Zeichen haben.',
    displayNameTooLong: 'Der Name ist zu lang (höchstens 60 Zeichen).',
    saveFailed: 'Speichern fehlgeschlagen: {message}',
    passwordTooShort: 'Das Passwort braucht mindestens 8 Zeichen.',
    passwordMismatch: 'Die Passwörter stimmen nicht überein.',
    currentPasswordMissing: 'Bitte geben Sie das aktuelle Passwort an.',
    currentPasswordWrong: 'Das aktuelle Passwort stimmt nicht.',
    samePassword: 'Das ist bereits Ihr aktuelles Passwort.',
    noFile: 'Keine Datei gewählt.',
    unknownLanguage: 'Unbekannte Sprache.',
    secondLanguageSame: 'Die zweite Sprache muss eine andere sein.',
    unknownMode: 'Unbekanntes Verfahren.',
    noRooms: 'Keine Zimmer angelegt.',
    cleanupFailed: 'Aufräumen fehlgeschlagen: {message}',
    resetStatesFailed: 'Zimmerstatus zurücksetzen fehlgeschlagen: {message}',
    deleteHistoryFailed: 'Verlauf löschen fehlgeschlagen: {message}',
    createStaysFailed: 'Aufenthalte anlegen fehlgeschlagen: {message}',
    setStatesFailed: 'Zimmerstatus setzen fehlgeschlagen: {message}',
  },
}
