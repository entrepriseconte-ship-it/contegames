"""Ajoute un bouton « Voir la vidéo sur YouTube » en bas du cadre de description
des pages d'un jeu (30 langues).

Usage : python3 tools/lien_youtube.py <jeu> <lien YouTube>
"""
import glob
import re
import sys

ROOT = __file__.rsplit("/tools/", 1)[0]
LABELS = {
    "fr": "Voir la vidéo sur YouTube", "en": "Watch the video on YouTube",
    "es": "Ver el vídeo en YouTube", "es-mx": "Ver el video en YouTube",
    "de": "Video auf YouTube ansehen", "it": "Guarda il video su YouTube",
    "pt": "Ver o vídeo no YouTube", "pt-br": "Assistir ao vídeo no YouTube",
    "ja": "YouTubeで動画を見る", "ko": "YouTube에서 영상 보기",
    "zh-cn": "在 YouTube 上观看视频", "zh-tw": "在 YouTube 上觀看影片",
    "hi": "YouTube पर वीडियो देखें", "id": "Tonton videonya di YouTube",
    "ar": "شاهد الفيديو على YouTube", "tr": "Videoyu YouTube'da izle",
    "ru": "Смотреть видео на YouTube", "nl": "Bekijk de video op YouTube",
    "pl": "Obejrzyj film na YouTube", "th": "ดูวิดีโอบน YouTube",
    "vi": "Xem video trên YouTube", "uk": "Дивитися відео на YouTube",
    "sv": "Se videon på YouTube", "ms": "Tonton video di YouTube",
    "ro": "Vezi videoclipul pe YouTube", "el": "Δες το βίντεο στο YouTube",
    "cs": "Zhlédnout video na YouTube", "hu": "Nézd meg a videót a YouTube-on",
    "fi": "Katso video YouTubessa", "he": "צפו בסרטון ב-YouTube",
}
GUIDE_END = re.compile(r'(<section class="seo-game-guide page-width"[^>]*>.*?)</section>', re.S)


def main():
    game, link = sys.argv[1], sys.argv[2].strip()
    if not re.fullmatch(r"https://www\.youtube\.com/(shorts/|watch\?v=)[A-Za-z0-9_-]{11}", link):
        sys.exit(f"Lien YouTube inattendu : {link}")
    for path in sorted(glob.glob(f"{ROOT}/{game}/index.html") + glob.glob(f"{ROOT}/*/{game}/index.html")):
        rel = path[len(ROOT) + 1:]
        lang = "fr" if rel.startswith(game + "/") else rel.split("/")[0]
        html = open(path, encoding="utf-8").read()
        if 'class="button button-youtube"' in html:
            continue
        button = (f'<p><a class="button button-youtube" href="{link}" target="_blank" rel="noopener">'
                  f'{LABELS[lang]}</a></p>')
        html, n = GUIDE_END.subn(lambda m: m.group(1) + button + "</section>", html, count=1)
        if n != 1:
            print(f"{rel} : pas de cadre de description, bouton non ajouté")
            continue
        open(path, "w", encoding="utf-8").write(html)
    print(f"Bouton YouTube ajouté sur les pages {game}")


main()
