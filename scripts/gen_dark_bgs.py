"""Batch-generate naturally-dark night/dusk pixel-art bgs for all 7 levels + bonus.

Style anchor: tokyo-pixel-b2-v3.png (validator winner from earlier round).
Generates 3 variants per destination → 24 total calls × $0.039 = ~$0.94.
Outputs to generated/raw-bg-night-<slug>-v<N>.png. Idempotent — skips existing.

Usage:
  python3 scripts/gen_dark_bgs.py              # dry-run, prints prompts
  python3 scripts/gen_dark_bgs.py --execute    # actually call Gemini
  python3 scripts/gen_dark_bgs.py --execute --slug sg-airport   # one destination
  python3 scripts/gen_dark_bgs.py --execute --variants 1        # 1 variant per dest
"""

from __future__ import annotations
import argparse
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
GEN = REPO / "scripts" / "gen.py"
RAW = REPO / "generated"
STYLE_REF = REPO / "generated" / "tokyo-pixel-b2-v3.png"

# Common style suffix appended to every prompt — locks the look.
STYLE = (
    "Pixel art retro game background, 1024x1024 square, "
    "deep saturated palette, naturally dark middle region with darker mid-tones, "
    "accent lights only as bright points, "
    "no text, no UI, no characters, no foreground objects covering the centre, "
    "ABSOLUTELY NO maze pattern, NO grid pattern, NO labyrinth, NO Pac-Man style overlay, "
    "no geometric tile patterns in the foreground. "
    "Match only the pixel-art style and palette of the reference image, "
    "do not copy any structural patterns from it."
)

DESTINATIONS = [
    {
        "slug": "sg-airport",
        "level": "L1",
        "name": "Singapore Changi airport at night",
        "prompt": (
            "Changi airport at night. Plane silhouettes on a runway, "
            "control tower silhouette, dark tarmac in foreground. "
            "Smooth solid dark navy/black sky with NO stars, NO small bright dots, "
            "NO scattered pixel highlights. Runway lights as soft glowing strips, NOT pinpoint dots. "
            "Use only large lit shapes for accents — windows in tower, runway strip glow."
        ),
    },
    {
        "slug": "jp-tokyo",
        "level": "L2",
        "name": "Tokyo at night",
        "prompt": (
            "Tokyo skyline at night, Tokyo Tower lit red as a small accent, "
            "neon shop signs blurred in the distance, magenta and purple sky, "
            "dark city silhouette filling the lower band."
        ),
    },
    {
        "slug": "th-bangkok",
        "level": "L3",
        "name": "Bangkok Chao Phraya river at dusk",
        "prompt": (
            "Chao Phraya river at deep dusk, gold temple spires (Wat Arun) silhouetted "
            "on the far bank, dark teal water with subtle ripple reflections, "
            "warm lantern dots in the distance, dark indigo sky transitioning to ember at horizon."
        ),
    },
    {
        "slug": "lounge",
        "level": "L4",
        "name": "Premium airport lounge interior",
        "prompt": (
            "Premium first-class airport lounge interior at night, abstract pixel-art lounge chairs "
            "in silhouette, warm amber pendant lights as small glow points, dark navy walls, "
            "soft golden carpet floor, mood: calm and luxurious."
        ),
    },
    {
        "slug": "kr-seoul",
        "level": "L5",
        "name": "Seoul at night",
        "prompt": (
            "Seoul cityscape at night, Namsan Tower lit on a hill in the background, "
            "blurred neon signage with hangul-feel glyphs (no real text), "
            "deep indigo sky, cyan and magenta accent lights, dark city silhouette."
        ),
    },
    {
        "slug": "my-kl",
        "level": "L6",
        "name": "Kuala Lumpur at night",
        "prompt": (
            "Kuala Lumpur skyline at night, Petronas Twin Towers prominent and lit blue/silver, "
            "deep emerald and dark teal sky, monorail tracks faint in the foreground, "
            "city lights as small accents."
        ),
    },
    {
        "slug": "au-sydney",
        "level": "L7",
        "name": "Sydney harbour at night",
        "prompt": (
            "Sydney harbour at night, Sydney Opera House shells silhouetted and softly lit white, "
            "Sydney Harbour Bridge spans across the upper portion, "
            "dark indigo harbour water with ripple reflections, deep navy sky with a few stars."
        ),
    },
]


def out_path(slug: str, variant: int) -> Path:
    return RAW / f"raw-bg-night-{slug}-v{variant}.png"


def gen_one(prompt: str, out: Path, ref: Path) -> bool:
    """Call gen.py for one image. Returns True if success, False on failure."""
    cmd = [
        "python3", str(GEN), prompt,
        "--ref", str(ref),
        "--out", str(out),
        "--out-dir", str(out.parent),
    ]
    print(f"  → {out.name}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        if result.returncode != 0:
            print(f"    FAIL ({result.returncode}): {result.stderr[:300]}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"    TIMEOUT")
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--execute", action="store_true", help="Actually call Gemini (otherwise dry-run).")
    ap.add_argument("--slug", help="Limit to one destination slug.")
    ap.add_argument("--variants", type=int, default=3, help="Variants per destination (default 3).")
    ap.add_argument("--ref", default=str(STYLE_REF), help="Style reference image.")
    args = ap.parse_args()

    targets = [d for d in DESTINATIONS if not args.slug or d["slug"] == args.slug]
    if not targets:
        sys.exit(f"No destination matches slug '{args.slug}'")

    total_calls = len(targets) * args.variants
    cost = total_calls * 0.039
    print(f"=== gen_dark_bgs ===")
    print(f"  Destinations: {len(targets)}")
    print(f"  Variants: {args.variants}")
    print(f"  Total calls: {total_calls}")
    print(f"  Est cost: ~${cost:.2f}")
    print(f"  Style ref: {Path(args.ref).name}")
    print(f"  Mode: {'EXECUTE' if args.execute else 'DRY-RUN'}\n")

    if not args.execute:
        for d in targets:
            print(f"--- {d['level']} {d['slug']} ---")
            print(f"  {d['prompt']}")
            print(f"  + STYLE\n")
        print("Re-run with --execute to actually generate.")
        return

    if not Path(args.ref).exists():
        sys.exit(f"Style ref not found: {args.ref}")

    t0 = time.time()
    ok = 0
    skipped = 0
    failed = 0
    for d in targets:
        full_prompt = f"{d['prompt']} {STYLE}"
        print(f"--- {d['level']} {d['slug']} ---")
        for v in range(1, args.variants + 1):
            out = out_path(d["slug"], v)
            if out.exists():
                print(f"  skip {out.name} (exists)")
                skipped += 1
                continue
            if gen_one(full_prompt, out, Path(args.ref)):
                ok += 1
            else:
                failed += 1
    elapsed = time.time() - t0
    print(f"\nDone in {elapsed/60:.1f}min — ok={ok} skipped={skipped} failed={failed}")
    print(f"Outputs at: {RAW}/raw-bg-night-*.png")
    print(f"Next: visually pick winners, rename winners to raw-bg-<slug>.png, run process_assets.py")


if __name__ == "__main__":
    main()
