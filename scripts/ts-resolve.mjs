/**
 * Auflösungs-Haken für Skripte, die Sprachdateien direkt laden (17.10.2026):
 * Die Dateien importieren einander ohne Endung (`./common`), wie Next es
 * erlaubt. Node entfernt die Typen selbst, findet die Datei aber nicht —
 * `ts-resolve-hooks.mjs` hängt `.ts` bzw. `/index.ts` an.
 *
 *   node --import ./scripts/ts-resolve.mjs scripts/translation-export.mjs admin en
 */
import { register } from 'node:module'

register('./ts-resolve-hooks.mjs', import.meta.url)
