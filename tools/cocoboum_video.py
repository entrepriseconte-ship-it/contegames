"""Remplace la grande image « En images » des 30 pages COCOBOUM! par le dessin animé YouTube,
placé dans le même cadre que la description du jeu.

Usage : python3 tools/cocoboum_video.py <lien YouTube>
L'image assets/cocoboum-ecran.jpg reste dans le dépôt (rien n'est supprimé).
"""
import glob
import re
import sys
from urllib.parse import parse_qs, urlparse

ROOT = __file__.rsplit("/tools/", 1)[0]


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


SHOTS = re.compile(r'<section class="game-shots page-width"[^>]*>.*?<img src="(?:\.\./)+assets/cocoboum-ecran\.jpg"[^>]*?\balt="([^"]*)"[^>]*/>.*?</section>\s*', re.S)
GUIDE = re.compile(r'<section class="seo-game-guide page-width"( aria-labelledby="guide-cocoboum">)(.*?)</section>', re.S)


def main():
    vid = video_id(sys.argv[1])
    pages = sorted(glob.glob(f"{ROOT}/cocoboum/index.html") + glob.glob(f"{ROOT}/*/cocoboum/index.html"))
    for path in pages:
        html = open(path, encoding="utf-8").read()
        m = SHOTS.search(html)
        if not m:
            sys.exit(f"{path} : grande image introuvable")
        title = m.group(1)
        html = html[:m.start()] + html[m.end():]
        video = (
            '<figure class="game-shot game-video"><div class="video-frame">'
            f'<iframe src="https://www.youtube-nocookie.com/embed/{vid}?rel=0" title="{title}" loading="lazy" '
            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
            'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></figure>'
        )
        html, n = GUIDE.subn(
            lambda g: f'<section class="seo-game-guide page-width guide-with-video"{g.group(1)}{video}<div class="guide-text">{g.group(2)}</div></section>',
            html,
        )
        if n != 1:
            sys.exit(f"{path} : {n} description trouvée (1 attendue)")
        html = html.replace("styles.css?v=11", "styles.css?v=12")
        open(path, "w", encoding="utf-8").write(html)
    print(f"{len(pages)} pages COCOBOUM! mises à jour avec la vidéo {vid}")


main()
