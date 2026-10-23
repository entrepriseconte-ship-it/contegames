#!/usr/bin/env python3
"""Add languages to the site and keep every page linked to every language.

1. Each new language listed in NEW gets its 8 pages (home + 7 games), built
   from the English pages: every visible text, title, meta description,
   alt/aria-label and JSON-LD description is replaced by its translation from
   tools/langues/<code>.json (English string -> translation). Layout, frames,
   images, links and scripts stay identical to the English page.
2. On every page of every language (existing and new), the hreflang links and
   the language menu are rebuilt from LANGS, so all languages point to each other.
3. sitemap.xml, language-suggest.js and ambience.js get the new languages.

Idempotent. Run from the repository root:
    python3 tools/langues.py            # build + link everything
    python3 tools/langues.py --extract  # write tools/langues/en.json (strings to translate)
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = "https://contegames.com"
GROUPS = ["", "cocoboum/", "royaumedesmotscroises/", "mieuxchaquejour/", "tableauxensorceles/",
          "caligulavsgladiators/", "sauvequifleche/", "royaumedesenigmes/"]

# folder, hreflang, name of the language in itself (menu order = this order)
LANGS = [
    ("fr", "fr", "Français"), ("en", "en", "English"), ("es", "es", "Español"), ("de", "de", "Deutsch"),
    ("it", "it", "Italiano"), ("pt", "pt", "Português"), ("ja", "ja", "日本語"), ("ko", "ko", "한국어"),
    ("zh-cn", "zh-CN", "简体中文"), ("zh-tw", "zh-TW", "繁體中文"), ("hi", "hi", "हिन्दी"),
    ("id", "id", "Bahasa Indonesia"), ("pt-br", "pt-BR", "Português (Brasil)"),
    ("es-mx", "es-MX", "Español (México)"), ("ar", "ar", "العربية"), ("tr", "tr", "Türkçe"),
    ("ru", "ru", "Русский"), ("nl", "nl", "Nederlands"), ("pl", "pl", "Polski"), ("th", "th", "ไทย"),
    ("vi", "vi", "Tiếng Việt"), ("uk", "uk", "Українська"), ("sv", "sv", "Svenska"),
    ("ms", "ms", "Bahasa Melayu"), ("ro", "ro", "Română"), ("el", "el", "Ελληνικά"),
    ("cs", "cs", "Čeština"), ("hu", "hu", "Magyar"), ("fi", "fi", "Suomi"), ("he", "he", "עברית"),
    # Lot 1 (22/10/2026)
    ("da", "da", "Dansk"), ("nb", "nb", "Norsk bokmål"), ("sk", "sk", "Slovenčina"),
    ("bg", "bg", "Български"), ("hr", "hr", "Hrvatski"), ("sl", "sl", "Slovenščina"),
    ("lt", "lt", "Lietuvių"), ("lv", "lv", "Latviešu"), ("et", "et", "Eesti"), ("ca", "ca", "Català"),
    # Lot 2
    ("is", "is", "Íslenska"), ("sr", "sr", "Српски"), ("fil", "fil", "Filipino"),
    ("af", "af", "Afrikaans"), ("sw", "sw", "Kiswahili"), ("bn", "bn", "বাংলা"),
    ("ta", "ta", "தமிழ்"), ("kk", "kk", "Қазақ тілі"), ("ka", "ka", "ქართული"), ("az", "az", "Azərbaycan"),
    # Lot 3
    ("sq", "sq", "Shqip"), ("mk", "mk", "Македонски"), ("hy", "hy", "Հայերեն"),
    ("uz", "uz", "Oʻzbekcha"), ("gl", "gl", "Galego"), ("eu", "eu", "Euskara"),
    ("mr", "mr", "मराठी"), ("te", "te", "తెలుగు"), ("ne", "ne", "नेपाली"), ("si", "si", "සිංහල"),
]

# New languages: og:locale, language-suggest prompt, ambience.js labels (play, pause)
NEW = {
    "da": ("da_DK", "Vis denne side på dansk?", ["Genoptag animation", "Sæt animation på pause"]),
    "nb": ("nb_NO", "Vise denne siden på norsk?", ["Fortsett animasjonen", "Sett animasjonen på pause"]),
    "sk": ("sk_SK", "Zobraziť túto stránku po slovensky?", ["Obnoviť animáciu", "Pozastaviť animáciu"]),
    "bg": ("bg_BG", "Да се покаже ли тази страница на български?", ["Продължи анимацията", "Спри анимацията"]),
    "hr": ("hr_HR", "Prikazati ovu stranicu na hrvatskom?", ["Nastavi animaciju", "Pauziraj animaciju"]),
    "sl": ("sl_SI", "Prikažem to stran v slovenščini?", ["Nadaljuj animacijo", "Začasno ustavi animacijo"]),
    "lt": ("lt_LT", "Rodyti šį puslapį lietuviškai?", ["Tęsti animaciją", "Pristabdyti animaciją"]),
    "lv": ("lv_LV", "Rādīt šo lapu latviski?", ["Atsākt animāciju", "Apturēt animāciju"]),
    "et": ("et_EE", "Kas näidata seda lehte eesti keeles?", ["Jätka animatsiooni", "Peata animatsioon"]),
    "ca": ("ca_ES", "Vols veure aquesta pàgina en català?", ["Reprèn l'animació", "Posa l'animació en pausa"]),
    "is": ("is_IS", "Sýna þessa síðu á íslensku?", ["Halda hreyfimynd áfram", "Gera hlé á hreyfimynd"]),
    "sr": ("sr_RS", "Прикажи ову страницу на српском?", ["Настави анимацију", "Паузирај анимацију"]),
    "fil": ("fil_PH", "Tingnan ang pahinang ito sa Filipino?", ["Ituloy ang animation", "I-pause ang animation"]),
    "af": ("af_ZA", "Wys hierdie bladsy in Afrikaans?", ["Hervat animasie", "Onderbreek animasie"]),
    "sw": ("sw_KE", "Ungependa kuona ukurasa huu kwa Kiswahili?", ["Endelea na uhuishaji", "Sitisha uhuishaji"]),
    "bn": ("bn_BD", "এই পৃষ্ঠাটি বাংলায় দেখবেন?", ["অ্যানিমেশন আবার চালু করুন", "অ্যানিমেশন থামান"]),
    "ta": ("ta_IN", "இந்தப் பக்கத்தைத் தமிழில் பார்க்கவா?", ["அனிமேஷனைத் தொடரவும்", "அனிமேஷனை இடைநிறுத்தவும்"]),
    "kk": ("kk_KZ", "Бұл бетті қазақ тілінде көрсету керек пе?", ["Анимацияны жалғастыру", "Анимацияны кідірту"]),
    "ka": ("ka_GE", "გსურთ ამ გვერდის ქართულად ნახვა?", ["ანიმაციის გაგრძელება", "ანიმაციის შეჩერება"]),
    "az": ("az_AZ", "Bu səhifəni Azərbaycan dilində göstərək?", ["Animasiyanı davam etdir", "Animasiyanı dayandır"]),
    "sq": ("sq_AL", "Ta shfaq këtë faqe në shqip?", ["Vazhdo animacionin", "Ndalo animacionin"]),
    "mk": ("mk_MK", "Да се прикаже оваа страница на македонски?", ["Продолжи ја анимацијата", "Паузирај ја анимацијата"]),
    "hy": ("hy_AM", "Ցուցադրե՞լ այս էջը հայերենով", ["Շարունակել անիմացիան", "Դադարեցնել անիմացիան"]),
    "uz": ("uz_UZ", "Bu sahifani oʻzbek tilida koʻrsataymi?", ["Animatsiyani davom ettirish", "Animatsiyani toʻxtatish"]),
    "gl": ("gl_ES", "Queres ver esta páxina en galego?", ["Retomar a animación", "Pausar a animación"]),
    "eu": ("eu_ES", "Orri hau euskaraz ikusi nahi duzu?", ["Jarraitu animazioarekin", "Pausatu animazioa"]),
    "mr": ("mr_IN", "हे पान मराठीत पाहायचे?", ["अ‍ॅनिमेशन पुन्हा सुरू करा", "अ‍ॅनिमेशन थांबवा"]),
    "te": ("te_IN", "ఈ పేజీని తెలుగులో చూడాలా?", ["యానిమేషన్ కొనసాగించు", "యానిమేషన్ ఆపు"]),
    "ne": ("ne_NP", "यो पृष्ठ नेपालीमा हेर्ने?", ["एनिमेसन जारी राख्नुहोस्", "एनिमेसन रोक्नुहोस्"]),
    "si": ("si_LK", "මෙම පිටුව සිංහලෙන් බලන්නද?", ["සජීවිකරණය නැවත අරඹන්න", "සජීවිකරණය නවත්වන්න"]),
}

TOK = re.compile(r'(<!--.*?-->|<script\b.*?</script>|<style\b.*?</style>|<[^>]+>)', re.S)
ATTR = re.compile(r'\b(alt|aria-label|title|placeholder)="([^"]*)"')
META = re.compile(r'(<meta (?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description|og:image:alt)" content=")([^"]*)(")')
MENU = re.compile(r'<div class="language-options">.*?</div>', re.S)
ALTS = re.compile(r'(?:<link rel="alternate" hreflang="[^"]*" href="[^"]*" />\s*)+')
LD_KEYS = ("description", "alternateName")


def url(code: str, group: str) -> str:
    return f"{DOMAIN}/" + ("" if code == "fr" else code + "/") + group


def page_path(code: str, group: str) -> Path:
    return ROOT / ("" if code == "fr" else code + "/") / group / "index.html"


def walk_ld(obj, fn):
    if isinstance(obj, dict):
        return {k: (fn(v) if k in LD_KEYS and isinstance(v, str) else walk_ld(v, fn)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [walk_ld(v, fn) for v in obj]
    return obj


def transform(html: str, fn) -> str:
    """Apply fn to every translatable string of a page (outside the language menu)."""
    menu = MENU.search(html)
    keep = menu.group(0) if menu else ""
    html = MENU.sub("\0MENU\0", html)
    out = []
    for tok in TOK.split(html):
        if not tok:
            continue
        if tok.startswith("<script") and "ld+json" in tok[:60]:
            start = tok.index(">") + 1
            data = json.loads(tok[start:-len("</script>")])
            out.append(tok[:start] + json.dumps(walk_ld(data, fn), ensure_ascii=False, separators=(",", ":")) + "</script>")
        elif tok.startswith(("<script", "<style", "<!--")):
            out.append(tok)
        elif tok.startswith("<"):
            if tok.startswith("<meta"):
                tok = META.sub(lambda m: m.group(1) + fn(m.group(2)) + m.group(3), tok)
            else:
                tok = ATTR.sub(lambda m: f'{m.group(1)}="{fn(m.group(2))}"', tok)
            out.append(tok)
        else:
            s = tok.strip()
            if s and "\0" not in s and re.search(r"[A-Za-z]", s):
                lead = tok[: len(tok) - len(tok.lstrip())]
                trail = tok[len(tok.rstrip()):]
                tok = lead + fn(s) + trail
            out.append(tok)
    return "".join(out).replace("\0MENU\0", keep)


def extract() -> None:
    seen = []
    for group in GROUPS:
        def grab(s):
            if s not in seen:
                seen.append(s)
            return s
        transform(page_path("en", group).read_text(encoding="utf-8"), grab)
    target = ROOT / "tools/langues/en.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(seen, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"{len(seen)} strings -> {target.relative_to(ROOT)}")


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def build(code: str, hreflang: str) -> int:
    table = json.loads((ROOT / f"tools/langues/{code}.json").read_text(encoding="utf-8"))
    locale = NEW[code][0]
    missing = set()

    def tr(s):
        if s in table:
            return esc(table[s])
        missing.add(s)
        return s

    for group in GROUPS:
        html = page_path("en", group).read_text(encoding="utf-8")
        html = transform(html, tr)
        html = html.replace('<html lang="en">', f'<html lang="{hreflang}">', 1)
        html = html.replace('"og:locale" content="en_US"', f'"og:locale" content="{locale}"', 1)
        html = html.replace('"inLanguage":"en"', f'"inLanguage":"{hreflang}"')
        html = html.replace(f"{DOMAIN}/en/", f"{DOMAIN}/{code}/")
        target = page_path(code, group)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(html, encoding="utf-8")
    if missing:
        sys.exit(f"{code}: {len(missing)} untranslated strings, e.g. {sorted(missing)[:3]}")
    return len(GROUPS)


def link_all() -> int:
    changed = 0
    for code, _, _ in LANGS:
        for group in GROUPS:
            path = page_path(code, group)
            html = path.read_text(encoding="utf-8")
            alts = "".join(f'<link rel="alternate" hreflang="{h}" href="{url(c, group)}" />' for c, h, _ in LANGS)
            alts += f'<link rel="alternate" hreflang="x-default" href="{url("en", group)}" />'
            menu = '<div class="language-options">' + "".join(
                f'<a href="/{"" if c == "fr" else c + "/"}{group}" hreflang="{h}"'
                + (' aria-current="page"' if c == code else "") + f">{name}</a>"
                for c, h, name in LANGS) + "</div>"
            new = ALTS.sub(lambda m: alts, html, count=1)
            new = MENU.sub(lambda m: menu, new, count=1)
            if new != html:
                path.write_text(new, encoding="utf-8")
                changed += 1
    return changed


def sitemap(today: str) -> int:
    path = ROOT / "sitemap.xml"
    xml = path.read_text(encoding="utf-8")
    added = 0
    for code in NEW:
        for group in GROUPS:
            loc = url(code, group)
            if f"<loc>{loc}</loc>" not in xml:
                xml = xml.replace("</urlset>", f"  <url><loc>{loc}</loc><lastmod>{today}</lastmod></url>\n</urlset>")
                added += 1
    path.write_text(xml, encoding="utf-8")
    return added


def add_entries(js: str, name: str, entries) -> str:
    m = re.search(r"(const %s = \{)(.*?)(\n  \};)" % name, js, re.S)
    body = m.group(2)
    for key, value in entries:
        if f"'{key}':" not in body:
            body += f",\n    '{key}':'{value}'"
    return js[:m.start(2)] + body + js[m.end(2):]


def scripts() -> None:
    path = ROOT / "language-suggest.js"
    js = path.read_text(encoding="utf-8")
    m = re.search(r"(const supported = new Set\(\[)(.*?)(\n\s*\]\);)", js, re.S)
    body = m.group(2)
    for code in NEW:
        if f"'{code}'" not in body:
            body += f",'{code}'"
    js = js[:m.start(2)] + body + js[m.end(2):]
    names = {c: n for c, _, n in LANGS}
    js = add_entries(js, "labels", [(c, names[c]) for c in NEW])
    js = add_entries(js, "prompts", [(c, NEW[c][1]) for c in NEW])
    base = "const base = normalized.split('-')[0];"
    for extra in ("    if ((base === 'no' || base === 'nn') && supported.has('nb')) return 'nb';",
                  "    if (base === 'tl' && supported.has('fil')) return 'fil';"):
        if extra not in js:
            js = js.replace(base, base + "\n" + extra, 1)
    path.write_text(js, encoding="utf-8")

    path = ROOT / "ambience.js"
    js = path.read_text(encoding="utf-8")
    m = re.search(r"const motionLabels = (\{.*?\});", js)
    labels = json.loads(m.group(1))
    for code in NEW:
        labels.setdefault(code, NEW[code][2])
    js = js[:m.start(1)] + json.dumps(labels, ensure_ascii=False, separators=(",", ":")) + js[m.end(1):]
    path.write_text(js, encoding="utf-8")


if __name__ == "__main__":
    if "--extract" in sys.argv:
        extract()
        sys.exit()
    built = sum(build(code, h) for code, h, _ in LANGS if code in NEW)
    print(f"built {built} pages, relinked {link_all()} pages, sitemap +{sitemap('2026-10-22')}")
    scripts()
