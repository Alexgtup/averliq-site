(() => {
  'use strict';

  const HOME_KEY = 'averliq:home-project-filter:v2';
  const CATALOG_PREFIX = 'averliq:catalog-return:v2:';
  const MAX_AGE = 30 * 60 * 1000;
  const path = normalizePath(location.pathname);

  const RU_SERVICES = new Set([
    '/development/','/telegram-bots/','/telegram-mini-apps/','/n8n-automation/',
    '/crm-development/','/web-development/','/backend-development/','/api-integrations/',
    '/project-repair/','/telegram-bot-repair/','/mvp-development/','/ios-development/',
    '/python-development/','/ai-automation/','/app-development/'
  ]);
  const EN_SERVICES = new Set([
    '/en/telegram-bot-development/','/en/telegram-mini-app-development/','/en/ai-automation/',
    '/en/n8n-automation/','/en/custom-crm-development/','/en/web-app-development/',
    '/en/api-integrations/','/en/python-development/','/en/backend-development/',
    '/en/mvp-development/','/en/ios-development/','/en/project-repair/'
  ]);

  const HUBS = [
    { path: '/cases/', matches: target => target.startsWith('/cases/') && target !== '/cases/' },
    { path: '/en/cases/', matches: target => target.startsWith('/en/cases/') && target !== '/en/cases/' },
    { path: '/guides/', matches: target => target.startsWith('/guides/') && target !== '/guides/' },
    { path: '/en/guides/', matches: target => target.startsWith('/en/guides/') && target !== '/en/guides/' },
    { path: '/tools/', matches: target => target.startsWith('/tools/') && target !== '/tools/' },
    { path: '/services/', matches: target => RU_SERVICES.has(target) },
    { path: '/en/services/', matches: target => EN_SERVICES.has(target) },
    { path: '/demos/', matches: target => (target.startsWith('/cases/') && target !== '/cases/') || target === '/freelance-os/' }
  ];

  function normalizePath(value) {
    const clean = (value || '/').split('?')[0].split('#')[0];
    return clean.endsWith('/') ? clean : clean + '/';
  }

  function onReady(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function read(key) {
    try {
      const value = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (!value || typeof value !== 'object') return null;
      if (value.at && Date.now() - value.at > MAX_AGE) {
        sessionStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (_) {
      return null;
    }
  }

  function write(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify({ ...value, at: Date.now() })); } catch (_) {}
  }

  function referrerPath() {
    try {
      if (!document.referrer) return '';
      const ref = new URL(document.referrer);
      return ref.origin === location.origin ? normalizePath(ref.pathname) : '';
    } catch (_) {
      return '';
    }
  }

  function goal(name, params = {}) {
    try { window.averliqAnalytics?.goal?.(name, params); } catch (_) {}
  }

  function setupHomeContinuity() {
    const root = document.querySelector('[data-project-showcase]');
    if (!root) return;
    const buttons = [...root.querySelectorAll('[data-project-filter]')];
    if (!buttons.length) return;

    const casesHub = path.startsWith('/en/') ? '/en/cases/' : '/cases/';
    const supported = new Set(buttons.map(button => button.dataset.projectFilter || 'all'));
    const caseLinks = [...root.querySelectorAll('a[href]')].filter(link => {
      try { return normalizePath(new URL(link.href, location.href).pathname) === casesHub; } catch (_) { return false; }
    });

    const syncLinks = filter => {
      caseLinks.forEach(link => {
        link.href = filter && filter !== 'all'
          ? `${casesHub}?type=${encodeURIComponent(filter)}`
          : casesHub;
      });
    };

    buttons.forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.projectFilter || 'all';
      write(HOME_KEY, { filter, casesHub });
      syncLinks(filter);
    }));

    const saved = read(HOME_KEY);
    const cameBack = referrerPath().startsWith(casesHub);
    const filter = cameBack && saved?.casesHub === casesHub && supported.has(saved.filter) ? saved.filter : 'all';
    const button = buttons.find(item => (item.dataset.projectFilter || 'all') === filter);
    if (button && filter !== 'all') button.click();
    else syncLinks('all');
  }

  const keyFor = hub => CATALOG_PREFIX + hub.path;

  function setupHub(hub) {
    if (path !== hub.path) return;
    const main = document.querySelector('main');
    if (!main) return;
    const key = keyFor(hub);

    main.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      let url;
      try { url = new URL(link.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin || !hub.matches(normalizePath(url.pathname))) return;
      write(key, {
        url: location.pathname + location.search + location.hash,
        scrollY: Math.max(0, Math.round(window.scrollY)),
        restore: false
      });
    }, { capture: true });

    const saved = read(key);
    const current = location.pathname + location.search + location.hash;
    if (!saved?.restore || saved.url !== current) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top: Number(saved.scrollY) || 0, behavior: 'auto' });
      write(key, { ...saved, restore: false });
    }));
  }

  function setupDetailReturn() {
    const from = referrerPath();
    const hub = HUBS.find(item => item.path === from && item.matches(path));
    if (!hub) return;
    const key = keyFor(hub);
    const saved = read(key);
    if (!saved?.url || !saved.url.startsWith(hub.path)) return;

    document.querySelectorAll('main a[href]').forEach(link => {
      let url;
      try { url = new URL(link.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin || normalizePath(url.pathname) !== hub.path) return;
      link.href = saved.url;
      link.dataset.returnContext = hub.path;
      link.addEventListener('click', () => {
        write(key, { ...saved, restore: true });
        goal('catalog_return', { hub: hub.path, source: path });
      });
    });
  }

  onReady(() => {
    setupHomeContinuity();
    HUBS.forEach(setupHub);
    setupDetailReturn();
  });
})();
