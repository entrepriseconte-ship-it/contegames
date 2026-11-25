/* Le Tailleur de Nuages - textes du jeu. Chaque langue donne ses textes dans le meme ordre que la liste K. */
(function () {
  var TN = window.TN = window.TN || {};
  TN.TX = {}; TN.LANGS = [];
  var K = ['niveau', 'morceaux', 'coups', 'objPorte', 'objMorc', 'objCoups', 'valider', 'annuler', 'recommencer', 'indice',
    'tip1', 'tip2', 'tip3', 'tip4', 'tip5', 'tip6',
    'tGlisse', 'tTrop', 'tPlace', 'tCoupeIci', 'tRien', 'tChoisis',
    'gagne', 'gSuivant', 'gRejouer', 'gCarte', 'gDouble', 'gFin', 'rMorc', 'rCoups', 'rCoupsEt',
    'perdu', 'pLibre', 'pBloque', 'pCorriger', 'pErreurs', 'pPayer', 'pPieces', 'pPub', 'tuAs',
    'pause', 'reprendre', 'musique', 'effets',
    'iTitre', 'i1', 'i2', 'i3', 'i3pub', 'iCoupe', 'iPrends', 'iPose', 'iRetire', 'iValide', 'iAnnule',
    'pubTest', 'pubAttends', 'pubFermer', 'pubRecomp', 'pubInter', 'pubBan',
    'jouer', 'carte', 'collection', 'parametres', 'autres',
    'carteTitre', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'bientot', 'ferme', 'coffreIl', 'coffreT', 'ok',
    'cEtoiles', 'cNiveaux', 'cPieces', 'cApp', 'cPub', 'sNacre', 'sRose', 'sMenthe', 'sOr', 'choisi', 'prix',
    'langue', 'credits', 'confid', 'reinit', 'reinitQ', 'oui', 'non', 'credTxt', 'enCours',
    'ageQ', 'ageP', 'a1', 'a2', 'a3', 'jour', 'jourP', 'jourB', 'pObst'];
  TN.KEYS = K;
  TN.addLang = function (code, name, arr) {
    var o = {}; K.forEach(function (k, i) { if (arr[i] != null) o[k] = arr[i]; });
    TN.TX[code] = o; TN.LANGS.push([code, name]); if (arr.length !== K.length && window.console) console.warn('textes ' + code + ' : ' + arr.length + ' au lieu de ' + K.length);
  };
  TN.addLang('fr', 'Français', ['Niveau {0}', 'Morceaux : {0}/{1}', 'Coups : {0}', 'Atteindre la porte', '{0} morceaux max', '{0} coups max', 'Valider', 'Annuler', 'Recommencer', 'Indice',
    'Fais glisser le nuage entre les deux îles, puis appuie sur Valider.', 'Touche le nuage, puis le bouton rond de gauche pour le faire pivoter.', 'Chaque nuage doit toucher une île ou un autre nuage. Le tailleur monte une seule marche à la fois.', 'Ce nuage est mal tourné : touche-le, puis les ciseaux pour le découper le long des pointillés.', 'Tu peux marcher sur les rochers et y accrocher des nuages. Annuler reprend ton dernier coup.', 'Dans la forêt, on marche aussi sur les arbres. Découper n\'est pas toujours la bonne idée !',
    'Fais glisser le nuage vers le ciel', 'Tu ne peux poser que {0} morceaux', 'Pas assez de place pour pivoter ici', 'Touche d\'abord un nuage à pointillés sur le plateau', 'Rien à annuler', 'Touche d\'abord un nuage',
    'Bravo !', 'Niveau suivant', 'Rejouer', 'Carte', 'Doubler les pièces (pub)', 'Tu as terminé tous les niveaux disponibles. La suite arrive bientôt !', '2e étoile : {0} morceaux ou moins', '3e étoile : {0} coups ou moins', '3e étoile : {0} coups ou moins, avec l\'étoile filante',
    'Le chemin s\'arrête ici', 'Un nuage n\'était accroché à rien : il s\'est envolé. Chaque nuage doit toucher une île ou un autre nuage.', 'Le tailleur monte ou descend une seule marche à la fois, et il lui faut la place de passer.', 'Corriger mon chemin', 'Erreurs : {0}/3', 'Après 3 erreurs, recommencer coûte 100 pièces ou une publicité.', 'Recommencer (100 pièces)', 'Recommencer (pub)', 'Tu as {0} pièces',
    'Pause', 'Reprendre', 'Musique', 'Effets sonores',
    'Indices', 'Quel nuage ? ({0} pièces)', 'Où le poser ? ({0} pièces)', 'Solution complète ({0} pièces)', 'Solution complète (pub)', 'Découpe ce nuage avec les ciseaux', 'Utilise ce nuage', 'Pose le nuage ici', 'Retire ce nuage : il gêne', 'Ton chemin est prêt : appuie sur Valider', 'Ce nuage ne devait pas être découpé : appuie sur Annuler',
    'Publicité de test', 'Récompense dans {0} s', 'Fermer', 'Vidéo récompensée', 'Publicité entre deux niveaux', 'bannière',
    'JOUER', 'Carte', 'Collection', 'Paramètres', 'Découvrez nos autres jeux',
    'La carte du ciel', 'Prairie céleste', 'Forêt suspendue', 'Mer de nuages', 'Montagnes orageuses', 'Cité des vents', 'Palais solaire', 'Ce niveau arrive dans la prochaine mise à jour', 'Termine d\'abord le niveau {0}', 'Encore {0} étoiles pour ouvrir ce coffre', 'Coffre ouvert !', 'OK',
    'Étoiles', 'Niveaux', 'Pièces', 'Apparences des nuages', '+40 pièces (pub)', 'Nacre', 'Aurore', 'Menthe', 'Soleil', 'choisi', '{0} pièces',
    'Langue', 'Crédits', 'Confidentialité', 'Effacer ma progression', 'Effacer toute ta progression ?', 'Oui', 'Non', 'Un jeu de Conte Games Studio. Musiques de Kevin MacLeod :', 'En ce moment : {0}',
    'Quel âge as-tu ?', 'Cela nous aide à afficher des publicités adaptées.', 'Moins de 13 ans', '13 à 15 ans', '16 ans ou plus', 'Cadeau du jour', 'Reviens chaque jour pour un cadeau.', 'Prendre {0} pièces', 'Le tailleur ne peut pas marcher sur les rochers ni sur les arbres. Pose un nuage par-dessus pour passer.']);
  TN.addLang('en', 'English', ['Level {0}', 'Pieces: {0}/{1}', 'Moves: {0}', 'Reach the gate', '{0} pieces max', '{0} moves max', 'Go', 'Undo', 'Restart', 'Hint',
    'Drag the cloud between the two islands, then tap Go.', 'Tap the cloud, then the round button on the left to rotate it.', 'Each cloud must touch an island or another cloud. The tailor climbs only one step at a time.', 'This cloud faces the wrong way: tap it, then the scissors to cut along the dotted line.', 'You can walk on rocks and attach clouds to them. Undo takes back your last move.', 'In the forest, you can walk on the trees too. Cutting is not always the right idea!',
    'Drag the cloud up into the sky', 'You can only place {0} pieces', 'Not enough room to rotate here', 'First tap a dotted cloud in the tray', 'Nothing to undo', 'Tap a cloud first',
    'Well done!', 'Next level', 'Replay', 'Map', 'Double coins (ad)', 'You finished every available level. More coming soon!', '2nd star: {0} pieces or fewer', '3rd star: {0} moves or fewer', '3rd star: {0} moves or fewer, with the shooting star',
    'The path stops here', 'A cloud was not attached to anything: it flew away. Each cloud must touch an island or another cloud.', 'The tailor goes up or down only one step at a time, and needs room to pass.', 'Fix my path', 'Mistakes: {0}/3', 'After 3 mistakes, restarting costs 100 coins or one ad.', 'Restart (100 coins)', 'Restart (ad)', 'You have {0} coins',
    'Pause', 'Resume', 'Music', 'Sound effects',
    'Hints', 'Which cloud? ({0} coins)', 'Where to put it? ({0} coins)', 'Full solution ({0} coins)', 'Full solution (ad)', 'Cut this cloud with the scissors', 'Use this cloud', 'Put the cloud here', 'Remove this cloud: it is in the way', 'Your path is ready: tap Go', 'This cloud should not have been cut: tap Undo',
    'Test ad', 'Reward in {0} s', 'Close', 'Rewarded video', 'Ad between two levels', 'banner',
    'PLAY', 'Map', 'Collection', 'Settings', 'Discover our other games',
    'The Sky Map', 'Sky Meadow', 'Hanging Forest', 'Sea of Clouds', 'Stormy Mountains', 'City of Winds', 'Sun Palace', 'This level arrives in the next update', 'Finish level {0} first', '{0} more stars to open this chest', 'Chest opened!', 'OK',
    'Stars', 'Levels', 'Coins', 'Cloud looks', '+40 coins (ad)', 'Pearl', 'Dawn', 'Mint', 'Sun', 'selected', '{0} coins',
    'Language', 'Credits', 'Privacy', 'Erase my progress', 'Erase all your progress?', 'Yes', 'No', 'A game by Conte Games Studio. Music by Kevin MacLeod:', 'Now playing: {0}',
    'How old are you?', 'This helps us show suitable ads.', 'Under 13', '13 to 15', '16 or older', 'Daily gift', 'Come back every day for a gift.', 'Take {0} coins', 'The tailor cannot walk on rocks or trees. Put a cloud over them to get across.']);
})();
