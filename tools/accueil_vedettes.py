#!/usr/bin/env python3
"""Home page: put the games that keep their players first, and feature one at the top.

1. The cards of FIRST (in this order) move to the top of the list of games. The painted
   frames keep their original rhythm (lion, dragon, nature, tableaux...) by position.
2. The hero gets the featured game (FEATURED): its icon, its name and its real store
   buttons, copied from its own card, so every word is already translated. On a phone,
   analytics.js marks the system (os-ios / os-android) and styles.css keeps only the
   button of that phone's store. The old "explore" button stays as a link underneath.
   These buttons carry their own campaign (site-accueil-haut) so App Store Connect and
   Google Play tell them apart from the cards.

Idempotent. Run from the repository root:  python3 tools/accueil_vedettes.py
"""
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from langues import LANGS, page_path  # noqa: E402

FIRST = ["sauvequifleche/", "caligulavsgladiators/"]
FEATURED = "sauvequifleche/"
CAMPAIGN = "site-accueil-haut"
STYLES_V, ANALYTICS_V = "16", "4"

CARD = re.compile(r'<article class="project-card [^"]*">.*?</article>', re.S)
PANEL = re.compile(r'(<article class="project-card )([a-z]+-panel)')
HERO_BUTTON = re.compile(r'<a class="button" href="#projets">(.*?)</a>', re.S)
HERO_BLOCK = re.compile(r'<div class="hero-featured".*?</div><!--/hero-featured-->', re.S)
EXPLORE = re.compile(r'<a class="discover hero-all" href="#projets">(.*?)</a>', re.S)
STORE_LINK = re.compile(r'<a class="button [^"]*button-appstore[^"]*" href="https://(?:apps\.apple\.com|play\.google\.com)/.*?</a>', re.S)


def game_of(card: str) -> str:
    m = re.search(r'<a class="project-thumb" href="(?:\.\./)?([a-z]+/)"', card)
    return m.group(1) if m else ""


def reorder(html: str) -> str:
    cards = list(CARD.finditer(html))
    if not cards:
        raise SystemExit("no game card found")
    texts = [c.group(0) for c in cards]
    panels = [PANEL.search(t).group(2) for t in texts]
    front = [t for g in FIRST for t in texts if game_of(t) == g]
    if len(front) != len(FIRST):
        raise SystemExit("a game of FIRST has no card")
    ordered = front + [t for t in texts if t not in front]
    ordered = [PANEL.sub(lambda m, p=p: m.group(1) + p, t, count=1) for t, p in zip(ordered, panels)]
    out, last = [], 0
    for c, t in zip(cards, ordered):
        out += [html[last:c.start()], t]
        last = c.end()
    return "".join(out) + html[last:]


def hero(html: str) -> str:
    card = next(c.group(0) for c in CARD.finditer(html) if game_of(c.group(0)) == FEATURED)
    thumb = re.search(r'<a class="project-thumb" href="([^"]+)"><img src="([^"]+)" alt="([^"]*)"', card)
    page, icon, name = thumb.groups()
    stores = STORE_LINK.findall(card)
    if not stores:
        raise SystemExit("featured game has no store button")
    stores = [s.replace("ct=site-accueil&amp;", f"ct={CAMPAIGN}&amp;")
               .replace("utm_campaign%3Dsite-accueil", f"utm_campaign%3D{CAMPAIGN}") for s in stores]
    old = HERO_BLOCK.search(html)
    explore = (EXPLORE.search(old.group(0)) if old else HERO_BUTTON.search(html)).group(1)
    block = (
        '<div class="hero-featured">'
        f'<a class="hero-featured-game" href="{page}"><img src="{icon}" alt="" width="72" height="72" decoding="async" />'
        f'<span>{name}</span></a>'
        + "".join(stores)
        + f'<a class="discover hero-all" href="#projets">{explore}</a>'
        '</div><!--/hero-featured-->'
    )
    if old:
        return html[:old.start()] + block + html[old.end():]
    return HERO_BUTTON.sub(lambda m: block, html, count=1)


def versions(html: str) -> str:
    html = re.sub(r'(styles\.css\?v=)\d+', r'\g<1>' + STYLES_V, html)
    return re.sub(r'(analytics\.js\?v=)\d+', r'\g<1>' + ANALYTICS_V, html)


def main() -> None:
    changed = 0
    for code, _, _ in LANGS:
        path = page_path(code, "")
        html = path.read_text(encoding="utf-8")
        new = versions(hero(reorder(html)))
        if new != html:
            path.write_text(new, encoding="utf-8")
            changed += 1
    print(f"updated {changed} home pages")


if __name__ == "__main__":
    main()
