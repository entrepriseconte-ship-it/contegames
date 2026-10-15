"""Remplace la grande image « En images » des 30 pages COCOBOUM! par le dessin animé YouTube.

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


FIGURE = re.compile(r'<figure class="game-shot">\s*<img src="(?:\.\./)+assets/cocoboum-ecran\.jpg"[^>]*?\balt="([^"]*)"[^>]*/>(\s*<figcaption>[^<]*</figcaption>)?\s*</figure>')


def main():
    vid = video_id(sys.argv[1])
    pages = sorted(glob.glob(f"{ROOT}/cocoboum/index.html") + glob.glob(f"{ROOT}/*/cocoboum/index.html"))
    for path in pages:
        html = open(path, encoding="utf-8").read()
        def repl(m):
            title = m.group(1)
            caption = m.group(2) or ""
            return (
                '<figure class="game-shot game-video">'
                f'<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/{vid}?rel=0" '
                f'title="{title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
                'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'
                f"{caption.strip()}</figure>"
            )
        new, n = FIGURE.subn(repl, html)
        if n != 1:
            sys.exit(f"{path} : {n} image trouvée (1 attendue)")
        new = new.replace("styles.css?v=11", "styles.css?v=12")
        open(path, "w", encoding="utf-8").write(new)
    print(f"{len(pages)} pages COCOBOUM! mises à jour avec la vidéo {vid}")


main()
