#!/usr/bin/env python3
import csv
import html
import os
import re
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path('/Users/rodya/CR')
CPU_CSV = ROOT / 'public/data/cpu-tests.csv'
AN_CSV = ROOT / 'public/data/anemometer-tests.csv'
OUT_DIR = ROOT / 'public/fans'
OUT_DIR.mkdir(parents=True, exist_ok=True)

STOP_WORDS = {'mm', 'об', 'rpm', 'fan', 'hight', 'high', 'speed', 'edition', 'extreme'}


def normalize_whitespace(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip()


def normalize_fan_name(value: str) -> str:
    compact = normalize_whitespace(value)
    compact = compact.lower()
    compact = compact.replace('ё', 'е').replace('，', ',')
    compact = re.sub(r'[()\[\]{}]', ' ', compact)
    compact = re.sub(r'[\\/]', ' ', compact)
    compact = compact.replace('+', ' plus ')
    compact = re.sub(r'[^a-zа-я0-9\-\s]', ' ', compact, flags=re.IGNORECASE)

    tokens = [t.strip() for t in compact.split(' ')]
    tokens = [t for t in tokens if t and t not in STOP_WORDS]
    return ' '.join(tokens)


def slugify_model(value: str) -> str:
    cleaned = normalize_fan_name(value)
    cleaned = re.sub(r'[^a-z0-9\s-]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s+', '-', cleaned)
    return cleaned or 'fan-model'


def get_models(path: Path) -> list[str]:
    rows = []
    with path.open('r', encoding='utf-8-sig', newline='') as handle:
        reader = csv.reader(handle)
        next(reader, None)
        for row in reader:
            if not row:
                continue
            model = row[0].strip().strip('"')
            if model:
                rows.append(model)
    return rows


def fetch(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read()


def search_image_urls(query: str) -> list[str]:
    url = 'https://www.bing.com/images/search?q=' + urllib.parse.quote(query)
    body = fetch(url).decode('utf-8', 'ignore')

    patterns = [
        r'murl&quot;:&quot;(.*?)&quot;',
        r'"murl":"(.*?)"',
    ]

    seen = set()
    results: list[str] = []

    for pattern in patterns:
        for raw in re.findall(pattern, body):
            unescaped = html.unescape(raw)
            unescaped = unescaped.replace('\\/', '/').replace('\\u002f', '/')
            unescaped = unescaped.replace('\\u003a', ':')
            unescaped = unescaped.replace('\\u0026', '&')
            unescaped = unescaped.strip()
            if not unescaped.startswith('http'):
                continue
            if unescaped in seen:
                continue
            seen.add(unescaped)
            results.append(unescaped)

    return results


def guess_extension(data: bytes) -> str | None:
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return '.png'
    if data.startswith(b'\xff\xd8\xff'):
        return '.jpg'
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return '.webp'
    return None


def download_best_image(model: str, slug: str) -> tuple[bool, str]:
    queries = [
        f'"{model}" pc fan',
        f'{model} fan',
        f'{model} cooler fan',
    ]

    for query in queries:
        try:
            urls = search_image_urls(query)
        except Exception as exc:
            continue

        for candidate in urls[:24]:
            try:
                data = fetch(candidate, timeout=25)
            except Exception:
                continue

            if len(data) < 25_000:
                continue

            ext = guess_extension(data)
            if not ext:
                continue

            temp_file = OUT_DIR / f'__temp_{slug}{ext}'
            temp_file.write_bytes(data)

            output_file = OUT_DIR / f'{slug}.png'
            try:
                subprocess.run(
                    [
                        'magick',
                        str(temp_file),
                        '-auto-orient',
                        '-resize',
                        '1024x1024^',
                        '-gravity',
                        'center',
                        '-extent',
                        '1024x1024',
                        str(output_file),
                    ],
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                temp_file.unlink(missing_ok=True)
                continue

            temp_file.unlink(missing_ok=True)
            return True, candidate

    return False, ''


def main() -> None:
    cpu_models = get_models(CPU_CSV)
    an_models = get_models(AN_CSV)

    slug_to_model: dict[str, str] = {}
    for model in cpu_models + an_models:
        slug = slugify_model(model)
        if slug not in slug_to_model:
            slug_to_model[slug] = model

    report: list[tuple[str, str, bool, str]] = []

    items = sorted(slug_to_model.items(), key=lambda it: it[0])
    total = len(items)
    print(f'Need images for {total} models')

    for idx, (slug, model) in enumerate(items, start=1):
        ok, source = download_best_image(model, slug)
        report.append((slug, model, ok, source))
        status = 'OK' if ok else 'FAIL'
        print(f'[{idx:02d}/{total}] {status} {slug} :: {model}')
        if ok:
            print(f'       source: {source}')
        time.sleep(0.55)

    ok_count = sum(1 for _, _, ok, _ in report if ok)
    fail = [(s, m) for s, m, ok, _ in report if not ok]

    print('\nSummary')
    print(f'  success: {ok_count}/{total}')
    if fail:
        print('  failed:')
        for slug, model in fail:
            print(f'    - {slug}: {model}')


if __name__ == '__main__':
    main()
