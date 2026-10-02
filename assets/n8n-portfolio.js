(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const en=document.documentElement.lang.startsWith('en'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const data=$('#n8n-tour-data');
if(data){
 const projects=JSON.parse(data.textContent),tabs=$$('[data-product]');let selected=projects[0];
 function screen(index){const item=selected.screens[index],img=$('[data-tour-image]');img.src=item.src;img.alt=selected.title+' — '+item.label;$('[data-tour-caption]').textContent=img.alt;$$('[data-tour-screens] button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
 function select(id){selected=projects.find(p=>p.id===id);tabs.forEach(b=>{const active=b.dataset.product===id;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});$('#product-panel').setAttribute('aria-labelledby','tour-'+id);$('[data-tour-name]').textContent=selected.title;$('[data-tour-case]').href=selected.href;$('[data-tour-screen-link]').href=selected.href;$('[data-tour-screen-link]').setAttribute('aria-label',(en?'View case: ':'Открыть кейс: ')+selected.title);$('[data-tour-screens]').replaceChildren(...selected.screens.map((item,i)=>{const b=document.createElement('button');b.type='button';b.textContent=item.label;b.addEventListener('click',()=>screen(i));return b;}));screen(0);}
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>select(b.dataset.product));b.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(tabs[n].dataset.product);tabs[n].focus();});});select(projects[0].id);
}
// Replace uncontrolled slideshow timers with explicit per-project controls.
$$('[data-s281-player]').forEach(player=>{
 const frames=$$('.s281-frame',player);if(!frames.length)return;
 let index=0,paused=reduced.matches,visible=false,timer=null;
 const controls=document.createElement('div');controls.className='n8n-player-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label',en?'Screenshot controls':'Управление экранами');
 function button(text,label){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);controls.append(b);return b;}
 const prev=button('←',en?'Previous screenshot':'Предыдущий экран'),pause=button('',en?'Pause preview':'Остановить превью'),next=button('→',en?'Next screenshot':'Следующий экран');player.append(controls);
 const title=$('h3',player.closest('.s281-project'))?.textContent||'Project';
 function stop(){clearTimeout(timer);timer=null;player.classList.remove('is-playing');}
 function schedule(){stop();if(!paused&&visible&&!document.hidden&&frames.length>1){player.classList.add('is-playing');timer=setTimeout(()=>{index=(index+1)%frames.length;paint();},4200);}}
 function paint(){frames.forEach((f,i)=>{f.classList.toggle('is-active',i===index);f.setAttribute('aria-hidden',String(i!==index));f.setAttribute('tabindex','-1');f.removeAttribute('role');f.alt=title+' — '+(en?'screen ':'экран ')+(i+1);});const count=$('[data-s281-count]',player);if(count)count.textContent=String(index+1).padStart(2,'0')+' / '+String(frames.length).padStart(2,'0');pause.textContent=paused?(en?'▶ Play':'▶ Запустить'):(en?'Ⅱ Pause':'Ⅱ Пауза');pause.setAttribute('aria-label',paused?(en?'Play preview':'Запустить превью'):(en?'Pause preview':'Остановить превью'));pause.setAttribute('aria-pressed',String(!paused));player.style.setProperty('--duration','4200ms');schedule();}
 prev.addEventListener('click',()=>{paused=true;index=(index+frames.length-1)%frames.length;paint();});next.addEventListener('click',()=>{paused=true;index=(index+1)%frames.length;paint();});pause.addEventListener('click',()=>{paused=!paused;paint();});
 controls.addEventListener('focusin',()=>{stop();});controls.addEventListener('focusout',()=>{schedule();});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15}).observe(player);else visible=true;
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',e=>{if(e.matches){paused=true;paint();}});paint();
});
// Interactive presentation only: no request, CRM write or notification is sent.
const output=$('.p255-output');
if(output){
 const demo=document.createElement('div');demo.className='n8n-demo';demo.innerHTML='<small>ДЕМОНСТРАЦИЯ СЦЕНАРИЯ · БЕЗ ОТПРАВКИ ДАННЫХ</small><div class="n8n-demo-steps"><span>01 · Входящие данные</span><span>02 · Проверка</span><span>03 · Обработка</span><span>04 · Результат</span></div><button type="button">▶ Запустить сценарий</button><p role="status" aria-live="polite">Выберите направление выше и проследите каждый шаг.</p>';output.after(demo);
 const scenarios={product:['Задача','Интерфейс','Логика','Рабочий релиз'],integrate:['Событие в сервисе','Проверка данных','Запись через API','Подтверждение'],automate:['Новая заявка','Проверка полей','Сделка в CRM','Уведомление'],repair:['Ошибка','Диагностика','Исправление','Проверка']};
 const nodes=$$('.n8n-demo-steps span',demo),run=$('button',demo),status=$('p',demo);let token=0;
 function reset(){token++;nodes.forEach(n=>n.className='');run.disabled=false;run.textContent='▶ Запустить сценарий';const id=$('[data-p255-route][aria-pressed=true]')?.dataset.p255Route||'product';(scenarios[id]||scenarios.product).forEach((text,i)=>nodes[i].textContent='0'+(i+1)+' · '+text);status.textContent='Демонстрация готова к запуску.';}
 $$('[data-p255-route]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(reset)));reset();
 run.addEventListener('click',async()=>{reset();const current=token;run.disabled=true;run.textContent='Выполняется…';for(let i=0;i<nodes.length;i++){if(current!==token)return;nodes[i].className='is-running';status.textContent='Шаг '+(i+1)+' из 4: '+nodes[i].textContent.slice(5);await new Promise(r=>setTimeout(r,reduced.matches?80:650));if(current!==token)return;nodes[i].className='is-done';}status.textContent='Демонстрация завершена. Все четыре шага пройдены.';run.disabled=false;run.textContent='↻ Повторить';});
}
})();
