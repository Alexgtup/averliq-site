/* stage135-world-system */
(() => {
  const b = document.body;
  if (!b || b.dataset.x135 !== 'true') return;
  if (b.dataset.page === 'home') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  const progress = document.createElement('div');
  progress.className = 'x135-progress';
  progress.setAttribute('aria-hidden','true');
  progress.innerHTML = '<i></i>';
  document.body.append(progress);

  let scrollRAF = 0;
  const paintScroll = () => {
    scrollRAF = 0;
    const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    document.documentElement.style.setProperty('--x135-scroll', Math.min(1, Math.max(0, scrollY / max)).toFixed(4));
  };
  addEventListener('scroll', () => { if (!scrollRAF) scrollRAF = requestAnimationFrame(paintScroll); }, {passive:true});
  addEventListener('resize', paintScroll, {passive:true});
  paintScroll();

  const sections = [...document.querySelectorAll('main > section, main article > section, main .intl-section, main .growth-section')];
  sections.forEach((el) => el.classList.add('x135-enter'));
  if (reduced || !('IntersectionObserver' in window)) sections.forEach((el) => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), {threshold:.08, rootMargin:'0px 0px -6% 0px'});
    sections.forEach((el) => io.observe(el));
  }

  const hero = document.querySelector('.hero,.dt-hero,.intl-hero,.growth-hero,.fos-hero,.p128-hero,.p129-svc-hero,.p130-hero,.p132-cover');
  if (hero && !b.dataset.x134 && !reduced && innerWidth > 900) {
    const scene = document.createElement('div');
    scene.className = 'x135-scene'; scene.setAttribute('aria-hidden','true');
    const canvas = document.createElement('canvas'); scene.append(canvas);
    const o1 = document.createElement('i'); const o2 = document.createElement('i');
    o1.className='x135-orbit'; o2.className='x135-orbit';
    Object.assign(o1.style,{width:'42vw',height:'42vw',right:'-8vw',top:'-13vw'});
    Object.assign(o2.style,{width:'24vw',height:'24vw',right:'12vw',top:'12vw'});
    scene.append(o1,o2); hero.prepend(scene);
    const gl = canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'});
    if (gl) {
      const vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      const fs=`precision mediump float;uniform vec2 r,m;uniform float t,s;uniform vec3 a,c;void main(){vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;vec2 mm=(m-.5*r)/r.y;float d=length(uv-mm*.28);float wave=sin(d*16.-t*1.4+s*7.)*.5+.5;float ring=smoothstep(.42,.05,abs(d-.28-.045*sin(t*.35)));float grid=.5+.5*sin(uv.x*22.+t*.18)*sin(uv.y*22.-t*.14);float mask=pow(max(0.,1.-length(uv)*.72),2.);vec3 col=mix(a,c,wave);float al=(.045*grid+.11*ring)*mask;gl_FragColor=vec4(col,al);}`;
      const shader=(type,src)=>{const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);return sh};
      const pr=gl.createProgram(); gl.attachShader(pr,shader(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,shader(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr); gl.useProgram(pr);
      const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      const ur=gl.getUniformLocation(pr,'r'),um=gl.getUniformLocation(pr,'m'),ut=gl.getUniformLocation(pr,'t'),us=gl.getUniformLocation(pr,'s'),ua=gl.getUniformLocation(pr,'a'),uc=gl.getUniformLocation(pr,'c');
      const parse=(v,fb)=>{const x=(v||fb).trim();const m=x.match(/^#([0-9a-f]{6})$/i);return m?[parseInt(m[1].slice(0,2),16)/255,parseInt(m[1].slice(2,4),16)/255,parseInt(m[1].slice(4,6),16)/255]:fb==='#c9ff4a'?[.79,1,.29]:[.38,.9,1]};
      const cs=getComputedStyle(b), ca=parse(cs.getPropertyValue('--x135-a'),'#c9ff4a'), cb=parse(cs.getPropertyValue('--x135-b'),'#60e7ff');
      let mx=innerWidth*.72,my=innerHeight*.28,raf=0,start=performance.now();
      addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY},{passive:true});
      const resize=()=>{const d=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.floor(hero.clientWidth*d)),h=Math.max(1,Math.floor(hero.clientHeight*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}};
      const draw=now=>{resize();gl.uniform2f(ur,canvas.width,canvas.height);gl.uniform2f(um,mx*(canvas.width/innerWidth),canvas.height-my*(canvas.height/innerHeight));gl.uniform1f(ut,(now-start)/1000);gl.uniform1f(us,scrollY/Math.max(innerHeight,1));gl.uniform3fv(ua,ca);gl.uniform3fv(uc,cb);gl.drawArrays(gl.TRIANGLES,0,6);raf=requestAnimationFrame(draw)};
      raf=requestAnimationFrame(draw);
      document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}else if(!document.hidden&&!raf)raf=requestAnimationFrame(draw)});
    }
  }

  if (!reduced && !coarse) {
    const magnets=[...document.querySelectorAll('a[class*="btn"],button,.stage94-action-primary,.intl-btn,.dt-btn')].slice(0,40);
    magnets.forEach((el)=>{
      el.classList.add('x135-magnetic');
      el.addEventListener('pointermove',(e)=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)*.09,y=(e.clientY-r.top-r.height/2)*.12;el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`});
      el.addEventListener('pointerleave',()=>{el.style.transform=''});
    });
  }
})();
