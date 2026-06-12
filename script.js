(function () {
  const canvas = document.getElementById("busCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1916;
  canvas.height = 1080;

  const SEQUENCES = [
    { path: "frames/frame_",    count: 121 },
    { path: "frames-v2/frame_", count: 121 },
    { path: "frames-v3/frame_", count: 121 },
    { path: "frames-v4/frame_", count: 121 },
  ];

  const TOTAL = SEQUENCES.reduce((s, v) => s + v.count, 0); // 484
  let loadedCount = 0;
  let currentDrawn = -1;
  let targetGlobal = 0;

  // Loader
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.innerHTML = '<div class="loader__inner"><p>Omega Transport</p><div class="loader__bar"><div class="loader__fill"></div></div></div>';
  document.body.appendChild(loader);

  function preloadAll() {
    SEQUENCES.forEach(seq => {
      seq.images = [];
      for (let i = 1; i <= seq.count; i++) {
        const img = new Image();
        img.src = `${seq.path}${String(i).padStart(4, "0")}.jpg`;
        img.onload = () => {
          loadedCount++;
          const fill = loader.querySelector(".loader__fill");
          if (fill) fill.style.width = ((loadedCount / TOTAL) * 100) + "%";
          if (loadedCount === TOTAL) onReady();
        };
        seq.images.push(img);
      }
    });
  }

  function onReady() {
    drawGlobalFrame(0);
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(renderLoop);
    onScroll();
  }

  function drawGlobalFrame(globalIdx) {
    if (globalIdx === currentDrawn) return;
    let remaining = globalIdx;
    for (const seq of SEQUENCES) {
      if (remaining < seq.count) {
        const img = seq.images[remaining];
        if (img && img.complete) {
          ctx.drawImage(img, 0, 0, 1916, 1080);
          currentDrawn = globalIdx;
        }
        return;
      }
      remaining -= seq.count;
    }
  }

  function renderLoop() {
    drawGlobalFrame(targetGlobal);
    requestAnimationFrame(renderLoop);
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // ─── SCROLL MAP ───
  // One continuous motion. 0% → 100% = frame 0 → frame 483.
  // Content fades in/out at specific scroll ranges WHILE the bus keeps moving.
  //
  // 0.00 – 0.06   Title only (bus hidden, about to enter)
  // 0.06 – 1.00   Bus plays continuously, never stops
  //
  // Content overlays (appear/disappear while bus moves):
  // 0.00 – 0.08   Title: "OMEGA TRANSPORT"
  // 0.12 – 0.22   Tagline
  // 0.22 – 0.34   Callouts
  // 0.38 – 0.54   Our Fleet
  // 0.58 – 0.76   About Us
  // 0.80 – 1.00   Contact Us

  const STAGES = {
    title:    { in: 0.00, out: 0.08 },
    tagline:  { in: 0.12, out: 0.22 },
    callouts: { in: 0.22, out: 0.34 },
    fleet:    { in: 0.38, out: 0.54 },
    about:    { in: 0.58, out: 0.76 },
    contact:  { in: 0.80, out: 1.00 },
  };

  const ACTIVE_SECTION = {
    home:    [0, 0.38],
    fleet:   [0.38, 0.58],
    about:   [0.58, 0.80],
    contact: [0.80, 1],
  };

  function onScroll() {
    const p = getProgress();

    // ── Continuous frame playback ──
    // Title-only zone: bus hidden
    if (p < 0.06) {
      canvas.style.opacity = "0";
      targetGlobal = 0;
    } else {
      canvas.style.opacity = "1";
      // Map 0.06–1.0 to frame 0–483
      const fp = (p - 0.06) / 0.94;
      targetGlobal = Math.min(TOTAL - 1, Math.floor(fp * (TOTAL - 1)));
    }

    // No transform — bus stays full size, centred, always
    canvas.style.transform = "translate(-50%, -50%)";

    // ── Background ──
    const sticky = document.querySelector(".journey__sticky");
    if (p < 0.10) {
      sticky.style.background = "rgb(10,12,26)";
    } else if (p < 0.22) {
      const t = (p - 0.10) / 0.12;
      const r = Math.round(10 + 235 * t);
      const g = Math.round(12 + 233 * t);
      const b = Math.round(26 + 221 * t);
      sticky.style.background = `rgb(${r},${g},${b})`;
    } else {
      sticky.style.background = "rgb(245,245,247)";
    }

    // ── Stage visibility ──
    Object.keys(STAGES).forEach(name => {
      const s = STAGES[name];
      const el = document.querySelector(`[data-stage="${name}"]`);
      if (!el) return;
      el.classList.toggle("active", p >= s.in && p <= s.out);
    });

    // ── Callout stagger ──
    if (p >= STAGES.callouts.in && p <= STAGES.callouts.out) {
      const cp = (p - STAGES.callouts.in) / (STAGES.callouts.out - STAGES.callouts.in);
      document.querySelectorAll(".callout").forEach((c, i) => {
        c.classList.toggle("visible", cp > i * 0.2);
      });
    } else {
      document.querySelectorAll(".callout").forEach(c => c.classList.remove("visible"));
    }

    // ── Nav + dots ──
    document.querySelectorAll(".nav__link").forEach(link => {
      const sec = link.dataset.section;
      const range = ACTIVE_SECTION[sec];
      if (range) link.classList.toggle("active", p >= range[0] && p < range[1]);
    });
    document.querySelectorAll(".dot").forEach(dot => {
      const sec = dot.dataset.section;
      const range = ACTIVE_SECTION[sec];
      if (range) dot.classList.toggle("active", p >= range[0] && p < range[1]);
    });
    document.querySelector(".nav").classList.toggle("nav--scrolled", p > 0.03);

    // ── Scroll hint ──
    const hint = document.querySelector(".scroll-hint");
    if (hint) hint.style.opacity = p < 0.025 ? "1" : "0";
  }

  function getProgress() {
    const el = document.querySelector(".journey__track");
    const rect = el.getBoundingClientRect();
    const scrollable = el.offsetHeight - window.innerHeight;
    return clamp01(-rect.top / scrollable);
  }

  // Nav smooth scroll
  const sectionMap = { home: 0, "our-fleet": 0.39, "about-us": 0.59, "contact-us": 0.81 };
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const id = link.getAttribute("href").slice(1);
      const targetP = sectionMap[id];
      if (targetP !== undefined) {
        const track = document.querySelector(".journey__track");
        const scrollable = track.offsetHeight - window.innerHeight;
        window.scrollTo({ top: targetP * scrollable, behavior: "smooth" });
      }
    });
  });

  // Dots click
  const dotMap = { home: 0, fleet: 0.39, about: 0.59, contact: 0.81 };
  document.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const targetP = dotMap[dot.dataset.section];
      if (targetP !== undefined) {
        const track = document.querySelector(".journey__track");
        const scrollable = track.offsetHeight - window.innerHeight;
        window.scrollTo({ top: targetP * scrollable, behavior: "smooth" });
      }
    });
  });

  preloadAll();
})();
