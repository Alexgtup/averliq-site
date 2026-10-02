(() => {
  const norm = (value) => (value || '').toLowerCase().trim().replace(/\s+/g, ' ');

  function setupHome(root) {
    const cards = Array.from(root.querySelectorAll('[data-project-card]'));
    const filters = Array.from(root.querySelectorAll('[data-project-filter]'));
    const prev = root.querySelector('[data-project-prev]');
    const next = root.querySelector('[data-project-next]');
    const status = root.querySelector('[data-project-status]');
    const matchCount = root.querySelector('[data-project-match-count]');
    const viewport = root.querySelector('[data-project-viewport]');
    const desktopPageSize = Math.max(1, Number(root.dataset.pageSize || 4));
    const mobileQuery = window.matchMedia('(max-width: 640px)');
    let filter = 'all';
    let page = 0;
    let startX = null;

    const pageSize = () => mobileQuery.matches ? 1 : desktopPageSize;
    const matches = () => cards.filter((card) => filter === 'all' || (card.dataset.categories || '').split(/\s+/).includes(filter));

    function render(direction = 0) {
      const visible = matches();
      const size = pageSize();
      const pages = Math.max(1, Math.ceil(visible.length / size));
      page = Math.max(0, Math.min(page, pages - 1));
      const start = page * size;
      const end = Math.min(start + size, visible.length);
      cards.forEach((card) => {
        card.hidden = true;
        card.setAttribute('aria-hidden', 'true');
      });
      visible.slice(start, end).forEach((card, index) => {
        card.hidden = false;
        card.removeAttribute('aria-hidden');
        card.style.setProperty('--ux-order', index);
      });
      if (status) status.textContent = visible.length ? `${start + 1}–${end} из ${visible.length}` : '0 проектов';
      if (matchCount) matchCount.textContent = String(visible.length);
      if (prev) prev.disabled = page <= 0;
      if (next) next.disabled = page >= pages - 1;
      root.dataset.page = String(page + 1);
      root.dataset.pages = String(pages);
      root.dataset.visibleCards = String(size);
      if (viewport && direction && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        viewport.animate(
          [{ opacity: .45, transform: `translateX(${direction > 0 ? '10px' : '-10px'})` }, { opacity: 1, transform: 'translateX(0)' }],
          { duration: 180, easing: 'ease-out' }
        );
      }
    }

    filters.forEach((button) => button.addEventListener('click', () => {
      filter = button.dataset.projectFilter || 'all';
      page = 0;
      filters.forEach((item) => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
      render();
    }));
    prev?.addEventListener('click', () => { page -= 1; render(-1); });
    next?.addEventListener('click', () => { page += 1; render(1); });
    viewport?.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse') startX = event.clientX;
    });
    viewport?.addEventListener('pointerup', (event) => {
      if (startX == null) return;
      const delta = event.clientX - startX;
      startX = null;
      if (Math.abs(delta) < 45) return;
      if (delta < 0 && next && !next.disabled) { page += 1; render(1); }
      if (delta > 0 && prev && !prev.disabled) { page -= 1; render(-1); }
    });
    const onViewportChange = () => { page = 0; render(); };
    if (typeof mobileQuery.addEventListener === 'function') mobileQuery.addEventListener('change', onViewportChange);
    else if (typeof mobileQuery.addListener === 'function') mobileQuery.addListener(onViewportChange);
    render();
  }

  function setupLibrary(root) {
    const cards = Array.from(root.querySelectorAll('[data-case-card]'));
    const filters = Array.from(root.querySelectorAll('[data-case-filter]'));
    const search = root.querySelector('[data-case-search]');
    const counts = Array.from(root.querySelectorAll('[data-case-count]'));
    const empty = root.querySelector('[data-case-empty]');
    const reset = root.querySelector('[data-case-reset]');
    let filter = 'all';
    let query = '';

    function render() {
      let visible = 0;
      cards.forEach((card) => {
        const cats = (card.dataset.categories || '').split(/\s+/);
        const haystack = norm(card.dataset.search || card.textContent);
        const matchFilter = filter === 'all' || cats.includes(filter);
        const matchQuery = !query || haystack.includes(query);
        const show = matchFilter && matchQuery;
        card.hidden = !show;
        card.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (show) visible += 1;
      });
      counts.forEach((node) => { node.textContent = String(visible); });
      if (empty) empty.classList.toggle('is-visible', visible === 0);
    }

    filters.forEach((button) => button.addEventListener('click', () => {
      filter = button.dataset.caseFilter || 'all';
      filters.forEach((item) => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
      render();
    }));
    search?.addEventListener('input', () => { query = norm(search.value); render(); });
    reset?.addEventListener('click', () => {
      filter = 'all';
      query = '';
      if (search) search.value = '';
      filters.forEach((item) => item.setAttribute('aria-pressed', item.dataset.caseFilter === 'all' ? 'true' : 'false'));
      render();
    });
    render();
  }

  document.querySelectorAll('[data-project-showcase]').forEach(setupHome);
  document.querySelectorAll('[data-case-library]').forEach(setupLibrary);
})();