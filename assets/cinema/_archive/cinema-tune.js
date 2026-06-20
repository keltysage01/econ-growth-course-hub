/* ═══════════════════════════════════════════════════════
   CINEMA-TUNE — readability + alive-HUD pass
   Visor curvature, center crosshair, top status bar,
   ticking data values, animated panel numbers.
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const D = document, W = window, B = D.body;
  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const TOUCH = matchMedia('(hover:none)').matches;

  /* ─── VISOR + CENTER CROSSHAIR + STATUS BAR ─────────── */
  function mountVisorAndStatus(){
    if(REDUCED) return;
    // Visor curvature
    const v = D.createElement('div');
    v.className = 'cine-visor';
    D.body.appendChild(v);

    // Center crosshair
    const cc = D.createElement('div');
    cc.className = 'cine-center-cross';
    cc.innerHTML = '<div class="dot"></div>';
    D.body.appendChild(cc);

    // Top-center status bar
    const s = D.createElement('div');
    s.className = 'cine-hud-status';
    s.innerHTML = `
      <span class="pip"></span>
      <span>SYSTEM</span><span class="grn" id="cineStatSys">ONLINE</span>
      <span class="sep">·</span>
      <span>STACK</span><span class="grn" id="cineStatStack">3 / 3</span>
      <span class="sep">·</span>
      <span>UPTIME</span><span class="grn" id="cineStatUp">00:00:00</span>
      <span class="sep">·</span>
      <span>API</span><span class="grn" id="cineStatApi">v1 ✓</span>
    `;
    D.body.appendChild(s);

    // Live uptime
    const up = D.getElementById('cineStatUp');
    const t0 = Date.now();
    setInterval(()=>{
      const ms = Date.now() - t0;
      const s = Math.floor(ms/1000);
      const z = n=>String(n).padStart(2,'0');
      up.textContent = `${z(Math.floor(s/3600))}:${z(Math.floor((s%3600)/60))}:${z(s%60)}`;
    }, 500);
  }

  /* ─── TICKING DATA in panels ────────────────────────── */
  function tickPanels(){
    if(REDUCED) return;
    const panels = D.querySelectorAll('.cine-panel');
    if(!panels.length) return;
    panels.forEach((p)=>{
      const bar = p.querySelector('.bar');
      if(!bar) return;
      const base = parseFloat(getComputedStyle(bar).getPropertyValue('--w')) || 80;
      // Animate the bar width subtly +/- 4%
      let t = Math.random()*Math.PI*2;
      setInterval(()=>{
        t += 0.06;
        const w = Math.max(0, Math.min(100, base + Math.sin(t)*3));
        bar.style.setProperty('--w', w.toFixed(1)+'%');
      }, 220);
    });
  }

  /* ─── RANDOM TELEMETRY TICK on top-right HUD readout ── */
  function liveTelemetry(){
    // Replace the static time field with a richer telemetry tick
    const tr = D.querySelector('.cine-hud-readout.tr');
    if(!tr) return;
    // Insert a "LATENCY" + ms ping value before time
    const span = D.createElement('span');
    span.style.color = 'rgba(234,240,255,.55)';
    span.style.marginRight = '6px';
    span.innerHTML = '<span style="color:rgba(33,230,138,.7)">▲</span> <span id="cinePing">12ms</span>';
    tr.insertBefore(span, tr.firstChild);
    setInterval(()=>{
      const v = 8 + Math.floor(Math.random()*24);
      const p = D.getElementById('cinePing');
      if(p) p.textContent = v + 'ms';
    }, 1400);
  }

  /* ─── BOOT ──────────────────────────────────────────── */
  function boot(){
    mountVisorAndStatus();
    tickPanels();
    liveTelemetry();
  }
  if(D.readyState === 'loading'){
    D.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
