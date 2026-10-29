#!/usr/bin/env python3
"""Switch a game from "coming soon" to its real App Store button, in every language.

Apple approved Sauve qui Flèche ! Casse-tête on 29/10/2026 (id6823751966).
For each language, the texts come from that language's Royaume des Mots
Croisés page, which is already out on iPhone and still coming to Android:
- the gold App Store button (visitor's own storefront, campaign parameters),
  on the game page and on its home card;
- the eyebrow "mobile game on iPhone" and the answer "available now on the
  App Store..." (game name swapped);
- the Smart App Banner and the downloadUrl/installUrl of the app card.
The Android "coming soon" badge stays. Idempotent; run after any rebuild of
the pages (tools/nouveaux_jeux.py runs it itself):
    python3 tools/sortie_appstore.py
"""
from pathlib import Path
import json
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from langues import LANGS, page_path  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SOURCE, SOURCE_NAME, SOURCE_ID = "royaumedesmotscroises", "Royaume des Mots Croisés", "6817612983"
PROVIDER = "129524141"

# folder, name shown on the site, App Store id
RELEASED = [("sauvequifleche", "Sauve qui Flèche !", "6823751966")]

# Languages whose description does not end with the page eyebrow:
# (old last sentence, new last sentence). "{ey}" is the new eyebrow.
DESC_END = {
    "fr": ("Bientôt sur iPhone et Android.", "Disponible sur iPhone, bientôt sur Android."),
    "my": ("မကြာမီ iPhone နှင့် Android တွင်။", "{ey}။"),
    "mn": ("Удахгүй iPhone, Android дээр.", "{ey}."),
}


def sub1(pattern: str, repl: str, text: str, where: str) -> str:
    new, n = re.subn(pattern, lambda _m: repl, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{where}: pattern not found: {pattern}")
    return new


def eyebrow(html: str) -> str:
    return re.search(r'<div class="royal-copy">\s*<p class="eyebrow">([^<]*)', html).group(1)


def last_answer(html: str) -> str:
    guide = re.search(r'<section class="seo-game-guide.*?</section>', html, re.S).group(0)
    return re.findall(r"<h3>[^<]*</h3>\s*<p>([^<]*)</p>", guide)[-1]


def store_button(button: str, folder: str, name: str, app_id: str, campaign: str) -> str:
    link = f"https://apps.apple.com/app/id{app_id}?pt={PROVIDER}&amp;ct={campaign}&amp;mt=8"
    button = re.sub(r'href="[^"]*"', f'href="{link}"', button, count=1)
    return button.replace(SOURCE_NAME, name)


def release_page(code: str, folder: str, name: str, app_id: str) -> None:
    path, where = page_path(code, folder + "/"), f"{code}/{folder}"
    html = path.read_text(encoding="utf-8")
    if f"id{app_id}" in html:
        return
    src = page_path(code, SOURCE + "/").read_text(encoding="utf-8")
    old_ey, new_ey = eyebrow(html), eyebrow(src)

    # Description (meta, Open Graph, app card): its last sentence said "coming soon".
    old_end, new_end = DESC_END.get(code, (old_ey, new_ey))
    new_end = new_end.format(ey=new_ey)
    if html.count(old_end) < 3:
        raise SystemExit(f"{where}: description ending not found: {old_end!r}")
    if code != "fr":
        html = html.replace(old_ey, new_ey)  # eyebrow + descriptions
    html = html.replace(old_end, new_end)

    # "When can I download it?": visible answer and FAQ data.
    answer = last_answer(src).replace(SOURCE_NAME, name)
    old_answer = last_answer(html)
    if html.count(old_answer) < 2:
        raise SystemExit(f"{where}: download answer not found twice")
    html = html.replace(old_answer, answer)

    button = re.search(r'<a class="button button-store button-appstore".*?</a>', src, re.S).group(0)
    html = sub1(r'<span class="button button-soon">[^<]*</span>',
                store_button(button, folder, name, app_id, "site-" + folder), html, where)

    banner = f'<meta name="apple-itunes-app" content="app-id={app_id}, affiliate-data=pt={PROVIDER}&amp;ct=site-banner" />'
    html = sub1(r'<meta charset="utf-8" />', '<meta charset="utf-8" />' + banner, html, where)
    if code == "fr":  # the French page keeps one tag per line
        html = html.replace(banner, "\n    " + banner)

    def app_card(m):
        data = json.loads(m.group(1))
        if data.get("@type") != "SoftwareApplication":
            return m.group(0)
        store = f"https://apps.apple.com/app/id{app_id}"
        offers = data.pop("offers")
        data.update(operatingSystem="iOS", downloadUrl=store, installUrl=store, offers=offers)
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>"
    html = re.sub(r'<script type="application/ld\+json">(.*?)</script>', app_card, html, flags=re.S)

    if "button-soon" in html or "apps.apple.com/app/id" + app_id not in html:
        raise SystemExit(f"{where}: release incomplete")
    path.write_text(html, encoding="utf-8")


def release_home(code: str, folder: str, name: str, app_id: str) -> None:
    path, where = page_path(code, ""), f"{code}/index.html"
    html = path.read_text(encoding="utf-8")
    card = next(c for c in re.findall(r'<article class="project-card [^"]*".*?</article>', html, re.S)
                if f'href="{folder}/"' in c)
    if f"id{app_id}" in card:
        return
    source_card = next(c for c in re.findall(r'<article class="project-card [^"]*".*?</article>', html, re.S)
                       if f'href="{SOURCE}/"' in c)
    button = re.search(r'<a class="button button-store button-appstore".*?</a>', source_card, re.S).group(0)
    new = sub1(r'<span class="button button-soon">[^<]*</span>',
               store_button(button, folder, name, app_id, "site-accueil"), card, where)
    if code != "fr":  # "Coming soon to iPhone and Android" -> "Mobile game on iPhone"
        src_ey = eyebrow(page_path(code, SOURCE + "/").read_text(encoding="utf-8"))
        new = sub1(r'<p class="eyebrow">[^<]*</p>', f'<p class="eyebrow">{src_ey}</p>', new, where)
    path.write_text(html.replace(card, new), encoding="utf-8")


def release_llms(folder: str) -> None:
    path = ROOT / "llms.txt"
    text = path.read_text(encoding="utf-8")
    desc = re.search(r'<meta name="description" content="([^"]*)"',
                     page_path("en", folder + "/").read_text(encoding="utf-8")).group(1)
    text = re.sub(rf"(\(https://contegames\.com/en/{folder}/\): )[^\n]*", lambda m: m.group(1) + desc, text)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    for folder, name, app_id in RELEASED:
        for code, _, _ in LANGS:
            release_page(code, folder, name, app_id)
            release_home(code, folder, name, app_id)
        release_llms(folder)
    print(f"{len(LANGS)} languages, {len(RELEASED)} game(s) on the App Store")


if __name__ == "__main__":
    main()
