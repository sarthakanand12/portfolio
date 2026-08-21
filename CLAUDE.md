# CLAUDE.md

Context for Claude Code working in this repo. Read `SPEC.md` for the full design and `DEPLOYMENT.md` for the pipeline.

## What this repo is

A static Astro site with two audiences: the homepage sells to recruiters, everything else is Sarthak's personal research tooling. Built from `data/papers_index.json` (80 ML papers, 279 tags) and `data/concept_map.yaml` (49 canonical concepts).

The distinguishing feature is bidirectional paper ↔ project backlinks. Preserve them in any refactor.

## Commands

```bash
npm run dev       # localhost:4321
npm run build     # → dist/
npm run preview   # serve dist/ locally
npm run graph     # python scripts/build_graph.py → data/graph.json
```

## Hard rules

**Never edit `data/papers_index.json` or `data/concept_map.yaml` as a side effect of another task.** These are hand-curated sources of truth. Editing them is always an explicit, standalone request.

**Never regenerate `src/content/papers/*.md` in bulk.** `scripts/gen_paper_stubs.py` is a one-shot that ran once. Those files carry hand-added arXiv links and notes. Bulk regeneration destroys them.

**`concepts` on a paper are derived, never authored.** They come from `concept_map.yaml` at build time. If a paper needs a different concept, change the tag mapping, not the paper.

**No server-side anything.** GitHub Pages serves static files. No API routes, no `output: 'server'`, no runtime data fetching, no localStorage-dependent core features. If a feature seems to need a backend, it's out of scope — say so rather than working around it.

**Nothing from Convin that isn't cleared for publication.** Project descriptions must stay at the level already in `src/content/projects/`. Do not add internal metrics, client names, or architecture detail not already present.

## Conventions

- Schemas in `src/content/config.ts` are the contract. A content file that violates them **should fail the build** — don't add `.optional()` or `.catch()` to make a broken file pass. Fix the file.
- Only `/graph` hydrates JS. Everything else is zero-JS Astro. If a component needs `client:load`, justify it first.
- Paper slugs are kebab-case from the title, stable forever. Changing one breaks project backlinks and any external link.
- Raw tags are quoted verbatim from `papers_index.json`, including odd ones like `(IA)^3` and `attention sink (related)`. Don't normalize, retitle, or deduplicate them in display code.
- Python scripts use only stdlib + PyYAML. No new dependencies without asking.

## Design intent

The homepage is the only page that gets visual polish. `/research`, `/graph`, and `/papers/[slug]` are tools — information density beats aesthetics. Resist the urge to make the paper list pretty; make it fast and scannable.

Homepage section order is deliberate: hero → stats → **featured projects** → now strip → graph preview. Projects sit above the fold-ish because that's what recruiters read. The Figma wireframe (frame 01) shows the now-strip higher; the wireframe is outdated on this point and `SPEC.md` wins.

## Data facts worth knowing

- 80 papers, 279 raw tags, 91% of tags appear on exactly one paper — this is why the two-layer vocabulary exists. Don't "simplify" by graphing raw tags.
- 49 concepts, 147 edges, 39 at weight ≥ 2. Graph default filter is **weight ≥ 2** (28-node connected backbone). Unfiltered is visual noise.
- 2 papers (`Dolphin`, `Fusion functions for hybrid retrieval`) have `(unconfirmed)` tags and resolve to zero concepts. Expected. Render them with a "needs re-tagging" state; don't special-case them out of existence.
- `papers_index.json.data_quality_notes` lists 5 known filing errors. Surface these somewhere in the UI rather than hiding them.
- Theme and subtheme come from parsing the `path` field's first two segments. Don't duplicate them into frontmatter.

## Deferred — do not build

- arXiv API resolution (links are pasted by hand; `url` field is nullable)
- Notes/blog authoring workflow (the `.md` body already renders; writing is a content act)
- Bookmarks ingest
- Graph layers for papers / projects / raw tags — the wireframe shows a four-way toggle; build **concepts only**
- Embedding-based related-papers — related papers use concept set intersection, ranked by overlap size

## Known placeholders

Project `result` fields contain placeholder metrics (`"+X pt task-completion"`). These are Sarthak's to fill in. Flag them if you see them near launch; do not invent numbers.
