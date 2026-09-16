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

## Offen — vor dem Push

1. **Beide Migrationen im Supabase-SQL-Editor einspielen** (additiv, in
   beliebiger Reihenfolge): `2026-09-16_service_definitions_link.sql`,
   `2026-09-16_staff_log_team_modus.sql`. Danach per `git mv` nach
   `Supabase_sql/archive/`.
2. Dann `git push` — bis dahin würde der Live-Code `link_url` und
   `session_id` selektieren, die es noch nicht gibt (Services-Seite und
   Gast-Portal blieben leer, Stiche schlügen fehl).
3. Browser-Nachweis für 2 und 3 (lokal oder Produktion): Verweis anlegen
   und im Gastportal öffnen; Team-Modus einschalten, Schicht stechen, Zimmer
   reinigen, Schicht beenden, Auswertung und Verlauf ansehen, in der DB
   `profile_id IS NULL` und `session_id` gesetzt nachmessen.
4. `npm run test:integration` einmal laufen lassen (die Testwelt schreibt
   `staff_log` ohne `session_id` — das bleibt erlaubt).

## 🔖 Wiederaufnahme

Stand: drei Commits lokal auf `main`, der erste (`24e7a60`) ist gepusht und
in Produktion, die beiden anderen warten auf die Migrationen (siehe oben).
Dev-Server-Konfiguration `rose-dev` in `.claude/launch.json`; DB-Sonde
`scripts/.probe/db.mjs` (in `.gitignore`) listet Häuser und aktive
Aufenthalte mit PIN.
