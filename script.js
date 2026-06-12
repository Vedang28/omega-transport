(function () {
  const canvas = document.getElementById("busCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1916;
  canvas.height = 1080;

  // 4 video sequences
  const SEQUENCES = [
    { path: "frames/frame_",      count: 121 },  // V1: hero descent
    { path: "frames-v2/frame_",   count: 121 },  // V2: drive right
    { path: "frames-v3/frame_",   count: 121 },  // V3: drive left
    { path: "frames-v4/frame_",   count: 121 },  // V4: centre + park
  ];

  const TOTAL_FRAMES = SEQUENCES.reduce((s, v) => s + v.count, 0);
  const allImages = [];
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
          if (fill) fill.style.width = ((loadedCount / TOTAL_FRAMES) * 100) + "%";
          if (loadedCount === TOTAL_FRAMES) onReady();
        };
        seq.images.push(img);
        allImages.push(img);
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
    // Find which sequence and local frame
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
  function lerp(a, b, t) { return a + (b - a) * clamp01(t); }

  // ─── SCROLL MAP ───
  //
  // 0.000 – 0.040   TITLE (no bus)
  // 0.040 – 0.180   V1 plays: hero descent (dark → white, tilted → grounded)
  // 0.180 – 0.250   TAGLINE (hold V1 last frame)
  // 0.250 – 0.320   CALLOUTS (hold V1 last frame)
  // 0.320 – 0.400   V2 plays: bus drives right
  // 0.400 – 0.520   FLEET (hold V2 last frame — bus on right)
  // 0.520 – 0.600   V3 plays: bus drives left
  // 0.600 – 0.740   ABOUT (hold V3 last frame — bus on left)
  // 0.740 – 0.820   V4 plays: bus centres + parks
  // 0.820 – 1.000   CONTACT (hold V4 last frame — bus centred)

  const V1_START = 0.040, V1_END = 0.180;
  const V2_START = 0.320, V2_END = 0.400;
  const V3_START = 0.520, V3_END = 0.600;
  const V4_START = 0.740, V4_END = 0.820;

  const STAGES = {
    title:    { in: 0.000, out: 0.055 },
    tagline:  { in: 0.170, out: 0.260 },
    callouts: { in: 0.250, out: 0.330 },
    fleet:    { in: 0.400, out: 0.530 },
    about:    { in: 0.600, out: 0.750 },
    contact:  { in: 0.820, out: 1.000 },
  };

  const ACTIVE_SECTION = {
    home:    [0, 0.400],
    fleet:   [0.400, 0.600],
    about:   [0.600, 0.820],
    contact: [0.820, 1],
  };

  function onScroll() {
    const p = getProgress();

    // ── Determine which global frame to show ──
    if (p < V1_START) {
      // Before V1: hide canvas
      canvas.style.opacity = "0";
      targetGlobal = 0;
    } else if (p <= V1_END) {
      // V1 playing
      canvas.style.opacity = "1";
      const t = (p - V1_START) / (V1_END - V1_START);
      targetGlobal = Math.min(120, Math.floor(t * 120));
    } else if (p < V2_START) {
      // Between V1 and V2: hold V1 last frame
      canvas.style.opacity = "1";
      targetGlobal = 120;
    } else if (p <= V2_END) {
      // V2 playing
      const t = (p - V2_START) / (V2_END - V2_START);
      targetGlobal = 121 + Math.min(120, Math.floor(t * 120));
    } else if (p < V3_START) {
      // Between V2 and V3: hold V2 last frame
      targetGlobal = 121 + 120;
    } else if (p <= V3_END) {
      // V3 playing
      const t = (p - V3_START) / (V3_END - V3_START);
      targetGlobal = 242 + Math.min(120, Math.floor(t * 120));
    } else if (p < V4_START) {
      // Between V3 and V4: hold V3 last frame
      targetGlobal = 242 + 120;
    } else if (p <= V4_END) {
      // V4 playing
      const t = (p - V4_START) / (V4_END - V4_START);
      targetGlobal = 363 + Math.min(120, Math.floor(t * 120));
    } else {
      // After V4: hold V4 last frame
      targetGlobal = 363 + 120;
    }

    // ── Bus scale for content sections (slightly smaller so text breathes) ──
    let scale = 1;
    if (p >= 0.400 && p < 0.820) {
      scale = 0.75;
    } else if (p >= 0.820) {
      scale = 0.65;
    } else if (p >= V2_START && p <= 0.400) {
      // Scaling down during V2 transition
      const t = (p - V2_START) / (0.400 - V2_START);
      scale = lerp(1, 0.75, t);
    }
    canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;

    // ── Background ──
    const sticky = document.querySelector(".journey__sticky");
    if (p < 0.15) {
      sticky.style.background = "rgb(10,12,26)";
    } else if (p < 0.30) {
      const t = (p - 0.15) / 0.15;
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

    // ── Stats ──
    if (p >= 0.62 && p <= 0.74) animateStats();
  }

  function getProgress() {
    const el = document.querySelector(".journey__track");
    const rect = el.getBoundingClientRect();
    const scrollable = el.offsetHeight - window.innerHeight;
    return clamp01(-rect.top / scrollable);
  }

  // Stats counter
  let statsAnimated = false;
  function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;
    document.querySelectorAll(".about-stat__num").forEach(el => {
      const target = parseInt(el.dataset.count);
      const duration = 1200;
      const start = performance.now();
      function tick(now) {
        const frac = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - frac, 3);
        if (target === 2015) {
          el.textContent = Math.round(2000 + 15 * eased);
        } else {
          el.textContent = Math.round(target * eased) + "+";
        }
        if (frac < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // Nav smooth scroll
  const sectionMap = { home: 0, "our-fleet": 0.41, "about-us": 0.61, "contact-us": 0.83 };
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
  const dotMap = { home: 0, fleet: 0.41, about: 0.61, contact: 0.83 };
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
