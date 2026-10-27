#!/usr/bin/env python3
"""Replace the "Coming soon to Android" badge of a game by a real Google Play button.

Applies to the home page and the game page of every language, for each game in GAMES. Idempotent: pages that
already carry the Google Play button are left alone. The label ("Android" + "Google Play")
is the same in every language, so no translation is needed. Also marks the game's
SoftwareApplication JSON-LD as available on iOS and Android.

Run it again for another game by adding it to GAMES (page folder, App Store id, package name).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# page folder, App Store id, Google Play package, name shown to screen readers
GAMES = [
    ("cocoboum/", "id6817739082", "com.contegames.cocoboum", "COCOBOUM!"),
    ("tableauxensorceles/", "id6819245288", "com.contegames.tableauxensorceles", "Les Tableaux Ensorcelés"),
]
PLAY_ICON = ('<svg class="apple-logo" viewBox="0 0 512 512" aria-hidden="true" focusable="false">'
             '<path fill="currentColor" d="M96 32v448l352-224z"/></svg>')

BADGE = re.compile(r'<span class="badge-soon">(?:[^<]|<small>[^<]*</small>)*</span>')


def button_re(appstore_id: str):
    return re.compile(r'<a class="button[^"]*button-appstore" href="https://apps\.apple\.com/[^"]*?' + appstore_id
                      + r'[^"]*"[^>]*>.*?</a>')


def play_button(package: str, name: str, campaign: str) -> str:
    href = (f"https://play.google.com/store/apps/details?id={package}"
            f"&amp;referrer=utm_source%3Dcontegames.com%26utm_medium%3Dsite%26utm_campaign%3D{campaign}")
    return (f'<a class="button button-appstore button-play" href="{href}" aria-label="{name} - Google Play" '
            f'rel="noopener">{PLAY_ICON}<span class="store-label"><small>Android</small>Google Play</span></a>')


def mark_android(html: str, name: str) -> str:
    """SoftwareApplication JSON-LD of the game: add Android to operatingSystem (once)."""
    return re.sub(r'("@type":"SoftwareApplication","name":"' + re.escape(name) + r'"[^}]*?"operatingSystem":")([^"]*)(")',
                  lambda m: m.group(0) if "Android" in m.group(2) else f"{m.group(1)}{m.group(2)}, Android{m.group(3)}",
                  html)


def process(path: Path, appstore_id: str, package: str, name: str) -> bool:
    html = path.read_text(encoding="utf-8")
    if package in html:
        marked = mark_android(html, name)
        if marked != html:
            path.write_text(marked, encoding="utf-8")
        return False
    done = False
    for match in reversed(list(button_re(appstore_id).finditer(html))):
        badge = BADGE.match(html, match.end()) or re.compile(r"\s*" + BADGE.pattern).match(html, match.end())
        if not badge:
            continue
        campaign = re.search(r"ct=(site-[a-z]+)", match.group(0)).group(1)
        start = badge.start() + (len(badge.group(0)) - len(badge.group(0).lstrip()))
        html = html[:start] + play_button(package, name, campaign) + html[badge.end():]
        done = True
    if not done:
        raise SystemExit(f"{path}: no Android badge right after the {name} App Store button")
    html = mark_android(html, name)
    path.write_text(html, encoding="utf-8")
    return True


def main() -> None:
    codes = [""] + sorted(p.name for p in ROOT.iterdir() if p.is_dir() and (p / "cocoboum/index.html").exists())
    changed = 0
    for folder, appstore_id, package, name in GAMES:
        for code in codes:
            base = ROOT / code if code else ROOT
            for page in (base / "index.html", base / folder / "index.html"):
                changed += process(page, appstore_id, package, name)
    print(f"updated {changed} pages")


if __name__ == "__main__":
    main()
