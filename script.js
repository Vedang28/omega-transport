(function () {
  const canvas = document.getElementById("busCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1916;
  canvas.height = 1080;

  const SEQUENCES = [
    // Original intro (product showcase)
    { path: "frames/frame_",    count: 121 },
    { path: "frames-v2/frame_", count: 121 },
    { path: "frames-v3/frame_", count: 121 },
    { path: "frames-v4/frame_", count: 121 },
    // Cinematic journey: approach
    { path: "shot-01/frame_",   count: 121 },
    { path: "shot-02/frame_",   count: 121 },
    { path: "shot-03/frame_",   count: 121 },
    // Lot entry
    { path: "shot-04/frame_",   count: 121 },
    // Fleet showcase
    { path: "shot-06/frame_",   count: 121 },
    { path: "shot-07/frame_",   count: 121 },
    { path: "shot-08/frame_",   count: 121 },
    { path: "shot-09/frame_",   count: 121 },
    { path: "shot-10/frame_",   count: 121 },
    // About: campus & buildings
    { path: "shot-11/frame_",   count: 121 },
    { path: "shot-12/frame_",   count: 121 },
    // Contact: office & final
    { path: "shot-13/frame_",   count: 121 },
    { path: "shot-14/frame_",   count: 121 },
  ];

  // 17 sequences × 121 = 2057 total frames
  const TOTAL = SEQUENCES.reduce((s, v) => s + v.count, 0);
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
        img.onload = img.onerror = () => {
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
  // 2057 total frames, 17 sequences × 121 each.
  // Canvas starts at p=0.06. Frame = floor(((p-0.06)/0.94) * 2056).
  //
  // Frame layout (no dips):
  //   0-483     Product showcase (4 sequences)
  //   484-604   Shot 01 — approach
  //   605-725   Shot 02 — GTA sweep
  //   726-846   Shot 03 — cruising
  //   847-967   Shot 04 — entering lot
  //   968-1088  Shot 06 — fleet: 17-seat
  //   1089-1209 Shot 07 — fleet: 7-seat
  //   1210-1330 Shot 08 — fleet: people carrier
  //   1331-1451 Shot 09 — fleet: mercedes
  //   1452-1572 Shot 10 — driving past building
  //   1573-1693 Shot 11 — campus
  //   1694-1814 Shot 12 — arriving at office
  //   1815-1935 Shot 13 — office
  //   1936-2056 Shot 14 — final frame
  //
  // Scene boundaries (scroll %):
  //   0.281  product → journey
  //   0.447  road → lot
  //   0.503  lot → fleet
  //   0.724  fleet → about
  //   0.835  about → contact

  const STAGES = {
    title:    { in: 0.00, out: 0.08 },
    tagline:  { in: 0.10, out: 0.20 },
    callouts: { in: 0.30, out: 0.45 },
    fleet:    { in: 0.50, out: 0.72 },
    about:    { in: 0.74, out: 0.84 },
    contact:  { in: 0.85, out: 1.00 },
  };

  const ACTIVE_SECTION = {
    home:    [0, 0.50],
    fleet:   [0.50, 0.74],
    about:   [0.74, 0.85],
    contact: [0.85, 1],
  };

  // Subtle opacity dips at scene transitions (instead of black screens)
  const SCENE_DIPS = [
    { at: 0.281, half: 0.008, min: 0.15 },
    { at: 0.447, half: 0.006, min: 0.4 },
    { at: 0.503, half: 0.006, min: 0.4 },
    { at: 0.724, half: 0.006, min: 0.4 },
  ];

  function onScroll() {
    const p = getProgress();

    // ── Continuous frame playback with subtle scene dips ──
    if (p < 0.06) {
      canvas.style.opacity = "0";
      targetGlobal = 0;
    } else {
      const fp = (p - 0.06) / 0.94;
      targetGlobal = Math.min(TOTAL - 1, Math.floor(fp * (TOTAL - 1)));

      let opacity = 1;
      for (const d of SCENE_DIPS) {
        const dist = Math.abs(p - d.at);
        if (dist < d.half) {
          opacity = Math.min(opacity, d.min + (1 - d.min) * (dist / d.half));
        }
      }
      canvas.style.opacity = String(opacity);
    }

    canvas.style.transform = "translate(-50%, -50%)";

    // ── Background ──
    const sticky = document.querySelector(".journey__sticky");
    if (p < 0.10) {
      sticky.style.background = "rgb(10,12,26)";
    } else if (p < 0.18) {
      const t = (p - 0.10) / 0.08;
      const r = Math.round(10 + 235 * t);
      const g = Math.round(12 + 233 * t);
      const b = Math.round(26 + 221 * t);
      sticky.style.background = `rgb(${r},${g},${b})`;
    } else if (p < 0.27) {
      sticky.style.background = "rgb(245,245,247)";
    } else if (p < 0.285) {
      const t = (p - 0.27) / 0.015;
      const r = Math.round(245 - 235 * t);
      const g = Math.round(245 - 233 * t);
      const b = Math.round(247 - 221 * t);
      sticky.style.background = `rgb(${r},${g},${b})`;
    } else {
      sticky.style.background = "rgb(10,12,26)";
    }

    // ── Stage visibility ──
    Object.keys(STAGES).forEach(name => {
      const s = STAGES[name];
      const el = document.querySelector(`[data-stage="${name}"]`);
      if (!el) return;
      el.classList.toggle("active", p >= s.in && p <= s.out);
    });

    // ── Generic stagger helper ──
    function stagger(selector, stage) {
      const items = document.querySelectorAll(selector);
      if (p >= stage.in && p <= stage.out) {
        const sp = (p - stage.in) / (stage.out - stage.in);
        items.forEach((el, i) => {
          el.classList.toggle("visible", sp > (i / items.length) * 0.75);
        });
      } else {
        items.forEach(el => el.classList.remove("visible"));
      }
    }

    // ── Callout stagger ──
    stagger(".callout", STAGES.callouts);

    // ── Fleet stagger (heading -> intro -> coverage) ──
    stagger(".fleet-panel .section-heading, .fleet-panel .section-intro, .coverage-bar", STAGES.fleet);

    // ── Fleet vehicle swap (one card at a time, synced to video shots) ──
    const VEHICLE_RANGES = [
      { in: 0.50,  out: 0.558 },
      { in: 0.558, out: 0.613 },
      { in: 0.613, out: 0.668 },
      { in: 0.668, out: 0.723 },
    ];
    document.querySelectorAll(".vehicle-card").forEach((card, i) => {
      const r = VEHICLE_RANGES[i];
      card.classList.toggle("visible", p >= r.in && p <= r.out);
    });

    // ── About stagger (heading -> blocks -> highlights -> services) ──
    stagger(".about-panel .section-heading, .about-block, .about-highlight, .about-panel__services", STAGES.about);

    // ── Contact stagger (heading -> intro -> blocks -> CTA) ──
    stagger(".contact-panel .section-heading, .contact-panel .section-intro, .contact-block, .contact-panel__cta", STAGES.contact);

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
  const sectionMap = { home: 0, "our-fleet": 0.50, "about-us": 0.74, "contact-us": 0.85 };
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
  const dotMap = { home: 0, fleet: 0.50, about: 0.74, contact: 0.85 };
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
