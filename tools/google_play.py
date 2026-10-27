#!/usr/bin/env python3
"""Replace the "Coming soon to Android" badge of COCOBOUM! by a real Google Play button.

Applies to the home page and the COCOBOUM! page of every language. Idempotent: pages that
already carry the Google Play button are left alone. The label ("Android" + "Google Play")
is the same in every language, so no translation is needed. Also marks the COCOBOUM!
SoftwareApplication JSON-LD as available on iOS and Android.

Run it again for another game by adding it to GAMES (page folder, App Store id, package name).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = "com.contegames.cocoboum"
APPSTORE_ID = "id6817739082"
PLAY = "https://play.google.com/store/apps/details?id=" + PACKAGE
PLAY_ICON = ('<svg class="apple-logo" viewBox="0 0 512 512" aria-hidden="true" focusable="false">'
             '<path fill="currentColor" d="M96 32v448l352-224z"/></svg>')

BUTTON = re.compile(r'<a class="button[^"]*button-appstore" href="https://apps\.apple\.com/[^"]*?' + APPSTORE_ID
                    + r'[^"]*"[^>]*>.*?</a>')
BADGE = re.compile(r'<span class="badge-soon">[^<]*</span>')


def play_button(campaign: str) -> str:
    href = f"{PLAY}&amp;referrer=utm_source%3Dcontegames.com%26utm_medium%3Dsite%26utm_campaign%3D{campaign}"
    return (f'<a class="button button-appstore button-play" href="{href}" aria-label="COCOBOUM! - Google Play" '
            f'rel="noopener">{PLAY_ICON}<span class="store-label"><small>Android</small>Google Play</span></a>')


def process(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    if PACKAGE in html:
        return False
    done = False
    for match in reversed(list(BUTTON.finditer(html))):
        badge = BADGE.match(html, match.end()) or re.compile(r"\s*" + BADGE.pattern).match(html, match.end())
        if not badge:
            continue
        campaign = re.search(r"ct=(site-[a-z]+)", match.group(0)).group(1)
        start = badge.start() + (len(badge.group(0)) - len(badge.group(0).lstrip()))
        html = html[:start] + play_button(campaign) + html[badge.end():]
        done = True
    if not done:
        raise SystemExit(f"{path}: no Android badge right after a COCOBOUM! App Store button")
    html = re.sub(r'("@type":"SoftwareApplication","name":"COCOBOUM!"[^}]*?"operatingSystem":")iOS(")',
                  r'\1iOS, Android\2', html)
    path.write_text(html, encoding="utf-8")
    return True


def main() -> None:
    codes = [""] + sorted(p.name for p in ROOT.iterdir() if p.is_dir() and (p / "cocoboum/index.html").exists())
    changed = 0
    for code in codes:
        base = ROOT / code if code else ROOT
        for page in (base / "index.html", base / "cocoboum/index.html"):
            changed += process(page)
    print(f"updated {changed} pages")


if __name__ == "__main__":
    main()
