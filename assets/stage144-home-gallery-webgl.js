/* stage144-home-gallery-webgl */
(() => {
  const body = document.body;
  if (!body || body.dataset.page !== 'home') return;

  const section = document.querySelector('.p128-work');
  const shell = section?.querySelector(':scope > .p128-shell');
  if (!section || !shell) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  if (reduced || saveData || innerWidth <= 900) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'x144-work-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '1',
    pointerEvents: 'none',
    opacity: '.78',
    mixBlendMode: 'multiply',
    filter: 'saturate(1.06) contrast(1.02)'
  });
  shell.style.zIndex = '2';
  section.prepend(canvas);

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    premultipliedAlpha: false
  });
  if (!gl) { canvas.remove(); return; }

  const vertex = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  const fragment = `
    precision mediump float;
    uniform vec2 r;
    uniform vec2 m;
    uniform float t;

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.0;
      v+=noise(p)*.56;p=p*2.03+vec2(2.7,1.1);
      v+=noise(p)*.27;p=p*2.01+vec2(1.2,3.1);
      v+=noise(p)*.12;
      return v;
    }
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*r)/max(r.y,1.0);
      vec2 mm=(m-.5*r)/max(r.y,1.0);
      float tt=t*.08;
      float n=fbm(uv*1.08+vec2(tt,-tt*.55));
      float wave=.5+.5*sin(uv.x*2.3+uv.y*1.15+n*3.8+tt*2.4);
      float ribbon=pow(.5+.5*sin((uv.x-uv.y)*2.6+n*4.5-tt*1.8),5.0);
      float d=length(uv-mm*.55);
      float focus=exp(-d*d*2.0);

      vec3 lime=vec3(.66,.82,.23);
      vec3 coral=vec3(.78,.36,.28);
      vec3 warm=vec3(.94,.72,.42);
      vec3 col=mix(lime,coral,clamp(wave*.82+n*.22,0.0,1.0));
      col=mix(col,warm,focus*.16+ribbon*.08);

      float alpha=.035+n*.075+ribbon*.055+focus*.035;
      gl_FragColor=vec4(col,alpha);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('stage144 shader compile failed', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) { canvas.remove(); return; }

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const ur = gl.getUniformLocation(program, 'r');
  const um = gl.getUniformLocation(program, 'm');
  const ut = gl.getUniformLocation(program, 't');

  let mx = .54, my = .32, targetX = mx, targetY = my;
  let frame = 0, active = true;
  const start = performance.now();

  const resize = () => {
    const rect = section.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  resize();

  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(section);
  else addEventListener('resize', resize, { passive: true });

  section.addEventListener('pointermove', (event) => {
    const rect = section.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / Math.max(rect.width, 1);
    targetY = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
  }, { passive: true });

  const draw = (now) => {
    if (!active) { frame = 0; return; }
    mx += (targetX - mx) * .025;
    my += (targetY - my) * .025;
    gl.uniform2f(ur, canvas.width, canvas.height);
    gl.uniform2f(um, mx * canvas.width, my * canvas.height);
    gl.uniform1f(ut, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    frame = requestAnimationFrame(draw);
  };

  const io = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting && !document.hidden;
    if (active && !frame) frame = requestAnimationFrame(draw);
    if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
  }, { threshold: 0 });
  io.observe(section);

  document.addEventListener('visibilitychange', () => {
    const rect = section.getBoundingClientRect();
    active = !document.hidden && rect.bottom > 0 && rect.top < innerHeight;
    if (active && !frame) frame = requestAnimationFrame(draw);
    if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
  });

  frame = requestAnimationFrame(draw);
})();
