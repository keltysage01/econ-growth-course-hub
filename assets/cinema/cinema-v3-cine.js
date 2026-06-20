/* ============================================================
   CINEMA V3 — "Movie Grade" additive controller
   Layers on cinema-v2 without touching it. Safe to remove.
   Kill switch: window.CINE3_OFF = true  (before this loads)
   ============================================================ */
(function () {
  "use strict";
  if (window.CINE3_OFF) return;
  if (window.__cine3) return;            // guard double-load
  window.__cine3 = true;

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(cls, html) {
    var n = document.createElement("div");
    n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }

  function boot() {
    var body = document.body;

    /* ---- 1. grain + vignette + flare overlays ---- */
    var grain = el("cine3-grain");
    var vign = el("cine3-vignette");
    var flare = el("cine3-flare");
    body.appendChild(vign);
    body.appendChild(grain);
    body.appendChild(flare);

    /* ---- 2. chapter title cards (scroll-driven, deterministic) ---- */
    var card = el("cine3-titlecard",
      '<div class="cine3-tc-num"></div>' +
      '<div class="cine3-tc-name"></div>' +
      '<div class="cine3-tc-wipe"></div>');
    body.appendChild(card);
    var numEl = card.querySelector(".cine3-tc-num");
    var nameEl = card.querySelector(".cine3-tc-name");

    var chapters = [].slice.call(
      document.querySelectorAll("section[data-chapter]")
    ).filter(function (s) {
      return (s.getAttribute("data-chapter") || "").toLowerCase() !== "open";
    });

    var hideT = null;
    function showCard(name, idx) {
      numEl.textContent = "Ch. " + ("0" + idx).slice(-2);
      nameEl.textContent = name.toUpperCase();
      card.classList.remove("show");
      void card.offsetWidth;            // restart the wipe + fade
      card.classList.add("show");
      clearTimeout(hideT);
      hideT = setTimeout(function () { card.classList.remove("show"); },
        reduce ? 1100 : 1600);
    }

    // Which chapter currently sits on the "trigger line" (42% down the viewport)?
    // Live geometry (getBoundingClientRect) — robust to the layout shifting after
    // load (fullstack pin adds 380vh). 8 rect reads/frame is cheap; the real perf
    // cost was the mix-blend overlays, already removed.
    function activeChapter() {
      var line = window.innerHeight * 0.42;
      var found = -1;
      for (var i = 0; i < chapters.length; i++) {
        var r = chapters[i].getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { found = i; }
      }
      return found;
    }

    var lastIdx = -1;
    var maxAnnounced = -1;   // BUG#5: high-water mark so each card fires ONCE
    var lastY = window.scrollY;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.scrollY;
        var goingDown = y > lastY;
        lastY = y;
        var idx = activeChapter();
        if (idx !== lastIdx) {
          // announce each chapter at most once, on first forward entry —
          // scrubbing up/down across a boundary no longer re-flashes the card.
          if (idx > maxAnnounced && goingDown && idx >= 0) {
            maxAnnounced = idx;
            var sec = chapters[idx];
            // key-moment sections (the Full Stack pin) have their own big title
            // treatment — give them the flare, NOT a colliding title card.
            if (sec.hasAttribute("data-keymoment")) {
              if (!reduce) {
                flare.classList.remove("fire");
                void flare.offsetWidth;
                flare.classList.add("fire");
              }
            } else {
              showCard(sec.getAttribute("data-chapter"), idx + 1);
            }
          }
          lastIdx = idx;
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    // BUG: also reset the scroll baseline on resize so the first post-resize
    // scroll computes direction correctly.
    window.addEventListener("resize", function () { lastIdx = activeChapter(); lastY = window.scrollY; },
      { passive: true });
    onScroll(); // prime

    /* ---- 3. end-title credit roll (built in before footer) ---- */
    function row(role, name) {
      return '<div class="cr-row"><div class="cr-role">' + role +
        '</div><div class="cr-name">' + name + "</div></div>";
    }
    var credits = el("cine3-credits",
      '<div class="cr-fin">FIN.</div>' +
      row("The Operating System", "ECON GROWTH") +
      row("Founders", "Kristopher Cravens &middot; Watson Wheeler") +
      row("Operations Layer", "Run themselves") +
      row("Marketing Layer", "Compounds") +
      row("Financial Layer", "Holds under pressure") +
      row("Flagship Product", "Command HVAC") +
      '<div class="cr-rule"></div>' +
      '<div class="cr-tag">AI Operating Systems for Serious Operators</div>');
    var footer = document.querySelector("footer") ||
      document.querySelector(".final-cta");
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(credits, footer);
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { credits.classList.add("show"); cio.disconnect(); }
        });
      }, { threshold: 0.2 });
      cio.observe(credits);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
