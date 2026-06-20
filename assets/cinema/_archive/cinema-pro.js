/* ═══════════════════════════════════════════════════════
   CINEMA-PRO — HUD overlay · custom cursor · boot log
   Section scanlines · glitch hover · supercharged cold open
   Layers on top of cinema.js ═══════════════════════════ */
(function(){
  'use strict';
  const D = document, W = window, B = D.body;
  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const TOUCH = matchMedia('(hover:none)').matches;
  const COLD_KEY = 'cine_co_seen_v1';

  /* ─── HUD frame — corner brackets + readouts ────────── */
  function mountHUD(){
    const hud = D.createElement('div');
    hud.className = 'cine-hud';
    hud.innerHTML = `
      <div class="cine-hud-bracket tl"></div>
      <div class="cine-hud-bracket tr"></div>
      <div class="cine-hud-bracket bl"></div>
      <div class="cine-hud-bracket br"></div>
      <div class="cine-hud-readout tl"><span class="dot"></span><span>SYS://eCon.OS</span></div>
      <div class="cine-hud-readout tr"><span>REC ●</span><span class="sep">·</span><span id="cineHudTime">--:--:--</span></div>
      <div class="cine-hud-readout bl"><span>NODE</span><span class="sep">·</span><span id="cineHudNode">claude-opus-4-7</span></div>
      <div class="cine-hud-readout br"><span>SECTION</span><span class="sep">·</span><span id="cineHudSection">—</span><span class="dot"></span></div>
      <div class="cine-vhs-scan"></div>
      <div class="cine-vhs-sweep"></div>
    `;
    D.body.appendChild(hud);
    // Vhs-scan + sweep are inside .cine-hud — but the body class controls them; for that they must be siblings of body, so promote:
    D.body.appendChild(hud.querySelector('.cine-vhs-scan'));
    D.body.appendChild(hud.querySelector('.cine-vhs-sweep'));

    // Live clock
    const time = D.getElementById('cineHudTime');
    const tick = () => {
      const d = new Date();
      const z = n => String(n).padStart(2,'0');
      time.textContent = `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
    };
    tick(); setInterval(tick, 1000);

    // Section tracker — observes [data-chapter]
    const sectionEl = D.getElementById('cineHudSection');
    const secs = [...D.querySelectorAll('[data-chapter]')];
    if(secs.length){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(en=>{
          if(en.isIntersecting){
            sectionEl.textContent = (en.target.getAttribute('data-chapter')||'—').toUpperCase();
          }
        });
      }, {rootMargin:'-40% 0px -55% 0px'});
      secs.forEach(s=>io.observe(s));
    } else {
      sectionEl.textContent = 'MAIN';
    }

    // Nav telemetry — counter
    const nav = D.querySelector('.nav');
    if(nav){
      const t = D.createElement('div');
      t.className = 'cine-nav-telemetry';
      t.innerHTML = `<span class="pulse"></span><span>online</span>`;
      // Insert before CTA
      const cta = nav.querySelector('.nav-cta-desk') || nav.querySelector('.nav-cta');
      if(cta) cta.parentElement.insertBefore(t, cta);
    }

    setTimeout(()=>B.classList.add('cine-hud-on'), 200);
  }

  /* ─── CUSTOM CURSOR — green reticle ─────────────────── */
  function mountCursor(){
    if(TOUCH || REDUCED) return;
    const r = D.createElement('div');
    r.className = 'cine-reticle';
    r.innerHTML = '<div class="cine-reticle-cross"></div>';
    D.body.appendChild(r);

    // Trailing ring
    const ring = D.createElement('div');
    ring.className = 'cine-spot-ring';
    D.body.appendChild(ring);

    let tx = innerWidth/2, ty = innerHeight/2;
    let rx = tx, ry = ty;
    W.addEventListener('mousemove', (e)=>{
      tx = e.clientX; ty = e.clientY;
      r.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
    }, {passive:true});
    const tick = () => {
      // Exit if reticle ring was detached (cinema-lite.js does this)
      if(!ring.isConnected){ return; }
      rx += (tx - rx) * 0.10;
      ry += (ty - ry) * 0.10;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    // Hover state — when over interactive element
    const interactive = 'a, button, input, select, textarea, [role="button"], .svc-card, .fs-cine-pillar';
    W.addEventListener('mouseover', (e)=>{
      if(e.target && e.target.closest && e.target.closest(interactive)) r.classList.add('hover');
      else r.classList.remove('hover');
    });
    W.addEventListener('mousedown', ()=>r.classList.add('click'));
    W.addEventListener('mouseup',   ()=>r.classList.remove('click'));
    // Hide when leaving window
    W.addEventListener('mouseleave', ()=>{ r.style.opacity = '0'; ring.style.opacity = '0'; });
    W.addEventListener('mouseenter', ()=>{ r.style.opacity = ''; ring.style.opacity = ''; });
  }

  /* ─── BOOT LOG STREAM ───────────────────────────────── */
  function mountBootLog(){
    if(REDUCED) return;
    const log = D.createElement('div');
    log.className = 'cine-bootlog';
    D.body.appendChild(log);

    const LINES = [
      ['OPERATIONS','module loaded'],
      ['MARKETING','module loaded'],
      ['FINANCIAL','module loaded'],
      ['CLAUDE','client online'],
      ['GROWTH STACK','initialized'],
      ['ROUTING','umbrella → product'],
      ['SCHEMA','organization · website · product'],
      ['LLMS.TXT','served'],
      ['ANTHROPIC','api/v1 reachable'],
      ['HUD','engaged'],
      ['SPOTLIGHT','tracking pointer'],
      ['CHAPTERS','9 markers active'],
      ['SESSION','authenticated'],
      ['SCALE','infinite leverage projected'],
    ];
    let i = 0;
    const ts = () => {
      const d = new Date(); const z = n => String(n).padStart(2,'0');
      return `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
    };
    const push = () => {
      const [tag, msg] = LINES[i % LINES.length];
      const row = D.createElement('div');
      row.innerHTML = `<span class="ts">${ts()}</span>[${tag}] ${msg} <span class="ok">✓</span>`;
      log.appendChild(row);
      // Cap rows
      while(log.children.length > 12) log.removeChild(log.firstChild);
      i++;
    };
    // Burst initial lines
    let burst = 0;
    const b = setInterval(()=>{ push(); if(++burst>=6){ clearInterval(b); setInterval(push, 2400); } }, 220);
  }

  /* ─── COLD OPEN (PRO) — multi-beat HUD boot ─────────── */
  function upgradeColdOpen(){
    if(REDUCED) return;
    // Wait until cinema.js mounts its cold open
    const tryUpgrade = () => {
      const co = D.getElementById('cine-cold-open');
      if(!co){
        if(sessionStorage.getItem(COLD_KEY)) return; // already done
        return setTimeout(tryUpgrade, 30);
      }
      // Patch in HUD content + extend duration
      co.classList.add('cine-pro');
      const ring1 = D.createElement('div'); ring1.className='cine-co-ring';
      const ring2 = D.createElement('div'); ring2.className='cine-co-ring inner';
      const cH = D.createElement('div'); cH.className='cine-co-cross h';
      const cV = D.createElement('div'); cV.className='cine-co-cross v';
      const bootL = D.createElement('div'); bootL.className='cine-co-boot cine-co-boot-l';
      bootL.innerHTML = `
        <div>SYS://eCon.OS · BOOT v2026.05</div>
        <div>[OK] OPERATIONS engine — online</div>
        <div>[OK] MARKETING engine — online</div>
        <div>[OK] FINANCIAL engine — online</div>
        <div>[OK] CLAUDE · anthropic.api/v1</div>
        <div>[OK] GROWTH STACK ready</div>
      `;
      const bootR = D.createElement('div'); bootR.className='cine-co-boot cine-co-boot-r';
      bootR.innerHTML = `
        <div>NODE · claude-opus-4-7</div>
        <div>SESSION · authenticated</div>
        <div>SECTOR · serious operators</div>
        <div>MODE · install mode</div>
      `;
      co.appendChild(ring1);
      co.appendChild(ring2);
      co.appendChild(cH);
      co.appendChild(cV);
      co.appendChild(bootL);
      co.appendChild(bootR);

      // Note: cinema.js now sets a 5s dismiss timer, which gives the
      // Pro boot animations time to fully resolve. No mutation observer
      // hijack needed (previous version caused a visible flicker at 2.4s).
    };
    tryUpgrade();
  }

  /* ─── SECTION SCAN-LINE ENTRANCE ────────────────────── */
  function mountSectionScans(){
    if(REDUCED) return;
    const secs = D.querySelectorAll('section[data-chapter]');
    secs.forEach(sec=>{
      // Inject the scan-line into each section once
      if(sec.querySelector('.cine-section-scan')) return;
      const s = D.createElement('div');
      s.className = 'cine-section-scan';
      // Ensure section is positioned
      const cs = getComputedStyle(sec);
      if(cs.position === 'static') sec.style.position = 'relative';
      sec.appendChild(s);
    });
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          en.target.classList.add('cine-scanning');
          setTimeout(()=>en.target.classList.remove('cine-scanning'), 1500);
          io.unobserve(en.target);
        }
      });
    }, {rootMargin:'-15% 0px -15% 0px', threshold:0.1});
    secs.forEach(s=>io.observe(s));
  }

  /* ─── GLITCH HOVER — apply to nav links + primary buttons */
  function mountGlitch(){
    if(REDUCED) return;
    D.querySelectorAll('.nav-cta-desk, .nav-cta, .btn-primary, .nav-links a').forEach(el=>{
      if(el.dataset.cineGlitch) return;
      el.dataset.cineGlitch = '1';
      el.classList.add('cine-glitch');
    });
  }

  /* ─── BOOT ──────────────────────────────────────────── */
  function boot(){
    upgradeColdOpen();
    mountHUD();
    mountCursor();
    mountBootLog();
    mountSectionScans();
    mountGlitch();
  }

  if(D.readyState === 'loading'){
    D.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
