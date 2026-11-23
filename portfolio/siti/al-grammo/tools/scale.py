import sys, numpy as np, cv2
D = sys.argv[1]
img = cv2.imread(f"{D}/out/bilancia_x2.png")  # 1440x1440 (2x of the 720 original)
H, W = img.shape[:2]
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
f = img.astype(np.int32)
# 1) silhouette on white
fg = (g < 246) | ((f.max(2) - f.min(2)) > 10)
fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8)
k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); sil = (lab == k).astype(np.uint8)
ff = sil.copy() * 255; cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 255)
sil = ((sil > 0) | (ff == 0)).astype(np.float32)
alpha = cv2.GaussianBlur(sil, (0, 0), 1.2)
# 2) clean the black display panel: printed labels and LCD digits (2x coords)
out = img.copy()
def wipe(x0, y0, x1, y1, thr=90):
    reg = cv2.cvtColor(out[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    m = (reg > thr).astype(np.uint8)
    m = cv2.dilate(m, np.ones((7, 7), np.uint8))
    full = np.zeros((H, W), np.uint8); full[y0:y1, x0:x1] = m
    return full
mask = np.zeros((H, W), np.uint8)
mask |= wipe(520, 920, 920, 990)        # "Kitchen scale"
mask |= wipe(510, 1135, 950, 1190)      # "MAX: 10000g d=1g"
mask |= wipe(490, 990, 960, 1140, 60)   # LCD digits, "oz", ghost segments
out = cv2.inpaint(out, mask, 7, cv2.INPAINT_TELEA)
# flatten the LCD window into an even dark glass with a soft top reflection
x0, y0, x1, y1 = 494, 996, 956, 1138
win = out[y0:y1, x0:x1].astype(np.float32)
base = np.array([22, 18, 20], np.float32)
yy = np.linspace(0, 1, y1 - y0)[:, None, None]
refl = (1 - yy) ** 3 * 14
out[y0:y1, x0:x1] = np.clip(win * 0.15 + base * 0.85 + refl, 0, 255).astype(np.uint8)
cv2.imwrite(f"{D}/out/bilancia.png", np.dstack([out, (alpha * 255).astype(np.uint8)]))
vis = out.copy(); cv2.rectangle(vis, (x0, y0), (x1, y1), (0, 0, 255), 2)
cv2.imwrite(f"{D}/scale_check.jpg", cv2.resize(vis, (720, 720)))
