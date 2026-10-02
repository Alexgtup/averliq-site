(() => {
  const HOME_OR_READING = () => {
    const page = document.body?.dataset?.page || '';
    return page === 'home' || page.startsWith('guides--');
  };

  const cookieIsVisible = () => {
    const banner = document.querySelector('.growth-cookie, .cookie-consent');
    if (!banner || banner.hidden) return false;
    const style = getComputedStyle(banner);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0;
  };

  const syncFloatingCta = () => {
    const cta = document.querySelector('.mobile-project-cta');
    if (!cta) return;

    if (HOME_OR_READING()) {
      cta.remove();
      return;
    }

    if (cookieIsVisible()) {
      if (cta.dataset.stage84Suppressed !== 'true') {
        cta.dataset.stage84Suppressed = 'true';
        cta.style.setProperty('display', 'none', 'important');
        cta.setAttribute('aria-hidden', 'true');
        cta.tabIndex = -1;
      }
      return;
    }

    if (cta.dataset.stage84Suppressed === 'true') {
      delete cta.dataset.stage84Suppressed;
      cta.style.removeProperty('display');
      cta.removeAttribute('aria-hidden');
      cta.removeAttribute('tabindex');
    }
  };

  const normalizeCookieSettings = () => {
    if (innerWidth > 900) return;
    document.querySelectorAll('.growth-cookie-settings, .cookie-settings').forEach(button => {
      button.style.setProperty('position', 'static', 'important');
      button.style.setProperty('inset', 'auto', 'important');
      button.style.setProperty('transform', 'none', 'important');
      button.style.setProperty('float', 'none', 'important');
      button.style.setProperty('max-width', 'calc(100% - 2rem)', 'important');
      button.style.setProperty('margin', '1.25rem auto 2rem', 'important');
    });
  };

  let headerLastY = Math.max(0, window.scrollY || 0);
  const syncMobileHeader = () => {
    const body = document.body;
    const header = document.querySelector('.stage98-header');
    if (!body || !header) return;

    const y = Math.max(0, window.scrollY || 0);
    if (innerWidth > 900) {
      body.classList.remove('stage98-mobile-header-hidden');
      headerLastY = y;
      return;
    }

    const menuOpen = body.classList.contains('stage98-menu-open') || !!document.querySelector('.stage98-mobile-menu[open]');
    if (menuOpen || y <= 12) {
      body.classList.remove('stage98-mobile-header-hidden');
      headerLastY = y;
      return;
    }

    const delta = y - headerLastY;
    if (delta >= 6) body.classList.add('stage98-mobile-header-hidden');
    else if (delta <= -6) body.classList.remove('stage98-mobile-header-hidden');

    if (Math.abs(delta) >= 6) headerLastY = y;
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      syncFloatingCta();
      normalizeCookieSettings();
      syncMobileHeader();
    });
  };

  const start = () => {
    schedule();

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'open']
    });

    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    addEventListener('pageshow', schedule, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();