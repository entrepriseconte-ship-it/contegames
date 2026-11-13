#!/usr/bin/env python3
"""Add the 7 games of 13/11/2026 to the site, in every language.

Gnome des Cavernes Enchantées, Le Château des Lumières, Le Petit Dragon, Le Tailleur de Nuages,
Les Rouages Enchantés, Royaume des Runes, Serpent des Runes: none is public yet, so every page and
home card shows "coming soon" for the App Store and Android (never a store link), with the
App Store icon in the large frame until the studio owner gives a YouTube link.

- French and English pages are built by tools/nouveaux_jeux.py's build_page (same layout as the
  three games of 22/10), texts in tools/jeux_novembre_textes.py.
- Every other language is built the same way from its own Royaume des Mots Croisés page (shared
  labels from tools/nouveaux_jeux_textes.py or tools/langues/<code>.json), game texts from
  tools/langues_jeux/<code>.json ("<game>.<field>"); the description gets the local
  "coming soon to iPhone and Android" sentence.
- The cards are added at the end of the second row of the home page; existing cards are untouched.

Idempotent. Run from the repository root: python3 tools/jeux_novembre.py [--only=xx,yy]
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import langues  # noqa: E402
from donnees_ia import add_faq  # noqa: E402
from jeux_novembre_textes import FR, EN  # noqa: E402

# tools/nouveaux_jeux.py runs on import: load only its definitions.
_src = (ROOT / "tools/nouveaux_jeux.py").read_text(encoding="utf-8")
NJ = {"__file__": str(ROOT / "tools/nouveaux_jeux.py"), "__name__": "nouveaux_jeux_defs"}
exec(compile(_src[:_src.index("\n\nfor code in CODES:")], "nouveaux_jeux.py", "exec"), NJ)
T = NJ["T"]

PRIV = [("confidentialite.html", "Confidentialité")]
# key, folder, name shown, official store name, icon, home frame, French-only help links, French title with line break
GAMES = [
    ("g", "gnomedescavernes", "Gnome des Cavernes Enchantées", "Gnome des Cavernes Enchantées", "gnomedescavernes-icone.jpg",
     "nature-panel", PRIV, "Gnome des Cavernes<br />Enchantées"),
    ("l", "chateaudeslumieres", "Le Château des Lumières", "Le Château des Lumières", "chateaudeslumieres-icone.jpg",
     "tableaux-panel", PRIV, "Le Château<br />des Lumières"),
    ("d", "petitdragon", "Le Petit Dragon", "Le Petit Dragon", "petitdragon-icone.jpg",
     "dragon-panel", PRIV, "Le Petit<br />Dragon"),
    ("t", "tailleurdenuages", "Le Tailleur de Nuages", "Le Tailleur de Nuages", "tailleurdenuages-icone.jpg",
     "lion-panel", PRIV, "Le Tailleur<br />de Nuages"),
    ("w", "rouagesenchantes", "Les Rouages Enchantés", "Les Rouages Enchantés", "rouagesenchantes-icone.jpg",
     "nature-panel", [], "Les Rouages<br />Enchantés"),
    ("u", "royaumedesrunes", "Royaume des Runes", "Royaume des Runes", "royaumedesrunes-icone.jpg",
     "tableaux-panel", PRIV, "Royaume<br />des Runes"),
    ("n", "serpentdesrunes", "Serpent des Runes", "Serpent des Runes", "serpentdesrunes-icone.jpg",
     "dragon-panel", PRIV, "Serpent<br />des Runes"),
]
FOLDERS = [g[1] for g in GAMES]
FIELDS = ("card", "genre", "tag", "desc", "h2", "p1", "p2", "f1", "f2", "f3")

for key, *_ in GAMES:
    T["fr"][key] = FR[key]
    T["en"][key] = EN[key]


def card_html(code: str, game: tuple, discover: str, assets: str) -> str:
    key, folder, name, _official, icon, panel, fr_links, fr_h1 = game
    L, G = T[code], T[code][key]
    if code == "fr":
        eyebrow, h3 = G["ey"], fr_h1
        small = " · ".join(f'<a href="{folder}/{href}">{label}</a>' for href, label in fr_links)
        small = f'<span class="small-links">{small}</span>' if small else ""
    else:
        eyebrow, small, h3 = L["page_ey"], "", NJ["esc"](name)
    esc = NJ["esc"]
    return (f'<article class="project-card {panel} framed-panel">{NJ["FRAME"]}<div class="project-content">'
            f'<p class="eyebrow">{esc(eyebrow)}</p><h3>{h3}</h3>'
            f'<a class="project-thumb" href="{folder}/"><img src="{assets}{icon}" alt="{esc(name)}" loading="lazy" width="540" height="540" /></a>'
            f'<p>{esc(G["card"])}</p><div class="project-links"><a class="discover" href="{folder}/">{discover}</a>'
            f'<span class="button button-soon">{esc(L["soon_store"])}</span><span class="badge-soon">{esc(L["android"])}</span>{small}</div></div></article>')


def insert_cards(html: str, cards: str, where: str) -> str:
    """Put the new cards (between markers) at the end of the second row of the home page."""
    block = f"<!--jeux-novembre-->{cards}<!--/jeux-novembre-->"
    if "<!--jeux-novembre-->" in html:
        return re.sub(r"<!--jeux-novembre-->.*?<!--/jeux-novembre-->", lambda m: block, html, count=1, flags=re.S)
    start = html.index('<div class="projects projects-more">')
    depth, i = 0, start
    for m in re.finditer(r"<(/?)div\b", html[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            i = start + m.start()
            break
    else:
        raise SystemExit(f"{where}: end of projects-more not found")
    return html[:i] + block + html[i:]


def home(code: str) -> None:
    path = ROOT / ("index.html" if code == "fr" else f"{code}/index.html")
    html = path.read_text(encoding="utf-8")
    tpl = re.search(r'<article class="project-card dragon-panel.*?</article>', html, re.S).group(0)
    discover = re.search(r'class="discover"[^>]*>([^<]*)<', tpl).group(1)
    assets = re.search(r'<img src="([^"]*)royaume-icone\.jpg"', tpl).group(1)
    cards = "".join(card_html(code, g, discover, assets) for g in GAMES)
    path.write_text(insert_cards(html, cards, str(path)), encoding="utf-8")


def load_texts(code: str) -> None:
    """Fill T[code] (shared labels + the 7 games) for a language other than French and English."""
    E = T["en"]
    if code not in T:
        lt = json.loads((ROOT / f"tools/langues/{code}.json").read_text(encoding="utf-8"))
        cal = "Caligula vs Gladiators"
        T[code] = {k: lt[E[k]] for k in ("soon_store", "android", "page_ey", "q_how", "q_when")}
        T[code]["a_when"] = lt[E["a_when"].format(name=cal)].replace(cal, "{name}")
    if code in T and "c" in T[code]:
        cal_desc = T[code]["c"]["desc"]
    else:
        lt = json.loads((ROOT / f"tools/langues/{code}.json").read_text(encoding="utf-8"))
        cal_desc = lt[E["c"]["desc"]]
    ey = T[code]["page_ey"]
    suffix = cal_desc[cal_desc.rfind(ey):] if ey in cal_desc else ey + "."
    tr = json.loads((ROOT / f"tools/langues_jeux/{code}.json").read_text(encoding="utf-8"))
    for key, *_ in GAMES:
        G = {f: tr[f"{key}.{f}"] for f in FIELDS}
        body = G["desc"].rstrip()
        G["desc"] = body + ("" if body.endswith(("。", "！", "।")) else " ") + suffix
        G["f"] = [G.pop("f1"), G.pop("f2"), G.pop("f3")]
        T[code][key] = G


def build(code: str) -> None:
    for game in GAMES:
        NJ["build_page"](code, game)
        p = NJ["page_path"](code, game[1])
        html = add_faq(p.read_text(encoding="utf-8"))  # FAQPage from the page's own questions
        # the template page (Royaume des Mots Croisés) carries its own pitch under "features" in a few languages
        html = re.sub(r'(<h2 id="features-title">[^<]*</h2>)<p>[^<]*</p>', r"\1", html, count=1)
        p.write_text(html, encoding="utf-8")
    home(code)


def sitemap() -> None:
    path = ROOT / "sitemap.xml"
    xml = path.read_text(encoding="utf-8")
    new = []
    for code, _h, _n in langues.LANGS:
        for folder in FOLDERS:
            loc = langues.url(code, folder + "/")
            if f"<loc>{loc}</loc>" not in xml:
                new.append(f"  <url><loc>{loc}</loc><lastmod>2026-11-13</lastmod><priority>0.8</priority></url>")
    if new:
        path.write_text(xml.replace("</urlset>", "\n".join(new) + "\n</urlset>"), encoding="utf-8")


if __name__ == "__main__":
    only = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = set(arg[len("--only="):].split(","))
    done = 0
    for code, _h, _n in langues.LANGS:
        if only is not None and code not in only and code not in ("fr", "en"):
            continue
        if code not in ("fr", "en"):
            if not (ROOT / f"tools/langues_jeux/{code}.json").exists():
                print(f"{code}: no translations yet, skipped")
                continue
            load_texts(code)
        build(code)
        done += 1
    if all((ROOT / langues.page_path(c, f + "/")).exists() for c, _h, _n in langues.LANGS for f in FOLDERS):
        for f in FOLDERS:
            if f + "/" not in langues.GROUPS:
                langues.GROUPS.append(f + "/")
        print(f"{done} languages, relinked {langues.link_all()} pages")
        sitemap()
    else:
        print(f"{done} languages built; hreflang and sitemap wait for every language")
