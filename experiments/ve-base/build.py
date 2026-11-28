#!/usr/bin/env python3
"""Build the isolated Silber VE experiment from a pinned upstream checkout."""
import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

UPSTREAM = "ba65fbca627e8102f30719a432586375cc5164cf"
UPSTREAM_VERSION = "1.2.2"
PACKAGE = "silber-hud-ve"
VERSION = "0.1.0"
HERE = Path(__file__).resolve().parent

def replace_once(path, old, new):
    s = path.read_text(encoding="utf-8")
    if s.count(old) != 1:
        raise ValueError(f"Upstream anchor changed: {path.name}: {old[:80]}")
    path.write_text(s.replace(old, new, 1), encoding="utf-8")

def migrate_namespace(s):
    # Preserve VE's DOM classes, its localization namespace and upstream URLs.
    # Only settings, document flags, storage keys, and actual package paths change.
    s = re.sub(r"([\"'\x60])ve-mobile(?=[\"'\x60:]|\.(?!css\b|mjs\b|js\b|png\b|zip\b)|/)", r"\g<1>" + PACKAGE, s)
    s = s.replace("modules/ve-mobile/", f"modules/{PACKAGE}/")
    s = re.sub(r"(?<![\w-])module\.ve-mobile(?![\w-])", "module." + PACKAGE, s)
    return s

def build(source, output):
    sha = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
    if sha != UPSTREAM:
        raise ValueError(f"Expected upstream {UPSTREAM}, got {sha}")
    if subprocess.check_output(["git", "-C", str(source), "status", "--porcelain"], text=True).strip():
        raise ValueError("Use a clean upstream checkout")
    manifest = json.loads((source / "module.json").read_text(encoding="utf-8"))
    if manifest["id"] != "ve-mobile" or manifest["version"] != UPSTREAM_VERSION:
        raise ValueError("Unexpected upstream manifest")
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="silber-ve-") as temp:
        root = Path(temp) / PACKAGE
        root.mkdir()
        for name in ("src", "assets", "locales"):
            shutil.copytree(source / name, root / name)
        for name in ("LICENSE", "README.md", "CHANGELOG.md"):
            if (source / name).is_file():
                shutil.copy2(source / name, root / ("UPSTREAM-" + name if name != "LICENSE" else name))
        license_text = (root / "LICENSE").read_text(encoding="utf-8")
        assert "Silvestrae" in license_text and "MIT License" in license_text
        modified = []
        for file in sorted(root.rglob("*")):
            if file.is_file() and file.suffix in {".mjs", ".js", ".css", ".html", ".json", ".webmanifest"}:
                old = file.read_text(encoding="utf-8")
                new = migrate_namespace(old)
                if old != new:
                    file.write_text(new, encoding="utf-8")
                    modified.append(str(file.relative_to(root)))
        # The original confirmation dialog remains mandatory. Desktop/off
        # still returns to standard Foundry; Tablet is the experimental PC HUD.
        replace_once(root / "src/foundry/activation-policy.mjs",
            "resolvedAutoMode = classifyRuntimeMode({ window, navigator });",
            "resolvedAutoMode = classifyRuntimeMode({ window, navigator });\n"
            "        if (resolvedAutoMode === \"desktop\") resolvedAutoMode = \"tablet\";")
        replace_once(root / "src/ui/app-frame.mjs",
            'className: "ve-mobile-app", attrs: { role: "application"',
            'className: "ve-mobile-app silber-ve-app", attrs: { role: "application"')
        # Do not allow the upstream release notifier to advertise incompatible
        # upstream ZIPs as updates to this independent prototype.
        replace_once(root / "src/foundry/update-notice-gateway.mjs",
            "  scope.timeout(run, 0);",
            "  // Disabled in Silber experimental builds: no upstream update polling.")
        replace_once(root / "src/foundry/preferences.mjs",
            'export const MODULE_ID = "' + PACKAGE + '";',
            'export const MODULE_ID = "' + PACKAGE + '"; // Silber experimental namespace')
        # Avoid overriding upstream style protection. Our own design is appended
        # to the exact same named cascade layer, after the upstream declarations.
        theme = (HERE / "silber-theme.css").read_text(encoding="utf-8")
        (root / "assets/silber-theme.css").write_text(theme, encoding="utf-8")
        manifest.update(id=PACKAGE, title="Silber HUD – VE Prototype", version=VERSION,
                        description="Experimental Silber fantasy HUD based on VE Mobile 1.2.2; tablet split view on desktop, native phone/tablet presentation.")
        manifest["compatibility"] = {"minimum": "14"}
        manifest["authors"] = list(manifest.get("authors", [])) + [{"name": "Silber HUD Projekt"}]
        manifest["styles"] = list(manifest["styles"]) + ["assets/silber-theme.css"]
        manifest["url"] = "https://github.com/Shining-Moon-54/silbers-HUD-Overhaul/tree/develop-ve-base"
        # Manual-only package until tested: never point to VE's update channel.
        for key in ("manifest", "download"):
            manifest.pop(key, None)
        (root / "module.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        shutil.copy2(HERE / "README.md", root / "README.md")
        shutil.copy2(HERE / "nav-capsule.svg", root / "assets/silber-nav-capsule.svg")
        assert all((root / p).is_file() for p in manifest["esmodules"] + manifest["styles"] + [x["path"] for x in manifest["languages"]])
        assert 'export const MODULE_ID = "' + PACKAGE + '"' in (root / "src/foundry/preferences.mjs").read_text()
        assert "silber-ve-app" in (root / "src/ui/app-frame.mjs").read_text()
        # Syntax check every runtime module against the real upstream sources.
        modules = sorted(root.rglob("*.mjs"))
        for file in modules:
            subprocess.run(["node", "--check", str(file)], check=True)
        subprocess.run(["node", str(HERE / "smoke.mjs"), str(root)], check=True)
        archive = output / f"{PACKAGE}-{VERSION}.zip"
        with ZipFile(archive, "w", ZIP_DEFLATED, compresslevel=6) as z:
            for file in sorted(root.rglob("*")):
                if file.is_file():
                    z.write(file, file.relative_to(root).as_posix())
        with ZipFile(archive) as z:
            assert z.testzip() is None and json.loads(z.read("module.json"))["id"] == PACKAGE
        report = {"upstream": sha, "version": VERSION, "moduleId": PACKAGE, "syntaxChecked": len(modules),
                  "namespaceFilesChanged": modified, "archiveBytes": archive.stat().st_size,
                  "liveFoundryTest": False}
        (output / "build-report.json").write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps(report, indent=2))
        return archive

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--upstream", required=True, type=Path)
    parser.add_argument("--out", type=Path, default=Path("dist-ve"))
    args = parser.parse_args()
    build(args.upstream.resolve(), args.out.resolve())
