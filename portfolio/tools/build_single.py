#!/usr/bin/env python3
"""Bundle a site into one HTML page (engine CSS/JS + config inlined) for hosts that want a
single file, e.g. a Claude artifact. Assets stay as files next to it.

    python3 tools/build_single.py siti/altura dist/altura.html

Prints the list of asset paths (relative to the site folder) that must be published with it.
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("site", type=Path)
    ap.add_argument("out", type=Path)
    a = ap.parse_args()

    site = a.site.resolve()
    html = (site / "index.html").read_text()
    css = (ROOT / "engine" / "engine.css").read_text()
    js = (ROOT / "engine" / "engine.js").read_text()
    cfg = (site / "site.config.js").read_text()

    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1).strip()
    desc = re.search(r'<meta name="description" content="([^"]*)"', html)
    page = f"""<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover" />
{f'<meta name="description" content="{desc.group(1)}" />' if desc else ''}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<style>
{css}
</style>
<div data-site></div>
<script>
{cfg}
</script>
<script>
{js}
</script>
"""
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(page)
    assets = sorted(p.relative_to(site).as_posix() for p in (site / "assets").rglob("*") if p.is_file() and p.name != ".gitkeep")
    print(f"{a.out} ({len(page) / 1024:.0f} KB), {len(assets)} file di assets")
    for p in assets:
        print(p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
