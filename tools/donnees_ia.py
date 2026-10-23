#!/usr/bin/env python3
"""Help search engines and AI assistants read the site.

1. Game pages: a FAQPage JSON-LD built word for word from the questions and
   answers already visible in the page (<h3> + <p> in the seo-game-guide
   section). Nothing is invented; a page without visible questions gets none.
2. Home pages: an Organization JSON-LD linking the studio to its official
   YouTube and TikTok accounts (sameAs) and its only contact address.
3. llms.txt at the root: a short factual summary of the studio for AI tools.

Idempotent. Run from the repository root:  python3 tools/donnees_ia.py
"""
from html import unescape
from pathlib import Path
import json
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from langues import GROUPS, LANGS, page_path, url  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
LD = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
GUIDE = re.compile(r'<section class="seo-game-guide.*?</section>', re.S)
QA = re.compile(r'<h3>(.*?)</h3>\s*<p>(.*?)</p>', re.S)

ORGANIZATION = {
    "@context": "https://schema.org", "@type": "Organization", "name": "Conte Games Studio",
    "url": "https://contegames.com/", "logo": "https://contegames.com/assets/icone-192.png",
    "email": "contegamesstudio@gmail.com",
    "address": {"@type": "PostalAddress", "addressLocality": "Saint-Chamond", "addressCountry": "FR"},
    "sameAs": ["https://www.youtube.com/channel/UCNty6M9KyLwwPj6WUbQQbBQ",
               "https://www.tiktok.com/@contegamesstudio"],
}


def text(fragment: str) -> str:
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def script(data: dict) -> str:
    return ('<script type="application/ld+json">'
            + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>")


def without(html: str, kind: str) -> str:
    return LD.sub(lambda m: "" if f'"@type":"{kind}"' in m.group(1) else m.group(0), html)


def add_faq(html: str) -> str:
    """Replace any FAQPage with one rebuilt from the visible questions."""
    html = without(html, "FAQPage")
    guide = GUIDE.search(html)
    pairs = QA.findall(guide.group(0)) if guide else []
    if not pairs:
        return html
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": text(q), "acceptedAnswer": {"@type": "Answer", "text": text(a)}}
        for q, a in pairs]}
    last = list(LD.finditer(html))[-1]
    return html[:last.end()] + script(faq) + html[last.end():]


def add_organization(html: str) -> str:
    html = without(html, "Organization")
    last = list(LD.finditer(html))[-1]
    return html[:last.end()] + script(ORGANIZATION) + html[last.end():]


def llms_txt() -> str:
    lines = ["# Conte Games Studio", "",
             "> Independent mobile game studio based in Saint-Chamond, France. Games and apps for iPhone, "
             f"with Android versions on the way. The website is available in {len(LANGS)} languages.", "",
             "Contact: contegamesstudio@gmail.com", "", "## Games", ""]
    for group in GROUPS[1:]:
        html = page_path("en", group).read_text(encoding="utf-8")
        data = next(d for d in (json.loads(m.group(1)) for m in LD.finditer(html))
                    if d.get("@type") == "SoftwareApplication")
        lines.append(f"- [{data['name']}]({url('en', group)}): {data['description']}")
    lines += ["", "## Studio", "",
              f"- [Home page]({url('en', '')}): all games, the studio and contact",
              "- [YouTube channel](https://www.youtube.com/channel/UCNty6M9KyLwwPj6WUbQQbBQ): short cartoons of each game",
              "- [Sitemap](https://contegames.com/sitemap.xml): every page in every language", ""]
    return "\n".join(lines)


def main() -> None:
    changed = 0
    for code, _, _ in LANGS:
        for group in GROUPS:
            path = page_path(code, group)
            html = path.read_text(encoding="utf-8")
            new = add_organization(html) if group == "" else add_faq(html)
            if new != html:
                path.write_text(new, encoding="utf-8")
                changed += 1
    (ROOT / "llms.txt").write_text(llms_txt(), encoding="utf-8")
    print(f"updated {changed} pages, wrote llms.txt")


if __name__ == "__main__":
    main()
