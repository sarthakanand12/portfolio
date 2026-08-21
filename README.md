# Research notebook

Static Astro site. See `DEPLOYMENT.md` to publish it.

## Setup

```bash
npm install
npm run dev            # → localhost:4321
```

Python is only needed to rebuild the graph:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt        # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :4321 |
| `npm run build` | Static build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run graph` | Rebuild `data/graph.json` |

## Where things go

| What | Where |
|---|---|
| Résumé | `public/resume.pdf` |
| Profile picture | `public/profile.jpg` |
| Cover photo | `public/cover.jpg` |
| Name, links, nav | `src/site.ts` |
| Projects | `src/content/projects/*.md` — one file per project |
| Courses | `src/content/courses/*.md` — one file per course |
| Certificates | `src/content/certificates/*.md` — one file per certificate |
| Blogs | `src/content/blogs/*.md` — one file per post |
| Papers | `src/content/papers/*.md` — one file per paper |
| Graph source | `data/papers_index.json` + `data/concept_map.yaml` → `npm run graph` |

Field names for each are in `src/content.config.ts`. A file missing a required
field fails the build.

### Frontmatter

Projects:

```yaml
---
title: 'Project name'
org: 'Convin'
period: '2025'
status: production          # production | active | shipped | archived
stack: ['Python', 'vLLM']
problem: 'What was broken.'
approach: 'What you did.'
result: 'What changed.'
repo: https://github.com/you/repo   # or null
papers: ['paper-slug']              # backlinks to src/content/papers/
---
```

Courses:

```yaml
---
title: 'Course name'
issuer: 'NPTEL'
year: 2024
category: CSE               # Civil | CSE — drives the homepage filter
url: null
order: 1
---
```

Certificates:

```yaml
---
title: 'Certificate name'
issuer: 'Google'
year: 2025
credentialId: 'ABC-123'     # or null
url: null
order: 1
---
```

Blogs:

```yaml
---
title: 'Post title'
date: 2026-08-21
summary: 'One line.'
papers: ['paper-slug']      # optional
---
```

Body of the `.md` file is the post.

## Rules

- `data/papers_index.json` and `data/concept_map.yaml` are hand-curated. Don't
  edit them as a side effect of something else.
- Paper slugs are permanent. Changing one breaks project backlinks.
- A paper's concepts come from `concept_map.yaml`, never from its frontmatter.
- No server-side anything. GitHub Pages serves static files only.
