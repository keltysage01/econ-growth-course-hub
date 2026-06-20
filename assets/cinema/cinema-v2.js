/* ═══════════════════════════════════════════════════════
   CINEMA v2 — consolidated.
   Replaces atmosphere.js, cinema.js, cinema-pro.js,
   cinema-max.js, cinema-tune.js, cinema-perf.js,
   cinema-mov.js, cinema-lite.js, cinema-nuclear.js.
   Only mounts what's actually alive.
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const D = document, W = window, B = D.body;
  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const TOUCH = matchMedia('(hover:none)').matches;
  const SESSION_KEY = 'cine_co_seen_v1';

  /* ─── COLD OPEN ─────────────────────────────────────── */
  function mountColdOpen(){
    if(REDUCED) return;
    const url = location.href;
    const isDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost' || /[?&]fresh=/.test(url);
    if(!isDev && sessionStorage.getItem(SESSION_KEY)) return;

    const el = D.createElement('div');
    el.id = 'cine-cold-open';
    el.innerHTML = `
      <div class="cine-co-scan"></div>
      <div class="cine-co-cross h"></div>
      <div class="cine-co-cross v"></div>
      <div class="cine-co-ring"></div>
      <div class="cine-co-ring inner"></div>
      <div class="cine-co-boot cine-co-boot-l">
        <div>SYS://eCon.OS · BOOT v2026.05</div>
        <div>[OK] OPERATIONS engine — online</div>
        <div>[OK] MARKETING engine — online</div>
        <div>[OK] FINANCIAL engine — online</div>
        <div>[OK] CLAUDE · anthropic.api/v1</div>
        <div>[OK] GROWTH STACK ready</div>
      </div>
      <div class="cine-co-boot cine-co-boot-r">
        <div>NODE · claude-opus-4-7</div>
        <div>SESSION · authenticated</div>
        <div>SECTOR · serious operators</div>
        <div>MODE · install mode</div>
      </div>
      <div class="cine-co-mark">
        <span>e<span class="c">C</span>on</span>
        <span class="bar"></span>
        <span>Growth</span>
      </div>
      <div class="cine-co-tag"><span class="pulse"></span>AI Operating Systems · Now Loading</div>
      <button class="cine-co-tour-cta" aria-label="Enable guided tour"><span class="pulse"></span><span class="ico">🔊</span> <span>Enable the Tour</span></button>
      <button class="cine-co-skip" aria-label="Skip intro">Skip ▸</button>
    `;
    D.body.appendChild(el);
    D.body.classList.add('cine-cold-locked');

    // Idempotency guard — multiple paths (timeout, skip, key, tour cta) can call finish().
    // Was firing duplicate cine:cold:done events + restarting track-in animation 3s after manual dismiss.
    let finished = false;
    // BUG#2: was 3000 — cut off mid-animation (inner ring runs to ~3.9s, CTA appears at 2.2s).
    const dismissTimer = setTimeout(()=>finish(), 4500);

    const finish = () => {
      if(finished) return;
      finished = true;
      clearTimeout(dismissTimer);
      D.removeEventListener('keydown', keyHandler);   // always clean up the listener (all 4 dismiss paths)
      sessionStorage.setItem(SESSION_KEY, '1');
      el.classList.add('gone');
      window.__cineColdDone = true;
      D.dispatchEvent(new Event('cine:cold:done'));
      // BUG#10: keep scroll locked until the overlay has fully faded, else the
      // page scrolls visibly behind the still-opaque boot screen.
      setTimeout(()=>{ el.remove(); D.body.classList.remove('cine-cold-locked'); }, 1000);
      setTimeout(stageCinema, 350);
    };

    // Clicking the TOUR cta both enables sound and dismisses cold open
    const tourBtn = el.querySelector('.cine-co-tour-cta');
    if(tourBtn){
      tourBtn.addEventListener('click', ()=>{
        const sb = D.querySelector('.cine-sound');
        if(sb && !sb.classList.contains('on')) sb.click();
        finish();
      });
    }

    el.querySelector('.cine-co-skip').addEventListener('click', finish);

    const keyHandler = (e) => {
      if(['Escape','Enter',' '].includes(e.key)){
        finish();
        D.removeEventListener('keydown', keyHandler);
      }
    };
    D.addEventListener('keydown', keyHandler);
  }

  function stageCinema(){
    // Currently a stub — no atmosphere/kinetic to stage.
    // Kept as a hook in case Kris wants to bring back the WebGL atmosphere or kinetic typography later.
  }

  /* ─── LETTERBOX ─────────────────────────────────────── */
  function mountLetterbox(){
    const t = D.createElement('div'); t.className = 'cine-letterbox top'; D.body.appendChild(t);
    const b = D.createElement('div'); b.className = 'cine-letterbox bot'; D.body.appendChild(b);
  }

  /* ─── HUD FRAME — corner brackets + readouts + status bar */
  function mountHUD(){
    const hud = D.createElement('div');
    hud.className = 'cine-hud';
    hud.innerHTML = `
      <div class="cine-hud-bracket tl"></div>
      <div class="cine-hud-bracket tr"></div>
      <div class="cine-hud-bracket bl"></div>
      <div class="cine-hud-bracket br"></div>
      <div class="cine-hud-readout tl"><span class="dot"></span><span>SYS://eCon.OS</span></div>
      <div class="cine-hud-readout tr"><span style="color:rgba(33,230,138,.7)">▲</span> <span id="cinePing">12ms</span><span class="sep">·</span><span class="rec-dot"></span><span>REC</span><span class="sep">·</span><span id="cineHudTime">--:--:--</span></div>
      <div class="cine-hud-readout bl"><span>NODE</span><span class="sep">·</span><span>claude-opus-4-7</span></div>
      <div class="cine-hud-readout br"><span>SECTION</span><span class="sep">·</span><span id="cineHudSection">—</span><span class="dot"></span></div>
    `;
    D.body.appendChild(hud);

    // Top-center status bar
    const s = D.createElement('div');
    s.className = 'cine-hud-status';
    s.innerHTML = `
      <span class="pip"></span>
      <span>SYSTEM</span><span class="grn">ONLINE</span>
      <span class="sep">·</span>
      <span>STACK</span><span class="grn">3 / 3</span>
      <span class="sep">·</span>
      <span>UPTIME</span><span class="grn" id="cineStatUp">00:00:00</span>
      <span class="sep">·</span>
      <span>API</span><span class="grn">v1 ✓</span>
    `;
    D.body.appendChild(s);

    // Nav telemetry
    const nav = D.querySelector('.nav');
    if(nav){
      const t = D.createElement('div');
      t.className = 'cine-nav-telemetry';
      t.innerHTML = `<span class="pulse"></span><span>online</span>`;
      const cta = nav.querySelector('.nav-cta-desk') || nav.querySelector('.nav-cta');
      if(cta) cta.parentElement.insertBefore(t, cta);
    }

    setTimeout(()=>B.classList.add('cine-hud-on'), 200);

    // Consolidated: clock + ping in ONE 1Hz interval (was 3 separate intervals).
    // Status bar uptime element is hidden via CSS — skip updating it entirely.
    const time = D.getElementById('cineHudTime');
    const ping = D.getElementById('cinePing');
    const z = n => String(n).padStart(2,'0');
    let pingPhase = 0;
    const tick = () => {
      const d = new Date();
      if(time) time.textContent = `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
      // Ping ticks every other second (~2Hz visual)
      if(ping && ++pingPhase % 2 === 0) ping.textContent = (8 + Math.floor(Math.random()*24)) + 'ms';
    };
    tick(); setInterval(tick, 1000);

    // Section tracker
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
  }

  /* ─── CHAPTER MARKERS ───────────────────────────────── */
  function mountChapters(){
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

  /* ─── TOUR CHOICE MODAL — visitor picks tour or self-explore ─── */
  function mountChoiceModal(){
    if(REDUCED) return;
    // Force-show on localhost / ?fresh= URLs (dev). Otherwise honor sessionStorage.
    const url = location.href;
    const isDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost' || /[?&]fresh=/.test(url);
    if(!isDev && sessionStorage.getItem('cine_choice_made_v1')) return;
    console.log('[Jarvis] Choice modal armed — will show after cold open clears');

    const mount = () => {
      // Wait for cold open AND typewriter to fully settle (~5s after cold open done).
      // Typewriter is ~1.4s; we give an extra 3.6s of breathing room so the visitor
      // actually reads and absorbs the hero before the floating banner slides in.
      setTimeout(showModal, 5000);
    };

    const showModal = () => {
      if(D.getElementById('cineChoice')) return;
      console.log('[Jarvis] Showing choice modal');
      const wrap = D.createElement('div');
      wrap.id = 'cineChoice';
      wrap.className = 'cine-choice';
      wrap.innerHTML = `
        <div class="cine-choice-card">
          <button class="cine-choice-x" aria-label="Close">✕</button>
          <div class="text-block">
            <div class="cine-choice-eyebrow"><span class="pulse"></span>Jarvis</div>
            <div class="cine-choice-h">Want me to <span class="green">walk you through this?</span></div>
          </div>
          <div class="cine-choice-btns">
            <button class="cine-choice-btn primary" id="choiceTour"><span class="ico">🎬</span> Tour</button>
            <button class="cine-choice-btn ghost" id="choiceExplore">Skip</button>
          </div>
        </div>
      `;
      D.body.appendChild(wrap);
      // Force a paint, then add .live for the fade-in. setTimeout is more reliable than rAF
      // when the tab is throttled or backgrounded.
      setTimeout(() => wrap.classList.add('live'), 30);

      const dismiss = (madeChoice) => {
        if(madeChoice) sessionStorage.setItem('cine_choice_made_v1', '1');
        wrap.classList.remove('live');
        setTimeout(() => wrap.remove(), 500);
      };

      wrap.querySelector('#choiceTour').addEventListener('click', () => {
        dismiss(true);
        startAutoTour();
      });
      wrap.querySelector('#choiceExplore').addEventListener('click', () => dismiss(true));
      wrap.querySelector('.cine-choice-x').addEventListener('click', () => dismiss(false));
      wrap.addEventListener('click', (e) => { if(e.target === wrap) dismiss(false); });
    };

    if(window.__cineColdDone){
      mount();
    } else {
      D.addEventListener('cine:cold:done', mount, {once:true});
      setTimeout(mount, 7000); // fallback in case cinema layer fails
    }
  }

  /* ─── AUTO TOUR — scrolls section-by-section with Jarvis narration ─
     Design: SCROLL drives the tour, audio is a sync layer.
     Each stop has a target duration. Audio may or may not play (autoplay
     policies vary) — the tour scrolls regardless. If audio finishes early,
     we advance immediately; otherwise we wait the target duration. */
  function startAutoTour(){
    // Enable sound. This click is inside a user-gesture chain so audio should be allowed.
    const soundBtn = D.querySelector('.cine-sound');
    if(soundBtn && !soundBtn.classList.contains('on')){
      soundBtn.click();
    }

    // Build the tour status overlay + progress bar at the very top of the viewport
    if(!D.querySelector('.cine-tour-status')){
      const bar = D.createElement('div');
      bar.className = 'cine-tour-status';
      bar.innerHTML = `<span class="pulse"></span><span>Jarvis Tour ·</span><span class="grn" id="tourSection">Welcome…</span><span style="opacity:.5">·</span><span id="tourPos">0/8</span><button class="cine-tour-stop" id="tourStop">Stop</button>`;
      D.body.appendChild(bar);
      bar.querySelector('#tourStop').addEventListener('click', stopAutoTour);
    }
    if(!D.querySelector('.cine-tour-progress')){
      const prog = D.createElement('div');
      prog.className = 'cine-tour-progress';
      prog.innerHTML = '<div class="cine-tour-progress-fill" id="tourProgFill"></div>';
      D.body.appendChild(prog);
    }
    // Tease card — quick "NEXT: ..." flashes between sections
    if(!D.querySelector('.cine-tour-tease')){
      const tease = D.createElement('div');
      tease.className = 'cine-tour-tease';
      tease.innerHTML = '<span class="lbl">UP NEXT</span><span class="text" id="tourTeaseText"></span>';
      D.body.appendChild(tease);
    }
    B.classList.add('tour-running');

    // Tour pacing — matches recorded MP3 lengths (+12% sped up).
    // Lets each clip play to completion, breathes at the climax.
    const TOUR = [
      {id:'problem',    name:'The Problem',           dur:9000,  tease:'Three traps. One way out.'},
      {id:'operations', name:'Operations',            dur:11000, tease:'Marketing layer next.'},
      {id:'marketing',  name:'Marketing',             dur:9000,  tease:'Then the half nobody plans for…'},
      {id:'financial',  name:'Financial',             dur:8000,  tease:'Now watch all three converge.'},
      {id:'fullstack',  name:'∞ LEVERAGE',            dur:10500, tease:'Who built it?'},  // climax — breathes
      {id:'founders',   name:'Founders',              dur:9000,  tease:'Is this for you?'},
      {id:'qualify',    name:'Who For',               dur:8500,  tease:'Last stop — answers.'},
      {id:'faq',        name:'Questions',             dur:8500,  tease:''},
    ];
    const INTRO_DURATION = 3500; // beat to land the intro before first scroll

    let idx = 0;
    let nextTimer = 0;

    const advance = () => {
      if(!B.classList.contains('tour-running')) return;
      if(idx >= TOUR.length){ finishTour(); return; }
      const stop = TOUR[idx++];
      const sec = D.getElementById(stop.id);
      if(!sec){ advance(); return; }
      // Update HUD: section name + position + progress bar
      const label = D.getElementById('tourSection');
      if(label) label.textContent = stop.name;
      const pos = D.getElementById('tourPos');
      if(pos) pos.textContent = `${idx}/${TOUR.length}`;
      const fill = D.getElementById('tourProgFill');
      if(fill) fill.style.width = `${(idx/TOUR.length)*100}%`;
      // Trigger the UP NEXT tease 700ms before the next advance
      if(stop.tease){
        clearTimeout(B._teaseTo);
        B._teaseTo = setTimeout(() => {
          const tt = D.getElementById('tourTeaseText');
          if(tt) tt.textContent = stop.tease;
          const teaseEl = D.querySelector('.cine-tour-tease');
          if(teaseEl){ teaseEl.classList.add('flash'); setTimeout(()=>teaseEl.classList.remove('flash'), 1500); }
        }, Math.max(1200, stop.dur - 2200));
      }
      sec.scrollIntoView({behavior:'smooth', block:'start'});
      clearTimeout(nextTimer);
      nextTimer = setTimeout(advance, stop.dur);
    };

    // 'ended' on clip lets us advance EARLIER if audio finishes before the timer
    const onClipEnded = (e) => {
      if(!B.classList.contains('tour-running')) return;
      const key = e.detail?.key;
      if(key === 'intro'){
        // Intro done → start the section scroll loop right away
        clearTimeout(nextTimer);
        advance();
      } else {
        // A section clip finished — skip the remaining wait, go next
        clearTimeout(nextTimer);
        setTimeout(advance, 700);
      }
    };
    D.addEventListener('cine:clip:ended', onClipEnded);
    B._tourCleanup = () => {
      D.removeEventListener('cine:clip:ended', onClipEnded);
      clearTimeout(nextTimer);
    };

    // Kick off after intro plays (or by timer if audio is blocked)
    nextTimer = setTimeout(advance, INTRO_DURATION);
  }

  function stopAutoTour(){
    B.classList.remove('tour-running');
    ['.cine-tour-status','.cine-tour-progress','.cine-tour-tease'].forEach(sel=>{
      const el = D.querySelector(sel); if(el) el.remove();
    });
    if(B._tourCleanup){ B._tourCleanup(); delete B._tourCleanup; }
    clearTimeout(B._teaseTo);
  }

  /* ─── TALK TO JARVIS — live voice chat panel ───────
     Floating button → opens a chat panel with mic + text input.
     Backend is /api/jarvis-chat (POST JSON {message, history}).
     If backend doesn't exist, falls back to a canned response. */
  function mountTalk(){
    const btn = D.createElement('button');
    btn.className = 'cine-talk-btn';
    btn.innerHTML = '<span>Talk to Jarvis</span>';
    btn.setAttribute('aria-label','Open Jarvis voice chat');
    D.body.appendChild(btn);

    const panel = D.createElement('div');
    panel.className = 'cine-talk-panel';
    panel.innerHTML = `
      <div class="cine-talk-header">
        <div class="cine-talk-title"><span class="dot"></span>JARVIS · LIVE</div>
        <button class="cine-talk-close" aria-label="Close">✕</button>
      </div>
      <div class="cine-talk-log" id="cineTalkLog">
        <div class="cine-talk-msg">
          <span class="who">Jarvis</span>
          <div class="body">At your service, sir. Ask me anything about Econ Growth — or let me walk you through the site.</div>
        </div>
        <button class="cine-talk-tour-cta" id="cineTalkTour">
          <span class="ico">🎬</span>
          <span class="text"><strong>Take the 70-second tour</strong><br><span class="sub">I'll scroll for you · sound on</span></span>
          <span class="arrow">▸</span>
        </button>
      </div>
      <div class="cine-talk-input-wrap">
        <button class="cine-talk-mic" id="cineTalkMic" aria-label="Voice input">🎤</button>
        <textarea class="cine-talk-input" id="cineTalkInput" placeholder="Ask Jarvis…" rows="1"></textarea>
        <button class="cine-talk-send" id="cineTalkSend" aria-label="Send">▸</button>
      </div>
      <div class="cine-talk-disclaimer">Powered by Anthropic Claude · responses may vary</div>
    `;
    D.body.appendChild(panel);

    const log = panel.querySelector('#cineTalkLog');
    const input = panel.querySelector('#cineTalkInput');
    const sendBtn = panel.querySelector('#cineTalkSend');
    const micBtn = panel.querySelector('#cineTalkMic');
    const closeBtn = panel.querySelector('.cine-talk-close');

    const history = [];

    const togglePanel = () => panel.classList.toggle('open');
    btn.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', togglePanel);

    // "Take the Tour" CTA inside the panel — closes panel + starts auto-tour
    const tourCta = panel.querySelector('#cineTalkTour');
    if(tourCta){
      tourCta.addEventListener('click', () => {
        panel.classList.remove('open');
        startAutoTour();
        // Remove the CTA from the panel so it doesn't show next open
        tourCta.remove();
      });
    }

    const append = (who, body, thinking) => {
      const msg = D.createElement('div');
      msg.className = 'cine-talk-msg ' + (who === 'user' ? 'user' : '');
      msg.innerHTML = `<span class="who">${who === 'user' ? 'You' : 'Jarvis'}</span>${
        thinking
          ? '<div class="cine-talk-thinking"><span></span><span></span><span></span></div>'
          : '<div class="body"></div>'
      }`;
      if(!thinking) msg.querySelector('.body').textContent = body;
      log.appendChild(msg);
      log.scrollTop = log.scrollHeight;
      return msg;
    };

    // TTS: speak the response. Uses the existing Microsoft Edge Neural TTS pipeline
    // by routing through a fresh Audio() on /api/jarvis-tts, with browser TTS fallback.
    const speakResponse = (text) => {
      if(!('speechSynthesis' in W)) return;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.96; u.pitch = 0.85; u.volume = 0.7;
        const voices = speechSynthesis.getVoices();
        const v = voices.find(x => /^daniel/i.test(x.name) && /en[-_]gb/i.test(x.lang||''));
        if(v) u.voice = v;
        speechSynthesis.speak(u);
      } catch(e){}
    };

    const send = async (text) => {
      if(!text || !text.trim()) return;
      text = text.trim();
      append('user', text);
      input.value = '';
      const thinking = append('jarvis', '', true);
      history.push({role:'user', content:text});

      try {
        const res = await fetch('/api/jarvis-chat', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({message:text, history})
        });
        if(!res.ok) throw new Error('backend offline');
        const data = await res.json();
        const reply = data.reply || data.text || "I'm afraid I can't reach my backend, sir.";
        thinking.remove();
        const replyMsg = append('jarvis', reply);
        history.push({role:'assistant', content:reply});
        speakResponse(reply);
      } catch(err){
        // Fallback canned response (no backend yet — Kris will wire later)
        thinking.remove();
        const fallback = "I'd love to chat properly, sir — but live conversations need an API key wired up. Until then: Operations is the AI system layer, Marketing compounds growth, Financial structures it. Book a Growth Call below to talk to Kris or Watson directly.";
        append('jarvis', fallback);
        speakResponse(fallback);
      }
    };

    sendBtn.addEventListener('click', () => send(input.value));
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        send(input.value);
      }
    });

    // Voice input via Web Speech API recognition
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if(SR){
      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = false;
      let listening = false;
      micBtn.addEventListener('click', () => {
        if(listening){ rec.stop(); return; }
        try { rec.start(); listening = true; micBtn.classList.add('listening'); }
        catch(e){ /* ignore */ }
      });
      rec.onresult = (e) => {
        const text = e.results[0]?.[0]?.transcript || '';
        if(text) send(text);
      };
      rec.onend = () => { listening = false; micBtn.classList.remove('listening'); };
      rec.onerror = () => { listening = false; micBtn.classList.remove('listening'); };
    } else {
      micBtn.style.display = 'none';
    }
  }

  function finishTour(){
    B.classList.remove('tour-running');
    // Scroll to the booking CTA at the bottom
    const cta = D.getElementById('contact') || D.querySelector('.final-cta');
    if(cta) cta.scrollIntoView({behavior:'smooth', block:'start'});
    // Update status briefly to show completion
    const status = D.querySelector('.cine-tour-status');
    if(status){
      status.innerHTML = `<span class="pulse"></span><span>Tour Complete ·</span><span class="grn">Your move, sir</span>`;
      setTimeout(() => status.remove(), 4000);
    }
  }

  /* ─── DIEGETIC TIMECODE ─────────────────────────── */
  function mountTimecode(){
    if(REDUCED) return;
    const tc = D.createElement('div');
    tc.className = 'cine-timecode';
    tc.innerHTML = '<span class="lbl">TC</span><span class="val" id="cineTC">00:00:00:00</span>';
    D.body.appendChild(tc);
    const out = D.getElementById('cineTC');
    const t0 = performance.now();
    // 24fps frame counter (visual only — we tick every 100ms / 12fps for perf,
    // but compute frames at 24fps virtual)
    setInterval(()=>{
      const ms = performance.now() - t0;
      const totalFrames = Math.floor(ms / (1000/24));
      const ff = totalFrames % 24;
      const totalSecs = Math.floor(totalFrames / 24);
      const ss = totalSecs % 60;
      const mm = Math.floor(totalSecs / 60) % 60;
      const hh = Math.floor(totalSecs / 3600);
      const z = n=>String(n).padStart(2,'0');
      out.textContent = `${z(hh)}:${z(mm)}:${z(ss)}:${z(ff)}`;
    }, 100);
  }

  /* ─── VIGNETTE BREATHING ────────────────────────── */
  function mountVignette(){
    if(REDUCED) return;
    const v = D.createElement('div');
    v.className = 'cine-vignette';
    D.body.appendChild(v);
  }

  /* ─── FILM GRAIN OVERLAY ─────────────────────────── */
  function mountGrain(){
    if(REDUCED) return;
    const g = D.createElement('div');
    g.className = 'cine-grain';
    D.body.appendChild(g);
  }

  /* ─── HERO LIGHT LEAKS (one extra el needed) ─────── */
  function mountLightLeaks(){
    const hero = D.querySelector('.hero');
    if(!hero) return;
    if(hero.querySelector('.leak-2')) return;
    const leak = D.createElement('div');
    leak.className = 'leak-2';
    hero.appendChild(leak);
  }

  /* ─── HERO IN-VIEW marker (for animation pausing) ── */
  function mountHeroInView(){
    pauseOffscreen('.hero', 'in-view');
  }

  /* ─── HERO PARALLAX (subtle cursor follow) ───────── */
  function mountHeroParallax(){
    if(TOUCH || REDUCED) return;
    const bg = D.querySelector('.hero-bg');
    if(!bg) return;
    bg.classList.add('parallax');
    let tx = 0, ty = 0;
    let cx = 0, cy = 0;
    let raf = 0;
    // PERF: cache hero visibility via IO so the mousemove handler never reads
    // layout (getBoundingClientRect per event was forcing a reflow on a layer
    // the rAF was simultaneously dirtying).
    let visible = true;
    const hero = bg.closest('.hero') || bg;
    if('IntersectionObserver' in window){
      visible = false;
      new IntersectionObserver(([en])=>{
        visible = en.isIntersecting;
        if(!visible && raf){ cancelAnimationFrame(raf); raf = 0; bg.style.willChange='auto'; }
      }, {threshold:0}).observe(hero);
    }
    const tick = () => {
      if(!visible){ cx = tx; cy = ty; raf = 0; bg.style.willChange='auto'; return; }
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      bg.style.setProperty('--px', cx.toFixed(2)+'px');
      bg.style.setProperty('--py', cy.toFixed(2)+'px');
      if(Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1){
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        bg.style.willChange = 'auto';   // drop the layer when idle
      }
    };
    W.addEventListener('mousemove', (e)=>{
      if(!visible) return;              // cached boolean — no layout read
      tx = (e.clientX / innerWidth - 0.5) * 22;
      ty = (e.clientY / innerHeight - 0.5) * 14;
      if(!raf){ bg.style.willChange='transform'; raf = requestAnimationFrame(tick); }
    }, {passive:true});
  }

  /* ─── PAUSE OFFSCREEN ANIMATIONS (perf) ─────────── */
  function pauseOffscreen(sel, cls){
    const el = D.querySelector(sel);
    if(!el) return;
    const io = new IntersectionObserver(([en])=>{
      el.classList.toggle(cls, en.isIntersecting);
    }, {threshold:0});
    io.observe(el);
  }

  /* ─── FOOTER CREDITS ROLL ────────────────────────── */
  function mountCredits(){
    if(REDUCED) return;
    const footer = D.querySelector('.footer');
    if(!footer) return;
    if(D.querySelector('.cine-credits')) return;
    const credits = D.createElement('div');
    credits.className = 'cine-credits';
    const items = [
      '<span class="grn">ECON GROWTH</span> · AI OPERATING SYSTEMS FOR SERIOUS OPERATORS',
      'CO-FOUNDED BY <span class="grn">KRISTOPHER CRAVENS</span> &amp; <span class="grn">WATSON WHEELER</span>',
      'POWERED BY <span class="grn">ANTHROPIC CLAUDE</span>',
      'OPERATIONS · MARKETING · FINANCIAL · ONE FULL STACK',
      '<span class="grn">∞ LEVERAGE</span> · THE FULL STACK, INSTALLED',
    ];
    const inner = items.map(i=>`<span class="cine-credits-item">${i}</span>`).join('');
    credits.innerHTML = `<div class="cine-credits-track">${inner}${inner}</div>`;
    footer.insertBefore(credits, footer.firstChild);
    // Pause the marquee unless the credits are in view
    pauseOffscreen('.cine-credits', 'in-view');
  }

  /* ─── COLOR GRADE OVERLAY — tints per section ──── */
  function mountGrade(){
    const g = D.createElement('div');
    g.className = 'cine-grade';
    D.body.appendChild(g);
    const setGrade = (r,gg,b,a)=>{
      const s = D.documentElement.style;
      s.setProperty('--cine-grade-r', r);
      s.setProperty('--cine-grade-g', gg);
      s.setProperty('--cine-grade-b', b);
      s.setProperty('--cine-grade-a', a);
    };
    const graded = [...D.querySelectorAll('[data-grade]')];
    if(!graded.length) return;
    const narrated = new WeakSet();
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          const grade = en.target.dataset.grade || '0,0,0,0';
          const [r,gg,b,a] = grade.split(',').map(Number);
          setGrade(r,gg,b,a);
          D.dispatchEvent(new CustomEvent('cine:grade', {detail: grade}));
          // Dispatch narration request — sound engine marks section._narrated
          // ONLY after the MP3 actually starts playing (audit fix).
          const line = en.target.dataset.narrate;
          if(line && !en.target._narrated){
            D.dispatchEvent(new CustomEvent('cine:narrate', {detail: {line, section: en.target}}));
          }
        }
      });
    }, {rootMargin:'-40% 0px -55% 0px'});
    graded.forEach(g=>io.observe(g));
  }

  /* ─── SPOTLIGHT VIGNETTE — site-wide darken layer ── */
  function mountSpotlightVignette(){
    const v = D.createElement('div');
    v.className = 'cine-spotlight-vignette';
    D.body.appendChild(v);
  }

  /* ─── SCENE REVEALS + KEYMOMENTS + CAMERA SHAKE ─── */
  function mountSceneObserver(){
    const scenes = D.querySelectorAll('.cine-scene, [data-keymoment]');
    if(!scenes.length) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        const t = en.target;
        if(en.isIntersecting){
          t.classList.add('cine-in');
          if(t.dataset.keymoment !== undefined){
            B.classList.add('cine-keymoment');
            clearTimeout(t._kmTo);
            t._kmTo = setTimeout(()=>B.classList.remove('cine-keymoment'), 4200);
            // BUG#12: camera shake DISABLED. It transformed <body>, which re-anchors
            // every position:fixed overlay (HUD, letterbox, ticker, buttons) — so the
            // whole frozen UI shuddered together and read as the page glitching.
          }
        }
      });
    }, {rootMargin:'-12% 0px -12% 0px', threshold:0.12});
    scenes.forEach(s=>io.observe(s));
  }

  /* ─── FULL-STACK STICKY SCROLL ──────────────────── */
  function mountFullStackPin(){
    const sec = D.querySelector('.fullstack-sec');
    if(!sec || REDUCED) return;
    if(innerWidth < 760) return;

    const inner = sec.querySelector('.section-inner');
    if(!inner) return;
    const existingRow = sec.querySelector('.fullstack-row');
    if(!existingRow) return;
    existingRow.style.display = 'none';

    const cine = D.createElement('div');
    cine.className = 'fullstack-cine';
    cine.innerHTML = `
      <div class="fullstack-cine-pin">
        <div class="fullstack-cine-stage">
          <div class="fullstack-cine-eyebrow">The Full Stack</div>
          <h3 class="fullstack-cine-h">MOST COMPANIES SELL YOU ONE.<br>WE BUILD <span class="green">ALL THREE.</span></h3>
          <div class="fs-cine-pillars">
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

    // headline + eyebrow fade out as the finale takes over (prevents the
    // headline / pillars / finale from stacking on top of each other).
    const fsHead = cine.querySelector('.fullstack-cine-h');
    const fsEyebrow = cine.querySelector('.fullstack-cine-eyebrow');
    const fsPillarsWrap = cine.querySelector('.fs-cine-pillars');
    [fsHead, fsEyebrow, fsPillarsWrap].forEach(e=>{ if(e) e.style.transition = 'opacity .45s ease'; });

    // rAF-throttled scroll handler — was reading bounding rect + offsetHeight on every scroll tick.
    // Audit P5 / Codex / Gemini all flagged this as the primary lag source.
    let scrollRaf = 0;
    const compute = () => {
      scrollRaf = 0;
      // BUG#8: below the pin breakpoint (narrowed window / rotated tablet), tear the
      // pin state down and restore the normal row, so it can't get stuck in the
      // darkened spotlight/letterbox state against collapsed geometry.
      if(innerWidth < 760){
        pin.classList.remove('is-fixed','is-bottom');
        B.classList.remove('cine-spotlight');
        if(existingRow) existingRow.style.display = '';
        return;
      }
      if(existingRow && existingRow.style.display !== 'none') existingRow.style.display = 'none';
      const rect = cine.getBoundingClientRect();
      const h = rect.height;   // PERF: reuse rect (was a 2nd forced layout via offsetHeight)
      const winH = innerHeight;
      const cineTop = rect.top;
      const cineBottom = rect.bottom;

      // Spotlight fires while the pin is in its fixed window — viewport darkens, graphics burn through
      if(cineTop > 0){
        pin.classList.remove('is-fixed','is-bottom');
        B.classList.remove('cine-spotlight');
      } else if(cineBottom > winH){
        pin.classList.add('is-fixed');
        pin.classList.remove('is-bottom');
        B.classList.add('cine-spotlight');
      } else {
        pin.classList.remove('is-fixed');
        pin.classList.add('is-bottom');
        B.classList.remove('cine-spotlight');
      }

      const p = Math.max(0, Math.min(1, (-cineTop) / (h - winH)));
      const step = Math.floor(p * 4.4);
      pillars.forEach(el=>{
        const s = +el.dataset.step;
        el.classList.toggle('live', step >= s);
        el.classList.toggle('spot', step === s);
      });
      // Clean hand-off: the whole pillar row + headline fade out together
      // (>0.84), THEN the finale lands (>0.88) — no triple-stack, no ghost.
      const dim = p > 0.84 ? '0' : '';
      if(fsHead) fsHead.style.opacity = dim;
      if(fsEyebrow) fsEyebrow.style.opacity = dim;
      if(fsPillarsWrap) fsPillarsWrap.style.opacity = dim;
      finale.classList.toggle('live', p > 0.88);
    };
    const onScroll = () => {
      if(scrollRaf) return;
      scrollRaf = requestAnimationFrame(compute);
    };
    W.addEventListener('scroll', onScroll, {passive:true});
    W.addEventListener('resize', onScroll, {passive:true});
    compute();
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

    const selectorTargets = 'a, button, .svc-card, .fs-cine-pillar, .qualify-item, .faq-q, .founders-cta, .cta-card, .hero-h1, .section-h2';
    let cur = null;

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
      D.dispatchEvent(new Event('cine:lockon'));
      let txt = 'TARGET';
      if(el.matches('.btn-primary')) txt = 'PRIMARY ACTION';
      else if(el.matches('.btn-ghost')) txt = 'SECONDARY';
      else if(el.matches('.svc-card')) txt = 'SERVICE';
      else if(el.matches('.fs-cine-pillar')) txt = 'PILLAR';
      else if(el.matches('.qualify-item')) txt = 'QUALIFIER';
      else if(el.matches('.faq-q')) txt = 'QUERY';
      else if(el.matches('.hero-h1, .section-h2')) txt = 'HEADLINE';
      else if(el.matches('a')) txt = 'LINK';
      else if(el.matches('button')) txt = 'ACTION';
      label.textContent = txt + ' ▸ ACQUIRED';
      lock.classList.remove('live');
      void lock.offsetWidth;
      lock.classList.add('live');
      fit();
    };
    const lockOff = () => { cur = null; lock.classList.remove('live'); };

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
    W.addEventListener('scroll', ()=>{ if(cur) fit(); }, {passive:true});
  }

  /* ─── GLITCH HOVER ──────────────────────────────────── */
  function mountGlitch(){
    if(REDUCED) return;
    D.querySelectorAll('.nav-cta-desk, .nav-cta, .btn-primary, .nav-links a').forEach(el=>{
      if(el.dataset.cineGlitch) return;
      el.dataset.cineGlitch = '1';
      el.classList.add('cine-glitch');
    });
  }

  /* ─── TITLE-CARD DROPS ──────────────────────────────── */
  function mountTitleCards(){
    if(REDUCED) return;
    const card = D.createElement('div');
    card.className = 'cine-card-drop';
    card.innerHTML = `<span class="num"></span><span class="lbl"></span><span class="meta"></span>`;
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
      card.classList.remove('live'); scrim.classList.remove('live');
      void card.offsetWidth; void scrim.offsetWidth;
      card.classList.add('live'); scrim.classList.add('live');
      wipe.classList.remove('live'); void wipe.offsetWidth; wipe.classList.add('live');
      D.dispatchEvent(new Event('cine:titlecard'));
    };

    const playFlash = () => {
      flash.classList.remove('live'); void flash.offsetWidth; flash.classList.add('live');
      D.dispatchEvent(new Event('cine:keymoment'));
    };

    // Only play title cards on KEYMOMENT sections (the Full Stack thesis).
    // Earlier version fired on every section — that's 8 dramatic cuts on a single scroll, fatiguing.
    let played = new WeakSet();
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting && !played.has(en.target)){
          played.add(en.target);
          if(!en.target.hasAttribute('data-keymoment')) return;
          const idx = sections.indexOf(en.target);
          playCard(en.target, idx);
          setTimeout(playFlash, 120);
        }
      });
    }, {rootMargin:'-25% 0px -45% 0px', threshold:0.15});
    sections.forEach(s=>io.observe(s));
  }

  /* ─── CINEMATIC SOUND ENGINE ─────────────────────────
     Layered pad · heartbeat sub-bass · diegetic FX (tick,
     whoosh, hit) · per-section mood shift · Jarvis voice.
     All Web Audio — no external files.
     ─────────────────────────────────────────────────── */
  function mountSound(){
    const btn = D.createElement('button');
    btn.className = 'cine-sound';
    btn.setAttribute('aria-label','Toggle ambient sound');
    btn.innerHTML = svgOff();
    D.body.appendChild(btn);

    let isOn = false;
    let engine = null;

    function svgOff(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'; }
    function svgOn(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'; }

    function buildEngine(){
      try{
        const ctx = new (W.AudioContext||W.webkitAudioContext)();
        const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);

        // Pad bus → low-pass filter → master
        const padBus = ctx.createGain(); padBus.gain.value = 0.55;
        const padFilter = ctx.createBiquadFilter(); padFilter.type='lowpass'; padFilter.frequency.value=560; padFilter.Q.value=0.7;
        padBus.connect(padFilter); padFilter.connect(master);

        // FX bus (clicks, whooshes, hits) → master
        const fxBus = ctx.createGain(); fxBus.gain.value = 0.65; fxBus.connect(master);

        // Heartbeat bus (sub-bass pulse) → master
        const hbBus = ctx.createGain(); hbBus.gain.value = 0.4; hbBus.connect(master);

        // ── Pad: 5 layered oscillators (root, fifth, detuned root, octave, octave+fifth)
        const padOscs = [];
        const layers = [
          {f:110,    det:0,  g:0.18},  // root
          {f:110,    det:8,  g:0.14},  // detuned root for chorus
          {f:164.81, det:0,  g:0.13},  // perfect fifth
          {f:220,    det:0,  g:0.08},  // octave up
          {f:329.63, det:6,  g:0.05},  // octave + fifth (airy top)
        ];
        layers.forEach(({f, det, g})=>{
          const osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=f; osc.detune.value=det;
          const gn = ctx.createGain(); gn.gain.value=g;
          osc.connect(gn); gn.connect(padBus); osc.start();
          padOscs.push({osc, gain:gn, baseFreq:f});
        });

        // LFO on pad filter cutoff for slow filter sweep
        const lfo = ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.06;
        const lfoG = ctx.createGain(); lfoG.gain.value=160;
        lfo.connect(lfoG); lfoG.connect(padFilter.frequency); lfo.start();

        // Subtle reverb-ish: feedback delay
        const dlA = ctx.createDelay(); dlA.delayTime.value=0.27;
        const dlB = ctx.createDelay(); dlB.delayTime.value=0.41;
        const fb  = ctx.createGain(); fb.gain.value=0.32;
        const send = ctx.createGain(); send.gain.value=0.22;
        padFilter.connect(send); send.connect(dlA); dlA.connect(dlB);
        dlB.connect(fb); fb.connect(dlA); dlB.connect(master);

        // ── Heartbeat: 60bpm sub-bass pulse, plays only when isOn
        function pulseHeartbeat(){
          if(!isOn) return;
          const t = ctx.currentTime;
          const osc = ctx.createOscillator(); osc.type='sine';
          osc.frequency.setValueAtTime(110, t);
          osc.frequency.exponentialRampToValueAtTime(56, t + 0.2);
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.6, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          osc.connect(g); g.connect(hbBus);
          osc.start(t); osc.stop(t + 0.25);
        }
        setInterval(pulseHeartbeat, 1000); // 60bpm

        // ── FX: lock-on tick (short, high)
        function tick(){
          if(!isOn) return;
          const t = ctx.currentTime;
          const osc = ctx.createOscillator(); osc.type='sine';
          osc.frequency.setValueAtTime(2400, t);
          osc.frequency.exponentialRampToValueAtTime(1600, t + 0.04);
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.06, t + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
          osc.connect(g); g.connect(fxBus);
          osc.start(t); osc.stop(t + 0.06);
        }

        // ── FX: title-card whoosh (noise sweep)
        function whoosh(){
          if(!isOn) return;
          const bufSize = ctx.sampleRate * 0.4;
          const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for(let i=0; i<bufSize; i++) data[i] = Math.random()*2-1;
          const src = ctx.createBufferSource(); src.buffer = buf;
          const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.Q.value=2.2;
          const g = ctx.createGain();
          const t = ctx.currentTime;
          flt.frequency.setValueAtTime(180, t);
          flt.frequency.exponentialRampToValueAtTime(3600, t + 0.3);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.22, t + 0.06);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
          src.connect(flt); flt.connect(g); g.connect(fxBus);
          src.start(t); src.stop(t + 0.45);
        }

        // ── FX: keymoment hit (deep impact)
        function hit(){
          if(!isOn) return;
          const t = ctx.currentTime;
          const osc = ctx.createOscillator(); osc.type='sine';
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(38, t + 0.5);
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.85, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
          osc.connect(g); g.connect(fxBus);
          osc.start(t); osc.stop(t + 0.6);
          // Layered noise impact transient
          const bufSize = ctx.sampleRate * 0.1;
          const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = buf.getChannelData(0);
          for(let i=0; i<bufSize; i++) data[i] = (Math.random()*2-1) * (1 - i/bufSize);
          const src = ctx.createBufferSource(); src.buffer = buf;
          const flt = ctx.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=420;
          const ng = ctx.createGain(); ng.gain.setValueAtTime(0.55, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
          src.connect(flt); flt.connect(ng); ng.connect(fxBus);
          src.start(t);
        }

        // ── Per-section mood: shift pad transposition
        function setMood(grade){
          if(!padOscs.length) return;
          // grade is "r,g,b,a"; use luma to bias pad transposition
          const [r,gg,b] = grade.split(',').map(Number);
          const luma = (r*0.299 + gg*0.587 + b*0.114) / 255;
          // Warmer (red-leaning) → drop a semitone; brighter → raise
          const cents = (luma - 0.4) * 240; // ±~100 cents range
          const t = ctx.currentTime;
          padOscs.forEach(({osc, baseFreq})=>{
            osc.detune.cancelScheduledValues(t);
            osc.detune.setValueAtTime(osc.detune.value, t);
            osc.detune.linearRampToValueAtTime(cents, t + 2.0);
          });
          // Also subtly shift filter cutoff
          padFilter.frequency.cancelScheduledValues(t);
          padFilter.frequency.setValueAtTime(padFilter.frequency.value, t);
          padFilter.frequency.linearRampToValueAtTime(400 + luma*900, t + 2.0);
        }

        // ── Jarvis voice — pre-rendered Microsoft Edge neural TTS (en-GB-ThomasNeural)
        // Plays MP3 files from /assets/audio/jarvis/. No browser TTS.
        // The data-narrate attribute on each section provides a KEY (e.g. "problem")
        // which maps to /assets/audio/jarvis/[key].mp3.
        let lastSpoke = 0;
        let currentAudio = null;
        const VOICE_BASE = '/assets/audio/jarvis/';
        // Queue of narration requests that arrived while another clip was playing.
        // Pre-audit version dropped these silently AND marked them as seen → tour broken.
        const narrationQueue = [];

        function speakClip(key, opts){
          opts = opts || {};
          const now = Date.now();
          // Intro always replaces; section narrations queue
          if(currentAudio && !currentAudio.paused && !currentAudio.ended && !opts.intro){
            // Don't double-queue same key
            if(!narrationQueue.some(q=>q.key===key)) narrationQueue.push({key, opts});
            return;
          }
          if(now - lastSpoke < 600 && !opts.intro) return;
          lastSpoke = now;
          try{
            if(currentAudio && opts.intro){
              try{ currentAudio.pause(); }catch(e){}
            }
            const a = new Audio(VOICE_BASE + key + '.mp3');
            a.volume = opts.volume ?? 0.7;
            // Mark seen ONLY after play actually starts
            a.addEventListener('playing', ()=>{
              if(opts.onPlay) opts.onPlay();
            }, {once:true});
            // When this clip finishes, drain the queue AND notify the auto-tour
            a.addEventListener('ended', ()=>{
              D.dispatchEvent(new CustomEvent('cine:clip:ended', {detail:{key}}));
              if(narrationQueue.length){
                const next = narrationQueue.shift();
                speakClip(next.key, next.opts);
              }
            }, {once:true});
            a.play().catch(()=>{ /* autoplay block — ignore */ });
            currentAudio = a;
          }catch(e){}
        }

        // Hard-stop any playing narration (called when sound toggle goes OFF).
        // Audit found: MP3s bypassed master gain, so toggling off didn't stop in-progress narration.
        function stopNarration(){
          if(currentAudio){
            try{ currentAudio.pause(); currentAudio.currentTime = 0; }catch(e){}
            currentAudio = null;
          }
          narrationQueue.length = 0;
        }

        function speakIntro(){
          speakClip('intro', {volume:0.7, intro:true});
        }

        // narrate() receives {line, section} from the IO observer.
        // Marks the section as narrated ONLY after audio.play() actually starts (audit fix).
        const LINE_TO_KEY = {
          "The operator's trap, sir. The bottleneck is always you.": 'problem',
          "Operations layer. Installing now.": 'operations',
          "Marketing that compounds. Built quietly. Hits hard.": 'marketing',
          "Financial structure. The half nobody plans for.": 'financial',
          "The Full Stack, sir. Infinite leverage.": 'fullstack',
          "Two operators. One operating system. Kris and Watson.": 'founders',
          "Serious operators only, sir.": 'qualify',
          "Questions, sir? Answered.": 'faq',
        };
        function narrate(payload){
          // Accept old (string) and new ({line, section}) payloads for forward compat
          const line = typeof payload === 'string' ? payload : payload.line;
          const section = typeof payload === 'object' ? payload.section : null;
          const key = LINE_TO_KEY[line];
          if(!key) return;
          speakClip(key, {
            volume:0.62,
            onPlay: ()=>{ if(section) section._narrated = true; }
          });
        }

        return { ctx, master, tick, whoosh, hit, setMood, speakIntro, narrate, stopNarration };
      }catch(e){ console.warn('audio engine failed', e); return null; }
    }

    btn.addEventListener('click', ()=>{
      if(!engine) engine = buildEngine();
      if(!engine) return;
      isOn = !isOn;
      btn.classList.toggle('on', isOn);
      btn.innerHTML = isOn ? svgOn() : svgOff();
      // Cinema Mode toggle — sound toggle also gates the heavy FX (audit recommendation).
      D.body.classList.toggle('cinema-on', isOn);
      if(engine.ctx.state === 'suspended') engine.ctx.resume();
      const now = engine.ctx.currentTime;
      engine.master.gain.cancelScheduledValues(now);
      engine.master.gain.setValueAtTime(engine.master.gain.value, now);
      engine.master.gain.linearRampToValueAtTime(isOn ? 0.32 : 0.0, now + 1.2);
      // Hard-stop MP3 narration when toggling off (audit fix — MP3 was bypassing master gain)
      if(!isOn) engine.stopNarration();
      if(isOn && !engine._spoken){
        engine._spoken = true;
        setTimeout(()=>engine.speakIntro(), 350);
      }
    });

    // Wire diegetic FX from custom events dispatched by other layers.
    // Lock-on throttled to ≥150ms between ticks (audit/Gemini: was popping/stuttering on fast mouse).
    let lastTick = 0;
    D.addEventListener('cine:lockon', ()=>{
      if(!engine || !isOn) return;
      const now = Date.now();
      if(now - lastTick < 150) return;
      lastTick = now;
      engine.tick();
    });
    D.addEventListener('cine:titlecard', ()=>engine && isOn && engine.whoosh());
    D.addEventListener('cine:keymoment', ()=>engine && isOn && engine.hit());
    D.addEventListener('cine:grade',     (e)=>engine && isOn && engine.setMood(e.detail));
    D.addEventListener('cine:narrate',   (e)=>engine && isOn && engine.narrate(e.detail));
  }

  /* ─── BOOT ──────────────────────────────────────────── */
  function boot(){
    mountLetterbox();
    mountHUD();
    mountChapters();
    mountGrade();
    mountGrain();
    mountVignette();
    mountSpotlightVignette();
    // mountTimecode() — REMOVED: 100ms interval writing to hidden element. Pure waste.
    // mountTrackIn() — REMOVED: was misfiring as a "popup attempt" on the hero.
    // mountChoiceModal() — REMOVED: was a second floating button competing with Talk to Jarvis.
    //                       The tour is now started from inside the Talk to Jarvis panel.
    mountLightLeaks();
    mountHeroParallax();
    mountHeroInView();
    mountCredits();
    mountSceneObserver();
    mountFullStackPin();
    // BUG#13/#14: lock-on targeting reticle DISABLED — 5 separate bugs (drifts off
    // target on scroll, tracks stale element, strobes across dense links, double
    // fit(), unthrottled reflow). Pure bug-surface for a decorative HUD bracket.
    // mountLockOn();
    mountGlitch();
    mountTitleCards();
    mountSound();
    mountTalk();
    mountColdOpen();
    // If cold open skipped, fire the done event so the hero typewriter starts.
    const url = location.href;
    const isDev = location.hostname === '127.0.0.1' || location.hostname === 'localhost' || /[?&]fresh=/.test(url);
    if((!isDev && sessionStorage.getItem(SESSION_KEY)) || REDUCED){
      window.__cineColdDone = true;
      D.dispatchEvent(new Event('cine:cold:done'));
    }
  }

  if(D.readyState === 'loading'){
    D.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
