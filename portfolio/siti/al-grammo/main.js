/* Al Grammo — hero depth layout, live scale displays and the two scroll-driven scenes.
   Vanilla JS, no libraries: the page stays complete even if nothing here runs. */
(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const isWebKit = /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Android/.test(navigator.userAgent);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const nf = (d) => new Intl.NumberFormat("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
  const f0 = nf(0);
  const f1 = nf(1);
  const f2 = nf(2);

  /* ───────────── seven-segment displays (drawn, so they stay sharp at any size) ───────────── */
  const CW = 60;
  const CH = 100;
  const T = 11;
  const G = 2.2;
  const hseg = (x1, x2, y) => `${x1},${y} ${x1 + T / 2},${y - T / 2} ${x2 - T / 2},${y - T / 2} ${x2},${y} ${x2 - T / 2},${y + T / 2} ${x1 + T / 2},${y + T / 2}`;
  const vseg = (x, y1, y2) => `${x},${y1} ${x + T / 2},${y1 + T / 2} ${x + T / 2},${y2 - T / 2} ${x},${y2} ${x - T / 2},${y2 - T / 2} ${x - T / 2},${y1 + T / 2}`;
  const SEG = {
    a: hseg(T / 2 + G, CW - T / 2 - G, T / 2),
    g: hseg(T / 2 + G, CW - T / 2 - G, CH / 2),
    d: hseg(T / 2 + G, CW - T / 2 - G, CH - T / 2),
    f: vseg(T / 2, T / 2 + G, CH / 2 - G),
    b: vseg(CW - T / 2, T / 2 + G, CH / 2 - G),
    e: vseg(T / 2, CH / 2 + G, CH - T / 2 - G),
    c: vseg(CW - T / 2, CH / 2 + G, CH - T / 2 - G),
  };
  const DIGIT = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", " ": "" };

  function makeLCD(el, n, unit, opts = {}) {
    if (!el) return () => {};
    const pitch = opts.pitch || 74;
    const skew = opts.skew ?? -6;
    const digitsW = n * pitch - (pitch - CW);
    const vw = digitsW + (unit ? 44 : 0);
    const vh = CH + 8 + (opts.dot ? 18 : 0);
    let svg = `<svg viewBox="-6 -4 ${vw + 12} ${vh}" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">`;
    if (opts.dot) svg += `<rect class="led-dot" x="${opts.dot[0]}" y="${opts.dot[1]}" width="14" height="15" rx="2" fill="currentColor"/>`;
    for (let i = 0; i < n; i++) {
      svg += `<g transform="translate(${i * pitch + 6} 0) skewX(${skew})">`;
      for (const k of "abcdefg") svg += `<polygon class="seg" data-s="${k}" points="${SEG[k]}"/>`;
      svg += "</g>";
    }
    if (unit) svg += `<text x="${digitsW + 10}" y="${CH - 2}" font-family="Geist Mono, ui-monospace, monospace" font-size="40" fill="currentColor">${unit}</text>`;
    el.innerHTML = svg + "</svg>";
    const cells = [...el.querySelectorAll("g")].map((g) => [...g.children]);
    let last = "";
    return (value) => {
      const s = String(Math.max(0, Math.round(value))).padStart(n, " ").slice(-n);
      if (s === last) return;
      last = s;
      cells.forEach((polys, i) => {
        const on = DIGIT[s[i]] || "";
        for (const p of polys) p.classList.toggle("on", on.includes(p.dataset.s));
      });
    };
  }

  /* ───────────── 1. HERO: photo, name behind the bowl, live scale ───────────── */
  // Photo coordinates (original 1179×1580): bowl centre x 560, rim top y 540,
  // foreground strip rows 530–811, LCD face 424–620 × 1048–1104. The wide image is the
  // same photo (rows 250–1200) placed at x +640, with blurred sides for landscape screens.
  const heroCard = document.querySelector("[data-hero]");
  const photo = document.querySelector("[data-hero-photo]");
  const fg = document.querySelector("[data-hero-fg]");
  const mask = document.querySelector("[data-word-mask]");
  const word = document.querySelector("[data-word]");
  const wordShadow = document.querySelector("[data-word-shadow]");
  const heroLcdEl = document.querySelector("[data-hero-lcd]");
  const heroLCD = makeLCD(heroLcdEl, 3, "g");
  const BASELINE = 598;
  const parallax = !reduce && !touch && !isWebKit;

  let metrics = { ink: 3.77, left: -0.02, asc: 0.672, fromBottom: 0.17 };
  function measureWord() {
    const c = document.createElement("canvas").getContext("2d");
    c.font = '800 condensed 1000px "Bricolage Grotesque"';
    if ("fontStretch" in c) c.fontStretch = "condensed";
    if ("letterSpacing" in c) c.letterSpacing = "-20px";
    const m = c.measureText(word.textContent);
    if (!m.actualBoundingBoxRight) return;
    const fa = m.fontBoundingBoxAscent / 1000 || 0.93;
    const fd = m.fontBoundingBoxDescent / 1000 || 0.27;
    metrics = {
      ink: (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) / 1000,
      left: -m.actualBoundingBoxLeft / 1000,
      asc: c.measureText("H").actualBoundingBoxAscent / 1000 || 0.672,
      fromBottom: 1 - ((1 - (fa + fd)) / 2 + fa),
    };
    // Width comes from the rendered heading itself: Safari's canvas ignores "condensed" and
    // measured the normal-width face, which made the name small and pushed it to the left.
    const prev = word.style.fontSize;
    word.style.fontSize = "100px";
    const adv = word.getBoundingClientRect().width / 100;
    word.style.fontSize = prev;
    if (adv > 1) {
      metrics.ink = adv + 0.02; // the last letter carries -0.02em of tracking
      metrics.left = 0;
    }
  }

  let heroH = 0;
  let layout = null;
  function layoutHero() {
    const W = heroCard.clientWidth;
    const H = heroCard.clientHeight;
    heroH = H;
    const tall = /hero-tall/.test(photo.currentSrc || photo.src);
    let k;
    let ox;
    let oy;
    let imgX;
    let imgY;
    let imgW;
    let imgH;
    if (tall) {
      k = Math.max(H / 1580, W / 1100);
      imgW = 1179 * k;
      imgH = 1580 * k;
      imgX = clamp(W / 2 - 560 * k, W - imgW, 0);
      imgY = clamp(H * 0.5 - 760 * k, H - imgH, 0);
      ox = imgX;
      oy = imgY;
    } else {
      k = Math.max(H / 950, W / 2400);
      imgW = 2400 * k;
      imgH = 950 * k;
      imgX = clamp(W / 2 - 1200 * k, W - imgW, 0);
      imgY = clamp(H * 0.5 - 475 * k, H - imgH, 0);
      ox = imgX + 640 * k;
      oy = imgY - 250 * k;
    }
    const place = (el, x, y, w, h) => {
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.width = w + "px";
      if (h != null) el.style.height = h + "px";
    };
    place(photo, imgX, imgY, imgW, imgH);
    place(fg, ox, oy + 530 * k, 1179 * k, 281 * k);
    place(heroLcdEl, ox + 424 * k, oy + 1048 * k, 196 * k, 56 * k);

    // wordmark: as wide as the card allows, ascenders kept clear of the chips
    const base = oy + BASELINE * k;
    const topLimit = W < 720 ? 116 : 136;
    const F = Math.max(28, Math.min((W * 0.92) / metrics.ink, (base - topLimit) / metrics.asc));
    for (const el of [word, wordShadow]) {
      el.style.fontSize = F + "px";
      el.style.left = W / 2 - (metrics.ink * F) / 2 - metrics.left * F + "px";
      el.style.bottom = "2px";
    }
    wordShadow.style.setProperty("--sb", (F * 0.035).toFixed(1) + "px");
    wordF = F;
    updateShadow();
    place(mask, 0, 0, W, base + metrics.fromBottom * F + 2);
    layout = { k };
  }

  // the shadow falls away from the light: the window on the left, the cursor on desktop,
  // and it grows longer as the page scrolls (like the sun moving)
  let wordF = 0;
  let lightX = 0;
  let lightY = 0;
  let scrollK = 0;
  let shadowKey = "";
  function updateShadow() {
    if (!wordF) return;
    const sx = wordF * (0.075 + 0.12 * scrollK - 0.08 * lightX);
    const sy = wordF * (0.07 + 0.06 * scrollK - 0.05 * lightY);
    const key = sx.toFixed(1) + "|" + sy.toFixed(1);
    if (key === shadowKey) return;
    shadowKey = key;
    wordShadow.style.setProperty("--sx", key.split("|")[0] + "px");
    wordShadow.style.setProperty("--sy", key.split("|")[1] + "px");
  }
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    let pending = false;
    heroCard.addEventListener("pointermove", (e) => {
      const r = heroCard.getBoundingClientRect();
      lightX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      lightY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          updateShadow();
        });
      }
    });
    heroCard.addEventListener("pointerleave", () => {
      lightX = lightY = 0;
      updateShadow();
    });
  }

  function heroParallax(y) {
    if (!parallax) return;
    const t = `translate3d(0, ${(clamp(y, 0, heroH) * 0.35).toFixed(1)}px, 0)`;
    photo.style.transform = t;
    fg.style.transform = t;
    heroLcdEl.style.transform = t;
  }

  // the scale "settles" like a real one: overshoot, back, then the final reading
  function countHero() {
    const keys = [
      [0, 0],
      [350, 0],
      [950, 341],
      [1100, 356],
      [1250, 347],
      [1400, 350],
    ];
    if (reduce) return heroLCD(350);
    const t0 = performance.now();
    const step = (now) => {
      const t = now - t0;
      let v = keys[keys.length - 1][1];
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          const [ta, va] = keys[i - 1];
          const [tb, vb] = keys[i];
          v = va + (vb - va) * easeOut((t - ta) / (tb - ta));
          break;
        }
      }
      heroLCD(v);
      if (t < keys[keys.length - 1][0]) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  heroLCD(0);

  /* ───────────── 2. LA BILANCIA: the real pour, scrubbed by scroll ───────────── */
  // 96 frames (every other frame of the clip, 864 × 1486). The scale's LED digits were removed
  // from the frames and are drawn here, so they never flicker. Readings are the real ones read
  // off the display: 0 → 5 → 40 → 46 → 49 → 62 g.
  const weigh = document.querySelector("[data-weigh]");
  const pour = document.querySelector("[data-pour]");
  const frameLayer = document.querySelector("[data-frames]");
  const lcdEl = document.querySelector("[data-pour-lcd]");
  const monitor = document.querySelector("[data-monitor]");
  const pourLCD = makeLCD(lcdEl, 3, null, { pitch: 58, skew: -8 });
  const SEQ = { count: 96, path: "img/pesata/", srcW: 1026, w: 864, h: 1486 };
  const READINGS = [[0, 0], [42.5, 5], [47, 40], [59, 46], [71, 49], [81.5, 62]]; // [frame, grams]
  const PACE = [[0, 0], [0.1, 28], [0.8, 86], [1, 95]]; // [scroll progress, frame]: slow over the pour
  // per gram, mirtilli freschi: 57 kcal, 0,74 P, 14,5 C, 0,33 G per 100 g. Price: the menu's
  // "mix di frutta" (150 g a 4,00 €), to be confirmed with the client.
  const FOOD = { kcal: 0.57, p: 0.0074, c: 0.145, f: 0.0033, eur: 4.0 / 150 };
  const row = monitor.querySelector('[data-row="mirtilli"]');
  const rowG = row.querySelector("[data-g]");
  const rowEur = row.querySelector("[data-eur]");
  const totals = Object.fromEntries([...monitor.querySelectorAll("[data-total]")].map((el) => [el.dataset.total, el]));
  const lastTotals = {};
  const setText = (el, key, store, text) => {
    if (store[key] !== text) {
      store[key] = text;
      el.textContent = text;
    }
  };
  const lerpKeys = (keys, x) => {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (x <= keys[i][0]) {
        const [x0, y0] = keys[i - 1];
        const [x1, y1] = keys[i];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    }
    return keys[keys.length - 1][1];
  };
  const gramsAt = (n) => {
    let g = 0;
    for (const [f, v] of READINGS) if (n >= f) g = v;
    return g;
  };

  // frame player: frames stay compressed, a small window around the position is decoded into
  // <img> layers and only the visible one is shown (GPU composited, no per-frame painting)
  const MAXDEC = touch ? 12 : 30;
  const blobs = new Array(SEQ.count);
  const decoded = new Map();
  const decoding = new Set();
  const url = (i) => `${SEQ.path}${String(i).padStart(3, "0")}.webp`;
  let shownImg = null;
  let curFrame = 0;
  async function fetchFrame(i) {
    if (blobs[i] !== undefined) return;
    blobs[i] = null;
    try {
      const r = await fetch(url(i));
      if (r.ok) blobs[i] = await r.blob();
    } catch (e) {
      /* offline: the poster stays */
    }
    if (Math.abs(i - curFrame) < 4) wantFrames(curFrame);
  }
  let fetching = false;
  async function fetchAll() {
    if (fetching) return;
    fetching = true;
    const order = [];
    const seen = new Set();
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < SEQ.count; i += step) if (!seen.has(i)) (seen.add(i), order.push(i));
    let k = 0;
    const worker = async () => {
      while (k < order.length) await fetchFrame(order[k++]);
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }
  async function decodeFrame(i) {
    if (i < 0 || i >= SEQ.count || decoded.has(i) || decoding.has(i) || !blobs[i]) return;
    decoding.add(i);
    const img = new Image();
    img.className = "pour-frame";
    img.alt = "";
    img.decoding = "async";
    img.src = URL.createObjectURL(blobs[i]);
    try {
      await img.decode();
      frameLayer.appendChild(img);
      decoded.set(i, img);
      while (decoded.size > MAXDEC) {
        let far = -1;
        let fd = -1;
        for (const key of decoded.keys()) {
          const d = Math.abs(key - curFrame);
          if (d > fd) (fd = d), (far = key);
        }
        const old = decoded.get(far);
        decoded.delete(far);
        if (old === shownImg) shownImg = null;
        old.remove();
        URL.revokeObjectURL(old.src);
      }
      if (scenes[0]) {
        scenes[0].dirty = true;
        kick();
      }
    } catch (e) {
      URL.revokeObjectURL(img.src);
    } finally {
      decoding.delete(i);
    }
  }
  let lastDir = 1;
  let lastN = 0;
  function wantFrames(n) {
    const i = Math.round(n);
    lastDir = n >= lastN ? 1 : -1;
    lastN = n;
    decodeFrame(i);
    for (let d = 1; d <= (touch ? 5 : 8); d++) decodeFrame(i + d * lastDir);
    decodeFrame(i - lastDir);
  }
  function showFrame(n) {
    const i = Math.round(n);
    let img = decoded.get(i);
    if (!img) {
      let best = -1;
      let bd = Infinity;
      for (const key of decoded.keys()) {
        const d = Math.abs(key - i);
        if (d < bd) (bd = d), (best = key);
      }
      img = decoded.get(best);
    }
    if (!img || img === shownImg) return;
    img.style.visibility = "visible";
    if (shownImg) shownImg.style.visibility = "hidden";
    shownImg = img;
  }

  // the LED overlay follows the cover-fitted frame
  function layoutPour() {
    const bw = pour.clientWidth;
    const bh = pour.clientHeight;
    const s = Math.max(bw / SEQ.w, bh / SEQ.h);
    const k = (SEQ.w / SEQ.srcW) * s;
    const ox = (bw - SEQ.w * s) / 2;
    const oy = (bh - SEQ.h * s) / 2;
    // digit box measured on the clip (source pixels): 3 digits, ones digit right edge at x 674
    const st = lcdEl.style;
    st.left = ox + 504.7 * k + "px";
    st.top = oy + 1179.3 * k + "px";
    st.width = 188 * 0.93 * k + "px";
    st.height = 114 * 0.93 * k + "px";
  }

  function renderWeigh(p) {
    const n = lerpKeys(PACE, p);
    curFrame = Math.round(n);
    wantFrames(n);
    showFrame(n);
    const g = gramsAt(n);
    pourLCD(g);
    setText(rowG, "g", lastTotals, `${g} g`);
    setText(rowEur, "re", lastTotals, `${f2.format(g * FOOD.eur)} €`);
    const state = g === 0 ? "" : g >= 62 ? "is-done" : "is-active";
    if (lastTotals.state !== state) {
      lastTotals.state = state;
      row.className = state;
    }
    setText(totals.g, "g2", lastTotals, `${g} g`);
    setText(totals.kcal, "kcal", lastTotals, `${f0.format(g * FOOD.kcal)} kcal`);
    setText(totals.p, "p", lastTotals, `${f1.format(g * FOOD.p)} g`);
    setText(totals.c, "c", lastTotals, `${f1.format(g * FOOD.c)} g`);
    setText(totals.f, "f", lastTotals, `${f1.format(g * FOOD.f)} g`);
    setText(totals.eur, "eur", lastTotals, `${f2.format(g * FOOD.eur)} €`);
    monitor.classList.toggle("is-complete", g >= 62);
  }

  /* ───────────── 3. LE BOWL ───────────── */
  const bowlsSec = document.querySelector("[data-bowls]");
  const bowlImgs = [...document.querySelectorAll("[data-bowl-img]")];
  const bowlTexts = [...document.querySelectorAll("[data-bowl-text]")];
  const bowlBgs = [...document.querySelectorAll("[data-bg]")];
  const NB = bowlImgs.length;
  const bowlStore = bowlImgs.map(() => ({}));

  function renderBowls(p, W) {
    // holds on each bowl with smooth hand-overs in between
    const q = clamp(p * (NB - 1 + 0.6) - 0.3, 0, NB - 1);
    const k = Math.min(NB - 2, Math.floor(q));
    const s = k + smooth(clamp((q - k - 0.3) / 0.4));
    const portrait = W / window.innerHeight < 0.95;
    const travel = portrait ? W * 0.9 : W * 0.5;
    for (let i = 0; i < NB; i++) {
      const d = i - s;
      const ad = Math.abs(d);
      const st = bowlStore[i];
      const tr = `translate3d(${(d * travel).toFixed(1)}px,0,0) rotate(${(-d * 75 + s * 28).toFixed(2)}deg) scale(${(1 - Math.min(1, ad) * 0.28).toFixed(3)})`;
      if (st.tr !== tr) {
        st.tr = tr;
        bowlImgs[i].style.transform = tr;
      }
      const o = (1 - clamp((ad - 0.12) / 0.5)).toFixed(3);
      if (st.o !== o) {
        st.o = o;
        bowlImgs[i].style.opacity = o;
      }
      const v = Math.round(clamp(1 - ad * 2.4) * 40) / 40;
      if (st.v !== v) {
        st.v = v;
        const el = bowlTexts[i].style;
        el.opacity = v;
        el.visibility = v <= 0 ? "hidden" : "visible";
        el.transform = `translateY(${((1 - v) * 14).toFixed(1)}px)`;
        el.filter = touch || v >= 1 ? "none" : `blur(${((1 - v) * 8).toFixed(1)}px)`;
      }
      const bo = clamp(1 - ad).toFixed(3);
      if (st.bo !== bo) {
        st.bo = bo;
        bowlBgs[i].style.opacity = bo;
      }
    }
  }

  /* ───────────── scroll loop: smoothed, and asleep when nothing moves ───────────── */
  const scenes = [
    { el: weigh, render: (p) => renderWeigh(p), goal: 0, cur: 0, top: 0, range: 1 },
    { el: bowlsSec, render: (p) => renderBowls(p, bowlsSec.clientWidth), goal: 0, cur: 0, top: 0, range: 1 },
  ];
  const mobileCta = document.querySelector("[data-mobile-cta]");
  const visit = document.querySelector("#dove");
  let visitTop = 0;
  let running = false;

  function measure() {
    for (const sc of scenes) {
      const r = sc.el.getBoundingClientRect();
      sc.top = r.top + window.scrollY;
      sc.range = Math.max(1, sc.el.offsetHeight - window.innerHeight);
    }
    visitTop = visit.getBoundingClientRect().top + window.scrollY;
  }

  function readScroll() {
    const y = window.scrollY;
    for (const sc of scenes) sc.goal = clamp((y - sc.top) / sc.range);
    heroParallax(y);
    if (!reduce) {
      const k = Math.round(clamp(y / Math.max(1, heroH)) * 50) / 50;
      if (k !== scrollK) {
        scrollK = k;
        updateShadow();
      }
    }
    if (mobileCta) {
      const inScene = scenes.some((sc) => y >= sc.top - window.innerHeight * 0.3 && y <= sc.top + sc.range + window.innerHeight * 0.2);
      mobileCta.classList.toggle("is-on", y > heroH * 0.7 && !inScene && y + window.innerHeight * 0.75 < visitTop);
    }
    kick();
  }

  function kick() {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  function tick() {
    let moving = false;
    for (const sc of scenes) {
      const d = sc.goal - sc.cur;
      if (Math.abs(d) > 0.00005 || sc.dirty) {
        sc.cur = reduce ? sc.goal : Math.abs(d) < 0.0002 ? sc.goal : sc.cur + d * (touch ? 0.32 : 0.16);
        sc.dirty = false;
        sc.render(sc.cur);
        if (sc.cur !== sc.goal) moving = true;
      }
    }
    if (moving) requestAnimationFrame(tick);
    else running = false;
  }

  /* ───────────── boot ───────────── */
  function onResize() {
    layoutHero();
    layoutPour();
    measure();
    for (const sc of scenes) sc.dirty = true;
    readScroll();
  }

  let rt = 0;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(rt);
      rt = setTimeout(onResize, 120);
    },
    { passive: true }
  );
  window.addEventListener("orientationchange", () => setTimeout(onResize, 300));
  window.addEventListener("scroll", readScroll, { passive: true });
  photo.addEventListener("load", onResize);

  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([
        document.fonts.load('800 condensed 100px "Bricolage Grotesque"'),
        document.fonts.load('400 100px "Hanken Grotesk"'),
        document.fonts.load('400 100px "Geist Mono"'),
      ]).catch(() => {})
    : Promise.resolve();
  const photoReady = photo.decode ? photo.decode().catch(() => {}) : Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, 2500)); // never keep the hero waiting

  if (document.fonts && document.fonts.addEventListener) {
    // a slow font that arrives after the first layout: measure again
    document.fonts.addEventListener("loadingdone", () => {
      measureWord();
      layoutHero();
    });
  }
  Promise.race([Promise.all([fontsReady, photoReady]), timeout]).then(() => {
    measureWord();
    onResize();
    fetchFrame(0).then(() => fetchAll());
    requestAnimationFrame(() => {
      heroCard.classList.add("is-in");
      setTimeout(countHero, reduce ? 0 : 450);
    });
  });

  if (reduce) {
    // final states, no scroll-driven motion: last frame, final reading
    fetchFrame(SEQ.count - 1).then(() => decodeFrame(SEQ.count - 1)).then(() => renderWeigh(1));
    renderWeigh(1);
    scenes.length = 0;
  }
  onResize();
  for (const sc of scenes) sc.cur = sc.goal;
  for (const sc of scenes) sc.render(sc.cur);
})();
