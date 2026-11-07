#!/usr/bin/env python3
"""Set each sitemap <lastmod> to the date of the last commit that touched the page.

Honest dates tell Google which pages really changed (new titles, new links).
Idempotent. Run from the repository root:
    python3 tools/lastmod_sitemap.py
"""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://contegames.com"
URL = re.compile(r"(<loc>)([^<]+)(</loc><lastmod>)([^<]+)(</lastmod>)")


def page_file(url: str) -> Path:
    path = url[len(DOMAIN):].lstrip("/")
    return ROOT / (path + "index.html" if path == "" or path.endswith("/") else path)


def last_commit_date(file: Path) -> str | None:
    out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", str(file)], cwd=ROOT,
                         capture_output=True, text=True).stdout.strip()
    return out or None


def main() -> None:
    path = ROOT / "sitemap.xml"
    text = path.read_text(encoding="utf-8")
    changed = 0

    def fix(m):
        nonlocal changed
        date = last_commit_date(page_file(m.group(2)))
        if date and date != m.group(4):
            changed += 1
            return m.group(1) + m.group(2) + m.group(3) + date + m.group(5)
        return m.group(0)

    path.write_text(URL.sub(fix, text), encoding="utf-8")
    print(f"lastmod updated on {changed} urls")


if __name__ == "__main__":
    main()
