#!/usr/bin/env python3
"""Add Caligula vs Gladiators, Sauve qui Flèche ! and Royaume des Énigmes to the site.

For each of the 30 languages, builds the game page from that language's
Royaume des Mots Croisés page (same layout, same frames) and adds a second
row of three cards under the four existing cards of the home page.
Games not public yet show "coming soon" for the App Store and Android, never
a store link; once Apple publishes one, tools/sortie_appstore.py (run at the
end) gives it its App Store button. A game gets its YouTube video in the large frame once
its link is in VIDEO; until then its App Store icon is shown.
Idempotent: run from the repository root, python3 tools/nouveaux_jeux.py
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from nouveaux_jeux_textes import T  # noqa: E402

CODES = ["fr", "en", "es", "de", "it", "pt", "ja", "ko", "zh-cn", "zh-tw", "hi", "id", "pt-br", "es-mx",
         "ar", "tr", "ru", "nl", "pl", "th", "vi", "uk", "sv", "ms", "ro", "el", "cs", "hu", "fi", "he"]
TEMPLATE = "royaumedesmotscroises"

# key, folder, name shown, official App Store name, icon, home frame, French-only help links, French title with line break
GAMES = [
    ("c", "caligulavsgladiators", "Caligula vs Gladiators", "Caligula vs Gladiators", "caligula-icone.jpg", "lion-panel",
     [("assistance.html", "Assistance"), ("confidentialite.html", "Confidentialité")], "Caligula<br />vs Gladiators"),
    ("s", "sauvequifleche", "Sauve qui Flèche !", "Sauve qui Flèche ! Casse-tête", "sauvequifleche-icone.jpg", "dragon-panel",
     [("confidentialite.html", "Confidentialité")], "Sauve qui<br />Flèche !"),
    ("r", "royaumedesenigmes", "Royaume des Énigmes", "Royaume des Énigmes", "royaumedesenigmes-icone.jpg", "nature-panel",
     [("assistance.html", "Assistance"), ("confidentialite.html", "Confidentialité")], "Royaume des<br />Énigmes"),
]
# YouTube video id per game, given by the studio owner.
VIDEO = {"s": "mhKhM_90sWo"}

FRAME = ('<div class="parchment" aria-hidden="true"></div><div class="frame-art" aria-hidden="true">'
         '<span class="frame-top"></span><span class="frame-middle"></span><span class="frame-bottom"></span></div>')


def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def sub1(pattern: str, repl: str, text: str, where: str) -> str:
    new, n = re.subn(pattern, lambda _m: repl, text, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{where}: pattern not found: {pattern}")
    return new


def page_path(code: str, folder: str) -> Path:
    return ROOT / (folder if code == "fr" else f"{code}/{folder}") / "index.html"


def url(code: str, folder: str) -> str:
    return "https://contegames.com/" + ("" if code == "fr" else code + "/") + folder + "/"


def build_page(code: str, game: tuple) -> None:
    key, folder, name, official, icon, _panel, fr_links, fr_h1 = game
    L, G = T[code], T[code][key]
    tr = G.get("tr")
    html = page_path(code, TEMPLATE).read_text(encoding="utf-8")
    where = f"{code}/{folder}"
    yt_label = re.search(r'class="button button-youtube"[^>]*>([^<]+)<', html).group(1)
    html = html.replace(TEMPLATE, folder)

    title = f"{name} | {G['genre']}" if code == "fr" else f"{G['genre']} | {name}"
    html = sub1(r"<title>.*?</title>", f"<title>{esc(title)}</title>", html, where)
    for attr in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        html = re.sub(rf'(<meta {attr} content=")[^"]*"', lambda m: m.group(1) + esc(G["desc"]) + '"', html)
    for attr in ('property="og:title"', 'name="twitter:title"'):
        html = re.sub(rf'(<meta {attr} content=")[^"]*"', lambda m: m.group(1) + esc(title) + '"', html)

    def json_ld(m):
        data = json.loads(m.group(1))
        if data.get("@type") == "SoftwareApplication":
            data = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": official,
                    **({"alternateName": tr} if tr else {}), "description": G["desc"], "url": url(code, folder),
                    "image": f"https://contegames.com/assets/{icon}", "operatingSystem": "iOS, Android",
                    "applicationCategory": "GameApplication", "inLanguage": code if code != "fr" else "fr",
                    # Every studio game is free (ads-funded): Google's app card shows the price.
                    "offers": {"@type": "Offer", "price": 0, "priceCurrency": "EUR"},
                    "author": data["author"]}
        elif data.get("@type") == "BreadcrumbList":
            data["itemListElement"][1]["name"] = name
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>"
    html = re.sub(r'<script type="application/ld\+json">(.*?)</script>', json_ld, html, flags=re.S)

    prefix = "../" if code == "fr" else "../../"
    if key in VIDEO:
        hero = (f'<figure class="hero-video"><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/{VIDEO[key]}?rel=0" '
                f'title="{esc(name)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
                'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></figure>')
    else:
        hero = f'<img class="official-logo" src="{prefix}assets/{icon}" alt="{esc(name)}" width="540" height="540" />'
    html = sub1(r'<figure class="hero-video">.*?</figure>', hero, html, where)

    if code == "fr":
        eyebrow, h1, h1_class = f"{G['ey']} · iPhone et Android", fr_h1, "game-title"
    else:
        eyebrow = L["page_ey"]
        h1 = esc(name) + (f'<span class="title-translation">{esc(tr)}</span>' if tr else "")
        h1_class = "game-title game-title-fit"
    copy = (f'<div class="royal-copy"><p class="eyebrow">{esc(eyebrow)}</p><h1 id="game-title" class="{h1_class}">{h1}</h1>'
            f'<p class="hero-tagline">{esc(G["tag"])}</p><span class="button button-soon">{esc(L["soon_store"])}</span>'
            f'<span class="badge-soon">{esc(L["android"])}</span></div>')
    html = sub1(r'<div class="royal-copy">.*?</div>', copy, html, where)

    guide = (f'<section class="seo-game-guide page-width" aria-labelledby="guide-projet"><h2 id="guide-projet">{esc(G["h2"])}</h2>'
             f'<p>{esc(G["p1"])}</p><h3>{esc(L["q_how"])}</h3><p>{esc(G["p2"])}</p>'
             f'<h3>{esc(L["q_when"])}</h3><p>{esc(L["a_when"].format(name=name))}</p>')
    if key in VIDEO:
        guide += (f'<p><a class="button button-youtube" href="https://www.youtube.com/shorts/{VIDEO[key]}" target="_blank" '
                  f'rel="noopener">{esc(yt_label)}</a></p>')
    html = sub1(r'<section class="seo-game-guide.*?</section>', guide + "</section>", html, where)

    html = re.sub(
        r'(<div class="story-content">\s*<p class="eyebrow">)Royaume des Mots Croisés(</p>)',
        lambda m: m.group(1) + esc(name) + m.group(2), html, count=1)
    items = "".join(f"<li>{esc(x)}</li>" for x in G["f"])
    html = sub1(r'<ul class="game-features">.*?</ul>', f'<ul class="game-features">{items}</ul>', html, where)
    if code == "fr":
        links = "".join(f'<li><a href="{href}">{"Politique de confidentialité" if href.startswith("conf") else label}</a></li>'
                        for href, label in fr_links)
        html = sub1(r'<ul class="legal-list">.*?</ul>', f'<ul class="legal-list">{links}</ul>', html, where)

    for left in ("Mots Croisés", "6817612983", "JVnfulHUOPo", "apps.apple.com", "button-appstore"):
        if left in html:
            raise SystemExit(f"{where}: leftover {left!r}")
    out = page_path(code, folder)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")


def build_home(code: str) -> None:
    path = ROOT / ("index.html" if code == "fr" else f"{code}/index.html")
    html = path.read_text(encoding="utf-8")
    L = T[code]
    tpl = re.search(r'<article class="project-card dragon-panel.*?</article>', html, re.S).group(0)
    discover = re.search(r'class="discover"[^>]*>([^<]*)<', tpl).group(1)
    assets = re.search(r'<img src="([^"]*)royaume-icone\.jpg"', tpl).group(1)
    cards = []
    for key, folder, name, _official, icon, panel, fr_links, fr_h1 in GAMES:
        G = L[key]
        if code == "fr":
            eyebrow, h3 = G["ey"], fr_h1
            small = " · ".join(f'<a href="{folder}/{href}">{label}</a>' for href, label in fr_links)
            small = f'<span class="small-links">{small}</span>'
        else:
            eyebrow, small = L["page_ey"], ""
            h3 = esc(name) + (f'<span class="title-translation">{esc(G["tr"])}</span>' if G.get("tr") else "")
        cards.append(
            f'<article class="project-card {panel} framed-panel">{FRAME}<div class="project-content">'
            f'<p class="eyebrow">{esc(eyebrow)}</p><h3>{h3}</h3>'
            f'<a class="project-thumb" href="{folder}/"><img src="{assets}{icon}" alt="{esc(name)}" loading="lazy" width="540" height="540" /></a>'
            f'<p>{esc(G["card"])}</p><div class="project-links"><a class="discover" href="{folder}/">{discover}</a>'
            f'<span class="button button-soon">{esc(L["soon_store"])}</span><span class="badge-soon">{esc(L["android"])}</span>{small}</div></div></article>')
    sep = "\n          " if code == "fr" else ""
    block = f'<div class="projects projects-more">{sep}' + sep.join(cards) + ("\n        " if code == "fr" else "") + "</div>"
    if "projects-more" in html:
        html = sub1(r'<div class="projects projects-more">.*?</article>\s*</div>', block, html, str(path))
    else:
        end = html.index("</article>", html.index("tableaux-panel")) + len("</article>")
        close = html.index("</div>", end) + len("</div>")
        html = html[:close] + ("\n        " if code == "fr" else "") + block + html[close:]
    path.write_text(html, encoding="utf-8")


def build_sitemap() -> None:
    path = ROOT / "sitemap.xml"
    xml = path.read_text(encoding="utf-8")
    new = []
    for code in CODES:
        for _k, folder, *_rest in GAMES:
            loc = url(code, folder)
            if f"<loc>{loc}</loc>" not in xml:
                new.append(f"<url><loc>{loc}</loc><lastmod>2026-10-22</lastmod><priority>0.8</priority></url>")
    if new:
        xml = xml.replace("</urlset>", "\n".join(new) + "\n</urlset>")
        path.write_text(xml, encoding="utf-8")


for code in CODES:
    for game in GAMES:
        build_page(code, game)
    build_home(code)
build_sitemap()
# Games already out on the App Store get their real button back (all languages).
import sortie_appstore  # noqa: E402
sortie_appstore.main()
print(f"{len(CODES)} languages, {len(GAMES)} games")
