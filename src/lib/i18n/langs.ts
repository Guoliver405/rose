/**
 * Sprachen der gedruckten Blätter — nur die Kennungen, ohne Texte. Getrennt
 * von `sheets.ts`, damit Browser-Komponenten (Sprachwahl in den
 * Einstellungen) die Liste kennen, ohne alle Sprachdateien ins Bundle zu
 * ziehen. Reihenfolge = Druckreihenfolge.
 */
export const GUIDE_LANGS = ['de', 'en', 'es', 'fr'] as const
export type GuideLang = (typeof GUIDE_LANGS)[number]
