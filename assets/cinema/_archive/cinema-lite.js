/* ═══════════════════════════════════════════════════════
   CINEMA-LITE — runtime perf overrides (loads LAST)
   SELECTIVE node removal. NO brute timer-clearing.
   The previous version nuked all setTimeouts which killed
   the cold-open dismiss + the typewriter + chapter reveal.
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const D = document;

  /* DISABLE custom cursor reticle (highest mousemove cost) */
  const ret  = D.querySelector('.cine-reticle');     if(ret)  ret.remove();
  const ring = D.querySelector('.cine-spot-ring');   if(ring) ring.remove();

  /* PIN spotlight to viewport center — kill the cursor-follow rAF
     by detaching the original node (clone has no listeners on it,
     but the original's rAF loop holds a ref so still fires; cheap
     since it writes to removed DOM and lerps to a fixed point). */
  const sp = D.querySelector('.cine-spotlight');
  if(sp){
    sp.style.setProperty('--sx', '50%');
    sp.style.setProperty('--sy', '50%');
    const clone = sp.cloneNode(true);
    sp.parentNode.replaceChild(clone, sp);
  }

  /* DROP DOM weight of reactor — its tick marks are pure decoration */
  D.querySelectorAll('.cine-reactor-tick').forEach(t=>t.remove());

  /* DROP heavy decorative panels on the homepage hero (paint cost) */
  // Keep top-row panels; drop the side ones that overlap content
  ['p5','p6'].forEach(c=>{
    const p = D.querySelector('.cine-panel.'+c);
    if(p) p.remove();
  });

  /* Note: boot log / uptime / panel-bar / telemetry intervals are LEFT
     alone. They fire once or twice a second on small DOM nodes — that's
     a few hundred microseconds of work per second, not the lag source.
     The real costs were: WebGL atmosphere (now half-rate),
     cursor reticle tracking (now removed), and reactor tick rotations
     (now removed). */
})();
