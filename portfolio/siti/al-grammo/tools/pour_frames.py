"""Scroll sequence from the pouring video: the LED display flickers in a screen recording, so the
digits are removed from every frame (static camera: a clean 'display off' plate, colour-matched
per frame) and redrawn on the page."""
import sys, glob, os, numpy as np, cv2
from PIL import Image
SRC, OUT, PREV = sys.argv[1], sys.argv[2], sys.argv[3]
files = sorted(glob.glob(f"{SRC}/*.png"))[:191]
X0, Y0, X1, Y1 = 520, 1145, 702, 1305           # digits + LED halo + unit dot, left of the ZERO key
frames = [cv2.imread(f) for f in files]
reg = lambda im: im[Y0:Y1, X0:X1].astype(np.float32)
# frames whose display is off: lowest local contrast in the digit box
score = [float(cv2.Laplacian(cv2.cvtColor(im[Y0:Y1, X0:X1], cv2.COLOR_BGR2GRAY), cv2.CV_32F).var()) for im in frames]
order = np.argsort(score)
off = [int(i) for i in order[:14]]
print("display-off frames", sorted(off))
plate = np.median(np.stack([reg(frames[i]) for i in off]), 0)
h, w = Y1 - Y0, X1 - X0
mask = np.zeros((h, w), np.float32)
cv2.rectangle(mask, (8, 8), (w - 8, h - 8), 1, -1)
mask = cv2.GaussianBlur(mask, (0, 0), 6)
ring = np.ones((h, w), bool); ring[6:-6, 6:-6] = False
os.makedirs(OUT, exist_ok=True)
total = 0
for n, k in enumerate(range(0, len(frames), 2)):
    im = frames[k].copy()
    r = reg(im)
    gain = (r[ring].mean(0) + 1) / (plate[ring].mean(0) + 1)
    fill = np.clip(plate * gain, 0, 255)
    im[Y0:Y1, X0:X1] = (r * (1 - mask[..., None]) + fill * mask[..., None]).astype(np.uint8)
    if n == 0:
        cv2.imwrite(f"{PREV}/pour_first.png", im)
    pil = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).resize((864, 1486), Image.LANCZOS)
    p = f"{OUT}/{n:03d}.webp"; pil.save(p, "WEBP", quality=70, method=6); total += os.path.getsize(p)
    if k in (88, 120, 176):
        cv2.imwrite(f"{PREV}/pour_clean_{k}.png", im[1080:1360, 420:820])
        cv2.imwrite(f"{PREV}/pour_orig_{k}.png", frames[k][1080:1360, 420:820])
print(n + 1, "frames", round(total / 1e6, 2), "MB")
