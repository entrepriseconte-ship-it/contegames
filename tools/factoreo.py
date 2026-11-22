#!/usr/bin/env python3
"""Add the Factoreo frame (quotes and invoices software, https://www.factoreo.fr/) to every home page.

Same golden frame as the games, placed after the last game card of the home page.
Texts: tools/factoreo_textes.txt (code|eyebrow|card text|link label). Idempotent.
Run from the repository root: python3 tools/factoreo.py
"""
from html import escape
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import langues  # noqa: E402

URL = "https://www.factoreo.fr/"
FRAME = ('<div class="parchment" aria-hidden="true"></div><div class="frame-art" aria-hidden="true">'
         '<span class="frame-top"></span><span class="frame-middle"></span><span class="frame-bottom"></span></div>')
TEXTS = {}
for line in (ROOT / "tools/factoreo_textes.txt").read_text(encoding="utf-8").splitlines():
    if line.strip():
        code, ey, card, visit = line.split("|")
        TEXTS[code] = (ey, card, visit)


def card(code: str, assets: str) -> str:
    ey, text, visit = (escape(t, quote=True) for t in TEXTS[code])
    link = f'href="{URL}" target="_blank" rel="noopener"'
    return (f'<!--factoreo--><article class="project-card lion-panel framed-panel factoreo-card">{FRAME}'
            f'<div class="project-content"><p class="eyebrow">{ey}</p><h3>Factoreo</h3>'
            f'<a class="project-thumb" {link}><img src="{assets}factoreo-icone.jpg" alt="Factoreo" loading="lazy" width="540" height="540" /></a>'
            f'<p>{text}</p><div class="project-links">'
            f'<a class="button button-appstore button-site" {link} aria-label="Factoreo - {visit}"><span class="store-label"><small>{visit}</small>factoreo.fr</span></a>'
            f'</div></div></article><!--/factoreo-->')


def home(code: str) -> None:
    path = ROOT / ("index.html" if code == "fr" else f"{code}/index.html")
    html = path.read_text(encoding="utf-8")
    html = re.sub(r"<!--factoreo-->.*?<!--/factoreo-->", "", html, flags=re.S)
    assets = re.search(r'<img src="([^"]*)royaume-icone\.jpg"', html).group(1)
    end = "<!--/jeux-novembre-->"
    if end not in html:
        raise SystemExit(f"{path}: no game cards marker")
    html = html.replace(end, end + card(code, assets), 1)
    path.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    codes = [c for c, _h, _n in langues.LANGS]
    missing = [c for c in codes if c not in TEXTS]
    if missing:
        raise SystemExit(f"missing texts: {missing}")
    for c in codes:
        home(c)
    print(f"{len(codes)} home pages")
