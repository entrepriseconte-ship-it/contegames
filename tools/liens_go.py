"""Liens intelligents contegames.com/go/<jeu>/ : un seul lien par jeu, à mettre partout
(bio TikTok, Instagram, description YouTube, commentaires, QR code sur une affiche).

- iPhone / iPad  -> ouvre directement la fiche App Store du jeu (si elle existe).
- Android        -> ouvre directement la fiche Google Play du jeu (si elle existe).
- Ordinateur, ou téléphone sans fiche pour son système -> petite page avec les boutons
  des stores, itch.io, « Jouer dans le navigateur » et un QR code à scanner.
- ?reste=1 au bout du lien : pas de redirection (pour vérifier la page).

Gratuit, sans service extérieur : de simples pages statiques sur GitHub Pages.
Règle d'Anthony : un bouton seulement quand la fiche existe vraiment (liens vérifiés le 28/11/2026 :
liste Apple du développeur 6817612985 + fiches Google Play en 200 + pages itch.io en 200).
Ne touche ni à app-ads.txt ni aux autres pages du site.

QR codes : fabriqués avec la bibliothèque segno (pip install segno) au moment de lancer le script,
puis enregistrés en SVG dans la page : rien n'est chargé ailleurs à l'ouverture.

Lancer : python tools/liens_go.py
"""
import html
import json
from pathlib import Path

import segno

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "go"
SITE = "https://contegames.com"

# slug (dossier du site) : nom, icône, id App Store, paquet Google Play, page itch.io, /jouer, accroche FR, accroche EN
GAMES = [
    dict(slug="cocoboum", name="COCOBOUM!", icon="cocoboum-vignette.jpg", ios="6817739082", play="com.contegames.cocoboum",
         fr="Éclate les bulles, relève les défis et grimpe dans le classement mondial.",
         en="Pop the bubbles, beat the challenges and climb the world leaderboard."),
    dict(slug="sauvequifleche", name="Sauve qui Flèche !", icon="sauvequifleche-icone.jpg", ios="6823751966", play="com.contegames.arrowescape",
         itch="sauve-qui-fleche",
         fr="Fais sortir chaque flèche du plateau dans le bon ordre.",
         en="Get every arrow off the board in the right order."),
    dict(slug="caligulavsgladiators", name="Caligula vs Gladiators", icon="caligula-icone.jpg", ios="6822433598", play="com.contegames.caligulavsgladiators",
         itch="caligula-vs-gladiators",
         fr="Affronte gladiateurs et fauves dans l’arène et fais lever le pouce de Caligula.",
         en="Face gladiators and wild beasts in the arena and win Caligula’s thumbs-up."),
    dict(slug="tableauxensorceles", name="Les Tableaux Ensorcelés", icon="tableaux-icone.jpg", ios="6819245288", play="com.contegames.tableauxensorceles",
         itch="les-tableaux-ensorceles",
         fr="Reconstitue des tableaux magiques et restaure un château enchanté.",
         en="Complete magical paintings and restore an enchanted castle."),
    dict(slug="royaumedesenigmes", name="Royaume des Énigmes", icon="royaumedesenigmes-icone.jpg", ios="6825285817", play="com.contegames.royaumedesenigmes",
         itch="royaume-des-enigmes",
         fr="Associe des symboles, résous des énigmes et bats les 3 boss.",
         en="Match symbols, solve riddles and defeat the 3 bosses."),
    dict(slug="royaumedesrunes", name="Royaume des Runes", icon="royaumedesrunes-icone.jpg", ios="6833400206", play="com.contegames.royaumedesrunes",
         itch="royaume-des-runes", jouer=True,
         fr="Place les blocs de runes, réunis les couleurs et enchaîne les combos.",
         en="Place the rune blocks, group the colours and chain combos."),
    dict(slug="serpentdesrunes", name="Serpent des Runes", icon="serpentdesrunes-icone.jpg", ios="6833437318",
         itch="serpent-des-runes", jouer=True,
         fr="Un jeu de serpent avec un dragon : mange les runes et bats les 6 gardiens.",
         en="A snake game with a dragon: eat the runes and beat the 6 guardians."),
    dict(slug="gnomedescavernes", name="Gnome des Cavernes Enchantées", icon="gnomedescavernes-icone.jpg", ios="6834289564",
         itch="le-gnome-des-cavernes-enchantees", jouer=True,
         fr="Règle les aiguillages et guide chaque chariot vers la bonne sortie.",
         en="Set the switches and guide every cart to the right exit."),
    dict(slug="royaumedesmotscroises", name="Royaume des Mots Croisés", icon="royaume-icone.jpg", ios="6817612983", play="com.contegames.royaumedesmotscroises",
         fr="Résous des grilles, gagne des ducats et développe ton village médiéval.",
         en="Solve crosswords, earn coins and grow your medieval village."),
    dict(slug="mieuxchaquejour", name="Mieux Chaque Jour", icon="mieuxchaquejour-icone.jpg", ios="6817754343", play="com.contegames.mieuxchaquejour",
         fr="Yoga facile et nutrition pour progresser chaque jour.",
         en="Easy yoga and nutrition to feel better every day."),
    dict(slug="petitdragon", name="Le Petit Dragon", icon="petitdragon-icone.jpg",
         itch="le-petit-dragon",
         fr="Un jeu de plateforme peint à la main : traverse 7 royaumes et chasse le Roi des Ombres.",
         en="A hand-painted platformer: cross 7 kingdoms and drive out the King of Shadows."),
    dict(slug="chateaudeslumieres", name="Le Château des Lumières", icon="chateaudeslumieres-icone.jpg",
         itch="le-chateau-des-lumieres", jouer=True,
         fr="Tourne les miroirs et guide la lumière jusqu’aux cristaux.",
         en="Turn the mirrors and guide the light to the crystals."),
    dict(slug="rouagesenchantes", name="Les Rouages Enchantés", icon="rouagesenchantes-icone.jpg",
         itch="les-rouages-enchantes", jouer=True,
         fr="Pose les rouages et fais circuler l’énergie pour relancer les machines.",
         en="Place the gears and carry the energy to restart the machines."),
    dict(slug="tailleurdenuages", name="Le Tailleur de Nuages", icon="tailleurdenuages-icone.jpg",
         itch="le-tailleur-de-nuages", jouer=True,
         fr="Découpe, tourne et assemble les nuages pour ouvrir un chemin.",
         en="Cut, rotate and place the clouds to open a path."),
]

APPLE_SVG = ('<svg class="ico" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8'
             '-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 '
             '36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9z'
             'm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>')
PLAY_SVG = ('<svg class="ico" viewBox="0 0 512 512" aria-hidden="true"><path fill="#34a853" d="M48 32l232 224L48 480c-9-5-16-15-16-28V60c0-13 7-23 16-28z"/>'
            '<path fill="#fbbc04" d="M280 256l72-72 88 50c22 13 22 31 0 44l-88 50z"/><path fill="#ea4335" d="M48 480l232-224 72 72L88 488c-15 8-30 '
            '6-40-8z"/><path fill="#4285f4" d="M48 32c10-14 25-16 40-8l264 160-72 72z"/></svg>')

CSS = """
*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{font-family:Georgia,"Times New Roman",serif;background:radial-gradient(ellipse at top,#1f5a47,#163e32 55%,#0b241c);color:#3b2410;
 display:flex;align-items:center;justify-content:center;padding:24px 14px;min-height:100vh}
.card{width:100%;max-width:520px;background:radial-gradient(ellipse at top,#fbeecb,#f1d9a3 70%,#e9cb8a);border-radius:22px;padding:26px 22px 22px;
 box-shadow:inset 0 0 0 5px #f4dfaf,inset 0 0 0 7px #b48b45,0 18px 40px #0008;text-align:center}
.icon{width:112px;height:112px;border-radius:24px;object-fit:cover;box-shadow:0 4px 14px #0005;border:3px solid #e6c77c}
h1{margin:14px 0 6px;font-size:1.7rem;color:#5a2a0c;line-height:1.15}
.tag{margin:0 0 6px;font-size:1.02rem;line-height:1.4}
.free{display:inline-block;margin:4px 0 16px;padding:3px 14px;border:1px solid #c9a24f;border-radius:14px;background:#fff6dc8c;color:#4f2a12;font-size:.92rem}
.stores{display:flex;flex-direction:column;gap:10px;align-items:stretch}
.btn{display:flex;align-items:center;justify-content:center;gap:12px;min-height:56px;padding:8px 18px;border-radius:14px;text-decoration:none;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-weight:700;font-size:1.08rem;color:#fff6dc;border:2px solid #e6c77c;
 background:linear-gradient(180deg,#2b1f3d,#160f22);box-shadow:0 0 0 1px #3d2a0e inset,0 0 14px #b078ff59,0 5px 12px #29231140}
.btn:hover{background:linear-gradient(180deg,#3a2a52,#1d142d)}
.btn .ico{width:26px;height:28px;flex:none;color:#f3d98f}
.btn span{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1;text-align:left}
.btn small{font-size:.7em;font-weight:400;color:#e9dcc0}
.btn.alt{background:linear-gradient(180deg,#7a4a1c,#4f2a12);min-height:48px;font-size:1rem}
.btn.me{order:-1;outline:3px solid #f3d98f;outline-offset:2px}
.os-android .b-ios,.os-ios .b-android{order:5}
.qr{margin:20px auto 4px;display:flex;align-items:center;gap:14px;justify-content:center;text-align:left;font-size:.95rem;line-height:1.35}
.qr svg{width:132px;height:132px;flex:none;background:#fff;border-radius:10px;padding:6px;box-shadow:0 2px 8px #0003}
.qr b{color:#5a2a0c}
.foot{margin-top:16px;font-size:.9rem}
.foot a{color:#5d3418;text-underline-offset:4px}
.hint{display:none;margin:0 0 12px;font-size:.95rem;color:#6b4320}
.os-ios .qr,.os-android .qr{display:none}
.os-ios .hint.h-ios,.os-android .hint.h-android{display:block}
@media (max-width:420px){.qr{flex-direction:column;text-align:center}}
"""


def apple_url(g):
    return f"https://apps.apple.com/app/id{g['ios']}?pt=129524141&ct=go-{g['slug']}&mt=8"


def play_url(g):
    return (f"https://play.google.com/store/apps/details?id={g['play']}"
            f"&referrer=utm_source%3Dcontegames.com%26utm_medium%3Dgo%26utm_campaign%3Dgo-{g['slug']}")


def qr_svg(url):
    q = segno.make(url, error="m", micro=False)
    import io
    buf = io.BytesIO()
    q.save(buf, kind="svg", xmldecl=False, svgns=True, nl=False, border=2, dark="#2b1405", scale=4,
           title=None, desc=None)
    svg = buf.getvalue().decode("utf-8")
    # taille gérée par le CSS
    return svg.replace('<svg ', '<svg role="img" aria-label="QR code" ', 1)


def page(g):
    e = html.escape
    slug = g["slug"]
    short = f"{SITE}/go/{slug}"
    targets = {}
    if g.get("ios"):
        targets["ios"] = {"url": apple_url(g), "id": "id" + g["ios"], "t": "store_ios"}
    if g.get("play"):
        targets["android"] = {"url": play_url(g), "id": g["play"], "t": "store_android"}

    buttons = []
    if g.get("ios"):
        buttons.append(f'<a class="btn b-ios" href="{e(apple_url(g))}">{APPLE_SVG}<span><small data-t="dl_ios">Télécharger dans</small>App Store</span></a>')
    if g.get("play"):
        buttons.append(f'<a class="btn b-android" href="{e(play_url(g))}" rel="noopener">{PLAY_SVG}<span><small data-t="dl_play">Disponible sur</small>Google Play</span></a>')
    if g.get("jouer"):
        buttons.append(f'<a class="btn alt b-web" href="/jouer/{slug}/"><span><small data-t="pc">Sur ordinateur, sans rien installer</small><b data-t="play_web">Jouer dans le navigateur</b></span></a>')
    if g.get("itch"):
        buttons.append(f'<a class="btn alt b-itch" href="https://anthonycontegames.itch.io/{g["itch"]}" rel="noopener"><span><small data-t="itch_s">Android (APK) et ordinateur</small>itch.io</span></a>')

    hints = []
    if not g.get("ios"):
        hints.append('<p class="hint h-ios" data-t="no_ios">Bientôt sur l’App Store. En attendant, voici où y jouer :</p>')
    if not g.get("play"):
        hints.append('<p class="hint h-android" data-t="no_play">Bientôt sur Google Play. En attendant, voici où y jouer :</p>')

    free = "Gratuit" if (g.get("ios") or g.get("play")) else "Gratuit"
    texts = {
        "fr": {"tag": g["fr"], "free": free, "dl_ios": "Télécharger dans", "dl_play": "Disponible sur",
               "pc": "Sur ordinateur, sans rien installer", "play_web": "Jouer dans le navigateur",
               "itch_s": "Android (APK) et ordinateur", "qr1": "Sur ordinateur ?",
               "qr2": "Scanne ce code avec ton téléphone : il ouvre directement le bon magasin.",
               "site": "Voir la page du jeu", "studio": "Tous nos jeux",
               "no_ios": "Bientôt sur l’App Store. En attendant, voici où y jouer :",
               "no_play": "Bientôt sur Google Play. En attendant, voici où y jouer :"},
        "en": {"tag": g["en"], "free": "Free", "dl_ios": "Download on the", "dl_play": "Get it on",
               "pc": "On a computer, nothing to install", "play_web": "Play in your browser",
               "itch_s": "Android (APK) and computer", "qr1": "On a computer?",
               "qr2": "Scan this code with your phone: it opens the right store directly.",
               "site": "See the game page", "studio": "All our games",
               "no_ios": "Coming soon to the App Store. Meanwhile, here is where to play:",
               "no_play": "Coming soon to Google Play. Meanwhile, here is where to play:"},
    }

    title = f"{g['name']} | Conte Games Studio"
    desc = g["fr"]
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<script>
/* Lien intelligent : iPhone/iPad -> App Store, Android -> Google Play (tools/liens_go.py). ?reste=1 = pas de redirection. */
(function(){{
  var T={json.dumps(targets, separators=(',', ':'))};
  var ua=navigator.userAgent||'';
  var os=(/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))?'ios':(/Android/.test(ua)?'android':'');
  if(os)document.documentElement.className='os-'+os;
  var t=T[os];
  if(!t||/[?&]reste=1/.test(location.search))return;
  try{{
    var q=new URLSearchParams(location.search);
    var u=q.get('utm_source')||(q.has('ttclid')?'tiktok':'')||(q.has('fbclid')?'facebook':'')||(q.has('gclid')?'google':'');
    var b=JSON.stringify({{p:location.pathname+'@'+t.id,t:t.t,r:document.referrer,u:u}});
    navigator.sendBeacon('https://contegames-stats.mieuxchaquejour.workers.dev/hit',new Blob([b],{{type:'text/plain'}}));
  }}catch(e){{}}
  location.replace(t.url);
}})();
</script>
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#163e32">
<link rel="canonical" href="{SITE}/go/{slug}/">
<meta property="og:title" content="{e(g['name'])}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE}/assets/{g['icon']}">
<meta property="og:url" content="{SITE}/go/{slug}/">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<style>{CSS}</style>
</head>
<body>
<main class="card">
<img class="icon" src="/assets/{g['icon']}" alt="{e(g['name'])}" width="112" height="112">
<h1>{e(g['name'])}</h1>
<p class="tag" data-t="tag">{e(g['fr'])}</p>
<span class="free" data-t="free">{free}</span>
{''.join(hints)}
<div class="stores">
{chr(10).join(buttons)}
</div>
<div class="qr">{qr_svg(short)}<div><b data-t="qr1">Sur ordinateur ?</b><br><span data-t="qr2">Scanne ce code avec ton téléphone : il ouvre directement le bon magasin.</span></div></div>
<p class="foot"><a href="/{slug}/" data-t="site">Voir la page du jeu</a> · <a href="/" data-t="studio">Tous nos jeux</a> · Conte Games Studio</p>
</main>
<script>
(function(){{
  var L={json.dumps(texts, ensure_ascii=False, separators=(',', ':'))};
  var lang=((navigator.language||'fr').slice(0,2).toLowerCase()==='fr')?'fr':'en';
  if(lang!=='fr'){{document.documentElement.lang='en';document.querySelectorAll('[data-t]').forEach(function(n){{var v=L.en[n.getAttribute('data-t')];if(v)n.textContent=v;}});}}
  var os=document.documentElement.className;
  var mine=os==='os-ios'?(document.querySelector('.b-ios')||document.querySelector('.b-web')):os==='os-android'?(document.querySelector('.b-android')||document.querySelector('.b-itch')):null;
  if(mine)mine.classList.add('me');
}})();
</script>
<script src="/analytics.js?v=3" defer></script>
</body>
</html>
"""


def index_page():
    e = html.escape
    rows = []
    for g in GAMES:
        short = f"contegames.com/go/{g['slug']}"
        where = []
        if g.get("ios"):
            where.append("App Store")
        if g.get("play"):
            where.append("Google Play")
        if g.get("jouer"):
            where.append("navigateur")
        if g.get("itch"):
            where.append("itch.io")
        rows.append(f'<li><img src="/assets/{g["icon"]}" alt="" width="56" height="56"><div><b>{e(g["name"])}</b>'
                    f'<a href="/go/{g["slug"]}/?reste=1">{short}</a><small>{" · ".join(where)}</small></div></li>')
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>Liens des jeux | Conte Games Studio</title>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<style>{CSS}
.card{{max-width:640px;text-align:left}}
ul{{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:10px}}
li{{display:flex;gap:12px;align-items:center;padding:8px;border-radius:12px;background:#fff6dc8c}}
li img{{border-radius:12px;object-fit:cover}}
li div{{display:flex;flex-direction:column}}
li a{{color:#5d3418;font-family:system-ui,sans-serif;font-size:.95rem}}
li small{{color:#6b4320}}
</style>
</head>
<body>
<main class="card">
<h1>Un lien par jeu</h1>
<p class="tag">Sur iPhone, le lien ouvre l’App Store. Sur Android, Google Play. Sur ordinateur, une page avec les boutons et un QR code.</p>
<ul>
{chr(10).join(rows)}
</ul>
<p class="foot"><a href="/">Tous nos jeux</a> · Conte Games Studio</p>
</main>
<script src="/analytics.js?v=3" defer></script>
</body>
</html>
"""


def main():
    OUT.mkdir(exist_ok=True)
    for g in GAMES:
        assert (ROOT / "assets" / g["icon"]).exists(), g["icon"]
        d = OUT / g["slug"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(page(g), encoding="utf-8", newline="\n")
    (OUT / "index.html").write_text(index_page(), encoding="utf-8", newline="\n")
    print(f"{len(GAMES)} liens écrits dans go/")


if __name__ == "__main__":
    main()
