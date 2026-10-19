# Glossar Französisch und Spanisch (19.10.2026)

Verbindliche Begriffe für `src/lib/i18n/fr/` und `src/lib/i18n/es/`. Grundlage: die
deutschen Begriffs-Entscheidungen (`Begriffe-Entscheidungen.md`), die englische
Fassung und die schon vorhandenen Blätter `fr/sheet.ts`, `es/sheet.ts`.

## Grundentscheidungen (User, 19.10.2026)

| | Französisch | Spanisch |
|---|---|---|
| Variante | Frankreich | europäisches Spanisch mit neutralem Wortschatz, **„ustedes“, nie „vosotros“** |
| Gast | *vous* | *usted* |
| Reinigungsboard (Reinigungskräfte) | *vous* | *tú* |
| Verwaltung, Hilfe, Konto, Landing, Simulator | *vous* | *usted* |
| Anführungszeichen | « … » mit Leerzeichen innen | «…» ohne Leerzeichen |
| vor `: ; ? !` | Leerzeichen (wird automatisch geschützt) | kein Leerzeichen; ¿…? ¡…! |
| Gedankenstrich | „ — “ sparsam | vermeiden (Doppelpunkt, Komma, Klammer) |
| Auslassung | `…` ohne Leerzeichen davor („Connexion…“) | `…` ohne Leerzeichen |
| Uhrzeit | 24 h, `{time}` | 24 h, „a las {time}“ |

Französisch: Im Quelltext stehen normale Leerzeichen; `scripts/fr-typo.mjs`
ersetzt sie vor `: ; ? !` und innerhalb « » durch geschützte, der Test prüft es.

Personenbezeichnungen geschlechtsneutral: keine „femme de chambre“/„camarera“,
simulierte Kräfte „Agent d’étage A“ / „Persona de limpieza A“.

## Knöpfe und feste Beschriftungen (wortgleich überall zu zitieren)

| Schlüssel | Englisch | Französisch | Spanisch |
|---|---|---|---|
| guest.signal.clean.label | Clean my room | Nettoyer ma chambre | Limpiar mi habitación |
| guest.signal.dnd.label | Do not disturb | Ne pas déranger | No molestar |
| guest.signal.skip.label | No cleaning today | Pas de ménage aujourd’hui | Hoy sin limpieza |
| guest.services.heading | Request a service | Demander un service | Solicitar un servicio |
| service.board.start | Start cleaning | Commencer le ménage | Empezar limpieza |
| service.board.finish | Finish cleaning | Terminer le ménage | Terminar limpieza |
| Schicht beginnen / beenden | Start / End shift | Prendre son service / Finir son service | Empezar turno / Terminar turno |
| Pause | Break | Pause | Pausa |

## Begriffe

| Deutsch | Englisch | Französisch | Spanisch |
|---|---|---|---|
| Haus (einzelnes) | property | établissement | establecimiento |
| Hotel (Branche, nur Landing) | hotel | hôtel | hotel |
| Gästeportal | guest portal | portail client | portal de huéspedes |
| Reinigungsboard | housekeeping board | tableau du ménage | panel de limpieza |
| Rezeption | front desk | réception | recepción |
| Reinigung / Reinigungskraft | housekeeping / housekeeper | ménage / agent d’étage | limpieza / persona de limpieza |
| Reinigungsteam | housekeeping team | équipe d’étage | equipo de limpieza |
| Inhaber (Konto) | owner | titulaire du compte | titular de la cuenta |
| Manager | manager | manager | gerente |
| Zimmer / Etage / Gebäudeteil | room / floor / building | chambre / étage / bâtiment | habitación / planta / edificio |
| Aufenthalt | stay | séjour | estancia |
| Check-in / Check-out | check-in / check-out | check-in / check-out | check-in / check-out |
| Abreise | departure | départ | salida |
| Anfrage | request | demande | solicitud |
| Bestellen / Melden (Knopf) | Order / Report | Commander / Signaler | Pedir / Avisar |
| Meldung ans Haus | report to the property | signalement | aviso |
| Service-Baukasten | service builder | catalogue de services | catálogo de servicios |
| Verweis (Link-Kachel) | link | lien | enlace |
| tägliche Reinigung | daily cleaning | ménage quotidien | limpieza diaria |
| auf Wunsch | on request | à la demande | bajo petición |
| frühestens ab | not before | pas avant | no antes de |
| Priorität / priorisiert | priority | prioritaire | prioritaria |
| Bitte nicht stören | Do not disturb | Ne pas déranger | No molestar |
| Check-in-Blatt | check-in sheet | feuille d’arrivée | hoja de check-in |
| Zimmer-Aushang | room sign | affiche de chambre | cartel de habitación |
| Zugangskarte | access card | carte d’accès | tarjeta de acceso |
| Aufstellung (Check-out) | statement | récapitulatif | resumen |
| Eintrag (Tätigkeit) | entry | pointage | registro |
| Schicht | shift | service | turno |
| Übersicht | overview | vue d’ensemble | vista general |
| Auswertung | reports | statistiques | estadísticas |
| Einstellungen | settings | paramètres | ajustes |
| Hilfe | help | aide | ayuda |
| Lotse | guide | guide | guía |
| Nachbau (Simulation in der Hilfe) | replica | simulation | simulación |
| Erklärung (Kontexthilfe) | explanation | explication | explicación |
| Haus & Regeln | Property & rules | Établissement et règles | Establecimiento y normas |
| Gäste-Zugang | Guest access | Accès clients | Acceso de huéspedes |
| Mein Zugang | My account | Mon compte | Mi cuenta |
| Personal | Staff | Personnel | Personal |
| Häuser | Properties | Établissements | Establecimientos |
| Plan & Abrechnung | Plan & billing | Offre et facturation | Plan y facturación |
| Rechnung | invoice | facture | factura |
| USt-IdNr. | VAT ID | numéro de TVA intracommunautaire | NIF-IVA |
| Reverse Charge | reverse charge | autoliquidation | inversión del sujeto pasivo |
| Zahlungsweg | payment method | moyen de paiement | método de pago |
| Problem melden | Report a problem | Signaler un problème | Informar de un problema |
| Housekeeping-Simulator | Housekeeping Simulator | Simulateur Housekeeping | Simulador Housekeeping |
| Etagenliste (Papier) | floor list | liste d’étage | lista de planta |
| Funk | radio | radio | radio |
