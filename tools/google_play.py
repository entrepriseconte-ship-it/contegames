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
    ("mieuxchaquejour/", "id6817754343", "com.contegames.mieuxchaquejour", "Mieux Chaque Jour"),
    ("royaumedesenigmes/", "id6825285817", "com.contegames.royaumedesenigmes", "Royaume des Énigmes"),
    # On Google Play since 04/11/2026, still waiting for Apple: no App Store id, the badge
    # follows the "coming soon to the App Store" button, which stays.
    ("caligulavsgladiators/", None, "com.contegames.caligulavsgladiators", "Caligula vs Gladiators"),
]
# Texts of a game out on Google Play but not yet on the App Store (French and English pages;
# other languages keep their "coming soon to iPhone and Android" wording).
SOON_TEXTS = {
    "": [("Bientôt sur iPhone et Android.", "Disponible sur Android, bientôt sur iPhone."),
         ("{name} arrive bientôt sur l’App Store pour iPhone et sur Android. Le bouton de téléchargement apparaîtra en haut de cette page dès sa sortie.",
          "{name} est disponible sur Google Play pour Android : le bouton de téléchargement est en haut de cette page. La version iPhone arrive bientôt sur l’App Store.")],
    "en": [("Coming soon to iPhone and Android", "Available on Android, coming soon to iPhone"),
           ("{name} is coming soon to the App Store for iPhone and to Android. The download button will appear at the top of this page as soon as it is released.",
            "{name} is available on Google Play for Android: the download button is at the top of this page. The iPhone version is coming soon to the App Store.")],
}
# French texts of a game that was out on the App Store with Android still "coming soon"
# (written by sortie_appstore.py), once it is on Google Play too.
RELEASED_TEXTS_FR = [
    ("Disponible sur iPhone, bientôt sur Android.", "Disponible sur iPhone et Android."),
    ("{name} est disponible dès maintenant sur l’App Store pour iPhone : touchez le bouton App Store en haut de cette page pour le télécharger.",
     "{name} est disponible dès maintenant sur l’App Store pour iPhone et sur Google Play pour Android : touchez le bouton de votre téléphone en haut de cette page pour le télécharger."),
]
SOON = re.compile(r'<span class="button button-soon">[^<]*</span>')
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


def process_soon(path: Path, folder: str, package: str, name: str) -> bool:
    """Game not yet on the App Store: swap the Android badge next to its "coming soon" button."""
    html = path.read_text(encoding="utf-8")
    home = path.parent.name != folder.rstrip("/")
    if home:
        block = next(c for c in re.findall(r'<article class="project-card [^"]*".*?</article>', html, re.S)
                     if f'href="{folder}"' in c)
        campaign = "site-accueil"
    else:
        block = re.search(r'<div class="royal-copy">.*?</div>', html, re.S).group(0)
        campaign = "site-" + folder.rstrip("/")
    if package in block:
        return False
    soon = SOON.search(block)
    badge = soon and re.compile(r"\s*" + BADGE.pattern).match(block, soon.end())
    if not badge:
        raise SystemExit(f"{path}: no Android badge right after the {name} coming-soon button")
    start = badge.start() + (len(badge.group(0)) - len(badge.group(0).lstrip()))
    new = block[:start] + play_button(package, name, campaign) + block[badge.end():]
    html = html.replace(block, new, 1)
    parts = path.relative_to(ROOT).parts
    code = parts[0] if len(parts) > (1 if home else 2) else ""
    for old, text in SOON_TEXTS.get(code, []):
        old, text = old.format(name=name), text.format(name=name)
        if home:  # only the eyebrow of this game's card
            card = next(c for c in re.findall(r'<article class="project-card [^"]*".*?</article>', html, re.S)
                        if f'href="{folder}"' in c)
            html = html.replace(card, card.replace(old, text))
        else:
            html = html.replace(old, text)
    path.write_text(html, encoding="utf-8")
    return True


def released_texts(html: str, path: Path, name: str) -> str:
    """French game page: drop "coming soon to Android" from its texts."""
    if path.relative_to(ROOT).parts[0] == path.parent.name:  # French pages sit at the root
        for old, text in RELEASED_TEXTS_FR:
            html = html.replace(old.format(name=name), text.format(name=name))
    return html


def process(path: Path, appstore_id: str, package: str, name: str) -> bool:
    html = path.read_text(encoding="utf-8")
    html = released_texts(html, path, name) if path.name == "index.html" and path.parent != ROOT else html
    if package in html:
        marked = mark_android(html, name)
        if marked != path.read_text(encoding="utf-8"):
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
                if appstore_id is None:
                    changed += process_soon(page, folder, package, name)
                else:
                    changed += process(page, appstore_id, package, name)
    print(f"updated {changed} pages")


if __name__ == "__main__":
    main()
