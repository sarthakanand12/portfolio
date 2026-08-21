/**
 * Research map placement. Labels are absolutely positioned from MEASURED
 * widths — percentage centres alone overflow the container and collide, so
 * each label is clamped inside the box and nudged until it clears the ones
 * already placed. Re-runs on resize.
 *
 * Labels are laid out largest-first (the component emits them in that order),
 * so when the box runs out of room the concepts that get dropped are always
 * the smallest ones. A label that cannot be placed without overlapping stays
 * hidden rather than colliding — an unreadable pile-up is worse than a
 * shorter cloud.
 */
export function placeResearchMap(root = document) {
  const map = root.querySelector('.rmap');
  if (!map) return;
  const run = () => requestAnimationFrame(() => {
    const W = map.clientWidth, H = map.clientHeight, pad = 14, drift = 12;
    const boxes = [];
    map.querySelectorAll('.rmap-star').forEach((el) => {
      el.style.visibility = 'hidden';
      const w = el.offsetWidth, h = el.offsetHeight;
      // Too wide for the box at any position — never going to fit.
      if (w > W - 2 * (pad + drift)) return;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      let x = clamp((+el.dataset.x / 100) * W - w / 2, pad + drift, W - w - pad - drift);
      let y = clamp((+el.dataset.y / 100) * H - h / 2, pad + drift, H - h - pad - drift);
      const hits = (bx, by) => boxes.some((b) =>
        bx < b.x + b.w + 10 && bx + w + 10 > b.x && by < b.y + b.h + 8 && by + h + 8 > b.y);
      let guard = 0;
      while (hits(x, y) && guard++ < 90) {
        y += h + 10;
        if (y > H - h - pad - drift) { y = pad + drift + (guard % 5) * (h + 10); x += 26; }
        if (x > W - w - pad - drift) x = pad + drift;
      }
      // Guard exhausted: no clear slot was found, so leave it hidden.
      if (hits(x, y)) return;
      boxes.push({ x, y, w, h });
      el.style.left = Math.round(x) + 'px';
      el.style.top = Math.round(y) + 'px';
      el.style.visibility = 'visible';
    });
  });
  run();
  window.addEventListener('resize', run);
}
