#!/usr/bin/env python3
"""Encode the photos the site uses as WebP.

For every photo referenced by the page, stylesheet or script, writes next to the JPEG master:
  <name>.webp       at most 1200 px wide
  <name>-640.webp   640 px wide, for thumbnails and phones
The field photos are grainy duotones, so quality 62 is visually equal to the master at these sizes.
Skips files that are newer than their master. Requires `cwebp` (brew install webp) and macOS `sips`.
"""
import re
import subprocess
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "prototype"
PHOTOS = SITE / "assets" / "photos"
SOURCES = [SITE / "umtelkomd-v11.html", SITE / "assets" / "site.css", SITE / "assets" / "site.js"]
REF = re.compile(r"photos/([a-z0-9-]+?)(?:-640)?\.(?:jpg|webp)")
QUALITY = "62"
LARGE = 1200  # widest slot on the page is about 600 CSS px, so 2x
SMALL = 640


def pixel_width(master: Path) -> int:
    out = subprocess.run(["sips", "-g", "pixelWidth", str(master)], capture_output=True, text=True, check=True).stdout
    return int(re.search(r"pixelWidth: (\d+)", out).group(1))


def encode(master: Path, out: Path, max_width: int) -> None:
    if out.exists() and out.stat().st_mtime >= master.stat().st_mtime:
        return
    cmd = ["cwebp", "-quiet", "-q", QUALITY, "-m", "6"]
    if pixel_width(master) > max_width:  # never upscale
        cmd += ["-resize", str(max_width), "0"]
    subprocess.run(cmd + [str(master), "-o", str(out)], check=True)


def main() -> int:
    names = sorted({m for src in SOURCES if src.exists() for m in REF.findall(src.read_text(encoding="utf-8"))})
    missing = [n for n in names if not (PHOTOS / f"{n}.jpg").exists()]
    if missing:
        print("missing JPEG masters: " + ", ".join(missing), file=sys.stderr)
        return 1
    before = after = 0
    for name in names:
        master = PHOTOS / f"{name}.jpg"
        full, small = PHOTOS / f"{name}.webp", PHOTOS / f"{name}-{SMALL}.webp"
        encode(master, full, LARGE)
        encode(master, small, SMALL)
        before += master.stat().st_size
        after += full.stat().st_size
    print(f"{len(names)} photos: {before // 1024} kB JPEG -> {after // 1024} kB WebP (large variant)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
