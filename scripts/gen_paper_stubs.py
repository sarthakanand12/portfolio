#!/usr/bin/env python
"""ONE-SHOT: papers_index.json -> src/content/papers/<slug>.md

Already ran. It exists to create a stub for a *newly added* paper, not to
regenerate the set — those files carry hand-added arXiv links and notes, and
bulk regeneration destroys them (CLAUDE.md).

Guard: never overwrites an existing file. There is no --force; the `stub: true`
marker that once made overwriting safe is gone, so the script can no longer tell
a pristine stub from a hand-edited one. Delete a file by hand if you truly want
it rebuilt.
"""
from __future__ import annotations

import argparse
import sys

from common import PAPERS_CONTENT, load_papers, parse_path, slugify


def yaml_str(value: str) -> str:
    """Quote a scalar so odd tags like `(IA)^3` survive YAML round-trip."""
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def frontmatter(paper: dict) -> str:
    theme, subtheme = parse_path(paper["path"])
    tags = paper.get("tags") or []
    unconfirmed = any("(unconfirmed)" in t for t in tags)
    note = paper.get("note")

    lines = [
        "---",
        f"title: {yaml_str(paper['title'])}",
        f"theme: {yaml_str(theme)}",
        f"subtheme: {yaml_str(subtheme) if subtheme else 'null'}",
        "tags:",
    ]
    lines += [f"  - {yaml_str(t)}" for t in tags]
    lines += [
        "url: null",
        "venue: null",
        "year: null",
        f"status: {'skimmed' if unconfirmed else 'noted' if note else 'read'}",
        f"confidence: {'unconfirmed' if unconfirmed else 'confirmed'}",
        f"indexNote: {yaml_str(note) if note else 'null'}",
        "---",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.parse_args()

    PAPERS_CONTENT.mkdir(parents=True, exist_ok=True)
    index = load_papers()

    written = skipped = 0
    seen: dict[str, str] = {}

    for paper in index["papers"]:
        slug = slugify(paper["title"])
        if slug in seen:
            print(f"FAIL: slug collision {slug!r} between "
                  f"{seen[slug]!r} and {paper['title']!r}", file=sys.stderr)
            return 1
        seen[slug] = paper["title"]

        dest = PAPERS_CONTENT / f"{slug}.md"
        if dest.exists():
            skipped += 1
            continue
        dest.write_text(frontmatter(paper), encoding="utf-8")
        written += 1

    print(f"wrote {written} new, left {skipped} existing untouched")
    return 0


if __name__ == "__main__":
    sys.exit(main())
