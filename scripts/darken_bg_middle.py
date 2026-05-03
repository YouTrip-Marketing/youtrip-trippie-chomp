"""
Darken the middle band of all destination bgs in public/assets/bg-*.webp.

The maze sits at y=134-638 of the 480x720 canvas. With bright destination bgs
(SG airport peach sky, NYC daylight, Bali dawn), maze cells/dots/walls drown.
Runtime overlay was rejected (drowns top context too). Fix at source: per-row
multiplier with smooth ramps so there are no banding artifacts.

Layout (480x720):
  y=  0 -> 110: bright (mult=1.0)             — destination context above maze
  y=110 -> 160: ramp 1.0 -> MID_MULT          — smooth transition
  y=160 -> 600: MID_MULT (~0.5)               — maze readability band
  y=600 -> 660: ramp MID_MULT -> 1.0          — smooth transition
  y=660 -> 720: bright (mult=1.0)             — HUD overlays this anyway

Outputs back over the originals. Re-run is idempotent against raw PNGs in
generated/raw-bg-*.png if we need to redo (script reads from raw if --from-raw).
"""

from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "public" / "assets"
RAW = ROOT / "generated"

W, H = 480, 720
MAZE_TOP = 134
MAZE_BOTTOM = 638
RAMP = 26  # px of smooth transition each side of maze band
MID_MULT = 0.50  # darkening factor for maze band

DESTINATIONS = [
    "sg-airport",
    "jp-tokyo",
    "th-bangkok",
    "kr-seoul",
    "my-kl",
    "us-nyc",
    "id-bali",
]


def build_row_multiplier() -> np.ndarray:
    """One float per row, 1.0 = unchanged, MID_MULT at maze band center."""
    mult = np.ones(H, dtype=np.float32)
    top_ramp_start = MAZE_TOP - RAMP
    top_ramp_end = MAZE_TOP + RAMP
    bot_ramp_start = MAZE_BOTTOM - RAMP
    bot_ramp_end = MAZE_BOTTOM + RAMP

    for y in range(H):
        if y < top_ramp_start:
            mult[y] = 1.0
        elif y < top_ramp_end:
            t = (y - top_ramp_start) / (top_ramp_end - top_ramp_start)
            t = 0.5 - 0.5 * np.cos(np.pi * t)  # smoothstep via cosine
            mult[y] = 1.0 + (MID_MULT - 1.0) * t
        elif y < bot_ramp_start:
            mult[y] = MID_MULT
        elif y < bot_ramp_end:
            t = (y - bot_ramp_start) / (bot_ramp_end - bot_ramp_start)
            t = 0.5 - 0.5 * np.cos(np.pi * t)
            mult[y] = MID_MULT + (1.0 - MID_MULT) * t
        else:
            mult[y] = 1.0
    return mult


def darken(im: Image.Image, mult: np.ndarray) -> Image.Image:
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    if im.mode != "RGB":
        im = im.convert("RGB")
    arr = np.asarray(im, dtype=np.float32)  # (H, W, 3)
    arr *= mult[:, None, None]
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def process(slug: str, from_raw: bool) -> None:
    if from_raw:
        src = RAW / f"raw-bg-{slug}.png"
    else:
        src = ASSETS / f"bg-{slug}.webp"
    if not src.exists():
        print(f"  SKIP {slug} (missing source: {src.name})")
        return
    out = ASSETS / f"bg-{slug}.webp"
    im = Image.open(src)
    before_size = src.stat().st_size if src == out else None
    mult = build_row_multiplier()
    im2 = darken(im, mult)
    im2.save(out, "WEBP", quality=85, method=6)
    after_size = out.stat().st_size
    if before_size is not None:
        print(f"  {slug:14s} {before_size//1024:>4} KB -> {after_size//1024:>4} KB")
    else:
        print(f"  {slug:14s} (from raw {im.size}) -> {after_size//1024} KB")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-raw", action="store_true",
                    help="Re-derive from generated/raw-bg-*.png (idempotent)")
    args = ap.parse_args()
    print(f"Darkening middle band (y={MAZE_TOP}-{MAZE_BOTTOM}, mult={MID_MULT}, ramp={RAMP}px)")
    for slug in DESTINATIONS:
        process(slug, args.from_raw)
    print("Done. Verify in browser before showing Terry.")


if __name__ == "__main__":
    main()
