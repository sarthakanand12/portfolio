import { getCollection, type CollectionEntry } from 'astro:content';
import graph from '../../data/graph.json';
import index from '../../data/papers_index.json';

/**
 * The join layer. Every page reads from here rather than touching collections
 * and graph.json directly, so the paper ↔ concept ↔ project relationships are
 * derived in exactly one place.
 */

export type GraphNode = (typeof graph.nodes)[number];
export type GraphEdge = (typeof graph.edges)[number];

export const graphData = graph;
export const dataQualityNotes: string[] = index.data_quality_notes ?? [];
export const generatedOn: string = index.generated;

const conceptById = new Map<string, GraphNode>(graph.nodes.map((n) => [n.id, n]));
export const paperConcepts = graph.paperConcepts as Record<string, string[]>;

export function conceptLabel(id: string): string {
  return conceptById.get(id)?.label ?? id;
}
export function getConcept(id: string): GraphNode | undefined {
  return conceptById.get(id);
}

/** A paper, with its derived concepts attached. */
export interface Paper {
  slug: string;
  data: CollectionEntry<'papers'>['data'];
  entry: CollectionEntry<'papers'>;
  concepts: string[];
}

export interface Project {
  slug: string;
  data: CollectionEntry<'projects'>['data'];
  entry: CollectionEntry<'projects'>;
  /** Concepts reached through this project's papers, ranked by frequency. */
  concepts: string[];
}

let _papers: Paper[] | null = null;
let _projects: Project[] | null = null;

export async function allPapers(): Promise<Paper[]> {
  if (_papers) return _papers;
  const entries = await getCollection('papers', ({ data }) => !data.draft);
  _papers = entries
    .map((entry) => ({
      slug: entry.id,
      data: entry.data,
      entry,
      concepts: paperConcepts[entry.id] ?? [],
    }))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));

  // Fail loudly on a paper the graph has never heard of: it means a slug was
  // renamed by hand, which silently breaks backlinks.
  const unknown = _papers.filter((p) => !(p.slug in paperConcepts));
  if (unknown.length) {
    throw new Error(
      'Papers absent from graph.json (slug drift — rerun `npm run graph` or ' +
        'restore the slug): ' +
        unknown.map((p) => p.slug).join(', ')
    );
  }
  return _papers;
}

export async function allProjects(): Promise<Project[]> {
  if (_projects) return _projects;
  const entries = await getCollection('projects');
  const papers = await allPapers();
  const bySlug = new Map(papers.map((p) => [p.slug, p]));

  _projects = entries
    .map((entry) => {
      const freq = new Map<string, number>();
      for (const slug of entry.data.papers) {
        const paper = bySlug.get(slug);
        if (!paper) {
          throw new Error(
            `Project "${entry.id}" references unknown paper slug "${slug}". ` +
              'Paper slugs are stable forever — check src/content/papers/.'
          );
        }
        for (const c of paper.concepts) freq.set(c, (freq.get(c) ?? 0) + 1);
      }
      return {
        slug: entry.id,
        data: entry.data,
        entry,
        concepts: [...freq.entries()]
          .sort((a, b) => b[1] - a[1] || conceptLabel(a[0]).localeCompare(conceptLabel(b[0])))
          .map(([id]) => id),
      };
    })
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));

  return _projects;
}

/**
 * Papers → projects, derived by inverting each project's `papers` list. The
 * paper's own `projects` frontmatter field stays available for hand-authored
 * links, and the two are unioned so either direction works.
 */
export async function projectsForPaper(slug: string): Promise<Project[]> {
  const projects = await allProjects();
  return projects.filter((pr) => pr.data.papers.includes(slug));
}

export async function paperBacklinks(): Promise<Map<string, Project[]>> {
  const projects = await allProjects();
  const map = new Map<string, Project[]>();
  for (const pr of projects) {
    for (const slug of pr.data.papers) {
      const list = map.get(slug) ?? [];
      list.push(pr);
      map.set(slug, list);
    }
  }
  return map;
}

/**
 * Related papers: pure set intersection over concepts, ranked by overlap size.
 * No embeddings — that was contingent on abstract fetching, which is deferred.
 */
export async function relatedPapers(slug: string, limit = 5) {
  const papers = await allPapers();
  const self = papers.find((p) => p.slug === slug);
  if (!self || self.concepts.length === 0) return [];
  const mine = new Set(self.concepts);

  return papers
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const shared = p.concepts.filter((c) => mine.has(c));
      return { paper: p, shared, overlap: shared.length };
    })
    .filter((r) => r.overlap > 0)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        a.paper.data.title.localeCompare(b.paper.data.title)
    )
    .slice(0, limit);
}

export async function papersForConcept(id: string): Promise<Paper[]> {
  const papers = await allPapers();
  return papers.filter((p) => p.concepts.includes(id));
}

/** Theme facet counts, ordered by count desc — drives the facet rail. */
export async function themeCounts() {
  const papers = await allPapers();
  const counts = new Map<string, number>();
  for (const p of papers) counts.set(p.data.theme, (counts.get(p.data.theme) ?? 0) + 1);
  return [...counts.entries()]
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme));
}

export async function statusCounts() {
  const papers = await allPapers();
  const counts = new Map<string, number>();
  for (const p of papers) counts.set(p.data.status, (counts.get(p.data.status) ?? 0) + 1);
  return counts;
}

/** Concepts with no edge at the given threshold — the "reading gaps" panel. */
export function orphanConcepts(minWeight = graph.defaultMinWeight): GraphNode[] {
  const linked = new Set<string>();
  for (const e of graph.edges) {
    if (e.weight >= minWeight) {
      linked.add(e.source);
      linked.add(e.target);
    }
  }
  return graph.nodes.filter((n) => !linked.has(n.id));
}

export function themeSlug(theme: string): string {
  return theme
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Blog posts, newest first. Authoring is not wired up yet, so this is normally
 * empty — the join exists so a post lands on its papers the moment one is added.
 */
export async function allBlogs() {
  const entries = await getCollection('blogs', ({ data }) => !data.draft);
  return entries
    .map((entry) => ({ slug: entry.id, data: entry.data, entry }))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** paper slug -> blog posts written about it. */
export async function blogsByPaper() {
  const blogs = await allBlogs();
  const map = new Map<string, typeof blogs>();
  for (const b of blogs) {
    for (const slug of b.data.papers) {
      const list = map.get(slug) ?? [];
      list.push(b);
      map.set(slug, list);
    }
  }
  return map;
}

export async function allCourses() {
  const entries = await getCollection('courses', ({ data }) => !data.draft);
  return entries
    .map((entry) => ({ slug: entry.id, data: entry.data }))
    .sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year);
}

export async function allCertificates() {
  const entries = await getCollection('certificates', ({ data }) => !data.draft);
  return entries
    .map((entry) => ({ slug: entry.id, data: entry.data }))
    .sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year);
}
