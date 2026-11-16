/* Altura — hero depth layout, parallax and the scroll-scrubbed walkthrough */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ramp = (v, a, b) => clamp((v - a) / (b - a));
  const smooth = (t) => t * t * (3 - 2 * t);

  /* ───────────── HERO: cover-fit the photo and pin the wordmark behind the house ───────────── */
  // Source photo is 1160×864. The wordmark ("altura", Poppins 500, stretched 2% wide) was fitted
  // on the recording: origin x=70, baseline y=418, font-size 346 in photo pixels (IoU 0.97).
  // Its lower part is hidden by the roof, which lives on the foreground layer.
  const IMG_W = 1160;
  const IMG_H = 864;
  const WORD = { x: 70, baseline: 418, size: 346 };
  const BASELINE_EM = 0.85; // Poppins: baseline offset inside a line-height:1 box

  const heroCard = document.querySelector("[data-hero]");
  const wordmark = document.querySelector("[data-wordmark]");
  const parallaxLayers = [...document.querySelectorAll("[data-parallax]")];
  let heroH = 0;

  function layoutHero() {
    const W = heroCard.clientWidth;
    const H = heroCard.clientHeight;
    heroH = H;
    const ar = IMG_W / IMG_H;
    let sw, sx, sy, fs, wx, wy;

    heroCard.classList.toggle("is-portrait", W / H < 0.95);
    if (W / H >= 0.95) {
      // desktop / landscape: classic cover, biased so the sky (and wordmark) survives on wide screens
      sw = Math.max(W, H * ar);
      const sh = sw / ar;
      sx = (W - sw) / 2;
      sy = (H - sh) * 0.3;
      const k = sw / IMG_W;
      fs = WORD.size * k;
      wx = sx + WORD.x * k;
      wy = sy + WORD.baseline * k - fs * BASELINE_EM;
    } else {
      // portrait / phones: the house sits in the upper half, the sky continues above as a gradient,
      // the photo fades into the dark card below; the wordmark is fitted to the card width
      // and tucked a little behind the roofline
      sw = W * 1.62;
      const sh = sw / ar;
      const k = sw / IMG_W;
      sx = (W - sw) * 0.5;
      sy = H * 0.43 - 380 * k;
      fs = (W * 0.9) / (2.81 * 1.02); // ink width of "altura" ≈ 2.81em with -0.023em tracking
      wx = (W - fs * 2.81 * 1.02) / 2 - fs * 0.031;
      wy = sy + 372 * k + fs * 0.07 - fs * BASELINE_EM;
    }

    const s = heroCard.style;
    s.setProperty("--sx", sx + "px");
    s.setProperty("--sy", sy + "px");
    s.setProperty("--sw", sw + "px");
    s.setProperty("--sx-shift", "0px");
    s.setProperty("--sy-shift", "0px");
    s.setProperty("--wx", wx + "px");
    s.setProperty("--wy", wy + "px");
    s.setProperty("--wfs", fs + "px");
  }

  function heroParallax(scrollY) {
    if (reduceMotion) return;
    const y = clamp(scrollY, 0, heroH * 1.2);
    // the photo travels at ~60% of the page speed, the type at 100% → letters rise out of the roof
    const t = `translate3d(0, ${(y * 0.4).toFixed(2)}px, 0)`;
    for (const el of parallaxLayers) el.style.transform = t;
  }

  /* ───────────── TOUR: canvas image sequence driven by scroll ───────────── */
  const FRAMES = 245;
  const src = (i) => `assets/tour/${String(i).padStart(3, "0")}.webp`;

  const tour = document.querySelector("[data-tour]");
  const canvas = document.querySelector("[data-canvas]");
  const ctx = canvas.getContext("2d", { alpha: false });
  const progressEl = document.querySelector("[data-progress]");
  const loaderEl = document.querySelector("[data-loader]");
  const loaderBar = loaderEl.querySelector("span");

  const images = new Array(FRAMES);
  const ready = new Uint8Array(FRAMES);
  let loaded = 0;

  function load(i) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      const done = () => {
        images[i] = img;
        ready[i] = 1;
        loaded++;
        loaderBar.style.width = ((loaded / FRAMES) * 100).toFixed(1) + "%";
        if (loaded === FRAMES) loaderEl.classList.add("is-done");
        needsDraw = true;
        resolve();
      };
      img.onload = () => (img.decode ? img.decode().catch(() => {}).then(done) : done());
      img.onerror = () => resolve();
    });
  }

  async function preload() {
    // coarse-to-fine order so any scroll position has a near frame early
    const order = [];
    const seen = new Set();
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < FRAMES; i += step) if (!seen.has(i)) (seen.add(i), order.push(i));
    }
    if (!seen.has(FRAMES - 1)) order.push(FRAMES - 1);
    let cursor = 0;
    const worker = async () => {
      while (cursor < order.length) await load(order[cursor++]);
    };
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  }

  function nearest(i) {
    if (ready[i]) return i;
    for (let d = 1; d < FRAMES; d++) {
      if (i - d >= 0 && ready[i - d]) return i - d;
      if (i + d < FRAMES && ready[i + d]) return i + d;
    }
    return -1;
  }

  let cw = 0;
  let ch = 0;
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.round(canvas.clientWidth * dpr);
    ch = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    needsDraw = true;
  }

  function drawImage(img, alpha) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih);
    const dw = iw * s;
    const dh = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function drawFrame(pos) {
    const i0 = Math.floor(pos);
    const t = pos - i0;
    const a = nearest(clamp(i0, 0, FRAMES - 1));
    if (a < 0) return;
    drawImage(images[a], 1);
    const i1 = Math.min(i0 + 1, FRAMES - 1);
    if (t > 0.02 && a === i0 && ready[i1] && i1 !== i0) drawImage(images[i1], t);
    ctx.globalAlpha = 1;
  }

  /* chapters: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in frame units */
  const CHAPTERS = {
    intro: [-1, -1, 14, 23],
    living: [50, 59, 86, 95],
    dining: [119, 129, 155, 167],
    kitchen: [188, 201, 9999, 9999],
  };
  const chapterEls = [...document.querySelectorAll("[data-chapter]")].map((el) => ({
    key: el.dataset.chapter,
    parts: [...el.querySelectorAll("[data-part]")].map((p) => ({ el: p, kind: p.dataset.part, last: -1 })),
  }));

  function visibility(range, pos, kind) {
    const [a, b, c, d] = range;
    // small type arrives a touch later and leaves a touch earlier than the title
    const lag = kind === "title" ? 0 : 1.5;
    const vin = a < 0 ? 1 : ramp(pos, a + lag, b + lag);
    const vout = 1 - ramp(pos, c - lag, d - lag);
    return smooth(clamp(Math.min(vin, vout)));
  }

  function updateChapters(pos) {
    for (const ch of chapterEls) {
      const range = CHAPTERS[ch.key];
      for (const p of ch.parts) {
        const v = Math.round(visibility(range, pos, p.kind) * 1000) / 1000;
        if (v === p.last) continue;
        p.last = v;
        p.el.style.opacity = v;
        p.el.style.filter = v >= 0.999 ? "none" : `blur(${((1 - v) * 14).toFixed(2)}px)`;
        p.el.style.visibility = v <= 0.001 ? "hidden" : "visible";
      }
    }
  }

  /* ───────────── scroll loop with a little inertia (cinematic scrub) ───────────── */
  let target = 0;
  let current = 0;
  let needsDraw = true;
  let tourTop = 0;
  let tourRange = 1;

  function measure() {
    const r = tour.getBoundingClientRect();
    tourTop = r.top + window.scrollY;
    tourRange = Math.max(1, tour.offsetHeight - window.innerHeight);
  }

  function readScroll() {
    const y = window.scrollY;
    const p = clamp((y - tourTop) / tourRange);
    target = p * (FRAMES - 1);
    heroParallax(y);
  }

  function tick() {
    const diff = target - current;
    if (Math.abs(diff) > 0.001) {
      current += reduceMotion ? diff : diff * 0.14;
      if (Math.abs(target - current) < 0.002) current = target;
      needsDraw = true;
    }
    if (needsDraw) {
      needsDraw = false;
      drawFrame(current);
      updateChapters(current);
      progressEl.style.width = ((current / (FRAMES - 1)) * 100).toFixed(2) + "%";
    }
    requestAnimationFrame(tick);
  }

  /* ───────────── play button: glide through the whole take ───────────── */
  let autoplay = null;
  function play() {
    const startY = window.scrollY;
    const endY = tourTop + tourRange;
    const startP = clamp((startY - tourTop) / tourRange);
    const duration = 14000 * (1 - startP) + 800;
    const t0 = performance.now();
    const stop = () => {
      cancelAnimationFrame(autoplay);
      autoplay = null;
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    const step = (now) => {
      const t = clamp((now - t0) / duration);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo(0, startY + (endY - startY) * e);
      if (t < 1) autoplay = requestAnimationFrame(step);
      else stop();
    };
    autoplay = requestAnimationFrame(step);
  }
  document.querySelector("[data-play]").addEventListener("click", play);

  /* ───────────── boot ───────────── */
  function onResize() {
    layoutHero();
    sizeCanvas();
    measure();
    readScroll();
  }

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", readScroll, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  onResize();
  current = target;
  load(0).then(() => {
    needsDraw = true;
    preload();
  });
  requestAnimationFrame(tick);
})();
