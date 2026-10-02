/* Shared, consent-based analytics. Loaded once on every public page. */
(() => {
  'use strict';
  if (window.averliqAnalytics) return;
  const ID = 112290993;
  const KEY = 'averliq-analytics-consent-v1';
  const OWNER_KEY = 'averliq-owner-analytics-skip-v1';
  const LEAD_GOAL = 'contact_lead_v1';
  const FUNNEL_KEY = 'averliq-funnel-stage-v1';

  function markFunnel(stage, target = '') {
    try { sessionStorage.setItem(FUNNEL_KEY, JSON.stringify({ stage, target, at: Date.now() })); } catch (_) {}
  }
  function funnelContext() {
    try {
      const raw = sessionStorage.getItem(FUNNEL_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      if (!data || !data.stage) return {};
      return { funnel_stage: data.stage, funnel_target: data.target || '' };
    } catch (_) { return {}; }
  }

  function ownerMode() {
    let search = '';
    try { search = String(location.search || ''); } catch (_) {}
    const match = search.match(/(?:^|[?&])averliq_owner=([01])(?:&|$)/);
    if (!match) return;
    try {
      if (match[1] === '1') localStorage.setItem(OWNER_KEY, '1');
      else localStorage.removeItem(OWNER_KEY);
    } catch (_) {}
    try {
      if (typeof history !== 'undefined' && history.replaceState) {
        const cleanSearch = search
          .replace(/([?&])averliq_owner=[01](?:&|$)/, '$1')
          .replace(/[?&]$/, '')
          .replace('?&', '?');
        history.replaceState(null, '', String(location.pathname || '/') + cleanSearch + String(location.hash || ''));
      }
    } catch (_) {}
  }
  ownerMode();

  let ownerSkip = false;
  try { ownerSkip = localStorage.getItem(OWNER_KEY) === '1'; } catch (_) {}
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const automated = nav.webdriver === true || /HeadlessChrome/i.test(nav.userAgent || '');
  let adminReferrer = false;
  try {
    const ref = String(document.referrer || '');
    adminReferrer = /^https:\/\/(?:search\.google\.com|metrika\.yandex\.ru|webmaster\.yandex\.ru)(?:\/|$)/i.test(ref);
  } catch (_) {}
  if (ownerSkip || automated || adminReferrer) {
    window.averliqAnalytics = { goal() {}, lead() {}, get consent() { return 'declined'; }, get skipped() { return true; } };
    return;
  }

  let active = false;
  let consent = null;
  const normalize = value => ['accepted', 'yes'].includes(value) ? 'accepted'
    : ['declined', 'no'].includes(value) ? 'declined' : null;
  try { consent = normalize(localStorage.getItem(KEY)); } catch (_) {}
  const box = document.querySelector('[data-analytics-consent]');
  const settings = document.querySelector('[data-analytics-settings]');
  function start() {
    if (active || consent !== 'accepted') return;
    active = true;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    if (!document.querySelector('script[data-averliq-metrika]')) {
      const script = document.createElement('script');
      script.async = true;
      script.dataset.averliqMetrika = 'true';
      script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + ID;
      document.head.appendChild(script);
    }
    window.ym(ID, 'init', {
      webvisor: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true
    });
  }
  function show(open) {
    if (box) box.hidden = !open;
    if (settings) settings.hidden = open;
  }
  function choose(value, persist = true) {
    consent = normalize(value);
    if (persist) { try { localStorage.setItem(KEY, consent); } catch (_) {} }
    if (consent === 'accepted') start();
    else if (active) {
      window.ym(ID, 'destruct');
      active = false;
    }
    show(!consent);
  }
  function goal(name, params = {}) {
    if (active && consent === 'accepted' && typeof window.ym === 'function') {
      window.ym(ID, 'reachGoal', name, { page: location.pathname, ...params });
    }
  }
  function lead(channel, params = {}) {
    goal(LEAD_GOAL, { channel, ...funnelContext(), ...params });
  }
  window.averliqAnalytics = { goal, lead, get consent() { return consent; }, get skipped() { return false; } };
  box?.addEventListener('click', event => {
    const button = event.target.closest('[data-analytics-choice]');
    if (button) { choose(button.dataset.analyticsChoice); settings?.focus({ preventScroll: true }); }
  });
  settings?.addEventListener('click', () => {
    show(true);
    box?.querySelector('button')?.focus();
  });
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) choose(event.newValue, false);
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    if (url.origin === location.origin) {
      if ((url.pathname.startsWith('/cases/') && url.pathname !== '/cases/') ||
          (url.pathname.startsWith('/en/cases/') && url.pathname !== '/en/cases/')) {
        markFunnel('case', url.pathname);
      } else if (url.pathname.startsWith('/services/') || url.pathname === '/services/' ||
                 url.pathname.startsWith('/en/services/')) {
        markFunnel('service', url.pathname);
      }
    }
    if (url.hostname === 't.me') {
      const params = link.dataset.cta ? { placement: link.dataset.cta } : {};
      goal('telegram_click', params);
      lead('telegram', params);
    } else if (url.protocol === 'mailto:') {
      goal('email_click');
      lead('email');
    }
    else if (url.hostname === 'freelance.ru') goal('freelance_click');
    if (url.hostname.endsWith('.pages.dev') || url.pathname.startsWith('/products/')) {
      markFunnel('project', url.hostname + url.pathname);
      goal('project_open', { target: url.hostname + url.pathname });
    }
    if (link.dataset.demo) goal('demo_open', { project: link.dataset.demo });
    if (link.dataset.offer) goal('freelance_offer_open', { offer: link.dataset.offer });
  });
  document.addEventListener('submit', event => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    const isLead = form.matches('.ax-brief, .lead-form, .contact-form, [data-lead-form], [data-brief]') ||
      !!form.closest('.ax-contact-section, #contact, .contact, .intl-contact');
    if (!isLead) return;
    const label = form.id || form.getAttribute('name') || [...form.classList].slice(0,2).join('.') || 'contact';
    goal('contact_form_submit', { form: label });
    lead('form', { form: label });
  }, { capture: true });

  choose(consent, false);
})();