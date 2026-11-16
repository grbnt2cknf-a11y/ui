/* ──────────────────────────────────────────────────────────────
   Portfolio engine — "stile Altura"
   Builds the page from window.SITE (see siti/<nome>/site.config.js) and runs:
   - hero: cover-fit photo, wordmark tucked behind the subject, parallax
   - tour: scroll-scrubbed image sequence on <canvas>, chapters with blur fades
   Memory-safe on phones/tablets: frames are kept compressed (Blob) and only a
   small window around the current position is decoded at any time.
   ────────────────────────────────────────────────────────────── */
(() => {
  "use strict";

  const SITE = window.SITE;
  if (!SITE) {
    console.error("engine: window.SITE is missing (load site.config.js first)");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ramp = (v, a, b) => clamp((v - a) / (b - a));
  const smooth = (t) => t * t * (3 - 2 * t);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const lines = (s) => esc(s).replace(/\n/g, "<br />");

  /* ───────────── theme + fonts ───────────── */
  const T = SITE.theme || {};
  const rootStyle = document.documentElement.style;
  const themeVars = {
    page: "--page",
    skyTop: "--sky-top",
    skyMid: "--sky-mid",
    ground: "--ground",
    stage: "--stage",
    menu: "--menu",
    chip: "--chip",
    chipHover: "--chip-hover",
    accent: "--accent",
  };
  for (const [k, v] of Object.entries(themeVars)) if (T[k]) rootStyle.setProperty(v, T[k]);
  const displayFace = T.display || "Poppins";
  const displayWeight = T.displayWeight || 500;
  rootStyle.setProperty("--display-face", `"${displayFace}"`);
  if (SITE.tour && SITE.tour.height) rootStyle.setProperty("--tour-vh", SITE.tour.height);

  const fontsHref =
    SITE.fonts ||
    `https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:wght@200;300;400;500;600&family=${encodeURIComponent(
      displayFace
    ).replace(/%20/g, "+")}:wght@${displayWeight}&display=swap`;
  let fontLink = document.querySelector(`link[href="${fontsHref}"]`);
  if (!fontLink) {
    fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = fontsHref;
    document.head.appendChild(fontLink);
  }
  // resolves once the Google Fonts stylesheet is parsed (its @font-face rules exist)
  const fontSheetReady = new Promise((res) => {
    if (fontLink.sheet) return res();
    fontLink.addEventListener("load", res, { once: true });
    fontLink.addEventListener("error", res, { once: true });
    setTimeout(res, 5000);
  });
  if (SITE.title && !document.title) document.title = SITE.title;
  document.documentElement.lang = SITE.lang || "it";

  /* ───────────── markup ───────────── */
  const arrow =
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>';
  const arrowUp =
    '<span class="cta-icon" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"><path d="M5 11 11 5M6 5h5v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg></span>';
  const brandMark =
    '<svg class="brand-mark" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3.2 18.5V9.6a6.8 6.8 0 0 1 13.6 0v8.9" stroke="currentColor" stroke-width="2" /><path d="M7.6 18.5v-7.6a2.4 2.4 0 0 1 4.8 0v7.6" stroke="currentColor" stroke-width="2" /></svg>';

  const H = SITE.hero || {};
  const img = H.image || null;
  const IMG_W = (img && img.width) || 1160;
  const IMG_H = (img && img.height) || 864;
  const fg = H.foreground || null;
  const brand = SITE.brand || {};
  const nav = SITE.nav || { items: [] };
  const card = SITE.card || null;
  const intro = SITE.intro || null;
  const tourCfg = SITE.tour || { chapters: [] };
  const frames = tourCfg.frames || null;
  const closing = SITE.closing || null;
  const footer = SITE.footer || null;

  const heroHTML = `
  <header class="hero" id="top">
    <div class="hero-card" data-hero>
      ${img ? `<div class="scene scene-bg" data-parallax><img src="${esc(img.src)}" alt="${esc(img.alt)}" width="${IMG_W}" height="${IMG_H}" /></div>` : ""}
      <h1 class="wordmark" data-wordmark aria-label="${esc(brand.name)}">${esc(brand.wordmark || brand.name)}</h1>
      ${
        fg
          ? `<div class="scene scene-fg" data-parallax aria-hidden="true"><img src="${esc(fg.src)}" alt="" width="${IMG_W}" height="${fg.height}" style="top: calc(${fg.top} / ${IMG_H} * 100%)" /></div>`
          : ""
      }
      <div class="hero-shade" aria-hidden="true"></div>
      <nav class="topbar" aria-label="Primary">
        <a class="brand" href="#top" aria-label="${esc(brand.name)}">${brandMark}<span>${esc(brand.name)}</span></a>
        <ul class="menu glass">
          ${(nav.items || [])
            .map(
              (it, i) =>
                `<li><a ${i === (nav.active ?? 0) ? 'class="is-active" aria-current="page"' : ""} href="${esc(it.href || "#tour")}">${esc(it.label)}</a></li>`
            )
            .join("")}
        </ul>
        ${SITE.cta ? `<a class="cta" href="${esc(SITE.cta.href || "#closing")}"><span>${esc(SITE.cta.label)}</span>${arrowUp}</a>` : "<span></span>"}
      </nav>
      ${
        SITE.chips && SITE.chips.length
          ? `<ul class="cats">${SITE.chips
              .map((c) => `<li><a class="glass" href="${esc(c.href || "#tour")}"><i>${esc(c.n)}</i><b>${esc(c.label)}</b><em>${esc(c.meta)}</em></a></li>`)
              .join("")}</ul>`
          : ""
      }
      ${
        card
          ? `<article class="showing">
        <p class="showing-kicker"><span class="dot" aria-hidden="true"></span>${esc(card.kicker)}</p>
        <h2 class="showing-title">${esc(card.title)}</h2>
        <p class="showing-place">${esc(card.place)}</p>
        ${card.specs && card.specs.length ? `<ul class="showing-specs">${card.specs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
        <div class="showing-foot">
          <strong>${esc(card.price)}</strong>
          ${card.link ? `<a href="${esc(card.link.href || "#tour")}" class="arrow-link">${esc(card.link.label)} ${arrow}</a>` : ""}
        </div>
      </article>`
          : ""
      }
      ${
        intro
          ? `<div class="intro"><p>${esc(intro.text)}</p>${
              intro.link ? `<a href="${esc(intro.link.href || "#tour")}" class="arrow-link underline">${esc(intro.link.label)} ${arrow}</a>` : ""
            }</div>`
          : ""
      }
      ${img ? "" : `<p class="placeholder-note">${esc(SITE.placeholder?.hero || "Foto hero in arrivo")}</p>`}
    </div>
  </header>`;

  // chapter type positions (stage units, measured on the reference recording)
  function chapterHTML(c, idx) {
    const xl = c.size === "xl";
    const titleLines = String(c.title || "").split("\n").length;
    const y = c.y;
    const capK = xl ? y - 35 : y - 31;
    const capS = xl ? y + 124 : y + (titleLines - 1) * 76 + 92;
    const capP = capS + 37;
    return `
      <div class="chapter" data-chapter="${idx}" data-align="${esc(c.align || "left")}">
        ${c.kicker ? `<p class="mono" data-part="kicker" style="--cap: ${capK}">${esc(c.kicker)}</p>` : ""}
        <h2 class="display${xl ? " display-xl" : ""}" data-part="title" style="--cap: ${y}">${lines(c.title)}</h2>
        ${c.sub ? `<p class="mono" data-part="sub" style="--cap: ${capS}">${esc(c.sub)}</p>` : ""}
        ${
          c.play
            ? `<button class="play" type="button" data-part="sub" style="--cap: ${capP}" data-play aria-label="${esc(tourCfg.playLabel || "Play")}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.3" /><path d="M10 8.4v7.2l5.6-3.6z" fill="currentColor" /></svg>
          </button>`
            : ""
        }
      </div>`;
  }

  const tourHTML = `
  <section class="tour" id="tour" data-tour aria-label="${esc(tourCfg.label || "Tour")}">
    <div class="tour-stage${frames ? "" : " no-footage"}">
      <canvas class="tour-canvas" data-canvas aria-hidden="true"></canvas>
      <div class="tour-vignette" aria-hidden="true"></div>
      ${(tourCfg.chapters || []).map(chapterHTML).join("")}
      <div class="progress" aria-hidden="true"><span data-progress></span></div>
      <span class="scroll-dot" aria-hidden="true"></span>
      <div class="loader${frames ? "" : " is-done"}" data-loader aria-hidden="true"><span></span></div>
      ${frames ? "" : `<p class="placeholder-note">${esc(SITE.placeholder?.tour || "Video del tour in arrivo")}</p>`}
    </div>
  </section>`;

  const closingHTML = closing
    ? `
  <section class="closing" id="closing">
    <p class="mono">${esc(closing.kicker)}</p>
    <h2 class="closing-title">${lines(closing.title)}</h2>
    ${closing.cta ? `<a class="cta cta-dark" href="${esc(closing.cta.href || "#tour")}"><span>${esc(closing.cta.label)}</span>${arrowUp}</a>` : ""}
    ${footer ? `<footer class="footer"><span>${esc(footer.left)}</span><span>${esc(footer.right)}</span></footer>` : ""}
  </section>`
    : "";

  const mount = document.querySelector("[data-site]") || document.body;
  mount.insertAdjacentHTML("afterbegin", heroHTML + `<main>${tourHTML}${closingHTML}</main>`);

  /* ───────────── HERO layout ───────────── */
  const WORD = Object.assign({ x: 70, baseline: 418, size: 346, stretch: 1.02, tracking: -0.0231 }, H.word || {});
  const ROOF_Y = H.roofY ?? WORD.baseline - (WORD.size || 346) * 0.13;
  const heroCard = document.querySelector("[data-hero]");
  const wordmark = document.querySelector("[data-wordmark]");
  const parallaxLayers = [...document.querySelectorAll("[data-parallax]")];
  const parallaxK = reduceMotion ? 0 : (H.parallax ?? 0.4);
  wordmark.style.letterSpacing = WORD.tracking + "em";
  wordmark.style.scale = `${WORD.stretch} 1`;
  wordmark.style.fontWeight = displayWeight;

  // measure the display face once it is loaded: baseline offset in a line-height:1 box + ink width
  let baselineEm = 0.85;
  let inkEm = 2.81;
  let inkLeftEm = 0.031;
  function measureWordmark() {
    const c = document.createElement("canvas").getContext("2d");
    c.font = `${displayWeight} 1000px "${displayFace}"`;
    if ("letterSpacing" in c) c.letterSpacing = WORD.tracking * 1000 + "px";
    const m = c.measureText(brand.wordmark || brand.name || "");
    if (m.fontBoundingBoxAscent) {
      const asc = m.fontBoundingBoxAscent / 1000;
      const desc = m.fontBoundingBoxDescent / 1000;
      baselineEm = (1 - (asc + desc)) / 2 + asc;
    }
    if (m.actualBoundingBoxRight) {
      inkLeftEm = -m.actualBoundingBoxLeft / 1000;
      inkEm = (m.actualBoundingBoxRight + m.actualBoundingBoxLeft) / 1000;
    }
  }

  let heroH = 0;
  function layoutHero() {
    const W = heroCard.clientWidth;
    const Hh = heroCard.clientHeight;
    heroH = Hh;
    const ar = IMG_W / IMG_H;
    const portrait = W / Hh < 0.95;
    heroCard.classList.toggle("is-portrait", portrait);
    let sw, sx, sy, fs, wx, wy;
    if (!portrait) {
      sw = Math.max(W, Hh * ar);
      const sh = sw / ar;
      sx = (W - sw) / 2;
      sy = (Hh - sh) * 0.3;
      const k = sw / IMG_W;
      if (WORD.fit) {
        // auto: the wordmark spans `fit` of the photo width, centred; short names are capped
        const size = Math.min((WORD.fit * IMG_W) / (inkEm * WORD.stretch), WORD.maxSize || IMG_W * 0.33);
        fs = size * k;
        wx = sx + ((IMG_W - size * inkEm * WORD.stretch) / 2 - size * inkLeftEm * WORD.stretch) * k;
      } else {
        fs = WORD.size * k;
        wx = sx + WORD.x * k;
      }
      wy = sy + WORD.baseline * k - fs * baselineEm;
    } else {
      sw = W * (H.portraitZoom || 1.62);
      const k = sw / IMG_W;
      sx = (W - sw) * 0.5;
      sy = Hh * 0.43 - ROOF_Y * k;
      fs = (W * 0.9) / (inkEm * WORD.stretch);
      wx = (W - fs * inkEm * WORD.stretch) / 2 - fs * inkLeftEm;
      wy = sy + (ROOF_Y - 8) * k + fs * 0.07 - fs * baselineEm;
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
    if (!parallaxK) return;
    const y = clamp(scrollY, 0, heroH * 1.2);
    const t = `translate3d(0, ${(y * parallaxK).toFixed(2)}px, 0)`;
    for (const el of parallaxLayers) el.style.transform = t;
  }

  /* ───────────── TOUR: memory-bounded frame player ───────────── */
  const tour = document.querySelector("[data-tour]");
  const canvas = document.querySelector("[data-canvas]");
  if (!frames) canvas.hidden = true; // let the placeholder gradient show
  const ctx = canvas.getContext("2d", { alpha: false });
  const progressEl = document.querySelector("[data-progress]");
  const loaderEl = document.querySelector("[data-loader]");
  const loaderBar = loaderEl.querySelector("span");

  const N = frames ? frames.count : 1;
  const coarse = window.matchMedia("(pointer: coarse)").matches || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const MAX_DECODED = coarse ? 14 : 48; // ~4 MB each at 1160×860
  const frameURL = (i) => `${frames.path}${String(i).padStart(frames.digits || 3, "0")}.${frames.ext || "webp"}`;
  const blobs = new Array(N);
  const decoded = new Map(); // index -> ImageBitmap | HTMLImageElement
  const decoding = new Set();
  let fetched = 0;
  let needsDraw = true;
  let current = 0; // tour progress 0–1
  let curIndex = 0; // same, in frame units

  async function fetchBlob(i) {
    try {
      const r = await fetch(frameURL(i));
      if (!r.ok) throw new Error(r.status);
      blobs[i] = await r.blob();
    } catch (e) {
      blobs[i] = null;
    }
    fetched++;
    loaderBar.style.width = ((fetched / N) * 100).toFixed(1) + "%";
    if (fetched === N) loaderEl.classList.add("is-done");
    if (Math.abs(i - curIndex) < 3) want(curIndex);
  }

  async function prefetchAll() {
    const order = [];
    const seen = new Set();
    for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < N; i += step) if (!seen.has(i)) (seen.add(i), order.push(i));
    if (!seen.has(N - 1)) order.push(N - 1);
    let cursor = 0;
    const worker = async () => {
      while (cursor < order.length) await fetchBlob(order[cursor++]);
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  async function decode(i) {
    if (i < 0 || i >= N || decoded.has(i) || decoding.has(i) || !blobs[i]) return;
    decoding.add(i);
    try {
      let bmp;
      if (window.createImageBitmap) {
        bmp = await createImageBitmap(blobs[i]);
      } else {
        bmp = new Image();
        bmp.src = URL.createObjectURL(blobs[i]);
        await bmp.decode();
      }
      decoded.set(i, bmp);
      evict();
      needsDraw = true;
    } catch (e) {
      /* skip broken frame */
    } finally {
      decoding.delete(i);
    }
  }

  function evict() {
    while (decoded.size > MAX_DECODED) {
      let far = -1;
      let fd = -1;
      for (const k of decoded.keys()) {
        const d = Math.abs(k - curIndex);
        if (d > fd) (fd = d), (far = k);
      }
      const b = decoded.get(far);
      decoded.delete(far);
      if (b.close) b.close();
      else if (b.src && b.src.startsWith("blob:")) URL.revokeObjectURL(b.src);
    }
  }

  let lastWantDir = 1;
  let lastWantPos = 0;
  function want(pos) {
    if (!frames) return;
    const i0 = Math.floor(pos);
    lastWantDir = pos >= lastWantPos ? 1 : -1;
    lastWantPos = pos;
    const ahead = coarse ? 5 : 10;
    decode(i0);
    decode(i0 + 1);
    for (let d = 1; d <= ahead; d++) decode(i0 + 1 + d * lastWantDir);
    decode(i0 - lastWantDir);
  }

  function nearestDecoded(i) {
    if (decoded.has(i)) return i;
    let best = -1;
    let bd = Infinity;
    for (const k of decoded.keys()) {
      const d = Math.abs(k - i);
      if (d < bd) (bd = d), (best = k);
    }
    return best;
  }

  let cw = 0;
  let ch = 0;
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
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

  function drawImg(im, alpha) {
    const iw = im.width || im.naturalWidth;
    const ih = im.height || im.naturalHeight;
    const s = Math.max(cw / iw, ch / ih);
    const dw = iw * s;
    const dh = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function drawFrame(pos) {
    if (!frames) return;
    const i0 = clamp(Math.floor(pos), 0, N - 1);
    const t = pos - i0;
    const a = nearestDecoded(i0);
    if (a < 0) return;
    drawImg(decoded.get(a), 1);
    const i1 = Math.min(i0 + 1, N - 1);
    if (t > 0.02 && a === i0 && i1 !== i0 && decoded.has(i1)) drawImg(decoded.get(i1), t);
    ctx.globalAlpha = 1;
  }

  /* chapters: range = [inStart, inEnd, outStart, outEnd] as fractions of the tour (0–1) */
  const chapterEls = [...document.querySelectorAll("[data-chapter]")].map((el) => {
    const cfg = tourCfg.chapters[+el.dataset.chapter];
    return {
      range: cfg.range || [-1, -1, 2, 2],
      parts: [...el.querySelectorAll("[data-part]")].map((p) => ({ el: p, kind: p.dataset.part, last: -1 })),
    };
  });

  function visibility(range, p, kind) {
    const [a, b, c, d] = range;
    const lag = kind === "title" ? 0 : 0.006; // small type arrives a touch later, leaves a touch earlier
    const vin = a < 0 ? 1 : ramp(p, a + lag, b + lag);
    const vout = 1 - ramp(p, c - lag, d - lag);
    return smooth(clamp(Math.min(vin, vout)));
  }

  function updateChapters(p) {
    for (const chp of chapterEls) {
      for (const part of chp.parts) {
        const v = Math.round(visibility(chp.range, p, part.kind) * 1000) / 1000;
        if (v === part.last) continue;
        part.last = v;
        part.el.style.opacity = v;
        part.el.style.filter = v >= 0.999 ? "none" : `blur(${((1 - v) * (coarse ? 10 : 14)).toFixed(2)}px)`;
        part.el.style.visibility = v <= 0.001 ? "hidden" : "visible";
      }
    }
  }

  /* ───────────── scroll loop (inertia = cinematic scrub) ───────────── */
  let target = 0; // 0–1
  let tourTop = 0;
  let tourRange = 1;

  function measure() {
    const r = tour.getBoundingClientRect();
    tourTop = r.top + window.scrollY;
    tourRange = Math.max(1, tour.offsetHeight - window.innerHeight);
  }

  function readScroll() {
    const y = window.scrollY;
    target = clamp((y - tourTop) / tourRange);
    heroParallax(y);
  }

  function tick() {
    const diff = target - current;
    if (Math.abs(diff) > 0.00001) {
      current += reduceMotion ? diff : diff * 0.14;
      if (Math.abs(target - current) < 0.00002) current = target;
      needsDraw = true;
    }
    if (needsDraw) {
      needsDraw = false;
      const pos = current * (N - 1);
      curIndex = pos;
      want(pos);
      drawFrame(pos);
      updateChapters(current);
      progressEl.style.width = (current * 100).toFixed(2) + "%";
    }
    requestAnimationFrame(tick);
  }

  /* play button: glide through the whole take */
  function play() {
    const startY = window.scrollY;
    const endY = tourTop + tourRange;
    const startP = clamp((startY - tourTop) / tourRange);
    const duration = 14000 * (1 - startP) + 800;
    const t0 = performance.now();
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
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
      if (t < 1) raf = requestAnimationFrame(step);
      else stop();
    };
    raf = requestAnimationFrame(step);
  }
  const playBtn = document.querySelector("[data-play]");
  if (playBtn) playBtn.addEventListener("click", play);

  /* ───────────── boot ───────────── */
  function onResize() {
    layoutHero();
    sizeCanvas();
    measure();
    readScroll();
  }

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", readScroll, { passive: true });
  if (document.fonts && document.fonts.load) {
    // wait for the stylesheet, then for the faces themselves, before measuring the wordmark
    fontSheetReady.then(() => Promise.all([
      document.fonts.load(`${displayWeight} 100px "${displayFace}"`),
      document.fonts.load('200 100px "Inter"'),
      document.fonts.load('400 100px "Geist Mono"'),
    ]))
      .catch(() => {})
      .then(() => {
        measureWordmark();
        onResize();
      });
    document.fonts.addEventListener("loadingdone", () => {
      measureWordmark();
      onResize();
    });
  }

  onResize();
  current = target;
  if (frames) {
    curIndex = current * (N - 1);
    fetchBlob(0).then(() => {
      want(curIndex);
      prefetchAll();
    });
  }
  requestAnimationFrame(tick);
})();
