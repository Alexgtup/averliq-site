(()=> {
  const root=document.querySelector('[data-p255]');
  if(!root)return;

  const scope=root.closest('.p255-power') || document;
  const buttons=[...root.querySelectorAll('[data-p255-route]')];
  const output=scope.querySelector('[data-p255-output]');
  const link=scope.querySelector('[data-p255-link]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const data={
    product:{
      output:'Интерфейс, данные и backend собраны вокруг одного рабочего сценария.',
      href:'/mvp-development/'
    },
    integrate:{
      output:'API, CRM, 1С и внешние сервисы работают в одном управляемом контуре.',
      href:'/api-integrations/'
    },
    automate:{
      output:'Ручные действия превращены в проверяемый workflow с контролем ошибок.',
      href:'/automation-services/'
    },
    repair:{
      output:'Проект развивается без лишней переписки системы и без остановки рабочего контура.',
      href:'/project-repair/'
    }
  };

  let active='product';
  let timer=null;

  function select(key){
    const cfg=data[key];
    if(!cfg)return;
    active=key;
    buttons.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.p255Route===key)));
    if(output)output.textContent=cfg.output;
    if(link)link.href=cfg.href;
  }
  function restart(){
    if(reduced)return;
    clearInterval(timer);
    timer=setInterval(()=>{
      const keys=Object.keys(data);
      select(keys[(keys.indexOf(active)+1)%keys.length]);
    },5200);
  }

  buttons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      select(btn.dataset.p255Route);
      restart();
    });
  });

  root.addEventListener('pointerenter',()=>clearInterval(timer));
  root.addEventListener('pointerleave',restart);

  if(!reduced)root.dataset.p255Live='true';
  select(active);
  restart();
})();