/**
 * Nutzenrechner der Landing Page (`RoiCalculator`, Rechnung in `roi.ts`).
 * Die Quellen stehen hier als Text je Kennung; Kennung und Adresse liefert
 * `ROI_SOURCES` in `roi.ts`.
 */
export const roi = {
  heading: 'Was gewinnt Ihr Haus?',
  intro: 'Zwei Hebel, die sich beziffern lassen: entfallende Reinigungen und weniger Leerlauf je Reinigung. Alles andere – weniger Wäsche, weniger Beschwerden, der Arbeitsnachweis – rechnen wir nicht ein.',

  inputs: {
    rooms: 'Zimmer',
    occupancy: 'Auslastung',
    nights: 'Ø Aufenthaltsdauer',
    nightsValue: { one: '{nights} Nacht', other: '{nights} Nächte' },
    hourly: 'Kosten einer Reinigungsstunde',
    hourlyHint: 'Lohn plus Nebenkosten*',
  },

  cost: {
    label: 'RoSe kostet',
    sub: 'im Monat, zzgl. USt. · mindestens ein voller Monat frei',
  },
  savings: {
    label: 'RoSe spart etwa',
    sub: 'Reinigungszeit im Monat, mit den Annahmen unten*',
  },

  bars: {
    skipped: 'Entfallende Reinigungen von Bleibezimmern ({count} im Monat)',
    coordination: 'Weniger Leerlauf bei {count} verbleibenden Reinigungen',
  },
  hours: '{count} h',
  minutes: '{value} min',
  percent: '{value} %',
  planning: 'Gesparte Stunden werden nur zu gesparten Kosten, wenn die Einsatzplanung mitzieht. RoSe zeigt dafür in der Auswertung, wie viel Reinigungszeit tatsächlich anfällt.',

  assumptions: {
    toggle: 'Annahmen anpassen*',
    preset: 'Voreinstellung:',
    presets: { vorsichtig: 'vorsichtig', typisch: 'typisch' },
    a1: {
      label: 'A1 · Dauer der Reinigung eines Bleibezimmers',
      hint: 'Gemessen 20–25 min, je Zimmer allgemein 15–30 min – 18 min rechnet vorsichtig [Q3, Q4, Q7, Q8]',
    },
    a2: {
      label: 'A2 · Gäste, die auf die tägliche Reinigung verzichten',
      hint: '20 % Planungswert, 34 % in einer Fallstudie, 70 % wünschen es [Q1–Q3]',
    },
    a3: {
      label: 'A3 · Weniger Leerlauf je Reinigung',
      hint: 'Hersteller nennen 25–67 % – wir nehmen ≈ 7–10 % [Q6]',
    },
    formula: {
      one: 'Anteil Bleibezimmer = 1 − 1 / Aufenthaltsdauer (bei {nights} Nacht {share} der belegten Zimmer). Monat = {days} Tage. Stundenkosten-Vorgabe: Mindestlohn 13,90 € × 1,23 Lohnnebenkosten [Q5].',
      other: 'Anteil Bleibezimmer = 1 − 1 / Aufenthaltsdauer (bei {nights} Nächten {share} der belegten Zimmer). Monat = {days} Tage. Stundenkosten-Vorgabe: Mindestlohn 13,90 € × 1,23 Lohnnebenkosten [Q5].',
    },
  },

  sources: {
    summary: '* Quellen der Annahmen',
    link: 'Quelle',
    note: 'Herstellerangaben sind als solche gekennzeichnet; eine deutsche Erhebung zum Verzichtsverhalten kennen wir nicht. Alle Werte sind Schätzungen, keine Zusicherung.',
    items: {
      Q1: 'AHLA, „Hotel Room Cleaning Practices Reflect Guest Preferences“, 2022 – 70 % der Gäste wünschen keine tägliche Reinigung; 38 % nur auf Wunsch, 19 % nur beim Check-out.',
      Q2: 'Lodging Magazine, „The Value of Opting Out“, 2024 – 20 % Verzicht als Planungswert eines Hilton-Hauses.',
      Q3: 'CityShift Finance, Opt-out-Fallstudie – 34 % Verzicht nach 18 Monaten; 25 Minuten je Bleibezimmer; Ersparnis nur bei angepasster Einsatzplanung.',
      Q4: 'Zeitstudie Heath & Company, berichtet in Hotel Business, 2018 – Abreisezimmer im Schnitt 43 Minuten, Bleibezimmer knapp 20 Minuten weniger (USA).',
      Q5: 'Gesetzlicher Mindestlohn 13,90 €/h ab 2026 (DGB); Destatis: rund 23 € Lohnnebenkosten je 100 € Bruttoverdienst.',
      Q6: 'Herstellerangaben zu Housekeeping-Software: 25–67 % Produktivitätsgewinn (Stayntouch, Flexkeeping via Lodging Magazine) – wir rechnen bewusst mit einem Bruchteil davon.',
      Q7: 'Reinigung Aktuell, 2015 – Abreisezimmer rund 35, Bleibezimmer rund 25 Minuten, etwa 14 Zimmer je Reinigungskraft (Vier-Sterne-Haus, Wien).',
      Q8: 'CCOHS (kanadische Arbeitsschutzbehörde), „Hotel Housekeeping“ – 15 bis 30 Minuten je Zimmer, rund 16 Zimmer je Schicht.',
    },
  },
}
