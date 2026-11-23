import sys, numpy as np, cv2
D = sys.argv[1]
def save(name, bgr, alpha):
    cv2.imwrite(f"{D}/out/{name}.png", np.dstack([bgr, np.clip(alpha * 255, 0, 255).astype(np.uint8)]))
def biggest(mask):
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if n <= 1: return mask
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    return (lab == k)
def fill_holes(mask):
    m = mask.astype(np.uint8) * 255
    h, w = m.shape
    ff = m.copy(); cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 255)
    return (m > 0) | (ff == 0)
def radial_circle(gray, c, rmin, rmax, n=360):
    g = cv2.GaussianBlur(gray.astype(np.float32), (0, 0), 2.0)
    rs = np.arange(rmin, rmax)
    found = []
    for t in np.linspace(0, 2 * np.pi, n, endpoint=False):
        xs = (c[0] + rs * np.cos(t)).astype(int); ys = (c[1] + rs * np.sin(t)).astype(int)
        ok = (xs >= 0) & (ys >= 0) & (xs < g.shape[1]) & (ys < g.shape[0])
        prof = g[ys[ok], xs[ok]]
        if len(prof) < 5: continue
        d = np.abs(np.diff(prof))
        r = rs[ok][int(np.argmax(d))]
        found.append((c[0] + r * np.cos(t), c[1] + r * np.sin(t)))
    P = np.array(found)
    # algebraic circle fit, then drop outliers and refit
    for _ in range(3):
        A = np.c_[2 * P[:, 0], 2 * P[:, 1], np.ones(len(P))]
        b = (P ** 2).sum(1)
        cx, cy, k = np.linalg.lstsq(A, b, rcond=None)[0]
        r = np.sqrt(k + cx * cx + cy * cy)
        res = np.abs(np.hypot(P[:, 0] - cx, P[:, 1] - cy) - r)
        P = P[res < max(3, np.percentile(res, 75) * 1.5)]
    return cx, cy, r
def disc_alpha(shape, cx, cy, r, feather=1.2):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    d = np.hypot(xx - cx, yy - cy)
    return np.clip((r - d) / feather + 0.5, 0, 1).astype(np.float32)
def crop_to(alpha, bgr, pad=6):
    ys, xs = np.nonzero(alpha > 0.02)
    y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + pad, max(0, xs.min() - pad), xs.max() + pad
    return bgr[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
report = {}
# --- pasta: yellow penne inside the wooden bowl
img = cv2.imread(f"{D}/src/pasta.jpg"); hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
h, s, v = [hsv[..., i].astype(int) for i in range(3)]
pasta = (h >= 17) & (h <= 32) & (s > 70) & (v > 120)
pasta = biggest(cv2.morphologyEx(pasta.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0)
region = fill_holes(cv2.morphologyEx(pasta.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))) > 0)
region = cv2.erode(region.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
# wood visible between the penne becomes a soft dark shadow
woodc = (h <= 16) & (s > 55)
woodc = cv2.morphologyEx(woodc.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
keep = region & ~woodc
out = img
a = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 0.9)
b_, a_ = crop_to(a, out.astype(np.uint8)); save("pasta", b_, a_); report["pasta"] = b_.shape
# --- peppers: on white with a light watermark
img = cv2.imread(f"{D}/src/peperoni.jpg"); hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
s, v = hsv[..., 1].astype(int), hsv[..., 2].astype(int)
fg = (s > 45) | (v < 150)
fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8)
keep = np.zeros_like(fg, bool)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 400: keep |= lab == i
keep = fill_holes(cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8)) > 0)
a = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 0.9)
b_, a_ = crop_to(a, img); save("peperoni", b_, a_); report["peperoni"] = b_.shape
# --- chicken: on a fake checkerboard (two neutral greys)
img = cv2.imread(f"{D}/src/pollo.jpg"); f = img.astype(np.int32)
mx, mn = f.max(2), f.min(2)
neutral = (mx - mn) < 13
checker = ((mx - mn) < 12) & (mx > 118)
# chicken = not checker, connected; GrabCut to refine the pale cut faces
init = np.full(img.shape[:2], cv2.GC_PR_BGD, np.uint8)
notbg = cv2.morphologyEx((~checker).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
core = cv2.erode(notbg, np.ones((15, 15), np.uint8))
init[notbg > 0] = cv2.GC_PR_FGD; init[core > 0] = cv2.GC_FGD
init[cv2.erode(checker.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0] = cv2.GC_BGD
bgm = np.zeros((1, 65), np.float64); fgm = np.zeros((1, 65), np.float64)
cv2.grabCut(img, init, None, bgm, fgm, 4, cv2.GC_INIT_WITH_MASK)
ch = (init == cv2.GC_FGD) | (init == cv2.GC_PR_FGD)
ch = cv2.morphologyEx(ch.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
n, lab, st, _ = cv2.connectedComponentsWithStats(ch.astype(np.uint8), 8)
keep = np.zeros_like(ch)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 3000: keep |= lab == i
keep &= ~cv2.dilate(cv2.morphologyEx(checker.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)), np.ones((3, 3), np.uint8)).astype(bool)
keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
n, lab, st, _ = cv2.connectedComponentsWithStats(keep.astype(np.uint8), 8)
keep2 = np.zeros_like(keep)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 3000: keep2 |= lab == i
holes = fill_holes(keep2) & ~keep2
n, lab, st, _ = cv2.connectedComponentsWithStats(holes.astype(np.uint8), 8)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] < 300: keep2 |= lab == i
a = cv2.GaussianBlur(keep2.astype(np.float32), (0, 0), 1.0)
b_, a_ = crop_to(a, img); save("pollo", b_, a_); report["pollo"] = b_.shape
# --- sauce: cream disc inside a small bowl on flat grey
img = cv2.imread(f"{D}/src/salsa.jpg"); g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cx, cy, r = radial_circle(g, (585, 583), 200, 340)
a = disc_alpha(g.shape, cx, cy, r * 0.94)
b_, a_ = crop_to(a, img); save("salsa", b_, a_); report["salsa"] = (round(cx), round(cy), round(r))
# --- bowls
for name, src, c, rr, k in [("bowl_green", "bowl_green.jpg", (565, 575), (420, 560), 1.0),
                            ("bowl_protein", "bowl_protein.jpg", (595, 598), (470, 590), 1.0),
                            ("bowl_mare", "out/bowl_mare_x2.png", (626, 630), (440, 620), 1.0)]:
    path = f"{D}/{src}" if src.startswith("out/") else f"{D}/src/{src}"
    img = cv2.imread(path)
    if img is None: print("missing", path); continue
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cx, cy, r = radial_circle(g, c, *rr)
    a = disc_alpha(g.shape, cx, cy, r - 2)
    b_, a_ = crop_to(a, img, 2); save(name, b_, a_); report[name] = (round(cx), round(cy), round(r), b_.shape)
# --- plate
img = cv2.imread(f"{D}/out/piatto_x2.png")
if img is not None:
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cx, cy, r = 721.0, 714.0, 476.0  # Hough on the original (359.4, 355.8, 241.6) x2
    a = disc_alpha(g.shape, cx, cy, r - 2)
    b_, a_ = crop_to(a, img, 2); save("piatto", b_, a_); report["piatto"] = (round(cx), round(cy), round(r), b_.shape)
print(report)
