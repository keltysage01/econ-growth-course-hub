/* ═══════════════════════════════════════════════════════
   CINEMA LAYER — controller
   Cold open · spotlight · chapters · color-grade · scenes
   Sound toggle · keymoments · full-stack pin
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const D = document;
  const W = window;
  const B = D.body;
  const REDUCED = W.matchMedia && W.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const TOUCH = W.matchMedia && W.matchMedia('(hover:none)').matches;
  const SESSION_KEY = 'cine_co_seen_v1';

  /* ─── COLD OPEN ─────────────────────────────────────── */
  function mountColdOpen(){
    if(REDUCED) return;
    // Force-show on localhost or when ?fresh= is in URL (dev/preview)
    const url = location.href;
    const isDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost' || /[?&]fresh=/.test(url);
    if(!isDev && sessionStorage.getItem(SESSION_KEY)) return;

    const el = D.createElement('div');
    el.id = 'cine-cold-open';
    el.innerHTML = `
      <div class="cine-co-scan"></div>
      <div class="cine-co-mark">
        <span>eC<span class="c">on</span></span>
        <span class="bar"></span>
        <span>Growth</span>
      </div>
      <div class="cine-co-tag"><span class="pulse"></span>AI Operating Systems · Now Loading</div>
      <button class="cine-co-skip" aria-label="Skip intro">Skip ▸</button>
    `;
    D.body.appendChild(el);
    D.body.classList.add('cine-cold-locked');

    const finish = () => {
      sessionStorage.setItem(SESSION_KEY, '1');
      el.classList.add('gone');
      D.body.classList.remove('cine-cold-locked');
      // Signal that the cold open is done — hero typewriter waits for this
      window.__cineColdDone = true;
      D.dispatchEvent(new Event('cine:cold:done'));
      setTimeout(()=>el.remove(), 1000);
      // Stage cinema layer after cold open is gone
      setTimeout(stageCinema, 350);
    };

    el.querySelector('.cine-co-skip').addEventListener('click', finish);
    // Auto-dismiss at 5s — gives the Pro boot animations time to complete
    setTimeout(finish, 5000);
    // Any key dismisses
    const keyHandler = (e) => {
      if(['Escape','Enter',' '].includes(e.key)) { finish(); D.removeEventListener('keydown', keyHandler); }
    };
    D.addEventListener('keydown', keyHandler);
  }

  /* ─── CURSOR SPOTLIGHT ──────────────────────────────── */
  function mountSpotlight(){
    if(TOUCH || REDUCED) return;
    const sp = D.createElement('div');
    sp.className = 'cine-spotlight';
    D.body.appendChild(sp);
    let tx = innerWidth/2, ty = innerHeight/2;
    let cx = tx, cy = ty;
    let raf = null;
    const tick = () => {
      // Exit if spotlight was detached (cinema-lite.js does this)
      if(!sp.isConnected){ raf = null; return; }
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      sp.style.setProperty('--sx', cx + 'px');
      sp.style.setProperty('--sy', cy + 'px');
      raf = requestAnimationFrame(tick);
    };
    W.addEventListener('mousemove', (e)=>{ tx = e.clientX; ty = e.clientY; }, {passive:true});
    setTimeout(()=>{ B.classList.add('cine-spot-on'); tick(); }, 200);
  }

  /* ─── COLOR-GRADE OVERLAY ───────────────────────────── */
  function mountGrade(){
    if(REDUCED) return;
    const g = D.createElement('div');
    g.className = 'cine-grade';
    D.body.appendChild(g);
    return g;
  }
  function setGrade(r,g,b,a){
    const root = D.documentElement.style;
    root.setProperty('--cine-grade-r', r);
    root.setProperty('--cine-grade-g', g);
    root.setProperty('--cine-grade-b', b);
    root.setProperty('--cine-grade-a', a);
  }

  /* ─── LETTERBOX ─────────────────────────────────────── */
  function mountLetterbox(){
    const t = D.createElement('div'); t.className = 'cine-letterbox top'; D.body.appendChild(t);
    const b = D.createElement('div'); b.className = 'cine-letterbox bot'; D.body.appendChild(b);
  }

  /* ─── CHAPTER MARKERS ───────────────────────────────── */
  function mountChapters(){
    // Discover chapters from sections with data-chapter
    const sections = [...D.querySelectorAll('[data-chapter]')];
    if(!sections.length) return;
    const nav = D.createElement('nav');
    nav.className = 'cine-chapters';
    nav.setAttribute('aria-label','Chapter markers');
    sections.forEach((sec, i)=>{
      const id = sec.id || ('chap-'+i);
      sec.id = id;
      const label = sec.getAttribute('data-chapter');
      const a = D.createElement('a');
      a.href = '#'+id;
      a.className = 'cine-chap';
      a.dataset.chap = id;
      a.innerHTML = `<span class="cine-chap-label">${String(i+1).padStart(2,'0')} · ${label}</span><span class="cine-chap-dot"></span>`;
      a.addEventListener('click',(e)=>{ e.preventDefault(); sec.scrollIntoView({behavior:'smooth',block:'start'}); });
      nav.appendChild(a);
    });
    D.body.appendChild(nav);
    setTimeout(()=>B.classList.add('cine-chapters-on'), 600);

    // Track active chapter via IO
    const links = [...nav.querySelectorAll('.cine-chap')];
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          const id = en.target.id;
          links.forEach(l=>l.classList.toggle('active', l.dataset.chap===id));
        }
      });
    }, {rootMargin:'-40% 0px -55% 0px', threshold:0});
    sections.forEach(s=>io.observe(s));
  }

  /* ─── SCENE REVEALS + GRADE-PER-SCENE + KEYMOMENTS ──── */
  function mountSceneObserver(){
    const scenes = D.querySelectorAll('.cine-scene, .cine-kt, [data-grade], [data-keymoment]');
    if(!scenes.length) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        const t = en.target;
        if(en.isIntersecting){
          t.classList.add('cine-in');
          // grade per section
          const g = t.dataset.grade;
          if(g){
            const [r,gg,b,a] = g.split(',').map(Number);
            setGrade(r,gg,b,a);
          }
          // keymoment closes letterbox bars
          if(t.dataset.keymoment !== undefined){
            B.classList.add('cine-keymoment');
            clearTimeout(t._kmTo);
            t._kmTo = setTimeout(()=>B.classList.remove('cine-keymoment'), 4200);
          }
        }
      });
    }, {rootMargin:'-12% 0px -12% 0px', threshold:0.12});
    scenes.forEach(s=>io.observe(s));
  }

  /* ─── KINETIC TYPOGRAPHY — wrap inner content in span ── */
  function prepareKinetic(){
    D.querySelectorAll('.cine-kt').forEach(el=>{
      if(el.dataset.cineKtReady) return;
      const txt = el.innerHTML.trim();
      el.innerHTML = '<span>'+txt+'</span>';
      el.dataset.cineKtReady = '1';
    });
  }

  /* ─── FULL-STACK STICKY CINEMATOGRAPHY ──────────────── */
  function mountFullStackPin(){
    const sec = D.querySelector('.fullstack-sec');
    if(!sec || REDUCED) return;
    // Skip on mobile (handled via CSS)
    if(innerWidth < 760) return;

    // Replace the existing fullstack row with a cinematic pinned scene
    const inner = sec.querySelector('.section-inner');
    if(!inner) return;
    const existingRow = sec.querySelector('.fullstack-row');
    if(!existingRow) return;

    // Hide original row, append cinematic version
    existingRow.style.display = 'none';

    const cine = D.createElement('div');
    cine.className = 'fullstack-cine';
    cine.innerHTML = `
      <div class="fullstack-cine-pin">
        <div class="fullstack-cine-stage">
          <div class="fullstack-cine-eyebrow">The Full Stack</div>
          <h3 class="fullstack-cine-h">MOST COMPANIES SELL YOU ONE.<br>WE BUILD <span class="green">ALL THREE.</span></h3>
          <div class="fs-cine-pillars" id="fsCinePillars">
            <div class="fs-cine-pillar" data-step="0"><span class="n">01</span><div class="t">Operations</div><div class="d">The system runs the business.</div></div>
            <div class="fs-cine-op" data-step="1">+</div>
            <div class="fs-cine-pillar" data-step="1"><span class="n">02</span><div class="t">Marketing</div><div class="d">Growth that compounds.</div></div>
            <div class="fs-cine-op" data-step="2">+</div>
            <div class="fs-cine-pillar" data-step="2"><span class="n">03</span><div class="t">Financial</div><div class="d">Structure that holds.</div></div>
            <div class="fs-cine-op" data-step="3">=</div>
            <div class="fs-cine-pillar result" data-step="3"><span class="n">∞</span><div class="t">Leverage</div><div class="d">A business that runs — and is worth selling.</div></div>
          </div>
          <div class="fs-cine-finale" id="fsCineFinale">∞ LEVERAGE<span class="sub">The Full Stack, Installed.</span></div>
        </div>
      </div>
    `;
    inner.parentNode.insertBefore(cine, inner.nextSibling);

    const pillars = [...cine.querySelectorAll('[data-step]')];
    const finale = cine.querySelector('#fsCineFinale');
    const pin = cine.querySelector('.fullstack-cine-pin');
    sec.classList.add('cine-pinned');

    // JS-driven pinning (overflow:hidden on body kills position:sticky)
    const onScroll = () => {
      const rect = cine.getBoundingClientRect();
      const h = cine.offsetHeight;
      const winH = innerHeight;
      const cineTop = rect.top;
      const cineBottom = rect.bottom;

      // Three states: before / pinned / after
      if(cineTop > 0){
        pin.classList.remove('is-fixed','is-bottom');
      } else if(cineBottom > winH){
        pin.classList.add('is-fixed');
        pin.classList.remove('is-bottom');
      } else {
        pin.classList.remove('is-fixed');
        pin.classList.add('is-bottom');
      }

      // progress: 0 when pin starts, 1 when pin ends
      const p = Math.max(0, Math.min(1, (-cineTop) / (h - winH)));
      // step 0 → 1 → 2 → 3 → finale
      const step = Math.floor(p * 4.4);
      pillars.forEach(el=>{
        const s = +el.dataset.step;
        el.classList.toggle('live', step >= s);
        el.classList.toggle('spot', step === s);
      });
      // Finale reveal in the last 18%
      finale.classList.toggle('live', p > 0.82);
      // Hide pillars when finale fully in
      pillars.forEach(el=>{ el.style.opacity = (p > 0.92) ? '0' : ''; });
    };
    W.addEventListener('scroll', onScroll, {passive:true});
    W.addEventListener('resize', onScroll, {passive:true});
    onScroll();
  }

  /* ─── LENS FLARE in hero ────────────────────────────── */
  function mountFlare(){
    if(REDUCED) return;
    const hero = D.querySelector('.hero');
    if(!hero) return;
    const f = D.createElement('div');
    f.className = 'cine-flare';
    f.style.top = '18%';
    f.style.right = '12%';
    hero.appendChild(f);
  }

  /* ─── SOUND TOGGLE (off by default; localStorage-sticky) */
  function mountSound(){
    const btn = D.createElement('button');
    btn.className = 'cine-sound';
    btn.setAttribute('aria-label','Toggle ambient sound');
    btn.innerHTML = svgOff();
    D.body.appendChild(btn);
    let on = false;
    let audio = null;
    const ensureAudio = () => {
      if(audio) return audio;
      // Ambient layer: minimal Web Audio drone (no external file needed)
      try {
        const ctx = new (W.AudioContext||W.webkitAudioContext)();
        const master = ctx.createGain();
        master.gain.value = 0.0;
        master.connect(ctx.destination);
        // Two soft oscillators in a fifth — sub-audible pad
        const o1 = ctx.createOscillator(); o1.type='sine'; o1.frequency.value=110;
        const o2 = ctx.createOscillator(); o2.type='sine'; o2.frequency.value=164.81;
        const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=520;
        const g1 = ctx.createGain(); g1.gain.value=0.18;
        const g2 = ctx.createGain(); g2.gain.value=0.12;
        o1.connect(g1); o2.connect(g2);
        g1.connect(f); g2.connect(f); f.connect(master);
        o1.start(); o2.start();
        // Slow LFO on filter for movement
        const lfo = ctx.createOscillator(); lfo.frequency.value=0.07;
        const lfoG = ctx.createGain(); lfoG.gain.value=120;
        lfo.connect(lfoG); lfoG.connect(f.frequency); lfo.start();
        audio = { ctx, master };
      } catch(e){ audio = false; }
      return audio;
    };
    btn.addEventListener('click', ()=>{
      on = !on;
      btn.classList.toggle('on', on);
      btn.innerHTML = on ? svgOn() : svgOff();
      const a = ensureAudio();
      if(!a) return;
      if(a.ctx.state === 'suspended') a.ctx.resume();
      // Fade
      const now = a.ctx.currentTime;
      a.master.gain.cancelScheduledValues(now);
      a.master.gain.setValueAtTime(a.master.gain.value, now);
      a.master.gain.linearRampToValueAtTime(on ? 0.06 : 0.0, now + 1.2);
    });
    function svgOff(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'; }
    function svgOn(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'; }
  }

  /* ─── STAGING — after cold open ─────────────────────── */
  function stageCinema(){
    // Pop hero atmosphere to live
    const a = D.getElementById('cine-atmosphere');
    if(a) a.classList.add('live');
    // Trigger hero kinetic typography
    D.querySelectorAll('.hero .cine-kt').forEach(el=>el.classList.add('cine-in'));
  }

  /* ─── BOOT ──────────────────────────────────────────── */
  function boot(){
    prepareKinetic();
    mountLetterbox();
    mountGrade();
    mountSpotlight();
    mountChapters();
    mountFlare();
    mountSound();
    mountFullStackPin();
    mountSceneObserver();
    mountColdOpen();
    // If cold open already seen (or reduced-motion / non-dev), stage immediately
    // and tell the typewriter it can start now.
    const url = location.href;
    const isDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost' || /[?&]fresh=/.test(url);
    if((!isDev && sessionStorage.getItem(SESSION_KEY)) || REDUCED){
      window.__cineColdDone = true;
      D.dispatchEvent(new Event('cine:cold:done'));
      setTimeout(stageCinema, 60);
    }
  }

  if(D.readyState === 'loading'){
    D.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
