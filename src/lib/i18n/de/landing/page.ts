/**
 * Landing Page (`/`) — Abschnitte der Seite, Link-Vorschau (`opengraph-image`).
 * Begriffe nach `Sessions/Begriffe-Entscheidungen.md`, mit den für die
 * Landing Page entschiedenen Abweichungen: „Hotel“, wo es um die Branche
 * geht, „Housekeeping“ als Abteilungs- und Produktname. Gesiezt.
 *
 * Preise und Zahlen kommen aus `pricing.ts` und werden als Platzhalter
 * eingesetzt (`{price}`, `{min}`, `{rooms}`), nie in den Text geschrieben.
 */
export const page = {
  meta: {
    title: 'RoSe – RoomService für Hotels jeder Größe',
    description:
      'Reinigungswünsche, „Bitte nicht stören“ und Service-Anfragen der Gäste landen live bei Rezeption und Housekeeping – ohne Gast-App, ohne PMS-Projekt. {price} je Zimmer und Monat, mindestens ein voller Monat frei.',
    ogDescription:
      'Check-in per Klick, Gäste per QR-Code, Reinigung im Takt. Drei Portale für Rezeption, Housekeeping und Gäste.',
    ogLocale: 'de_DE',
    siteName: 'RoSe – RoomService',
  },

  header: {
    homeAria: 'RoSe – Startseite',
    nav: { product: 'Produkt', flow: 'So funktioniert’s', pricing: 'Preise', faq: 'FAQ' },
    signIn: 'Anmelden',
    start: 'Kostenlos starten',
  },

  hero: {
    badge: 'Vom Gasthof bis zur Hotelkette',
    /** `<hl>` wird farbig hervorgehoben. */
    title: 'Reinigung steuern und Services anbieten – <hl>digital und effizient</hl>',
    text: 'Der Gast tippt „Zimmer reinigen“, die Rezeption sieht es sofort, das Housekeeping arbeitet es vom Board ab. RoSe verbindet alle Bereiche in Echtzeit – in einem intuitiven System, ohne Schulung, Datenprobleme oder PMS-Projekt.',
    start: 'Kostenlos starten',
    demo: 'Produkt Demo',
  },

  painPoints: [
    {
      pain: '„Zimmer 204 wollte doch keine Reinigung?“',
      fix: 'Gäste melden Reinigungswunsch oder „Bitte nicht stören“ selbst – das Board zeigt es live, ohne Zuruf über den Flur und ohne Türhänger.',
    },
    {
      pain: '„Wer ist gerade in welchem Zimmer?“',
      fix: 'Reinigungskräfte bestätigen Start und Abschluss mit einem Wisch – Rezeption und Team sehen sofort, wo gearbeitet wird.',
    },
    {
      pain: '„Noch ein System, noch eine Schulung …“',
      fix: 'Drei aufgeräumte Portale, jedes zeigt nur, was die Rolle braucht. Reinigungskräfte melden sich per Zugangskarte an, Gäste brauchen gar kein Konto.',
    },
  ],

  formula: {
    heading: 'Die RoSe-Formel',
    terms: {
      portal: { means: 'Mobiles Gästeportal', effect: 'bessere Servicequalität' },
      cleaning: { means: 'Gesteuerte Zimmerreinigung', effect: 'spart Kosten, schont die Umwelt' },
      flow: { means: 'Digitaler Informationsfluss', effect: 'Übersicht und Nachvollziehbarkeit' },
    },
    footnote: 'Kein PMS-Projekt, keine Schulung, in wenigen Minuten eingerichtet – {price} je Zimmer im Monat, einen Monat kostenlos testen.',
  },

  sustainability: {
    sealTop: 'Reinigung',
    sealBottom: 'auf Wunsch',
    badge: 'Nachhaltig gastgeben',
    heading: 'Reinigung nur, wenn der Gast sie möchte',
    text: 'Die tägliche Zimmerreinigung ist Gewohnheit, kein Wunsch: 70 % der Gäste brauchen sie nicht jeden Tag. Mit RoSe wird „Reinigung auf Wunsch“ zum Standard Ihres Hauses – die Gäste tippen, wenn sie etwas möchten, und alles andere bleibt unangetastet. Das spart Wasser, Waschmittel und Energie, und es ist ein Nachhaltigkeits-Argument, das Sie Gästen und Buchungsportalen sichtbar machen können.',
    wins: {
      water: {
        title: 'Wasser und Waschmittel',
        text: 'Jede ausgelassene Zwischenreinigung spart eine Ladung Bettwäsche und Handtücher – und die Chemie dazu.',
      },
      energy: {
        title: 'Energie und Wege',
        text: 'Kein Staubsauger, kein Wagen über den Flur, keine Fahrt zur Wäscherei für ein Zimmer, das niemand gereinigt haben wollte.',
      },
      guests: {
        title: 'Gäste entscheiden selbst',
        text: 'Ein Tipp im Gästeportal statt Türhänger. Wer Reinigung möchte, bekommt sie – wer nicht, wird nicht gestört.',
      },
    },
    footnote: 'Die tägliche Reinigung ab der zweiten Nacht bleibt als Option einschaltbar – das Haus entscheidet, nicht die Software.',
  },

  product: {
    heading: 'Drei Portale, drei Benutzertypen, ein Zusammenwirken',
    intro: 'Jede Rolle bekommt genau die Oberfläche, die sie braucht – verbunden in Echtzeit. Hier läuft es live: ein Tipp, alle sehen es.',
    portals: {
      reception: {
        title: 'Rezeption',
        lead: 'Ein Klick checkt ein, ein Klick checkt aus.',
        points: [
          'Check-in erzeugt sofort den Gästezugang – PIN am Bildschirm, Check-in-Blatt zum Drucken oder per E-Mail',
          'Zimmer-Übersicht mit Live-Status; Prioritäten für Beschwerden und Sonderfälle',
          'Service-Anfragen als Aufgabenliste, Dringende blinken rot',
        ],
      },
      guests: {
        title: 'Gäste',
        lead: 'QR scannen – fertig. Keine App, kein Konto.',
        points: [
          'Zimmer-QR plus PIN, oder ein persönlicher Link je Aufenthalt – das Haus wählt',
          '„Zimmer reinigen“ oder „Bitte nicht stören“ mit einem Tipp',
          'Services bestellen – vom Wäscheservice bis zum Frühstück aufs Zimmer',
        ],
      },
      housekeeping: {
        title: 'Housekeeping',
        lead: 'Ein Board für das ganze Team.',
        points: [
          'Etagen-Ansicht: Wünsche, Abreisen, Prioritäten – mit Empfehlung, wo es sich zu starten lohnt',
          'Start und Abschluss per Wisch; wer gerade in welchem Zimmer ist, sieht das ganze Team live',
          'Anmeldung per Zugangskarte, Schicht und Pause mit zwei Fingertipps, Auswertung inklusive',
        ],
      },
    },
  },

  flow: {
    heading: 'So funktioniert’s',
    intro: 'Vom Check-in bis zur fertigen Reinigung – fünf Schritte, kein Zuruf, kein Zettel.',
    panels: {
      checkin: {
        who: 'Rezeption',
        title: 'Check-in per Klick',
        text: 'Ein Klick auf das Zimmer – RoSe legt den anonymen Aufenthalt an und erzeugt den Zugang.',
      },
      access: {
        who: 'Gast',
        title: 'Zugang in der Hand',
        text: 'PIN auf dem Check-in-Blatt, Aushang im Zimmer oder Link per E-Mail – kein Konto, keine App.',
      },
      tap: {
        who: 'Gast',
        title: 'Ein Tipp im Zimmer',
        text: '„Zimmer reinigen“, „Bitte nicht stören“ oder eine Anfrage aus dem Service-Baukasten.',
      },
      visible: {
        who: 'Rezeption',
        title: 'Sofort sichtbar',
        text: 'Die Glocke an der Zimmer-Kachel, die Anfrage in der Liste – Dringendes blinkt rot.',
      },
      board: {
        who: 'Housekeeping',
        title: 'Gezielt und gesteuert',
        text: 'Priorisiert und zuvorkommend – automatisch am Bedarf ausgerichtet und in Abstimmung der Mitarbeitenden.',
      },
    },
    checkout: 'Check-out ist wieder ein Klick: der Zugang erlischt sofort, das Zimmer wandert als „ausgecheckt“ aufs Board.',
  },

  comparison: {
    heading: 'Derselbe Tag, mit und ohne RoSe',
    intro: '100 Zimmer, gleiche Gäste, gleiche Reinigungskräfte. Der Unterschied ist allein, was sie wissen und wonach sie das nächste Zimmer wählen – ob Ihr Haus täglich reinigt oder nur auf Wunsch.',
    simulatorTitle: 'Mit den Zahlen Ihres Hauses rechnen',
    simulatorText: 'Etagen, Zimmer, Personal, Zeiten und Gästeverhalten einstellen – der Housekeeping-Simulator rechnet viele Tage durch. Kostenlos, mit E-Mail-Adresse, ohne Zahlungsdaten.',
    simulatorLink: 'Zum Simulator',
  },

  features: {
    heading: 'Durchdacht bis ins Detail',
    items: {
      qr: {
        title: 'QR-Codes je nach Bedarf',
        text: 'Gästezugänge je Zimmer mit PIN, oder je Aufenthalt individuell generieren. Alles mit einem Klick.',
      },
      secure: {
        title: 'Sicher ohne Konten',
        text: 'Unerratbare Zimmer-Codes, PIN je Aufenthalt, Sperre nach Fehlversuchen – auch gegen Durchprobieren aus dem Netz.',
      },
      dnd: {
        title: '„Bitte nicht stören“ wird respektiert',
        text: '„Bitte nicht stören“ lässt das Zimmer fürs Housekeeping verschwinden – niemand klopft umsonst.',
      },
      daily: {
        title: 'Tägliche Reinigung',
        text: 'Optional: ab der zweiten Nacht setzt RoSe die tägliche Reinigung zur Wunschzeit aufs Board – auch in einem Zeitfenster.',
      },
      services: {
        title: 'Service-Baukasten',
        text: 'Eigene Services mit Optionen, Preisen und Priorisierung anlegen – Gäste bestellen digital und ohne Verzögerung.',
      },
      print: {
        title: 'Druckfertig',
        text: 'Check-in-Blatt für den Gast, Aushänge und Zugangskarten fürs Team – alles aus dem Browser, oder per E-Mail.',
      },
      green: {
        title: 'Nachhaltig auf Wunsch',
        text: 'Reinigung nur, wenn der Gast sie möchte – weniger Wasser, Waschmittel und Wege, und ein sichtbares Argument für Ihr Nachhaltigkeits-Profil.',
      },
      proof: {
        title: 'Nachweis statt Bauchgefühl',
        text: 'Zimmer-Verlauf und Arbeitszeit-Auswertung je Reinigungskraft – für Beschwerden, Lohnabrechnung und Personalplanung.',
      },
    },
  },

  useCases: {
    heading: 'Gemacht für Häuser jeder Größe',
    intro: 'Vom Familienbetrieb bis zur Kette – RoSe skaliert mit, ohne dass irgendwo eine IT-Abteilung nötig wird.',
    items: {
      small: {
        title: 'Pension, Gasthof & Ferienwohnungen',
        text: 'Die Rezeption ist oft gleichzeitig Küche, Service und Housekeeping. RoSe hält den Überblick: Wer reist ab, wo wird Reinigung gewünscht, was wurde bestellt – ohne Zettelwirtschaft. Ab {min} im Monat.',
      },
      boutique: {
        title: 'Boutique- & Aparthotel',
        text: 'Längere Aufenthalte, wechselnde Reinigungskräfte: Zugangskarten statt Passwort-Chaos, die tägliche Reinigung meldet sich ab der zweiten Nacht von selbst, „Bitte nicht stören“ und Wünsche steuern die Gäste selbst.',
      },
      city: {
        title: 'Stadthotel mit mehreren Etagen',
        text: 'Eigenes oder externes Housekeeping: Das Etagen-Board empfiehlt, wo es sich zu starten lohnt, und die Rezeption sieht live, wer wo arbeitet. Die Auswertung liefert Arbeits- und Reinigungszeiten je Reinigungskraft.',
      },
      chain: {
        title: 'Hotelkette & Resort',
        text: 'Ein Konto, beliebig viele Häuser; Manager sehen ihre Häuser, die Rezeption nur ihr eigenes. Prioritäten lenken bei Beschwerden sofort um, vergessene Abschlüsse verfallen automatisch – ohne Zimmer-Limit.',
      },
    },
  },

  pricing: {
    heading: 'Ein Preis. Keine Pakete.',
    intro: 'RoSe kostet je Zimmer – nicht je Funktion. Alles ist immer drin, egal ob acht Zimmer oder achthundert.',
    badge: 'Mindestens ein voller Monat kostenlos',
    perRoom: 'je Zimmer und Monat, zzgl. USt.',
    minimum: 'Mindestbetrag <b>{min}</b> im Monat – bis {rooms} Zimmer zahlen Sie also einen Festpreis.',
    included: [
      'Alle drei Portale – Rezeption, Housekeeping, Gäste',
      'Beliebig viele Häuser, Zugänge und Reinigungskräfte',
      'Service-Baukasten, tägliche Reinigung, Zeitfenster',
      'Aushänge, Check-in-Blätter, Zugangskarten, E-Mail an Gäste',
      'Zimmer-Verlauf und Arbeitszeit-Auswertung',
      'Hell, dunkel, barrierearm – auf jedem Gerät',
    ],
    whatCounts: '<b>Was zählt als Zimmer?</b> Jedes Zimmer, das im Monat auch nur vorübergehend in Betrieb war. Zimmer außer Betrieb (Renovierung, Saison) zählen nicht.',
    terms: '<b>Keine Laufzeit.</b> Monatlich kündbar, Abrechnung nachträglich je Kalendermonat. Der Mindestbetrag gilt je Konto, nicht je Haus. Details in den <link>AGB</link>.',
    start: 'Kostenlos starten',
  },

  faq: {
    heading: 'Häufige Fragen',
    items: [
      {
        q: 'Brauchen Gäste eine App oder ein Konto?',
        a: 'Nein. Gäste scannen den QR-Code im Zimmer und geben die PIN vom Check-in ein – oder öffnen ihren persönlichen Link vom Check-in-Blatt bzw. aus der E-Mail. Alles läuft im Browser.',
      },
      {
        q: 'Ersetzt RoSe unser Buchungssystem oder PMS?',
        a: 'Bewusst nicht. RoSe kümmert sich um den Aufenthalt im Haus – Reinigung, Wünsche, Services. Buchung, Preise und Abrechnung bleiben, wo sie sind. Es gibt nichts zu integrieren.',
      },
      {
        q: 'Welche Daten speichert RoSe über Gäste?',
        a: 'Keine Namen, keine Kontaktdaten. Ein Aufenthalt ist anonym: Zimmer, Zeitraum, Zugang. Beim Check-out erlischt der Zugang sofort. Auch eine E-Mail-Adresse für den Zugangs-Link wird nicht gespeichert.',
      },
      {
        q: 'Wo liegen die Daten?',
        a: 'Datenbank und Serverfunktionen laufen in der EU (Irland). Zugriffe sind je Haus getrennt, Verbindungen verschlüsselt. Details stehen in der Datenschutzerklärung.',
      },
      {
        q: 'Was brauchen die Reinigungskräfte?',
        a: 'Ein beliebiges Smartphone oder Tablet. Anmeldung per gedruckter Zugangskarte oder Benutzername + PIN – keine E-Mail-Adressen nötig.',
      },
      {
        q: 'Was kostet RoSe genau?',
        a: '{price} je Zimmer und Monat, mindestens {min} im Monat, zzgl. USt. Frei sind der Kalendermonat der Registrierung und der erste volle Monat danach – mindestens ein voller Monat. Keine Pakete, keine Zimmergrenzen, monatlich kündbar.',
      },
      {
        q: 'Wie lange dauert die Einrichtung?',
        a: 'Zimmer anlegen (auch als Bereich „301–310“), Aushänge drucken, Zugangskarten drucken – realistisch wenige Minuten. Beispiel-Services sind schon da. Es gibt nichts zu installieren.',
      },
      {
        q: 'Kann ich RoSe jetzt schon ausprobieren?',
        a: 'Ja. In der Testphase ist die Registrierung noch auf eingeladene Häuser beschränkt – mit Einladungscode ist Ihr Konto in einer Minute angelegt, mindestens der erste volle Monat ist frei.',
      },
    ],
  },

  signup: {
    heading: 'Haus in einer Minute anlegen',
    text: 'Konto, Haus und Beispiel-Services entstehen in einem Zug – danach nur noch die Zimmer eintragen. Mindestens der erste volle Monat ist frei; in der Testphase brauchen Sie dafür einen Einladungscode.',
    start: 'Kostenlos starten',
    haveAccess: 'Ich habe schon einen Zugang',
  },

  footer: {
    tagline: '– RoomService, leichtgewichtig.',
    reception: 'Rezeption',
    housekeeping: 'Housekeeping',
    guests: 'Gästeportal',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    terms: 'AGB',
  },

  /** Link-Vorschau (`opengraph-image.tsx`), 1200 × 630. */
  og: {
    alt: 'RoSe – Reinigung, Wünsche und Services in einem Takt',
    claim: 'Reinigung, Wünsche und Services – in einem Takt',
    sub: 'Drei Portale für Rezeption, Housekeeping und Gäste. Ohne Gast-App, ohne PMS-Projekt.',
    price: '{price} je Zimmer und Monat · erster voller Monat frei',
    floor: 'Etage 2',
    counts: '2 offen · 1 in Arbeit',
    tiles: {
      occupied: 'belegt',
      ready: 'bereit',
      wants: 'Reinigung',
      checkedOut: 'ausgecheckt',
      priority: 'priorisiert',
      dnd: 'Bitte nicht stören',
    },
    checkin: 'Check-in 207',
    pin: 'PIN 4827',
  },
}
