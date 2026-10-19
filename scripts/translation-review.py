"""
Gegenlesen aller Sprachen in EINER Liste (19.10.2026, Wunsch des Users):

    python scripts/translation-review.py export Sessions/Uebersetzungen-Review.xlsx
    python scripts/translation-review.py apply  Sessions/Uebersetzungen-Review.xlsx            # trägt Korrekturen ein
    python scripts/translation-review.py apply  Sessions/Uebersetzungen-Review.xlsx --dry-run  # zeigt nur, was passieren würde

**export** schreibt ein Blatt mit einer Zeile je Text: Bereich, Schlüssel,
Ort, Erläuterung, Deutsch und je Sprache (Englisch, Französisch, Spanisch)
die Übersetzung und eine leere Korrekturspalte, am Ende eine Anmerkung.
Filtern nach Bereich über die Tabellen-Kopfzeile.

**apply** liest die Korrekturspalten und ersetzt in `src/lib/i18n/<sprache>/…`
genau den Text dieses Schlüssels. Gesucht wird der Text, der beim Export in
der Übersetzungsspalte stand, und zwar nur in den Dateien des Bereichs; kommt
er dort mehrfach vor, wird nichts geändert und die Zeile gemeldet — dann von
Hand. Ändert sich ein Text zwischen Export und Rückspielen, wird die Zeile
ebenfalls gemeldet statt geraten. Anschließend für Französisch
`node scripts/fr-typo.mjs` (das Skript ruft es selbst auf) und `npm run verify`.

Abgleich über den Schlüssel, nicht über die Zeilennummer: Sortieren,
Filtern oder gelöschte Zeilen im Blatt schaden nicht.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.table import Table, TableStyleInfo

ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "src" / "lib" / "i18n"
LANGS = [("en", "Englisch"), ("fr", "Französisch"), ("es", "Spanisch")]

# Bereich → (Anzeigename, Datei bzw. Ordner relativ zu src/lib/i18n/<sprache>/)
AREAS = {
    "guest": ("Gästeportal", "guest.ts"),
    "service": ("Reinigungsboard", "service.ts"),
    "admin": ("Rezeption", "admin"),
    "mail": ("E-Mails", "mail.ts"),
    "print": ("Druckseiten", "print.ts"),
    "account": ("Konto und Abrechnung", "account"),
    "auth": ("Anmeldung", "auth.ts"),
    "simulator": ("Simulator", "simulator"),
    "landing": ("Landing Page", "landing"),
    "help": ("Hilfe und Lotsen", "help"),
    "symbols": ("Zimmer-Symbole", "symbols.ts"),
    "sheet": ("Check-in-Blatt", "sheet.ts"),
}

GENERAL = [
    "Eine Zeile je Text. Spalte „Bereich“ filtern, um einen Teil für sich zu lesen.",
    "Ist eine Übersetzung falsch oder holprig, die bessere Fassung in die Korrekturspalte der Sprache schreiben. Leer heißt: passt.",
    "Fragen oder Zweifel in „Anmerkung“.",
    "Platzhalter wie {time} und Auszeichnungen wie <b>…</b> müssen stehen bleiben; ihre Stellung im Satz darf sich ändern.",
    "Englisch: amerikanisch, “…”. Französisch: Frankreich, vous, « … » (die geschützten Leerzeichen setzt ein Skript, normale Leerzeichen genügen). Spanisch: europäisch mit neutralem Wortschatz, Gast und Verwaltung „usted“, Reinigungskräfte „tú“, «…», ¿…?.",
    "Begriffe: Sessions/Glossar-fr-es-2026-10-19.md. Rechtstexte bleiben deutsch und fehlen deshalb hier.",
    "Knöpfe, die im Fließtext zitiert werden, müssen wortgleich bleiben — wer einen Knopf ändert, ändert ihn überall (die Tests melden Abweichungen).",
]


def export_area(area: str) -> list:
    raw = subprocess.run(
        ["node", "--no-warnings", "--import", (ROOT / "scripts" / "ts-resolve.mjs").as_uri(),
         str(ROOT / "scripts" / "translation-export.mjs"), area, ",".join(l for l, _ in LANGS)],
        check=True, capture_output=True,
    ).stdout.decode("utf-8")
    return json.loads(raw)["rows"]


def cmd_export(out: Path) -> None:
    wb = Workbook()
    intro = wb.active
    intro.title = "Anleitung"
    ws = wb.create_sheet("Texte")

    head = ["Bereich", "Schlüssel", "Ort", "Erläuterung", "Deutsch"]
    for _, name in LANGS:
        head += [name, f"Korrektur {name}"]
    head += ["Anmerkung"]
    ws.append(head)

    count = 0
    for area, (label, _) in AREAS.items():
        for r in export_area(area):
            row = [label, f"{area}:{r['key']}", r["where"], r["note"], r["de"]]
            for lang, _ in LANGS:
                row += [r["targets"][lang], ""]
            row += [""]
            ws.append(row)
            count += 1

    widths = [16, 24, 30, 40, 44] + [44, 30] * len(LANGS) + [30]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = w
    corr_cols = {6 + 2 * i for i in range(len(LANGS))}  # 0-basiert: Korrekturspalten
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(wrap_text=True, vertical="top")
        row[1].font = Font(name="Consolas", size=8, color="888888")
        for c in corr_cols | {len(widths) - 1}:
            row[c].fill = PatternFill("solid", fgColor="FFF7D6")
    last = ws.cell(row=1, column=len(widths)).column_letter
    table = Table(displayName="Texte", ref=f"A1:{last}{count + 1}")
    table.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=True)
    ws.add_table(table)
    ws.freeze_panes = "F2"

    lines = [("RoSe – alle Texte in allen Sprachen zum Gegenlesen", True), ("", False)]
    lines += [(f"• {g}", False) for g in GENERAL]
    lines += [("", False), (f"{count} Texte · erzeugt aus src/lib/i18n/ · Rückspielen: python scripts/translation-review.py apply <Datei>", False)]
    for i, (text, bold) in enumerate(lines, start=1):
        cell = intro.cell(row=i, column=1, value=text)
        cell.font = Font(bold=bold, size=14 if i == 1 else 11)
        cell.alignment = Alignment(wrap_text=True, vertical="top")
    intro.column_dimensions["A"].width = 130

    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    print(f"{out} ({count} Texte)")


def ts_literal(text: str) -> str:
    return "'" + text.replace("\\", "\\\\").replace("'", "\\'") + "'"


def area_files(lang: str, area: str, key: str = "") -> list:
    p = I18N / lang / AREAS[area][1]
    if not p.is_dir():
        return [p]
    # Ordner-Bereiche: der erste Teil des Schlüssels ist meist die Datei (admin:common.save → admin/common.ts).
    own = p / f"{key.split('.', 1)[0]}.ts"
    return [own] if key and own.exists() else sorted(p.rglob("*.ts"))


def cmd_apply(src: Path, dry: bool) -> None:
    ws = load_workbook(src)["Texte"]
    rows = list(ws.iter_rows(values_only=True))
    head = list(rows[0])
    col = {name: i for i, name in enumerate(head)}

    current = {}  # (area, key) -> {lang: text} — der Stand im Code
    done, problems = 0, []
    touched = set()
    for row in rows[1:]:
        if not row or not row[col["Schlüssel"]]:
            continue
        area, key = str(row[col["Schlüssel"]]).split(":", 1)
        for lang, name in LANGS:
            corr = row[col[f"Korrektur {name}"]]
            if corr is None or not str(corr).strip():
                continue
            corr = str(corr).strip()
            old = row[col[name]] or ""
            if corr == old:
                continue
            if area not in current:
                current[area] = {r["key"]: r["targets"] for r in export_area(area)}
            now = current[area].get(key, {}).get(lang)
            if now is None:
                problems.append(f"{area}:{key} [{lang}] Schlüssel gibt es nicht mehr")
                continue
            if now != old:
                problems.append(f"{area}:{key} [{lang}] Text hat sich seit dem Export geändert — von Hand")
                continue
            lit = ts_literal(old)
            # Erst der Text allein; steht er mehrfach da („Enregistrer“), dann
            # zusammen mit dem letzten Teil des Schlüssels („save: 'Enregistrer'“).
            last = key.rsplit(".", 1)[-1]
            patterns = [re.escape(lit), rf"(?<![\w.]){re.escape(last)}\s*:\s*{re.escape(lit)}"]
            target = None
            for pat in patterns:
                hits = [(f, len(re.findall(pat, f.read_text(encoding="utf-8")))) for f in area_files(lang, area, key)]
                hits = [(f, n) for f, n in hits if n]
                if sum(n for _, n in hits) == 1:
                    target = (hits[0][0], pat)
                    break
            if target is None:
                problems.append(f"{area}:{key} [{lang}] Text nicht eindeutig zu finden — von Hand")
                continue
            f, pat = target
            if not dry:
                text = f.read_text(encoding="utf-8")
                text = re.sub(pat, lambda m: m.group(0)[: -len(lit)] + ts_literal(corr), text, count=1)
                f.write_text(text, encoding="utf-8")
            touched.add(lang)
            done += 1
            print(f"{'(Probe) ' if dry else ''}{area}:{key} [{lang}] → {corr}")

    if "fr" in touched and not dry:
        subprocess.run(["node", str(ROOT / "scripts" / "fr-typo.mjs")], check=True, cwd=ROOT)
    print(f"\n{done} Korrektur(en) {'gefunden' if dry else 'eingetragen'}.")
    if problems:
        print(f"{len(problems)} Zeile(n) brauchen Handarbeit:")
        for p in problems:
            print("  " + p)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # Windows-Konsole: Pfeile, Akzente, geschützte Leerzeichen
    args = sys.argv[1:]
    if len(args) >= 2 and args[0] == "export":
        cmd_export(Path(args[1]))
    elif len(args) >= 2 and args[0] == "apply":
        cmd_apply(Path(args[1]), "--dry-run" in args)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
