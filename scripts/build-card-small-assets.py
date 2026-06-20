#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
INDEX_HTML = ROOT / "index.html"
OUT_DIR = ROOT / "assets" / "cards-small"
MANIFEST_PATH = OUT_DIR / "manifest.json"
CR_ASSETS_BASE = "https://royaleapi.github.io/cr-api-assets"
CR_CARD_ASSETS_BASE = f"{CR_ASSETS_BASE}/cards"
CR_CARD_VARIANT_ASSETS_BASE = "https://cdn.royaleapi.com/static/img/cards"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36"


def parse_json_const(html: str, const_name: str):
    match = re.search(rf"const {re.escape(const_name)} = (\[.*?\]);", html, re.S)
    if not match:
        raise SystemExit(f"Cannot find JS const {const_name} in {INDEX_HTML}")
    return json.loads(match.group(1))


def slugify(name: str) -> str:
    return re.sub(r"\s+", "-", name.lower()).replace(".", "")


def build_entries(cards, towers):
    entries = []
    seen = set()

    def add(kind: str, file_name: str, source_url: str, required: bool = True):
        if file_name in seen:
            return
        seen.add(file_name)
        entries.append(
            {
                "kind": kind,
                "file": file_name,
                "source": source_url,
                "required": required,
            }
        )

    for card in cards:
        slug = slugify(card["name"])
        add("card", f"{slug}.webp", f"{CR_CARD_ASSETS_BASE}/{slug}.png")
        if card.get("evolution"):
            add("evolution", f"{slug}-ev1.webp", f"{CR_CARD_VARIANT_ASSETS_BASE}/{slug}-ev1.png")
        if card.get("heroism"):
            add("heroism", f"{slug}-hero.webp", f"{CR_CARD_VARIANT_ASSETS_BASE}/{slug}-hero.png")
        if card.get("evolution") and card.get("heroism"):
            add(
                "heroism-evolution",
                f"{slug}-hero-ev1.webp",
                f"{CR_CARD_VARIANT_ASSETS_BASE}/{slug}-hero-ev1.png",
                required=False,
            )

    for tower in towers:
        slug = slugify(tower["name"])
        add("tower", f"{slug}.webp", f"{CR_CARD_ASSETS_BASE}/{slug}.png")

    return entries


def download(url: str, retries: int = 2) -> bytes:
    last_error = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(0.5 + attempt * 0.75)
    raise last_error


def convert_to_webp(data: bytes, output_path: Path, width: int, quality: int):
    image = Image.open(BytesIO(data))
    image.load()
    original_size = image.size
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA")
    target_height = round(width * image.height / image.width)
    image = image.resize((width, target_height), Image.Resampling.LANCZOS)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, "WEBP", quality=quality, method=6)
    return original_size, image.size


def main():
    parser = argparse.ArgumentParser(description="Build small WebP card assets for deck rendering.")
    parser.add_argument("--width", type=int, default=220, help="Output image width in pixels.")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality, 1-100.")
    parser.add_argument("--force", action="store_true", help="Rebuild existing files.")
    args = parser.parse_args()

    html = INDEX_HTML.read_text(encoding="utf-8")
    cards = parse_json_const(html, "rawCards")
    towers = parse_json_const(html, "rawTowers")
    entries = build_entries(cards, towers)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = {
        "width": args.width,
        "quality": args.quality,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "items": [],
    }
    failures = []
    total_original_bytes = 0
    total_output_bytes = 0

    for index, entry in enumerate(entries, start=1):
        output_path = OUT_DIR / entry["file"]
        if output_path.exists() and not args.force:
            output_bytes = output_path.stat().st_size
            total_output_bytes += output_bytes
            manifest["items"].append({**entry, "status": "cached", "outputBytes": output_bytes})
            print(f"[{index:03}/{len(entries)}] cached {entry['file']}")
            continue

        try:
            data = download(entry["source"])
            original_size, output_size = convert_to_webp(data, output_path, args.width, args.quality)
            output_bytes = output_path.stat().st_size
            total_original_bytes += len(data)
            total_output_bytes += output_bytes
            manifest["items"].append(
                {
                    **entry,
                    "status": "ok",
                    "originalBytes": len(data),
                    "outputBytes": output_bytes,
                    "originalSize": original_size,
                    "outputSize": output_size,
                }
            )
            print(
                f"[{index:03}/{len(entries)}] {entry['file']} "
                f"{original_size[0]}x{original_size[1]} -> {output_size[0]}x{output_size[1]} "
                f"{len(data)} -> {output_bytes} bytes"
            )
        except Exception as exc:
            status = "missing-optional" if not entry.get("required", True) else "failed"
            manifest["items"].append({**entry, "status": status, "error": str(exc)})
            failures.append(entry)
            print(f"[{index:03}/{len(entries)}] {status} {entry['file']}: {exc}", file=sys.stderr)

    manifest["summary"] = {
        "entries": len(entries),
        "failures": len(failures),
        "originalBytesDownloaded": total_original_bytes,
        "outputBytes": total_output_bytes,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    required_failures = [entry for entry in failures if entry.get("required", True)]
    print(
        f"Done: {len(entries) - len(failures)}/{len(entries)} converted, "
        f"output {total_output_bytes} bytes, manifest {MANIFEST_PATH}"
    )
    if required_failures:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
