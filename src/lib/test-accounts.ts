/**
 * Testzugänge ohne Mailversand — VORÜBERGEHEND, gehört mit dem Test-Szenario
 * ausgebaut.
 *
 * Im Testbetrieb sollen sich schnell fiktive Rezeptions- und Manager-Zugänge
 * anlegen lassen, ohne dass jeder Tester ein echtes Postfach beisteuern muss
 * (davon gibt es nie genug). Statt einer Einladung entsteht der Zugang direkt,
 * das Passwort wird einmal angezeigt.
 *
 * **Bewusst an eine Umgebungsvariable gebunden und nicht nur an ein Häkchen.**
 * Einladungen haben im Juli 2026 die vorgelesenen Passwörter abgelöst, damit
 * kein Passwort je außerhalb des Kopfes seiner Person existiert. Ein Häkchen,
 * das jeder Kunde anklicken kann, holte genau das zurück. Fehlt die Variable,
 * gibt es den Weg nicht — dasselbe Muster wie bei `SIGNUP_INVITE_CODE`.
 *
 * Nur serverseitig verwenden: `process.env` ohne `NEXT_PUBLIC_`-Präfix ist im
 * Browser leer, und genau das ist hier erwünscht.
 */
export function testzugaengeErlaubt(): boolean {
  return process.env.ALLOW_TEST_ACCOUNTS === '1'
}
