#!/usr/bin/env python3
"""Turn a fly-through video into the frame sequence used by the tour.

    python3 tools/video_to_frames.py sorgenti/tour.mp4 siti/immobiliare --frames 240

Writes siti/<nome>/assets/tour/000.webp … and prints the `tour.frames` block for site.config.js.
Requires: ffmpeg + ffprobe on PATH, Pillow (pip install pillow).
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageFilter


def probe_duration(video: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(video)],
        check=True, capture_output=True, text=True,
    ).stdout
    return float(json.loads(out)["format"]["duration"])


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("site", type=Path, help="cartella del sito, es. siti/immobiliare")
    ap.add_argument("--frames", type=int, default=240, help="numero di fotogrammi (default 240)")
    ap.add_argument("--width", type=int, default=1440, help="larghezza in px (default 1440)")
    ap.add_argument("--quality", type=int, default=68, help="qualità WebP 0-100 (default 68)")
    ap.add_argument("--start", type=float, default=0.0, help="secondo di inizio")
    ap.add_argument("--end", type=float, default=None, help="secondo di fine")
    ap.add_argument("--aspect", type=str, default=None, help="ritaglio centrale, es. 4:3 (default: nessuno)")
    a = ap.parse_args()

    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        print("ffmpeg/ffprobe non trovati", file=sys.stderr)
        return 1
    dur = probe_duration(a.video)
    end = a.end if a.end is not None else dur
    span = max(0.1, end - a.start)
    fps = a.frames / span

    vf = []
    if a.aspect:
        w, h = (int(x) for x in a.aspect.split(":"))
        vf.append(f"crop='min(iw,ih*{w}/{h})':'min(ih,iw*{h}/{w})'")
    vf += [f"fps={fps:.6f}", f"scale={a.width}:-2:flags=lanczos"]

    out_dir = a.site / "assets" / "tour"
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*.webp"):
        old.unlink()

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-ss", str(a.start), "-t", str(span), "-i", str(a.video),
             "-vf", ",".join(vf), "-frames:v", str(a.frames), f"{tmp}/%04d.png"],
            check=True,
        )
        pngs = sorted(Path(tmp).glob("*.png"))
        total = 0
        for i, p in enumerate(pngs):
            im = Image.open(p).convert("RGB").filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=2))
            dst = out_dir / f"{i:03d}.webp"
            im.save(dst, "WEBP", quality=a.quality, method=6)
            total += dst.stat().st_size
        w, h = Image.open(pngs[0]).size

    print(f"{len(pngs)} fotogrammi {w}×{h}, {total / 1e6:.1f} MB in {out_dir}")
    print("\nIncolla in site.config.js → tour:")
    print(f'  frames: {{ count: {len(pngs)}, path: "assets/tour/", ext: "webp", digits: 3 }},')
    print("\nRicorda di regolare i `range` dei capitoli sulle soste della camera (frazioni 0–1 del tour).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
