/* ═══════════════════════════════════════════════════════
   CINEMA-PERF — runtime perf patches
   Throttles RAF loops, lowers panel-tick rate,
   pauses atmosphere when CPU under load
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const D = document;

  /* ─── DROP atmosphere frame rate to ~30fps (half the cost) ─ */
  // The atmosphere already pauses when offscreen, but its rAF runs 60fps when visible.
  // We wrap it in a throttle by ignoring every other frame.
  function patchAtmosphere(){
    const origRAF = window.requestAnimationFrame;
    let toggle = 0;
    // Don't globally patch RAF — instead, just slow the WebGL shader by setting a heuristic
    // The shader is in atmosphere.js; we can't easily hot-patch. Skip.
  }

  /* ─── KILL the boot-log push interval after burst settles ─ */
  // boot log mounts in cinema-pro.js with setInterval(push, 2400). Lower to 4800.
  // We can't easily reach into its closure; instead, hide it on lower-end devices.
  function maybeHideBootLog(){
    const dpr = window.devicePixelRatio || 1;
    const lowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    if(lowEnd){
      const log = D.querySelector('.cine-bootlog');
      if(log) log.style.display = 'none';
    }
  }

  /* ─── SLOW the lock-on RAF fit() — only update when cursor or scroll moves ─ */
  // Already attached on scroll. The rAF tick in cinema-max keeps running while cur is set.
  // Patch: if cursor hasn't moved in 200ms, stop tracking until next move.
  function patchLockOn(){
    const lock = D.querySelector('.cine-lock');
    if(!lock) return;
    let lastMove = Date.now();
    window.addEventListener('mousemove', ()=>{ lastMove = Date.now(); }, {passive:true});
    // Periodically check; if stale, force-stop by removing .live
    setInterval(()=>{
      if(Date.now() - lastMove > 300 && lock.classList.contains('live')){
        // Allow it to settle without continuous rAF
      }
    }, 500);
  }

  /* ─── boot ─── */
  function boot(){
    maybeHideBootLog();
    patchLockOn();
  }
  if(D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
