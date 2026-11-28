# Silber HUD – VE-Prototyp 0.1.0

Experiment, noch kein Ersatz für das bisherige Silber HUD.

Basis: [VE Mobile 1.2.2](https://github.com/Silvestrae/ve-mobile/tree/ba65fbca627e8102f30719a432586375cc5164cf), MIT, Copyright (c) 2026 Silvestrae. Die Original-Lizenz bleibt unverändert erhalten. Originaler Quellcode und Assets werden beim Build aus dem festgelegten Commit übernommen.

## Test in einer separaten Foundry-v14-D&D5e-Welt

1. Vorhandenes Silber HUD und VE Mobile deaktivieren. Nicht gleichzeitig mit dem Prototyp verwenden: Die VE-DOM-Klassen und Teile der Laufzeitarchitektur werden absichtlich beibehalten.
2. Die ZIP in den neuen Ordner `Data/modules/silber-hud-ve/` entpacken. module.json muss direkt darin liegen.
3. Modul **Silber HUD – VE Prototype** aktivieren, Foundry neu laden.
4. Bei der Modusabfrage am PC **Tablet** auswählen (Split Screen aktivieren), auf Mobilgeräten Phone/Tablet. **Desktop** in VE bedeutet weiterhin die normale Foundry-Oberfläche und ist der Rückweg.
5. Im dunklen Theme die Silber-Gestaltung prüfen. Auf breiten Maus-Displays wird die VE-Navigation in eine oben liegende Kapsel umgeordnet; das Karten-/Charakter-Split-Layout bleibt die Grundlage.

**Noch nicht umgesetzt:** gleichzeitiger Chat links und Charakter rechts, separate Player-Gruppenleiste, Silber-Undo, vollständige deutsche Übersetzung, eigenständiges neues Desktop-Layout über den Split-Modus hinaus. Keine Live-Foundry- oder Gerätetests. Die vorgesehene neue Modul-ID isoliert Settings/Flags und wesentliche Speicherpfade, ist aber noch nicht im laufenden Foundry verifiziert. Nicht für produktive Welten empfohlen. Der Original-Upstream-Updater ist deaktiviert, das Manifest enthält keine Update-URL.

## Reproduzierbarer Build (Linux)

```bash
git clone https://github.com/Silvestrae/ve-mobile.git ve-upstream
git -C ve-upstream checkout --detach ba65fbca627e8102f30719a432586375cc5164cf
python3 experiments/ve-base/build.py --upstream ve-upstream --out dist-ve
```

Benötigt Python 3, Git und Node.js. Das Build-Skript prüft die exakte Revision, alle MJS-Dateien auf Syntax, die Aktivierungslogik und die ZIP. Kein automatisches öffentliches Release, main bleibt unverändert.
