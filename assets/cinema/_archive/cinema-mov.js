/* ═══════════════════════════════════════════════════════
   CINEMA-MOV — controller for the big movie effects
   Title-card drops on section entry, headline construct,
   white flash on keymoments, brief green wipe transitions
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const D = document, W = window, B = D.body;
  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ─── TITLE-CARD DROPS ──────────────────────────────── */
  function mountTitleCards(){
    if(REDUCED) return;
    const card = D.createElement('div');
    card.className = 'cine-card-drop';
    card.innerHTML = `
      <span class="num"></span>
      <span class="lbl"></span>
      <span class="meta"></span>
    `;
    D.body.appendChild(card);

    const scrim = D.createElement('div');
    scrim.className = 'cine-card-scrim';
    D.body.appendChild(scrim);

    const flash = D.createElement('div');
    flash.className = 'cine-flash';
    D.body.appendChild(flash);

    const wipe = D.createElement('div');
    wipe.className = 'cine-wipe';
    D.body.appendChild(wipe);

    const cardNum = card.querySelector('.num');
    const cardLbl = card.querySelector('.lbl');
    const cardMeta = card.querySelector('.meta');

    const META = {
      'Open':       'BOOT · COLD OPEN',
      'The Problem':'SCENE · DIAGNOSIS',
      'Operations': 'SCENE · INSTALL · MODULE-01',
      'Marketing':  'SCENE · INSTALL · MODULE-02',
      'Financial':  'SCENE · INSTALL · MODULE-03',
      'Full Stack': 'KEY MOMENT · ∞ LEVERAGE',
      'Founders':   'SCENE · WHO BUILT IT',
      'Who For':    'SCENE · QUALIFICATION',
      'FAQ':        'SCENE · OBJECTIONS HANDLED',
    };

    const sections = [...D.querySelectorAll('[data-chapter]')];
    if(!sections.length) return;

    const playCard = (sec, num) => {
      const lbl = sec.getAttribute('data-chapter') || '';
      cardNum.textContent = String(num).padStart(2,'0');
      cardLbl.textContent = lbl.toUpperCase();
      cardMeta.textContent = META[lbl] || 'SCENE';
      // Reset + play
      card.classList.remove('live'); scrim.classList.remove('live');
      void card.offsetWidth; void scrim.offsetWidth;
      card.classList.add('live'); scrim.classList.add('live');
      // Also play wipe
      wipe.classList.remove('live'); void wipe.offsetWidth; wipe.classList.add('live');
    };

    const playFlash = () => {
      flash.classList.remove('live'); void flash.offsetWidth; flash.classList.add('live');
    };

    // Skip the homepage's hero (Open) — that's covered by the cold open
    let played = new WeakSet();
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting && !played.has(en.target)){
          played.add(en.target);
          const idx = sections.indexOf(en.target);
          // Don't play title card for the hero/Open (idx 0); avoid blocking initial paint
          if(idx === 0) return;
          playCard(en.target, idx);
          // Key moment also flashes white
          if(en.target.hasAttribute('data-keymoment')){
            setTimeout(playFlash, 120);
          }
        }
      });
    }, {rootMargin:'-25% 0px -45% 0px', threshold:0.15});
    sections.forEach(s=>io.observe(s));
  }

  /* ─── HEADLINE BOOT-CONSTRUCT (replaces typewriter feel) ─ */
  function constructHeadline(){
    if(REDUCED) return;
    // Only on the homepage hero (#typeHead exists), and we LAYER on top of the typewriter
    const head = D.getElementById('typeHead');
    if(!head) return;
    // Skip if already constructed by typewriter (race condition)
    // Instead, add a subtle flicker once typewriter completes by listening for it
    // Simpler: after 2.0s when typewriter has finished, do a "construct flicker" once
    setTimeout(()=>{
      const spans = head.querySelectorAll('.tw');
      spans.forEach((sp,i)=>{
        // Wrap each character in a construct-char span and re-reveal
        const text = sp.textContent;
        sp.innerHTML = '';
        const isGreen = sp.classList.contains('green');
        text.split('').forEach((ch, k)=>{
          const c = D.createElement('span');
          c.className = 'cine-construct-char' + (isGreen ? ' green' : '');
          c.textContent = ch === ' ' ? ' ' : ch;
          sp.appendChild(c);
          // Stagger reveal — randomized order
          const delay = 30 + Math.random() * 240 + i * 60;
          setTimeout(()=>c.classList.add('live'), delay);
        });
      });
    }, 2000);
  }

  /* constructHeadline DISABLED — was racing with typewriter, visible bug */

  /* ─── BOOT ──────────────────────────────────────────── */
  function boot(){
    mountTitleCards();
  }
  if(D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
