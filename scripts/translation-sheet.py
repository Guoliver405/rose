"""
Tabelle zum Gegenlesen einer Übersetzung (17.10.2026).

    python scripts/translation-sheet.py guest en Sessions/Uebersetzung-guest-en.xlsx

Holt die Texte über `translation-export.mjs` (Sprachdateien und Erläuterungen
in `src/lib/i18n/`) und schreibt eine Excel-Datei: Schlüssel, Ort,
Erläuterung, Deutsch, Übersetzung, Korrektur. Korrekturen werden von Hand
zurück in `src/lib/i18n/<sprache>/<bereich>.ts` übertragen.
"""
import json
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.table import Table, TableStyleInfo

LANG_NAMES = {"en": "Englisch, US", "es": "Spanisch", "fr": "Französisch"}
AREA_NAMES = {"guest": "Gästeportal", "service": "Reinigungsboard", "admin": "Rezeption", "mail": "E-Mails", "print": "Druckseiten"}
READERS = {
    "guest": "• Leser ist der Gast, am Handy. Höflich und schlicht; das Haus spricht als „we“ (nie „hotel“ – auch Pensionen nutzen RoSe).",
    "admin": "• Leser sind Rezeption, Inhaber und Manager, am Rechner oder Tablet. Sachlich und freundlich; „property“ statt „hotel“; Begriffe wie in den Portalen („front desk“, „access card“, „check-in sheet“, „room sign“, „Do not disturb“, „No cleaning today“).",
    "mail": "• Leser der E-Mails sind Personal und Kontoinhaber; die Statuszeile liest die Verwaltung unter einem Sende-Knopf.",
    "print": "• Bedienung der Druckseiten für die Rezeption; Aufstellung und Zugangskarte werden gedruckt und ausgehändigt.",
    "service": "• Leserin ist eine Reinigungskraft, am Handy zwischen zwei Zimmern. Kurz und freundlich; Begriffe wie im Gästeportal („Do not disturb“, „No cleaning today“, „front desk“). Zustände auf den Zimmer-Kacheln höchstens zwei bis drei Wörter.",
}


def main() -> None:
    area, lang, out = (sys.argv[1:4] + [None, None, None])[:3]
    area = area or "guest"
    lang = lang or "en"
    root = Path(__file__).resolve().parent.parent
    out = Path(out) if out else root / "Sessions" / f"Uebersetzung-{area}-{lang}.xlsx"

    raw = subprocess.run(
        ["node", "--import", (root / "scripts" / "ts-resolve.mjs").as_uri(), str(root / "scripts" / "translation-export.mjs"), area, lang],
        check=True, capture_output=True,
    ).stdout.decode("utf-8")
    data = json.loads(raw)
    sprache = LANG_NAMES.get(lang, lang)
    bereich = AREA_NAMES.get(area, area)

    wb = Workbook()
    intro = wb.active
    intro.title = "Anleitung"
    zeilen = [
        (f"{bereich} – Übersetzung {sprache} zum Gegenlesen", True),
        ("", False),
        ("So geht’s", True),
        ("1. Reiter „Texte“: Spalte „Übersetzung“ lesen. Ort und Erläuterung sagen, wo der Text steht und was dabei zählt.", False),
        ("2. Ist etwas falsch oder holprig, die bessere Fassung in „Korrektur“ eintragen. Leer lassen heißt: passt.", False),
        ("3. Fragen oder Zweifel gehören in „Anmerkung“.", False),
        ("", False),
        ("Für alle Texte", True),
        (READERS.get(area, ""), False),
        ("• Amerikanisches Englisch (Entscheidung vom 17.10.2026).", False),
        ("• Platzhalter wie {time} oder {number} und Auszeichnungen wie <b>…</b> müssen stehen bleiben; ihre Stellung im Satz darf sich ändern.", False),
        ("• Uhrzeiten erscheinen im 24-Stunden-Format (10:00), unabhängig von der Sprache.", False),
        ("• Knopf-Beschriftungen kurz halten (etwa 20 Zeichen) – sie stehen auch auf dem gedruckten Check-in-Blatt.", False),
        ("• Typografie wie auf dem englischen Check-in-Blatt: “…”, Auslassungszeichen …, Gedankenstrich — mit Leerzeichen.", False),
        ("", False),
        (f"{len(data['rows'])} Texte · erzeugt aus src/lib/i18n/de/{area}.ts, {lang}/{area}.ts und de/{area}.context.ts", False),
    ]
    for i, (text, bold) in enumerate(zeilen, start=1):
        cell = intro.cell(row=i, column=1, value=text)
        cell.font = Font(bold=bold, size=14 if i == 1 else 11)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
    intro.column_dimensions["A"].width = 120

    ws = wb.create_sheet("Texte")
    kopf = ["Schlüssel", "Ort", "Erläuterung", "Deutsch", f"Übersetzung ({sprache})", "Korrektur", "Anmerkung"]
    ws.append(kopf)
    for r in data["rows"]:
        ws.append([r["key"], r["where"], r["note"], r["de"], r["target"], "", ""])

    breiten = [26, 38, 48, 48, 48, 40, 30]
    for i, w in enumerate(breiten, start=1):
        ws.column_dimensions[chr(64 + i)].width = w
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        row[0].font = Font(name="Consolas", size=9, color="666666")
        row[4].font = Font(bold=True)
        row[5].fill = PatternFill("solid", fgColor="FFF7D6")
        row[6].fill = PatternFill("solid", fgColor="FFF7D6")

    ende = f"G{len(data['rows']) + 1}"
    table = Table(displayName="Texte", ref=f"A1:{ende}")
    table.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
    ws.add_table(table)
    ws.freeze_panes = "B2"

    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    print(f"{out} ({len(data['rows'])} Texte)")


if __name__ == "__main__":
    main()
