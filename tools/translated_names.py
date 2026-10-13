#!/usr/bin/env python3
"""Show the translated name under the official App Store name of each game.

The official name stays first (it is the name shown on the App Store);
the translation is added in a <span class="title-translation"> inside the
same heading, plus "alternateName" in the SoftwareApplication JSON-LD.
Idempotent: run from the repository root, python3 tools/translated_names.py
"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
T, R, M = "Les Tableaux Ensorcelés", "Royaume des Mots Croisés", "Mieux Chaque Jour"
GAME_DIR = {T: "tableauxensorceles", R: "royaumedesmotscroises", M: "mieuxchaquejour"}
NAMES = {
    "en": ("The Enchanted Paintings", "The Crossword Kingdom", "Better Every Day"),
    "es": ("Los Cuadros Encantados", "El Reino de los Crucigramas", "Mejor Cada Día"),
    "es-mx": ("Los Cuadros Encantados", "El Reino de los Crucigramas", "Mejor Cada Día"),
    "de": ("Die verzauberten Gemälde", "Das Königreich der Kreuzworträtsel", "Jeden Tag besser"),
    "it": ("I Quadri Incantati", "Il Regno dei Cruciverba", "Meglio Ogni Giorno"),
    "pt": ("Os Quadros Encantados", "O Reino das Palavras Cruzadas", "Melhor a Cada Dia"),
    "pt-br": ("Os Quadros Encantados", "O Reino das Palavras Cruzadas", "Melhor a Cada Dia"),
    "ja": ("魔法にかけられた絵画", "クロスワード王国", "毎日もっと良く"),
    "ko": ("마법에 걸린 그림들", "십자말풀이 왕국", "매일 더 나아지기"),
    "zh-cn": ("魔法名画", "填字王国", "每天更好"),
    "zh-tw": ("魔法名畫", "填字王國", "每天更好"),
    "hi": ("जादुई चित्र", "क्रॉसवर्ड का साम्राज्य", "हर दिन बेहतर"),
    "id": ("Lukisan-Lukisan Ajaib", "Kerajaan Teka-Teki Silang", "Lebih Baik Setiap Hari"),
    "ar": ("اللوحات المسحورة", "مملكة الكلمات المتقاطعة", "أفضل كل يوم"),
    "tr": ("Büyülü Tablolar", "Bulmaca Krallığı", "Her Gün Daha İyi"),
    "ru": ("Заколдованные картины", "Королевство кроссвордов", "Лучше с каждым днём"),
    "nl": ("De Betoverde Schilderijen", "Het Kruiswoordkoninkrijk", "Elke Dag Beter"),
    "pl": ("Zaczarowane obrazy", "Królestwo krzyżówek", "Lepiej każdego dnia"),
    "th": ("ภาพวาดต้องมนตร์", "อาณาจักรอักษรไขว้", "ดีขึ้นทุกวัน"),
    "vi": ("Những Bức Tranh Phù Phép", "Vương Quốc Ô Chữ", "Tốt Hơn Mỗi Ngày"),
    "uk": ("Зачаровані картини", "Королівство кросвордів", "Краще з кожним днем"),
    "sv": ("De förtrollade tavlorna", "Korsordsriket", "Bättre varje dag"),
    "ms": ("Lukisan Terpesona", "Kerajaan Silang Kata", "Lebih Baik Setiap Hari"),
    "ro": ("Tablourile Fermecate", "Regatul Cuvintelor Încrucișate", "Mai Bine în Fiecare Zi"),
    "el": ("Οι Μαγεμένοι Πίνακες", "Το Βασίλειο των Σταυρόλεξων", "Καλύτερα Κάθε Μέρα"),
    "cs": ("Začarované obrazy", "Království křížovek", "Každý den lépe"),
    "hu": ("Az elvarázsolt festmények", "A keresztrejtvények birodalma", "Minden nap jobban"),
    "fi": ("Lumotut maalaukset", "Ristisanojen valtakunta", "Parempi joka päivä"),
    "he": ("הציורים המכושפים", "ממלכת התשבצים", "טוב יותר בכל יום"),
}


def span(text: str) -> str:
    return f'<span class="title-translation">{text}</span>'


def main() -> None:
    changed = 0
    for code, names in NAMES.items():
        mapping = dict(zip((T, R, M), names))
        home = ROOT / code / "index.html"
        html = home.read_text(encoding="utf-8")
        new = html
        for official, local in mapping.items():
            new = new.replace(f"<h3>{official}</h3>", f"<h3>{official}{span(local)}</h3>")
        for official, local in mapping.items():
            page = ROOT / code / GAME_DIR[official] / "index.html"
            g = page.read_text(encoding="utf-8")
            g2 = re.sub(r'(<h1 id="[^"]+" class="game-title game-title-fit">)' + re.escape(official) + "</h1>",
                        lambda m: m.group(1) + official + span(local) + "</h1>", g, count=1)
            needle = f'"@type":"SoftwareApplication","name":"{official}",'
            if '"alternateName"' not in g2.split(needle, 1)[-1][:200]:
                g2 = g2.replace(needle, needle + f'"alternateName":{json.dumps(local, ensure_ascii=False)},', 1)
            if g2 != g:
                page.write_text(g2, encoding="utf-8"); changed += 1
        if new != html:
            home.write_text(new, encoding="utf-8"); changed += 1
    print("files changed:", changed)


if __name__ == "__main__":
    main()
