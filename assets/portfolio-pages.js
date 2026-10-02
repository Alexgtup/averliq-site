(() => {
  'use strict';
  const en = document.documentElement.lang === 'en';
  const catalog = document.querySelector('.ax-catalog');
  if (catalog) {
    const cards = [...catalog.querySelectorAll('[data-catalog-category]')];
    const search = catalog.querySelector('[data-catalog-search]');
    const filters = [...catalog.querySelectorAll('[data-catalog-filter]')];
    let selected = 'all';
    function apply() {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      cards.forEach(card => {
        card.hidden = !(selected === 'all' || card.dataset.catalogCategory === selected) || !card.textContent.toLocaleLowerCase().includes(query);
        if (!card.hidden) count++;
      });
      catalog.querySelector('[data-catalog-status]').textContent = (en ? 'Found: ' : 'Найдено: ') + count;
      catalog.querySelector('.ax-catalog-empty').hidden = count !== 0;
    }
    filters.forEach(button => button.addEventListener('click', () => {
      selected = button.dataset.catalogFilter;
      filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      apply();
    }));
    search.addEventListener('input', apply);
  }
  const dialog = document.querySelector('[data-page-lightbox]');
  if (dialog) {
    const preview = dialog.querySelector('img');
    document.querySelectorAll('.ax-content img').forEach(img => {
      if (img.closest('a,button') || !img.getAttribute('src')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ax-image-open';
      button.setAttribute('aria-label', (en ? 'Enlarge: ' : 'Увеличить: ') + (img.alt || (en ? 'project image' : 'изображение проекта')));
      img.replaceWith(button);
      button.append(img);
      button.addEventListener('click', () => {
        preview.src = img.currentSrc || img.src;
        preview.alt = img.alt;
        dialog.querySelector('p').textContent = img.alt;
        dialog.showModal();
      });
    });
    dialog.querySelector('[data-page-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }
  // YANDEX METRIKA / SEO PRODUCT
  const seoProduct = document.querySelector('[data-seo-product]');
  if (seoProduct) {
    const form = seoProduct.querySelector('[data-seo-planner]');
    const host = seoProduct.querySelector('[data-seo-host]');
    const count = seoProduct.querySelector('[data-seo-count]');
    const checks = seoProduct.querySelector('[data-seo-checks]');
    const copyButton = seoProduct.querySelector('[data-seo-copy]');
    const downloadButton = seoProduct.querySelector('[data-seo-download]');
    const notice = seoProduct.querySelector('[data-seo-notice]');
    const statusNodes = [...seoProduct.querySelectorAll('[data-seo-status]')];
    let currentPlan = '';
    let currentFilename = '';

    const ruPlans = {
      ads: [
        ['Рекламная посадочная', 'Открыть фактический URL из объявления и проверить цепочку редиректов.', 'ads'],
        ['Загрузка Метрики', 'Проверить счётчик, consent/cookie-логику, CSP и ошибки JavaScript.', 'tracking'],
        ['yclid и UTM', 'Убедиться, что рекламные параметры не теряются после перехода и редиректов.', 'ads'],
        ['Источник визита', 'Сверить, каким источником визит записывается в Метрике и совпадает ли это с рекламой.', 'tracking'],
        ['Цели', 'Проверить Telegram, формы, email и другие действия, которые должны считаться обращением.', 'conversion'],
        ['Контрольный переход', 'Повторить путь пользователя после исправления и сверить появление визита и цели.', 'conversion']
      ],
      leads: [
        ['Список реальных обращений', 'Зафиксировать Telegram, email, формы, звонки и другие действия, которые считаются лидом.', 'conversion'],
        ['Цели Метрики', 'Создать или проверить отдельную цель для каждого ключевого действия.', 'tracking'],
        ['Источники', 'Проверить UTM, yclid и разметку переходов из рекламы и внешних площадок.', 'ads'],
        ['Посадочные страницы', 'Связать обращение с фактической страницей входа и маршрутом пользователя.', 'conversion'],
        ['Дубли событий', 'Исключить двойное срабатывание целей и ложные успехи формы.', 'tracking'],
        ['Отчёт для контроля', 'Собрать минимальный отчёт: источник → посадочная → целевое действие.', 'conversion']
      ],
      index: [
        ['Indexability', 'Проверить robots meta, canonical, HTTP-код и отсутствие технической блокировки страницы.', 'search'],
        ['robots.txt', 'Проверить правила обхода и ссылки на актуальные sitemap.', 'search'],
        ['sitemap.xml', 'Сверить наличие нужных URL, коды ответа и отсутствие мусорных страниц.', 'search'],
        ['Вебмастер / Search Console', 'Посмотреть причины исключения, сканирование и выбранные canonical.', 'search'],
        ['Внутренние ссылки', 'Проверить, есть ли путь к странице с индексируемых разделов сайта.', 'search'],
        ['Переобход', 'После исправления отправить нужные URL на повторную проверку и контролировать статус.', 'search']
      ],
      ctr: [
        ['Запросы и посадочные', 'Сопоставить запрос, показы, клики и URL, который получает трафик.', 'search'],
        ['Title и snippet', 'Проверить, отвечает ли заголовок намерению запроса и не конфликтует ли с соседними страницами.', 'search'],
        ['Каннибализация', 'Найти страницы одного сайта, которые конкурируют за один и тот же запрос.', 'search'],
        ['Изменения сайта', 'Сверить падение с релизами, шаблонами, canonical, robots и внутренними ссылками.', 'search'],
        ['CTR по сегментам', 'Разделить брендовые и небрандовые запросы, устройства и посадочные.', 'search'],
        ['Контроль после правки', 'Сравнить показы, CTR и позиции после переобхода на сопоставимом периоде.', 'search']
      ],
      wordpress: [
        ['Счётчик после изменений', 'Проверить, не исчез ли код Метрики из шаблона и не грузится ли он дважды.', 'tracking'],
        ['JavaScript и формы', 'Проверить ошибки фронтенда, submit/AJAX и фактическое успешное действие.', 'conversion'],
        ['SEO-шаблоны', 'Проверить title, description, canonical, robots meta и schema после обновления темы или плагинов.', 'search'],
        ['Редиректы и URL', 'Сверить постоянные ссылки, 301/302, 404 и страницы, изменившие адрес.', 'search'],
        ['Плагины и кеш', 'Исключить конфликт SEO/кеш/consent-плагинов, влияющий на аналитику или разметку.', 'tracking'],
        ['Приёмка', 'Очистить кеш и повторно проверить цели, исходный HTML и поисковые сигналы.', 'conversion']
      ]
    };
    const enPlans = {
      ads: [
        ['Paid landing page', 'Open the actual ad URL and verify the complete redirect chain.', 'ads'],
        ['Metrica loading', 'Check the counter, consent logic, CSP and JavaScript errors.', 'tracking'],
        ['yclid and UTM', 'Verify that campaign parameters survive redirects and the landing flow.', 'ads'],
        ['Recorded source', 'Compare the source stored in Metrica with the paid click.', 'tracking'],
        ['Conversion goals', 'Check Telegram, forms, email and other actions that should count as enquiries.', 'conversion'],
        ['Verification visit', 'Repeat the journey after fixes and confirm both the visit and goal are recorded.', 'conversion']
      ],
      leads: [
        ['Real enquiry list', 'Define Telegram, email, forms, calls and other actions that count as leads.', 'conversion'],
        ['Metrica goals', 'Create or verify one meaningful goal for each key action.', 'tracking'],
        ['Traffic sources', 'Check UTM, yclid and tagging on paid and referral traffic.', 'ads'],
        ['Landing pages', 'Connect the enquiry to the actual entry page and visitor path.', 'conversion'],
        ['Duplicate events', 'Exclude double goal firing and false-success form states.', 'tracking'],
        ['Control report', 'Create a minimal source → landing → conversion view.', 'conversion']
      ],
      index: [
        ['Indexability', 'Check robots meta, canonical, HTTP status and technical blocking.', 'search'],
        ['robots.txt', 'Review crawl rules and references to current sitemaps.', 'search'],
        ['sitemap.xml', 'Check required URLs, response codes and unwanted entries.', 'search'],
        ['Webmaster / Search Console', 'Review exclusion reasons, crawl state and selected canonicals.', 'search'],
        ['Internal links', 'Confirm there is a crawlable path from indexed parts of the site.', 'search'],
        ['Re-crawl', 'Resubmit corrected URLs and monitor their status.', 'search']
      ],
      ctr: [
        ['Queries and landing pages', 'Map query, impressions, clicks and the URL receiving traffic.', 'search'],
        ['Title and snippet', 'Check whether the snippet matches intent and avoids overlap with nearby pages.', 'search'],
        ['Cannibalization', 'Find pages on the same site competing for the same query.', 'search'],
        ['Site changes', 'Compare the drop with releases, templates, canonicals, robots and internal links.', 'search'],
        ['CTR segments', 'Separate branded/non-branded queries, devices and landing pages.', 'search'],
        ['Post-change check', 'Compare impressions, CTR and rankings after re-crawl over a comparable period.', 'search']
      ],
      wordpress: [
        ['Counter after changes', 'Check that Metrica was not removed from the template or loaded twice.', 'tracking'],
        ['JavaScript and forms', 'Check frontend errors, submit/AJAX flow and the actual success state.', 'conversion'],
        ['SEO templates', 'Review title, description, canonical, robots meta and schema after theme/plugin changes.', 'search'],
        ['Redirects and URLs', 'Review permalinks, 301/302, 404 and pages whose address changed.', 'search'],
        ['Plugins and cache', 'Rule out SEO/cache/consent plugin conflicts affecting analytics or markup.', 'tracking'],
        ['Acceptance check', 'Clear caches and re-test goals, rendered HTML and search signals.', 'conversion']
      ]
    };
    const plans = en ? enPlans : ruPlans;
    const textFor = en ? {
      planned: 'IN PLAN',
      waiting: 'WAITING',
      steps: n => n + (n === 1 ? ' step' : ' steps'),
      copied: 'Plan copied to the clipboard.',
      copyFail: 'Could not copy automatically. Use the downloaded TXT instead.',
      downloaded: 'TXT checklist downloaded.',
      prefix: 'Preliminary analytics / SEO audit plan',
      website: 'Website',
      issue: 'Issue',
      privacy: 'The plan is generated locally in your browser. The URL is not sent anywhere automatically.'
    } : {
      planned: 'В ПЛАНЕ',
      waiting: 'ОЖИДАЕТ',
      steps: n => n + (n === 1 ? ' шаг' : (n >= 2 && n <= 4 ? ' шага' : ' шагов')),
      copied: 'План скопирован в буфер обмена.',
      copyFail: 'Не получилось скопировать автоматически. Скачайте TXT.',
      downloaded: 'TXT-чек-лист скачан.',
      prefix: 'Предварительный план проверки аналитики / SEO',
      website: 'Сайт',
      issue: 'Проблема',
      privacy: 'План формируется локально в браузере. URL никуда автоматически не отправляется.'
    };

    function safeHost(value) {
      try { return new URL(value).host || value; } catch (_) { return value; }
    }
    function buildText(url, problemLabel, items) {
      return [
        textFor.prefix,
        textFor.website + ': ' + url,
        textFor.issue + ': ' + problemLabel,
        '',
        ...items.map((item, index) => (index + 1) + '. ' + item[0] + ' — ' + item[1]),
        '',
        en ? 'Generated on averliq.tech. Final findings require access to the relevant analytics/search data.'
           : 'Сформировано на averliq.tech. Финальные выводы требуют проверки реальных данных аналитики и поиска.'
      ].join('\n');
    }
    function setNotice(message) {
      notice.textContent = message;
      window.clearTimeout(setNotice.timer);
      setNotice.timer = window.setTimeout(() => { notice.textContent = textFor.privacy; }, 4500);
    }
    function render(items, url, problemLabel) {
      host.textContent = safeHost(url);
      count.textContent = textFor.steps(items.length);
      checks.innerHTML = items.map((item, index) =>
        '<li><span>' + String(index + 1).padStart(2, '0') + '</span><div><strong>' +
        item[0].replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])) +
        '</strong><p>' +
        item[1].replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])) +
        '</p></div><b>' + textFor.planned + '</b></li>'
      ).join('');
      const used = new Set(items.map(item => item[2]));
      statusNodes.forEach(node => {
        const ready = used.has(node.dataset.seoStatus);
        node.textContent = ready ? textFor.planned : textFor.waiting;
        node.classList.toggle('is-ready', ready);
      });
      currentPlan = buildText(url, problemLabel, items);
      currentFilename = 'averliq-audit-plan-' + safeHost(url).replace(/[^a-z0-9.-]+/gi, '-') + '.txt';
      copyButton.disabled = false;
      downloadButton.disabled = false;
    }

    form?.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const url = String(data.get('website') || '').trim();
      const key = String(data.get('problem') || 'ads');
      if (!url || !plans[key]) return;
      const option = form.querySelector('select[name="problem"] option:checked');
      render(plans[key], url, option?.textContent?.trim() || key);
      window.averliqAnalytics?.goal('seo_audit_plan_build', { issue: key });
    });

    copyButton?.addEventListener('click', async () => {
      if (!currentPlan) return;
      try {
        await navigator.clipboard.writeText(currentPlan);
        setNotice(textFor.copied);
        window.averliqAnalytics?.goal('seo_audit_plan_copy');
      } catch (_) {
        setNotice(textFor.copyFail);
      }
    });

    downloadButton?.addEventListener('click', () => {
      if (!currentPlan) return;
      const blob = new Blob([currentPlan], { type: 'text/plain;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = currentFilename || 'averliq-audit-plan.txt';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      setNotice(textFor.downloaded);
      window.averliqAnalytics?.goal('seo_audit_plan_download');
    });
  }

})();
