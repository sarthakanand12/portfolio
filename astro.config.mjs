import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Repo is portfolio → project site, served at /portfolio. Requires `base` config.
export default defineConfig({
  site: 'https://sarthakanand12.github.io',
  base: '/portfolio',
  output: 'static',
  integrations: [preact(), mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: { shikiConfig: { theme: 'github-light', wrap: true } },
});
