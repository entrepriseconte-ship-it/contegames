#!/usr/bin/env python3
"""Static international SEO validation, without external dependencies.

Run from the repository root: python3 tools/check_seo.py
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
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
]
GAMES = ["", "cocoboum/", "royaumedesmotscroises/", "mieuxchaquejour/", "tableauxensorceles/"]
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

if len(PARSED) != 150:
    error("site", f"expected 150 language pages, got {len(PARSED)}")

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
            if game == "cocoboum/" and structured.get("@type") == "SoftwareApplication":
                cocoboum_schema_found = True
                offer = structured.get("offers")
                if not isinstance(offer, dict) or str(offer.get("price")) not in ("0", "0.0"):
                    error(path, "COCOBOUM free price missing from SoftwareApplication JSON-LD")
        except (json.JSONDecodeError, AttributeError) as exc:
            error(path, f"JSON-LD parse error: {exc}")
    if game == "cocoboum/" and not cocoboum_schema_found:
        error(path, "COCOBOUM SoftwareApplication JSON-LD missing")
    if len(parser.title) > 100:
        WARNINGS.append(f"{path}: long title ({len(parser.title)} chars)")
    for tag, url in parser.refs:
        verify_local_path(parser, canonical, url)

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
