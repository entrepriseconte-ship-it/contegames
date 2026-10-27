#!/usr/bin/env python3
"""Add Apple's free campaign parameters to every App Store link of the site.

App Store Connect > App Analytics then shows how many downloads come from
which page of contegames.com (provider token pt, campaign name ct, media type
mt). The home page and COCOBOUM! already had them; this gives the other games
the same, and the Smart App Banner its own campaign ("site-banner").
Idempotent. Run from the repository root:  python3 tools/liens_suivis.py
"""
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from langues import GROUPS, LANGS, page_path  # noqa: E402

PROVIDER = "129524141"
LINK = re.compile(r'(href="https://apps\.apple\.com/app/[^"?]*)"')


def campaign(group: str) -> str:
    return "site-" + (group.strip("/") or "accueil")


def track(html: str, group: str) -> str:
    return LINK.sub(lambda m: f'{m.group(1)}?pt={PROVIDER}&amp;ct={campaign(group)}&amp;mt=8"', html)


def main() -> None:
    changed = 0
    for code, _, _ in LANGS:
        for group in GROUPS:
            path = page_path(code, group)
            html = path.read_text(encoding="utf-8")
            new = track(html, group)
            if new != html:
                path.write_text(new, encoding="utf-8")
                changed += 1
    print(f"updated {changed} pages")


if __name__ == "__main__":
    main()
