#!/usr/bin/env python3
"""Verify the /source-zip ops route serves a valid snapshot.

One-shot diagnostic: downloads the zip from the production Convex
deployment's HTTP router, validates its structure (root package.json, no
secret files), and prints a summary. Safe to re-run any time.
"""

from __future__ import annotations

import urllib.request
import zipfile

# Deployment URL is public (it appears in every Convex build log).
DEPLOYMENT = "https://amiable-shrimp-189.convex.site"
ROUTE = "/source-zip"


def main() -> None:
    url = DEPLOYMENT + ROUTE
    with urllib.request.urlopen(url, timeout=30) as res:
        data = res.read()
        status = res.status
        ctype = res.headers.get("Content-Type", "?")

    print(f"HTTP {status} | {len(data)} bytes | {ctype}")
    if status != 200:
        raise SystemExit("route did not return 200 — is the deployment up to date?")

    with zipfile.ZipFile(__import__("io").BytesIO(data)) as z:
        names = z.namelist()
        bad = z.testzip()

    print("zip OK:", len(names), "files")
    print("package.json at root:", "package.json" in names)
    secrets = [n for n in names if n.startswith(".env") and n != ".env.example"]
    print("secret files:", secrets if secrets else "none")
    print("CRC check:", "FAILED at " + bad if bad else "all entries OK")


if __name__ == "__main__":
    main()
