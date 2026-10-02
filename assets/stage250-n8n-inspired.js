(()=> {
  const root=document.querySelector('[data-p250-flow]');
  if(!root) return;

  const tabs=[...root.querySelectorAll('[data-p250-scenario]')];
  const nodes=[...root.querySelectorAll('[data-p250-node]')];
  const lines=[...root.querySelectorAll('[data-p250-line]')];
  const title=root.querySelector('[data-p250-title]');
  const text=root.querySelector('[data-p250-text]');
  const link=root.querySelector('[data-p250-link]');

  const scenarios={
    product:{
      nodes:['input','ui','logic','test','release'],
      lines:['input-ui','ui-logic','logic-test','test-release'],
      title:'Продукт с понятным пользовательским путём',
      text:'Интерфейс, backend и проверяемый первый сценарий — без лишних слоёв вокруг основной задачи.',
      href:'/mvp-development/'
    },
    integrate:{
      nodes:['input','api','logic','release'],
      lines:['input-api','api-logic','logic-release'],
      title:'Сервисы начинают работать как одна система',
      text:'API, webhooks, CRM, 1С и внешние данные связываются вокруг конкретного события и результата.',
      href:'/api-integrations/'
    },
    automate:{
      nodes:['input','api','logic','test','release'],
      lines:['input-api','api-logic','logic-test','test-release'],
      title:'Ручной процесс превращается в workflow',
      text:'Повторяемый шаг получает триггер, правила, контроль ошибок и измеримый результат.',
      href:'/automation-services/'
    },
    repair:{
      nodes:['input','ui','logic','test','release'],
      lines:['input-ui','ui-logic','logic-test','test-release'],
      title:'Чужой проект не нужно автоматически переписывать',
      text:'Сначала локализуется проблема, затем меняется только нужный участок и проверяется рабочий сценарий.',
      href:'/project-repair/'
    }
  };

  let active='product';
  let timer=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function select(key,focus=false){
    const cfg=scenarios[key];
    if(!cfg) return;
    active=key;
    tabs.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.p250Scenario===key)));
    nodes.forEach(node=>node.classList.toggle('is-active',cfg.nodes.includes(node.dataset.p250Node)));
    lines.forEach(line=>line.classList.toggle('is-active',cfg.lines.includes(line.dataset.p250Line)));
    if(title) title.textContent=cfg.title;
    if(text) text.textContent=cfg.text;
    if(link) link.href=cfg.href;
    if(focus) root.querySelector('[data-p250-title]')?.setAttribute('aria-live','polite');
  }

  function restart(){
    if(reduced) return;
    clearInterval(timer);
    timer=setInterval(()=>{
      const keys=Object.keys(scenarios);
      select(keys[(keys.indexOf(active)+1)%keys.length]);
    },6200);
  }

  tabs.forEach(btn=>btn.addEventListener('click',()=>{
    select(btn.dataset.p250Scenario,true);
    restart();
  }));
  root.addEventListener('pointerenter',()=>clearInterval(timer));
  root.addEventListener('pointerleave',restart);
  document.addEventListener('visibilitychange',()=>document.hidden?clearInterval(timer):restart());

  select(active);
  restart();
})();