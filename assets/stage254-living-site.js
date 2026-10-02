(()=> {
  const body=document.body;
  if(!body)return;

  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  body.dataset.stage254Live='true';
  root.classList.add('s254-js');

  /* Scroll progress + material header state. */
  let scrollRaf=0;
  const paintScroll=()=>{
    scrollRaf=0;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const progress=Math.min(1,Math.max(0,scrollY/max));
    root.style.setProperty('--s254-scroll',progress.toFixed(5));
    body.classList.toggle('s254-scrolled',scrollY>26);
  };
  const queueScroll=()=>{
    if(!scrollRaf)scrollRaf=requestAnimationFrame(paintScroll);
  };
  paintScroll();
  addEventListener('scroll',queueScroll,{passive:true});
  addEventListener('resize',queueScroll,{passive:true});

  /* Section entrance. Keep hero immediate; animate narrative sections below it. */
  const revealSelector=[
    'main > section:not(:first-child)',
    'main > article:not(:first-child)',
    'main .p130-list-section',
    'main .p132-panel',
    'main .p129-section',
    'main .p223-decision-group',
    'main .stage173-case-links',
    'main .stage174-faq',
    'main .search-demand',
    'main .secondary-demand',
    'footer',
    '.footer'
  ].join(',');

  const reveal=[...new Set(document.querySelectorAll(revealSelector))].filter(el=>{
    if(el.closest('[hidden],[aria-hidden="true"]'))return false;
    const r=el.getBoundingClientRect();
    return r.width>0&&r.height>0;
  });
  reveal.forEach((el,i)=>{
    el.dataset.s254Reveal='';
    el.style.setProperty('--s254-delay',Math.min(i%4,3)*28+'ms');
  });

  const staggerSelector=[
    '.p130-mosaic',
    '.p233-grid',
    '.p223-decision-cards',
    '.p129-outcomes',
    '.search-demand__grid',
    '.deliver',
    '.workflow',
    '.p250-canvas'
  ].join(',');
  const stagger=[...document.querySelectorAll(staggerSelector)].filter(el=>el.children.length>1);
  stagger.forEach(el=>{
    el.dataset.s254Stagger='';
    [...el.children].forEach((child,i)=>child.style.setProperty('--s254-i',Math.min(i,9)));
  });

  const enter=el=>el.classList.add('is-s254-in');
  if(reduced||!('IntersectionObserver'in window)){
    reveal.forEach(enter);
    stagger.forEach(enter);
  }else{
    const io=new IntersectionObserver(entries=>{
      for(const e of entries){
        if(!e.isIntersecting)continue;
        enter(e.target);
        io.unobserve(e.target);
      }
    },{rootMargin:'0px 0px -9% 0px',threshold:.06});

    [...reveal,...stagger].forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.top<innerHeight*.92)enter(el);
      else io.observe(el);
    });
  }

  if(!fine||reduced)return;

  /* Cursor light fields on light cards. We inject a non-layout span instead of
     stealing the component's existing ::before/::after pseudo elements. */
  const surfaceSelector=[
    '.p233-case',
    '.p130-tile',
    '.p129-outcome',
    '.p223-guide',
    '.p215-node',
    '.p250-node',
    '.search-demand__card',
    '.stage174-faq details',
    '.dt-panel',
    '.note',
    '.s205-proof__card',
    '.x146-depth__card'
  ].join(',');

  const surfaces=[...document.querySelectorAll(surfaceSelector)].filter(el=>{
    const r=el.getBoundingClientRect();
    return r.width>120&&r.height>70&&!el.closest('[hidden]');
  });

  for(const surface of surfaces){
    const basePosition=getComputedStyle(surface).position;
    surface.classList.add('s254-live-surface');
    if(basePosition==='static') surface.classList.add('s254-positioned');
    if(!surface.querySelector(':scope > .s254-light-field')){
      const field=document.createElement('span');
      field.className='s254-light-field';
      field.setAttribute('aria-hidden','true');
      surface.append(field);
    }
    let raf=0,px=50,py=50;
    const paint=()=>{
      raf=0;
      surface.style.setProperty('--s254-x',px.toFixed(1)+'%');
      surface.style.setProperty('--s254-y',py.toFixed(1)+'%');
    };
    surface.addEventListener('pointermove',e=>{
      const r=surface.getBoundingClientRect();
      px=((e.clientX-r.left)/Math.max(r.width,1))*100;
      py=((e.clientY-r.top)/Math.max(r.height,1))*100;
      if(!raf)raf=requestAnimationFrame(paint);
    },{passive:true});
    surface.addEventListener('pointerleave',()=>{
      surface.style.removeProperty('--s254-x');
      surface.style.removeProperty('--s254-y');
    },{passive:true});
  }

  /* Magnetic action buttons, only where another transform is not already in use. */
  const magneticSelector=[
    '.stage98-cta',
    '.p128-actions a',
    '.p129-actions a',
    '.p130-footer-cta a',
    '.p250-inspector a',
    'a.btn-primary',
    'button.btn-primary',
    'a[data-primary-action]'
  ].join(',');

  const magnetic=[...new Set(document.querySelectorAll(magneticSelector))].filter(el=>{
    const r=el.getBoundingClientRect();
    return r.width>52&&r.height>28&&getComputedStyle(el).transform==='none';
  });

  for(const el of magnetic){
    el.classList.add('s254-magnetic');
    let raf=0,mx=0,my=0;
    const paint=()=>{
      raf=0;
      el.style.setProperty('--s254-mx',mx.toFixed(1)+'px');
      el.style.setProperty('--s254-my',my.toFixed(1)+'px');
    };
    el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect();
      mx=(e.clientX-r.left-r.width/2)*.075;
      my=(e.clientY-r.top-r.height/2)*.11;
      if(!raf)raf=requestAnimationFrame(paint);
    },{passive:true});
    el.addEventListener('pointerleave',()=>{
      el.style.setProperty('--s254-mx','0px');
      el.style.setProperty('--s254-my','0px');
    },{passive:true});
  }

  body.dataset.stage254Ready='true';
})();