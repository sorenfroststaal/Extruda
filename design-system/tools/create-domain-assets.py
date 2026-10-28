"""Extend the existing outlined wordmark without changing its seven original letters.

Build dependency: FontTools; supply the original Manrope variable font with --font.
The distributed SVGs contain outlines and have no font or package dependency.
"""
import argparse
import json
import math
import re
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[2]
PALETTE = {
    "color": None, "black": "#000000", "white": "#FFFFFF",
    "cream": "#F5F0E8", "graphite": "#343B3B", "petrol": "#28645F",
    "teal": "#619B98", "apricot": "#E8B08E",
}


def build(font_path):
    font = instantiateVariableFont(TTFont(font_path), {"wght": 800}, inplace=False)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = 118 / font["OS/2"].sxHeight
    source = (ROOT / "Assets/Brand/extruda-logo-horizontal-color.svg").read_text(encoding="utf-8")
    mark = source[source.index(">") + 1:source.index('<g transform="translate(268 182)">')].strip()
    original_letters = re.findall(r'<path[^>]+d="([^"]+)"', source[source.index('<g transform="translate(268 182)">'):])
    position, all_paths = 0, []
    for char in "extruda.dk":
        glyph = glyphs[cmap[ord(char)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, position, 0)))
        all_paths.append(pen.getCommands())
        position += glyph.width * scale
    if all_paths[:7] != original_letters:
        raise ValueError("The font does not match the seven original outlined letters.")
    output = ROOT / "design-system/icons/logos"
    records = []
    for variant, fill in PALETTE.items():
        symbol = mark if fill is None else re.sub(r'fill="#[0-9A-Fa-f]+"', f'fill="{fill}"', mark)
        letters = ''.join(f'<path fill="{fill or "#343B3B"}" d="{d}"/>' for d in all_paths)
        layouts = {
            "horizontal": (math.ceil(position + 292), 256, symbol + f'<g transform="translate(268 182)">{letters}</g>'),
            "wordmark": (math.ceil(position + 24), 220, f'<g transform="translate(12 190)">{letters}</g>'),
            "stacked": (math.ceil(position + 32), 470, f'<g transform="translate({(position + 32 - 256) / 2:.2f} 0)">{symbol}</g><g transform="translate(16 438)">{letters}</g>'),
        }
        for layout, (width, height, inner) in layouts.items():
            filename = f'extruda-dk-{layout}-{variant}.svg'
            svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="extruda.dk {layout} {variant}">\n{inner}\n</svg>\n'
            (output / filename).write_text(svg, encoding="utf-8")
            records.append({"file": filename, "layout": layout, "variant": variant, "viewBox": [0, 0, width, height]})
    # Homepage aliases: retain the same canonical master geometry.
    for variant in ["color", "white"]:
        (ROOT / f'Assets/Brand/extruda-dk-logo-horizontal-{variant}.svg').write_bytes((output / f'extruda-dk-horizontal-{variant}.svg').read_bytes())
    manifest = {
        "brand": "extruda.dk", "wordmark": "Manrope 800, outlined",
        "variants": list(PALETTE), "files": records,
        "runtimeDependencies": [], "externalReferences": False,
    }
    (ROOT / "design-system/icons/domain-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f'Created {len(records)} outlined SVG logo variants. Original extruda curves match exactly.')


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--font", type=Path, required=True, help="Original Manrope variable TTF")
    build(parser.parse_args().font)
