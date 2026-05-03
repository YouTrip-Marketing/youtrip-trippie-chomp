#!/usr/bin/env python3
"""Generate game graphics via Gemini 2.5 Flash Image.

Usage:
  scripts/gen.py "prompt text"
  scripts/gen.py "prompt" --ref sprite-trippie-a.png
  scripts/gen.py "prompt" --ref a.png --ref b.png --out new.png
  scripts/gen.py "prompt" --sprite       # adds transparent-bg hint
  scripts/gen.py "prompt" --model gemini-2.5-flash-image-preview

Refs resolve against public/assets/ (or pass an absolute path).
Output defaults to public/assets/<slug>.png.
"""
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ASSETS = REPO / "public" / "assets"
KEY_FILE = Path.home() / ".config" / "gemini" / "api_key"
DEFAULT_MODEL = "gemini-2.5-flash-image"
# Other options: gemini-3-pro-image-preview, gemini-3.1-flash-image-preview
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"


def load_key() -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key.strip()
    if KEY_FILE.exists():
        return KEY_FILE.read_text().strip()
    sys.exit(f"No API key. Set $GEMINI_API_KEY or write to {KEY_FILE}.")


def resolve_ref(ref: str) -> Path:
    p = Path(ref)
    if p.is_absolute() and p.exists():
        return p
    candidate = ASSETS / ref
    if candidate.exists():
        return candidate
    if p.exists():
        return p
    sys.exit(f"Ref not found: {ref} (looked in {ASSETS} and cwd)")


def encode_image(path: Path) -> dict:
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return {"inline_data": {"mime_type": mime, "data": data}}


def slugify(text: str, limit: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return (s[:limit] or "gen").rstrip("-")


def build_payload(prompt: str, refs: list[Path], sprite: bool) -> dict:
    parts: list[dict] = []
    if sprite:
        prompt = (
            f"{prompt}\n\nRender as a 2D game sprite, isolated subject, "
            "fully transparent background, crisp edges, no shadow, no border."
        )
    parts.append({"text": prompt})
    for ref in refs:
        parts.append(encode_image(ref))
    return {"contents": [{"parts": parts}]}


def call_gemini(model: str, key: str, payload: dict, timeout: int = 120) -> dict:
    url = ENDPOINT.format(model=model, key=key)
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_image(response: dict) -> bytes:
    candidates = response.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"No candidates in response: {json.dumps(response)[:500]}")
    for part in candidates[0].get("content", {}).get("parts", []):
        inline = part.get("inline_data") or part.get("inlineData")
        if inline and inline.get("data"):
            return base64.b64decode(inline["data"])
    raise RuntimeError(f"No image in response: {json.dumps(response)[:500]}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Gemini image generator for Trippie Chomp.")
    ap.add_argument("prompt", help="Text prompt")
    ap.add_argument("--ref", action="append", default=[], help="Reference image (filename in public/assets or path). Repeatable.")
    ap.add_argument("--out", help="Output filename (saved to public/assets unless absolute path).")
    ap.add_argument("--sprite", action="store_true", help="Append sprite/transparent-bg hint to prompt.")
    ap.add_argument("--model", default=DEFAULT_MODEL, help=f"Gemini model (default: {DEFAULT_MODEL})")
    ap.add_argument("--out-dir", default=str(ASSETS), help="Output directory (default: public/assets).")
    args = ap.parse_args()

    refs = [resolve_ref(r) for r in args.ref]
    payload = build_payload(args.prompt, refs, args.sprite)
    key = load_key()

    print(f"  model: {args.model}", file=sys.stderr)
    print(f"  refs:  {[r.name for r in refs] or 'none'}", file=sys.stderr)
    print(f"  prompt: {args.prompt[:120]}{'…' if len(args.prompt) > 120 else ''}", file=sys.stderr)

    t0 = time.time()
    try:
        response = call_gemini(args.model, key, payload)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        sys.exit(f"HTTP {e.code}: {body[:600]}")

    img_bytes = extract_image(response)

    if args.out:
        out_path = Path(args.out)
        if not out_path.is_absolute():
            out_path = Path(args.out_dir) / out_path
    else:
        out_path = Path(args.out_dir) / f"{slugify(args.prompt)}.png"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(img_bytes)
    print(f"  wrote: {out_path} ({len(img_bytes)/1024:.1f} KB, {time.time()-t0:.1f}s)", file=sys.stderr)
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
