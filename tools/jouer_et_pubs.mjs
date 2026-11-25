// Page /jouer/ (jeux dans le navigateur), bouton « Jouer » de l'accueil, code AdSense et ads.txt.
// A relancer après toute reconstruction des pages : node tools/jouer_et_pubs.mjs  (ne double jamais rien)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const R = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8'), ecrire = (f, s) => fs.writeFileSync(path.join(R, f), s);
const PUB = 'ca-pub-2279402263917578';
const TAG = `<meta name="google-adsense-account" content="${PUB}"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB}" crossorigin="anonymous"></script>`;

// ios : numéro App Store (null = pas encore en ligne) ; play : identifiant Google Play (null = pas encore en ligne)
const JEUX = [
  { d: 'rouagesenchantes', t: 'Les Rouages Enchantés', img: 'rouages.jpg', w: 220, h: 391, ios: null, play: null,
    fr: "Casse-tête d'engrenages dans un royaume médiéval : posez chaque rouage sur le bon axe pour relier le moteur à la porte et remettre le royaume en marche.",
    r: "cliquez sur un rouage en bas de l'écran puis sur un axe, ou faites-le glisser. Moins vous jouez de coups, plus vous gagnez d'étoiles.",
    en: 'A gear puzzle in a medieval kingdom: place each cog on the right axle to link the engine to the door and bring the kingdom back to life. Click or drag a cog onto an axle.' },
  { d: 'tailleurdenuages', t: 'Le Tailleur de Nuages', img: 'tailleur.jpg', w: 220, h: 391, ios: null, play: null,
    fr: 'Découpez, tournez et posez des nuages pour relier les îles flottantes. 240 niveaux à travers douze régions du ciel.',
    r: 'faites glisser un nuage entre les îles, tournez-le ou découpez-le avec les ciseaux, puis appuyez sur Valider.',
    en: 'Cut, rotate and place clouds to bridge floating islands: 240 puzzle levels across twelve regions of the sky. Drag a cloud into place, then confirm.' },
  { d: 'gnomedescavernes', t: 'Le Gnome des Cavernes Enchantées', img: 'gnome.jpg', w: 220, h: 220, ios: '6834289564', play: null,
    fr: 'Réglez les aiguillages pour que chaque chariot de mine atteigne la sortie de sa couleur. 90 niveaux dans six cavernes.',
    r: 'cliquez un aiguillage pour changer la voie, puis appuyez sur « Lancer ». Une collision ou une mauvaise sortie, et on recommence.',
    en: 'A rail puzzle: set the switches so every mine cart reaches the exit of its colour. 90 levels in six crystal caverns.' },
  { d: 'chateaudeslumieres', t: 'Le Château des Lumières', img: 'chateau.jpg', w: 220, h: 220, ios: null, play: null,
    fr: 'Le château est plongé dans le noir : rendez-lui sa lumière. 150 niveaux avec miroirs, couleurs à mélanger, prismes et salles qui tournent.',
    r: 'cliquez un miroir pour le faire pivoter et envoyez les rayons sur tous les cristaux.',
    en: 'The castle has gone dark. Turn mirrors and rotate rooms to guide beams of light to the crystals: 150 puzzle levels in six painted worlds.' },
  { d: 'serpentdesrunes', t: 'Serpent des Runes', img: 'serpent.jpg', w: 220, h: 220, ios: '6833437318', play: null,
    fr: 'Le jeu du serpent dans un royaume nordique enchanté : 120 niveaux, des runes à dévorer, des gardiens et des runes magiques.',
    r: 'glissez à la souris ou au doigt (ou utilisez les flèches du clavier). Évitez les murs et la queue du serpent.',
    en: 'The classic snake game in an enchanted Nordic realm: 120 levels, runes to devour, guardians and magic powers. Swipe or use the arrow keys.' },
  { d: 'royaumedesrunes', t: 'Royaume des Runes', img: 'runes.jpg', w: 220, h: 220, ios: '6833400206', play: null,
    fr: 'Un casse-tête de blocs qui tombent dans un royaume de conte : réunissez les runes de même couleur pour réveiller le royaume.',
    r: 'glissez pour déplacer le bloc, touchez pour le tourner, glissez vers le bas pour le lâcher. Réunissez 4 runes de la même couleur.',
    en: 'A falling-block puzzle in a fairy-tale kingdom: group four runes of the same colour to awaken the realm. Drag to move, tap to rotate, swipe down to drop.' },
];

const boutons = j => {
  const b = [];
  if (j.ios) b.push(`<a class="store" href="https://apps.apple.com/app/id${j.ios}?pt=129524141&amp;ct=site-jouer&amp;mt=8" aria-label="${j.t} - App Store">App Store (iPhone, iPad)</a>`);
  if (j.play) b.push(`<a class="store" href="https://play.google.com/store/apps/details?id=${j.play}&amp;referrer=utm_source%3Dcontegames.com%26utm_medium%3Dsite%26utm_campaign%3Dsite-jouer" aria-label="${j.t} - Google Play">Google Play (Android)</a>`);
  return b.length ? `<p class="stores">Retrouvez « ${j.t} » en application : ${b.join(' ')}</p>` : `<p class="stores">Application « ${j.t} » pas encore disponible sur les stores.</p>`;
};
const carte = j => `<article id="${j.d}">
<img src="${j.img}" alt="${j.t}" width="${j.w}" height="${j.h}" loading="lazy">
<div>
<h2>${j.t}</h2>
<p>${j.fr}</p>
<p><strong>Comment jouer :</strong> ${j.r}</p>
<p lang="en"><strong>In English:</strong> ${j.en}</p>
<p><a class="jouer" href="${j.d}/">Jouer dans le navigateur · Play</a></p>
${boutons(j)}
<p><a href="../${j.d}/">Présentation du jeu</a></p>
</div>
</article>`;

ecrire('jouer/index.html', `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jeux gratuits dans le navigateur · Free browser puzzle games · Conte Games Studio</title>
<meta name="description" content="${JEUX.length} casse-têtes gratuits à jouer dans le navigateur, sans rien installer. Free puzzle games to play online on computer or phone, by Conte Games Studio.">
<link rel="canonical" href="https://contegames.com/jouer/">
<link rel="icon" href="/favicon.ico" sizes="48x48">
${TAG}
<style>
:root{--fond:#0d1230;--texte:#f6efdc;--or:#e8b04a;--carte:#171e45}
body{margin:0;background:var(--fond);color:var(--texte);font:17px/1.6 Georgia,serif}
main{max-width:900px;margin:0 auto;padding:24px 16px}
h1,h2{color:var(--or);line-height:1.25}
article{display:flex;flex-wrap:wrap;gap:20px;background:var(--carte);border:1px solid var(--or);border-radius:14px;padding:18px;margin:22px 0}
article img{width:220px;max-width:100%;height:auto;border-radius:10px;align-self:flex-start;margin:0 auto}
article div{flex:1;min-width:260px}
.jouer{display:inline-block;background:var(--or);color:#231503;font-weight:bold;padding:12px 28px;border-radius:30px;text-decoration:none}
.store{display:inline-block;margin:6px 8px 0 0;padding:8px 18px;border:1px solid var(--or);border-radius:30px;background:#05060f;text-decoration:none;font-weight:bold}
a{color:var(--or)}
</style>
</head>
<body>
<main>
<h1>Jouez gratuitement dans votre navigateur</h1>
<p>${JEUX.length} casse-têtes de Conte Games Studio, sans rien installer, sur ordinateur (à la souris) ou sur téléphone. Votre progression reste sur votre appareil. Les jeux les plus lourds peuvent mettre une minute à charger la première fois.</p>
<p lang="en">Free puzzle games by Conte Games Studio, playable right in your browser on computer or phone. Nothing to install.</p>
${JEUX.map(carte).join('\n')}
<p><a href="../">Retour à l’accueil de Conte Games Studio</a> · <a href="../mentions-legales.html#publicite">Publicité et confidentialité</a></p>
</main>
<script src="/analytics.js?v=4" defer></script>
</body>
</html>
`);

// bouton de l'accueil (français et anglais)
for (const [f, href, texte] of [['index.html', 'jouer/', '🎮 Jouer dans le navigateur'], ['en/index.html', '../jouer/', '🎮 Play in your browser']]) {
  let s = lire(f);
  if (s.includes('hero-play')) continue;
  const i = s.indexOf('<div class="hero-featured">'), j = i < 0 ? -1 : s.indexOf('</div>', i);
  if (j < 0 || s.slice(i + 5, j).includes('<div')) throw new Error('accueil non reconnu : ' + f);
  s = s.slice(0, j) + `<a class="button hero-play" href="${href}">${texte}</a>` + s.slice(j);
  ecrire(f, s);
}

// mention publicité
let m = lire('mentions-legales.html');
if (!m.includes('id="publicite"')) {
  const bloc = `<h2 id="publicite">Publicité et cookies</h2>
          <p>Certaines pages de ce site peuvent afficher des publicités fournies par Google AdSense (Google Ireland Limited). Google et ses partenaires peuvent utiliser des cookies ou des identifiants pour diffuser et mesurer les annonces, y compris des annonces personnalisées selon vos visites. En Europe, votre choix vous est demandé avant ces usages. Vous pouvez régler la personnalisation sur <a href="https://adssettings.google.com">adssettings.google.com</a> et lire les <a href="https://policies.google.com/technologies/partner-sites">règles de Google sur les sites partenaires</a>.</p>
          <h2 id="confidentialite">`;
  if (!m.includes('<h2 id="confidentialite">')) throw new Error('mentions légales non reconnues');
  ecrire('mentions-legales.html', m.replace('<h2 id="confidentialite">', bloc));
}

// code AdSense : accueil, page jouer, fiches des jeux jouables (jamais dans l'écran de jeu)
const pages = ['index.html', 'en/index.html', ...JEUX.flatMap(j => [`${j.d}/index.html`, `en/${j.d}/index.html`])];
let n = 0;
for (const f of pages) {
  if (!fs.existsSync(path.join(R, f))) continue;
  const s = lire(f);
  if (s.includes('google-adsense-account') || !s.includes('</head>')) continue;
  ecrire(f, s.replace('</head>', TAG + '</head>')); n++;
}
ecrire('ads.txt', 'google.com, pub-2279402263917578, DIRECT, f08c47fec0942fa0\n');

// plan du site
let sm = lire('sitemap.xml');
const jour = new Date().toISOString().slice(0, 10);
if (!sm.includes('<loc>https://contegames.com/jouer/</loc>')) ecrire('sitemap.xml', sm.replace('</urlset>', `  <url><loc>https://contegames.com/jouer/</loc><lastmod>${jour}</lastmod><priority>0.9</priority></url>\n</urlset>`));
console.log('jeux:', JEUX.length, '| pages avec AdSense ajoutées:', n);
