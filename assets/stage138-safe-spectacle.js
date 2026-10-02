/* stage138-safe-spectacle */
(() => {
  const body = document.body;
  if (!body || body.dataset.page !== 'home') return;

  const home = document.querySelector('.p128-home');
  const hero = document.querySelector('.p128-hero');
  const visual = document.querySelector('.p128-hero__visual');
  if (!home || !hero || !visual) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;

  // Decorative nodes only. Nothing here is allowed to enter normal flow.
  const lens = document.createElement('i');
  lens.className = 'x138-lens';
  lens.setAttribute('aria-hidden', 'true');
  hero.prepend(lens);

  const ghost = document.createElement('i');
  ghost.className = 'x138-ghostword';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.textContent = 'BUILD';
  hero.prepend(ghost);

  let px = innerWidth * .66;
  let py = Math.min(innerHeight * .33, 380);
  let tpx = px;
  let tpy = py;
  let pointerRaf = 0;

  const paintPointer = () => {
    pointerRaf = 0;
    px += (tpx - px) * .16;
    py += (tpy - py) * .16;
    hero.style.setProperty('--x138-lens-x', `${px}px`);
    hero.style.setProperty('--x138-lens-y', `${py}px`);

    if (!coarse) {
      const r = hero.getBoundingClientRect();
      const nx = ((px - r.left) / Math.max(r.width, 1) - .5);
      const ny = ((py - r.top) / Math.max(r.height, 1) - .5);
      visual.style.setProperty('--x138-one-x', `${(nx * 8).toFixed(2)}px`);
      visual.style.setProperty('--x138-one-y', `${(ny * 6).toFixed(2)}px`);
      visual.style.setProperty('--x138-two-x', `${(-nx * 9).toFixed(2)}px`);
      visual.style.setProperty('--x138-two-y', `${(-ny * 7).toFixed(2)}px`);
      visual.style.setProperty('--x138-three-x', `${(nx * 5).toFixed(2)}px`);
      visual.style.setProperty('--x138-three-y', `${(-ny * 4).toFixed(2)}px`);
    }

    if (Math.abs(tpx - px) + Math.abs(tpy - py) > .25) {
      pointerRaf = requestAnimationFrame(paintPointer);
    }
  };

  hero.addEventListener('pointermove', (event) => {
    const r = hero.getBoundingClientRect();
    tpx = event.clientX - r.left;
    tpy = event.clientY - r.top;
    if (!pointerRaf) pointerRaf = requestAnimationFrame(paintPointer);
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    const r = hero.getBoundingClientRect();
    tpx = r.width * .66;
    tpy = Math.min(r.height * .34, 380);
    if (!pointerRaf) pointerRaf = requestAnimationFrame(paintPointer);
  }, { passive: true });

  document.querySelectorAll('.p128-feature__media').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x138-local-x', `${event.clientX - r.left}px`);
      el.style.setProperty('--x138-local-y', `${event.clientY - r.top}px`);
    }, { passive: true });
  });

  // GPU field: isolated canvas, no scroll listeners and no layout mutation.
  if (!reduced && !coarse && !saveData && innerWidth > 900) {
    const canvas = document.createElement('canvas');
    canvas.className = 'x138-field';
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

    if (gl) {
      const vsSource = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
      const fsSource = `
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
          v+=noise(p)*.55;p=p*2.02+4.3;
          v+=noise(p)*.27;p=p*2.01+1.7;
          v+=noise(p)*.12;
          return v;
        }
        void main(){
          vec2 uv=(gl_FragCoord.xy-.5*r)/max(r.y,1.0);
          vec2 mm=(m-.5*r)/max(r.y,1.0);
          float tt=t*.12;
          float n=fbm(uv*1.38+vec2(tt,-tt*.62));
          float d=length(uv-mm*.36);
          float halo=exp(-d*d*3.1);
          float lineA=.5+.5*sin((uv.x*2.0+uv.y*1.15+n*3.8+tt*2.1)*3.14159);
          float lineB=.5+.5*sin((uv.x*1.15-uv.y*2.3-n*3.2-tt*1.6)*3.14159);
          float fil=pow(max(0.0,lineA*lineB),4.0);
          vec3 lime=vec3(.78,1.0,.24);
          vec3 cyan=vec3(.36,.86,1.0);
          vec3 violet=vec3(.42,.28,1.0);
          vec3 col=mix(cyan,lime,clamp(n*.92+halo*.45,0.0,1.0));
          col=mix(col,violet,fil*.35);
          float alpha=.018+n*.055+halo*.085+fil*.075;
          gl_FragColor=vec4(col,alpha);
        }
      `;

      const compile = (type, source) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, source);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          gl.deleteShader(sh);
          return null;
        }
        return sh;
      };

      const vs = compile(gl.VERTEX_SHADER, vsSource);
      const fs = compile(gl.FRAGMENT_SHADER, fsSource);
      if (vs && fs) {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
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
          let frame = 0;
          let active = true;
          const start = performance.now();

          const resize = () => {
            const rect = hero.getBoundingClientRect();
            const dpr = Math.min(devicePixelRatio || 1, 1.25);
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
          if (ro) ro.observe(hero);
          else addEventListener('resize', resize, { passive: true });

          const draw = (now) => {
            if (!active) { frame = 0; return; }
            gl.uniform2f(ur, canvas.width, canvas.height);
            gl.uniform2f(
              um,
              Math.max(0, Math.min(canvas.width, px * (canvas.width / Math.max(hero.clientWidth, 1)))),
              Math.max(0, Math.min(canvas.height, canvas.height - py * (canvas.height / Math.max(hero.clientHeight, 1))))
            );
            gl.uniform1f(ut, (now - start) / 1000);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            frame = requestAnimationFrame(draw);
          };

          const io = new IntersectionObserver(([entry]) => {
            active = entry.isIntersecting && !document.hidden;
            if (active && !frame) frame = requestAnimationFrame(draw);
            if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
          }, { threshold: 0 });
          io.observe(hero);

          document.addEventListener('visibilitychange', () => {
            active = !document.hidden && hero.getBoundingClientRect().bottom > 0;
            if (active && !frame) frame = requestAnimationFrame(draw);
            if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
          });

          frame = requestAnimationFrame(draw);
        } else {
          canvas.remove();
        }
      } else {
        canvas.remove();
      }
    } else {
      canvas.remove();
    }
  }

  // Exhibition rail. IntersectionObserver only toggles state; it never moves content.
  if (!coarse && innerWidth > 1000) {
    const sections = [
      [hero, 'INTRO'],
      [document.querySelector('#selected-work'), 'WORK'],
      [document.querySelector('.p128-capabilities'), 'BUILD'],
      [document.querySelector('#reviews'), 'PROOF'],
      [document.querySelector('#brief'), 'START'],
    ].filter(([el]) => el);

    const rail = document.createElement('nav');
    rail.className = 'x138-rail';
    rail.setAttribute('aria-label', 'Навигация по главной странице');

    sections.forEach(([el, label], index) => {
      if (!el.id) el.id = `x138-section-${index + 1}`;
      const a = document.createElement('a');
      a.href = `#${el.id}`;
      a.dataset.label = label;
      a.setAttribute('aria-label', label);
      if (index === 0) a.classList.add('is-active');
      rail.append(a);
    });
    document.body.append(rail);

    const links = [...rail.querySelectorAll('a')];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const idx = sections.findIndex(([el]) => el === visible.target);
      links.forEach((link, i) => link.classList.toggle('is-active', i === idx));
    }, { threshold: [0.18, 0.35, 0.55] });
    sections.forEach(([el]) => observer.observe(el));
  }
})();
