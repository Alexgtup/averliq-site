(() => {
  'use strict';

  document.querySelectorAll('[data-ux-filterbar]').forEach((bar) => {
    const targetId = bar.getAttribute('data-target-id');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    const buttons = Array.from(bar.querySelectorAll('button[data-filter]'));
    const items = Array.from(target.querySelectorAll('[data-ux-filter-item]'));
    const empty = bar.parentElement?.querySelector('[data-ux-filter-empty]') || null;
    if (!buttons.length || !items.length) return;

    const apply = (filter) => {
      let visible = 0;
      items.forEach((item) => {
        const categories = (item.getAttribute('data-ux-category') || '').split(/\s+/).filter(Boolean);
        const show = filter === 'all' || categories.includes(filter);
        item.hidden = !show;
        if (show) visible += 1;
      });

      buttons.forEach((button) => {
        const active = button.getAttribute('data-filter') === filter;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (empty) empty.classList.toggle('is-visible', visible === 0);
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => apply(button.getAttribute('data-filter') || 'all'));
    });

    apply('all');
  });
})();
