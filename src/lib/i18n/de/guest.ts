/**
 * Gästeportal — deutsche Texte. Erste ausgelagerte Fläche (10.10.2026).
 *
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`: Gast wird gesiezt,
 * das Haus spricht als „unser Haus“, „Anfrage“ für alles, was der Gast
 * auslöst, „Bestellen“ bzw. „Melden“ je nach Art des Services, „Bitte nicht
 * stören“ und „Heute keine Reinigung“ als zwei verschiedene Zustände.
 * Typografie: „…“ und „ – “.
 *
 * Die Knopf-Beschriftungen (`signal.clean.label`, `signal.dnd.label`,
 * `services.heading`) erscheinen auch als Legende auf den gedruckten
 * Blättern — `guest-guide.test.ts` hält beide gleich.
 */
export const guest = {
  brand: {
    portal: 'Gästeportal',
    signIn: 'Gästeportal – Anmeldung',
  },

  login: {
    room: 'Zimmer {number}',
    roomNumber: 'Zimmernummer',
    roomNumberPlaceholder: 'z. B. 101',
    pin: 'PIN',
    submit: 'Anmelden',
    submitting: 'Anmelden …',
    pinHint: 'Die PIN erhalten Sie beim Check-in an der Rezeption.',
    linkModeHint:
      'Unser Haus arbeitet mit persönlichen Zugängen: Bitte scannen Sie den QR-Code auf dem Blatt, das Sie beim Check-in erhalten haben, oder öffnen Sie den Link aus Ihrer E-Mail. Das Formular unten gilt nur, wenn Sie beim Check-in eine PIN erhalten haben.',
    invalidLink: 'Dieser Link ist ungültig.',
    invalidLinkHint: 'Bitte wenden Sie sich an die Rezeption – oder melden Sie sich mit Zimmernummer und PIN an.',
  },

  /** Mandantenfreie Hinweisseite `/guest` — hier spricht RoSe, nicht ein bestimmtes Haus. */
  entry: {
    scanTitle: 'Bitte scannen Sie den QR-Code im Zimmer.',
    scanText:
      'Alternativ funktioniert die Adresse des Hauses – sie steht auf dem Blatt, das Sie beim Check-in erhalten haben. Die Rezeption hilft Ihnen jederzeit weiter.',
    expiredTitle: 'Dieser Zugang ist nicht mehr gültig.',
    expiredText:
      'Der Zugang galt für einen Aufenthalt und ist mit dem Check-out erloschen. Für einen neuen Aufenthalt erhalten Sie an der Rezeption einen neuen Zugang – sie hilft Ihnen jederzeit weiter.',
  },

  status: {
    room: 'Zimmer {number}',
    signOut: 'Abmelden',
    inProgress: {
      title: 'Ihr Zimmer wird gerade gereinigt.',
      text: 'Das Reinigungsteam ist im Zimmer.',
    },
    scheduled: {
      title: 'Die Reinigung ist vorgesehen.',
      text: 'Das Reinigungsteam kommt heute vorbei.',
    },
    scheduledFrom: {
      title: 'Reinigung heute ab {time} Uhr.',
      guest: 'Ihr Wunsch ist angekommen – vorher kommt niemand.',
      door: 'Wie an der Tür besprochen – vorher kommt niemand.',
      daily: 'Unser Haus reinigt täglich. Wenn Sie heute keine Reinigung brauchen, tippen Sie auf „Heute keine Reinigung“.',
    },
    dnd: {
      title: 'Keine Reinigung – Sie möchten nicht gestört werden.',
      text: 'Nehmen Sie „Bitte nicht stören“ zurück, wenn Ihr Zimmer doch gereinigt werden soll.',
    },
    done: {
      title: 'Ihr Zimmer wurde heute um {time} Uhr gereinigt.',
      text: 'Brauchen Sie noch etwas? Dann tippen Sie auf „Zimmer reinigen“.',
    },
    declined: {
      title: 'Heute keine Reinigung.',
      text: 'Danke – das spart Wasser und Waschmittel. Anders überlegt? Dann tippen Sie auf „Zimmer reinigen“.',
    },
    departure: {
      title: 'Heute ist Ihr Abreisetag.',
      text: 'Das Zimmer wird nach dem Check-out gereinigt. Brauchen Sie vorher etwas, tippen Sie auf „Zimmer reinigen“.',
    },
    none: {
      title: 'Heute ist keine Reinigung vorgesehen.',
      firstDay: 'Ab morgen reinigt unser Haus täglich ab {time} Uhr. Wenn Sie heute etwas brauchen, tippen Sie auf „Zimmer reinigen“.',
      onRequest: 'Unser Haus reinigt auf Wunsch – tippen Sie auf „Zimmer reinigen“, wenn Sie es möchten.',
    },
  },

  signal: {
    clean: {
      label: 'Zimmer reinigen',
      active: 'Wunsch ist aktiv – erneut tippen zum Zurücknehmen',
      activeFrom: 'Wunsch ist aktiv – frühestens ab {time} Uhr. Erneut tippen zum Zurücknehmen',
      blocked: 'Zurzeit nicht möglich',
      idle: 'Das Reinigungsteam wird informiert',
      idleFrom: 'Das Reinigungsteam kommt frühestens ab {time} Uhr',
    },
    defer: {
      title: 'Frühestens ab',
      now: 'jetzt',
      onlyNow: 'Heute nur noch sofort möglich.',
      limit:
        'Sie können die Reinigung bis spätestens <b>{limit} Uhr</b> aufschieben – vorher kommt niemand. Diese Grenze legt unser Haus fest, damit die Reinigung noch am selben Tag stattfinden kann.',
    },
    window:
      'Reinigungswünsche nehmen wir täglich zwischen <b>{start}</b> und <b>{end}</b> Uhr entgegen. Bitte melden Sie sich in diesem Zeitraum noch einmal – oder wenden Sie sich an die Rezeption.',
    skip: {
      label: 'Heute keine Reinigung',
      active: 'Danke! Gilt nur für heute – erneut tippen zum Zurücknehmen',
      idle: 'Bestellungen kommen trotzdem. Morgen wird wieder gereinigt.',
    },
    dnd: {
      label: 'Bitte nicht stören',
      active: 'Aktiv – erneut tippen zum Zurücknehmen',
      idle: 'Niemand klopft – auch kein Service.',
    },
  },

  services: {
    heading: 'Service bestellen',
    links: 'Angebote',
    opensExternally: '{host} · öffnet in einem neuen Fenster',
    orders: 'Ihre Anfragen',
    notePlaceholder: 'Anmerkung (optional)',
    order: 'Bestellen',
    report: 'Melden',
    sending: 'Wird gesendet …',
    sent: 'Ihre Anfrage ist bei der Rezeption.',
    fallbackName: 'Service',
    orderStatus: {
      open: 'in Bearbeitung',
      done: 'erledigt',
      cancelled: 'nicht erbracht',
    },
  },

  errors: {
    loginFailed: 'Anmeldung fehlgeschlagen – Zimmernummer oder PIN falsch.',
    pinFormat: 'Bitte die PIN eingeben (nur Ziffern).',
    tooManyAttempts: 'Zu viele Fehlversuche – bitte in {minutes} Min. erneut versuchen.',
    tooManyFromNetwork: 'Zu viele Fehlversuche aus diesem Netz – bitte in {minutes} Min. erneut versuchen.',
    sessionExpired: 'Sitzung abgelaufen – bitte neu anmelden.',
    invalidSignal: 'Ungültige Auswahl.',
    outsideWindow: 'Reinigungswünsche sind nur zwischen {start} und {end} Uhr möglich.',
    deferNotAllowed: 'Aufschieben ist hier nicht möglich.',
    deferPast: 'Die gewählte Uhrzeit ist schon vorbei.',
    deferTooLate: 'Aufschieben ist nur bis {time} Uhr möglich.',
    saveFailed: 'Speichern fehlgeschlagen – bitte erneut versuchen.',
    serviceUnavailable: 'Dieser Service ist nicht mehr verfügbar.',
    serviceIsLink: 'Dieser Eintrag ist ein Link und nimmt keine Anfragen an.',
    pickOption: 'Bitte mindestens eine Option auswählen.',
    sendFailed: 'Anfrage konnte nicht gesendet werden – bitte erneut versuchen.',
    onRequestOnly: 'Unser Haus reinigt nur auf Wunsch.',
  },
}

export type GuestMessages = typeof guest
