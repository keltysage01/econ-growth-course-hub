/* ═══════════════════════════════════════════════════════
   CINEMA-NUCLEAR — runtime perf rescue, loads LAST.
   Stops the WebGL shader rAF loop + removes heavy DOM.
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const D = document;

  /* Force-stop the atmosphere WebGL by removing its mount.
     Its IO observer + rAF loop check via display state, but
     removing the node halts the GPU work immediately. */
  const atmos = D.getElementById('cine-atmosphere');
  if(atmos) atmos.remove();

  /* Remove arc reactor + tick marks + rings (pure decoration) */
  D.querySelectorAll('.cine-reactor, .cine-reactor-tick').forEach(n=>n.remove());

  /* Remove visor + color-grade + spotlight + flare + center cross */
  ['.cine-visor','.cine-grade','.cine-spotlight','.cine-spot-ring',
   '.cine-vhs-scan','.cine-vhs-sweep','.cine-flare','.cine-center-cross']
    .forEach(sel=>{ const n = D.querySelector(sel); if(n) n.remove(); });

  /* Remove the 3 hero orbs + scanline (large blur filter cost) */
  ['.orb-1','.orb-2','.orb-3','.scanline'].forEach(sel=>{
    const n = D.querySelector(sel); if(n) n.remove();
  });

  /* Remove the noise overlay (body::before is a pseudo so CSS handled it) */

  /* Remove data panels + boot log */
  D.querySelectorAll('.cine-panel, .cine-bootlog').forEach(n=>n.remove());

  /* Remove the cursor reticle (in case cinema-lite already didn't catch it) */
  const ret = D.querySelector('.cine-reticle');   if(ret) ret.remove();
  const ring = D.querySelector('.cine-spot-ring'); if(ring) ring.remove();
})();
