import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Repo is sarthakanand12.github.io → user site, served at root. No `base` needed.
// If this ever moves to a project repo, add `base` here AND thread it through
// every internal link via import.meta.env.BASE_URL — internal links in this
// codebase are hardcoded root-relative (see Nav.astro, Base.astro, etc.).
export default defineConfig({
  site: 'https://sarthakanand12.github.io',
  output: 'static',
  integrations: [preact(), mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: { shikiConfig: { theme: 'github-light', wrap: true } },
});
