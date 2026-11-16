#!/usr/bin/env python3
"""Prepare the hero layers: the photo, plus the subject cut out of the sky so the wordmark
can sit *behind* it.

    python3 tools/hero_depth.py sorgenti/hero.jpg siti/immobiliare

Writes assets/hero-bg.webp, assets/hero-fg.webp, a preview (hero-mask-preview.jpg) and prints
the `hero` block for site.config.js. Works best with a clean sky/background in the upper third.
Requires: opencv-python-headless, numpy, pillow.
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np


def sky_mask(img: np.ndarray, thr: float, seed_frac: float) -> np.ndarray:
    """Sky = pixels connected to the top edge whose colour stays close to a smooth sky model."""
    h, w = img.shape[:2]
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w]
    seed_rows = max(4, int(h * seed_frac))
    ys, xs = np.mgrid[0:seed_rows, 0:w]
    ys, xs = ys.ravel(), xs.ravel()

    def feats(x, y):
        x = x / w
        y = y / h
        return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1)

    # fit on the seed band, then extend downwards with the fitted gradient (skies get lighter near the horizon)
    A = feats(xs.astype(np.float32), ys.astype(np.float32))
    model = np.zeros_like(lab)
    F = feats(xx.ravel().astype(np.float32), yy.ravel().astype(np.float32))
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, lab[ys, xs, c], rcond=None)
        model[..., c] = (F @ coef).reshape(h, w)
    # the extrapolation drifts lower down: refit iteratively on what we already accepted
    cand = None
    for _ in range(3):
        dist = np.linalg.norm(lab - model, axis=2)
        cand = (dist < thr).astype(np.uint8)
        n, lab_cc = cv2.connectedComponents(cand, connectivity=4)
        top_ids = np.unique(lab_cc[0][cand[0] > 0])
        cand = np.isin(lab_cc, top_ids[top_ids > 0]).astype(np.uint8)
        sy, sx = np.nonzero(cand)
        if len(sy) < 100:
            break
        sel = np.random.default_rng(0).choice(len(sy), size=min(80000, len(sy)), replace=False)
        A2 = feats(sx[sel].astype(np.float32), sy[sel].astype(np.float32))
        for c in range(3):
            coef, *_ = np.linalg.lstsq(A2, lab[sy[sel], sx[sel], c], rcond=None)
            model[..., c] = (F @ coef).reshape(h, w)
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    return cand > 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image", type=Path)
    ap.add_argument("site", type=Path)
    ap.add_argument("--width", type=int, default=1600, help="larghezza finale (default 1600)")
    ap.add_argument("--threshold", type=float, default=14.0, help="tolleranza colore del cielo (default 14)")
    ap.add_argument("--seed", type=float, default=0.06, help="quota alta usata come campione di cielo (default 0.06)")
    a = ap.parse_args()

    img = cv2.imread(str(a.image))
    if img is None:
        print("immagine non leggibile", file=sys.stderr)
        return 1
    h0, w0 = img.shape[:2]
    W = a.width
    H = round(h0 * W / w0)
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)

    sky = sky_mask(img, a.threshold, a.seed)
    # roofline = first non-sky row of every column
    roof = np.argmax(~sky, axis=0)
    roof[sky.all(axis=0)] = H
    roof = cv2.medianBlur(roof.astype(np.float32).reshape(1, -1), 5).ravel().astype(int)
    central = roof[int(W * 0.1): int(W * 0.9)]
    roof_med = int(np.median(central))
    roof_min = int(np.percentile(central, 3))

    yy = np.mgrid[0:H, 0:W][0]
    alpha = (yy >= roof[None, :]).astype(np.float32)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
    top = max(0, roof_min - 12)
    bottom = min(H, roof_med + int(0.18 * H))

    assets = a.site / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(assets / "hero-bg.webp"), img, [cv2.IMWRITE_WEBP_QUALITY, 84])
    fg = np.dstack([img, (alpha * 255).astype(np.uint8)])[top:bottom]
    cv2.imwrite(str(assets / "hero-fg.webp"), fg, [cv2.IMWRITE_WEBP_QUALITY, 88])

    prev = img.copy()
    prev[sky] = (prev[sky] * 0.35 + np.array([40, 40, 220]) * 0.65).astype(np.uint8)
    cv2.line(prev, (0, roof_med), (W, roof_med), (0, 255, 255), 1)
    cv2.imwrite(str(a.site / "hero-mask-preview.jpg"), prev, [cv2.IMWRITE_JPEG_QUALITY, 85])

    baseline = roof_med + round(0.025 * W)
    sky_ratio = roof_med / H
    print(f"cielo fino a y≈{roof_med} ({sky_ratio:.0%} dell'altezza); anteprima: {a.site / 'hero-mask-preview.jpg'}")
    if sky_ratio < 0.3:
        print("attenzione: c'è poco cielo sopra il soggetto, la scritta potrebbe non entrarci")
    print("\nIncolla in site.config.js → hero:")
    print(f'  image: {{ src: "assets/hero-bg.webp", width: {W}, height: {H}, alt: "" }},')
    print(f'  foreground: {{ src: "assets/hero-fg.webp", top: {top}, height: {bottom - top} }},')
    print(f"  word: {{ fit: 0.86, baseline: {baseline}, stretch: 1.02, tracking: -0.0231 }},")
    print(f"  roofY: {roof_med},")
    return 0


if __name__ == "__main__":
    sys.exit(main())
