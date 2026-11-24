#!/usr/bin/env python3
"""Richer home pages for the languages that already bring visits from Google.

Search Console (27/10 -> 24/11/2026): fr, en, de, ar, es (+es-mx), tr, pt-br,
ru, it, ja and ko bring most impressions. For each of them this script:

1. rewrites the <title>, meta description, og/twitter title and description
   with the words people search in that language (free games, iPhone, Android,
   puzzles, word games, brain teasers...), instead of the old text that only
   named COCOBOUM! and "games to come";
2. inserts, between the game frames and the studio/contact panels, a parchment
   guide (same seo-game-guide style as the game pages): the games sorted by
   genre with links to their pages, then a few visible questions and answers;
3. rebuilds the home FAQPage JSON-LD word for word from those visible questions.

Only true facts: every game and app of the studio is free; games are on the
App Store, most are also on Google Play. No number that would go stale.

The block sits between <!--guide-accueil--> markers, so the script is
idempotent and tools/langues.py strips it from the English template when it
builds new languages. Run from the repository root:
    python3 tools/guide_accueil.py
"""
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from donnees_ia import add_faq  # noqa: E402
from langues import page_path  # noqa: E402

START, END = "<!--guide-accueil-->", "<!--/guide-accueil-->"
BLOCK = re.compile(re.escape(START) + ".*?" + re.escape(END), re.S)
ANCHOR = '<div class="story-section">'

NAMES = {
    "cocoboum": "COCOBOUM!", "royaumedesmotscroises": "Royaume des Mots Croisés",
    "mieuxchaquejour": "Mieux Chaque Jour", "tableauxensorceles": "Les Tableaux Ensorcelés",
    "caligulavsgladiators": "Caligula vs Gladiators", "sauvequifleche": "Sauve qui Flèche !",
    "royaumedesenigmes": "Royaume des Énigmes", "serpentdesrunes": "Serpent des Runes",
    "gnomedescavernes": "Gnome des Cavernes Enchantées", "royaumedesrunes": "Royaume des Runes",
    "chateaudeslumieres": "Le Château des Lumières", "rouagesenchantes": "Les Rouages Enchantés",
    "tailleurdenuages": "Le Tailleur de Nuages", "petitdragon": "Le Petit Dragon",
}
LINK = re.compile(r"\[(\w+)\]")

T = {}

T["fr"] = dict(
    title="Conte Games Studio | Jeux gratuits iPhone et Android : casse-tête, puzzles, mots croisés",
    desc="Jeux mobiles gratuits pour iPhone et Android : casse-tête, puzzles, mots croisés, énigmes, arcade et bien-être, créés par un studio indépendant français au style peint à la main.",
    h2="Des jeux gratuits pour iPhone et Android",
    intro="Conte Games Studio est un studio de jeux indépendant installé à Saint-Chamond, en France. Il crée des jeux mobiles gratuits aux décors peints à la main, avec des dragons, des châteaux et beaucoup de magie : des casse-tête pour réfléchir, des jeux de mots, des énigmes, de l'arcade et une appli de bien-être. Chaque jeu a sa page avec une vidéo et ses liens de téléchargement.",
    cats=[
        ("Casse-tête et jeux de réflexion", "[sauvequifleche] pour faire sortir chaque flèche du plateau, [gnomedescavernes] et ses rails à aiguiller, [royaumedesrunes] et ses blocs de runes qui tombent. Bientôt : [chateaudeslumieres], [rouagesenchantes] et [tailleurdenuages]."),
        ("Puzzles", "[tableauxensorceles] : 50 tableaux à reconstituer, en puzzle classique ou en taquin, sans publicité."),
        ("Mots croisés et énigmes", "[royaumedesmotscroises] pour résoudre des grilles et bâtir un village médiéval, [royaumedesenigmes] pour associer des symboles et vaincre des boss."),
        ("Arcade et action", "[cocoboum] pour éclater des bulles en duel, [caligulavsgladiators] pour combattre dans l'arène, [serpentdesrunes] pour guider un dragon à travers les runes. Bientôt : [petitdragon], un jeu de plateforme."),
        ("Bien-être", "[mieuxchaquejour], une application de yoga et de nutrition pour progresser chaque jour."),
    ],
    faq=[
        ("Les jeux de Conte Games Studio sont-ils gratuits ?", "Oui. Tous les jeux et applications du studio se téléchargent gratuitement."),
        ("Sur quels téléphones peut-on y jouer ?", "Les jeux sortent sur iPhone et iPad via l'App Store, et la plupart sont aussi sur Android via Google Play. Les boutons de chaque jeu mènent directement à la bonne boutique."),
        ("Quel jeu choisir pour commencer ?", "Pour réfléchir, essayez Sauve qui Flèche ! ou Les Tableaux Ensorcelés. Pour les amoureux des mots, Royaume des Mots Croisés. Pour jouer vite et à deux, COCOBOUM!."),
        ("Qui crée ces jeux ?", "Conte Games Studio, un studio indépendant fondé par Anthony à Saint-Chamond, dans la Loire. Vous pouvez écrire à contegamesstudio@gmail.com."),
    ],
)

T["en"] = dict(
    title="Conte Games Studio | Free games for iPhone and Android: puzzles, word games, brain teasers",
    desc="Free mobile games for iPhone and Android: puzzle games, brain teasers, crosswords, riddles, arcade games and a wellness app, made by an independent French studio with a hand-painted style.",
    h2="Free games for iPhone and Android",
    intro="Conte Games Studio is an independent game studio based in Saint-Chamond, France. It makes free mobile games with hand-painted worlds full of dragons, castles and magic: brain teasers, puzzle games, word games, riddles, arcade games and a wellness app. Every game has its own page with a video and download links.",
    cats=[
        ("Puzzle games and brain teasers", "[sauvequifleche] (Arrow Escape), where you clear every arrow from the board, [gnomedescavernes] and its railway switches, [royaumedesrunes] and its falling rune blocks. Coming soon: [chateaudeslumieres], [rouagesenchantes] and [tailleurdenuages]."),
        ("Jigsaw and sliding puzzles", "[tableauxensorceles] (The Enchanted Paintings): 50 paintings to rebuild as jigsaw or sliding puzzles, with no ads."),
        ("Word games and riddles", "[royaumedesmotscroises] (The Crossword Kingdom) to solve crossword grids and build a medieval village, [royaumedesenigmes] (The Kingdom of Riddles) to match symbols and defeat bosses."),
        ("Arcade and action games", "[cocoboum] to pop bubbles in duels, [caligulavsgladiators] to fight in the arena, [serpentdesrunes] to guide a dragon through the runes, like a snake game. Coming soon: [petitdragon], a platform game."),
        ("Wellness", "[mieuxchaquejour] (Better Every Day), a yoga and nutrition app to make a little progress every day."),
    ],
    faq=[
        ("Are Conte Games Studio games free?", "Yes. Every game and app from the studio is free to download."),
        ("Which phones can I play on?", "The games come out on iPhone and iPad through the App Store, and most of them are also on Android through Google Play. The buttons of each game lead straight to the right store."),
        ("Which game should I try first?", "For a brain teaser, try Sauve qui Flèche ! (Arrow Escape) or Les Tableaux Ensorcelés. For word lovers, Royaume des Mots Croisés. For quick two-player fun, COCOBOUM!."),
        ("Who makes these games?", "Conte Games Studio, an independent studio founded by Anthony in Saint-Chamond, France. You can write to contegamesstudio@gmail.com."),
    ],
)

T["de"] = dict(
    title="Conte Games Studio | Kostenlose Spiele für iPhone und Android: Rätsel, Puzzles, Kreuzworträtsel",
    desc="Kostenlose Handyspiele für iPhone und Android: Rätselspiele, Puzzles, Kreuzworträtsel, Denkspiele, Arcade-Spiele und eine Wellness-App von einem unabhängigen Studio aus Frankreich.",
    h2="Kostenlose Spiele für iPhone und Android",
    intro="Conte Games Studio ist ein unabhängiges Spielestudio aus Saint-Chamond in Frankreich. Es entwickelt kostenlose Handyspiele mit handgemalten Welten voller Drachen, Burgen und Magie: Denkspiele, Puzzlespiele, Wortspiele, Rätsel, Arcade-Spiele und eine Wellness-App. Jedes Spiel hat eine eigene Seite mit Video und Download-Links.",
    cats=[
        ("Denkspiele und Logikrätsel", "[sauvequifleche], bei dem jeder Pfeil das Spielfeld verlassen muss, [gnomedescavernes] mit seinen Weichen, [royaumedesrunes] mit fallenden Runenblöcken. Bald: [chateaudeslumieres], [rouagesenchantes] und [tailleurdenuages]."),
        ("Puzzlespiele", "[tableauxensorceles]: 50 Gemälde als klassisches Puzzle oder Schiebepuzzle, ohne Werbung."),
        ("Kreuzworträtsel und Rätselspiele", "[royaumedesmotscroises], um Kreuzworträtsel zu lösen und ein mittelalterliches Dorf zu bauen, [royaumedesenigmes], um Symbole zu kombinieren und Bosse zu besiegen."),
        ("Arcade- und Actionspiele", "[cocoboum], um im Duell Blasen platzen zu lassen, [caligulavsgladiators] für Kämpfe in der Arena, [serpentdesrunes], ein Schlangenspiel mit einem Drachen. Bald: [petitdragon], ein Jump-'n'-Run."),
        ("Wohlbefinden", "[mieuxchaquejour], eine App für Yoga und Ernährung, um jeden Tag ein bisschen besser zu werden."),
    ],
    faq=[
        ("Sind die Spiele von Conte Games Studio kostenlos?", "Ja. Alle Spiele und Apps des Studios kannst du kostenlos herunterladen."),
        ("Auf welchen Handys kann ich spielen?", "Die Spiele erscheinen im App Store für iPhone und iPad, die meisten auch bei Google Play für Android. Die Buttons jedes Spiels führen direkt zum richtigen Store."),
        ("Mit welchem Spiel soll ich anfangen?", "Zum Knobeln: Sauve qui Flèche ! oder Les Tableaux Ensorcelés. Für Wortfans: Royaume des Mots Croisés. Für schnellen Spaß zu zweit: COCOBOUM!."),
        ("Wer entwickelt diese Spiele?", "Conte Games Studio, ein unabhängiges Studio, gegründet von Anthony in Saint-Chamond, Frankreich. Schreib uns an contegamesstudio@gmail.com."),
    ],
)

ES_BASE = dict(
    title="Conte Games Studio | Juegos gratis para iPhone y Android: puzles, crucigramas, acertijos",
    desc="Juegos gratis para iPhone y Android: rompecabezas, puzles, crucigramas, acertijos, juegos arcade y una app de bienestar, creados por un estudio independiente francés con estilo pintado a mano.",
    h2="Juegos gratis para iPhone y Android",
    intro="Conte Games Studio es un estudio de videojuegos independiente de Saint-Chamond, Francia. Crea juegos para móviles gratis con mundos pintados a mano, llenos de dragones, castillos y magia: rompecabezas, puzles, juegos de palabras, acertijos, juegos arcade y una app de bienestar. Cada juego tiene su página con un vídeo y sus enlaces de descarga.",
    cats=[
        ("Rompecabezas y juegos de lógica", "[sauvequifleche], donde sacas cada flecha del tablero, [gnomedescavernes] y sus agujas de vía, [royaumedesrunes] y sus bloques de runas que caen. Muy pronto: [chateaudeslumieres], [rouagesenchantes] y [tailleurdenuages]."),
        ("Puzles", "[tableauxensorceles]: 50 cuadros para reconstruir como puzle clásico o deslizante, sin publicidad."),
        ("Crucigramas y acertijos", "[royaumedesmotscroises] para resolver crucigramas y construir una aldea medieval, [royaumedesenigmes] para combinar símbolos y vencer a los jefes."),
        ("Arcade y acción", "[cocoboum] para reventar burbujas en duelos, [caligulavsgladiators] para luchar en la arena, [serpentdesrunes], un juego de la serpiente con un dragón. Muy pronto: [petitdragon], un juego de plataformas."),
        ("Bienestar", "[mieuxchaquejour], una app de yoga y nutrición para mejorar un poco cada día."),
    ],
    faq=[
        ("¿Los juegos de Conte Games Studio son gratis?", "Sí. Todos los juegos y apps del estudio se descargan gratis."),
        ("¿En qué teléfonos se puede jugar?", "Los juegos salen en iPhone y iPad en el App Store, y la mayoría también en Android en Google Play. Los botones de cada juego llevan directamente a la tienda correcta."),
        ("¿Con qué juego empiezo?", "Para pensar, prueba Sauve qui Flèche ! o Les Tableaux Ensorcelés. Si te gustan las palabras, Royaume des Mots Croisés. Para jugar rápido entre dos, COCOBOUM!."),
        ("¿Quién crea estos juegos?", "Conte Games Studio, un estudio independiente fundado por Anthony en Saint-Chamond, Francia. Puedes escribir a contegamesstudio@gmail.com."),
    ],
)
T["es"] = ES_BASE
T["es-mx"] = dict(
    ES_BASE,
    title="Conte Games Studio | Juegos gratis para celular, iPhone y Android: rompecabezas y crucigramas",
    desc="Juegos gratis para celular, iPhone y Android: rompecabezas, crucigramas, acertijos, juegos arcade y una app de bienestar, creados por un estudio independiente francés con estilo pintado a mano.",
    h2="Juegos gratis para celular: iPhone y Android",
    intro="Conte Games Studio es un estudio de videojuegos independiente de Saint-Chamond, Francia. Crea juegos gratis para celular con mundos pintados a mano, llenos de dragones, castillos y magia: rompecabezas, juegos de palabras, acertijos, juegos arcade y una app de bienestar. Cada juego tiene su página con un video y sus enlaces de descarga.",
    faq=[
        ("¿Los juegos de Conte Games Studio son gratis?", "Sí. Todos los juegos y apps del estudio se descargan gratis."),
        ("¿En qué celulares se puede jugar?", "Los juegos salen en iPhone y iPad en el App Store, y la mayoría también en Android en Google Play. Los botones de cada juego llevan directo a la tienda correcta."),
        ("¿Con qué juego empiezo?", "Para pensar, prueba Sauve qui Flèche ! o Les Tableaux Ensorcelés. Si te gustan las palabras, Royaume des Mots Croisés. Para jugar rápido entre dos, COCOBOUM!."),
        ("¿Quién crea estos juegos?", "Conte Games Studio, un estudio independiente fundado por Anthony en Saint-Chamond, Francia. Puedes escribir a contegamesstudio@gmail.com."),
    ],
)

T["pt-br"] = dict(
    title="Conte Games Studio | Jogos grátis para celular, iPhone e Android: quebra-cabeças e palavras cruzadas",
    desc="Jogos grátis para celular, iPhone e Android: quebra-cabeças, palavras cruzadas, enigmas, jogos de arcade e um app de bem-estar, criados por um estúdio independente francês com estilo pintado à mão.",
    h2="Jogos grátis para celular: iPhone e Android",
    intro="A Conte Games Studio é um estúdio de jogos independente de Saint-Chamond, na França. Ela cria jogos grátis para celular com mundos pintados à mão, cheios de dragões, castelos e magia: jogos de raciocínio, quebra-cabeças, jogos de palavras, enigmas, jogos de arcade e um app de bem-estar. Cada jogo tem sua página com vídeo e links para baixar.",
    cats=[
        ("Jogos de raciocínio e lógica", "[sauvequifleche], em que você tira cada flecha do tabuleiro, [gnomedescavernes] e seus trilhos, [royaumedesrunes] e seus blocos de runas que caem. Em breve: [chateaudeslumieres], [rouagesenchantes] e [tailleurdenuages]."),
        ("Quebra-cabeças", "[tableauxensorceles]: 50 quadros para montar em quebra-cabeça clássico ou deslizante, sem anúncios."),
        ("Palavras cruzadas e enigmas", "[royaumedesmotscroises] para resolver palavras cruzadas e construir uma vila medieval, [royaumedesenigmes] para combinar símbolos e derrotar chefes."),
        ("Arcade e ação", "[cocoboum] para estourar bolhas em duelos, [caligulavsgladiators] para lutar na arena, [serpentdesrunes], um jogo da cobrinha com um dragão. Em breve: [petitdragon], um jogo de plataforma."),
        ("Bem-estar", "[mieuxchaquejour], um app de ioga e nutrição para melhorar um pouco a cada dia."),
    ],
    faq=[
        ("Os jogos da Conte Games Studio são grátis?", "Sim. Todos os jogos e apps do estúdio podem ser baixados de graça."),
        ("Em quais celulares dá para jogar?", "Os jogos saem para iPhone e iPad na App Store, e a maioria também para Android no Google Play. Os botões de cada jogo levam direto para a loja certa."),
        ("Com qual jogo devo começar?", "Para pensar, experimente Sauve qui Flèche ! ou Les Tableaux Ensorcelés. Para quem ama palavras, Royaume des Mots Croisés. Para jogar rápido a dois, COCOBOUM!."),
        ("Quem cria esses jogos?", "A Conte Games Studio, um estúdio independente fundado por Anthony em Saint-Chamond, na França. Escreva para contegamesstudio@gmail.com."),
    ],
)

T["it"] = dict(
    title="Conte Games Studio | Giochi gratis per iPhone e Android: rompicapo, puzzle, cruciverba",
    desc="Giochi gratis per iPhone e Android: rompicapo, puzzle, cruciverba, enigmi, giochi arcade e un'app di benessere, creati da uno studio indipendente francese con uno stile dipinto a mano.",
    h2="Giochi gratis per iPhone e Android",
    intro="Conte Games Studio è uno studio di videogiochi indipendente di Saint-Chamond, in Francia. Crea giochi per smartphone gratis con mondi dipinti a mano, pieni di draghi, castelli e magia: rompicapo, puzzle, giochi di parole, enigmi, giochi arcade e un'app di benessere. Ogni gioco ha la sua pagina con un video e i link per scaricarlo.",
    cats=[
        ("Rompicapo e giochi di logica", "[sauvequifleche], dove fai uscire ogni freccia dal tabellone, [gnomedescavernes] con i suoi scambi ferroviari, [royaumedesrunes] con i suoi blocchi di rune che cadono. In arrivo: [chateaudeslumieres], [rouagesenchantes] e [tailleurdenuages]."),
        ("Puzzle", "[tableauxensorceles]: 50 quadri da ricomporre come puzzle classico o scorrevole, senza pubblicità."),
        ("Cruciverba ed enigmi", "[royaumedesmotscroises] per risolvere cruciverba e costruire un villaggio medievale, [royaumedesenigmes] per abbinare simboli e sconfiggere i boss."),
        ("Arcade e azione", "[cocoboum] per far scoppiare bolle in sfide a due, [caligulavsgladiators] per combattere nell'arena, [serpentdesrunes], un gioco del serpente con un drago. In arrivo: [petitdragon], un platform."),
        ("Benessere", "[mieuxchaquejour], un'app di yoga e nutrizione per migliorare un po' ogni giorno."),
    ],
    faq=[
        ("I giochi di Conte Games Studio sono gratis?", "Sì. Tutti i giochi e le app dello studio si scaricano gratis."),
        ("Su quali telefoni si può giocare?", "I giochi escono su iPhone e iPad nell'App Store, e la maggior parte anche su Android in Google Play. I pulsanti di ogni gioco portano direttamente allo store giusto."),
        ("Da quale gioco iniziare?", "Per allenare la mente, prova Sauve qui Flèche ! o Les Tableaux Ensorcelés. Per chi ama le parole, Royaume des Mots Croisés. Per giocare veloce in due, COCOBOUM!."),
        ("Chi crea questi giochi?", "Conte Games Studio, uno studio indipendente fondato da Anthony a Saint-Chamond, in Francia. Puoi scrivere a contegamesstudio@gmail.com."),
    ],
)

T["tr"] = dict(
    title="Conte Games Studio | iPhone ve Android için ücretsiz oyunlar: bulmaca, zeka ve kelime oyunları",
    desc="iPhone ve Android için ücretsiz mobil oyunlar: bulmaca ve zeka oyunları, yapboz, çengel bulmaca, bilmeceler, arcade oyunları ve bir sağlık uygulaması. Fransa'dan bağımsız bir stüdyo.",
    h2="iPhone ve Android için ücretsiz oyunlar",
    intro="Conte Games Studio, Fransa'nın Saint-Chamond şehrinde bulunan bağımsız bir oyun stüdyosudur. Ejderhalar, şatolar ve büyüyle dolu, elle boyanmış dünyalara sahip ücretsiz mobil oyunlar yapar: zeka oyunları, yapbozlar, kelime oyunları, bilmeceler, arcade oyunları ve bir sağlık uygulaması. Her oyunun videolu ve indirme bağlantılı kendi sayfası vardır.",
    cats=[
        ("Bulmaca ve zeka oyunları", "Her oku tahtadan çıkardığın [sauvequifleche], makasları ayarladığın [gnomedescavernes], düşen rün bloklarıyla [royaumedesrunes]. Yakında: [chateaudeslumieres], [rouagesenchantes] ve [tailleurdenuages]."),
        ("Yapboz oyunları", "[tableauxensorceles]: klasik yapboz ya da kaydırmalı bulmaca olarak tamamlanacak 50 tablo, reklamsız."),
        ("Çengel bulmaca ve bilmeceler", "Bulmaca çözüp ortaçağ köyü kurduğun [royaumedesmotscroises], sembolleri eşleştirip boss'ları yendiğin [royaumedesenigmes]."),
        ("Arcade ve aksiyon oyunları", "Düelloda balon patlattığın [cocoboum], arenada savaştığın [caligulavsgladiators], ejderhalı bir yılan oyunu olan [serpentdesrunes]. Yakında: platform oyunu [petitdragon]."),
        ("Sağlık", "[mieuxchaquejour]: her gün biraz daha iyi olmak için yoga ve beslenme uygulaması."),
    ],
    faq=[
        ("Conte Games Studio oyunları ücretsiz mi?", "Evet. Stüdyonun tüm oyunları ve uygulamaları ücretsiz indirilir."),
        ("Hangi telefonlarda oynanabilir?", "Oyunlar App Store'da iPhone ve iPad için çıkar, çoğu Google Play'de Android için de vardır. Her oyunun düğmeleri doğrudan doğru mağazaya götürür."),
        ("Hangi oyunla başlamalıyım?", "Kafa yormak için Sauve qui Flèche ! ya da Les Tableaux Ensorcelés. Kelime sevenler için Royaume des Mots Croisés. İki kişilik hızlı eğlence için COCOBOUM!."),
        ("Bu oyunları kim yapıyor?", "Anthony'nin Fransa'nın Saint-Chamond şehrinde kurduğu bağımsız stüdyo Conte Games Studio. contegamesstudio@gmail.com adresine yazabilirsin."),
    ],
)

T["ru"] = dict(
    title="Conte Games Studio | Бесплатные игры для iPhone и Android: головоломки, пазлы, кроссворды",
    desc="Бесплатные мобильные игры для iPhone и Android: головоломки, пазлы, кроссворды, загадки, аркады и приложение для здоровья от независимой французской студии в рисованном стиле.",
    h2="Бесплатные игры для iPhone и Android",
    intro="Conte Games Studio — независимая игровая студия из города Сен-Шамон во Франции. Она создаёт бесплатные мобильные игры с нарисованными вручную мирами, полными драконов, замков и магии: головоломки, пазлы, игры со словами, загадки, аркады и приложение для здоровья. У каждой игры есть своя страница с видео и ссылками для скачивания.",
    cats=[
        ("Головоломки и логические игры", "[sauvequifleche], где нужно вывести каждую стрелку с поля, [gnomedescavernes] с железнодорожными стрелками, [royaumedesrunes] с падающими блоками рун. Скоро: [chateaudeslumieres], [rouagesenchantes] и [tailleurdenuages]."),
        ("Пазлы", "[tableauxensorceles]: 50 картин, которые нужно собрать как классический пазл или пятнашки, без рекламы."),
        ("Кроссворды и загадки", "[royaumedesmotscroises] — разгадывай кроссворды и строй средневековую деревню, [royaumedesenigmes] — сочетай символы и побеждай боссов."),
        ("Аркады и экшен", "[cocoboum] — лопай пузыри в дуэлях, [caligulavsgladiators] — сражайся на арене, [serpentdesrunes] — игра «змейка» с драконом. Скоро: [petitdragon], платформер."),
        ("Здоровье", "[mieuxchaquejour] — приложение с йогой и питанием, чтобы каждый день становиться немного лучше."),
    ],
    faq=[
        ("Игры Conte Games Studio бесплатные?", "Да. Все игры и приложения студии можно скачать бесплатно."),
        ("На каких телефонах можно играть?", "Игры выходят для iPhone и iPad в App Store, а большинство — и для Android в Google Play. Кнопки каждой игры ведут прямо в нужный магазин."),
        ("С какой игры начать?", "Чтобы поломать голову, попробуйте Sauve qui Flèche ! или Les Tableaux Ensorcelés. Любителям слов — Royaume des Mots Croisés. Для быстрой игры вдвоём — COCOBOUM!."),
        ("Кто делает эти игры?", "Conte Games Studio — независимая студия, которую основал Энтони в Сен-Шамоне, Франция. Пишите на contegamesstudio@gmail.com."),
    ],
)

T["ja"] = dict(
    title="Conte Games Studio | iPhone・Android向け無料ゲーム：パズル、脳トレ、クロスワード",
    desc="iPhone・Android向けの無料スマホゲーム：パズルゲーム、脳トレ、クロスワード、なぞなぞ、アーケードゲーム、健康アプリ。手描きの世界を作るフランスのインディースタジオ。",
    h2="iPhone・Android向けの無料ゲーム",
    intro="Conte Games Studioは、フランスのサン＝シャモンにあるインディーゲームスタジオです。ドラゴンやお城、魔法があふれる手描きの世界で、無料のスマホゲームを作っています。脳トレパズル、ジグソーパズル、言葉のゲーム、なぞなぞ、アーケードゲーム、そして健康アプリ。各ゲームには動画とダウンロードリンクのある専用ページがあります。",
    cats=[
        ("パズル・脳トレ", "盤面から矢印をすべて脱出させる[sauvequifleche]、線路のポイントを切り替える[gnomedescavernes]、落ちてくるルーンのブロックを並べる[royaumedesrunes]。近日公開：[chateaudeslumieres]、[rouagesenchantes]、[tailleurdenuages]。"),
        ("ジグソーパズル", "[tableauxensorceles]：50枚の絵をジグソーパズルやスライドパズルで完成させます。広告なし。"),
        ("クロスワード・なぞなぞ", "クロスワードを解いて中世の村を作る[royaumedesmotscroises]、記号を組み合わせてボスを倒す[royaumedesenigmes]。"),
        ("アーケード・アクション", "対戦でバブルを割る[cocoboum]、闘技場で戦う[caligulavsgladiators]、ドラゴンが主役のスネークゲーム[serpentdesrunes]。近日公開：アクションゲーム[petitdragon]。"),
        ("健康", "[mieuxchaquejour]：毎日少しずつ前進するための、ヨガと食事のアプリ。"),
    ],
    faq=[
        ("Conte Games Studioのゲームは無料ですか？", "はい。スタジオのゲームとアプリはすべて無料でダウンロードできます。"),
        ("どのスマホで遊べますか？", "ゲームはApp StoreでiPhone・iPad向けに配信され、ほとんどはGoogle PlayでAndroid向けにも配信されています。各ゲームのボタンから正しいストアに直接移動できます。"),
        ("最初にどのゲームを遊べばいいですか？", "頭を使いたいならSauve qui Flèche !（矢印脱出パズル）かLes Tableaux Ensorcelés。言葉が好きならRoyaume des Mots Croisés。二人でさっと遊ぶならCOCOBOUM!。"),
        ("このゲームは誰が作っていますか？", "フランスのサン＝シャモンでアンソニーが立ち上げたインディースタジオ、Conte Games Studioです。お問い合わせはcontegamesstudio@gmail.comまで。"),
    ],
)

T["ko"] = dict(
    title="Conte Games Studio | 아이폰·안드로이드 무료 게임: 퍼즐, 두뇌 게임, 십자말풀이",
    desc="아이폰과 안드로이드용 무료 모바일 게임: 퍼즐 게임, 두뇌 게임, 십자말풀이, 수수께끼, 아케이드 게임과 건강 앱. 손으로 그린 세계를 만드는 프랑스 인디 스튜디오.",
    h2="아이폰·안드로이드 무료 게임",
    intro="Conte Games Studio는 프랑스 생샤몽에 있는 인디 게임 스튜디오입니다. 드래곤과 성, 마법이 가득한 손그림 세계로 무료 모바일 게임을 만듭니다. 두뇌 퍼즐, 직소 퍼즐, 단어 게임, 수수께끼, 아케이드 게임, 그리고 건강 앱까지. 게임마다 영상과 다운로드 링크가 있는 전용 페이지가 있습니다.",
    cats=[
        ("퍼즐·두뇌 게임", "판에서 모든 화살표를 빼내는 [sauvequifleche], 선로 전환기를 맞추는 [gnomedescavernes], 떨어지는 룬 블록을 맞추는 [royaumedesrunes]. 출시 예정: [chateaudeslumieres], [rouagesenchantes], [tailleurdenuages]."),
        ("직소 퍼즐", "[tableauxensorceles]: 50개의 그림을 직소 퍼즐이나 슬라이딩 퍼즐로 완성하세요. 광고 없음."),
        ("십자말풀이·수수께끼", "십자말풀이를 풀며 중세 마을을 짓는 [royaumedesmotscroises], 기호를 조합해 보스를 물리치는 [royaumedesenigmes]."),
        ("아케이드·액션", "대결하며 거품을 터뜨리는 [cocoboum], 경기장에서 싸우는 [caligulavsgladiators], 드래곤이 주인공인 뱀 게임 [serpentdesrunes]. 출시 예정: 플랫폼 게임 [petitdragon]."),
        ("건강", "[mieuxchaquejour]: 매일 조금씩 나아지기 위한 요가와 영양 앱."),
    ],
    faq=[
        ("Conte Games Studio 게임은 무료인가요?", "네. 스튜디오의 모든 게임과 앱은 무료로 다운로드할 수 있습니다."),
        ("어떤 휴대폰에서 할 수 있나요?", "게임은 App Store에서 아이폰과 아이패드용으로 출시되며, 대부분 Google Play에서 안드로이드용으로도 제공됩니다. 각 게임의 버튼을 누르면 바로 맞는 스토어로 이동합니다."),
        ("어떤 게임부터 해볼까요?", "머리를 쓰고 싶다면 Sauve qui Flèche ! 또는 Les Tableaux Ensorcelés. 단어를 좋아한다면 Royaume des Mots Croisés. 둘이서 빠르게 즐기려면 COCOBOUM!."),
        ("누가 이 게임을 만드나요?", "프랑스 생샤몽에서 앤서니가 세운 인디 스튜디오 Conte Games Studio입니다. contegamesstudio@gmail.com으로 연락하세요."),
    ],
)

T["ar"] = dict(
    title="Conte Games Studio | ألعاب مجانية للآيفون والأندرويد: ألغاز، بازل، كلمات متقاطعة",
    desc="ألعاب جوال مجانية للآيفون والأندرويد: ألعاب ألغاز وذكاء، بازل، كلمات متقاطعة، أحاجي، ألعاب أركيد وتطبيق للصحة، من استوديو فرنسي مستقل بأسلوب مرسوم يدويًا.",
    h2="ألعاب مجانية للآيفون والأندرويد",
    intro="Conte Games Studio استوديو ألعاب مستقل في مدينة سان شامون بفرنسا. يصنع ألعاب جوال مجانية بعوالم مرسومة يدويًا مليئة بالتنانين والقلاع والسحر: ألعاب ذكاء، بازل، ألعاب كلمات، أحاجي، ألعاب أركيد وتطبيق للصحة. لكل لعبة صفحتها الخاصة مع فيديو وروابط التحميل.",
    cats=[
        ("ألعاب الألغاز والذكاء", "[sauvequifleche] لإخراج كل سهم من اللوحة، و[gnomedescavernes] وتحويلات السكك فيها، و[royaumedesrunes] وكتل الرونات المتساقطة. قريبًا: [chateaudeslumieres] و[rouagesenchantes] و[tailleurdenuages]."),
        ("ألعاب البازل", "[tableauxensorceles]: ‏50 لوحة لإعادة تركيبها كبازل كلاسيكي أو منزلق، بدون إعلانات."),
        ("الكلمات المتقاطعة والأحاجي", "[royaumedesmotscroises] لحل شبكات الكلمات المتقاطعة وبناء قرية من القرون الوسطى، و[royaumedesenigmes] لمطابقة الرموز وهزيمة الزعماء."),
        ("ألعاب الأركيد والأكشن", "[cocoboum] لتفجير الفقاعات في المبارزات، و[caligulavsgladiators] للقتال في الحلبة، و[serpentdesrunes] لعبة الثعبان مع تنين. قريبًا: [petitdragon]، لعبة منصات."),
        ("الصحة", "[mieuxchaquejour]: تطبيق لليوغا والتغذية للتحسن قليلًا كل يوم."),
    ],
    faq=[
        ("هل ألعاب Conte Games Studio مجانية؟", "نعم. جميع ألعاب الاستوديو وتطبيقاته تُحمَّل مجانًا."),
        ("على أي هواتف يمكن اللعب؟", "تصدر الألعاب على الآيفون والآيباد عبر App Store، ومعظمها متوفر أيضًا على الأندرويد عبر Google Play. أزرار كل لعبة توصلك مباشرة إلى المتجر المناسب."),
        ("بأي لعبة أبدأ؟", "لتشغيل عقلك جرّب Sauve qui Flèche ! أو Les Tableaux Ensorcelés. لمحبي الكلمات Royaume des Mots Croisés. وللعب سريع بين شخصين COCOBOUM!."),
        ("من يصنع هذه الألعاب؟", "Conte Games Studio، استوديو مستقل أسسه أنتوني في سان شامون بفرنسا. يمكنك الكتابة إلى contegamesstudio@gmail.com."),
    ],
)


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def links(s: str) -> str:
    return LINK.sub(lambda m: f'<a href="{m.group(1)}/">{esc(NAMES[m.group(1)])}</a>', esc(s))


def block(t: dict) -> str:
    parts = [f'{START}<section class="seo-game-guide home-guide page-width" aria-labelledby="guide-accueil">',
             f'<h2 id="guide-accueil">{esc(t["h2"])}</h2>', f'<p>{esc(t["intro"])}</p>']
    parts += [f"<p><strong>{esc(label)}</strong> : {links(body)}</p>" if t is T["fr"]
              else f"<p><strong>{esc(label)}</strong>{'：' if t is T['ja'] else ': '}{links(body)}</p>"
              for label, body in t["cats"]]
    parts += [f"<h3>{esc(q)}</h3><p>{esc(a)}</p>" for q, a in t["faq"]]
    parts.append(f"</section>{END}")
    html = "".join(parts)
    if t is T["ar"]:  # Right-to-left: isolate Latin names so "!" and "." stay in place
        latin = re.compile(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 .@'!-]*[A-Za-zÀ-ÿ0-9!]")
        html = "".join(part if part.startswith("<") else latin.sub(lambda m: f"<bdi>{m.group(0)}</bdi>", part)
                       for part in re.split(r"(<[^>]+>)", html))
    if t is T["fr"]:  # French typography: no line break before : ? !
        html = re.sub(r" ([:?!])", "\u00a0\\1", html)
    return html


def set_meta(html: str, t: dict) -> str:
    title, desc = esc(t["title"]), esc(t["desc"])
    html = re.sub(r"<title>[^<]*</title>", f"<title>{title}</title>", html, count=1)
    for key, value in (("name=\"description\"", desc), ("property=\"og:title\"", title),
                       ("property=\"og:description\"", desc), ("name=\"twitter:title\"", title),
                       ("name=\"twitter:description\"", desc)):
        html = re.sub(rf'(<meta {key} content=")[^"]*(")', lambda m: m.group(1) + value + m.group(2), html, count=1)
    return html


def main() -> None:
    for code, t in T.items():
        path = page_path(code, "")
        html = path.read_text(encoding="utf-8")
        html = BLOCK.sub("", html)
        if ANCHOR not in html:
            sys.exit(f"{code}: anchor {ANCHOR!r} not found")
        html = html.replace(ANCHOR, block(t) + ANCHOR, 1)
        html = add_faq(set_meta(html, t))
        path.write_text(html, encoding="utf-8")
    print(f"home guide written on {len(T)} languages")


if __name__ == "__main__":
    main()
