/* ═══════════════════════════════════════════════════════
   ATMOSPHERE — WebGL fragment-shader gradient mesh
   Lightweight (no Three.js). Single fullscreen quad
   running a smooth animated noise-based color field.
   Mounts at #cine-atmosphere inside .hero
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(REDUCED) return;

  const mount = document.getElementById('cine-atmosphere');
  if(!mount) return;
  const canvas = document.createElement('canvas');
  mount.appendChild(canvas);
  const gl = canvas.getContext('webgl', {premultipliedAlpha:false, alpha:true, antialias:false});
  if(!gl) { mount.style.display='none'; return; }

  const VS = `
    attribute vec2 a;
    void main(){ gl_Position = vec4(a, 0.0, 1.0); }
  `;

  // Fragment: STARK HOLOGRAM — radial energy field + flowing data lines
  // Brand green + cyan accents over deep black. Iron Man HUD aesthetic.
  const FS = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_t;

    // Hash + noise
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      float a = hash(i);
      float b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0));
      float d = hash(i + vec2(1.0,1.0));
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0; float a = 0.5;
      for(int i=0;i<3;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
      return v;
    }

    void main(){
      vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
      float t = u_t * 0.08;
      float r = length(uv);
      float ang = atan(uv.y, uv.x);

      // Base dark
      vec3 c0 = vec3(0.020, 0.030, 0.045);
      vec3 c1 = vec3(0.030, 0.045, 0.062);
      // Brand green
      vec3 cG = vec3(0.129, 0.902, 0.541);
      // Cyan accent
      vec3 cC = vec3(0.200, 0.820, 0.940);
      // Deep teal
      vec3 cT = vec3(0.043, 0.118, 0.137);

      // Domain-warped fbm field for organic motion
      vec2 q = vec2(fbm(uv*1.4 + vec2(0.0,t)), fbm(uv*1.4 + vec2(5.2,1.3-t)));
      vec2 rv = vec2(fbm(uv*1.4 + 3.0*q + vec2(1.7+t, 9.2)),
                     fbm(uv*1.4 + 3.0*q + vec2(8.3, 2.8-t)));
      float f = fbm(uv*1.4 + 4.0*rv);

      vec3 col = mix(c0, c1, f);
      col = mix(col, cT, smoothstep(0.45, 0.85, f) * 0.65);

      // STARK PULSE — concentric energy rings emanating outward
      float ringW = 0.014;
      float ring1 = abs(sin((r - u_t*0.16) * 18.0));
      ring1 = smoothstep(1.0 - ringW*40.0, 1.0, ring1);
      col += cG * ring1 * 0.22 * smoothstep(1.6, 0.2, r);

      // Slower secondary ring
      float ring2 = abs(sin((r - u_t*0.10) * 9.0));
      ring2 = smoothstep(1.0 - 0.04, 1.0, ring2);
      col += cC * ring2 * 0.10 * smoothstep(2.0, 0.4, r);

      // Radial sweep — rotating arc of light
      float sweep = mod(ang + u_t*0.4, 6.2831);
      float arc = smoothstep(0.55, 0.0, sweep) * smoothstep(1.4, 0.3, r);
      col += cG * arc * 0.18;

      // Horizontal data lines — flowing bars at varying speeds
      float bar = 0.0;
      bar += smoothstep(0.98, 1.0, sin(uv.y*22.0 + u_t*0.6));
      bar += smoothstep(0.98, 1.0, sin(uv.y*46.0 - u_t*0.9)) * 0.7;
      bar += smoothstep(0.99, 1.0, sin(uv.y*88.0 + u_t*0.3)) * 0.4;
      col += cG * bar * 0.06;

      // Vertical thin grid lines (HUD)
      float gridX = step(0.985, fract(uv.x*16.0 + 0.5));
      col += cG * gridX * 0.025;

      // Bright hotspots from warp
      float hot = smoothstep(0.78, 0.98, length(rv));
      col += mix(cG, cC, 0.5) * hot * 0.30;

      // Vignette
      float vig = smoothstep(1.4, 0.3, r);
      col *= 0.55 + 0.55*vig;

      // Grain
      float g = (hash(gl_FragCoord.xy + u_t) - 0.5) * 0.025;
      col += g;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(src, type){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
      console.warn('shader', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(VS, gl.VERTEX_SHADER);
  const fs = compile(FS, gl.FRAGMENT_SHADER);
  if(!vs || !fs){ mount.style.display='none'; return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){ mount.style.display='none'; return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog,'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog,'u_res');
  const uT   = gl.getUniformLocation(prog,'u_t');

  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  function size(){
    const r = mount.getBoundingClientRect();
    canvas.width = Math.max(2, Math.floor(r.width  * dpr));
    canvas.height= Math.max(2, Math.floor(r.height * dpr));
    canvas.style.width  = r.width  + 'px';
    canvas.style.height = r.height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  size();
  addEventListener('resize', size);

  let running = true;
  let t0 = performance.now();
  // Pause when offscreen (perf)
  const io = new IntersectionObserver(([e])=>{ running = e.isIntersecting; if(running) t0 = performance.now() - lastT*1000; loop(); }, {threshold:0});
  io.observe(mount);

  let lastT = 0;
  let frame = 0;
  // Throttle to ~30fps (skip every other frame)
  function loop(){
    if(!running) return;
    frame++;
    if(frame % 2 === 0){
      const t = (performance.now() - t0) / 1000;
      lastT = t;
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(loop);
  }
  loop();
})();
