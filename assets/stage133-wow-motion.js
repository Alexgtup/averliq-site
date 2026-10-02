/* stage133-wow-motion */
(() => {
  const body = document.body;
  if (!body || body.dataset.wow !== 'true') return;
  if (body.dataset.page === 'home') {
    document.querySelectorAll('.wow-reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const revealNodes = [...document.querySelectorAll('.wow-reveal')];

  if (reduced || !('IntersectionObserver' in window)) {
    revealNodes.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    revealNodes.forEach((el) => observer.observe(el));
  }

  if (reduced || coarse) return;

  const root = document.documentElement;
  const heroVisual = document.querySelector('.p128-hero__visual');
  let raf = 0;
  let nextX = window.innerWidth * 0.5;
  let nextY = window.innerHeight * 0.3;

  const renderPointer = () => {
    raf = 0;
    root.style.setProperty('--wow-x', `${nextX}px`);
    root.style.setProperty('--wow-y', `${nextY}px`);
    if (heroVisual) {
      const nx = (nextX / Math.max(window.innerWidth, 1) - 0.5) * 16;
      const ny = (nextY / Math.max(window.innerHeight, 1) - 0.5) * 14;
      heroVisual.style.setProperty('--wow-tx', `${nx.toFixed(2)}px`);
      heroVisual.style.setProperty('--wow-ty', `${ny.toFixed(2)}px`);
    }
  };

  window.addEventListener('pointermove', (event) => {
    nextX = event.clientX;
    nextY = event.clientY;
    if (!raf) raf = requestAnimationFrame(renderPointer);
  }, { passive: true });

  const interactive = document.querySelectorAll('.p129-svc-board,.p130-featured-card,.p132-cover-visual');
  interactive.forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
      const py = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
      const base = el.matches('.p129-svc-board') ? 2.4 : el.matches('.p132-cover-visual') ? 1.5 : 0;
      el.style.transform = `perspective(1200px) rotateX(${(-py * 3.5).toFixed(2)}deg) rotateY(${(px * 4.5).toFixed(2)}deg) rotateZ(${base}deg) translateZ(0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
})();
