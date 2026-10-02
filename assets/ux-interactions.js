(() => {
  'use strict';

  document.querySelectorAll('.ux-tool-main .dt-workspace').forEach((workspace) => {
    const input = workspace.querySelector('textarea:not([readonly]), input:not([readonly])');
    const primary = workspace.querySelector('.dt-btn.primary, button.primary');
    const bar = workspace.previousElementSibling?.matches('.ux-tool-helperbar') ? workspace.previousElementSibling : null;
    if (!input || !bar) return;

    const pasteButton = bar.querySelector('[data-ux-paste]');
    const clearButton = bar.querySelector('[data-ux-clear]');

    const notifyInput = () => {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    pasteButton?.addEventListener('click', async () => {
      const oldText = pasteButton.textContent;
      try {
        const value = await navigator.clipboard.readText();
        if (value) {
          input.value = value;
          notifyInput();
          input.focus();
          pasteButton.textContent = 'Вставлено';
        } else {
          input.focus();
          pasteButton.textContent = 'Буфер пуст';
        }
      } catch (_) {
        input.focus();
        pasteButton.textContent = 'Вставьте вручную';
      }
      window.setTimeout(() => { pasteButton.textContent = oldText; }, 1400);
    });

    clearButton?.addEventListener('click', () => {
      input.value = '';
      notifyInput();
      input.focus();
    });

    workspace.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && primary) {
        event.preventDefault();
        primary.click();
      }
    });
  });

  const progress = document.querySelector('.ux-reading-progress span');
  const guide = document.querySelector('main.ux-guide-main');
  if (progress && guide) {
    let ticking = false;
    const update = () => {
      const rect = guide.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const length = Math.max(1, guide.scrollHeight - window.innerHeight * 0.55);
      const value = Math.min(1, Math.max(0, (window.scrollY - start) / length));
      progress.style.width = `${(value * 100).toFixed(2)}%`;
      ticking = false;
    };
    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }
})();
