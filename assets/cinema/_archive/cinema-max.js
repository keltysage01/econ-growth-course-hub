/* ═══════════════════════════════════════════════════════
   CINEMA-MAX — Iron Man Jarvis layer
   Lock-on targeting · arc reactor · data panels · richer reticle
   Layers on top of cinema.js + cinema-pro.js ═══════════ */
(function(){
  'use strict';
  const D = document, W = window, B = D.body;
  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const TOUCH = matchMedia('(hover:none)').matches;

  /* ─── ENHANCE RETICLE ───────────────────────────────── */
  function enhanceReticle(){
    if(TOUCH || REDUCED) return;
    const r = D.querySelector('.cine-reticle');
    if(!r) return;
    // Outer ring
    const ring2 = D.createElement('div'); ring2.className = 'cine-reticle-ring2';
    r.appendChild(ring2);
    // 4 directional tick marks
    for(let i=0;i<4;i++){
      const t = D.createElement('div'); t.className='cine-reticle-tick';
      r.appendChild(t);
    }
    // Readout text
    const ro = D.createElement('div');
    ro.className = 'cine-reticle-readout';
    ro.textContent = 'LOCK ▸';
    r.appendChild(ro);
  }

  /* ─── LOCK-ON TARGETING ─────────────────────────────── */
  function mountLockOn(){
    if(TOUCH || REDUCED) return;
    const lock = D.createElement('div');
    lock.className = 'cine-lock';
    lock.innerHTML = `
      <div class="cine-lock-corner tl"></div>
      <div class="cine-lock-corner tr"></div>
      <div class="cine-lock-corner bl"></div>
      <div class="cine-lock-corner br"></div>
      <div class="cine-lock-label"><span class="dot"></span><span class="cine-lock-text">TARGET</span></div>
      <div class="cine-lock-coord"></div>
    `;
    D.body.appendChild(lock);
    const label = lock.querySelector('.cine-lock-text');
    const coord = lock.querySelector('.cine-lock-coord');

    const selectorTargets = 'a, button, .svc-card, .fs-cine-pillar, .qualify-item, .faq-q, .founders-cta, .cta-card, .hero-h1, .section-h2, .nav-cta, .nav-cta-desk, .btn-primary, .btn-ghost';

    let cur = null;
    let rafId = 0;

    // Position once per call — no recursive rAF (perf)
    const fit = () => {
      if(!cur || !cur.isConnected){ lock.classList.remove('live'); return; }
      const r = cur.getBoundingClientRect();
      const pad = 6;
      lock.style.left = (r.left - pad) + 'px';
      lock.style.top  = (r.top  - pad) + 'px';
      lock.style.width  = (r.width  + pad*2) + 'px';
      lock.style.height = (r.height + pad*2) + 'px';
      coord.textContent = `[${Math.round(r.left)},${Math.round(r.top)}] · ${Math.round(r.width)}×${Math.round(r.height)}`;
    };

    const lockOn = (el) => {
      if(el === cur) return;
      cur = el;
      // Label from element
      let txt = 'TARGET';
      if(el.matches('a.nav-cta-desk, a.nav-cta, button')) txt = 'ACTION';
      else if(el.matches('.btn-primary')) txt = 'PRIMARY ACTION';
      else if(el.matches('.btn-ghost')) txt = 'SECONDARY';
      else if(el.matches('.svc-card')) txt = 'SERVICE';
      else if(el.matches('.fs-cine-pillar')) txt = 'PILLAR';
      else if(el.matches('.qualify-item')) txt = 'QUALIFIER';
      else if(el.matches('.faq-q')) txt = 'QUERY';
      else if(el.matches('.hero-h1, .section-h2')) txt = 'HEADLINE';
      else if(el.matches('a')) txt = 'LINK';
      label.textContent = txt + ' ▸ ACQUIRED';
      lock.classList.remove('live');
      // Reflow to restart animation
      void lock.offsetWidth;
      lock.classList.add('live');
      fit();
    };
    const lockOff = () => {
      cur = null;
      lock.classList.remove('live');
    };

    // Throttle mousemove via rAF (one update per frame max)
    let mmRaf = 0, lastEv = null;
    W.addEventListener('mousemove', (e)=>{
      lastEv = e;
      if(mmRaf) return;
      mmRaf = requestAnimationFrame(()=>{
        mmRaf = 0;
        const e2 = lastEv;
        const t = e2.target && e2.target.closest ? e2.target.closest(selectorTargets) : null;
        if(t){ lockOn(t); fit(); }
        else lockOff();
      });
    }, {passive:true});
    W.addEventListener('mouseleave', lockOff);
    // On scroll, refit if locked (already throttled by browser scroll throttling)
    W.addEventListener('scroll', ()=>{ if(cur) fit(); }, {passive:true});
  }

  /* ─── ARC REACTOR + DATA PANELS in hero ─────────────── */
  function mountReactor(){
    if(REDUCED) return;
    const hero = D.querySelector('.hero');
    if(!hero) return;
    if(hero.querySelector('.cine-reactor')) return;

    const reactor = D.createElement('div');
    reactor.className = 'cine-reactor';
    reactor.innerHTML = `
      <div class="cine-reactor-ring"></div>
      <div class="cine-reactor-ring r2"></div>
      <div class="cine-reactor-ring r3"></div>
      <div class="cine-reactor-ring r4"></div>
      <div class="cine-reactor-core"></div>
    `;
    // Tick marks around the outermost ring
    const outer = reactor.querySelector('.cine-reactor-ring');
    for(let i=0;i<24;i++){
      const t = D.createElement('div');
      t.className = 'cine-reactor-tick';
      t.style.transform = `rotate(${i*15}deg)`;
      outer.appendChild(t);
    }
    hero.appendChild(reactor);

    // Data panels — only on homepage hero (detect via the hero-h1 typewriter)
    const isHomepage = !!D.getElementById('typeHead');
    if(!isHomepage) return;
    const panels = [
      { c:'p1', lbl:'Operations',   val:'<span class="c">ONLINE</span>', barW:'94%' },
      { c:'p2', lbl:'Marketing',    val:'<span class="c">COMPOUNDING</span>', barW:'82%' },
      { c:'p3', lbl:'Financial',    val:'<span class="c">STRUCTURED</span>', barW:'88%' },
      { c:'p4', lbl:'Claude · Anthropic', val:'API <span class="c">/v1</span>', barW:'99%' },
      { c:'p5', lbl:'Stack', val:'<span class="c">3</span> / 3', barW:'100%' },
      { c:'p6', lbl:'Leverage', val:'<span class="c">∞</span>', barW:'100%' },
    ];
    panels.forEach((p,i)=>{
      const el = D.createElement('div');
      el.className = `cine-panel ${p.c}`;
      el.innerHTML = `<span class="lbl">${p.lbl}</span><span class="val">${p.val}</span><span class="bar" style="--w:${p.barW}"></span>`;
      hero.appendChild(el);
      setTimeout(()=>el.classList.add('live'), 1400 + i*180);
    });
  }

  /* ─── BOOT ──────────────────────────────────────────── */
  function boot(){
    enhanceReticle();
    mountLockOn();
    mountReactor();
  }
  if(D.readyState === 'loading'){
    D.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
