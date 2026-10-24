#!/usr/bin/env python3
"""Static international SEO validation, without external dependencies.

Run from the repository root: python3 tools/check_seo.py
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
import html as html_lib
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://contegames.com"
LANGS = [
    ("fr", "fr"), ("en", "en"), ("es", "es"), ("de", "de"),
    ("it", "it"), ("pt", "pt"), ("ja", "ja"), ("ko", "ko"),
    ("zh-cn", "zh-CN"), ("zh-tw", "zh-TW"), ("hi", "hi"), ("id", "id"),
    ("pt-br", "pt-BR"), ("es-mx", "es-MX"), ("ar", "ar"), ("tr", "tr"),
    ("ru", "ru"), ("nl", "nl"), ("pl", "pl"), ("th", "th"), ("vi", "vi"),
    ("uk", "uk"), ("sv", "sv"), ("ms", "ms"), ("ro", "ro"),
    ("el", "el"), ("cs", "cs"), ("hu", "hu"), ("fi", "fi"), ("he", "he"),
    ("da", "da"), ("nb", "nb"), ("sk", "sk"), ("bg", "bg"), ("hr", "hr"),
    ("sl", "sl"), ("lt", "lt"), ("lv", "lv"), ("et", "et"), ("ca", "ca"),
    ("is", "is"), ("sr", "sr"), ("fil", "fil"), ("af", "af"), ("sw", "sw"),
    ("bn", "bn"), ("ta", "ta"), ("kk", "kk"), ("ka", "ka"), ("az", "az"),
    ("sq", "sq"), ("mk", "mk"), ("hy", "hy"), ("uz", "uz"), ("gl", "gl"),
    ("eu", "eu"), ("mr", "mr"), ("te", "te"), ("ne", "ne"), ("si", "si"),
    ("pa", "pa"), ("gu", "gu"), ("kn", "kn"), ("ml", "ml"), ("km", "km"),
    ("lo", "lo"), ("my", "my"), ("mn", "mn"), ("am", "am"), ("cy", "cy"),
]
GAMES = ["", "cocoboum/", "royaumedesmotscroises/", "mieuxchaquejour/", "tableauxensorceles/",
         "caligulavsgladiators/", "sauvequifleche/", "royaumedesenigmes/"]
# Not on the stores yet: their pages and home cards show "coming soon" (button-soon), never a store link.
UPCOMING = ("caligulavsgladiators/", "sauvequifleche/", "royaumedesenigmes/")
# Price not yet confirmed by the studio owner: no free offer is claimed for it.
PRICE_UNCONFIRMED = ()  # every studio app is free (confirmed by Anthony on 23/10)
ERRORS = []
WARNINGS = []


def error(path: str, message: str) -> None:
    ERRORS.append(f"{path}: {message}")


def location(code: str, game: str) -> str:
    return f"{DOMAIN}/" + ("" if code == "fr" else code + "/") + game


def to_path(url: str) -> tuple[Path | None, str]:
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https") or parsed.netloc.lower() != "contegames.com":
        return None, parsed.fragment
    decoded = unquote(parsed.path)
    if ".." in decoded.split("/"):
        return None, parsed.fragment
    local = ROOT / decoded.lstrip("/")
    if decoded.endswith("/"):
        local = local / "index.html"
    return local, parsed.fragment


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = ""
        self.dir = ""
        self.title = ""
        self.in_title = False
        self.descriptions: list[str] = []
        self.canons: list[str] = []
        self.alternates: dict[str, list[str]] = {}
        self.refs: list[tuple[str, str]] = []
        self.ids: set[str] = set()
        self.h1_count = 0
        self.json_ld: list[str] = []
        self.in_json = False
        self._json_buf = ""

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "html":
            self.lang, self.dir = d.get("lang", ""), d.get("dir", "")
        if tag == "title":
            self.in_title = True
        if tag == "h1":
            self.h1_count += 1
        if d.get("id"):
            self.ids.add(d["id"])
        if tag == "meta" and d.get("name", "").lower() == "description":
            self.descriptions.append(d.get("content", ""))
        if tag == "link" and d.get("rel") == "canonical":
            self.canons.append(d.get("href", ""))
        if tag == "link" and d.get("rel") == "alternate" and d.get("hreflang"):
            self.alternates.setdefault(d["hreflang"], []).append(d.get("href", ""))
        if tag == "script" and d.get("type") == "application/ld+json":
            self.in_json = True
            self._json_buf = ""
        if tag in ("a", "link") and d.get("href"):
            self.refs.append((tag, d["href"]))
        if tag in ("img", "script", "audio", "source") and d.get("src"):
            self.refs.append((tag, d["src"]))

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_json:
            self._json_buf += data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_json:
            self.in_json = False
            self.json_ld.append(self._json_buf)


def verify_local_path(page: Page, current: str, url: str) -> None:
    if url.startswith(("mailto:", "tel:", "javascript:", "data:")):
        return
    full = urljoin(current, url)
    path, fragment = to_path(full)
    if path is None:
        return
    if not path.is_file():
        error(current, f"local reference missing: {url} -> {path.relative_to(ROOT)}")
        return
    # Hash targets are checked for HTML only, including links to other pages.
    if fragment and path.suffix == ".html":
        if path == (ROOT / "index.html"):
            target = PARSED.get("index.html")
        else:
            target = PARSED.get(path.relative_to(ROOT).as_posix())
        if target is not None and unquote(fragment) not in target.ids:
            error(current, f"anchor #{fragment} not found in {url}")


PARSED: dict[str, Page] = {}
FILES: dict[str, str] = {}
EXPECTED: dict[str, tuple[str, str]] = {}

for code, language in LANGS:
    for game in GAMES:
        path = ("" if code == "fr" else code + "/") + game + "index.html"
        EXPECTED[path] = (code, game)
        file = ROOT / path
        if not file.exists():
            error(path, "missing HTML file")
            continue
        html = file.read_text(encoding="utf-8")
        parser = Page()
        try:
            parser.feed(html)
        except Exception as exc:
            error(path, f"HTML could not be parsed: {exc}")
        PARSED[path] = parser
        FILES[path] = html

if len(PARSED) != len(LANGS) * len(GAMES):
    error("site", f"expected {len(LANGS) * len(GAMES)} language pages, got {len(PARSED)}")

for path, parser in PARSED.items():
    code, game = EXPECTED[path]
    canonical = location(code, game)
    if parser.lang.lower() != dict(LANGS)[code].lower():
        error(path, f"incorrect lang {parser.lang!r}")
    if code in ("ar", "he") and parser.dir != "rtl":
        error(path, "RTL direction missing")
    if len(parser.canons) != 1 or parser.canons[0] != canonical:
        error(path, f"incorrect canonical {parser.canons}")
    if not parser.title.strip() or not any(x.strip() for x in parser.descriptions):
        error(path, "missing title or meta description")
    if parser.h1_count != 1:
        error(path, f"expected one H1, found {parser.h1_count}")
    if "noindex" in FILES[path].lower():
        error(path, "noindex mentioned")
    expected_alts = {language: location(local_code, game) for local_code, language in LANGS}
    expected_alts["x-default"] = location("en", game)
    if set(parser.alternates) != set(expected_alts):
        error(path, f"hreflang set mismatch: missing {set(expected_alts)-set(parser.alternates)}, extra {set(parser.alternates)-set(expected_alts)}")
    for language, expected_url in expected_alts.items():
        actual = parser.alternates.get(language, [])
        if actual != [expected_url]:
            error(path, f"hreflang {language} points to {actual!r} instead of {expected_url}")
    if not parser.json_ld:
        error(path, "JSON-LD missing")
    cocoboum_schema_found = False
    for raw in parser.json_ld:
        try:
            structured = json.loads(raw)
            if structured.get("@context") != "https://schema.org":
                error(path, "JSON-LD context invalid")
            if structured.get("@type") == "SoftwareApplication":
                if game == "cocoboum/":
                    cocoboum_schema_found = True
                # Every game page (current and future) shows Google its free price.
                offer = structured.get("offers")
                if game not in PRICE_UNCONFIRMED and (
                        not isinstance(offer, dict) or str(offer.get("price")) not in ("0", "0.0")):
                    error(path, "free price (offers.price 0) missing from SoftwareApplication JSON-LD")
            if structured.get("@type") == "FAQPage":
                # The FAQ markup may only repeat questions and answers visible on the page.
                visible = re.sub(r"\s+", " ", html_lib.unescape(re.sub(r"<[^>]+>", "", FILES[path])))
                for item in structured.get("mainEntity", []):
                    for said in (item.get("name", ""), item.get("acceptedAnswer", {}).get("text", "")):
                        if not said or said not in visible:
                            error(path, f"FAQPage text not visible on the page: {said[:60]!r}")
        except (json.JSONDecodeError, AttributeError) as exc:
            error(path, f"JSON-LD parse error: {exc}")
    if game == "cocoboum/" and not cocoboum_schema_found:
        error(path, "COCOBOUM SoftwareApplication JSON-LD missing")
    if game == "tableauxensorceles/":
        # Keep every localized App Store availability and download link consistent.
        if "id6819245288" not in FILES[path] or 'button-appstore' not in FILES[path]:
            error(path, "Les Tableaux Ensorceles: iOS download button is missing")
        if 'badge-soon' not in FILES[path]:
            error(path, "Les Tableaux Ensorceles: Android availability badge missing")
        outdated = ("近日公開予定", "출시 예정", "计划登陆 iPhone", "預計在 iPhone",
                    "आने वाला", "yang akan hadir", "em breve.", "próximamente en iPhone",
                    "قريبًا على App Store", "yakında geliyor", "скоро выйдет",
                    "binnenkort op iPhone", "już wkrótce", "กำลังจะเปิดบน iPhone",
                    "sắp có trên iPhone", "незабаром", "snart kommer till iPhone",
                    "akan datang.", "în curând pe iPhone", "σύντομα για iPhone",
                    "brzy pro iPhone", "hamarosan iPhone", "on tulossa iPhonelle",
                    "יגיע בקרוב", "planned features and may evolve before release",
                    "avant la publication")
        page_without_android_badges = re.sub(r'<span class="badge-soon">[\s\S]*?</span>', "", FILES[path])
        if any(phrase in page_without_android_badges for phrase in outdated):
            error(path, "Les Tableaux Ensorceles: obsolete iOS coming-soon text")

    if len(parser.title) > 100:
        WARNINGS.append(f"{path}: long title ({len(parser.title)} chars)")
    for tag, url in parser.refs:
        verify_local_path(parser, canonical, url)

# All four games are out on the App Store (Mieux Chaque Jour since 16/10/2026):
# no page may still show a non-clickable "coming soon to the App Store" button.
for path, html in FILES.items():
    if EXPECTED[path][1] in UPCOMING:
        if "button-soon" not in html or "apps.apple.com" in html:
            error(path, "upcoming game: coming-soon button missing or store link present")
        continue
    if EXPECTED[path][1] == "":
        html = re.sub(r'<div class="projects projects-more">[\s\S]*?</article>\s*</div>', "", html)
    if "button-soon" in html:
        error(path, "page still shows a coming-soon App Store button (button-soon)")

# Outside French, each game name keeps its official App Store spelling and
# shows its translation right under it (requested by the studio owner).
for code, _ in LANGS:
    if code == "fr":
        continue
    for game in ("tableauxensorceles/", "royaumedesmotscroises/", "mieuxchaquejour/", "sauvequifleche/", "royaumedesenigmes/"):
        path = code + "/" + game + "index.html"
        if not re.search(r'<h1 [^>]*class="game-title[^"]*">[^<]+<span class="title-translation">[^<]+</span></h1>', FILES.get(path, "")):
            error(path, "translated game name missing under the H1")
    if FILES.get(code + "/index.html", "").count('<span class="title-translation">') != 5:
        error(code + "/index.html", "expected 5 translated game names on the home page")

# App Store links must not force the French storefront: without a country
# code Apple opens the visitor's own store (US, DE, JP...).
for path, html in FILES.items():
    if "apps.apple.com/fr/" in html:
        error(path, "App Store link forces the French storefront (apps.apple.com/fr/)")

sitemap = ROOT / "sitemap.xml"
if not sitemap.exists():
    error("sitemap.xml", "file missing")
else:
    try:
        xml_root = ET.parse(sitemap).getroot()
        ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
        urls = [node.text for node in xml_root.findall(f".//{ns}url/{ns}loc")]
        if len(urls) != len(set(urls)):
            error("sitemap.xml", "duplicate URLs")
        expected_urls = {location(code, game) for code, _ in LANGS for game in GAMES}
        if not expected_urls <= set(urls):
            error("sitemap.xml", f"missing {len(expected_urls - set(urls))} pages")
        for url in urls:
            file, _ = to_path(url)
            if file is not None and not file.is_file():
                error("sitemap.xml", f"URL file missing: {url}")
    except ET.ParseError as exc:
        error("sitemap.xml", f"XML parse error: {exc}")

robots = ROOT / "robots.txt"
if not robots.is_file() or "Sitemap: https://contegames.com/sitemap.xml" not in robots.read_text(encoding="utf-8"):
    error("robots.txt", "sitemap declaration missing")
for issue in WARNINGS:
    print("WARNING:", issue)
for issue in ERRORS:
    print("ERROR:", issue)
print(f"Checked {len(PARSED)} pages, {len(LANGS)} languages, {len(GAMES)} page groups; {len(ERRORS)} errors, {len(WARNINGS)} warnings")
sys.exit(1 if ERRORS else 0)
