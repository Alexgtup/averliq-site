(() => {
  const path = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
  const isEn = path.startsWith('/en/');

  const serviceRoutes = new Set([
    '/services/','/development/','/telegram-bots/','/telegram-mini-apps/','/n8n-automation/',
    '/crm-development/','/web-development/','/backend-development/','/api-integrations/',
    '/project-repair/','/telegram-bot-repair/','/mvp-development/','/ios-development/',
    '/python-development/','/ai-automation/','/app-development/'
  ]);

  const familyFor = () => {
    if (path === '/' || path === '/en/') return 'home';
    if (path.startsWith('/en/')) {
      if (path.startsWith('/en/cases/') && path !== '/en/cases/') return 'case';
      if (path.startsWith('/en/guides/') && path !== '/en/guides/') return 'guide';
      if (['/en/services/','/en/cases/','/en/guides/','/en/about/'].includes(path)) return 'hub';
      if (path === '/en/privacy/') return 'legal';
      return 'service';
    }
    if (path.startsWith('/cases/') && path !== '/cases/') return 'case';
    if (path.startsWith('/guides/') && path !== '/guides/') return 'guide';
    if (path.startsWith('/tools/') && path !== '/tools/') return 'tool';
    if (['/cases/','/guides/','/tools/','/services/','/demos/','/about/','/freelance-developer/'].includes(path)) return 'hub';
    if (path === '/freelance-os/') return 'product';
    if (serviceRoutes.has(path)) return 'service';
    if (path === '/privacy/') return 'legal';
    return 'page';
  };

  const ensureLandmarks = () => {
    document.body.dataset.uxFamily ||= familyFor();
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
    if (!document.querySelector('a[href="#main-content"]') && main) {
      const skip = document.createElement('a');
      skip.className = 'stage94-skip-link';
      skip.href = '#main-content';
      skip.textContent = isEn ? 'Skip to content' : 'К содержанию';
      document.body.prepend(skip);
    }
  };

  const hubFor = () => {
    if (path === '/' || path === '/en/') return null;
    if (path.startsWith('/en/cases/')) return '/en/cases/';
    if (path.startsWith('/en/guides/')) return '/en/guides/';
    if (path.startsWith('/en/') && !['/en/about/','/en/privacy/'].includes(path)) return '/en/services/';
    if (path.startsWith('/cases/')) return '/cases/';
    if (path.startsWith('/guides/')) return '/guides/';
    if (path === '/about/') return '/about/';
    if (serviceRoutes.has(path)) return '/services/';
    return null;
  };

  const markCurrentNavigation = () => {
    const hub = hubFor();
    document.querySelectorAll('nav.nav a[href], nav.intl-nav a[href], nav.dt-navlinks a[href], .fos-nav nav a[href]').forEach(link => {
      let href = link.getAttribute('href') || '';
      if (!href.startsWith('/')) return;
      href = href.split('#')[0].split('?')[0];
      if (!href.endsWith('/')) href += '/';
      const current = href === path || (hub && href === hub);
      link.classList.toggle('is-current', !!current);
      if (current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const firstSectionAfter = hero => {
    let node = hero?.nextElementSibling || null;
    while (node && node.tagName !== 'SECTION') node = node.nextElementSibling;
    return node;
  };

  const ensureTarget = (hero, id) => {
    let target = document.getElementById(id);
    if (target) return target;
    target = firstSectionAfter(hero);
    if (target && !target.id) target.id = id;
    return target;
  };

  const addActionRow = (section, anchor, primary, secondary = null) => {
    if (!section || !anchor || section.querySelector('.stage94-hero-actions')) return;
    const row = document.createElement('div');
    row.className = 'stage94-hero-actions';
    const a = document.createElement('a');
    a.className = 'stage94-action-primary';
    a.href = primary.href;
    a.textContent = primary.label;
    row.append(a);
    if (secondary) {
      const b = document.createElement('a');
      b.className = 'stage94-action-secondary';
      b.href = secondary.href;
      b.textContent = secondary.label;
      row.append(b);
    }
    anchor.insertAdjacentElement('afterend', row);
  };

  const addEntryActions = () => {
    const caseTargets = new Map([
      ['/cases/seo-control-center/', 'case-interface'],
      ['/cases/siteaudit-studio/', 'case-overview'],
      ['/cases/freelance-os/', 'case-overview']
    ]);
    if (caseTargets.has(path)) {
      const hero = document.querySelector('section.hero');
      const targetId = caseTargets.get(path);
      if (ensureTarget(hero, targetId)) {
        addActionRow(hero, hero?.querySelector('.lead'),
          { href: `#${targetId}`, label: 'Смотреть интерфейс ↓' },
          { href: '/cases/', label: 'Все кейсы' });
      }
    }

    if (path === '/tools/' || (path.startsWith('/tools/') && path !== '/tools/')) {
      const hero = document.querySelector('section.dt-hero');
      const targetId = path === '/tools/' ? 'tool-list' : 'tool-workspace';
      if (ensureTarget(hero, targetId)) {
        addActionRow(hero, hero?.querySelector('.dt-privacy') || hero?.querySelector('.dt-lead'),
          { href: `#${targetId}`, label: path === '/tools/' ? 'Открыть инструменты ↓' : 'К инструменту ↓' },
          { href: path === '/tools/' ? '/cases/' : '/tools/', label: path === '/tools/' ? 'Кейсы' : 'Все инструменты' });
      }
    }

    if (path === '/demos/') {
      const hero = document.querySelector('section.growth-hero');
      addActionRow(hero, hero?.querySelector('p'),
        { href: '#demo-products', label: 'Смотреть демо ↓' },
        { href: '/cases/', label: 'Все кейсы' });
    }

    if (['/en/services/','/en/cases/','/en/guides/'].includes(path)) {
      const hero = document.querySelector('section.intl-hero');
      if (ensureTarget(hero, 'browse')) {
        const labels = {
          '/en/services/': 'Browse services ↓',
          '/en/cases/': 'Browse cases ↓',
          '/en/guides/': 'Browse guides ↓'
        };
        addActionRow(hero, hero?.querySelector('.intl-lead'), { href: '#browse', label: labels[path] });
      }
    }

    if (path === '/en/project-repair/') {
      const sections = [...document.querySelectorAll('main > section.intl-section')];
      const last = sections.at(-1);
      const links = last?.querySelector('.intl-links');
      addActionRow(last, links || last?.querySelector('.intl-section-head'),
        { href: 'https://t.me/Alexuys', label: 'Discuss the repair ↗' },
        { href: '/en/services/', label: 'All services' });
    }
  };

  const normalizeEndingOrder = () => {
    if (path !== '/freelance-developer/') return;
    const main = document.querySelector('main');
    const contact = document.getElementById('hub-contact');
    const extra = main?.querySelector('.s68-entry');
    if (main && contact && extra && extra.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_PRECEDING) {
      main.insertBefore(extra, contact);
    }
  };

  const moveCookieSettings = () => {
    const button = document.querySelector('.growth-cookie-settings');
    const footer = document.querySelector('footer');
    if (!button || !footer || footer.contains(button)) return;
    button.classList.add('stage95-footer-cookie');
    const target = footer.querySelector('.container,.intl-container') || footer;
    target.append(button);
  };

  const improveLiveFeedback = () => {
    document.querySelectorAll('.dt-status').forEach(status => {
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
    });
    document.querySelectorAll('.project-radar__filters,.case-filter__list,.ux-filterbar').forEach(row => {
      row.setAttribute('role', 'toolbar');
      if (!row.getAttribute('aria-label')) row.setAttribute('aria-label', isEn ? 'Content filters' : 'Фильтры');
    });
    document.querySelectorAll('[data-case-count]').forEach(counter => {
      const container = counter.closest('.case-library__toolbar,.case-filter__top');
      if (container) {
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
      }
    });
  };

  const improveSearchEscape = () => {
    document.querySelectorAll('input[type="search"]').forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !input.value) return;
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
    });
  };

  const keyboardFilterRows = () => {
    const selectors = '[data-project-filter],[data-case-filter],[data-ux-filter]';
    document.querySelectorAll(selectors).forEach(button => {
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        const row = [...button.parentElement.querySelectorAll(selectors)]
          .filter(el => !el.disabled && el.offsetParent !== null);
        if (!row.length) return;
        const index = row.indexOf(button);
        let next = index;
        if (event.key === 'ArrowLeft') next = (index - 1 + row.length) % row.length;
        if (event.key === 'ArrowRight') next = (index + 1) % row.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = row.length - 1;
        event.preventDefault();
        row[next].focus();
      });
    });
  };

  const enhanceMobileMenu = () => {
    const menu = document.querySelector('.stage98-mobile-menu');
    if (!menu) return;
    const summary = menu.querySelector(':scope > summary');
    const nav = menu.querySelector(':scope > nav');
    if (!summary || !nav) return;

    const sync = () => {
      const open = menu.open;
      summary.setAttribute('aria-expanded', String(open));
      summary.setAttribute('aria-haspopup', 'menu');
      summary.setAttribute('aria-label', open
        ? (isEn ? 'Close menu' : 'Закрыть меню')
        : (isEn ? 'Open menu' : 'Открыть меню'));
      document.body.classList.toggle('stage98-menu-open', open);
    };

    menu.addEventListener('toggle', sync);
    nav.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', () => {
      menu.open = false;
    }));
    document.addEventListener('pointerdown', event => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !menu.open) return;
      menu.open = false;
      summary.focus();
    });
    sync();
  };

  const enhanceProjectCarousel = () => {
    document.querySelectorAll('[data-project-showcase]').forEach(root => {
      const viewport = root.querySelector('[data-project-viewport]');
      const prev = root.querySelector('[data-project-prev]');
      const next = root.querySelector('[data-project-next]');
      const status = root.querySelector('[data-project-status]');
      const filters = [...root.querySelectorAll('[data-project-filter]')];
      if (!viewport) return;

      viewport.tabIndex = 0;
      if (!viewport.id) viewport.id = 'project-showcase-viewport';
      viewport.setAttribute('role', 'region');
      viewport.setAttribute('aria-roledescription', isEn ? 'project carousel' : 'карусель проектов');
      viewport.setAttribute('aria-label', isEn ? 'Selected projects' : 'Выбранные проекты');
      if (status) {
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
      }
      filters.forEach(button => button.setAttribute('aria-controls', viewport.id));

      viewport.addEventListener('keydown', event => {
        if (event.target.closest('a,button,input,textarea,select')) return;
        if (event.key === 'ArrowLeft' && prev && !prev.disabled) {
          event.preventDefault();
          prev.click();
        }
        if (event.key === 'ArrowRight' && next && !next.disabled) {
          event.preventDefault();
          next.click();
        }
        if (event.key === 'Home' && prev && !prev.disabled) {
          event.preventDefault();
          while (!prev.disabled) prev.click();
        }
        if (event.key === 'End' && next && !next.disabled) {
          event.preventDefault();
          while (!next.disabled) next.click();
        }
      });
    });
  };

  const enhanceCaseLibraryState = () => {
    const root = document.querySelector('[data-case-library]');
    if (!root) return;
    const filters = [...root.querySelectorAll('[data-case-filter]')];
    const search = root.querySelector('[data-case-search]');
    const valid = new Set(filters.map(button => button.dataset.caseFilter || 'all'));
    let syncing = false;
    let timer = 0;

    const currentFilter = () => filters.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.caseFilter || 'all';
    const writeUrl = (mode = 'replace') => {
      if (syncing) return;
      const url = new URL(location.href);
      const filter = currentFilter();
      const query = (search?.value || '').trim();
      if (filter && filter !== 'all') url.searchParams.set('type', filter);
      else url.searchParams.delete('type');
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url.pathname + (url.search ? url.search : '') + url.hash);
    };

    const applyUrl = () => {
      const params = new URLSearchParams(location.search);
      const filter = valid.has(params.get('type')) ? params.get('type') : 'all';
      const query = params.get('q') || '';
      syncing = true;
      const button = filters.find(item => (item.dataset.caseFilter || 'all') === filter);
      if (button && button.getAttribute('aria-pressed') !== 'true') button.click();
      if (search && search.value !== query) {
        search.value = query;
        search.dispatchEvent(new Event('input', { bubbles: true }));
      }
      syncing = false;
    };

    filters.forEach(button => button.addEventListener('click', () => {
      if (syncing) return;
      queueMicrotask(() => writeUrl('push'));
    }));
    search?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = window.setTimeout(writeUrl, 180);
    });
    window.addEventListener('popstate', applyUrl);
    window.addEventListener('keydown', event => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k' || !search) return;
      const active = document.activeElement;
      if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
      event.preventDefault();
      search.focus();
      search.select();
    });
    requestAnimationFrame(applyUrl);
  };

  const enhanceBriefDraft = () => {
    const form = document.getElementById('s44-brief-form');
    if (!form) return;
    const task = form.querySelector('textarea[name="task"]');
    const status = form.querySelector('[data-brief-status]');
    const fields = [...form.querySelectorAll('[name]')].filter(field => !field.disabled);
    const key = 'averliq:brief:v2';
    let saveTimer = 0;

    const grow = () => {
      if (!task) return;
      task.style.height = 'auto';
      task.style.height = `${Math.min(Math.max(task.scrollHeight, 132), 360)}px`;
    };
    const save = () => {
      try {
        const data = Object.fromEntries(fields.map(field => [field.name, field.value]));
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch (_) {}
    };
    const restore = () => {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || 'null');
        if (!data || typeof data !== 'object') return;
        let restoredTask = false;
        fields.forEach(field => {
          if (typeof data[field.name] !== 'string') return;
          if (field.name === 'task' && !field.value && data[field.name].trim()) restoredTask = true;
          if (!field.value || field.tagName === 'SELECT') field.value = data[field.name];
        });
        grow();
        if (restoredTask && status && !status.textContent) status.textContent = 'Черновик восстановлен в этой вкладке.';
      } catch (_) {}
    };

    form.addEventListener('input', () => {
      grow();
      clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, 180);
    });
    form.addEventListener('change', save);
    window.addEventListener('pagehide', save);
    restore();
  };

  const enhanceInteractiveCards = () => {
    const cards = document.querySelectorAll('.s44-route,.s44-service-map__item,.portfolio-card,.case-library-card,.s50-card,.s48-related a');
    cards.forEach(card => {
      if (card.tagName === 'A') return;
      const link = card.querySelector('a[href]');
      if (!link || card.querySelectorAll('a[href]').length !== 1) return;
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
      const activate = () => link.click();
      card.addEventListener('click', event => {
        if (event.target.closest('a,button,input,textarea,select,summary')) return;
        activate();
      });
      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activate();
      });
    });
  };

  ensureLandmarks();
  markCurrentNavigation();
  addEntryActions();
  normalizeEndingOrder();
  moveCookieSettings();
  improveLiveFeedback();
  improveSearchEscape();
  keyboardFilterRows();
  enhanceMobileMenu();
  enhanceProjectCarousel();
  enhanceCaseLibraryState();
  enhanceBriefDraft();
  enhanceInteractiveCards();
  document.documentElement.dataset.stage94Ux = 'ready';
})();
