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
    // Dip: intro -> journey (fade out product, fade in road)
    { path: "dip-1/frame_",     count: 19 },
    // Cinematic journey: approach
    { path: "shot-01/frame_",   count: 121 },
    { path: "shot-02/frame_",   count: 121 },
    { path: "shot-03/frame_",   count: 121 },
    // Dip: road -> lot (fade out road, fade in lot)
    { path: "dip-2/frame_",     count: 19 },
    // Lot entry
    { path: "shot-04/frame_",   count: 121 },
    // Dip: direction cut (fade out lot entry, fade in fleet)
    { path: "dip-3/frame_",     count: 19 },
    // Fleet showcase
    { path: "shot-06/frame_",   count: 121 },
    { path: "shot-07/frame_",   count: 121 },
    { path: "shot-08/frame_",   count: 121 },
    { path: "shot-09/frame_",   count: 121 },
    { path: "shot-10/frame_",   count: 121 },
    // Dip: lot -> street (fade out lot, fade in campus)
    { path: "dip-4/frame_",     count: 19 },
    // About: campus & buildings
    { path: "shot-11/frame_",   count: 121 },
    { path: "shot-12/frame_",   count: 121 },
    // Contact: office & final
    { path: "shot-13/frame_",   count: 121 },
    { path: "shot-14/frame_",   count: 121 },
  ];

  const TOTAL = SEQUENCES.reduce((s, v) => s + v.count, 0); // 2133
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
  // 2108 total frames. 0% -> 100% = frame 0 -> 2107.
  //
  // Frame layout:
  //   0-483     Original intro (product showcase on white/dark bg)
  //   484-498   Dip to black (intro -> journey)
  //   499-861   Shots 1-3 (approach, GTA sweep, cruising)
  //   862-873   Dip to black (road -> lot)
  //   874-994   Shot 4 (entering lot, bus turns)
  //   995-1006  Dip to black (direction cut)
  //   1007-1611 Shots 6-10 (fleet showcase in lot)
  //   1612-1623 Dip to black (lot -> street)
  //   1624-1865 Shots 11-12 (campus, Omega Life)
  //   1866-2107 Shots 13-14 (office, final frame)

  const STAGES = {
    title:    { in: 0.00, out: 0.08 },
    tagline:  { in: 0.10, out: 0.20 },
    callouts: { in: 0.28, out: 0.44 },
    fleet:    { in: 0.51, out: 0.77 },
    about:    { in: 0.79, out: 0.89 },
    contact:  { in: 0.90, out: 1.00 },
  };

  const ACTIVE_SECTION = {
    home:    [0, 0.50],
    fleet:   [0.50, 0.79],
    about:   [0.79, 0.90],
    contact: [0.90, 1],
  };

  function onScroll() {
    const p = getProgress();

    // ── Continuous frame playback ──
    if (p < 0.06) {
      canvas.style.opacity = "0";
      targetGlobal = 0;
    } else {
      canvas.style.opacity = "1";
      const fp = (p - 0.06) / 0.94;
      targetGlobal = Math.min(TOTAL - 1, Math.floor(fp * (TOTAL - 1)));
    }

    canvas.style.transform = "translate(-50%, -50%)";

    // ── Background ──
    // Dark for intro showcase -> light for product spin -> dark for cinematic journey
    const sticky = document.querySelector(".journey__sticky");
    if (p < 0.10) {
      sticky.style.background = "rgb(10,12,26)";
    } else if (p < 0.18) {
      const t = (p - 0.10) / 0.08;
      const r = Math.round(10 + 235 * t);
      const g = Math.round(12 + 233 * t);
      const b = Math.round(26 + 221 * t);
      sticky.style.background = `rgb(${r},${g},${b})`;
    } else if (p < 0.26) {
      sticky.style.background = "rgb(245,245,247)";
    } else if (p < 0.30) {
      const t = (p - 0.26) / 0.04;
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

    // ── Fleet stagger (heading -> intro -> cards -> coverage) ──
    stagger(".fleet-panel .section-heading, .fleet-panel .section-intro, .vehicle-card, .coverage-bar", STAGES.fleet);

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
  const sectionMap = { home: 0, "our-fleet": 0.51, "about-us": 0.79, "contact-us": 0.91 };
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
  const dotMap = { home: 0, fleet: 0.51, about: 0.79, contact: 0.91 };
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
