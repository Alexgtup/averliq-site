(() => {
  'use strict';

  const root = document.documentElement;
  const path = normalizePath(location.pathname);
  const isEn = (root.lang || '').toLowerCase().startsWith('en') || path.startsWith('/en/');

  const SERVICE_COPY = {
    '/telegram-bots/': 'разработку Telegram-бота',
    '/telegram-mini-apps/': 'разработку Telegram Mini App',
    '/n8n-automation/': 'автоматизацию n8n / Make',
    '/crm-development/': 'разработку CRM',
    '/web-development/': 'разработку сайта или веб-сервиса',
    '/api-integrations/': 'API / CRM-интеграцию',
    '/project-repair/': 'доработку существующего проекта',
    '/telegram-bot-repair/': 'доработку Telegram-бота',
    '/backend-development/': 'backend-разработку',
    '/python-development/': 'Python-разработку',
    '/mvp-development/': 'разработку MVP',
    '/app-development/': 'разработку приложения',
    '/ios-development/': 'iOS / Swift-разработку',
    '/ai-automation/': 'AI-автоматизацию',
    '/development/': 'разработку цифрового продукта'
  };

  const EN_SERVICES = new Set([
    '/en/telegram-bot-development/','/en/telegram-mini-app-development/','/en/ai-automation/',
    '/en/n8n-automation/','/en/custom-crm-development/','/en/web-app-development/',
    '/en/api-integrations/','/en/python-development/','/en/backend-development/',
    '/en/mvp-development/','/en/ios-development/','/en/project-repair/'
  ]);

  function normalizePath(value) {
    const clean = (value || '/').split('?')[0].split('#')[0];
    return clean.endsWith('/') ? clean : clean + '/';
  }

  const h1 = () => (document.querySelector('h1')?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.?!]+$/, '')
    .slice(0, 110);

  const draftForPage = () => {
    if (isEn) {
      if (path.startsWith('/en/cases/')) return `Hello. I viewed the case "${h1()}".\n\nMy project: `;
      if (path.startsWith('/en/guides/')) return `Hello. I read "${h1()}".\n\nMy project: `;
      if (path === '/en/') return 'Hello. I viewed the Averliq portfolio.\n\nMy project: ';
      return `Hello. I am writing from the page "${h1()}".\n\nMy project: `;
    }
    if (SERVICE_COPY[path]) return `Здравствуйте. Пишу со страницы про ${SERVICE_COPY[path]}.\n\nЗадача: `;
    if (path.startsWith('/cases/') && path !== '/cases/') return `Здравствуйте. Посмотрел кейс «${h1()}».\n\nМоя задача: `;
    if (path.startsWith('/guides/') && path !== '/guides/') return `Здравствуйте. Прочитал разбор «${h1()}».\n\nМоя задача: `;
    if (path === '/') return 'Здравствуйте. Посмотрел портфолио Averliq.\n\nЗадача: ';
    if (path === '/cases/') return 'Здравствуйте. Посмотрел кейсы Averliq.\n\nЗадача: ';
    if (path === '/guides/') return 'Здравствуйте. Посмотрел разборы Averliq.\n\nЗадача: ';
    if (path === '/tools/') return 'Здравствуйте. Посмотрел инструменты на сайте Averliq.\n\nЗадача: ';
    return `Здравствуйте. Пишу со страницы «${h1()}».\n\nЗадача: `;
  };

  const placementFor = link => {
    if (link.closest('header,.stage98-header,.site-header,.intl-header')) return 'header';
    if (link.closest('#brief,#s44-brief-form')) return 'brief';
    if (link.closest('#contact,.s48-contact,.contact,.contact-card,.dt-contact,.s51-contact')) return 'contact';
    if (link.closest('footer,.footer,.foot,.site-footer')) return 'footer';
    if (link.closest('[class*="hero"]')) return 'hero';
    if (link.closest('.s113-reviews')) return 'reviews';
    if (link.closest('.s114-proofbar')) return 'proofbar';
    if (link.closest('.s101-related')) return 'related';
    return 'content';
  };

  const isBareTelegram = url =>
    url.hostname === 't.me' &&
    url.pathname.replace(/\/+$/, '').toLowerCase() === '/averliq' &&
    !url.searchParams.has('text');

  const decorateTelegram = () => {
    const draft = draftForPage();
    document.querySelectorAll('a[href]').forEach(link => {
      let url;
      try { url = new URL(link.href, location.href); } catch (_) { return; }
      if (url.hostname !== 't.me') return;
      if (!link.dataset.cta) link.dataset.cta = placementFor(link);
      if (isBareTelegram(url)) {
        url.searchParams.set('text', draft);
        link.href = url.toString();
      }
    });
  };

  const goal = (name, params = {}) => {
    try { window.averliqAnalytics?.goal?.(name, params); } catch (_) {}
  };

  const pageFamily = () => {
    if (path === '/' || path === '/en/') return 'home';
    if ((path.startsWith('/cases/') && path !== '/cases/') || (path.startsWith('/en/cases/') && path !== '/en/cases/')) return 'case';
    if ((path.startsWith('/guides/') && path !== '/guides/') || (path.startsWith('/en/guides/') && path !== '/en/guides/')) return 'guide';
    if (path.startsWith('/tools/') && path !== '/tools/') return 'tool';
    if (SERVICE_COPY[path] || EN_SERVICES.has(path)) return 'service';
    if (['/cases/','/guides/','/tools/','/services/','/demos/','/en/cases/','/en/guides/','/en/services/'].includes(path)) return 'hub';
    return 'page';
  };

  const classifyInternal = url => {
    if (url.origin !== location.origin) return null;
    const target = normalizePath(url.pathname);
    if ((target.startsWith('/cases/') && target !== '/cases/') || (target.startsWith('/en/cases/') && target !== '/en/cases/')) return 'case_open';
    if ((target.startsWith('/guides/') && target !== '/guides/') || (target.startsWith('/en/guides/') && target !== '/en/guides/')) return 'guide_open';
    if (target.startsWith('/tools/') && target !== '/tools/') return 'tool_open';
    if (SERVICE_COPY[target] || EN_SERVICES.has(target)) return 'service_open';
    return null;
  };

  const proofAction = (link, url) => {
    if (link.closest('.s115-live-proof')) return ['live_proof_open', {
      source: path,
      family: pageFamily()
    }];
    if (url.hostname === 'freelance.ru' && link.closest('.s113-reviews,.s114-proofbar,.s44-proofline,.s44-trust-card,.stage95-review-strip')) {
      return ['review_open', {
        source: path,
        placement: placementFor(link)
      }];
    }
    if (url.origin === location.origin && normalizePath(url.pathname) === '/cases/' && link.closest('.s114-proofbar,.s44-proofline')) {
      return ['proof_cases_open', {
        source: path,
        placement: placementFor(link)
      }];
    }
    if (url.origin === location.origin && normalizePath(url.pathname) === '/' && url.hash === '#reviews') {
      return ['reviews_anchor_open', {
        source: path,
        placement: placementFor(link)
      }];
    }
    return null;
  };

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }

    const proof = proofAction(link, url);
    if (proof) goal(proof[0], proof[1]);

    const eventName = classifyInternal(url);
    if (eventName) goal(eventName, {
      target: normalizePath(url.pathname),
      placement: placementFor(link),
      source: path
    });
  });

  const setupCatalogAnalytics = () => {
    const family = pageFamily();
    document.querySelectorAll('[data-project-filter],[data-case-filter],[data-ux-filter]').forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.projectFilter || button.dataset.caseFilter || button.dataset.uxFilter || 'all';
        goal('catalog_filter', { family, filter: String(filter).slice(0, 40) });
      });
    });

    document.querySelectorAll('input[type="search"],[data-case-search]').forEach(input => {
      let recorded = false;
      input.addEventListener('input', () => {
        const length = (input.value || '').trim().length;
        if (recorded || length < 2) return;
        recorded = true;
        goal('catalog_search', { family, length: Math.min(length, 100) });
      });
    });
  };

  const briefPlaceholder = type => {
    if (isEn) return 'What should work when the project is finished?';
    const value = (type || '').toLowerCase();
    if (value.includes('telegram')) return 'Что пользователь должен сделать в Telegram и что происходит после?';
    if (value.includes('n8n') || value.includes('make') || value.includes('автомат')) return 'Что сейчас делается вручную и какой должен быть автоматический результат?';
    if (value.includes('api') || value.includes('crm')) return 'Какие системы нужно связать и какие данные должны передаваться?';
    if (value.includes('мобиль')) return 'Какой главный сценарий должен работать в приложении?';
    if (value.includes('доработ') || value.includes('существ')) return 'Что уже работает, где проблема и какой результат нужен?';
    if (value.includes('сайт') || value.includes('веб')) return 'Что должен уметь сайт или сервис после запуска?';
    if (value.includes('прошл')) return 'Какой проект продолжаем и что нужно сделать следующим шагом?';
    if (value.includes('правк') || value.includes('разовая')) return 'Ссылка на проект и что нужно исправить или добавить';
    return 'Что должно работать в итоге?';
  };

  const setupBriefFunnel = () => {
    const form = document.getElementById('s44-brief-form');
    if (!form) return;
    const task = form.querySelector('textarea[name="task"]');
    const type = form.querySelector('select[name="type"]');
    const preview = form.querySelector('[data-brief-preview]');
    const copy = form.querySelector('[data-brief-copy]');
    let started = false;
    let ready = false;

    const syncPlaceholder = () => {
      if (!task || task.value.trim()) return;
      task.placeholder = briefPlaceholder(type?.value || '');
    };
    const start = () => {
      if (started) return;
      started = true;
      goal('brief_start', { source: path });
    };
    const checkReady = () => {
      if (ready || !task || task.value.trim().length < 20) return;
      ready = true;
      goal('brief_ready', { source: path, kind: Number(type?.selectedIndex || 0) });
    };

    form.addEventListener('focusin', start, { passive: true });
    form.addEventListener('input', () => {
      start();
      checkReady();
    }, { passive: true });
    type?.addEventListener('change', syncPlaceholder);
    preview?.addEventListener('click', () => goal('brief_preview', { source: path }));
    copy?.addEventListener('click', () => goal('brief_copy', { source: path }));
    form.addEventListener('submit', () => goal('brief_submit', { source: path }));
    syncPlaceholder();
  };

  const init = () => {
    decorateTelegram();
    setupCatalogAnalytics();
    setupBriefFunnel();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
