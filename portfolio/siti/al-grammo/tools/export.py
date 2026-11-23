import sys, os, numpy as np, cv2
from PIL import Image
D, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
def webp(name, arr, q=82, width=None):
    im = Image.fromarray(cv2.cvtColor(arr, cv2.COLOR_BGRA2RGBA if arr.shape[2] == 4 else cv2.COLOR_BGR2RGB))
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    p = f"{OUT}/{name}.webp"; im.save(p, "WEBP", quality=q, method=6)
    print(f"{name}.webp {im.size} {os.path.getsize(p) // 1024} KB")
hero = cv2.imread(f"{D}/out/hero_clean.png")
webp("hero-tall", hero, 80)
# wide version for landscape screens: rows 250..1200, photo centred on the bowl (x=560 -> 1200),
# sides continued with a heavily blurred reflection of the photo
crop = hero[250:1200]
Wd, ox = 2400, 640
ext = cv2.copyMakeBorder(crop, 0, 0, ox, Wd - ox - crop.shape[1], cv2.BORDER_REFLECT)
soft = cv2.GaussianBlur(ext, (0, 0), 38)
wide = soft.copy().astype(np.float32)
xx = np.arange(Wd)[None, :, None].astype(np.float32)
fe = 90.0
wa = np.clip((xx - ox) / fe, 0, 1) * np.clip((ox + crop.shape[1] - xx) / fe, 0, 1)
wide = soft * (1 - wa) + ext * wa
webp("hero-wide", wide.astype(np.uint8), 80)
fg = cv2.imread(f"{D}/out/hero_fg.png", cv2.IMREAD_UNCHANGED)
webp("hero-fg", fg, 86)
for n, w, q in [("bilancia", 1200, 84), ("piatto", 1000, 84), ("pasta", 720, 80), ("pollo", 720, 80),
                ("peperoni", 720, 80), ("salsa", 420, 82), ("bowl_green", 900, 80), ("bowl_protein", 900, 80), ("bowl_mare", 900, 80)]:
    a = cv2.imread(f"{D}/out/{n}.png", cv2.IMREAD_UNCHANGED)
    if a is None: print("MISSING", n); continue
    webp(n.replace("_", "-"), a, q, w)
