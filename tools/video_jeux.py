"""Met le dessin animé YouTube d'un jeu sur ses 30 pages, dans le même cadre que la description.

Usage : python3 tools/video_jeux.py <jeu> <lien YouTube>
  <jeu> : cocoboum, tableauxensorceles ou royaumedesmotscroises
Les grandes images « En images » sont retirées de la page, mais leurs fichiers
restent dans assets/ (rien n'est supprimé). Une page sans description
(pages témoins du suivi SEO) reçoit la vidéo seule à la place des images,
sans toucher à son texte.
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
GUIDE = re.compile(r'<section class="seo-game-guide page-width"( aria-labelledby="guide-[a-z]+">)(.*?)</section>', re.S)


def main():
    game, link = sys.argv[1], sys.argv[2]
    if game not in NAMES:
        sys.exit(f"Jeu inconnu : {game}")
    vid = video_id(link)
    video = (
        '<figure class="game-shot game-video"><div class="video-frame">'
        f'<iframe src="https://www.youtube-nocookie.com/embed/{vid}?rel=0" title="{NAMES[game]}" loading="lazy" '
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
        'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></figure>'
    )
    pages = sorted(glob.glob(f"{ROOT}/{game}/index.html") + glob.glob(f"{ROOT}/*/{game}/index.html"))
    solo = []
    for path in pages:
        html = open(path, encoding="utf-8").read()
        if "youtube-nocookie.com/embed/" in html:
            sys.exit(f"{path} : la vidéo est déjà en place")
        shots = SHOTS.search(html)
        guide = GUIDE.search(html)
        if guide:
            if shots:
                html = html[:shots.start()] + html[shots.end():]
            html = GUIDE.sub(
                lambda g: f'<section class="seo-game-guide page-width guide-with-video"{g.group(1)}{video}<div class="guide-text">{g.group(2)}</div></section>',
                html, count=1,
            )
        elif shots:
            html = html[:shots.start()] + f'<section class="game-video-solo page-width">{video}</section>' + html[shots.end():]
            solo.append(path.replace(ROOT + "/", ""))
        else:
            sys.exit(f"{path} : ni description ni images trouvées")
        html = html.replace("styles.css?v=11", "styles.css?v=12")
        open(path, "w", encoding="utf-8").write(html)
    print(f"{len(pages)} pages {NAMES[game]} mises à jour avec la vidéo {vid}")
    if solo:
        print("Vidéo seule (pas de description) :", ", ".join(solo))


main()
