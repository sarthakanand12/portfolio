# Deployment

Serves at `https://falconboi12.github.io/` via GitHub Pages. Free, public repo.

## First time

**1. Create the repo.** Name it exactly `falconboi12.github.io`, public, empty
(no README, no .gitignore).

> The name matters. `falconboi12.github.io` serves at the root and needs no
> `base` config. Any other name serves at `/repo-name/` and needs `base` set in
> `astro.config.mjs` threaded through every internal link.

**2. Add your résumé and photo** before the first push, or those links 404:

```
public/resume.pdf
public/profile.jpg
```

**3. Push.**

```bash
git init -b main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/falconboi12/falconboi12.github.io.git
git push -u origin main
```

**4. Set the Pages source.** Settings → Pages → Build and deployment →
Source → **GitHub Actions**.

This step is manual and easy to miss. If the workflow is green and the site
404s, this is why.

**5. Watch the Actions tab.** Both jobs green → open
`https://falconboi12.github.io/`. First deploy takes a couple of minutes.

## After that

```bash
git add .
git commit -m "..."
git push
```

Every push to `main` rebuilds and republishes via
`.github/workflows/deploy.yml`. Re-deploy without a commit from the Actions tab
(the workflow has `workflow_dispatch`).

## If you changed the graph data

`data/graph.json` is committed, so CI does not run Python. Regenerate and
commit it yourself:

```bash
npm run graph
git add data/graph.json && git commit -m "Rebuild graph"
```

## Custom domain (optional)

Settings → Pages → Custom domain. Then point DNS at `falconboi12.github.io`
(apex: four A records to GitHub's Pages IPs, or a flattened CNAME). Enable
"Enforce HTTPS" once the certificate provisions. Update `site` in
`astro.config.mjs` to the new URL or the sitemap keeps pointing at the old one.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Workflow green, site 404s | Pages source not set to GitHub Actions |
| CSS and images 404 | Repo isn't `falconboi12.github.io` and `base` isn't set |
| Deploy job auth error | `id-token: write` missing from workflow permissions |
| Second push fails mid-deploy | `concurrency` block missing from workflow |
| Nothing happens on push | Workflow file isn't on the default branch |
| Résumé button 404s | `public/resume.pdf` not committed |

## Note

Everything published is public, including the repo. Don't commit anything from
Convin that isn't cleared for publication.
