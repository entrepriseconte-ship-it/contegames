"""Met le dessin animé YouTube d'un jeu sur ses 30 pages, dans le grand cadre du haut, à la place du logo.

Usage : python3 tools/video_jeux.py <jeu> <lien YouTube>
  <jeu> : cocoboum, tableauxensorceles, royaumedesmotscroises ou mieuxchaquejour
  <lien> : YouTube, une vidéo TikTok (tiktok.com/@compte/video/<numéro>)
           ou un fichier du site (assets/<nom>.mp4)
Le logo du cadre et les grandes images « En images » sont retirés de la page,
mais leurs fichiers restent dans assets/ (rien n'est supprimé). Le texte des
pages n'est pas modifié.
"""
import glob
import re
import sys
from urllib.parse import parse_qs, urlparse

ROOT = __file__.rsplit("/tools/", 1)[0]
NAMES = {
    "cocoboum": "COCOBOUM!",
    "tableauxensorceles": "Les Tableaux Ensorcelés",
    "royaumedesmotscroises": "Royaume des Mots Croisés",
    "mieuxchaquejour": "Mieux Chaque Jour",
}


def video_id(link):
    u = urlparse(link.strip())
    if u.hostname in ("youtu.be", "www.youtu.be"):
        vid = u.path.lstrip("/").split("/")[0]
    elif "v" in parse_qs(u.query):
        vid = parse_qs(u.query)["v"][0]
    else:
        m = re.search(r"/(?:embed|shorts|live)/([^/?#]+)", u.path)
        vid = m.group(1) if m else ""
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", vid):
        sys.exit(f"Identifiant YouTube introuvable dans : {link}")
    return vid


SHOTS = re.compile(r'<section class="game-shots page-width"[^>]*>.*?</section>\s*', re.S)
LOGO = re.compile(r'<img class="official-logo"[^>]*/>')


def main():
    game, link = sys.argv[1], sys.argv[2]
    if game not in NAMES:
        sys.exit(f"Jeu inconnu : {game}")
    local = re.fullmatch(r"assets/[\w.-]+\.mp4", link)
    tiktok = re.search(r"tiktok\.com/(?:@[^/]+/video|embed(?:/v2)?|player/v1)/(\d{8,25})", link)
    if local:
        vid = link
        wide = ""
    elif tiktok:
        vid = tiktok.group(1)
        src = f"https://www.tiktok.com/player/v1/{vid}?rel=0&description=0&music_info=0"
        wide = ""
    else:
        vid = video_id(link)
        src = f"https://www.youtube-nocookie.com/embed/{vid}?rel=0"
        wide = "" if "/shorts/" in link else " hero-video-wide"
    if local:
        video = (
            f'<figure class="hero-video{wide}"><div class="video-frame">'
            f'<video src="{{prefix}}{link}" controls playsinline preload="metadata" title="{NAMES[game]}"></video></div></figure>'
        )
    else:
        video = (
            f'<figure class="hero-video{wide}"><div class="video-frame">'
            f'<iframe src="{src}" title="{NAMES[game]}" loading="lazy" '
            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
            'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></figure>'
        )
    pages = sorted(glob.glob(f"{ROOT}/{game}/index.html") + glob.glob(f"{ROOT}/*/{game}/index.html"))
    for path in pages:
        html = open(path, encoding="utf-8").read()
        if 'class="hero-video' in html:
            sys.exit(f"{path} : la vidéo est déjà en place")
        prefix = "../" * (path[len(ROOT) + 1:].count("/"))
        html, n = LOGO.subn(lambda m: video.replace("{prefix}", prefix), html, count=1)
        if n != 1:
            sys.exit(f"{path} : logo du cadre introuvable")
        html = SHOTS.sub("", html, count=1)
        html = html.replace("styles.css?v=11", "styles.css?v=12")
        open(path, "w", encoding="utf-8").write(html)
    print(f"{len(pages)} pages {NAMES[game]} mises à jour avec la vidéo {vid}")

main()
