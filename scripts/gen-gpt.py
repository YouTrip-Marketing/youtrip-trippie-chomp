#!/usr/bin/env python3
"""Generate game graphics via OpenAI gpt-image-2.

Usage:
  scripts/gen-gpt.py "prompt text"
  scripts/gen-gpt.py "prompt" --ref sprite-trippie-a.png
  scripts/gen-gpt.py "prompt" --ref a.png --ref b.png --out new.png
  scripts/gen-gpt.py "prompt" --sprite       # adds transparent-bg hint + transparent background flag
  scripts/gen-gpt.py "prompt" --size 1024x1024 --quality high
  scripts/gen-gpt.py "prompt" --model gpt-image-2

Refs resolve against public/assets/ (or pass an absolute path).
Output defaults to public/assets/<slug>.png. Up to 16 refs supported.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ASSETS = REPO / "public" / "assets"
KEY_FILE = Path.home() / ".config" / "openai" / "api_key"
DEFAULT_MODEL = "gpt-image-2"
GENERATIONS_URL = "https://api.openai.com/v1/images/generations"
EDITS_URL = "https://api.openai.com/v1/images/edits"

VALID_SIZES = {"1024x1024", "1024x1536", "1536x1024", "2048x2048", "4096x4096", "auto"}
VALID_QUALITY = {"low", "medium", "high", "auto"}


def load_key() -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if key:
        return key.strip()
    if KEY_FILE.exists():
        return KEY_FILE.read_text().strip()
    sys.exit(f"No API key. Set $OPENAI_API_KEY or write to {KEY_FILE}.")


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


def slugify(text: str, limit: int = 40) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return (s[:limit] or "gen").rstrip("-")


def post_json(url: str, key: str, payload: dict, timeout: int = 300) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def post_multipart(url: str, key: str, fields: dict, files: list[tuple[str, Path]], timeout: int = 300) -> dict:
    boundary = "----GPTImage" + os.urandom(8).hex()
    body = bytearray()
    for name, value in fields.items():
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode()
        body += f"{value}\r\n".encode()
    for name, path in files:
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{name}"; filename="{path.name}"\r\n'.encode()
        body += b"Content-Type: image/png\r\n\r\n"
        body += path.read_bytes()
        body += b"\r\n"
    body += f"--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_image(response: dict) -> bytes:
    items = response.get("data") or []
    if not items:
        raise RuntimeError(f"No data in response: {json.dumps(response)[:500]}")
    b64 = items[0].get("b64_json")
    if not b64:
        raise RuntimeError(f"No b64_json in response: {json.dumps(response)[:500]}")
    return base64.b64decode(b64)


def main() -> int:
    ap = argparse.ArgumentParser(description="OpenAI gpt-image-2 generator for Trippie Chomp.")
    ap.add_argument("prompt", help="Text prompt")
    ap.add_argument("--ref", action="append", default=[], help="Reference image (filename in public/assets or path). Repeatable, up to 16.")
    ap.add_argument("--out", help="Output filename (saved to public/assets unless absolute path).")
    ap.add_argument("--sprite", action="store_true", help="Sprite mode: transparent bg, isolated subject.")
    ap.add_argument("--model", default=DEFAULT_MODEL, help=f"Model (default: {DEFAULT_MODEL})")
    ap.add_argument("--size", default="1024x1024", choices=sorted(VALID_SIZES), help="Output size.")
    ap.add_argument("--quality", default="high", choices=sorted(VALID_QUALITY), help="Quality tier.")
    ap.add_argument("--out-dir", default=str(ASSETS), help="Output directory (default: public/assets).")
    args = ap.parse_args()

    if len(args.ref) > 16:
        sys.exit(f"Too many refs: {len(args.ref)} (max 16)")

    refs = [resolve_ref(r) for r in args.ref]
    key = load_key()

    prompt = args.prompt
    if args.sprite:
        prompt = (
            f"{prompt}\n\nRender as a 2D game sprite, isolated subject, "
            "fully transparent background, crisp edges, no shadow, no border."
        )

    print(f"  model: {args.model}", file=sys.stderr)
    print(f"  size: {args.size}, quality: {args.quality}", file=sys.stderr)
    print(f"  refs: {[r.name for r in refs] or 'none'}", file=sys.stderr)
    print(f"  prompt: {prompt[:120]}{'…' if len(prompt) > 120 else ''}", file=sys.stderr)

    t0 = time.time()
    try:
        if refs:
            fields = {
                "model": args.model,
                "prompt": prompt,
                "size": args.size,
                "quality": args.quality,
                "n": "1",
            }
            if args.sprite:
                fields["background"] = "transparent"
            files = [("image[]", r) for r in refs]
            response = post_multipart(EDITS_URL, key, fields, files)
        else:
            payload = {
                "model": args.model,
                "prompt": prompt,
                "size": args.size,
                "quality": args.quality,
                "n": 1,
            }
            if args.sprite:
                payload["background"] = "transparent"
            response = post_json(GENERATIONS_URL, key, payload)
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

    usage = response.get("usage", {})
    usage_str = f"  usage: {usage}" if usage else ""
    print(f"  wrote: {out_path} ({len(img_bytes)/1024:.1f} KB, {time.time()-t0:.1f}s){usage_str}", file=sys.stderr)
    print(out_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
