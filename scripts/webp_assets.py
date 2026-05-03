"""
Bulk WebP-convert PNGs in public/assets/ for production payload <2 MB.

Preserves alpha for sprites. Quality 85 = visually indistinguishable from PNG
at this scale (game runs at 480x720; sprites scale down anyway).
"""

from __future__ import annotations
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image

ASSETS = Path(__file__).resolve().parent.parent / "public" / "assets"

# Files to convert. Skip the bg-{id}.webp files (already WebP).
TARGETS = [
    "game-over-bg.png",
    "trippie-coins.png",
    "trippie-face.png",
    "sprite-trippie-a.png",
    "sprite-trippie-b.png",
    "sprite-trippie-c.png",
    "sprite-trippie-d.png",
    "sprite-trippie-left-open.png",
    "sprite-trippie-right-open.png",
    "monster-blue.png",
    "monster-blue-dead.png",
    "monster-green.png",
    "monster-green-dead.png",
    "monster-orange.png",
    "monster-orange-dead.png",
    "sprite-card.png",
    "sprite-airplane.png",
    "sprite-globe.png",
    "sprite-chaser.png",
    "sprite-chaser-dead.png",
    "sprite-ambusher.png",
    "sprite-ambusher-dead.png",
    "passport.png",
]


def convert(name: str) -> Optional[Tuple[int, int]]:
    src = ASSETS / name
    if not src.exists():
        return None
    out = src.with_suffix(".webp")
    im = Image.open(src)
    # PIL preserves alpha automatically when saving WebP from RGBA mode.
    if im.mode not in ("RGBA", "RGB", "P"):
        im = im.convert("RGBA")
    im.save(out, "WEBP", quality=85, method=6)
    before = src.stat().st_size
    after = out.stat().st_size
    src.unlink()
    return before, after


def main() -> None:
    total_before = 0
    total_after = 0
    converted = 0
    skipped = 0
    for name in TARGETS:
        result = convert(name)
        if result is None:
            print(f"  SKIP {name} (missing)")
            skipped += 1
            continue
        before, after = result
        total_before += before
        total_after += after
        converted += 1
        print(f"  {name:36s} {before//1024:>5} KB -> {after//1024:>4} KB ({100*after/before:.0f}%)")
    print(f"\nConverted {converted}, skipped {skipped}")
    print(f"Total: {total_before//1024//1024} MB -> {total_after//1024} KB")


if __name__ == "__main__":
    main()
