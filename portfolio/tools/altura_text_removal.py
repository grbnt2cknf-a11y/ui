import sys, numpy as np, cv2
S = sys.argv[1]
TA = dict(np.load(S + "/work/text_alpha.npz"))
H, W = 862, 1160
yy, xx = np.mgrid[0:H, 0:W]
# (hold range, transitions [(t0,t1,ref_before,ref_after)])
ROOMS = {
    "casa":    dict(hold=(232, 266), trans=[(268, 278, 266, 280)]),
    "living":  dict(hold=(350, 402), trans=[(338, 348, 336, 350, 337), (404, 420, 402, 422)]),
    "dining":  dict(hold=(486, 548), trans=[(472, 484, 470, 486), (550, 564, 548, 566)]),
    "kitchen": dict(hold=(626, 720), trans=[(612, 624, 610, 626)]),
}
SOFT = {"casa": (262, 266), "living": [(0, 0)], "dining": [(486, 490), (544, 548)], "kitchen": (626, 634)}
def is_soft(room, f):
    v = SOFT[room]
    v = v if isinstance(v, list) else [v]
    return any(a <= f <= b for a, b in v)
BOXES = {
  "casa":    [(484, 316, 676, 337), (222, 352, 946, 458), (302, 474, 856, 496), (560, 512, 600, 550)],
  "living":  [(26, 188, 134, 208), (34, 216, 466, 372), (24, 388, 298, 410)],
  "dining":  [(1028, 204, 1136, 224), (672, 232, 1138, 386), (762, 404, 1138, 426)],
  "kitchen": [(26, 590, 142, 611), (30, 620, 552, 698), (24, 712, 372, 736)],
}
def box_mask(room, pad):
    m = np.zeros((H, W), np.uint8)
    for (x0, y0, x1, y1) in BOXES[room]:
        m[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad] = 1
    return m
FR = list(range(232, 721, 2))
def load(f): return cv2.imread(S + "/f60/%04d.png" % f)

ui = np.zeros((H, W), np.uint8)
ui[835:848, 24:332] = 1
ui[831:852, 570:591] = 1
R = 20
for (cx, cy) in [(R, R), (W - 1 - R, R), (R, H - 1 - R), (W - 1 - R, H - 1 - R)]:
    q = ((xx - cx) ** 2 + (yy - cy) ** 2 > (R - 3) ** 2) & (np.abs(xx - cx) <= R) & (np.abs(yy - cy) <= R) \
        & (((xx < R) | (xx > W - 1 - R)) & ((yy < R) | (yy > H - 1 - R)))
    ui[q] = 1
ui = cv2.dilate(ui, np.ones((3, 3), np.uint8))

def state(f):
    for room, d in ROOMS.items():
        if d["hold"][0] <= f <= d["hold"][1]:
            return room, "hold", None
        for t in d["trans"]:
            if t[0] <= f <= t[1]:
                return room, "trans", t
    return None, "none", None

clean = {}
# pass 1: none + hold
for f in FR:
    room, st, _ = state(f)
    if st == "trans":
        continue
    I = load(f)
    m = ui.copy()
    if st == "hold":
        A = np.max(TA[room], 0)
        dil = 3 if room == "kitchen" else 2
        if is_soft(room, f):
            dil = 5
        tm = cv2.dilate((A > 0.06).astype(np.uint8), np.ones((2 * dil + 1, 2 * dil + 1), np.uint8))
        m = np.maximum(m, tm)
        if room == "kitchen":   # small lines over smooth floor: inpaint whole line boxes
            for (x0, y0, x1, y1) in (BOXES[room][0], BOXES[room][2]):
                m[y0 - 3:y1 + 3, x0 - 3:x1 + 3] = 1
    clean[f] = cv2.inpaint(I, m, 4, cv2.INPAINT_TELEA)

# pass 2: transitions -> chain frame-to-frame homographies (raw frames, text region masked)
sift = cv2.SIFT_create(6000)
def H_between(src_img, dst_img, mask):
    m8 = (mask * 255).astype(np.uint8)
    k1, d1 = sift.detectAndCompute(cv2.cvtColor(src_img, cv2.COLOR_BGR2GRAY), m8)
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(dst_img, cv2.COLOR_BGR2GRAY), m8)
    good = [m for m, n in cv2.BFMatcher().knnMatch(d1, d2, k=2) if m.distance < 0.75 * n.distance]
    src = np.float32([k1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([k2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    Hm, inl = cv2.findHomography(src, dst, cv2.RANSAC, 1.5)
    return Hm, len(good), int(inl.sum())
raw = {}
def Rw(f):
    if f not in raw: raw[f] = load(f)
    return raw[f]
for room, d in ROOMS.items():
    region = box_mask(room, 24)
    near = cv2.dilate(region, np.ones((301, 301), np.uint8))
    fmask = near * (1 - cv2.dilate(region, np.ones((21, 21), np.uint8))) * (1 - ui)
    w = cv2.GaussianBlur(region.astype(np.float32), (0, 0), 6)[..., None]
    w = np.maximum(w, region[..., None].astype(np.float32))
    ring = (cv2.dilate(region, np.ones((41, 41), np.uint8)) - region).astype(bool)
    for tr in d["trans"]:
        t0, t1, rb, ra = tr[:4]
        mid = tr[4] if len(tr) > 4 else (t0 + t1) / 2
        chains = [([f for f in range(t0, t1 + 1, 2) if f <= mid], rb), ([f for f in range(t1, t0 - 1, -2) if f > mid], ra)]
        for seq, ref in chains:
            Hacc = np.eye(3); pf = ref
            for f in seq:
                Hm, ng, ni = H_between(Rw(pf), Rw(f), fmask)
                if Hm is None or ni < 12:
                    Hm, ng, ni = H_between(Rw(pf), Rw(f), (1 - cv2.dilate(region, np.ones((21, 21), np.uint8))) * (1 - ui))
                Hacc = Hm @ Hacc
                warped = cv2.warpPerspective(clean[ref], Hacc, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).astype(np.float32)
                I = Rw(f)
                gain = (I[ring].astype(np.float32).mean(0) + 1) / (warped[ring].mean(0) + 1)
                out = I.astype(np.float32) * (1 - w) + np.clip(warped * gain, 0, 255) * w
                clean[f] = cv2.inpaint(np.clip(out, 0, 255).astype(np.uint8), ui, 4, cv2.INPAINT_TELEA)
                print(room, f, "<-", ref, ng, ni, flush=True)
                pf = f

for f, img in clean.items():
    cv2.imwrite(S + "/clean/%04d.png" % f, img[3:H - 3, 3:W - 3])
print("written", len(clean))
