# Silber HUD Overhaul v0.4.9 – Fantasy Atelier & Attributs-Popover

**Korrektur der überlagerten Attributsauswahl:** Die Auswahl „Attributsprobe / Rettungswurf“ ist jetzt eine eigene, fest am geklickten Attribut ausgerichtete HUD-Ebene (`#shud-ability-popover` direkt unter `#shud-root`). Sie liegt **oberhalb** der anderen Attributfelder, Tabs und Panel-Inhalte und wird durch deren `overflow` oder `clip-path` nicht mehr abgeschnitten. Das Popover bleibt am Bildschirmrand innerhalb des Viewports, richtet sich beim Scrollen/Größenwechsel neu aus und schließt durch erneuten Klick, Escape, Klick außerhalb oder nach dem Wurf. Die Würfe laufen weiterhin über die D&D-5e-Actor-Methoden.

**Weiterentwicklung der gewählten Formensprache:** Verfeinerte, länglich-ovale Navigationskapsel, transparente folioartige Seitenflächen, ein gerahmtes Porträt als eigenständiges Medaillon, schlankere und abgeschrägte Trefferpunkt-/Rüstungsleisten, sechs kompakte Attributssiegel, zurückhaltende Gruppen- und Chatkarten, schmalere Register und Initiative. Die Änderungen liegen im neuen Stylesheet `styles/theme-atelier.css`. Keine neue Bildgenerierung, kein animierter Hintergrund, keine zusätzliche Abhängigkeit.

**Prüfstand:** `node --check` und Manifestprüfung erfolgreich. Isolierte Chromium-Sicht- und Funktionstests durchgeführt: beide Wurfaktionen, Popover-Positionen bei 1600 × 900 und 950 × 700, Escape/Außenklick, Umschalten zwischen Attributen und native Actor-Drag-Daten. **Ein Praxistest in einer echten Foundry-v14-Welt steht aus.**

---

## Version 0.4.8 – Attributswürfe & Token-Drag-and-Drop

- Klick auf eines der sechs Attributssiegel (STR, GES, KON, INT, WEI, CHA) öffnet **Attributsprobe** und **Rettungswurf**. Ein zweiter Klick schließt die Auswahl. Die Würfe laufen über die nativen D&D-5e-Aktor-Methoden inklusive ihrer Wurfoptionen, Profizienzen und Effekte; es werden keine eigenen Würfelformeln erfunden.
- Akteure im rechten Verzeichnis sowie verfügbare Gruppenmitglieder und das kleine Charakterporträt lassen sich auf die Karte ziehen. Das HUD sendet den dokumentierten Foundry-Actor-Drag-Payload; **Foundry übernimmt das Platzieren, Raster und die Berechtigungen**. Der GM kann alle Akteure ziehen, Spieler nur Figuren, die sie besitzen. Das Erstellen von Tokens durch Spieler kann zusätzlich durch Foundry-Berechtigungen beschränkt sein.
- Die Attributskarten besitzen feinere Goldkonturen, eine eigenständige achteckige Silhouette sowie passende, kleine Auswahlmenüs. Zusätzliche externe Abhängigkeiten, Fonts und Timer werden nicht geladen.
- Keine Änderung an Chat, Initiative, Modulverwaltung oder GM-Undo.

**Teststand:** JavaScript-/JSON-/CSS-Prüfung und isolierte Funktionstests für Würfe und Drag-Daten. Ein Browser-Sichttest wurde durch die Testumgebung blockiert. In Foundry v14 mit der installierten D&D-5e-Version noch nicht live getestet.

---

## Version 0.4.7 – Silhouette-Design (kein Screenshot-Skin)

Grundlegende Überarbeitung der **tatsächlichen UI-Konturen**: obere Menüführung als mittig schwebende, an den Enden spitz zulaufende Navigationskapsel (eigenes kleines SVG); separate, ovale Systemsteuerung; seitliche Panels mit angeschnittenen Ecken, transparent abgestuften Flächen und Ornamenten im Rahmen; schmalere Werkzeugleiste, runde Buttons, reduzierte Chat-Karten und hexagonale Würfeltasten. Der rechte Charakterbereich wurde in Porträt-, TP-, Attribut- und Aktions-Instrumente aufgeteilt.

* Ohne neue Module oder JavaScript-Hooks: reine CSS/SVG-Änderungen auf den vorhandenen Foundry-Elementen.
* Nur echte Welt-/Charakterdaten; Karten, Porträts und Chatmeldungen werden nicht erfunden.
* Die vorherigen Einstellungen, der Enter-Chat, die Gruppenliste, die Aktionen, das Initiative-Karussell und GM-Undo bleiben erhalten.
* Hinweis: CSS/JSON/JS validiert, ein vollständiger Sichttest in Foundry v14 steht noch aus.

---

# Silber HUD Overhaul v0.4.6 – Immersive Dark Fantasy

Visuelles Update des tatsächlichen Spiel-HUDs nach der abgestimmten Designvorlage: schwebende schmale Navigationsinsel, separates Systemmenü, transparent anmutende dunkelrote Panels, filigrane Goldkonturen, runde Charakterporträts, veredelter Chat mit angedockter Werkzeugleiste sowie neu proportionierte Gruppen-, Charakter- und Initiativeanzeige mit sechs D&D-5e-Attributswerten.

Die Änderungen liegen in `styles/theme-immersive.css` und benötigen **keine weiteren Hooks, Animationen, externen Bilder oder Webfonts**. Das tatsächliche Kartenmotiv kommt weiterhin aus der aktiven Foundry-Szene; die generierte Konzeptillustration wird nicht als Kartenhintergrund verwendet.

Die bisherigen Bedienelemente (Enter-Chat, Dice Tray, Spell/Waffen-Aktivitäten, GM-Undo und originale Foundry-Einstellungen) bleiben unverändert. UI-Layout sollte in einer Testwelt und mit deiner Bildschirmgröße geprüft werden; es handelt sich um ein Design-Update, keine neue Foundry-Engine.

---

# Silber HUD Overhaul v0.4.5 – Dark-Fantasy-Design

**Design-Update auf Basis unserer Bildvorschau.** Ziel: näher am ursprünglichen, dunkelrot/goldenen Fantasy-Look, ohne neue Leistungskosten während des Spielens.

- Goldene Rahmen und kleine ornamentale SVG-Zierelemente an Chat und Panel-Titeln.
- Rote Samtoptik für aktive Menüs, Zauber, Kampf- und Charakteraktionen.
- Einheitliche Gestaltung von linkem Chat-Dock, Dice Tray, Initiative-Karussell sowie rechtem Gruppen-/Akteurs-/Charakter-Dock.
- **Unverändert:** keine untere Hotbar, Enter-Chat, einklappbare Seitenleisten, vollständig zugängliche Foundry-Einstellungen samt Modulverwaltung, Zauberabläufe, Spieler-/GM-Charakterauswahl und GM-Undo.
- Nur CSS und zwei kleine SVG-Dateien neu; keine zusätzlichen JavaScript-Aufrufe, Webschriften, Polling-Schleifen oder großen PNG-Hintergründe.
- Die Bildvorschau ist eine **Stilreferenz**, keine pixelgenau gerenderte Darstellung des fertigen Foundry-Moduls.
- Wegen der fehlenden Live-Foundry-Umgebung gilt: bitte in einer Testwelt auf Darstellungsfehler und eventuelle Modul-Konflikte prüfen.

**Installieren:** Vorherigen Ordner `silber-hud-overhaul` im Verzeichnis `Data/modules` ersetzen; Browser-Cache hart neu laden.

---

# Silber HUD Overhaul v0.4.4 – Performance-Update

- Rückgängig zeichnet pro Änderung nur die tatsächlich veränderten, erlaubten Felder auf statt vollständige Actor-/Item-/Token-Objekte zu kopieren. Bei nicht direkt lesbaren Quellfeldern gibt es eine sichere Fallback-Abfrage.
- Die Historie wird weiterhin auf 60 Einträge begrenzt, schreibt gebündelt in `localStorage` und sichert beim Verlassen der Seite.
- HUD-Aktualisierungen werden bei vielen aufeinanderfolgenden Foundry-Hooks gebündelt (maximal ca. 1 Aktualisierung pro 130 ms).
- Geschlossene Charakter- und Gruppenpanels werden nicht unnötig neu aufgebaut; beim Öffnen wird der aktuelle Zustand nachgeladen.
- Das Initiative-Karussell leert bei fehlendem Kampf nicht wiederholt einen bereits leeren DOM-Container.

**Nicht garantiert:** Ob Foundry auf dem individuellen Client schneller läuft, hängt stark von den anderen aktiven Modulen, Szenen, Animationen und der Bildschirmauflösung ab. Erst ein Vorher-Nachher-Test in der echten Welt bestätigt einen messbaren Effekt. Die Spieler-Sockets für GM-Undo bleiben aktiv.

**Mögliche Modul-Konsolidierung:** Ein separater Dice-Tray-Zusatz, ein alternativer Initiative-Tracker und ein reines Action-HUD können je nach verwendetem Funktionsumfang überflüssig werden. Nicht automatisch ersetzbar sind etwa Dice So Nice!, Automated Animations, JB2A, DDB Importer oder D&D5e-Systemfunktionen.

---

# Silber HUD Overhaul v0.4.3 – Rückgängig für Spielleiter

**NEU:** Oberes Zahnrad bleibt erhalten. Links davon ist für den GM ein Rückgängig-Symbol (gebogener Pfeil) mit Verlauf-Dropdown. Ein Klick stellt die zuletzt aufgezeichnete, noch unveränderte Spielaktion/Änderung wieder her – auch wenn sie von einem Spieler ausgelöst wurde.

### Was erfasst wird
- Änderungen an Trefferpunkten, Todesrettungswürfen, Zauberplätzen und Ressourcen von Akteuren
- Tokenbewegungen / Position, Drehung, Höhe und Sichtbarkeit
- Gegenstandsverbrauch (z. B. Munition, Ladungen, Ausrüstung)
- Initiative, Zug/Runde und Kampfstatus
- Änderungen an aktiven Effekten; Anlegen/Löschen von Active Effects, Tokens und Flächenschablonen
- Erzeugte Würfel-Nachrichten (Undo löscht deren Chatkarte, aber **berechnet keinen anderen Wurf**)

### Einschränkungen
- **Keine vollständige Rückgängig-Funktion für alle Makros und Module.** Nur über unterstützte Foundry-Dokument-Hooks aufgezeichnete Änderungen lassen sich umkehren. Nicht erfasste Änderungen und externe Effekte (z. B. Audio, Animationen) bleiben bestehen.
- Ein einzelner D&D-5e-Zauber kann mehrere Schritte erzeugen (Chatkarte, Ressourcenverbrauch, Effekt, Schaden). Dann sind gegebenenfalls **mehrere Klicks** nötig, um alle dokumentierten Änderungen zurückzunehmen.
- Bei Konflikten mit späteren Änderungen wird die Rücknahme verweigert, um nichts Unbeteiligtes zu überschreiben.
- Keine Rücknahme vor dem Aktivieren dieses Modulstandes. Nur ein angemeldeter GM kann rückgängig machen; die Historie wird im Browser des GM gespeichert (max. 60 Einträge). Spieler benötigen das Modul aktiviert, um ihre Aktionen weiterzuleiten.
- Die Rücknahme ist ein **Live-Feature für die Sitzung**, kein vollständiger revisionssicherer Versionsverlauf. Vor komplexen Eingriffen bitte eine Welt-Sicherung erstellen.
- Native Foundry/D&D5e-Berechtigungen werden beim Rückgängigmachen beachtet. Die GM-Historie kann durch Modul-Neuladen oder parallele GM-Sitzungen abweichen.

### Installation
Vorherige Version durch diesen `silber-hud-overhaul`-Ordner ersetzen und Foundry mit **Strg + F5** neu laden. In einer Testwelt prüfen.

---

# Silber HUD Overhaul v0.4.2

### Neu in dieser Version
- **Chat-Papierkorb:** Nur für den Spielleiter. Ruft Foundrys offizielle `game.messages.flush()`-Funktion auf, die vor dem vollständigen und dauerhaften Löschen **selbst eine Bestätigung** einholt.
- **Dritter Button am rechten Dock („Akteure“):** Suchbares Verzeichnis aller World-Akteure. GMs sehen alle, Spieler nur Akteure, für die mindestens Beobachtungsrechte bestehen. Klick auf einen Akteur wählt ihn für den GM aus; erneuter Klick hebt die Auswahl auf. Der kleine Bogen-Button öffnet das Original-Akteursblatt.
- **Gruppe / Akteure:** Die beiden Listen verwenden abwechselnd denselben Platz links neben der Dock-Leiste, um die Karte nicht zu verdecken. Charakter bleibt rechts.
- **Chat autoscroll:** Neue Nachrichten und Würfelergebnisse scrollen auch im eingebetteten Foundry-Popout automatisch ans untere Ende. Ein DOM-Observer deckt zeitversetzte D&D5e-Chatkarten ab.
- Alle bisherigen Funktionen inklusive Enter-Chat, Dice Tray, Aktionen, Initiative und Foundry-Einstellungen bleiben erhalten.

### Installation
Den Ordner `silber-hud-overhaul` in `Foundry User Data/Data/modules/` durch den ZIP-Inhalt ersetzen und Strg+F5 drücken. Vor Tests in produktiven Welten ein Backup erstellen.

### Testgrenze
Browser-Tests mit nachgebildeten Foundry-APIs sind kein Ersatz für einen echten Foundry-v14-Welt-Test.

---

# Silber HUD Overhaul 0.3.9 – Linkes Chat-Dock

**Änderungen seit 0.3.7**
- Der Chat beginnt auf breiten Bildschirmen direkt am oberen linken Rand und reicht über die gesamte Höhe bis unten. Auf kleineren Auflösungen beginnt er unter der oberen Menüleiste, um diese weiterhin bedienbar zu halten.
- Die originale linke Foundry-Werkzeugpalette wird unter v14 jetzt auch über das ApplicationV2-Element `ui.controls.element` unsichtbar gemacht; ihre Funktionen werden **nicht** entfernt. Im GM-Menü lässt sich die native Leiste bei Bedarf weiterhin einblenden.
- Die Kartenwerkzeug-Buttons sind an die **rechte Außenseite des Chat-Docks** angeschlossen. Schließt man den Chat, rückt die Werkzeugleiste automatisch an den linken Bildschirmrand.
- Ein Chat-Button in der Werkzeugleiste öffnet und schließt das Chat-Dock. Enter kann den Chat auch aus geschlossenem Zustand zum Schreiben aufklappen.
- Die Chat-Eingabe bleibt standardmäßig verborgen, das Dice Tray bleibt unten im Chat, die komplette Foundry-Modulverwaltung über das Zahnrad verfügbar.
- Das Gruppen-/Charakter-Dock auf der rechten Seite bleibt unverändert.

# Silber HUD Overhaul 0.3.7 – Minimalistische Spiel-Werkzeugleiste

**Änderungen seit 0.3.6**
- Spieler sehen nur die primären Kartenwerkzeuge: Token-Auswahl, Messen und Schablonen, sofern Foundry diese für den jeweiligen Nutzer freigibt.
- Weitere für den jeweiligen Nutzer freigegebene Werkzeuge stehen hinter **…** (Mehr). GM-exklusive Bearbeitungsfunktionen werden Spielern nicht angezeigt.
- Für den GM wird **Licht** wieder als direkt sichtbarer Button angeboten (falls Foundry die Kategorie liefert). Wände, Regionen, Kacheln, Zeichnungen, Musik und weitere GM-/Modulwerkzeuge bleiben unter **Mehr**.
- Modulwerkzeuge zeigen nach Möglichkeit ihr eigenes Icon statt vieler identischer Fadenkreuze.
- Die offiziellen Foundry-Werkzeuge werden unverändert über `ui.controls.activate` gesteuert. Original-Seitenleiste und Modulverwaltung bleiben verfügbar.
- Chat-Eingabe per Enter aus 0.3.6 und Gruppen-/Charakter-Dock aus 0.3.3 bleiben erhalten.

Hinweis: Die Kategorien werden nur angezeigt, wenn Foundry sie für den angemeldeten Nutzer bereitstellt. Die Sichtbarkeit der Foundry-Kontrollen ist eine UI-Anpassung, keine Änderung der Berechtigungen.

---
# Silber HUD Overhaul 0.3.4 — Spiel-HUD für Foundry VTT 14

Spielorientierte Benutzeroberfläche im Dark-Fantasy-Stil. Die Karte bleibt im Mittelpunkt; Verwaltungsfunktionen liegen in Menüs. Die Oberfläche wird als Modul über Foundry gelegt und ersetzt **keine** Core-Dateien.

## Installation / Upgrade

1. **Welt sichern**, insbesondere vor einem ersten Test mit Drittmodulen.
2. Den alten Ordner `silber-hud-overhaul` im **Foundry User Data**-Verzeichnis `Data/modules/` vollständig durch den Ordner aus dieser ZIP ersetzen. Beim Nutzer ggf. `/home/silber/foundrydata/Data/modules/silber-hud-overhaul/`.
3. Foundry beziehungsweise die Welt neu laden (**Strg+F5**). In der Spielwelt unter **Module verwalten** das Modul aktivieren. Wenn es bereits aktiviert ist, bleibt dies gewöhnlich bestehen.
4. Für einen Test zuerst eine eigene Testwelt mit D&D5e nutzen.
5. Bei Problemen Modul deaktivieren und die Welt neu laden: Keine Systemdateien wurden durch das Modul verändert.

**Hinweis:** ZIP zum Entpacken, **keine** Manifest-Installations-URL.

## Oberfläche

- **Linke Werkzeugleiste:** Eigene, schmale V14-Szenensteuerung über `ui.controls.activate()`; Licht und filmartige Werkzeuge sind ausgeblendet. Auswahl einer Werkzeugkategorie öffnet die kleine Unterpalette. Im **SL-Werkzeuge**-Dropdown gibt es einen Schalter, um die native Werkzeugleiste bei Bedarf wieder einzublenden.
- **Oben:** Kampf, Würfel, Journal und nur für SL: SL-Werkzeuge. Alle Dropdowns schließen sich wieder. **Das goldene Zahnrad oben rechts ist dauerhaft sichtbar** und öffnet die **vollständige originale Foundry-Einstellungs-Seitenleiste**, einschließlich **Module verwalten** (für SL/GM), **Einstellungen konfigurieren** und weiterer Foundry-Funktionen. Das benachbarte Seitenleisten-Symbol schließt/öffnet die native Leiste wieder.
- **Rechts:** Charakterpanel mit Portrait (Actor-Bild), HP, AC, Bewegung, Zaubern, Aktionen, Fähigkeiten, Inventar und dem Originalbogen-Link. Ein Symbol neben dem Namen öffnet die Charakterauswahl.
- **Gruppenliste:** Anzeige zugewiesener Spielerfiguren mit Portrait und TP, über Spielerauswahl bedienbar; GM kann auch andere sichtbare Charaktere auswählen. Einklappbar.
- **Chat unten links:** Nativer Foundry-Chat inklusive Chatkarten wird in ein dunkles Panel eingebettet (sofern dessen Popout verfügbar ist); bekannte Fehler beim Ereignis-Abfangen von Kartenbuttons wurden korrigiert.
- **Chat-Schreiben:** Das native Eingabeformular wird im HUD versteckt. **Enter** außerhalb aktiver Textfelder **oder Klick auf den Hinweis** öffnet die eigene kleine Eingabe; **Enter** sendet über Foundrys `ChatLog.processMessage`, **Shift+Enter** ist Zeilenumbruch, **Esc** schließt die Eingabe. So bleiben auch Chatbefehle wie `/roll 1d20` möglich.
- **Dice Tray:** W4, W6, W8, W10, W12, W20, W100 immer unten im aufgeklappten Chat sichtbar. Mit +/- lässt sich ein Modifikator von -20 bis +20 für diese Schnellwürfe einstellen. Würfe landen als reguläre Foundry-Chatnachrichten im ausgewählten Rollmodus. Falls separat das Modul Dice Tray installiert ist, blendet unser HUD dessen eingebettete Leiste im Chat aus, um Doppelanzeigen zu vermeiden.
- **Zauber rechts:** `Wirken` nutzt die native D&D5e-Aktivität, `Angriff` und `Schaden` rufen nur die jeweilige Wurffunktion auf. Getrennte Würfe verbrauchen keinen zusätzlichen Zauberplatz. Manche Zauber besitzen keinen Angriffs- oder Schadenswurf.
- **Ausgeblendet im Spiel:** die untere Foundry-Hotbar sowie dauerhaft sichtbare Akteure/Kompendien/Verwaltungsleisten. **Das originale Foundry-Einstellungsmenü wird nicht entfernt und ist über das Zahnrad jederzeit erreichbar.**

## Wichtige Bedienung

| Taste / Aktion | Funktion |
|---|---|
| Enter (ohne aktives Textfeld oder Dialog) | Chat-Eingabe öffnen |
| Enter in der Chat-Eingabe | Nachricht absenden |
| Shift + Enter in der Chat-Eingabe | Zeilenumbruch |
| Escape in der Chat-Eingabe | Eingabe schließen |
| Würfelknopf im Chat | Freien Wurf erzeugen |
| +/- im Dice Tray | Wurfmodifikator ändern |
| Kleine Pfeile an Chat, Gruppe, Charakter | Panel ein- oder ausklappen |
| Goldfarbenes Zahnrad oben rechts | Originale Foundry-Einstellungen öffnen, darunter **Module verwalten** (nur GM) |
| Drei Linien neben dem Zahnrad | Originale Foundry-Seitenleiste ein- oder ausklappen |
| SL-Werkzeuge | Native Werkzeugleiste/Verzeichnisse bei Bedarf öffnen |

Der Panelzustand wird lokal pro Benutzer und Welt gespeichert. Dies ändert **keine** Daten im Foundry-World-Ordner.

## Kompatibilität und Grenzen

- Ziel: Foundry VTT **Version 14** und D&D5e mit Aktivitäten (insbesondere 6.x).
- **Automatisierter Test:** HTML/JS-Browser-Test mit nachgebildeten Foundry-APIs; dabei wurden Initialisierung, Enter-Chat, Versand, Würfel, native Chatkarten-Klicks, Zauberangriff und Werkzeugumschaltung geprüft.
- **Noch nicht mit einer echten Foundry-14-Installation geprüft.** Die tatsächliche Chat-Popout-Implementierung und die Aktivitätsfunktionen anderer Module können Anpassungen erfordern.
- In Welten ohne Spielerzuweisung zeigt der Charakterbereich vorhandene zugängliche Charaktere an oder eine Auswahlaufforderung. Bei nur lesbaren Actoren sind Wirkungsbuttons deaktiviert.
- Das Modul blendet die native Navigationsleiste aus, bietet die benötigten Verwaltungsfunktionen über SL-Werkzeuge beziehungsweise die Standard-Seitenleiste jedoch weiterhin an.
- Modul-interne Texte sind überwiegend auf Deutsch; D&D5e-Aktivitätsnamen kommen aus der Welt bzw. dem installierten System.

## Fehlersuche

- Mit **F12 → Konsole** nach `[silber-hud-overhaul]` suchen.
- Wenn der Chat nicht eingebettet werden kann: **Chat öffnen** im Panel als Fallback benutzen.
- Wenn die Szenensteuerung fehlt: **SL-Werkzeuge → Native Foundry-Werkzeugleiste umschalten** oder das HUD in den Moduleinstellungen deaktivieren.
- Falls sich keine Textbox per Enter öffnet: Zunächst aus dem anderen Eingabefeld herausklicken; geöffnete Dialoge behalten Vorrang.


## Version 0.3.2 – rechts angedockte Bedienung

- Durchgehend sichtbarer, schmaler Dock-Rand am rechten Bildschirmrand.
- **Charakter** und **Gruppe** öffnen sich von rechts nach links. Die zwei Öffnen-/Schließen-Buttons sitzen auf der gemeinsamen Steuerleiste **zwischen Gruppenliste und Charakterfenster** und **wandern mit**, wenn sich die Breite der rechten Seite verändert.
- Schließt man beide Bereiche, verbleibt ausschließlich die kompakte Steuerleiste direkt am rechten Rand; kein Button bleibt mitten auf der Karte stehen.
- Gruppenliste und Charakterbereich lassen sich unabhängig voneinander öffnen und schließen.
- Der native Foundry-Einstellungsbereich einschließlich Modulverwaltung bleibt über das Zahnrad oben rechts erreichbar.
- Spielstände der geöffneten/geschlossenen Panels bleiben wie bisher pro Benutzer/World lokal gespeichert.

## Version 0.3.4 – Gruppe links vom Steuerdock

- Die Reihenfolge ist jetzt **Gruppenliste | gemeinsame Steuerleiste | Charakterfenster**.
- Wenn beide Fenster geöffnet sind, steht die Gruppe **links** der schmalen Leiste; der Charakterbogen bleibt **rechts**.
- Schließt man den Charakterbogen, gleitet die Leiste an den rechten Bildschirmrand. Die Gruppe bleibt, sofern geöffnet, unmittelbar links davon.
- Ist nur der Charakterbogen offen, erscheint er rechts der Leiste; sind beide geschlossen, bleibt allein die Leiste am rechten Rand.
- Die Pfeilrichtung der beiden Schalter ist entsprechend ihrem jeweiligen Panel angepasst.
- Keine Änderungen an Chat, Dice Tray, Zaubern, Foundry-Einstellungen oder Modulverwaltung.

## Version 0.3.4 – Chat-Reparatur

- **Enter** öffnet die Chat-Eingabe jetzt auch dann, wenn zuvor eine HUD-Schaltfläche wie Gruppenliste oder Würfel angeklickt wurde. Die Klickschaltflächen geben den Tastaturfokus frei.
- Der Hinweis **Enter oder Klick zum Schreiben** lässt sich anklicken; kein blindes Suchen nach einer Eingabefläche.
- Nach **Enter senden** verschwindet die Eingabe wieder, **Shift+Enter** erzeugt einen Zeilenumbruch, **Escape** schließt ohne Versand.
- Der native Foundry-v14-Chatpopout wird nach einem erneuten Rendern wieder mit dem HUD verbunden; Original-Chatkarten und Würfelbuttons bleiben erhalten.
- Wenn Foundry keinen Chatpopout bereitstellen kann, rendert das HUD den aktuellen Verlauf mit Foundrys eigenem Message-Renderer (Anzeige-Modus); über **Original-Chat öffnen** sind sämtliche Karten-Aktionen im nativen Chat verfügbar.
- Die originale Foundry-Modulverwaltung und die rechten Docks bleiben unverändert.

## Version 0.3.5 – Enter-Taste korrigiert

- **Enter** öffnet das HUD-Eingabefeld aus der Kartenansicht, auch wenn Foundry v14 die Taste über den Keyboard-Manager vor dem Dokument-Handler abfängt.
- Das Modul registriert dafür eine **offizielle Foundry-Tastenbelegung** (Enter/NumpadEnter, in den Tastenbelegungen sichtbar) und zusätzlich einen `window`-Capturing-Handler.
- **Keine Unterbrechung** von Texteingaben in anderen Fenstern, Formularen, Foundry-Dialogen oder der Charakteransicht.
- **Enter** im aktiven HUD-Eingabefeld versendet die Nachricht, **Shift+Enter** setzt einen Zeilenumbruch, **Escape** schließt die Eingabe.
- Das Chat-Hinweisfeld bleibt als Mausklick-Alternative erhalten.
- Andere Funktionen und das Layout aus Version 0.3.4 sind unverändert.

## Version 0.3.6 – Chat-Tastaturfix und Diagnose

- Enter öffnet die Chat-Eingabe aus der Kartenansicht; Enter beim Schreiben sendet, Escape schließt.
- Fallback bei **keyup**, wenn Foundry oder ein Modul das **keydown** blockiert.
- Bereits `preventDefault()`-behandelte Enter-Ereignisse werden nicht mehr pauschal ignoriert.
- Andere sichtbare Textfelder, Dialoge, Formulare und externe Schaltflächen behalten ihre Tastatursteuerung.
- Das kleine `?` neben dem Enter-Hinweis zeigt einen Diagnosezähler für `keydown`, `keyup` und Foundry-Keybindings an.
- Hinweis: Browser-Tests ersetzen keinen Test in einer echten Foundry-Spielwelt.


## Neu in 0.3.9 – Initiative-Karussell

Das integrierte Initiative-Karussell erscheint automatisch, sobald ein Kampf mit Beteiligten angelegt wird. Die Porträts sind nach Initiative sortiert; der aktive Zug leuchtet rot-golden auf. Eigene Trefferpunkte (und für Spielleiter alle Trefferpunkte) werden als kleine Balken angezeigt. Verborgene Gegner werden Spielern nicht gezeigt. Ein Klick auf ein Porträt zentriert den zugehörigen Token; Umschalt-Klick öffnet bei Berechtigung den Charakterbogen. Spieler können ihre Initiative direkt würfeln und gegebenenfalls ihren eigenen Zug beenden. Spielleiter können alle Initiativen, NSC-Initiativen sowie Start/Vorheriger/Nächster Zug steuern.

Mit dem Pfeil an der Initiative-Leiste lässt sie sich unabhängig von Chat und Charakter-Dock einklappen. Die Einstellung wird lokal pro Benutzer gespeichert. Es wird kein zusätzliches Initiative-Modul benötigt.

Als **visuelle und funktionale Referenz** diente das vom Nutzer bereitgestellte freie Modul *Carousel Combat Tracker* von TheRipper93 (nicht als Bestandteil enthalten). Falls dieses zusätzlich aktiviert ist, können zwei Initiative-Anzeigen gleichzeitig zu sehen sein. Du kannst den integrierten Tracker in den Foundry-Modul-Einstellungen auf deinem Client deaktivieren oder das separate Modul abschalten.

**Hinweis:** Die Kompatibilität mit Foundry v14 wird in einer simulierten Browser-Umgebung geprüft. Eine echte D&D-5e-Kampagne mit Kampfrunden, Berechtigungen, Kampfeffekten und dem realen System bleibt für den abschließenden Funktionstest erforderlich.


## Neu in 0.4.0 – Hauptcharakter und SL-Auswahl

- **Spieler:** Das HUD zeigt dauerhaft den unter **Benutzerkonfiguration → Charakter wählen** zugewiesenen Hauptcharakter (`game.user.character`). Das Auswählen fremder Tokens, Gruppenmitglieder oder Initiative-Porträts ersetzt diesen nicht. Ohne Zuweisung erscheint ein klarer Hinweis statt eines willkürlichen Ersatzcharakters.
- **Spielleiter:** Die Gruppenliste und die Figurenauswahl lassen jede zugängliche Figur auswählen; die Figurenauswahl enthält jetzt auch NPC-Akteure. Ein erneuter Linksklick auf die bereits ausgewählte Figur hebt die Auswahl auf, sodass der rechte Charakterbereich wieder leer wird.
- **Token-Auswahl für SL:** Das Auswählen eines Tokens auf der Karte zeigt dessen Akteur, auch bei unverbundenen NPC-Tokens. Die Aufhebung der Tokenauswahl kann ebenfalls die HUD-Auswahl löschen.
- **Berechtigungen:** Keine Erweiterung von Spielerrechten und keine Änderung an Zuweisungen oder Actor-Dokumenten. Die Auswahl betrifft nur die lokale HUD-Ansicht des jeweiligen Clients.

Das Modul wurde statisch und in einer browsergestützten Foundry-Nachbildung geprüft. Der Test innerhalb einer laufenden Foundry-v14-Welt steht noch aus.

- In der linken Gruppenliste steht für Spieler der eigene Hauptcharakter **an erster Stelle**.
- Auch die Porträts im Initiative-Tracker können vom GM per Linksklick ausgewählt und beim erneuten Linksklick abgewählt werden. Die reguläre Initiative-Reihenfolge bleibt dabei unverändert.


## Neu in 0.4.1 – Aufklappbare Aktionen

- In „Aktionen“, „Fähigkeiten“ und „Zauber“ öffnet ein Linksklick auf den Eintrag die Befehle direkt unter dem Namen; ein weiterer Klick schließt ihn wieder. Immer nur ein Eintrag ist aufgeklappt.
- Pro D&D-5e-Aktivität werden passende Schaltflächen angeboten: **Ziel auswählen** bei zielgerichteten Aktionen, **Schablone platzieren** bei erkannten Flächenzaubern, **Angriff würfeln**, **Schaden würfeln**, **Zauber wirken** bzw. **Ausführen**. Bei mehreren Aktivitäten sind diese getrennt aufgeführt.
- Die Zielwahl aktiviert Foundrys natives Token-Zielwerkzeug. Das Schablonen-Werkzeug wählt nur die passende Form; **Größe und Lage müssen auf der Karte eingestellt werden**. Dies ist nicht dasselbe wie die automatische D&D-5e-Flächenplatzierung während des Wirkens.
- „Wirken/Ausführen“ ruft die native D&D-5e-Aktivität auf (einschließlich ihrer Verbrauchs-/Auswahldialoge); die separaten Angriffs-/Schadenswürfe lösen keine erneute Aktivitätsbenutzung aus. Für bestimmte Homebrew-Aktivitäten sind nur die vom System angebotenen Funktionen sichtbar.
- Die Originalbogen-Schaltfläche bleibt im ausgeklappten Bereich. Alle anderen HUD-Komponenten bleiben erhalten.
- **Teststatus:** Syntax-/Browser-Mock-Tests, aber kein Live-Test in einer Foundry-v14-Welt. Bitte insbesondere Schablonen bei euren Zaubern in der Testwelt überprüfen.