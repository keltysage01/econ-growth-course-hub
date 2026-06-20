/* ============================================================
   CINEMA V4 — "Systems" futuristic layer (additive controller)
   Kill switch: window.SYS_OFF = true (before this loads)
   ============================================================ */
(function () {
  "use strict";
  if (window.SYS_OFF) return;
  if (window.__sys4) return;
  window.__sys4 = true;

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

    /* ---- 1. scanlines (static) ---- */
    body.appendChild(el("sys-scanlines"));
    // PERF: sweep removed — a full-screen screen-blended element animating
    // down the page every frame was a constant re-composite cost.

    /* ---- 3. telemetry ticker ---- */
    var SEP = '<span class="sys-sep">//</span>';
    var feed = [
      'SYS://ECON.OS', 'STATUS <span class="sys-hot">NOMINAL</span>',
      'UPTIME 99.98%', 'LATENCY <span class="sys-lat sys-hot">11MS</span>',
      'OPERATIONS ENGINE <span class="sys-hot">ONLINE</span>',
      'MARKETING ENGINE <span class="sys-hot">ONLINE</span>',
      'FINANCIAL ENGINE <span class="sys-hot">ONLINE</span>',
      'CLAUDE API v1 <span class="sys-hot">LINKED</span>',
      'NODES 3/3', 'THROUGHPUT 2.4K OPS/S', 'SECTOR · SERIOUS OPERATORS',
      'INSTALL MODE', 'ENCRYPTION AES-256 <span class="sys-hot">ACTIVE</span>'
    ];
    var oneLoop = feed.join(SEP) + SEP;
    var track = el("sys-ticker-track");
    track.innerHTML = oneLoop + oneLoop;   // doubled for seamless -50% loop
    var ticker = el("sys-ticker");
    ticker.appendChild(track);
    body.appendChild(ticker);

    // live latency jitter so the readout feels alive
    if (!reduce) {
      var lats = track.querySelectorAll(".sys-lat");
      setInterval(function () {
        var v = (8 + Math.floor(Math.random() * 11));
        lats.forEach(function (n) { n.textContent = v + "MS"; });
      }, 1700);
    }

    /* ---- 4. decrypting text-scramble on section headings ---- */
    var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*+=";
    function scramble(node) {
      // gather text nodes (preserves <br> + <span class=green> structure)
      var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
      var parts = [], t;
      while ((t = walker.nextNode())) {
        if (t.nodeValue.replace(/\s/g, "").length) parts.push({ n: t, f: t.nodeValue });
      }
      if (!parts.length) return;
      var total = parts.reduce(function (a, b) { return a + b.f.length; }, 0);
      var dur = Math.min(36, 16 + Math.floor(total * 0.45));
      var frame = 0;
      node.classList.add("sys-decrypting");
      (function tick() {
        var resolved = Math.floor((frame / dur) * total), seen = 0;
        parts.forEach(function (p) {
          var out = "";
          for (var i = 0; i < p.f.length; i++) {
            var ch = p.f[i];
            if (ch === " " || ch === "\n" || seen < resolved) out += ch;
            else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
            seen++;
          }
          p.n.nodeValue = out;
        });
        frame++;
        if (frame <= dur) requestAnimationFrame(tick);
        else { parts.forEach(function (p) { p.n.nodeValue = p.f; }); node.classList.remove("sys-decrypting"); }
      })();
    }

    if (!reduce && "IntersectionObserver" in window) {
      var heads = [].slice.call(document.querySelectorAll(".section-h2"))
        .filter(function (h) { return !h.closest(".fullstack-sec"); });
      // PERF/consistency: multi-step threshold + bottom margin so the decrypt
      // reliably fires on entry regardless of scroll velocity (0.45 was skipped
      // on fast scroll, making the effect feel inconsistent/glitchy).
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && e.intersectionRatio > 0) { scramble(e.target); io.unobserve(e.target); }
        });
      }, { threshold: [0, 0.15, 0.45], rootMargin: "0px 0px -10% 0px" });
      heads.forEach(function (h) { io.observe(h); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
