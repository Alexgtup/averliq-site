/* stage134-experimental-web */
(() => {
  const body = document.body;
  if (!body || body.dataset.x134 !== 'true') return;
  if (body.dataset.page === 'home') return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  const fineDesktop = !reduced && !coarse && innerWidth > 900;

  const hero = document.querySelector('.p128-hero,.p129-svc-hero,.p130-hero,.p132-cover');
  if (hero && !reduced) {
    const scan = document.createElement('div');
    scan.className = 'x134-scan';
    scan.setAttribute('aria-hidden', 'true');
    hero.prepend(scan);
  }

  if (fineDesktop) {
    document.querySelectorAll('.p128-feature,.p129-case-card,.p130-featured-card,.p132-cover-visual').forEach((el) => {
      el.classList.add('x134-reactive');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      const light = document.createElement('i');
      light.className = 'x134-hoverlight';
      light.setAttribute('aria-hidden', 'true');
      el.append(light);
      el.addEventListener('pointermove', (event) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x134-local-x', `${event.clientX - r.left}px`);
        el.style.setProperty('--x134-local-y', `${event.clientY - r.top}px`);
      }, { passive: true });
    });

    const cursor = document.createElement('div');
    cursor.className = 'x134-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy, cursorRaf = 0;
    const cursorTick = () => {
      cx += (tx - cx) * .26;
      cy += (ty - cy) * .26;
      cursor.style.left = `${cx}px`;
      cursor.style.top = `${cy}px`;
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > .2) cursorRaf = requestAnimationFrame(cursorTick);
      else cursorRaf = 0;
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorTick);
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('is-link', !!e.target.closest('a,button,summary,input,textarea,select'));
    }, { passive: true });
  }

  if (!hero || !fineDesktop || saveData) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'x134-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    premultipliedAlpha: false,
  });
  if (!gl) { canvas.remove(); return; }

  const vertex = `
    attribute vec2 a_position;
    void main(){ gl_Position = vec4(a_position,0.0,1.0); }
  `;
  const fragment = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform float u_scroll;
    uniform vec3 u_a;
    uniform vec3 u_b;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.0;
      v+=noise(p)*.55; p=p*2.03+3.7;
      v+=noise(p)*.28; p=p*2.01+1.9;
      v+=noise(p)*.12;
      return v;
    }
    void main(){
      vec2 st=gl_FragCoord.xy/u_resolution.xy;
      vec2 uv=st*2.0-1.0;
      uv.x*=u_resolution.x/max(u_resolution.y,1.0);
      vec2 m=u_mouse*2.0-1.0;
      m.x*=u_resolution.x/max(u_resolution.y,1.0);
      float t=u_time*.11;
      float n=fbm(uv*1.18+vec2(t,-t*.55));
      float waves=.5+.5*sin(uv.x*2.15+uv.y*1.35+n*4.0+t*3.0+u_scroll*2.2);
      float d=length(uv-m);
      float focus=exp(-d*d*1.8);
      float filament=smoothstep(.72,.98,.5+.5*sin((uv.x-uv.y)*3.0+n*5.2-t*2.0));
      vec3 col=mix(u_a,u_b,clamp(waves*.72+n*.35,0.0,1.0));
      col+=mix(u_b,u_a,focus)*focus*.42;
      col+=vec3(1.0)*filament*.08;
      float alpha=.055+n*.075+focus*.09+filament*.035;
      gl_FragColor=vec4(col,alpha);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Stage134 shader compile failed', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) { canvas.remove(); return; }
  const program = gl.createProgram();
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    res: gl.getUniformLocation(program,'u_resolution'),
    mouse: gl.getUniformLocation(program,'u_mouse'),
    time: gl.getUniformLocation(program,'u_time'),
    scroll: gl.getUniformLocation(program,'u_scroll'),
    a: gl.getUniformLocation(program,'u_a'),
    b: gl.getUniformLocation(program,'u_b'),
  };
  const palettes = {
    home:['#c9ff4a','#6fe7ff'], services:['#c9ff4a','#5de5ff'], cases:['#ff6e56','#7a8dff'], guides:['#ff8a55','#8f6dff'], about:['#f0ca65','#f48f72'],
    'telegram-bots':['#39d4ff','#7fffc1'], 'telegram-bot-repair':['#39d4ff','#ff7188'], 'telegram-mini-apps':['#5b8cff','#c3a7ff'],
    'web-development':['#c9ff4a','#fff076'], development:['#c9ff4a','#6fe7ff'], 'n8n-automation':['#ff6948','#ffb25c'],
    'api-integrations':['#b58cff','#64d8ff'], 'backend-development':['#b58cff','#64d8ff'], 'crm-development':['#ffd45b','#ff8f68'],
    'project-repair':['#ff7188','#ffb15f'], 'python-development':['#66c8ff','#ffe15d'], 'ai-automation':['#b778ff','#ff75c8'],
    'ios-development':['#8bb0ff','#88f0ff'], 'app-development':['#8bb0ff','#88f0ff'], 'mvp-development':['#55e3a7','#c9ff4a'],
    'fin-planner':['#6be7a8','#c9ff4a'], 'swift-calendar':['#89a7ff','#df9cff'], 'sheetpilot-ai':['#6f8dff','#62e6ff'],
    'seo-control-center':['#79a1ff','#b174ff'], 'auto-crm':['#ffb559','#ff7169'], 'factory-catalog':['#9ee0a4','#f0d278'],
    'taxi-app':['#ffd54f','#5be0ff'], 'siteaudit-studio':['#78e7df','#67a7ff'], 'freelance-os':['#ff7ab6','#8d7cff'],
    'freelance-developer':['#55d9ff','#8f7dff']
  };
  const toRgb = (hex) => {
    const n = parseInt(hex.slice(1),16);
    return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
  };
  const palette = palettes[body.dataset.wowRoute] || ['#c9ff4a','#6fe7ff'];
  gl.uniform3fv(uniforms.a, toRgb(palette[0]));
  gl.uniform3fv(uniforms.b, toRgb(palette[1]));

  let mx=.62,my=.34,tmx=mx,tmy=my,active=true,frame=0,start=performance.now();
  const resize = () => {
    const r=hero.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,1.25);
    const w=Math.max(1,Math.round(r.width*dpr));
    const h=Math.max(1,Math.round(r.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  };
  resize();
  const ro='ResizeObserver' in window?new ResizeObserver(resize):null;
  if(ro)ro.observe(hero); else addEventListener('resize',resize,{passive:true});
  hero.addEventListener('pointermove',(e)=>{const r=hero.getBoundingClientRect();tmx=(e.clientX-r.left)/r.width;tmy=1-(e.clientY-r.top)/r.height},{passive:true});

  const draw=(now)=>{
    if(!active){frame=0;return}
    mx+=(tmx-mx)*.035; my+=(tmy-my)*.035;
    const r=hero.getBoundingClientRect();
    const scroll=Math.max(0,Math.min(1,-r.top/Math.max(r.height,1)));
    gl.uniform2f(uniforms.res,canvas.width,canvas.height);
    gl.uniform2f(uniforms.mouse,mx,my);
    gl.uniform1f(uniforms.time,(now-start)/1000);
    gl.uniform1f(uniforms.scroll,scroll);
    gl.drawArrays(gl.TRIANGLES,0,6);
    frame=requestAnimationFrame(draw);
  };
  const io=new IntersectionObserver(([entry])=>{
    active=entry.isIntersecting && !document.hidden;
    if(active&&!frame) frame=requestAnimationFrame(draw);
    if(!active&&frame){cancelAnimationFrame(frame);frame=0}
  },{threshold:0});
  io.observe(hero);
  document.addEventListener('visibilitychange',()=>{
    active=!document.hidden && hero.getBoundingClientRect().bottom>0 && hero.getBoundingClientRect().top<innerHeight;
    if(active&&!frame) frame=requestAnimationFrame(draw);
  });
  frame=requestAnimationFrame(draw);
})();
