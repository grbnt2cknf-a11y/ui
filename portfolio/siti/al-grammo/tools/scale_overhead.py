"""Build a top-down kitchen scale: brushed-steel platform (perspective-corrected from the photo)
on a satin body, with the real display panel from the photo at the front edge."""
import sys, numpy as np, cv2
D = sys.argv[1]
src = cv2.imread(f"{D}/out/bilancia.png", cv2.IMREAD_UNCHANGED)
g = cv2.cvtColor(src[..., :3], cv2.COLOR_BGR2GRAY)
# --- platform texture: warp, keep the clean centre, rebuild a rounded square
TL, TR, BR, BL = (192, 175), (1242, 168), (1309, 776), (143, 795)
N = 1000
M = cv2.getPerspectiveTransform(np.float32([TL, TR, BR, BL]), np.float32([[0, 0], [N, 0], [N, N], [0, N]]))
tex = cv2.warpPerspective(src[..., :3], M, (N, N), flags=cv2.INTER_CUBIC)
core = tex[120:880, 120:880]
tex = cv2.resize(core, (N, N), interpolation=cv2.INTER_CUBIC).astype(np.float32)
lum = cv2.GaussianBlur(tex.mean(2), (0, 0), 140)
tex = tex * (lum.mean() / np.maximum(lum, 1))[..., None]
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
# soft studio light from the top left across the steel
light = 1.06 - 0.16 * ((xx / N) * 0.45 + (yy / N) * 0.55)
tex = tex * light[..., None]
def rrect(w, h, r, inset=0):
    m = np.zeros((h, w), np.uint8)
    x0, y0, x1, y1 = inset, inset, w - 1 - inset, h - 1 - inset
    cv2.rectangle(m, (x0 + r, y0), (x1 - r, y1), 255, -1)
    cv2.rectangle(m, (x0, y0 + r), (x1, y1 - r), 255, -1)
    for cx, cy in [(x0 + r, y0 + r), (x1 - r, y0 + r), (x0 + r, y1 - r), (x1 - r, y1 - r)]:
        cv2.circle(m, (cx, cy), r, 255, -1, cv2.LINE_AA)
    return m
pm = rrect(N, N, 150)
dist = cv2.distanceTransform((pm > 128).astype(np.uint8), cv2.DIST_L2, 5)
edge = np.clip(1 - dist / 26, 0, 1)
tex = tex * (1 - 0.28 * edge[..., None]) + 40 * np.clip(1 - np.abs(dist - 3) / 3, 0, 1)[..., None]  # bevel + rim light
platform = np.dstack([np.clip(tex, 0, 255), pm.astype(np.float32)])

# --- display panel from the photo (black rounded bar with buttons and the LCD)
pan = (g < 70).astype(np.uint8)
pan[:880] = 0; pan[1210:] = 0
pan = cv2.morphologyEx(pan, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
n, lab, st, _ = cv2.connectedComponentsWithStats(pan, 8)
k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); pan = (lab == k).astype(np.uint8)
ff = pan * 255; cv2.floodFill(ff, np.zeros((pan.shape[0] + 2, pan.shape[1] + 2), np.uint8), (0, 0), 255)
pan = ((pan > 0) | (ff == 0)).astype(np.uint8) * 255
pan = cv2.erode(pan, np.ones((7, 7), np.uint8))
pan = cv2.GaussianBlur(pan, (0, 0), 1.2)
ys, xs = np.nonzero(pan > 10)
py0, py1, px0, px1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
pbgr = src[py0:py1, px0:px1, :3].copy()
pa = pan[py0:py1, px0:px1].copy()
# light chrome caught along the bottom edge of the panel: drop it from the mask
pg = cv2.cvtColor(pbgr, cv2.COLOR_BGR2GRAY)
hh = pa.shape[0]
blip = (pg > 110) & (np.arange(hh)[:, None] > hh * 0.8)
pa[cv2.dilate(blip.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0] = 0
pa = cv2.GaussianBlur(pa, (0, 0), 1.0)
panel = np.dstack([pbgr.astype(np.float32), pa.astype(np.float32)])
lcd = (494 - px0, 996 - py0, 956 - px0, 1138 - py0)
print("panel", panel.shape, "lcd in panel", lcd)

# --- canvas: body (satin metal) + platform + panel
W = 1200
pw = 1000
H = 1000 + 70 + 330
canvas = np.zeros((H, W, 4), np.float32)
def over(dst, img, x, y):
    h, w = img.shape[:2]
    a = img[..., 3:4] / 255.0
    region = dst[y:y + h, x:x + w]
    region[..., :3] = img[..., :3] * a + region[..., :3] * (1 - a)
    region[..., 3:4] = 255 * (a + region[..., 3:4] / 255.0 * (1 - a))
# body
bw, bh = W - 40, H - 40
body_m = rrect(bw, bh, 190).astype(np.float32)
by, bx = np.mgrid[0:bh, 0:bw].astype(np.float32)
base = np.array([168, 166, 164], np.float32)  # BGR satin silver
shade = (0.78 + 0.22 * (1 - by / bh) * (1 - 0.35 * bx / bw))[..., None]
body = np.clip(base * shade, 0, 255)
bd = cv2.distanceTransform((body_m > 128).astype(np.uint8), cv2.DIST_L2, 5)
body = body * (1 - 0.35 * np.clip(1 - bd / 34, 0, 1))[..., None] + 55 * np.clip(1 - np.abs(bd - 4) / 4, 0, 1)[..., None]
over(canvas, np.dstack([body, body_m]), 20, 20)
# platform shadow on the body (light from top left -> shadow bottom right)
sh = np.zeros((H, W), np.float32)
sh[100 + 18:100 + 18 + N, 100 + 14:100 + 14 + N] = pm
sh = cv2.GaussianBlur(sh, (0, 0), 16) / 255.0 * 0.55
canvas[..., :3] *= (1 - sh[..., None] * (canvas[..., 3:4] / 255.0))
over(canvas, platform, 100, 70)
# panel scaled to the front strip
pw2 = 760
ph2 = round(panel.shape[0] * pw2 / panel.shape[1])
panel_s = cv2.resize(panel, (pw2, ph2), interpolation=cv2.INTER_AREA)
px, py = (W - pw2) // 2, 70 + N + 20 + (H - 70 - N - 20 - 20 - ph2) // 2
over(canvas, panel_s, px, py)
s = pw2 / panel.shape[1]
L = (px + lcd[0] * s, py + lcd[1] * s, px + lcd[2] * s, py + lcd[3] * s)
print("canvas", W, H, "platform box", (100, 70, 100 + N, 70 + N), "lcd box", [round(v) for v in L])
# contact shadow of the whole scale on the counter is done in CSS
out = np.clip(canvas, 0, 255).astype(np.uint8)
cv2.imwrite(f"{D}/out/bilancia_alto.png", out)
prev = out.copy().astype(np.float32); a = prev[..., 3:4] / 255
bg = np.full_like(prev[..., :3], (42, 56, 28))
cv2.imwrite(f"{D}/scale_overhead_check.jpg", cv2.resize((prev[..., :3] * a + bg * (1 - a)).astype(np.uint8), (600, 675)))
