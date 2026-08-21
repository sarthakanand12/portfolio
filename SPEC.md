# Research Notebook — Project Specification

**Owner:** Sarthak Anand (github.com/falconboi12)
**Status:** Design complete, implementation not started
**Wireframes:** https://www.figma.com/design/yXGB4UC3G4A3lelCDGheye (5 frames)

---

## 1. What this is

A static site that does two jobs for two different audiences:

| Surface | Audience | Optimize for |
|---|---|---|
| Homepage (`/`) | Recruiters, hiring managers | Signal density, credibility, scannability in 30 seconds |
| Everything else | Sarthak | Personal tooling — bookkeeping, retrieval, recall |

This split is the single most important design constraint. **Only the homepage gets design attention.** The research library, graph, and paper pages are utilities: dense, fast, ugly-if-necessary. Do not spend effort making `/research` beautiful.

The differentiating idea is the **backlink between papers and projects** — "this project is grounded in these 6 papers" and, in reverse, "this paper fed into Yaksha." Most ML portfolios show projects. Almost none show the reading that produced them. That link is the product.

### Explicit non-goals

- No CMS, no admin UI, no write-back. The site is generated from files in the repo.
- No server, no database, no authentication. GitHub Pages serves static files only.
- No note-writing workflow in v1 (deferred — see §9).
- No automated arXiv metadata resolution in v1 (deferred — see §9). Links are added by hand.

---

## 2. Content sources

### 2.1 `papers_index.json` (exists, 46 KB)

The canonical paper store. Structure:

```json
{
  "generated": "2026-08-08",
  "paper_count": 80,
  "papers": [
    {
      "path": "Agents_and_Orchestration/agentic harness engg.pdf",
      "title": "Agentic Harness Engineering",
      "tags": ["agent harness design", "coding agents", "observability"],
      "note": null
    }
  ],
  "topics_by_theme": { "Agents & Orchestration": ["agent harness design", ...] },
  "topics_flat": ["(IA)^3", "adaptive retrieval", ...],
  "data_quality_notes": ["...", "..."]
}
```

**Known facts about this data (measured, not assumed):**

- 80 papers, 279 unique tags, avg 4.06 tags/paper
- 12 top-level themes, 24 subcategories (derived from the `path` field — first and second path segments)
- 7 papers have a non-null `note`
- **253 of 279 tags (91%) appear on exactly one paper**
- Only 65 of 3,160 paper-pairs share any tag
- 2 papers have placeholder `(unconfirmed)` tags because the PDFs failed to parse: `Dolphin` and `Fusion functions for hybrid retrieval`
- `data_quality_notes` records 5 known filing errors — surface these in the UI, don't hide them

**The `path` field carries the theme hierarchy.** `Dialogue_Systems/Dialogue_Policy_Planning/dfa rag...pdf` → theme `Dialogue Systems`, subtheme `Dialogue Policy Planning`. Parse it; don't duplicate it in frontmatter.

### 2.2 `concept_map.yaml` (exists, drafted)

The Layer-2 vocabulary. 49 canonical concepts, each listing the raw tags that map into it. A tag may map to more than one concept (~15 do, deliberately — those dual mappings are what create cross-theme edges).

```yaml
version: 1
concepts:
  dialogue-policy:
    - dialogue management
    - dialogue policy planning
    - finite automaton
    - finite-state dialogue control
    - hierarchical goals
    - proactive dialogue
    - semantic routing
    - topic management
    - workflow compliance
```

**Why two layers.** The 279 raw tags are excellent search facets and useless graph nodes — 91% of them connect to nothing. Collapsing to 49 concepts takes paper-pairs-with-a-shared-node from 65 to 403, and produces a 28-node connected backbone at edge weight ≥ 2. Verified numbers:

| Metric | Raw tags | Canonical concepts |
|---|---|---|
| Graph nodes | 279 | 49 |
| Singleton nodes | 253 (91%) | 0 |
| Linked paper-pairs (of 3,160) | 65 | 403 |
| Concept–concept edges | — | 147 (39 at w≥2, 10 at w≥3) |
| Largest connected component (w≥2) | — | 28 of 35 |
| Avg concepts/paper | — | 2.62 |

Keep both layers. Raw tags drive search and facets; concepts drive the graph and the "related papers" logic.

### 2.3 Per-paper Markdown (to be created)

One `.md` per paper in `src/content/papers/`. In v1 the body is empty or a stub — this is the file that later becomes a blog post per paper without any re-architecture.

### 2.4 Bookmarks (deferred to Phase 6)

Chrome export → `bookmarks.html` → parsed to `links.json`. Any bookmark whose URL is an arXiv abs page merges into the paper index instead of the links pile.

---

## 3. Data model

Astro content collections with Zod schemas. Schema violations must **fail the build** — that's the whole reason for using collections over loose JSON.

### `papers` collection

```ts
{
  slug: string,              // derived from title, kebab-case
  title: string,
  theme: string,             // path segment 1, humanized
  subtheme: string | null,   // path segment 2, humanized
  tags: string[],            // raw tags, verbatim from papers_index.json
  concepts: string[],        // derived at build from concept_map.yaml — NOT hand-authored
  url: string | null,        // arXiv abs link, added by hand
  pdf: string | null,
  code: string | null,
  authors: string | null,    // free text, optional
  venue: string | null,
  year: number | null,
  dateRead: Date | null,
  status: 'noted' | 'read' | 'skimmed',
  confidence: 'confirmed' | 'unconfirmed',   // the 2 unparseable papers
  projects: string[],        // slugs — the backlink
}
```

### `projects` collection

```ts
{
  slug: string,
  title: string,
  org: string,               // "Convin", "AICTE tender", "personal"
  period: string,
  status: 'production' | 'active' | 'shipped' | 'archived',
  stack: string[],
  problem: string,           // one sentence
  approach: string,          // 2-3 sentences
  result: string,            // metric-bearing where possible
  repo: string | null,
  writeup: string | null,
  featured: boolean,         // controls homepage appearance
  papers: string[],          // slugs — the reverse backlink
}
```

### `concepts` collection

Generated, not authored. One entry per key in `concept_map.yaml`:

```ts
{
  id: string,                // 'dialogue-policy'
  label: string,             // 'Dialogue Policy'
  rawTags: string[],
  paperCount: number,
  edges: { to: string, weight: number }[],
  note: string | null,       // optional hand-written gloss, from src/content/concepts/*.md
}
```

### Build-time derivation

`scripts/build_graph.{py,ts}` reads `papers_index.json` + `concept_map.yaml` and emits `data/graph.json`:

```json
{
  "nodes": [{ "id": "dialogue-policy", "label": "Dialogue Policy", "count": 6, "theme": "Dialogue Systems" }],
  "edges": [{ "source": "serving-systems", "target": "speculative-decoding", "weight": 6 }],
  "paperConcepts": { "dfa-rag": ["dialogue-policy", "rag-pipeline-design", "query-routing"] },
  "orphans": ["..."]
}
```

**Validation the script must perform and fail on:**
- Every tag in `papers_index.json.topics_flat` appears in `concept_map.yaml` (currently: 0 unmapped)
- Every tag in `concept_map.yaml` exists in `topics_flat` (currently: 0 phantom)
- Report papers resolving to 0 concepts (currently: 2, both `unconfirmed`) — warn, don't fail
- Report orphan concepts with no edges — these render as the "reading gaps" panel

---

## 4. Pages

Wireframe frames are in the Figma file, named `01 · Home / Intro` through `05 · Projects`. Frame descriptions below are normative; the Figma is the visual reference.

### `/` — Home  *(Frame 01 — the only page that gets design polish)*

Order matters. A recruiter reads top-down and leaves.

1. **Nav** — sticky. `Home · Research · Graph · Projects` + ⌘K search. Notes link omitted in v1.
2. **Hero** — name, one-line positioning ("ML Engineer at Convin — goal-directed dialogue agents, RL fine-tuning, and eval harnesses for production LLM systems"), links to GitHub / LinkedIn / Resume PDF / email.
3. **Stat strip** — 80 papers · 12 themes · 49 concepts · N projects. Cheap credibility; costs one build-time computation.
4. **Featured projects** — 2–3 cards, `featured: true`. Each shows problem / approach / result and the green "grounded in N papers" backlink bar. **This is the section recruiters actually read. Give it the most vertical space.**
5. **Now strip** — 3 cards: currently reading / currently building / open question. Manually edited, `src/content/now.md`. Signals that the site is alive.
6. **Topic map preview** — static thumbnail of the graph, links to `/graph`. Do not hydrate the force simulation on the homepage; it costs JS and the recruiter won't use it.

Frame 01 shows the Now strip above the projects. **Invert that** — projects first. The wireframe predates the audience decision.

### `/research` — Library  *(Frame 02)*

Three-column: facets | list | (nothing, list is wide).

- Search box over title + raw tags + note text. Client-side, prebuilt index (Pagefind or a plain JSON index — 80 papers is tiny, don't reach for a service).
- Facet rail: 12 themes with counts, then status (`noted` / `read` / `skimmed`), then confidence.
- Paper rows: title, theme/subtheme breadcrumb, raw tag chips, arXiv chip, note indicator.
- Sort: recent / theme / title.
- List ⇄ Graph toggle in the toolbar.

Dense list, no cards-with-shadows. This page is a tool.

### `/graph` — Knowledge graph  *(Frame 03)*

Three-column: controls | canvas | inspector.

- **Nodes = concepts** (49), sized by paper count, coloured by dominant theme.
- **Edges = shared papers**, thickness by weight. Default filter: weight ≥ 2 (yields the 28-node backbone; the unfiltered 147-edge version is noise).
- Layer toggle exists in the wireframe for papers/projects/raw-tags overlays — **build concepts only in v1.** The other layers are scope creep.
- Inspector panel on node click: concept name, paper count, strongest links, papers list, projects it feeds.
- **Orphan concepts panel** — concepts with zero edges at the current threshold. Framed as "reading gaps," which is the honest interpretation and the thing that makes this a personal tool rather than a toy.
- Rendering: `d3-force` + SVG. 49 nodes and 147 edges is trivially small; do not reach for canvas/WebGL. Hydrate this island only on `/graph`.

### `/papers/[slug]` — Paper detail  *(Frame 04)*

Two-column: main | sidebar.

- Header: title, authors/venue/date (optional, often null in v1), link chips (arXiv / PDF / code).
- Main: abstract (v1: absent or hand-pasted — the auto-fetch is deferred), then the note body from the `.md`. When notes don't exist yet, this column shows the paper's own `note` field from `papers_index.json` if present, otherwise a "not written up yet" state.
- Sidebar: concept chips, related papers (by shared concepts, ranked by overlap count, top 5), and the green "fed into" project backlink.

**The related-papers logic is pure set intersection over concepts.** No embeddings in v1 — that was contingent on abstract fetching, which is deferred.

### `/projects` and `/projects/[slug]`  *(Frame 05)*

- Card per project: title, org/period, stack chips, problem / approach / result, repo + write-up links.
- Green backlink bar: "grounded in N papers · concept1, concept2, concept3" linking to a filtered `/research` view.
- Detail page: long-form write-up (MDX body) + the full paper list.

### `/concepts/[id]` — optional, Phase 5

Per-concept page: gloss, raw tags folded into it, all papers, related concepts. Cheap to generate once `graph.json` exists.

---

## 5. Stack

| Layer | Choice | Why |
|---|---|---|
| Generator | **Astro 5** | Content collections with Zod validation; zero JS by default; islands for the one interactive page |
| Content | Markdown + MDX | Notes become blog posts later with no migration |
| Styling | Tailwind | Fine. Don't build a design system for a 6-page site |
| Graph | `d3-force` in a React/Preact island | 49 nodes — smallest tool that works |
| Search | Pagefind, or a hand-rolled JSON index | 80 records; either is over-engineering, pick the one with less config |
| Build scripts | Python (`scripts/`) | The concept-map work is already Python; PyYAML is the only dep |
| Host | GitHub Pages via Actions | See `DEPLOYMENT.md` |

**Rejected:** Quartz (Obsidian-shaped, portfolio pages fight it), Next.js static export (heavier, no benefit without a server), Jekyll (GitHub's default, but no content validation).

---

## 6. Repository layout

Two repos. Do not merge them.

**`falconboi12/falconboi12`** — profile README only. Currently three years stale (see §8). Rewrite to ~30 lines pointing at the site.

**`falconboi12/falconboi12.github.io`** — the site.

```
falconboi12.github.io/
├─ src/
│  ├─ content/
│  │  ├─ config.ts            # Zod schemas — the contract
│  │  ├─ papers/              # 80 × .md, body empty in v1
│  │  ├─ projects/            # N × .md
│  │  ├─ concepts/            # optional glosses, generated stubs
│  │  └─ now.md
│  ├─ components/
│  │  ├─ Graph.tsx            # the only hydrated island
│  │  ├─ PaperRow.astro
│  │  ├─ ProjectCard.astro
│  │  └─ FacetRail.astro
│  ├─ layouts/
│  └─ pages/
│     ├─ index.astro
│     ├─ research.astro
│     ├─ graph.astro
│     ├─ papers/[slug].astro
│     └─ projects/[slug].astro
├─ data/
│  ├─ papers_index.json       # source of truth for tags
│  ├─ concept_map.yaml        # source of truth for concepts
│  └─ graph.json              # BUILT — committed for reproducibility
├─ scripts/
│  ├─ build_graph.py          # papers_index + concept_map → graph.json
│  ├─ gen_paper_stubs.py      # one-shot: papers_index → 80 .md files
│  └─ parse_bookmarks.py      # Phase 6
├─ public/
├─ .github/workflows/deploy.yml
├─ astro.config.mjs
├─ CLAUDE.md
└─ SPEC.md
```

**`gen_paper_stubs.py` is a one-shot generator, not a build step.** Run it once to create the 80 `.md` files, then hand-edit them forever (adding arXiv links, notes). Never regenerate over hand edits.

---

## 7. Build order

| Phase | Deliverable | Blocked by | Notes |
|---|---|---|---|
| 0 | Rewrite `falconboi12/falconboi12` README | — | Independent. Highest return per hour. |
| 1 | Astro skeleton, deploy pipeline green, "hello world" live | — | Get deployment working before there's content to debug against |
| 2 | `build_graph.py` + content schemas + 80 paper stubs | — | Data layer, no UI |
| 3 | `/research` + `/papers/[slug]` | 2 | Immediately useful as a personal tool |
| 4 | `/` homepage + `/projects` | 3 | The recruiter surface. Needs real project copy with real metrics. |
| 5 | `/graph` | 2 | The fun one. Deliberately last — highest effort, lowest audience value. |
| 6 | Bookmarks ingest, arXiv resolution, per-paper notes | 3 | Ongoing |

Phase 1 before Phase 2 is deliberate: debug the deploy pipeline against an empty site, not against 80 content files.

---

## 8. Outstanding work outside the codebase

**The profile README is three years out of date.** It currently presents a junior undergraduate in Civil Engineering at IIT BHU, with projects on alkali-activated materials, a Formula Student brake disc, and a MATLAB digital twin. There is no mention of ML, Convin, dialogue agents, RL fine-tuning, or evaluation. Anyone arriving at the GitHub profile today gets an accurate picture of 2023 and nothing since. Fix this first; it is independent of the entire site build.

**Project metrics are placeholders.** The wireframe project cards contain `"Result — placeholder metric, e.g. +X pt task-completion"`. Real numbers must be substituted before this page is shown to anyone. A portfolio with visible placeholder metrics is worse than no portfolio.

**Two papers need re-tagging** — `Dolphin` and `Fusion functions for hybrid retrieval`, both with `(unconfirmed)` placeholder tags that map to zero concepts.

**Concept-map judgement calls to review** (all one-line YAML edits):
- `topic modeling` folded into `structure-induction-clustering`
- `relational algebra` folded into `text-to-sql`
- `symbolic + semantic reasoning` folded into `chain-of-thought`
- `attention-mechanisms` deliberately kept separate from `transformer-internals` — `tree attention` bridges it to `speculative-decoding`, and merging would destroy a genuine cross-theme edge

---

## 9. Deferred, with reasons

**arXiv auto-resolution.** The index has no arXiv IDs — only local paths and titles. The original plan was to resolve titles via the arXiv Atom API. Deferred by decision: links will be searched and pasted by hand into paper frontmatter. Consequence: no abstracts in v1, therefore no embedding-based related-papers, therefore related-papers uses concept set intersection only. The `url` field exists in the schema and is nullable, so this can be backfilled at any time without a migration.

**Notes / blog posts.** Deferred. The architecture already accommodates them: each paper's `.md` body renders on `/papers/[slug]`. Writing one is a content act, not an engineering act.

**Bookmarks.** Phase 6.

**Graph layers for papers / projects / raw tags.** The Frame 03 wireframe shows a layer toggle with four options. Build one.
