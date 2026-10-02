(() => {
  'use strict';

  const STORAGE_KEY = 'freelanceos:v1';
  const VERSION = 1;
  const STAGES = [
    ['new', 'Новый'],
    ['qualified', 'Квалификация'],
    ['proposal', 'Оценка'],
    ['work', 'В работе'],
    ['won', 'Оплачено'],
    ['lost', 'Отказ']
  ];
  const STAGE_MAP = Object.fromEntries(STAGES);
  const ACTIVE_STAGES = new Set(['new', 'qualified', 'proposal', 'work']);

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `fos-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const today = () => new Date().toISOString().slice(0, 10);
  const money = (value) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const compact = (value) => new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
  const esc = (value = '') => String(value);

  const emptyState = () => ({ version: VERSION, leads: [], tasks: [] });
  let state = loadState();
  let currentView = 'pipeline';
  let searchQuery = '';
  let sourceFilter = 'all';

  const els = {
    stats: $('[data-stats]'),
    kanban: $('[data-kanban]'),
    taskList: $('[data-task-list]'),
    sourceAnalytics: $('[data-source-analytics]'),
    stageAnalytics: $('[data-stage-analytics]'),
    financeAnalytics: $('[data-finance-analytics]'),
    sourceFilter: $('[data-source-filter]'),
    search: $('[data-search]'),
    leadDialog: $('[data-lead-dialog]'),
    leadForm: $('[data-lead-form]'),
    taskDialog: $('[data-task-dialog]'),
    taskForm: $('[data-task-form]'),
    taskLeadSelect: $('[data-task-lead-select]')
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      return normalizeState(parsed);
    } catch (_) {
      return emptyState();
    }
  }

  function normalizeState(value) {
    if (!value || typeof value !== 'object') return emptyState();
    const leads = Array.isArray(value.leads) ? value.leads.map(normalizeLead).filter(Boolean) : [];
    const tasks = Array.isArray(value.tasks) ? value.tasks.map(normalizeTask).filter(Boolean) : [];
    return { version: VERSION, leads, tasks };
  }

  function normalizeLead(lead) {
    if (!lead || typeof lead !== 'object') return null;
    const stage = STAGE_MAP[lead.stage] ? lead.stage : 'new';
    return {
      id: String(lead.id || uid()),
      client: String(lead.client || 'Без имени').slice(0, 120),
      project: String(lead.project || 'Проект').slice(0, 160),
      source: String(lead.source || 'Другое').slice(0, 80),
      stage,
      budget: Math.max(0, Number(lead.budget) || 0),
      hours: Math.max(0, Number(lead.hours) || 0),
      followup: /^\d{4}-\d{2}-\d{2}$/.test(String(lead.followup || '')) ? String(lead.followup) : '',
      utm: String(lead.utm || '').slice(0, 120),
      note: String(lead.note || '').slice(0, 2000),
      createdAt: String(lead.createdAt || new Date().toISOString()),
      updatedAt: String(lead.updatedAt || lead.createdAt || new Date().toISOString())
    };
  }

  function normalizeTask(task) {
    if (!task || typeof task !== 'object') return null;
    return {
      id: String(task.id || uid()),
      title: String(task.title || 'Задача').slice(0, 180),
      due: /^\d{4}-\d{2}-\d{2}$/.test(String(task.due || '')) ? String(task.due) : today(),
      leadId: String(task.leadId || ''),
      priority: task.priority === 'high' ? 'high' : 'normal',
      done: Boolean(task.done),
      createdAt: String(task.createdAt || new Date().toISOString())
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      toast('Не удалось сохранить данные в браузере', 'error');
    }
  }

  function commit() {
    saveState();
    renderAll();
  }

  function renderAll() {
    renderStats();
    renderFilters();
    renderKanban();
    renderTasks();
    renderAnalytics();
    renderLeadSelect();
  }

  function filteredLeads() {
    const q = searchQuery.trim().toLowerCase();
    return state.leads.filter((lead) => {
      const sourceOk = sourceFilter === 'all' || lead.source === sourceFilter;
      const queryOk = !q || [lead.client, lead.project, lead.source, lead.utm, lead.note].some((part) => part.toLowerCase().includes(q));
      return sourceOk && queryOk;
    });
  }

  function renderStats() {
    const active = state.leads.filter((lead) => ACTIVE_STAGES.has(lead.stage));
    const won = state.leads.filter((lead) => lead.stage === 'won');
    const lost = state.leads.filter((lead) => lead.stage === 'lost');
    const openValue = active.reduce((sum, lead) => sum + lead.budget, 0);
    const revenue = won.reduce((sum, lead) => sum + lead.budget, 0);
    const closed = won.length + lost.length;
    const conversion = closed ? Math.round((won.length / closed) * 100) : 0;
    const followups = state.leads.filter((lead) => lead.followup && lead.followup <= today() && ACTIVE_STAGES.has(lead.stage)).length;

    const items = [
      ['Активные лиды', active.length, 'в работе сейчас'],
      ['Pipeline', compact(openValue) + ' ₽', 'потенциальный бюджет'],
      ['Выручка', compact(revenue) + ' ₽', 'оплаченные сделки'],
      ['Конверсия', conversion + '%', `${won.length} выиграно / ${lost.length} отказ`],
      ['Follow-up', followups, followups ? 'требуют внимания' : 'просрочек нет']
    ];
    els.stats.innerHTML = '';
    items.forEach(([label, value, hint]) => {
      const article = document.createElement('article');
      article.className = 'stat-card';
      article.innerHTML = `<span>${label}</span><strong>${value}</strong><small>${hint}</small>`;
      els.stats.append(article);
    });
  }

  function renderFilters() {
    const sources = [...new Set(state.leads.map((lead) => lead.source))].sort((a, b) => a.localeCompare(b, 'ru'));
    const previous = sourceFilter;
    els.sourceFilter.innerHTML = '<option value="all">Все источники</option>';
    sources.forEach((source) => {
      const option = document.createElement('option');
      option.value = source;
      option.textContent = source;
      els.sourceFilter.append(option);
    });
    els.sourceFilter.value = sources.includes(previous) ? previous : 'all';
    sourceFilter = els.sourceFilter.value;
  }

  function renderKanban() {
    const leads = filteredLeads();
    els.kanban.innerHTML = '';
    STAGES.forEach(([stage, label]) => {
      const column = document.createElement('section');
      column.className = `kanban-column stage-${stage}`;
      column.dataset.stage = stage;
      const stageLeads = leads.filter((lead) => lead.stage === stage);
      const total = stageLeads.reduce((sum, lead) => sum + lead.budget, 0);
      column.innerHTML = `<header><div><span class="stage-dot"></span><strong>${label}</strong><small>${stageLeads.length}</small></div><b>${money(total)}</b></header><div class="lead-stack" data-drop-stage="${stage}"></div>`;
      const stack = $('.lead-stack', column);
      if (!stageLeads.length) {
        const empty = document.createElement('div');
        empty.className = 'column-empty';
        empty.textContent = 'Пока пусто';
        stack.append(empty);
      }
      stageLeads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach((lead) => stack.append(renderLeadCard(lead)));
      stack.addEventListener('dragover', (event) => { event.preventDefault(); stack.classList.add('is-over'); });
      stack.addEventListener('dragleave', () => stack.classList.remove('is-over'));
      stack.addEventListener('drop', (event) => {
        event.preventDefault();
        stack.classList.remove('is-over');
        const id = event.dataTransfer.getData('text/plain');
        moveLead(id, stage);
      });
      els.kanban.append(column);
    });
  }

  function renderLeadCard(lead) {
    const article = document.createElement('article');
    article.className = 'lead-card';
    article.draggable = true;
    article.dataset.leadId = lead.id;
    article.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', lead.id);
      article.classList.add('is-dragging');
    });
    article.addEventListener('dragend', () => article.classList.remove('is-dragging'));

    const top = document.createElement('div');
    top.className = 'lead-top';
    const title = document.createElement('div');
    const client = document.createElement('strong');
    client.textContent = lead.client;
    const project = document.createElement('span');
    project.textContent = lead.project;
    title.append(client, project);
    const budget = document.createElement('b');
    budget.textContent = money(lead.budget);
    top.append(title, budget);

    const meta = document.createElement('div');
    meta.className = 'lead-meta';
    [lead.source, lead.hours ? `${lead.hours} ч` : '', lead.utm ? `utm:${lead.utm}` : ''].filter(Boolean).forEach((text) => {
      const tag = document.createElement('span');
      tag.textContent = text;
      meta.append(tag);
    });

    const follow = document.createElement('div');
    follow.className = 'lead-followup';
    if (lead.followup) {
      const overdue = lead.followup < today() && ACTIVE_STAGES.has(lead.stage);
      follow.classList.toggle('overdue', overdue);
      follow.textContent = `${overdue ? 'Просрочен' : 'Follow-up'} · ${formatDate(lead.followup)}`;
    } else {
      follow.textContent = 'Follow-up не задан';
    }

    const controls = document.createElement('div');
    controls.className = 'lead-controls';
    const stageSelect = document.createElement('select');
    stageSelect.name = `stage-${lead.id}`;
    stageSelect.setAttribute('aria-label', `Этап лида ${lead.client}`);
    STAGES.forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = lead.stage === value;
      stageSelect.append(option);
    });
    stageSelect.addEventListener('change', () => moveLead(lead.id, stageSelect.value));
    const edit = button('Изменить', 'ghost small', () => openLeadDialog(lead));
    const remove = button('×', 'icon-btn small', () => deleteLead(lead.id));
    remove.setAttribute('aria-label', `Удалить лид ${lead.client}`);
    controls.append(stageSelect, edit, remove);

    article.append(top, meta, follow, controls);
    article.addEventListener('dblclick', () => openLeadDialog(lead));
    return article;
  }

  function moveLead(id, stage) {
    if (!STAGE_MAP[stage]) return;
    const lead = state.leads.find((item) => item.id === id);
    if (!lead || lead.stage === stage) return;
    lead.stage = stage;
    lead.updatedAt = new Date().toISOString();
    commit();
  }

  function deleteLead(id) {
    const lead = state.leads.find((item) => item.id === id);
    if (!lead || !confirm(`Удалить лид «${lead.client}»?`)) return;
    state.leads = state.leads.filter((item) => item.id !== id);
    state.tasks = state.tasks.map((task) => task.leadId === id ? { ...task, leadId: '' } : task);
    commit();
  }

  function renderTasks() {
    els.taskList.innerHTML = '';
    const tasks = [...state.tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due) || Number(b.priority === 'high') - Number(a.priority === 'high'));
    if (!tasks.length) {
      els.taskList.innerHTML = '<article class="empty-panel"><strong>Задач пока нет</strong><p>Добавьте follow-up или действие по проекту.</p></article>';
      return;
    }
    tasks.forEach((task) => {
      const lead = state.leads.find((item) => item.id === task.leadId);
      const article = document.createElement('article');
      article.className = `task-card${task.done ? ' done' : ''}${task.priority === 'high' ? ' high' : ''}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = `task-${task.id}`;
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', `Завершить задачу ${task.title}`);
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        commit();
      });
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = task.title;
      const meta = document.createElement('span');
      const overdue = !task.done && task.due < today();
      meta.textContent = `${overdue ? 'Просрочено · ' : ''}${formatDate(task.due)}${lead ? ` · ${lead.client}` : ''}`;
      if (overdue) meta.classList.add('overdue-text');
      body.append(title, meta);
      const remove = button('×', 'icon-btn', () => {
        state.tasks = state.tasks.filter((item) => item.id !== task.id);
        commit();
      });
      remove.setAttribute('aria-label', `Удалить задачу ${task.title}`);
      article.append(checkbox, body, remove);
      els.taskList.append(article);
    });
  }

  function renderAnalytics() {
    const groups = new Map();
    state.leads.forEach((lead) => {
      const current = groups.get(lead.source) || { leads: 0, won: 0, lost: 0, revenue: 0, pipeline: 0 };
      current.leads += 1;
      if (lead.stage === 'won') { current.won += 1; current.revenue += lead.budget; }
      if (lead.stage === 'lost') current.lost += 1;
      if (ACTIVE_STAGES.has(lead.stage)) current.pipeline += lead.budget;
      groups.set(lead.source, current);
    });
    els.sourceAnalytics.innerHTML = '';
    if (!groups.size) els.sourceAnalytics.innerHTML = '<p class="muted">Добавьте лиды, чтобы увидеть источники.</p>';
    [...groups.entries()].sort((a, b) => b[1].revenue - a[1].revenue || b[1].leads - a[1].leads).forEach(([source, data]) => {
      const closed = data.won + data.lost;
      const conversion = closed ? Math.round(data.won / closed * 100) : 0;
      const row = document.createElement('div');
      row.className = 'analytics-row';
      row.innerHTML = `<div><strong>${esc(source)}</strong><span>${data.leads} лидов · ${conversion}% конверсия</span></div><b>${money(data.revenue)}</b>`;
      els.sourceAnalytics.append(row);
    });

    els.stageAnalytics.innerHTML = '';
    STAGES.forEach(([stage, label]) => {
      const items = state.leads.filter((lead) => lead.stage === stage);
      const value = items.reduce((sum, lead) => sum + lead.budget, 0);
      const row = document.createElement('div');
      row.className = 'analytics-row';
      row.innerHTML = `<div><strong>${label}</strong><span>${items.length} сделок</span></div><b>${money(value)}</b>`;
      els.stageAnalytics.append(row);
    });

    const won = state.leads.filter((lead) => lead.stage === 'won');
    const revenue = won.reduce((sum, lead) => sum + lead.budget, 0);
    const hours = won.reduce((sum, lead) => sum + lead.hours, 0);
    const avg = won.length ? revenue / won.length : 0;
    const hourly = hours ? revenue / hours : 0;
    const pipeline = state.leads.filter((lead) => ACTIVE_STAGES.has(lead.stage)).reduce((sum, lead) => sum + lead.budget, 0);
    els.financeAnalytics.innerHTML = `
      <div class="finance-cards">
        <div><span>Выручка</span><strong>${money(revenue)}</strong></div>
        <div><span>Средний чек</span><strong>${money(avg)}</strong></div>
        <div><span>Факт. ставка</span><strong>${money(hourly)}/ч</strong></div>
        <div><span>Pipeline</span><strong>${money(pipeline)}</strong></div>
      </div>`;
  }

  function renderLeadSelect() {
    const value = els.taskLeadSelect.value;
    els.taskLeadSelect.innerHTML = '<option value="">Без лида</option>';
    state.leads.filter((lead) => lead.stage !== 'lost').sort((a, b) => a.client.localeCompare(b.client, 'ru')).forEach((lead) => {
      const option = document.createElement('option');
      option.value = lead.id;
      option.textContent = `${lead.client} · ${lead.project}`;
      els.taskLeadSelect.append(option);
    });
    if ([...els.taskLeadSelect.options].some((option) => option.value === value)) els.taskLeadSelect.value = value;
  }

  function openLeadDialog(lead = null) {
    els.leadForm.reset();
    const data = lead || { id: '', client: '', project: '', source: 'Freelance.ru', stage: 'new', budget: '', hours: '', followup: '', utm: '', note: '' };
    Object.entries(data).forEach(([key, value]) => {
      const field = els.leadForm.elements.namedItem(key);
      if (field) field.value = value ?? '';
    });
    els.leadDialog.showModal();
    setTimeout(() => els.leadForm.elements.client.focus(), 0);
  }

  function openTaskDialog() {
    els.taskForm.reset();
    els.taskForm.elements.due.value = today();
    renderLeadSelect();
    els.taskDialog.showModal();
    setTimeout(() => els.taskForm.elements.title.focus(), 0);
  }

  function handleLeadSubmit(event) {
    event.preventDefault();
    const form = new FormData(els.leadForm);
    const id = String(form.get('id') || '');
    const existing = state.leads.find((lead) => lead.id === id);
    const next = normalizeLead({
      ...(existing || {}),
      id: id || uid(),
      client: form.get('client'),
      project: form.get('project'),
      source: form.get('source'),
      stage: form.get('stage'),
      budget: form.get('budget'),
      hours: form.get('hours'),
      followup: form.get('followup'),
      utm: form.get('utm'),
      note: form.get('note'),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    if (existing) Object.assign(existing, next);
    else state.leads.unshift(next);
    els.leadDialog.close();
    commit();
  }

  function handleTaskSubmit(event) {
    event.preventDefault();
    const form = new FormData(els.taskForm);
    state.tasks.unshift(normalizeTask({
      id: uid(),
      title: form.get('title'),
      due: form.get('due'),
      leadId: form.get('leadId'),
      priority: form.get('priority'),
      done: false,
      createdAt: new Date().toISOString()
    }));
    els.taskDialog.close();
    commit();
  }

  function setView(view) {
    currentView = view;
    $$('[data-view]').forEach((section) => section.hidden = section.dataset.view !== view);
    $$('[data-view-button]').forEach((buttonEl) => buttonEl.classList.toggle('is-active', buttonEl.dataset.viewButton === view));
  }

  function exportData() {
    const payload = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `freelanceos-backup-${today()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Резервная копия выгружена');
  }

  async function importData(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const next = normalizeState(parsed);
      if (!Array.isArray(parsed.leads) || !Array.isArray(parsed.tasks)) throw new Error('invalid shape');
      if (!confirm(`Импортировать ${next.leads.length} лидов и ${next.tasks.length} задач? Текущие данные будут заменены.`)) return;
      state = next;
      commit();
      toast('Данные импортированы');
    } catch (_) {
      toast('Файл не похож на резервную копию FreelanceOS', 'error');
    }
  }

  function loadDemo() {
    if ((state.leads.length || state.tasks.length) && !confirm('Заменить текущие данные demo-набором?')) return;
    const base = Date.now();
    const d = (offset) => new Date(base + offset * 86400000).toISOString().slice(0, 10);
    const leads = [
      ['Анна', 'Telegram-бот для заявок', 'Freelance.ru', 'new', 28000, 16, d(1), 'profile'],
      ['Иван', 'Доработка Next.js проекта', 'Сайт', 'qualified', 45000, 24, d(0), 'seo-web'],
      ['Factory Pro', 'Каталог + API интеграция', 'Рекомендация', 'proposal', 90000, 55, d(2), 'referral'],
      ['AutoLab', 'CRM для отдела продаж', 'Telegram', 'work', 120000, 70, d(4), 'telegram'],
      ['Studio X', 'n8n автоматизация контента', 'Сайт', 'won', 52000, 26, '', 'seo-n8n'],
      ['Мария', 'iOS календарь', 'Freelance.ru', 'won', 68000, 38, '', 'profile'],
      ['Old Lead', 'Лендинг', 'Freelance.ru', 'lost', 18000, 12, '', 'profile']
    ].map(([client, project, source, stage, budget, hours, followup, utm], index) => normalizeLead({
      id: uid(), client, project, source, stage, budget, hours, followup, utm,
      note: index === 2 ? 'Нужен импорт товаров и отправка заявки в существующую CRM.' : '',
      createdAt: new Date(base - (index + 2) * 86400000).toISOString(),
      updatedAt: new Date(base - index * 3600000).toISOString()
    }));
    const tasks = [
      normalizeTask({ id: uid(), title: 'Отправить оценку по Next.js', due: d(0), leadId: leads[1].id, priority: 'high' }),
      normalizeTask({ id: uid(), title: 'Уточнить поля CRM', due: d(1), leadId: leads[3].id, priority: 'normal' }),
      normalizeTask({ id: uid(), title: 'Follow-up после предложения', due: d(2), leadId: leads[2].id, priority: 'normal' })
    ];
    state = { version: VERSION, leads, tasks };
    sourceFilter = 'all';
    searchQuery = '';
    els.search.value = '';
    commit();
    toast('Demo-данные загружены');
  }

  function resetData() {
    if (!confirm('Удалить все локальные данные FreelanceOS на этом устройстве?')) return;
    state = emptyState();
    localStorage.removeItem(STORAGE_KEY);
    sourceFilter = 'all';
    searchQuery = '';
    els.search.value = '';
    renderAll();
    toast('Локальные данные очищены');
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
  }

  function button(text, className, handler) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = className;
    el.textContent = text;
    el.addEventListener('click', handler);
    return el;
  }

  function toast(message, kind = 'ok') {
    let el = $('[data-fos-toast]');
    if (!el) {
      el = document.createElement('div');
      el.dataset.fosToast = '';
      el.className = 'fos-toast';
      el.setAttribute('role', 'status');
      document.body.append(el);
    }
    el.textContent = message;
    el.className = `fos-toast show ${kind}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  $$('[data-add-lead]').forEach((el) => el.addEventListener('click', () => openLeadDialog()));
  $('[data-add-task]')?.addEventListener('click', openTaskDialog);
  $('[data-load-demo]')?.addEventListener('click', loadDemo);
  $('[data-reset]')?.addEventListener('click', resetData);
  $('[data-export]')?.addEventListener('click', exportData);
  $('[data-import]')?.addEventListener('change', (event) => { importData(event.target.files?.[0]); event.target.value = ''; });
  $$('[data-view-button]').forEach((el) => el.addEventListener('click', () => setView(el.dataset.viewButton)));
  els.sourceFilter.addEventListener('change', () => { sourceFilter = els.sourceFilter.value; renderKanban(); });
  els.search.addEventListener('input', () => { searchQuery = els.search.value; renderKanban(); });
  els.leadForm.addEventListener('submit', handleLeadSubmit);
  els.taskForm.addEventListener('submit', handleTaskSubmit);
  [els.leadDialog, els.taskDialog].forEach((dialog) => dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  }));

  setView(currentView);
  renderAll();
})();