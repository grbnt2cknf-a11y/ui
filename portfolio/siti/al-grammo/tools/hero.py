import sys, numpy as np, cv2
D = sys.argv[1]
img = cv2.imread(f"{D}/src/hero.jpg")
H, W = img.shape[:2]
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
# --- rim ellipse: edge points on the top arc + side extremes
gy = cv2.Sobel(cv2.GaussianBlur(g, (0, 0), 1.5), cv2.CV_32F, 0, 1)
gx = cv2.Sobel(cv2.GaussianBlur(g, (0, 0), 1.5), cv2.CV_32F, 1, 0)
mag = np.hypot(gx, gy)
pts = []
thr = 25.0
# outer silhouette: first strong edge coming from the background side
for x in range(275, 855, 5):
    col = mag[480:640, x]
    idx = np.nonzero(col > thr)[0]
    if len(idx): pts.append((x, 480 + int(idx[0])))
for y in range(610, 690, 4):
    row = mag[y, 180:330]; idx = np.nonzero(row > thr)[0]
    if len(idx): pts.append((180 + int(idx[0]), y))
    row = mag[y, 800:960][::-1]; idx = np.nonzero(row > thr)[0]
    if len(idx): pts.append((959 - int(idx[0]), y))
pts = np.array(pts, np.float32)
(cx, cy), (MA, ma), ang = cv2.fitEllipse(pts)
print("ellipse", round(cx, 1), round(cy, 1), round(MA, 1), round(ma, 1), round(ang, 1))
# automatic fit is pulled off by the carrot leaves on the right: outer lip measured on the photo
cx, cy, AX, AY, ang = 560.0, 651.0, 326.0, 111.0, 0.0
MA, ma = 2 * AX, 2 * AY
# --- remove LCD digits and brand logo
m = np.zeros((H, W), np.uint8)
lcd = (slice(1040, 1112), slice(415, 628))
m[lcd] = (g[lcd] < 150).astype(np.uint8)
logo = (slice(1118, 1156), slice(452, 572))
m[logo] = (g[logo] < 185).astype(np.uint8)
m = cv2.dilate(m, np.ones((5, 5), np.uint8))
clean = cv2.inpaint(img, m, 5, cv2.INPAINT_TELEA)
# smooth the LCD face so no ghost of the digits remains
face = clean[1040:1112, 415:628].astype(np.float32)
blur = cv2.GaussianBlur(face, (0, 0), 6)
clean[1044:1108, 419:624] = blur[4:68, 4:209].astype(np.uint8)
cv2.imwrite(f"{D}/out/hero_clean.png", clean)
# --- foreground: bowl (inside rim ellipse, plus everything under the rim between its sides) + scale
yy, xx = np.mgrid[0:H, 0:W]
ell = np.zeros((H, W), np.uint8)
cv2.ellipse(ell, ((cx, cy), (MA + 1.5, ma + 1.5), ang), 1, -1, cv2.LINE_AA)
xl, xr = cx - AX, cx + AX
under = ((yy >= cy) & (xx >= xl + 2) & (xx <= xr - 2)).astype(np.uint8)
fg = np.maximum(ell, under).astype(np.float32)
fg = cv2.GaussianBlur(fg, (0, 0), 0.8)
top, bot = int(cy - AY) - 10, int(cy) + 160
rgba = np.dstack([clean, (fg * 255).astype(np.uint8)])[top:bot]
cv2.imwrite(f"{D}/out/hero_fg.png", rgba)
print("fg rows", top, bot, "rim top y", round(cy - AY, 1), "x range", round(xl), round(xr))
# --- edge colours for the desktop side-gradient (mean of 24 px at both edges, per 5% of height)
stops = []
for k in range(0, 21):
    y = min(H - 1, int(k / 20 * (H - 1)))
    band = cv2.GaussianBlur(clean, (0, 0), 25)[max(0, y - 20):y + 20]
    e = np.concatenate([band[:, :24].reshape(-1, 3), band[:, -24:].reshape(-1, 3)])
    b_, g_, r_ = np.median(e, 0)
    stops.append(f"#{int(r_):02x}{int(g_):02x}{int(b_):02x} {k * 5}%")
print("gradient:", ", ".join(stops))
vis = clean.copy()
cv2.ellipse(vis, ((cx, cy), (MA, ma), ang), (0, 0, 255), 2)
cv2.imwrite(f"{D}/hero_check.png", vis[450:1250, 150:1000])
