"""
Background removal for AI-generated sprites.

Gemini outputs sprites on a near-white background (no alpha channel).
We use connected-component flood-fill from the corners: only pixels that
are similar in color to the corners AND connected to the canvas edge get
transparency. Subject pixels in the middle that happen to be light-coloured
(e.g. white train body) are preserved because they aren't connected.

Usage:
    python3 sprite_keyout.py <input.png> [output.png]
"""

import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label

TOLERANCE = 30  # color-distance threshold for "background-like"


def keyout(input_path: Path, output_path: Path) -> None:
    im = Image.open(input_path).convert("RGB")
    arr = np.array(im)
    h, w = arr.shape[:2]

    # Sample 4 corner pixels, average them for the background reference color.
    corners = np.array([arr[0, 0], arr[0, w - 1], arr[h - 1, 0], arr[h - 1, w - 1]])
    bg = corners.mean(axis=0)

    # Build a mask of pixels "background-like" by color similarity.
    diff = np.linalg.norm(arr.astype(np.int32) - bg, axis=-1)
    bg_like = diff < TOLERANCE

    # Connected components — only flag bg-like blobs that touch the border.
    labelled, n = label(bg_like)
    border_labels = set()
    border_labels.update(np.unique(labelled[0, :]))
    border_labels.update(np.unique(labelled[h - 1, :]))
    border_labels.update(np.unique(labelled[:, 0]))
    border_labels.update(np.unique(labelled[:, w - 1]))
    border_labels.discard(0)  # 0 is the non-bg label

    # Build alpha: 0 where labelled in border_labels, else 255.
    is_border_bg = np.isin(labelled, list(border_labels))
    alpha = np.where(is_border_bg, 0, 255).astype(np.uint8)

    # Soften the edge slightly for anti-aliasing — fade the 1px ring just
    # inside the keyed area.
    from scipy.ndimage import binary_erosion
    inner = binary_erosion(is_border_bg, iterations=1)
    edge = is_border_bg & ~inner
    alpha[edge] = 80  # partial transparency at the edge

    rgba = np.dstack((arr, alpha))
    Image.fromarray(rgba, "RGBA").save(output_path, "PNG", optimize=True)
    pct = 100 * alpha.sum() / (255 * h * w)
    print(f"  {input_path.name} -> {output_path.name} (subject coverage: {pct:.0f}%)")


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: sprite_keyout.py <input.png> [output.png]")
        sys.exit(1)
    in_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else in_path.with_name(in_path.stem + "-keyed.png")
    keyout(in_path, out_path)


if __name__ == "__main__":
    main()
