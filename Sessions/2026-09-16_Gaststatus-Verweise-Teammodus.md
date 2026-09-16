# 16.09.2026 — Reinigungsstatus im Gastportal, Verweise im Baukasten, Team-Modus

Drei Wünsche aus der Feature-Diskussion des Users, in der abgesprochenen
Reihenfolge gebaut; die ETA im Gastportal wurde auf Rat hin verworfen.

## 1. Reinigungsstatus im Gastportal (Commit `24e7a60`, gepusht)

`guestCleaningStatus` in `src/lib/board.ts` (7 Tests) leitet aus denselben
Quellen wie die Boards ab, woran der Gast ist. Fünf Zustände statt der vier
aus der Anfrage — „vorgesehen" zerfällt in „ab HH:MM" (Aufschub des Gastes
oder Routine vor der Fälligkeit) und „das Team kommt". Karte
`GuestCleaningStatusCard.tsx` über den Knöpfen; der alte „wird gerade
gereinigt"-Hinweis im Signal-Panel ist darin aufgegangen.

Zwei Feinheiten, die im Test stehen: „gereinigt" zählt nur ab
`stays.checked_in_at` (der `clean_done` von gestern Abend gehört zum
Vorgänger-Check-out), und ein neuer Wunsch nach der Reinigung geht vor
„gereinigt", weil der Abschluss den Wunsch zurücksetzt.

Im Browser geprüft (lokal, Hotel zum Glück, Zimmer 1209): vorgesehen →
Nicht stören → zurück auf vorgesehen (Routine fällig). Keine Konsolenfehler.

## 2. Verweise im Service-Baukasten (Commit `700a17e`, **nicht gepusht**)

Migration `Supabase_sql/2026-09-16_service_definitions_link.sql`:
`service_definitions.link_url` (nullable, CHECK auf `http(s)`). Nicht null =
Verweis: Kachel im Gastportal, öffnet in neuem Tab, erzeugt nie eine
Anfrage (`placeOrderAction` weist ab). Vorlagen in
`src/lib/service-link-templates.ts` (Trinkgeld ohne URL, Lieferando, Wolt,
Uber Eats, GrabFood, foodpanda) füllen nur das Formular vor.
`normalizeLinkUrl` getestet (javascript:/data:/mailto: fallen durch).

Verlinken statt einbetten: kein fremdes Skript, kein Cookie-Banner.
Trinkgeld nur auf Hausebene, weil das Gastportal keine Namen nennt.

## 3. Team-Modus (Commit folgt, **nicht gepusht**)

Migration `Supabase_sql/2026-09-16_staff_log_team_modus.sql`:
`staff_log.profile_id` nullable, neue Spalte `session_id uuid` (Index).

- `src/lib/staff-tracking.ts` (getestet): `parseStaffTracking`,
  `pairingKey`, `groupForPairing`, `anonymizeCutoff`.
- `src/utils/staff-tracking.ts`: `anonymizeSession` (Schichtende),
  `anonymizeStale` (Schichtbeginn, Umschalten der Einstellung; auch
  `room_state_transitions.actor_id` mit Quelle `maid`).
- `deriveShiftState` trägt `sessionId`; `logStitch` schreibt ihn an jeden
  Stich; `finishCleaningAction`/`abortCleaningAction` lesen den
  Schichtzustand parallel zum Zimmer (kein zusätzlicher Roundtrip in Reihe).
- Auswertung: Gruppierung über `pairingKey` (Person: je Kraft, Team: je
  Schicht), im Team-Modus nur Hausbilanz plus Hinweis, `demand.ts` paart
  über `key`. Zimmer-Verlauf: „Reinigungsteam", Kräfte-IDs werden nicht
  aufgelöst. `/service/status`: Hinweis, dass die Tagesbilanz nur während
  der Schicht sichtbar ist.
- Einstellung „Tätigkeiten der Reinigung" unter Hotel & Regeln, mit dem
  ehrlichen Satz zum Randfall mit einer Kraft. Lotsen-Schritt
  `regeln.personenbezug`, Hilfe-Einträge in Regeln und Auswertung.

## Nachweis im Browser (16.09., nach dem Einspielen der Migrationen)

Migrationen vom User eingespielt, archiviert, alles gepusht. Lokaler
Dev-Server gegen die Produktions-DB, Testhaus „Stripe-Testhaus Karte":

- **Verweis:** Vorlage „Lieferando" füllt Name, Beschreibung, Adresse und
  Hinweis vor; nach „Anlegen" steht der Eintrag mit Pille „Verweis", ohne
  Dringend/Meldung-Knöpfe, mit Adressfeld und „Testen". Im Gastportal
  (Zimmer 101) eigener Abschnitt „Angebote", `href` = Vorlagen-URL,
  `target=_blank`, `rel="noopener noreferrer"`, Host und „öffnet in einem
  neuen Fenster" sichtbar.
- **Statuskarte:** „keine Reinigung vorgesehen" (Haus ohne Routine) →
  „vorgesehen" nach dem Tipp → „wird gerade gereinigt" → „heute um 21:48
  Uhr gereinigt". Damit sind alle Zustände außer „ab HH:MM" und Abreisetag
  im Browser gesehen (die im Unit-Test).
- **Team-Modus:** Einstellung gespeichert (`policies.staffTracking = team`),
  Kraft „teamtest" angelegt, Schicht → Reinigung 101 → Abschluss →
  Schichtende über die Slider. DB vor dem Schichtende: vier Stiche mit
  `profile_id` und derselben `session_id`; nach dem Schichtende alle vier
  `profile_id IS NULL`, Session unverändert. Zimmer-Verlauf zeigt
  „Reinigungsteam" für Start, Abschluss und den aufgehobenen Wunsch.
  Auswertung: Hausbilanz 1 Schicht, 1 Zimmer, Team-Hinweis, keine Tabelle.
  Statusseite der Kraft: Hinweis vorhanden, Tagesbilanz nach dem Schichtende
  leer (so gewollt). Zwei fehlende Leerzeichen im Hinweistext behoben.
- `room_state_transitions.actor_id` der Kraft steht noch (jünger als 24 h) —
  der Verlauf löst ihn im Team-Modus ohnehin nicht auf; `anonymizeStale`
  räumt ihn mit dem nächsten Schichtbeginn.

Nebenprodukt: Das Testhaus steht jetzt im Team-Modus, mit Verweis
„Lieferando", Kraft „teamtest" (PIN 224158) und offenem Aufenthalt in 101.

Offen: `npm run test:integration` einmal laufen lassen (die Testwelt
schreibt `staff_log` ohne `session_id` — das bleibt erlaubt).

## 🔖 Wiederaufnahme

Stand: alles auf `main` und in Produktion. Dev-Server-Konfiguration
`rose-dev` in `.claude/launch.json`; DB-Sonden `scripts/.probe/db.mjs`
(Häuser, Aufenthalte mit PIN) und `scripts/.probe/log.mjs` (staff_log des
Testhauses), beide in `.gitignore`.
