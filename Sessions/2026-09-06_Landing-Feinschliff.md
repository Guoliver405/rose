# 06.09.2026 — Landing Page: Feinschliff nach Rückmeldung des Users

Kurzer Abschnitt: eine Liste von Textänderungen auf `/` plus ein neuer
Abschnitt, aus einer Durchsicht des Users. Vorheriger Stand:
[2026-09-05_Konto-Seite-und-Test-Buendelung.md](2026-09-05_Konto-Seite-und-Test-Buendelung.md).

## Was sich geändert hat

Texte in [page.tsx](../src/app/page.tsx):

- Hero: „Reinigung steuern und Services anbieten — digital und effizient";
  Unterzeile „RoSe verbindet alle Bereiche in Echtzeit — in einem intuitiven
  System, ohne Schulung, Datenprobleme oder PMS-Projekt"; Knopf „Produkt
  Demo"; „in wenigen Minuten eingerichtet" (auch in der FAQ, vorher „unter
  einer Stunde").
- Portale: „Drei Portale, drei Benutzertypen, ein Zusammenwirken"; „vom
  Wäscheservice bis zum Frühstück aufs Zimmer"; „Dringende blinken rot" und
  „Dringendes blinkt rot" groß, weil substantiviert.
- Ablauf, Schritt 5: „Gezielt und gesteuert — Priorisiert und zuvorkommend,
  automatisch am Bedarf ausgerichtet und in Abstimmung der Mitarbeitenden"
  (der User schrieb „Gesteuert" groß; nach dem Bindestrich-Titel ist es ein
  Adjektiv, deshalb klein). Der Titel des fünften Demo-Schritts zieht mit.
- Features: „QR-Codes je nach Bedarf" (je Zimmer mit PIN oder je Aufenthalt,
  ein Klick), DND „lässt das Zimmer fürs Housekeeping verschwinden",
  Service-Baukasten „mit Optionen, Preisen und Priorisierung anlegen — Gäste
  bestellen digital und ohne Verzögerung", und die Kachel „Vergessenes
  verfällt nicht" (Stale-Timeout) ist durch **„Nachhaltig auf Wunsch"**
  ersetzt — der Stale-Timeout bleibt ein Feature, nur nicht mehr auf der
  Landing Page.

**Neuer Abschnitt „Nachhaltigkeit"** zwischen den Schmerzpunkten und der
Produktvorschau: grüner Kasten mit runder Plakette „Reinigung auf Wunsch",
Pille „Nachhaltig gastgeben", Überschrift „Reinigung nur, wenn der Gast sie
möchte", drei Karten (Wasser und Waschmittel · Energie und Wege · Gäste
entscheiden selbst). Bewusst **kein** Kostenargument — das übernimmt der
Nutzenrechner unten; hier geht es um Wasser und das Nachhaltigkeits-Image
des Hauses. Die einzige Zahl (70 % der Gäste brauchen keine tägliche
Reinigung) ist Quelle Q1 des Rechners (AHLA 2022). Der Schlusssatz stellt
klar, dass die Stayover-Routine als Option bleibt.

Demo in [LiveDemo.tsx](../src/components/landing/LiveDemo.tsx):

- Freier Modus: „Tipp im Gäste-Portal, Klick an der Rezeption, Wisch auf dem
  Board." — der Nachsatz „alles wirkt sofort auf die anderen beiden" ist weg,
  weil die Szene eine Demo ist und nicht so tun soll, als bediene man das
  echte System.
- Das Gäste-Handy hat jetzt dieselbe Kopfleiste wie Rezeption und Board
  („Gäste-Portal — Handy"), damit die Demo-Nutzer wissen, was sie sehen.
- Die Ereigniszeile unter der Szene („Check-in Zimmer 202: Aufenthalt
  angelegt, PIN 4827.") ist entfallen; `lastEvent` bleibt im Modell.

## Verifikation

`npm run verify` grün (157). Im Vorschau-Browser: Hero, Nachhaltigkeits-
Kasten (hell und dunkel) und die Kopfleiste am Gäste-Handy geprüft.
**Produktion** (Commit `19f42a2`, User in Chrome angemeldet, Claude fährt):
rose-roomservice.app zeigt alle geänderten Texte, den Nachhaltigkeits-Kasten
mit Plakette zwischen Schmerzpunkten und Demo, die Demo mit drei Kopfleisten
und ohne Ereigniszeile; Seitentext vollständig gegen die Liste abgeglichen.

## 🔖 Wiederaufnahme

Landing-Texte nach der Durchsicht des Users; nichts Fachliches geändert.
Offen bleibt aus dem Vortag: Antwort von Bernd (Stripe-Konto, Wortmarke),
anwaltliche Prüfung, AVV, Illustrationen. Nächster Baustein: Stripe nach dem
Bauplan in der Zahlungsprovider-Vorlage, sobald das Konto steht.
