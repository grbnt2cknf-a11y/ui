import sys, glob
import numpy as np, cv2
S = sys.argv[1]
files = sorted(glob.glob(S + "/work/heroseq/*.png"))
img = np.stack([cv2.imread(f).astype(np.float32) for f in files]).mean(0)   # temporal average
H, W = img.shape[:2]
b, g, r = img[..., 0], img[..., 1], img[..., 2]
lum = (r + g + b) / 3
yy, xx = np.mgrid[0:H, 0:W]

skyc = (b - r > 80) & (b > 100)
letter_like = (lum > 130) & (b - r > -12)
free = skyc | letter_like           # what can be "behind" the house: sky or the white wordmark
# compression smears chroma at letter edges -> close thin gaps
free = cv2.morphologyEx(free.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0

# ---- roofline: first row (scanning down from y=150) that is neither sky nor letter
roof = np.full(W, H, np.int32)
for x in range(W):
    col = free[150:470, x]
    nz = np.nonzero(~col)[0]
    roof[x] = 150 + nz[0] if len(nz) else 470
roof = cv2.medianBlur(roof.astype(np.float32).reshape(1, -1), 5).ravel().astype(np.int32)
above = yy < roof[None, :]

# ---- regions to replace with reconstructed sky
fill = np.zeros((H, W), bool)
fill |= above & (yy > 140) & (yy < 402) & (xx > 60) & (xx < 1100)       # wordmark zone (letters end at y≈400)
for (x0, y0, x1, y1) in [(22, 26, 130, 62), (408, 16, 752, 70), (954, 14, 1140, 72), (586, 78, 1140, 128)]:
    fill[y0:y1, x0:x1] = True                                             # nav / logo / button / chips
R = 22
for (cx, cy) in [(R, R), (W - 1 - R, R)]:                                 # rounded top corners
    q = ((xx - cx) ** 2 + (yy - cy) ** 2 > (R - 4) ** 2) & (np.abs(xx - cx) <= R + 1) & (yy < R) & ((xx < R) | (xx > W - 1 - R))
    fill |= q
fill[:3, :] = True
fill &= above | (yy < 150)

# ---- smooth sky model fitted on clean sky pixels
sky = skyc & (~fill) & (yy < 440)
sky = cv2.erode(sky.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
ys, xs = np.nonzero(sky)
sel = np.random.default_rng(0).choice(len(ys), size=min(60000, len(ys)), replace=False)
ys, xs = ys[sel], xs[sel]
def feats(x, y):
    x = x / W; y = y / H
    return np.stack([(x ** i) * (y ** j) for i in range(5) for j in range(5 - i)], -1)
A = feats(xs.astype(float), ys.astype(float))
Fall = feats(xx.ravel().astype(float), yy.ravel().astype(float))
model = np.zeros((H, W, 3), np.float32)
for c in range(3):
    coef, *_ = np.linalg.lstsq(A, img[ys, xs, c], rcond=None)
    model[..., c] = (Fall @ coef).reshape(H, W)
noise = cv2.GaussianBlur(np.random.default_rng(1).normal(0, 2.0, (H, W)).astype(np.float32), (0, 0), 0.7)[..., None]
skyfill = model + noise
# blend: hard inside the wordmark zone (must not leave white fringes), soft for UI boxes
m = fill.astype(np.float32)
m_soft = cv2.GaussianBlur(cv2.dilate(fill.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32), (0, 0), 2.0)
m = np.maximum(m, m_soft * above)[..., None]
out = img * (1 - m) + skyfill * m

# ---- bottom-left glass card: smooth normalized-convolution fill
card = np.zeros((H, W), np.uint8)
cv2.rectangle(card, (16, 636), (328, 850), 1, -1)
for (cx, cy) in [(22, H - 23), (W - 23, H - 23)]:
    q = ((xx - cx) ** 2 + (yy - cy) ** 2 > 18 ** 2) & (np.abs(xx - cx) <= 23) & (yy > H - 24) & ((xx < 23) | (xx > W - 24))
    card[q] = 1
card[H - 3:, :] = 1
valid = (1 - card).astype(np.float32)
def nconv(im, valid, sigma):
    num = cv2.GaussianBlur(im * valid[..., None], (0, 0), sigma)
    den = cv2.GaussianBlur(valid, (0, 0), sigma)[..., None] + 1e-6
    return num / den
f1, f2 = nconv(out, valid, 18), nconv(out, valid, 45)
dist = cv2.distanceTransform(card, cv2.DIST_L2, 5)
wsmall = np.clip(1 - dist / 40, 0, 1)[..., None]
grain = np.random.default_rng(2).normal(0, 2.2, (H, W, 1)).astype(np.float32)
cfill = f1 * wsmall + f2 * (1 - wsmall) + grain
cm = cv2.GaussianBlur(cv2.dilate(card, np.ones((21, 21), np.uint8)).astype(np.float32), (0, 0), 9)[..., None]
cm = np.maximum(cm, card[..., None].astype(np.float32))
out = out * (1 - cm) + cfill * cm

# ---- bottom-right copy: top-hat detection + Telea inpaint
box = np.zeros((H, W), np.uint8); box[732:846, 820:1146] = 1
o8 = np.clip(out, 0, 255).astype(np.uint8)
gray = cv2.cvtColor(o8, cv2.COLOR_BGR2GRAY)
th = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
tm = cv2.dilate(((th > 28) & (box > 0)).astype(np.uint8), np.ones((5, 5), np.uint8))
o8 = cv2.inpaint(o8, tm, 4, cv2.INPAINT_TELEA)
# tiny white remnant of the wordmark behind the rooftop parapet
g2 = cv2.cvtColor(o8, cv2.COLOR_BGR2GRAY)
rem = np.zeros((H, W), np.uint8); rem[355:382, 222:242] = 1
rem = cv2.dilate(((g2 > 185) & (rem > 0)).astype(np.uint8), np.ones((3, 3), np.uint8))
o8 = cv2.inpaint(o8, rem, 3, cv2.INPAINT_TELEA)
cv2.imwrite(S + "/work/hero_bg.png", o8)

# ---- foreground layer: everything below the roofline, sky transparent
alpha = (~above).astype(np.float32)
# in the original the wordmark ends at y≈400: keep the sky gap right of the roof opaque so the
# taller web-font stem does not peek out below it
alpha[399:446, 1026:1074] = 1.0
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.6)
alpha[yy < 140] = 0
top, bot = 140, 470
fg = np.dstack([o8, (alpha * 255).astype(np.uint8)])[top:bot]
cv2.imwrite(S + "/work/hero_fg.png", fg)
print("fg rows", top, bot)
# debug
a = fg[..., 3:4].astype(np.float32) / 255
red = np.zeros_like(fg[..., :3], np.float32); red[..., 2] = 255
cv2.imwrite(S + "/work/fg_check.png", (fg[..., :3] * a + red * (1 - a)).astype(np.uint8))
