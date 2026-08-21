#!/usr/bin/env python
"""papers_index.json + concept_map.yaml -> data/graph.json

Run via `npm run graph`. The output is committed so CI stays a plain Astro
build (see DEPLOYMENT.md).

Validations, per SPEC.md §3:
  FAIL  a tag in concept_map.yaml that does not exist in topics_flat (phantom)
  WARN  a tag in topics_flat absent from concept_map.yaml (unmapped)
  WARN  papers resolving to zero concepts (expected: the 2 `(unconfirmed)` ones)
  INFO  orphan concepts with no edges -> the "reading gaps" panel
"""
from __future__ import annotations

import itertools
import json
import sys
from collections import Counter, defaultdict

from common import (
    GRAPH_JSON,
    concept_label,
    load_concept_map,
    load_papers,
    parse_path,
    slugify,
)

DEFAULT_MIN_WEIGHT = 2  # the 28-node backbone; unfiltered is visual noise


def main() -> int:
    index = load_papers()
    cmap = load_concept_map()
    concepts: dict[str, list[str]] = cmap["concepts"]
    topics_flat = set(index["topics_flat"])

    # tag -> [concept_id, ...]. A tag may map to several concepts on purpose;
    # those dual mappings are what create the cross-theme edges.
    tag_to_concepts: dict[str, list[str]] = defaultdict(list)
    phantom: list[tuple[str, str]] = []
    for cid, tags in concepts.items():
        for tag in tags or []:
            if tag not in topics_flat:
                phantom.append((cid, tag))
            tag_to_concepts[tag].append(cid)

    unmapped = sorted(topics_flat - set(tag_to_concepts))

    if phantom:
        print(f"FAIL: {len(phantom)} phantom tag(s) in concept_map.yaml "
              "(not present in papers_index.json.topics_flat):", file=sys.stderr)
        for cid, tag in phantom:
            print(f"  {cid}: {tag!r}", file=sys.stderr)
        return 1

    if unmapped:
        print(f"WARN: {len(unmapped)} raw tag(s) map to no concept:", file=sys.stderr)
        for tag in unmapped:
            print(f"  {tag!r}", file=sys.stderr)

    # --- resolve each paper to its concept set -----------------------------
    paper_concepts: dict[str, list[str]] = {}
    concept_papers: dict[str, list[str]] = defaultdict(list)
    concept_themes: dict[str, Counter] = defaultdict(Counter)
    zero_concept: list[str] = []

    for paper in index["papers"]:
        slug = slugify(paper["title"])
        theme, _sub = parse_path(paper["path"])
        resolved: list[str] = []
        for tag in paper.get("tags") or []:
            for cid in tag_to_concepts.get(tag, ()):
                if cid not in resolved:
                    resolved.append(cid)
        resolved.sort()
        paper_concepts[slug] = resolved
        if not resolved:
            zero_concept.append(slug)
        for cid in resolved:
            concept_papers[cid].append(slug)
            concept_themes[cid][theme] += 1

    if zero_concept:
        print(f"WARN: {len(zero_concept)} paper(s) resolve to 0 concepts "
              f"(expected 2, the `(unconfirmed)` ones): {', '.join(zero_concept)}",
              file=sys.stderr)

    # --- edges: two concepts share an edge per paper carrying both ---------
    edge_weight: Counter[tuple[str, str]] = Counter()
    edge_papers: dict[tuple[str, str], list[str]] = defaultdict(list)
    for slug, cids in paper_concepts.items():
        for a, b in itertools.combinations(sorted(cids), 2):
            edge_weight[(a, b)] += 1
            edge_papers[(a, b)].append(slug)

    nodes = []
    for cid in sorted(concepts):
        papers = sorted(concept_papers.get(cid, []))
        themes = concept_themes.get(cid, Counter())
        nodes.append({
            "id": cid,
            "label": concept_label(cid),
            "count": len(papers),
            "theme": themes.most_common(1)[0][0] if themes else None,
            "rawTags": sorted(concepts[cid] or []),
            "papers": papers,
        })

    edges = [
        {"source": a, "target": b, "weight": w, "papers": sorted(edge_papers[(a, b)])}
        for (a, b), w in sorted(edge_weight.items(), key=lambda kv: (-kv[1], kv[0]))
    ]

    # Orphans are threshold-dependent; the UI recomputes per slider position,
    # but we record the default so the homepage can quote a number statically.
    linked_at_default = {
        c for e in edges if e["weight"] >= DEFAULT_MIN_WEIGHT
        for c in (e["source"], e["target"])
    }
    orphans = sorted(n["id"] for n in nodes if n["id"] not in linked_at_default)

    graph = {
        "generated_from": index.get("generated"),
        "defaultMinWeight": DEFAULT_MIN_WEIGHT,
        "nodes": nodes,
        "edges": edges,
        "paperConcepts": paper_concepts,
        "orphans": orphans,
        "stats": {
            "papers": len(index["papers"]),
            "rawTags": len(topics_flat),
            "concepts": len(nodes),
            "edges": len(edges),
            "edgesAtDefault": sum(1 for e in edges if e["weight"] >= DEFAULT_MIN_WEIGHT),
            "unmappedTags": unmapped,
            "zeroConceptPapers": sorted(zero_concept),
        },
    }

    GRAPH_JSON.write_text(json.dumps(graph, indent=2, ensure_ascii=False) + "\n",
                          encoding="utf-8")

    s = graph["stats"]
    print(f"wrote {GRAPH_JSON.relative_to(GRAPH_JSON.parent.parent)}: "
          f"{s['concepts']} nodes, {s['edges']} edges "
          f"({s['edgesAtDefault']} at w>={DEFAULT_MIN_WEIGHT}), "
          f"{len(orphans)} orphan(s) at default threshold")
    return 0


if __name__ == "__main__":
    sys.exit(main())
