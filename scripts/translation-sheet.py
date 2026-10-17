"""
Tabelle zum Gegenlesen einer Übersetzung (17.10.2026).

    python scripts/translation-sheet.py guest en Sessions/Uebersetzung-guest-en.xlsx
    python scripts/translation-sheet.py all en Sessions/Uebersetzung-alle-en.xlsx

Holt die Texte über `translation-export.mjs` (Sprachdateien und Erläuterungen
in `src/lib/i18n/`) und schreibt eine Excel-Datei: Schlüssel, Ort,
Erläuterung, Deutsch, Übersetzung, Korrektur, Anmerkung. Mit `all` stehen
alle Bereiche in einer Datei, je Bereich ein Reiter. Korrekturen werden von
Hand zurück in `src/lib/i18n/<sprache>/…` übertragen.
"""
import json
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.table import Table, TableStyleInfo

LANG_NAMES = {"en": "Englisch, US", "es": "Spanisch", "fr": "Französisch"}

# Reihenfolge = Reiter-Reihenfolge bei `all`. Reitername höchstens 31 Zeichen.
AREAS = {
    "guest": ("Gästeportal", "Gästeportal"),
    "service": ("Reinigungsboard", "Reinigungsboard"),
    "admin": ("Rezeption", "Rezeption"),
    "mail": ("E-Mails", "E-Mails"),
    "print": ("Druckseiten", "Druckseiten"),
    "help": ("Hilfe und Lotsen", "Hilfe und Lotsen"),
    "symbols": ("Zimmer-Symbole (Hilfe)", "Zimmer-Symbole"),
    "sheet": ("Check-in-Blatt und Aushang", "Check-in-Blatt"),
}

READERS = {
    "guest": "Leser ist der Gast, am Handy. Höflich und schlicht; das Haus spricht als „we“ (nie „hotel“ – auch Pensionen nutzen RoSe).",
    "service": "Leserin ist eine Reinigungskraft, am Handy zwischen zwei Zimmern. Kurz und freundlich; Begriffe wie im Gästeportal („Do not disturb“, „No cleaning today“, „front desk“). Zustände auf den Zimmer-Kacheln höchstens zwei bis drei Wörter.",
    "admin": "Leser sind Rezeption, Inhaber und Manager, am Rechner oder Tablet. Sachlich und freundlich; „property“ statt „hotel“; Begriffe wie in den Portalen („front desk“, „access card“, „check-in sheet“, „room sign“).",
    "mail": "Leser der E-Mails sind Personal und Kontoinhaber; die Statuszeile liest die Verwaltung unter einem Sende-Knopf.",
    "print": "Bedienung der Druckseiten für die Rezeption; Aufstellung und Zugangskarte werden gedruckt und ausgehändigt.",
    "help": "Leser sind Rezeption, Inhaber und Manager. Erklärend; Namen von Knöpfen und Seiten in Anführungszeichen wortgleich mit der Oberfläche. „Lotse“ heißt „guide“.",
    "symbols": "Legende der Zimmer-Kacheln in der Hilfe: kurze Namen der Zeichen und eine Erklärung je Zeichen.",
    "sheet": "Gedrucktes Blatt für den Gast und die Zugangs-E-Mail. Gibt es schon seit September viersprachig; hier zur Vollständigkeit.",
}

GENERAL = [
    "Platzhalter wie {time} oder {number} und Auszeichnungen wie <b>…</b> müssen stehen bleiben; ihre Stellung im Satz darf sich ändern.",
    "Amerikanisches Englisch (Entscheidung vom 17.10.2026).",
    "Uhrzeiten erscheinen im 24-Stunden-Format (10:00), unabhängig von der Sprache.",
    "Knopf-Beschriftungen kurz halten – manche stehen auch auf gedrucktem Papier oder auf schmalen Kacheln am Handy.",
    "Typografie: “…”, Auslassungszeichen …, Gedankenstrich — mit Leerzeichen.",
]


def export(root: Path, area: str, lang: str) -> dict:
    raw = subprocess.run(
        ["node", "--no-warnings", "--import", (root / "scripts" / "ts-resolve.mjs").as_uri(),
         str(root / "scripts" / "translation-export.mjs"), area, lang],
        check=True, capture_output=True,
    ).stdout.decode("utf-8")
    return json.loads(raw)


def write_texts(ws, rows: list, sprache: str, table_name: str) -> None:
    ws.append(["Schlüssel", "Ort", "Erläuterung", "Deutsch", f"Übersetzung ({sprache})", "Korrektur", "Anmerkung"])
    for r in rows:
        ws.append([r["key"], r["where"], r["note"], r["de"], r["target"], "", ""])
    for i, w in enumerate([26, 38, 48, 48, 48, 40, 30], start=1):
        ws.column_dimensions[chr(64 + i)].width = w
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        row[0].font = Font(name="Consolas", size=9, color="666666")
        row[4].font = Font(bold=True)
        row[5].fill = PatternFill("solid", fgColor="FFF7D6")
        row[6].fill = PatternFill("solid", fgColor="FFF7D6")
    table = Table(displayName=table_name, ref=f"A1:G{len(rows) + 1}")
    table.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
    ws.add_table(table)
    ws.freeze_panes = "B2"


def write_intro(ws, title: str, lines: list) -> None:
    for i, (text, bold) in enumerate([(title, True), ("", False)] + lines, start=1):
        cell = ws.cell(row=i, column=1, value=text)
        cell.font = Font(bold=bold, size=14 if i == 1 else 11)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
    ws.column_dimensions["A"].width = 120


def main() -> None:
    area, lang, out = (sys.argv[1:4] + [None, None, None])[:3]
    area = area or "guest"
    lang = lang or "en"
    root = Path(__file__).resolve().parent.parent
    out = Path(out) if out else root / "Sessions" / f"Uebersetzung-{area}-{lang}.xlsx"
    sprache = LANG_NAMES.get(lang, lang)
    areas = list(AREAS) if area == "all" else [area]

    wb = Workbook()
    intro = wb.active
    intro.title = "Anleitung"
    data = {a: export(root, a, lang) for a in areas}

    how = [
        ("So geht’s", True),
        ("1. Je Bereich ein Reiter. Spalte „Übersetzung“ lesen; Ort und Erläuterung sagen, wo der Text steht und was dabei zählt.", False),
        ("2. Ist etwas falsch oder holprig, die bessere Fassung in „Korrektur“ eintragen. Leer lassen heißt: passt.", False),
        ("3. Fragen oder Zweifel gehören in „Anmerkung“.", False),
        ("", False),
        ("Für alle Texte", True),
    ] + [(f"• {g}", False) for g in GENERAL]
    if area == "all":
        how += [("", False), ("Bereiche", True)]
        how += [(f"• {AREAS[a][0]} ({len(data[a]['rows'])} Texte): {READERS[a]}", False) for a in areas]
        total = sum(len(d["rows"]) for d in data.values())
        how += [("", False), (f"Zusammen {total} Texte · erzeugt aus src/lib/i18n/", False)]
        title = f"RoSe – alle Texte, Übersetzung {sprache} zum Gegenlesen"
    else:
        how += [(f"• {READERS.get(area, '')}", False), ("", False),
                (f"{len(data[area]['rows'])} Texte · erzeugt aus src/lib/i18n/", False)]
        title = f"{AREAS.get(area, (area,))[0]} – Übersetzung {sprache} zum Gegenlesen"
    write_intro(intro, title, how)

    for a in areas:
        ws = wb.create_sheet(AREAS[a][1] if area == "all" else "Texte")
        write_texts(ws, data[a]["rows"], sprache, f"Texte_{a}")

    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    print(f"{out} ({sum(len(d['rows']) for d in data.values())} Texte)")


if __name__ == "__main__":
    main()
