#!/usr/bin/env python3
"""Reproduce the approved second-video full frames and thumbnails for review.

Requires FFmpeg and Pillow. The private input never enters the repository.
Example: python3 scripts/extract-pine-frames.py /private/path/PXL_20261003_133858340.TS.mp4
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, default=Path('tmp/pine-reextract'))
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    if not args.source.is_file():
        parser.error('Source video does not exist')
    out = args.output.resolve()
    if out.is_relative_to((root / 'public').resolve()):
        parser.error('Use a review directory outside public; production is never overwritten')
    manifest = json.loads((root / 'content/scene-09.manifest.json').read_text())
    assets = manifest['assets']
    if not assets or any(a['sourceFrame'] >= b['sourceFrame'] for a, b in zip(assets, assets[1:])):
        parser.error('Manifest requires strictly increasing source frame indices')
    (out / 'thumbs').mkdir(parents=True, exist_ok=True)
    # Select by decoded source frame index, not a rounded seek or an invented fps.
    selection = '+'.join(f'eq(n\\,{item["sourceFrame"]})' for item in assets)
    result = subprocess.run([
        'ffmpeg', '-hide_banner', '-nostdin', '-threads', '2', '-i', str(args.source),
        '-map', '0:v:0', '-vf', 'select=' + selection + ',showinfo', '-fps_mode', 'vfr',
        '-map_metadata', '-1', '-an', '-c:v', 'libwebp', '-quality', '86',
        '-compression_level', '6', '-y', str(out / 'view-%02d.webp'),
    ], capture_output=True, text=True, check=True, timeout=600)
    pts = [int(m[1]) for m in re.finditer(r'n:\s*\d+\s+pts:\s*(\d+)\s+pts_time:', result.stderr)]
    if pts != [item['sourcePTS'] for item in assets]:
        raise RuntimeError('Decoded timestamps differ; verify the original recording before using output')
    records = []
    for index, asset in enumerate(assets, 1):
        file = out / f'view-{index:02d}.webp'
        thumb = out / 'thumbs' / file.name
        with Image.open(file) as image:
            if image.size != (1920, 1080):
                raise RuntimeError(f'{file.name}: not a full 1920 x 1080 source frame')
            image.convert('RGB').resize((320, 180), Image.Resampling.LANCZOS).save(
                thumb, 'WEBP', quality=72, method=6)
        for candidate, expected in ((file, asset), (thumb, asset['thumbnail'])):
            data = candidate.read_bytes()
            digest = hashlib.sha256(data).hexdigest()
            records.append({'file': str(candidate.relative_to(out)), 'sha256': digest,
                            'bytes': len(data), 'matchesPublished': digest == expected['sha256']})
    report = {'source': args.source.name, 'timestampCheck': 'passed', 'files': records,
              'note': 'Encoder-version differences require a fresh visual review, not silent replacement.'}
    (out / 'reproduction.json').write_text(json.dumps(report, indent=2) + '\n')
    matching = sum(item['matchesPublished'] for item in records)
    print(f'{matching}/{len(records)} files match published SHA-256; timestamps checked. Review output: {out}')


if __name__ == '__main__':
    main()
