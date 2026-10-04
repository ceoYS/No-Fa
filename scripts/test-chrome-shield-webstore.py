#!/usr/bin/env python3
"""Release guard tests; needs local production artifacts, never logs domains."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import warnings
import zipfile

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location(
    "packager", Path(__file__).with_name("package-chrome-shield-webstore.py")
)
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)


class ReleaseGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = packager.release_payload()

    def modified(self, name, change):
        payload = dict(self.payload)
        data = json.loads(payload[name])
        change(data)
        payload[name] = json.dumps(data).encode()
        return payload

    def rejects(self, payload):
        with self.assertRaises(packager.PackageError):
            packager.validate_payload(payload)

    def test_valid_sealed_release(self):
        self.assertEqual(packager.validate_payload(self.payload), "0.0.1")

    def test_same_count_domain_tamper_is_rejected(self):
        # Preserve count/order/shape so the actual sealed digest must catch drift.
        rules = json.loads(self.payload["blocklist-rules.json"])
        domains = sorted([d for r in rules for d in r["condition"]["requestDomains"]][1:]
                         + ["nof-release-guard.invalid"])
        for index, rule in enumerate(rules):
            rule["condition"]["requestDomains"] = domains[index * 1000:(index + 1) * 1000]
        payload = {**self.payload, "blocklist-rules.json": json.dumps(rules).encode()}
        with self.assertRaisesRegex(packager.PackageError, "sealed RC17 digest"):
            packager.validate_payload(payload)

    def test_duplicate_rule_id_is_rejected(self):
        self.rejects(self.modified("blocklist-rules.json", lambda rules: rules[1].update(id=1)))

    def test_additional_rule_condition_is_rejected(self):
        self.rejects(self.modified("blocklist-rules.json", lambda rules:
                                  rules[0]["condition"].update(urlFilter="harmless-narrowing-token")))

    def test_redirect_target_leak_is_rejected(self):
        self.rejects(self.modified("blocklist-rules.json", lambda rules:
                                  rules[0]["action"]["redirect"].update(extensionPath="/blocked.html?target=test")))

    def test_fixture_metadata_is_rejected(self):
        self.rejects({**self.payload, "blocklist-meta.js": self.payload["blocklist-meta.js"].replace(b'"production"', b'"fixture"')})

    def test_stale_metadata_hash_is_rejected(self):
        self.rejects({**self.payload, "blocklist-meta.js": self.payload["blocklist-meta.js"].replace(
            packager.COMPILED_SHA256.encode(), b"0" * 64)})

    def test_dev_manifest_is_rejected(self):
        self.rejects({**self.payload, "manifest.json": (packager.EXT / "manifest.json").read_bytes()})

    def test_default_enabled_protection_is_rejected(self):
        self.rejects(self.modified("manifest.json", lambda manifest:
                                  manifest["declarative_net_request"]["rule_resources"][1].update(enabled=True)))

    def test_unsafe_version_is_rejected_before_creating_zip(self):
        self.rejects(self.modified("manifest.json", lambda manifest: manifest.update(version="../../escape")))

    def test_license_gate_requires_one_explicit_yes(self):
        with tempfile.TemporaryDirectory(prefix="nof-license-guard-") as directory:
            extension = Path(directory)
            (extension / "data").mkdir()
            for text in (
                "The reviewer can set PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED = YES later.",
                "PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED = NO\n",
                "PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED = YES\n" * 2,
            ):
                (extension / "data/BLOCKLIST_ATTRIBUTION.md").write_text(text)
                with patch.object(packager, "EXT", extension):
                    with self.assertRaisesRegex(packager.PackageError, "exactly one cleared license flag"):
                        packager.release_payload()

    def test_notices_are_required(self):
        for value in (None, b""):
            payload = dict(self.payload)
            if value is None:
                del payload["THIRD_PARTY_NOTICES.md"]
            else:
                payload["THIRD_PARTY_NOTICES.md"] = value
            self.rejects(payload)

    def test_raw_and_development_artifacts_are_rejected(self):
        for name in ("manifest.webstore.json", "blocklist-rules.production.json",
                     "adult-domains.production.json", "data/.sources/raw", "data/anything.json"):
            self.rejects({**self.payload, name: b"test-only"})

    def test_zip_duplicate_entry_is_rejected(self):
        with tempfile.TemporaryDirectory(prefix="nof-package-guard-") as directory:
            candidate = Path(directory) / "duplicate.zip"
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", UserWarning)
                with zipfile.ZipFile(candidate, "w") as archive:
                    for name, data in self.payload.items():
                        archive.writestr(name, data)
                    archive.writestr("manifest.json", self.payload["manifest.json"])
            with self.assertRaisesRegex(packager.PackageError, "duplicate entries"):
                packager.verify_zip(candidate, self.payload)


if __name__ == "__main__":
    unittest.main(verbosity=2)
