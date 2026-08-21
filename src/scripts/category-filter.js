/**
 * Wires every CategoryFilter chip group on the page to its item list.
 *
 * Lives here rather than inside CategoryFilter.astro because it walks all
 * `.catfilter` groups at once — emitting it per component instance would bind
 * every listener twice and each click would cancel itself out.
 *
 * Chips are multi-select and start all-on, so the no-JS state (every item
 * visible) is also the initial state. All chips can be deselected; the list
 * then shows its `data-filter-empty` note.
 */
export function wireCategoryFilters(root = document) {
  for (const bar of root.querySelectorAll('.catfilter')) {
    const group = bar.dataset.filterFor;
    const list = root.querySelector(`[data-filter-group="${group}"]`);
    if (!list) continue;

    const chips = Array.from(bar.querySelectorAll('.catchip'));
    // Scoped to the list, so the chips' own data-category never matches here.
    const items = Array.from(list.querySelectorAll('[data-category]'));
    const empty = root.querySelector(`[data-filter-empty="${group}"]`);
    const on = new Set(chips.map((c) => c.dataset.category));

    const paint = () => {
      for (const chip of chips) {
        chip.setAttribute('aria-pressed', String(on.has(chip.dataset.category)));
      }
      for (const item of items) item.hidden = !on.has(item.dataset.category);
      // Every chip is deselectable, including the last one — an empty
      // selection is a valid state, so show a note instead of a blank gap.
      if (empty) empty.hidden = on.size > 0;
    };

    for (const chip of chips) {
      chip.addEventListener('click', () => {
        const v = chip.dataset.category;
        if (on.has(v)) on.delete(v);
        else on.add(v);
        paint();
      });
    }

    paint();
  }
}
