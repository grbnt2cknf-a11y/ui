# Build soft alpha masks (A) of the overlay text for each room from a sharp frame.
import sys, numpy as np, cv2
S = sys.argv[1]
ROOMS = {
  # name: (sharp frame, [line boxes x0,y0,x1,y1])
  "casa":    (244, [(484, 316, 676, 337), (222, 352, 946, 458), (302, 474, 856, 496), (560, 512, 600, 550)]),
  "living":  (384, [(26, 188, 134, 208), (34, 216, 466, 372), (24, 388, 298, 410)]),
  "dining":  (520, [(1028, 204, 1136, 224), (672, 232, 1138, 386), (762, 404, 1138, 426)]),
  "kitchen": (800, [(26, 590, 140, 610), (30, 620, 552, 698), (26, 714, 368, 734)]),
}
out = {}
for name, (f, boxes) in ROOMS.items():
    I = cv2.imread(S + "/f60/%04d.png" % f).astype(np.float32)
    parts = []
    for bi, (x0, y0, x1, y1) in enumerate(boxes):
        big = bi == 1
        k = 15 if big else 9
        Bh = cv2.medianBlur(np.clip(I, 0, 255).astype(np.uint8), k).astype(np.float32)
        Ar = np.clip((I - Bh) / (255 - Bh + 10), 0, 1)
        Ar = Ar.min(2)          # white text raises all channels; min rejects colored highlights
        A = np.zeros(I.shape[:2], np.float32)
        sub = Ar[y0:y1, x0:x1]
        core = (sub > (0.28 if big else 0.18)).astype(np.uint8)
        # drop tiny specks
        n, lab, st, _ = cv2.connectedComponentsWithStats(core, 8)
        keep = np.zeros_like(core)
        for i in range(1, n):
            if st[i, cv2.CC_STAT_AREA] >= (6 if big else 2):
                keep[lab == i] = 1
        keep = cv2.dilate(keep, np.ones((3, 3), np.uint8))
        A[y0:y1, x0:x1] = sub * keep
        if big:  # strokes are solid white: push cores to 1
            A = np.where(A > 0.55, 1.0, A / 0.55 * 0.9)
        parts.append(A)
    out[name] = np.stack(parts)
    vis = I.copy()
    tot = np.clip(sum(parts), 0, 1)[..., None]
    vis = vis * (1 - tot) + np.array([0, 0, 255.0]) * tot
    cv2.imwrite(S + "/work/A_%s.png" % name, vis.astype(np.uint8))
np.savez_compressed(S + "/work/text_alpha.npz", **out)
print({k: v.shape for k, v in out.items()})
