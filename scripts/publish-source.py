#!/usr/bin/env python3
"""Publish the current source tree to GitHub using the REST API (no git binary).

Reads the token from the GITHUB_TOKEN environment variable at runtime.
The token is never printed, logged, or written to disk.

Scope: replaces the contents of the target branch with this project's source
(dependencies, build output, caches, and secrets excluded).

Run: python3 scripts/publish-source.py
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

OWNER = "megsworkresources-cmd"
REPO = "ShiftedTone"
BRANCH = "main"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://api.github.com"
COMMIT_MESSAGE = (
    "Launch-ready source: demo-vs-real labeling, convex httpAction fix,\n"
    "auth component tests, launch polish\n\n"
    "Pushed via scripts/publish-source.py (GitHub REST API)."
)

# Same exclusions as scripts/make-source-zip.py: deps, build output, caches,
# secrets (managed in the Keys/API keys UI), and any archive copies.
SKIP_DIRS = {
    "node_modules",
    "dist",
    ".git",
    "test-results",
    ".cache",
    "isolate",
}
SKIP_FILES = {
    "shiftedtone-source.zip",
    os.path.join("public", "shiftedtone-source.zip"),
    ".DS_Store",
    ".env.keys",
    ".env.local",
}
SKIP_SUFFIXES = (".pyc", ".log")


def api(method: str, path: str, payload: dict | None = None) -> dict:
    token = os.environ["GITHUB_TOKEN"]
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        f"{API}{path}",
        method=method,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "shiftedtone-publisher",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        if exc.code == 401:
            sys.exit("ERROR: token rejected (401). Check GITHUB_TOKEN in the Keys/API keys UI.")
        if exc.code == 403:
            sys.exit(
                "ERROR: forbidden (403). The token needs Contents: Read and write "
                f"permission on {OWNER}/{REPO}. Detail: {detail}"
            )
        raise RuntimeError(f"{method} {path} -> {exc.code}: {detail}") from exc


def collect_files() -> list[str]:
    files: list[str] = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            rel = os.path.relpath(os.path.join(dirpath, name), ROOT)
            if name in SKIP_FILES or rel in SKIP_FILES:
                continue
            if name.endswith(SKIP_SUFFIXES):
                continue
            files.append(rel)
    return sorted(files)


def make_blob(rel: str) -> dict:
    with open(os.path.join(ROOT, rel), "rb") as fh:
        data = fh.read()
    blob = api(
        "POST",
        f"/repos/{OWNER}/{REPO}/git/blobs",
        {"content": base64.b64encode(data).decode(), "encoding": "base64"},
    )
    return {"path": rel.replace(os.sep, "/"), "mode": "100644", "type": "blob", "sha": blob["sha"]}


def publish() -> None:
    files = collect_files()
    print(f"collected {len(files)} files")

    print("creating blobs ...")
    with ThreadPoolExecutor(max_workers=8) as pool:
        entries = list(pool.map(make_blob, files))
    print(f"created {len(entries)} blobs")

    ref = api("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
    parent_sha = ref["object"]["sha"]

    for attempt in range(2):
        parent = api("GET", f"/repos/{OWNER}/{REPO}/git/commits/{parent_sha}")
        base_tree = api(
            "GET",
            f"/repos/{OWNER}/{REPO}/git/trees/{parent['tree']['sha']}?recursive=1",
        )
        if base_tree.get("truncated"):
            sys.exit("ERROR: remote tree too large to diff; prune the repo manually first.")
        remote_paths = {
            item["path"]
            for item in base_tree.get("tree", [])
            if item.get("type") == "blob" and not item["path"].endswith("/")
        }
        local_paths = {e["path"] for e in entries}
        # sha: null entries delete files that exist remotely but not locally,
        # so the branch ends up exactly matching this source tree.
        deletions = [
            {"path": p, "mode": "100644", "type": "blob", "sha": None}
            for p in sorted(remote_paths - local_paths)
        ]
        if deletions:
            print(f"removing {len(deletions)} stale file(s) from the branch")
        tree = api(
            "POST",
            f"/repos/{OWNER}/{REPO}/git/trees",
            {"tree": entries + deletions, "base_tree": parent["tree"]["sha"]},
        )
        commit = api(
            "POST",
            f"/repos/{OWNER}/{REPO}/git/commits",
            {
                "message": COMMIT_MESSAGE,
                "tree": tree["sha"],
                "parents": [parent_sha],
                "author": {
                    "name": "ShiftedTone Publisher",
                    "email": "megsworkresources-cmd@users.noreply.github.com",
                },
            },
        )
        try:
            api(
                "PATCH",
                f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}",
                {"sha": commit["sha"], "force": False},
            )
            break
        except RuntimeError as exc:
            if attempt == 0 and "422" in str(exc):
                print("branch moved; retrying against latest head ...")
                ref = api("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
                parent_sha = ref["object"]["sha"]
                continue
            raise
    else:
        sys.exit("ERROR: could not fast-forward the branch after retry.")

    print(f"pushed commit {commit['sha'][:10]} to {BRANCH}")
    print(f"https://github.com/{OWNER}/{REPO}/commit/{commit['sha']}")


def main() -> None:
    if "GITHUB_TOKEN" not in os.environ or not os.environ["GITHUB_TOKEN"].strip():
        sys.exit(
            "ERROR: GITHUB_TOKEN is not set. Add it in the Freebuff Keys/API keys UI "
            "(a fine-grained token with Contents: Read and write on "
            f"{OWNER}/{REPO}), then re-run."
        )
    who = api("GET", "/user")
    print(f"token ok (account: {who.get('login', '?')})")
    publish()


if __name__ == "__main__":
    main()
