#!/usr/bin/env python3
"""Re-extract the approved clearing stills for review (requires ffmpeg and Pillow).

Usage: python3 scripts/extract-clearing-frames.py /private/path/PXL_20261003_133858340.TS.mp4
The source is never copied. Output defaults to ignored tmp/clearing-reextract.
The manifest is not rewritten: differing encoder versions require a fresh review.
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
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path("tmp/clearing-reextract"))
    args = parser.parse_args()
    if not args.source.is_file():
        parser.error("Source video does not exist")
    root = Path(__file__).resolve().parents[1]
    manifest = json.loads((root / "content/scene-09.manifest.json").read_text())
    output = args.output.resolve()
    if output == (root / "public/assets/scene-09").resolve():
        parser.error("Use a review directory, not the production asset directory")
    (output / "thumbs").mkdir(parents=True, exist_ok=True)
    report = []
    for item in manifest["assets"]:
        name = Path(item["path"]).name
        dest = output / name
        result = subprocess.run([
            "ffmpeg", "-hide_banner", "-nostdin", "-copyts", "-ss",
            str(max(0, item["sourceTimeSeconds"] - .00001)), "-i", str(args.source),
            "-map", "0:v:0", "-vf", "showinfo", "-frames:v", "1", "-map_metadata", "-1",
            "-an", "-c:v", "libwebp", "-quality", "86", "-compression_level", "6",
            "-update", "1", "-y", str(dest),
        ], capture_output=True, text=True, timeout=120, check=True)
        match = re.search(r"n:\s*0\s+pts:\s*\d+\s+pts_time:([\d.]+)", result.stderr)
        if match is None or abs(float(match[1]) - item["sourceTimeSeconds"]) > .001:
            raise RuntimeError(f"Wrong decoded presentation timestamp for {name}")
        with Image.open(dest) as image:
            if image.size != (1920, 1080):
                raise RuntimeError(f"Wrong dimensions for {name}: {image.size}")
            image.resize((320, 180), Image.Resampling.LANCZOS).save(
                output / "thumbs" / name, quality=72, method=6)
        for target, expected in [(dest, item), (output / "thumbs" / name, item["thumbnail"])]:
            digest = hashlib.sha256(target.read_bytes()).hexdigest()
            report.append({"path": str(target.relative_to(output)), "sha256": digest,
                           "matchesPublishedBytes": digest == expected["sha256"]})
        print(f"{item['id']}: decoded {item['sourceTimeSeconds']:.6f} s")
    (output / "extraction-report.json").write_text(json.dumps(report, indent=2) + "\n")
    print("Review all frames before replacing assets. Encoder differences can change hashes.")


if __name__ == "__main__":
    main()
