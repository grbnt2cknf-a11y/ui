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

  function makeLCD(el, n, unit) {
    if (!el) return () => {};
    const pitch = 74;
    const digitsW = n * pitch - (pitch - CW);
    const vw = digitsW + (unit ? 44 : 0);
    let svg = `<svg viewBox="-6 -4 ${vw + 12} ${CH + 8}" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">`;
    for (let i = 0; i < n; i++) {
      svg += `<g transform="translate(${i * pitch + 6} 0) skewX(-6)">`;
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

  /* ───────────── 2. LA BILANCIA ───────────── */
  const weigh = document.querySelector("[data-weigh]");
  const rig = document.querySelector("[data-rig]");
  const plane = document.querySelector("[data-plane]");
  const monitor = document.querySelector("[data-monitor]");
  const scaleLCD = makeLCD(document.querySelector("[data-scale-lcd]"), 3, "g");
  const ITEMS = [
    { id: "pasta", g: 160, kcal: 253, p: 9.3, c: 49.6, f: 1.4, eur: 3.84, win: [0.08, 0.27] },
    { id: "pollo", g: 150, kcal: 248, p: 46.5, c: 0, f: 5.4, eur: 3.6, win: [0.29, 0.48] },
    { id: "peperoni", g: 100, kcal: 38, p: 1.0, c: 4.8, f: 1.7, eur: 2.4, win: [0.5, 0.67] },
    { id: "salsa", g: 20, kcal: 14, p: 0.8, c: 1.2, f: 0.7, eur: 0.64, win: [0.69, 0.82] },
  ].map((it) => ({
    ...it,
    img: plane.querySelector(`[data-item="${it.id}"]`),
    shadow: plane.querySelector(`[data-shadow="${it.id}"]`),
    row: monitor.querySelector(`[data-row="${it.id}"]`),
    rowG: monitor.querySelector(`[data-row="${it.id}"] [data-g]`),
    last: {},
  }));
  const totals = Object.fromEntries([...monitor.querySelectorAll("[data-total]")].map((el) => [el.dataset.total, el]));
  const lastTotals = {};
  const setText = (el, key, store, text) => {
    if (store[key] !== text) {
      store[key] = text;
      el.textContent = text;
    }
  };
  const setVar = (el, name, value, store) => {
    const v = typeof value === "number" ? value.toFixed(3) : value;
    if (store[name] !== v) {
      store[name] = v;
      el.style.setProperty(name, v);
    }
  };
  const rigStore = {};

  function renderWeigh(p) {
    let sumG = 0;
    const sum = { kcal: 0, p: 0, c: 0, f: 0, eur: 0 };
    for (const it of ITEMS) {
      const t = clamp((p - it.win[0]) / (it.win[1] - it.win[0]));
      const fall = clamp(t / 0.55);
      const e = easeOut(fall);
      // a small squash when it lands, then still
      const land = t > 0.55 ? Math.sin(Math.PI * clamp((t - 0.55) / 0.16)) : 0;
      setVar(it.img, "--k", (1 + 0.6 * (1 - e)) * (1 - 0.022 * land), it.last);
      setVar(it.img, "--rr", `${(14 * (1 - e)).toFixed(2)}deg`, it.last);
      setVar(it.img, "--o", clamp(t / 0.1), it.last);
      setVar(it.shadow, "--so", e * 0.9, it.last);
      setVar(it.shadow, "--ks", 1.3 - 0.3 * e, it.last);
      setVar(it.shadow, "--sx", `${(1.5 + 6 * (1 - e)).toFixed(2)}%`, it.last);
      setVar(it.shadow, "--sy", `${(2 + 8 * (1 - e)).toFixed(2)}%`, it.last);
      // weighing starts once the ingredient has landed; the reading overshoots a touch and settles
      const u = clamp((t - 0.55) / 0.45);
      const frac = u < 0.7 ? easeOut(u / 0.7) * 1.02 : 1.02 - 0.02 * smooth((u - 0.7) / 0.3);
      const grams = Math.round(it.g * frac);
      const share = Math.min(1, grams / it.g);
      sumG += grams;
      sum.kcal += it.kcal * share;
      sum.p += it.p * share;
      sum.c += it.c * share;
      sum.f += it.f * share;
      sum.eur += it.eur * share;
      setText(it.rowG, "g", it.last, `${grams} g`);
      const state = t <= 0 ? "" : t >= 1 ? "is-done" : "is-active";
      if (it.last.state !== state) {
        it.last.state = state;
        it.row.className = state;
      }
    }
    scaleLCD(sumG);
    setText(totals.g, "g", lastTotals, `${sumG} g`);
    setText(totals.kcal, "kcal", lastTotals, `${f0.format(sum.kcal)} kcal`);
    setText(totals.p, "p", lastTotals, `${f1.format(sum.p)} g`);
    setText(totals.c, "c", lastTotals, `${f1.format(sum.c)} g`);
    setText(totals.f, "f", lastTotals, `${f1.format(sum.f)} g`);
    setText(totals.eur, "eur", lastTotals, `${f2.format(sum.eur)} €`);
    monitor.classList.toggle("is-complete", p >= 0.84);
    // camera: the plate turns slowly on the scale while the view pushes in
    setVar(plane, "--spin", `${(-6 + 12 * p).toFixed(2)}deg`, rigStore);
    const z = 0.95 + 0.07 * smooth(clamp(p / 0.9));
    const tr = `scale(${z.toFixed(4)})`;
    if (rigStore.tr !== tr) {
      rigStore.tr = tr;
      rig.style.transform = tr;
    }
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
    requestAnimationFrame(() => {
      heroCard.classList.add("is-in");
      setTimeout(countHero, reduce ? 0 : 450);
    });
  });

  if (reduce) {
    // final states, no scroll-driven motion
    renderWeigh(1);
    scenes.length = 0;
  }
  onResize();
  for (const sc of scenes) sc.cur = sc.goal;
  for (const sc of scenes) sc.render(sc.cur);
})();
