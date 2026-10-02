/* stage145-cases-gallery-interactive */
(() => {
  const main = document.querySelector('[data-stage130-hub="cases"]');
  const section = main?.querySelector('.p130-list-section');
  const shell = section?.querySelector(':scope > .p130-shell');
  const tiles = [...(main?.querySelectorAll('.p130-tile') || [])];
  if (!main || !section || !shell || !tiles.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const desktopFx = !reduced && !coarse && !saveData && innerWidth > 900;

  tiles.forEach((tile) => {
    tile.addEventListener('pointermove', (event) => {
      const r = tile.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      tile.style.setProperty('--x145-card-x', `${x}px`);
      tile.style.setProperty('--x145-card-y', `${y}px`);
      if (desktopFx) {
        const nx = x / Math.max(r.width, 1) - .5;
        const ny = y / Math.max(r.height, 1) - .5;
        tile.style.setProperty('--x145-rx', `${(-ny * 2.2).toFixed(2)}deg`);
        tile.style.setProperty('--x145-ry', `${(nx * 2.6).toFixed(2)}deg`);
      }
    }, { passive: true });
    tile.addEventListener('pointerleave', () => {
      tile.style.setProperty('--x145-rx', '0deg');
      tile.style.setProperty('--x145-ry', '0deg');
    }, { passive: true });
  });

  if (!desktopFx) return;

  const lens = document.createElement('span');
  lens.className = 'x145-liquid-lens';
  lens.setAttribute('aria-hidden', 'true');
  section.prepend(lens);

  const indexMark = document.createElement('span');
  indexMark.className = 'x145-index-mark';
  indexMark.textContent = '01–09';
  indexMark.setAttribute('aria-hidden', 'true');
  section.append(indexMark);

  const caption = document.createElement('span');
  caption.className = 'x145-index-caption';
  caption.textContent = 'SELECTED WORK / MATERIAL INDEX';
  caption.setAttribute('aria-hidden', 'true');
  section.append(caption);

  const canvas = document.createElement('canvas');
  canvas.className = 'x145-cases-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  section.prepend(canvas);

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    premultipliedAlpha: false
  });
  if (!gl) {
    canvas.remove();
    lens.remove();
    return;
  }

  const vertex = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  const fragment = `
    precision mediump float;
    uniform vec2 r;
    uniform vec2 m;
    uniform vec2 c;
    uniform float t;
    uniform float pulse;

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.0;
      v+=noise(p)*.54;p=p*2.02+vec2(2.4,1.2);
      v+=noise(p)*.27;p=p*2.03+vec2(1.1,3.3);
      v+=noise(p)*.13;p=p*2.01+vec2(3.7,.8);
      v+=noise(p)*.06;
      return v;
    }
    float ring(float d,float radius,float width){
      return exp(-pow((d-radius)/max(width,.001),2.0));
    }

    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*r)/max(r.y,1.0);
      vec2 mm=(m-.5*r)/max(r.y,1.0);
      vec2 cc=(c-.5*r)/max(r.y,1.0);
      float tt=t*.055;

      float q1=fbm(uv*.92+vec2(tt,-tt*.72));
      float q2=fbm(uv*1.38+vec2(-tt*.56,tt*.38)+vec2(q1*.22,-q1*.14));
      vec2 p=uv+vec2(q1-.5,q2-.5)*.16;

      vec2 md=p-mm*.66;
      float cursor=exp(-dot(md,md)*4.2);
      float ml=max(length(md),.001);
      p+=md/ml*cursor*.055*sin(ml*18.0-t*.85);

      vec2 a=vec2(-.58+sin(t*.09)*.18,.22+cos(t*.075)*.23);
      vec2 b=vec2(.52+cos(t*.071)*.20,-.08+sin(t*.10)*.28);
      vec2 d=vec2(.04+sin(t*.055)*.34,.54+cos(t*.083)*.14);
      float fa=exp(-dot(p-a,p-a)*2.65);
      float fb=exp(-dot(p-b,p-b)*3.05);
      float fd=exp(-dot(p-d,p-d)*3.45);
      float field=fa+fb*.92+fd*.82+q1*.30;

      float bands=abs(fract((field+p.x*.12-p.y*.08)*5.2)-.5);
      float contour=1.0-smoothstep(.462,.496,bands);
      float silk=pow(.5+.5*sin((p.x*1.45+p.y*.82+q2*3.9-tt*2.1)*3.14159),6.0);
      float glassRing=ring(length(md),.29,.026)+ring(length(md),.47,.020)*.45;

      float pd=length(p-cc*.66);
      float shock=0.0;
      if(pulse>=0.0){
        shock=ring(pd,pulse*.95,.035)*(1.0-clamp(pulse,0.0,1.0));
      }

      vec3 olive=vec3(.58,.70,.24);
      vec3 clay=vec3(.78,.39,.31);
      vec3 inkblue=vec3(.33,.39,.58);
      vec3 ochre=vec3(.86,.62,.30);
      vec3 graphite=vec3(.20,.20,.19);

      vec3 col=mix(olive,clay,clamp(q1*.66+fa*.30,0.0,1.0));
      col=mix(col,inkblue,fb*.18+q2*.08);
      col=mix(col,ochre,fd*.18+cursor*.14+shock*.48);
      col=mix(col,graphite,contour*.10);

      float alpha=.025+q1*.046+silk*.035+contour*.046+cursor*.045+glassRing*.032+shock*.12;
      gl_FragColor=vec4(col,alpha);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('stage145 shader compile failed', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) { canvas.remove(); lens.remove(); return; }

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); lens.remove(); return; }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const ur = gl.getUniformLocation(program, 'r');
  const um = gl.getUniformLocation(program, 'm');
  const uc = gl.getUniformLocation(program, 'c');
  const ut = gl.getUniformLocation(program, 't');
  const up = gl.getUniformLocation(program, 'pulse');

  let mx=.5,my=.36,tx=mx,ty=my,lx=mx,ly=1-my;
  let clickX=.5,clickY=.5,pulseStart=-1,frame=0,active=true;
  const start=performance.now();

  const resize=()=>{
    const rect=section.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,1.25);
    const w=Math.max(1,Math.round(rect.width*dpr));
    const h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w;
      canvas.height=h;
      gl.viewport(0,0,w,h);
    }
  };
  resize();
  const ro='ResizeObserver' in window?new ResizeObserver(resize):null;
  if(ro)ro.observe(section); else addEventListener('resize',resize,{passive:true});

  section.addEventListener('pointerenter',()=>section.classList.add('is-x145-active'),{passive:true});
  section.addEventListener('pointermove',(event)=>{
    const rect=section.getBoundingClientRect();
    tx=(event.clientX-rect.left)/Math.max(rect.width,1);
    ty=1-(event.clientY-rect.top)/Math.max(rect.height,1);
    section.style.setProperty('--x145-px',`${(tx*100).toFixed(2)}%`);
    section.style.setProperty('--x145-py',`${((1-ty)*100).toFixed(2)}%`);
  },{passive:true});
  section.addEventListener('pointerleave',()=>{
    section.classList.remove('is-x145-active');
    tx=.5;ty=.36;
  },{passive:true});
  section.addEventListener('pointerdown',(event)=>{
    const rect=section.getBoundingClientRect();
    clickX=(event.clientX-rect.left)/Math.max(rect.width,1);
    clickY=1-(event.clientY-rect.top)/Math.max(rect.height,1);
    pulseStart=performance.now();
  },{passive:true});

  const draw=(now)=>{
    if(!active){frame=0;return;}
    mx+=(tx-mx)*.032;
    my+=(ty-my)*.032;
    lx+=(tx-lx)*.075;
    ly+=((1-ty)-ly)*.075;
    lens.style.left=`${(lx*100).toFixed(3)}%`;
    lens.style.top=`${(ly*100).toFixed(3)}%`;

    const pulse=pulseStart<0?-1:Math.min(1,(now-pulseStart)/1100);
    if(pulse>=1)pulseStart=-1;

    gl.uniform2f(ur,canvas.width,canvas.height);
    gl.uniform2f(um,mx*canvas.width,my*canvas.height);
    gl.uniform2f(uc,clickX*canvas.width,clickY*canvas.height);
    gl.uniform1f(ut,(now-start)/1000);
    gl.uniform1f(up,pulse);
    gl.drawArrays(gl.TRIANGLES,0,6);
    frame=requestAnimationFrame(draw);
  };

  const io=new IntersectionObserver(([entry])=>{
    active=entry.isIntersecting&&!document.hidden;
    if(active&&!frame)frame=requestAnimationFrame(draw);
    if(!active&&frame){cancelAnimationFrame(frame);frame=0;}
  },{threshold:0});
  io.observe(section);

  document.addEventListener('visibilitychange',()=>{
    const rect=section.getBoundingClientRect();
    active=!document.hidden&&rect.bottom>0&&rect.top<innerHeight;
    if(active&&!frame)frame=requestAnimationFrame(draw);
    if(!active&&frame){cancelAnimationFrame(frame);frame=0;}
  });

  frame=requestAnimationFrame(draw);
})();
