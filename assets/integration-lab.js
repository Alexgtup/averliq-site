/* UI for local, explicit simulations. Real credentials are never requested. */
(function() {
 'use strict';
 const host = document.querySelector('[data-integration-lab]');
 if (!host) return;
 const C = window.IntegrationLab;
 const en = document.documentElement.lang === 'en';
 const t=(ru,eng)=>en?eng:ru;
 const q=s=>host.querySelector(s);
 const money=n=>new Intl.NumberFormat(en?'en-US':'ru-RU',{style:'currency',currency:'RUB'}).format(n/100);
 const notice=q('[data-notice]');
 const status={accepted:t('Принята','Accepted'),duplicate:t('Повтор','Duplicate'),invalid:t('Ошибка','Invalid'),high:t('Высокий','High'),normal:t('Обычный','Normal')};
 const errors={INVALID_BATCH:t('Нужен массив, не более 1000 заявок.','Enter an array of up to 1,000 requests.'),INVALID_CATALOG:t('Проверьте номер версии и массив товаров.','Check the revision and the items array.'),INVALID_PRODUCT:t('Проверьте артикулы, целые цены и неотрицательные остатки.','Check SKUs, integer prices and non-negative stock.'),INVALID_QUANTITY:t('Количество должно быть положительным целым числом.','Quantity must be a positive integer.'),OUT_OF_STOCK:t('Недостаточно товара. Заказ не создан, остатки не изменены.','Insufficient stock. No order or stock changes were saved.'),UNKNOWN_SKU:t('Артикул отсутствует в каталоге.','SKU is not in the catalogue.'),ID_CONFLICT:t('Этот номер заказа уже используется с другим составом.','This order ID already has different items.'),RESERVATION_CONFLICT:t('Новый каталог конфликтует с открытыми резервами.','The new catalogue conflicts with open reservations.')};
 function say(text,bad=false){notice.textContent=text;notice.dataset.error=String(bad);}
 function table(target,rows){target.replaceChildren();for(const row of rows){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}target.append(tr);}}
 function download(name,data){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function guard(fn){try{fn();}catch(e){say(errors[e.message]||t('Проверьте структуру JSON и обязательные поля.','Check the JSON structure and required fields.'),true);}}
 if(host.dataset.integrationLab==='leadflow') {
  const seed=[{name:'Demo Studio',email:'studio@example.com',request:t('Каталог для сайта','Website catalogue'),budget:45000},{name:'Demo Workshop',email:'workshop@example.com',request:t('Уведомления в Telegram','Telegram notifications'),budget:12000},{name:'Demo Studio',email:' STUDIO@example.com ',request:t('Каталог для сайта','Website catalogue'),budget:45000},{name:'Demo Request',email:'',request:t('Интеграция CRM','CRM integration'),budget:20000}];
  let results=[];
  function run(){results=C.leadBatch(JSON.parse(q('[data-input]').value));table(q('[data-results]'),results.map(r=>[r.id,r.name||'—',status[r.status],r.priority?status[r.priority]:'—']));for(const s of ['accepted','duplicate','invalid'])q(`[data-count="${s}"]`).textContent=results.filter(r=>r.status===s).length;q('[data-output]').textContent=JSON.stringify(results.filter(r=>r.status==='accepted').map(r=>r.crmDraft),null,2);q('[data-download]').disabled=false;say(t('Пакет обработан. Карточки подготовлены локально; отправки в CRM нет.','Batch processed. CRM drafts were prepared locally; nothing was sent.'));}
  q('[data-input]').value=JSON.stringify(seed,null,2);
  q('[data-ix-run]').addEventListener('click',()=>guard(run));
  q('[data-reset]').addEventListener('click',()=>{q('[data-input]').value=JSON.stringify(seed,null,2);results=[];table(q('[data-results]'),[]);for(const s of ['accepted','duplicate','invalid'])q(`[data-count="${s}"]`).textContent='—';q('[data-output]').textContent='[]';q('[data-download]').disabled=true;say(t('Пример восстановлен. Нажмите «Обработать заявки».','Sample restored. Press “Process requests”.'));});
  q('[data-download]').addEventListener('click',()=>download('leadflow-crm-drafts.json',results.filter(r=>r.status==='accepted').map(r=>r.crmDraft)));
 } else {
  const payload={revision:1,items:[{sku:'001-CHAIR',name:t('Кресло Forma','Forma chair'),priceMinor:1899000,stock:8},{sku:'002-LAMP',name:t('Лампа Arc','Arc lamp'),priceMinor:499000,stock:3},{sku:'003-DESK',name:t('Стол Line','Line desk'),priceMinor:2499000,stock:0}]};
  let state=C.initialState(),seq=1,last=null,events=[];
  function event(text){events.unshift(text);events=events.slice(0,8);q('[data-events]').replaceChildren(...events.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}
  function render(){table(q('[data-stock]'),Object.values(state.catalog).map(p=>[p.sku,p.name,money(p.priceMinor),p.stock]));table(q('[data-orders]'),Object.values(state.orders).map(o=>[o.id,o.lines.map(l=>`${l.sku} × ${l.qty}`).join(', '),money(o.totalMinor)]));q('[data-count="revision"]').textContent=state.revision;q('[data-count="products"]').textContent=Object.keys(state.catalog).length;q('[data-count="orders"]').textContent=Object.keys(state.orders).length;q('[data-repeat]').disabled=!last;q('[data-download]').disabled=!Object.keys(state.orders).length;const select=q('[data-sku]'),selected=select.value;select.replaceChildren(...Object.values(state.catalog).map(p=>{const o=document.createElement('option');o.value=p.sku;o.textContent=`${p.sku} · ${p.name}`;return o;}));if([...select.options].some(o=>o.value===selected))select.value=selected;q('[data-order]').disabled=!select.options.length;}
  function sync(){const r=C.syncCatalog(state,JSON.parse(q('[data-input]').value));state=r.state;render();const msg=r.status==='updated'?t(`Каталог обновлён: ${r.count} товара.`,`Catalogue updated: ${r.count} products.`):t('Эта версия уже обработана. Повтор пропущен.','This revision was already processed. Retry skipped.');say(msg);event(msg);}
  function submit(order){const r=C.importOrder(state,order);state=r.state;last=order;render();q('[data-output]').textContent=JSON.stringify(r.order,null,2);const msg=r.status==='duplicate'?t('Повтор распознан: второй заказ и новый резерв не созданы.','Retry detected: no duplicate order or extra reservation.'):t(`Заказ ${order.id} принят в модель обмена.`,`Order ${order.id} accepted into the exchange model.`);say(msg);event(msg);}
  q('[data-input]').value=JSON.stringify(payload,null,2);render();
  q('[data-ix-sync]').addEventListener('click',()=>guard(sync));
  q('[data-order-form]').addEventListener('submit',e=>{e.preventDefault();guard(()=>{const order={id:'WEB-'+String(seq).padStart(3,'0'),lines:[{sku:q('[data-sku]').value,qty:Number(q('[data-qty]').value)}]};submit(order);seq++;});});
  q('[data-repeat]').addEventListener('click',()=>guard(()=>submit(last)));
  q('[data-reset]').addEventListener('click',()=>{state=C.initialState();seq=1;last=null;events=[];q('[data-input]').value=JSON.stringify(payload,null,2);q('[data-output]').textContent='{}';q('[data-events]').replaceChildren();render();say(t('Стенд очищен. Сначала загрузите каталог.','Demo reset. Load the catalogue first.'));});
  q('[data-download]').addEventListener('click',()=>download('tradesync-orders.json',Object.values(state.orders).map(({signature,...o})=>o)));
 }
})();
