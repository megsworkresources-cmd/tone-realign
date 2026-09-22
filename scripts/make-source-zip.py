#!/usr/bin/env python3
"""Package the current source tree into shiftedtone-source.zip.

Excludes dependencies, build output, caches, secrets (managed in the
Keys/API keys UI), editor cruft, and the archive itself. Re-run any time
you want a fresh snapshot of the project for import into git or a deploy.
"""

from __future__ import annotations

import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "shiftedtone-source.zip"

SKIP_DIRS = {
    "node_modules",   # dependencies — reinstall from lockfile
    "dist",           # build output
    ".git",           # version control metadata
    "test-results",   # playwright artifacts
    ".cache",
    "isolate",        # platform PWA asset build (regenerated)
}

# Secrets are managed through the Keys/API keys UI and must never ship.
# src/convex/_sourceSnapshot.ts is the GENERATED embed of this very zip
# (served at /source-zip) — excluding it prevents a growth loop.
SKIP_FILES = {
    OUT,
    os.path.join("public", OUT),  # download copy served from the preview
    os.path.join("src", "convex", "_sourceSnapshot.ts"),
    ".DS_Store",
    ".env.keys",
    ".env.local",
}

SKIP_SUFFIXES = (".pyc", ".log")


def main() -> None:
    count = 0
    out_path = os.path.join(ROOT, OUT)
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        for dirpath, dirnames, filenames in os.walk(ROOT):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                full = os.path.join(dirpath, name)
                rel = os.path.relpath(full, ROOT)
                # Check basename AND repo-relative path (SKIP_FILES mixes both).
                if name in SKIP_FILES or rel in SKIP_FILES or name.endswith(SKIP_SUFFIXES):
                    continue
                z.write(full, rel)
                count += 1

    size = os.path.getsize(out_path)
    print(f"packed {count} files -> {OUT} ({size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
