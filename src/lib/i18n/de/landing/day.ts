/**
 * Tagesbild (`CleaningSimulation`): Oberfläche, Legende und Spaltentitel —
 * auf der Landing Page (`#vergleich`) und im Simulator. Die Texte aus der
 * Rechnung (Hinweise, Protokoll) stehen in `simulator.app.day`.
 * „Kraft {name}“ ist die knappe Beschriftung einer simulierten Reinigungskraft.
 */
export const day = {
  titles: { paper: 'Ohne Steuerung', rose: 'Mit RoSe' },

  /** Beschreibung der beiden Bilder auf der Landing Page, je Stellung des Umschalters. */
  lead: {
    paper: {
      routine: 'Papierliste je Etage. Wann jemand abreist, weiß niemand; was an den Türen hängt und was ein Gast gesagt hat, erfährt nur, wer auf die Etage kommt.',
      onDemand: 'Papierliste und Türanhänger „Bitte reinigen“ – zu sehen nur für den, der im Flur steht.',
    },
    rose: {
      routine: 'Gemeinsames Board: Check-out, Wunsch, „frühestens ab“, „Bitte nicht stören“ und „später“ – sofort für alle.',
      onDemand: 'Gäste tippen „Zimmer reinigen“ oder „frühestens ab“ – sofort auf dem Board, für alle.',
    },
  },

  policy: {
    label: 'Bleibezimmer reinigen:',
    aria: 'Reinigung der Bleibezimmer',
    routine: 'täglich',
    onDemand: 'nur auf Wunsch',
    note: 'gilt für beide Bilder – verglichen wird nur die Koordination',
  },

  controls: {
    pause: 'Pause',
    again: 'Noch einmal',
    play: 'Abspielen',
    reset: 'Zurück auf {time}',
    minuteBack: 'Eine Minute zurück',
    minuteForward: 'Eine Minute vor',
    minute: '1 Min',
    clock: 'Uhrzeit',
  },

  legend: {
    states: {
      occupied: 'Gast im Zimmer',
      departed: 'ausgecheckt',
      wants: 'Gast weg, Reinigung offen',
      dnd: 'Bitte nicht stören',
      declined: 'abgelehnt – heute keine Reinigung',
      deferred: '„frühestens ab“ – mit RoSe als Uhrzeit bekannt',
      skipped: 'keine Reinigung gewünscht',
      empty: 'leer',
      cleaning: 'wird gereinigt',
      done: 'fertig',
    },
    later: 'Gast noch da – „später“ (ohne Software weiß es nur, wer geklopft hat)',
    repeat: 'klopft erneut, obwohl jemand aus dem Team es schon gehört hat',
    priority: 'Sonderfall (priorisiert)',
    maids: 'Reinigungskraft {range}',
    idle: 'wartet – gerade nichts zu tun',
    search: 'geht Etagen ab und sucht Arbeit',
  },

  panel: {
    /** Nach der Etagennummer, nur auf breiten Bildschirmen („3. OG“). */
    floorSuffix: '. OG',
    departuresReady: 'Abreisen bezugsfertig',
    /** `<b>` wird als Zahl hervorgehoben. */
    status: 'Alles fertig <b>{time}</b> · vergeblich an der Tür <b>{count}×</b>',
  },

  activity: {
    now: 'Jetzt: ',
    nobody: 'noch niemand unterwegs',
    item: '<b>{count}</b> {label}',
    labels: {
      clean: 'reinigen',
      door: 'an der Tür',
      walk: 'unterwegs',
      search: 'suchen Arbeit',
      radio: 'am Funk',
      idle: 'warten',
      done: 'fertig',
    },
    totals: 'Bisher an der Tür <b>{door} min</b> · gewartet <b>{idle} min</b>',
    totalsSearch: 'Bisher an der Tür <b>{door} min</b> · gewartet <b>{idle} min</b> · Etagen abgesucht <b>{search} min</b>',
  },

  /** Tooltip einer Kachel mit „später“ an der Tür. */
  later: {
    title: '{nr}: Gast noch da, „später“ – {who}',
    all: 'alle wissen es',
    one: 'nur Kraft {name} weiß es',
  },

  /** Kleingedrucktes unter dem Vergleich auf der Landing Page; `<link>` führt zum Simulator. */
  caption: 'Ohne Steuerung zeigt ein typisches herkömmliches Verfahren: Papierliste vom Morgen, feste Etagen je Reinigungskraft, Abreisen zuerst, sobald sie laut Liste frei sind. Andere Verfahren – etwa Check-outs per Funk von der Rezeption oder frei gewählte Etagen – stellt der <link>Housekeeping-Simulator</link> gegenüber, mit den Zahlen Ihres Hauses. Ein gewöhnlicher Tag: der mittlere aus 101 durchgerechneten, gemessen am Vorsprung bei den Abreisen in beiden Stellungen des Umschalters. {rooms} Zimmer auf {floors} Etagen, {maids} Reinigungskräfte ab 8:00 (ohne Software je zwei feste Etagen), Check-out bis 11:00, Check-in ab 15:00. Dieselben Gäste in beiden Bildern: Sie reisen zwischen 7:00 und 11:00 ab bzw. verlassen das Zimmer, gleichverteilt – je später, desto eher lohnt das Klopfen. Täglich: Bleibezimmer in beiden Bildern ab 8:00, ohne Software laut Liste, mit RoSe über das beim Check-in eingetragene Abreisedatum. Annahmen zum Gästeverhalten: {signals} % der Gäste mit Reinigungswunsch zeigen ihn beim Gehen an (auf Wunsch: alle), {notBefore} % nennen in RoSe „frühestens ab“, {dnd} % haben morgens „Bitte nicht stören“ an der Tür, ein Drittel davon den ganzen Tag. Ohne Software sieht eine Reinigungskraft Anhänger und Schilder erst auf der Etage; was ein Gast an der Tür sagt, steht auf einer Liste, die auf der Etage bleibt – wer dorthin kommt, liest sie (2 min), wer aushilft, fragt im Team nach. Mit RoSe steht all das sofort für alle auf dem Board. Etagenwechsel mit Wagen 5 min. Reinigungsdauer als Annahme, eher knapp: Abreisezimmer 30 min, Bleibezimmer 18 min – gemessen wurden 35–43 bzw. 20–25 min (Quellen Q4 und Q7 im Nutzenrechner).',
}
