#!/usr/bin/env python3
"""Build the sealed RC17 Web Store package. Never print blocklist entries."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
EXT = ROOT / "extensions" / "chrome-shield"
OUT = ROOT / "dist" / "chrome-shield-webstore"
STAGE = OUT / "package"
DOMAIN_COUNT = 63336
RULE_COUNT = 64
COMPILED_SHA256 = "b8db042bdd94504ff33188bdb3741a54bcd63f07dd82ac175a8abc9d06b250d8"

# Explicit allowlist: no recursive source copy, raw data, dev manifest, or
# *.production.* names. Substitutions happen ONLY in ignored release staging.
SOURCES = {
    "manifest.json": "manifest.webstore.json",
    "blocklist-rules.json": "blocklist-rules.production.json",
    "blocklist-meta.js": "blocklist-meta.production.js",
    **{name: name for name in (
        "THIRD_PARTY_NOTICES.md", "service_worker.js", "signals.js",
        "popup.html", "popup.js", "options.html", "options.js",
        "blocked.html", "blocked.js", "rules.json",
        "icons/icon16.png", "icons/icon32.png", "icons/icon48.png",
        "icons/icon128.png",
    )},
}


class PackageError(ValueError):
    """A safe diagnostic authored here, never a parser's raw input."""


def require(ok, message):
    if not ok:
        raise PackageError(message)


def validate_payload(payload):
    """Validate bytes, with errors deliberately excluding domain values."""
    require(set(payload) == set(SOURCES), "release file allowlist mismatch")
    manifest = json.loads(payload["manifest.json"])
    require(manifest.get("manifest_version") == 3, "Web Store manifest must be MV3")
    version = manifest.get("version", "")
    require(isinstance(version, str) and re.fullmatch(r"\d+(?:\.\d+){0,3}", version),
            "invalid Web Store version")
    require(manifest.get("externally_connectable") == {
        "matches": ["https://nof-mauve.vercel.app/*"]
    }, "Web Store bridge must allow only the production origin")
    require(manifest.get("permissions") == ["declarativeNetRequest"],
            "unexpected Web Store permissions")
    require(manifest.get("host_permissions") == ["http://*/*", "https://*/*"],
            "unexpected host permissions")
    require(manifest.get("background") == {
        "service_worker": "service_worker.js", "type": "module"
    }, "module service worker declaration mismatch")
    resources = manifest.get("declarative_net_request", {}).get("rule_resources")
    require(resources == [
        {"id": "nof_static_rules", "enabled": True, "path": "rules.json"},
        {"id": "nof_bundled_blocklist", "enabled": False, "path": "blocklist-rules.json"},
    ], "static ruleset declarations must match, with bundled protection initially off")
    require(payload["THIRD_PARTY_NOTICES.md"].strip(), "third-party notices are empty")

    rules = json.loads(payload["blocklist-rules.json"])
    require(isinstance(rules, list) and len(rules) == RULE_COUNT,
            "production rule count mismatch")
    domains = []
    for index, rule in enumerate(rules, 1):
        chunk = rule.get("condition", {}).get("requestDomains")
        require(isinstance(chunk, list) and 1 <= len(chunk) <= 1000,
                "invalid production domain chunk")
        require(all(isinstance(d, str) and d.isascii() for d in chunk),
                "invalid production domain encoding")
        require(rule == {
            "id": index, "priority": 1,
            "action": {"type": "redirect", "redirect": {"extensionPath": "/blocked.html"}},
            "condition": {"requestDomains": chunk, "resourceTypes": ["main_frame"]},
        }, "invalid production DNR rule structure or IDs")
        domains.extend(chunk)
    require(len(domains) == DOMAIN_COUNT and domains == sorted(set(domains)),
            "production domains must match the unique, sorted release count")
    # Matches canonicalDomainsJson in scripts/lib/blocklist-normalize.mjs.
    canonical = (json.dumps(domains, ensure_ascii=False, indent=2) + "\n").encode()
    digest = hashlib.sha256(canonical).hexdigest()
    require(digest == COMPILED_SHA256, "compiled domains differ from the sealed RC17 digest")

    match = re.fullmatch(
        r"(?:\s*//[^\n]*\n)*\s*export const BLOCKLIST_META\s*=\s*(\{.*\});\s*",
        payload["blocklist-meta.js"].decode("utf-8"), flags=re.S,
    )
    require(match is not None, "production BLOCKLIST_META cannot be parsed")
    meta = json.loads(match.group(1))
    require(meta.get("listType") == "production"
            and meta.get("domainCount") == DOMAIN_COUNT
            and meta.get("ruleCount") == RULE_COUNT
            and meta.get("compiledSha256") == digest,
            "production metadata does not match the compiled rules")
    return version


def release_payload():
    attr = EXT / "data" / "BLOCKLIST_ATTRIBUTION.md"
    require(attr.is_file(), "blocklist attribution is missing")
    flags = re.findall(r"^PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED\s*=\s*(\w+)\s*$",
                       attr.read_text(encoding="utf-8"), flags=re.M)
    require(flags == ["YES"], "expected exactly one cleared license flag")
    payload = {}
    for name, source in SOURCES.items():
        path = EXT / source
        require(path.is_file() and not path.is_symlink(), f"missing or symlinked release file: {source}")
        payload[name] = path.read_bytes()
    validate_payload(payload)
    return payload


def verify_zip(zip_path, payload):
    with zipfile.ZipFile(zip_path) as archive:
        names = archive.namelist()
        require(len(names) == len(SOURCES) and set(names) == set(SOURCES),
                "ZIP contents mismatch (including duplicate entries)")
        require(archive.testzip() is None, "ZIP CRC/integrity failure")
        for name, expected in payload.items():
            require(archive.read(name) == expected, f"ZIP substitution mismatch: {name}")
        validate_payload({name: archive.read(name) for name in names})


def verify_stage(payload):
    require(STAGE.is_dir() and not STAGE.is_symlink(), "release staging is missing or symlinked")
    # Chrome may add its own compiled cache after loading the exact staging dir.
    paths = [p for p in STAGE.rglob("*") if p.relative_to(STAGE).parts[0] != "_metadata"]
    require(not any(p.is_symlink() for p in paths), "symlink in release staging")
    names = {p.relative_to(STAGE).as_posix() for p in paths if p.is_file()}
    require(names == set(SOURCES), "staging file allowlist mismatch")
    for name, expected in payload.items():
        require((STAGE / name).read_bytes() == expected, f"staging substitution mismatch: {name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify existing staging and ZIP without writing")
    args = parser.parse_args()
    # Do not follow dist/output symlinks into another tree, even during cleanup.
    for directory in (ROOT / "dist", OUT, STAGE):
        require(not directory.is_symlink(), "release output directory must not be symlinked")
    payload = release_payload()
    version = validate_payload(payload)
    zip_path = OUT / f"NoF-Shield-{version}-webstore.zip"
    require(not zip_path.is_symlink(), "release ZIP must not be symlinked")
    if not args.check:
        OUT.mkdir(parents=True, exist_ok=True)
        # Validate the complete new artifact before replacing the previous release.
        with tempfile.TemporaryDirectory(prefix=".package-", dir=OUT) as temporary:
            work = Path(temporary)
            stage = work / "package"
            for name, content in payload.items():
                target = stage / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(content)
            candidate = work / zip_path.name
            with zipfile.ZipFile(candidate, "w") as archive:
                for name in sorted(payload):
                    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                    info.create_system = 3
                    info.external_attr = 0o100644 << 16
                    info.compress_type = zipfile.ZIP_DEFLATED
                    archive.writestr(info, payload[name], compresslevel=9)
            verify_zip(candidate, payload)
            if STAGE.exists():
                shutil.rmtree(STAGE)
            stage.replace(STAGE)
            candidate.replace(zip_path)
    verify_stage(payload)
    verify_zip(zip_path, payload)
    print("WEBSTORE_PACKAGE=PASS")
    print(f"version={version}\nrules={RULE_COUNT}\ndomains={DOMAIN_COUNT}")
    print(f"compiledSha256={COMPILED_SHA256}")
    print(f"zip={zip_path}\nzipBytes={zip_path.stat().st_size}")
    print(f"zipSha256={hashlib.sha256(zip_path.read_bytes()).hexdigest()}")
    print(f"zipFileCount={len(SOURCES)}")


if __name__ == "__main__":
    try:
        main()
    except PackageError as error:
        raise SystemExit(f"ABORT: {error}")
    except (ValueError, OSError, KeyError, TypeError, AttributeError, zipfile.BadZipFile):
        # Never echo parser exceptions: malformed inputs could contain raw domains.
        raise SystemExit("ABORT: Web Store package validation failed; inspect inputs locally (no domain values logged).")
