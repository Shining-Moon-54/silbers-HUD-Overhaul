# VE Mobile – technische Referenz für Silber HUD

Upstream: https://github.com/Silvestrae/ve-mobile (Stand: v1.2.1, Foundry 13/14, MIT für Quellcode).

VE Mobile ist ein eigenständiges Mobil- und Tablet-HUD. Silber HUD ist eine Desktop-Spieloberfläche und soll **keine zweite VE-Mobile-Laufzeit** aufbauen oder mit deren Modus-/Canvassteuerung konkurrieren.

## Nützliche Vorarbeit

- `src/foundry/systems/dnd5e/collective-actor-view.mjs`: natives Gruppenmodell (`Actor.type = group`, `system.members`). Silber HUD 0.5.1 liest genau diese nativen Referenzen, prüft aber die Zugriffsberechtigung für jedes Mitglied.
- `src/kernel/signal-store.mjs`, `src/kernel/task-scope.mjs`: saubere Trennung zwischen Datenänderungen, Rendering und Lifecycle. Gute Vorlage für spätere Performanceoptimierungen unseres HUDs.
- `src/foundry/actor-token-placement-gateway.mjs`: Validierung von Szene, User-Berechtigung und Drop-Ziel über mehrere asynchrone Schritte. Kandidat für eine spätere Härtung unseres eigenen Token-Drag-&-Drop-Codes.
- `src/foundry/chat-composer-dock.mjs`: Chat-Eingabe mit aufklappbarem Dock und Beibehaltung des nativen Formulars. Inspiration für unsere Enter-Chat-Architektur.
- `src/foundry/mobile-graphics-policy.mjs`, `src/kernel/performance-observer.mjs`: Grafik-/Leistungsdiagnose ohne schweres Polling; für mobile Geräte besonders hilfreich.

**Keine fremden Bilder, Schriften oder Stylesheets übernommen.** VE Mobile weist separat auf unterschiedliche Bild- und Font-Lizenzen hin; unter MIT lizenzierter Code ist nicht automatisch ein Freibrief für dessen komplette Medienbibliothek.

## Gruppenmodell im Silber HUD

- `Player` ist immer eine sichtbare, virtuelle HUD-Gruppe, automatisch mit den via Foundry User Configuration zugewiesenen Hauptcharakteren befüllt.
- Weitere Gruppenakteure werden mit eigenen Bereichen angezeigt. Player bleiben ausschließlich in Player, um doppelte Einträge zu vermeiden.
- Im dritten Dock-Tab werden Akteure nach ihren Foundry-Ordnern angezeigt.
- Keine automatische Migration oder Anlage von Actor-Folders bzw. Group-Actor-Dokumenten.
- Zugriffsberechtigungen bleiben bei jedem Gruppenmitglied maßgeblich.