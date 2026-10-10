import { sheet as de, type SheetMessages } from './de/sheet'
import { sheet as en } from './en/sheet'
import { sheet as es } from './es/sheet'
import { sheet as fr } from './fr/sheet'

/**
 * Sprachen der gedruckten Blätter und der Zugangs-Mail an den Gast — ein
 * eigener Satz neben den Sprachen der Oberfläche (`LOCALES`): Das Blatt war
 * schon viersprachig, bevor die Oberfläche übersetzt wurde. Reihenfolge =
 * Druckreihenfolge.
 */
export const GUIDE_LANGS = ['de', 'en', 'es', 'fr'] as const
export type GuideLang = (typeof GUIDE_LANGS)[number]

export const SHEETS: Record<GuideLang, SheetMessages> = { de, en, es, fr }

export type { SheetMessages }
