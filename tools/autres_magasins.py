#!/usr/bin/env python3
"""Add the download buttons of the other Android stores (Uptodown, Xiaomi GetApps,
Samsung Galaxy Store, Huawei AppGallery) under a game, next to App Store and Google Play.

RULE: a button is published only once the game's page really exists on that store.
So LINKS starts empty: add a line only with the real, checked public link of the game's
page on the store, then run the script. Nothing is shown for a store without a link.

Applies to the home page card and the game page, in every language. Idempotent: a page
that already has the button of a store (data-store="...") keeps it, with its link updated.
The labels are store names, the same in every language, so no translation is needed.

Run: python tools/autres_magasins.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Store key -> (small line, store name). Same look as the Google Play button.
STORES = {
    "uptodown": ("Android", "Uptodown"),
    "xiaomi": ("Android", "Xiaomi GetApps"),
    "galaxy": ("Samsung", "Galaxy Store"),
    "huawei": ("Huawei", "AppGallery"),
}
ORDER = list(STORES)

# Game page folder -> {store key: real public URL of the game's page on that store}.
# Example: "cocoboum/": {"uptodown": "https://cocoboum.fr.uptodown.com/android"},
LINKS: dict[str, dict[str, str]] = {
}

# Name shown to screen readers, per game folder.
NAMES = {
    "cocoboum/": "COCOBOUM!",
    "tableauxensorceles/": "Les Tableaux Ensorcelés",
    "mieuxchaquejour/": "Mieux Chaque Jour",
    "royaumedesenigmes/": "Royaume des Énigmes",
    "royaumedesmotscroises/": "Royaume des Mots Croisés",
    "caligulavsgladiators/": "Caligula vs Gladiators",
    "sauvequifleche/": "Sauve qui Flèche !",
    "gnomedescavernes/": "Le Gnome des Cavernes Enchantées",
    "chateaudeslumieres/": "Le Château des Lumières",
    "petitdragon/": "Le Petit Dragon",
    "tailleurdenuages/": "Le Tailleur de Nuages",
    "rouagesenchantes/": "Les Rouages Enchantés",
    "royaumedesrunes/": "Royaume des Runes",
    "serpentdesrunes/": "Serpent des Runes",
}

ICON = ('<svg class="apple-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
        '<path fill="currentColor" d="M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4 6.3 10.7l1.4-1.4L11 12.6V3zM5 19h14v2H5z"/></svg>')
ROW = re.compile(r'<div class="other-stores">.*?</div>', re.S)
# Last store element of a block: App Store / Google Play button, or a "coming soon" label.
STORE_ITEM = re.compile(r'<a class="button[^"]*button-appstore[^"]*"[^>]*>.*?</a>'
                        r'|<span class="button button-soon">[^<]*</span>'
                        r'|<span class="badge-soon">(?:[^<]|<small>[^<]*</small>)*</span>', re.S)


def button(store: str, url: str, name: str) -> str:
    small, label = STORES[store]
    href = url.replace("&amp;", "&").replace("&", "&amp;")
    return (f'<a class="button button-appstore button-other" data-store="{store}" href="{href}" '
            f'aria-label="{name} - {label}" rel="noopener">{ICON}'
            f'<span class="store-label"><small>{small}</small>{label}</span></a>')


def row(links: dict[str, str], name: str) -> str:
    return ('<div class="other-stores">'
            + "".join(button(s, links[s], name) for s in ORDER if links.get(s)) + '</div>')


def update_block(block: str, links: dict[str, str], name: str) -> str:
    new_row = row(links, name)
    if ROW.search(block):
        return ROW.sub(lambda m: new_row, block, count=1)
    items = list(STORE_ITEM.finditer(block))
    if not items:
        raise SystemExit(f"no store button in block of {name}")
    end = items[-1].end()
    return block[:end] + new_row + block[end:]


def process(path: Path, folder: str, links: dict[str, str], name: str) -> bool:
    html = path.read_text(encoding="utf-8")
    home = path.parent.name != folder.rstrip("/")
    if home:
        cards = [c for c in re.findall(r'<article class="project-card [^"]*".*?</article>', html, re.S)
                 if f'href="{folder}"' in c]
        if not cards:
            return False
        block = cards[0]
    else:
        m = re.search(r'<div class="royal-copy">.*?</div>', html, re.S)
        if not m:
            raise SystemExit(f"{path}: no royal-copy block")
        block = m.group(0)
        # royal-copy may already end inside our row: take the block up to the row's end.
        if '<div class="other-stores">' in block:
            block = re.search(r'<div class="royal-copy">.*?<div class="other-stores">.*?</div>', html, re.S).group(0)
    new = update_block(block, links, name)
    if new == block:
        return False
    path.write_text(html.replace(block, new, 1), encoding="utf-8")
    return True


def main() -> None:
    codes = [""] + sorted(p.name for p in ROOT.iterdir() if p.is_dir() and (p / "cocoboum/index.html").exists())
    changed = 0
    for folder, links in LINKS.items():
        links = {s: u for s, u in links.items() if u}
        unknown = set(links) - set(STORES)
        if unknown:
            raise SystemExit(f"{folder}: unknown store {unknown}")
        if not links:
            continue
        for code in codes:
            base = ROOT / code if code else ROOT
            for page in (base / "index.html", base / folder / "index.html"):
                if page.exists():
                    changed += process(page, folder, links, NAMES[folder])
    print(f"updated {changed} pages")


if __name__ == "__main__":
    main()
