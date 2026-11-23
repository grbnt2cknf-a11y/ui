"""Ingredients for the overhead plate: chicken slices only, one colour grade for all,
a tight contact shadow baked in, and a separate soft shadow image for the drop."""
import sys, numpy as np, cv2
D = sys.argv[1]
def load(n): return cv2.imread(f"{D}/out/{n}.png", cv2.IMREAD_UNCHANGED)
def grade(bgr):
    f = bgr.astype(np.float32) / 255
    f = np.clip((f - 0.5) * 1.06 + 0.5, 0, 1)            # a little contrast
    f = f * np.array([0.96, 1.0, 1.04], np.float32)       # warm (BGR)
    lab = cv2.cvtColor((np.clip(f, 0, 1) * 255).astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    lab[..., 1:] = (lab[..., 1:] - 128) * 0.94 + 128      # tame over-saturated stock colours
    return cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
def with_contact(rgba, size):
    h, w = rgba.shape[:2]
    pad = int(size * 0.06)
    out = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.float32)
    a = rgba[..., 3].astype(np.float32) / 255
    sh = np.zeros(out.shape[:2], np.float32)
    o = int(size * 0.012)
    sh[pad + o:pad + o + h, pad + o:pad + o + w] = a
    sh = cv2.GaussianBlur(sh, (0, 0), size * 0.008) * 0.55
    out[..., 3] = sh
    col = np.zeros(out.shape[:2] + (3,), np.float32); col[:] = (20, 26, 34)
    out[..., :3] = col
    fg = np.zeros_like(out); fg[pad:pad + h, pad:pad + w, :3] = rgba[..., :3]; fg[pad:pad + h, pad:pad + w, 3] = a
    A = fg[..., 3:4]
    res = np.zeros_like(out)
    res[..., :3] = fg[..., :3] * A + out[..., :3] * (1 - A)
    res[..., 3] = (A[..., 0] + out[..., 3] * (1 - A[..., 0])) * 255
    return np.clip(res, 0, 255).astype(np.uint8), pad
def soft_shadow(rgba, pad):
    a = rgba[..., 3].astype(np.float32) / 255
    a = cv2.copyMakeBorder(a, pad, pad, pad, pad, cv2.BORDER_CONSTANT, 0)
    s = max(a.shape) * 0.03
    sh = cv2.GaussianBlur(a, (0, 0), s)
    small = cv2.resize(sh, (sh.shape[1] // 3, sh.shape[0] // 3), interpolation=cv2.INTER_AREA)
    out = np.zeros(small.shape + (4,), np.uint8); out[..., :3] = (18, 22, 28); out[..., 3] = np.clip(small * 255 * 0.8, 0, 255)
    return out
# chicken: keep the fanned slices (left group), drop the whole breast
ch = load("pollo")
a = (ch[..., 3] > 40).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(a, 8)
keep = np.zeros_like(a)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 800 and cen[i][0] < ch.shape[1] * 0.42:
        keep[lab == i] = 1
ys, xs = np.nonzero(keep)
print("slices bbox", xs.min(), xs.max(), ys.min(), ys.max(), "components kept")
alpha = ch[..., 3].astype(np.float32) * cv2.dilate(keep, np.ones((5, 5), np.uint8))
ch = np.dstack([ch[..., :3], alpha.astype(np.uint8)])[ys.min() - 4:ys.max() + 5, xs.min() - 4:xs.max() + 5]
cv2.imwrite(f"{D}/out/pollo_fette.png", ch)
for n, src in [("pasta", "pasta"), ("pollo", "pollo_fette"), ("peperoni", "peperoni"), ("salsa", "salsa")]:
    img = load(src)
    img[..., :3] = grade(img[..., :3])
    size = max(img.shape[:2])
    rgba, pad = with_contact(img, size)
    cv2.imwrite(f"{D}/out/ing_{n}.png", rgba)
    cv2.imwrite(f"{D}/out/ing_{n}_ombra.png", soft_shadow(img, pad))
    print(n, rgba.shape)
