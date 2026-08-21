import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * These schemas are the contract. A content file that violates one SHOULD fail
 * the build — do not add .optional()/.catch() to make a broken file pass; fix
 * the file. (CLAUDE.md)
 *
 * Note what is absent: `concepts`. Concepts are derived from concept_map.yaml
 * at build time via src/lib/data.ts and are never authored on a paper.
 */

const papers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/papers' }),
  schema: z.object({
    title: z.string().min(1),

    // Theme/subtheme mirror papers_index.json's `path`; they are not a second
    // source of truth. Kept in frontmatter so the UI needs no path parsing.
    theme: z.string().min(1),
    subtheme: z.string().nullable().default(null),

    // Raw tags, verbatim from papers_index.json — including odd ones like
    // `(IA)^3`. Never normalised, retitled or deduplicated.
    tags: z.array(z.string()).default([]),

    // The one hand-added link. `venue`/`year` are display-only and stay
    // nullable until a resolver script fills them (SPEC §9).
    url: z.string().url().nullable().default(null),
    venue: z.string().nullable().default(null),
    year: z.number().int().min(1990).max(2100).nullable().default(null),

    status: z.enum(['noted', 'read', 'skimmed']),
    confidence: z.enum(['confirmed', 'unconfirmed']),

    // The `note` field carried over from papers_index.json, shown when the
    // .md body is still empty.
    indexNote: z.string().nullable().default(null),

    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    org: z.string().min(1),
    period: z.string().min(1),
    status: z.enum(['production', 'active', 'shipped', 'archived']),
    stack: z.array(z.string()).min(1),

    problem: z.string().min(1),
    approach: z.string().min(1),
    result: z.string().min(1),

    repo: z.string().url().nullable().default(null),
    writeup: z.string().nullable().default(null),

    featured: z.boolean().default(false),
    order: z.number().int().default(100),

    // The reverse backlink: paper slugs.
    papers: z.array(z.string()).default([]),

    // True when `result` still contains a placeholder metric. Surfaces a
    // visible flag in the UI so a placeholder can never ship silently.
    resultIsPlaceholder: z.boolean().default(false),
  }),
});

/**
 * Blog posts. Not wired up for authoring yet — the collection exists so a post
 * that names a paper in `papers` surfaces as a link in that paper's info card.
 */
const blogs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blogs' }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    summary: z.string().nullable().default(null),
    /** Paper slugs this post writes about. Drives the paper -> blog backlink. */
    papers: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** Courses and certificates are hand-authored credential lists. */

/**
 * The discipline a course belongs to. Drives the filter chips on the homepage.
 * Adding a value here is the only change needed to add a chip — the UI derives
 * the chip list from the entries themselves.
 */
const CATEGORIES = ['Civil', 'CSE'] as const;

const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string().min(1),
    issuer: z.string().min(1),
    year: z.number().int().min(1990).max(2100),
    category: z.enum(CATEGORIES),
    url: z.string().url().nullable().default(null),
    order: z.number().int().default(100),
    draft: z.boolean().default(false),
  }),
});

const certificates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/certificates' }),
  schema: z.object({
    title: z.string().min(1),
    issuer: z.string().min(1),
    year: z.number().int().min(1990).max(2100),
    credentialId: z.string().nullable().default(null),
    url: z.string().url().nullable().default(null),
    order: z.number().int().default(100),
    draft: z.boolean().default(false),
  }),
});

export const collections = { papers, projects, blogs, courses, certificates };
