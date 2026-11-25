/* Musiques du jeu : fichier, titre, volume moyen (dB), auteur.
   Toutes faites pour ce jeu avec Suno (compte Premier de Conte Games Studio, droits commerciaux).
   20/11/2026, demande d'Anthony : l'accueil a sa musique, chaque monde a SA musique sur sa carte,
   et les niveaux tirent au hasard parmi les musiques de niveau (jamais deux fois de suite la meme).
   Les anciennes musiques de Kevin MacLeod (communes a d'autres jeux du studio) sont gardees en reserve plus bas. */
window.TN_PISTES = [
  ["tailleur_01_accueil.mp3", "Au-dessus des nuages", -18.2, "Conte Games Studio"],
  ["tailleur_02_prairie.mp3", "Prairie céleste", -17.8, "Conte Games Studio"],
  ["tailleur_03_foret.mp3", "Forêt suspendue", -18.5, "Conte Games Studio"],
  ["tailleur_04_mer_de_nuages.mp3", "Mer de nuages", -18.2, "Conte Games Studio"],
  ["tailleur_05_montagnes.mp3", "Montagnes orageuses", -18.8, "Conte Games Studio"],
  ["tailleur_06_banquise.mp3", "Banquise des aurores", -18.1, "Conte Games Studio"],
  ["tailleur_07_dunes_recif.mp3", "Dunes et récif", -18.2, "Conte Games Studio"],
  ["tailleur_08_etoiles.mp3", "Royaume des étoiles", -18.3, "Conte Games Studio"],
  /* musiques de niveau (au hasard) */
  ["tailleur_niveau_1_brise.mp3", "La brise du tailleur", -18.4, "Conte Games Studio"],
  /* 24/11/2026 : 11 musiques de niveau faites avec Google Gemini (Lyria), sans voix (controle Whisper), volume ramene au niveau des autres */
  ["tailleur_niveau_02_atelier_celeste.mp3", "L'atelier céleste", -18.8, "Google Gemini (Lyria)"],
  ["tailleur_niveau_03_cerf_volant.mp3", "Le cerf-volant du tailleur", -20.6, "Google Gemini (Lyria)"],
  ["tailleur_niveau_04_pluie_etoiles.mp3", "Pluie d'étoiles", -18.9, "Google Gemini (Lyria)"],
  ["tailleur_niveau_05_ciseaux_argent.mp3", "Les ciseaux d'argent", -19.0, "Google Gemini (Lyria)"],
  ["tailleur_niveau_06_pont_arc_en_ciel.mp3", "Le pont arc-en-ciel", -19.2, "Google Gemini (Lyria)"],
  ["tailleur_niveau_07_iles_flottantes.mp3", "Les îles flottantes", -19.0, "Google Gemini (Lyria)"],
  ["tailleur_niveau_08_fil_de_lune.mp3", "Le fil de lune", -19.5, "Google Gemini (Lyria)"],
  ["tailleur_niveau_09_bulles_de_nuage.mp3", "Bulles de nuage", -18.7, "Google Gemini (Lyria)"],
  ["tailleur_niveau_10_tour_des_vents.mp3", "La tour des vents", -20.0, "Google Gemini (Lyria)"],
  ["tailleur_niveau_11_aurore_rose.mp3", "Aurore rose", -19.6, "Google Gemini (Lyria)"],
  ["tailleur_niveau_12_bateau_nuage.mp3", "Le bateau-nuage", -19.8, "Google Gemini (Lyria)"]
  /*NIVEAUX*/];

/* Quelle musique joue ou. Les 4 mondes sans musique a eux prennent celle du monde le plus proche (choix d'Anthony du 19/11). */
window.TN_SCENES = {
  accueil: ["tailleur_01_accueil.mp3"],
  /* index = numero du monde (1 a 12) */
  monde: [null,
    "tailleur_02_prairie.mp3",        /* 1  Prairie celeste */
    "tailleur_03_foret.mp3",          /* 2  Foret suspendue */
    "tailleur_04_mer_de_nuages.mp3",  /* 3  Mer de nuages */
    "tailleur_05_montagnes.mp3",      /* 4  Montagnes orageuses */
    "tailleur_05_montagnes.mp3",      /* 5  Cite des vents (partage montagnes) */
    "tailleur_08_etoiles.mp3",        /* 6  Palais solaire (partage etoiles) */
    "tailleur_06_banquise.mp3",       /* 7  Banquise des aurores */
    "tailleur_03_foret.mp3",          /* 8  Jungle emeraude (partage foret) */
    "tailleur_07_dunes_recif.mp3",    /* 9  Recif de corail */
    "tailleur_07_dunes_recif.mp3",    /* 10 Dunes d'or */
    "tailleur_03_foret.mp3",          /* 11 Marais des lucioles (partage foret) */
    "tailleur_08_etoiles.mp3"],       /* 12 Royaume des etoiles */
  /* 12 musiques de niveau, tirees au hasard (jamais deux fois de suite la meme) */
  niveau: ["tailleur_niveau_1_brise.mp3", "tailleur_niveau_02_atelier_celeste.mp3", "tailleur_niveau_03_cerf_volant.mp3",
    "tailleur_niveau_04_pluie_etoiles.mp3", "tailleur_niveau_05_ciseaux_argent.mp3", "tailleur_niveau_06_pont_arc_en_ciel.mp3",
    "tailleur_niveau_07_iles_flottantes.mp3", "tailleur_niveau_08_fil_de_lune.mp3", "tailleur_niveau_09_bulles_de_nuage.mp3",
    "tailleur_niveau_10_tour_des_vents.mp3", "tailleur_niveau_11_aurore_rose.mp3", "tailleur_niveau_12_bateau_nuage.mp3" /*LISTE_NIVEAUX*/]
};

/* RESERVE (non utilisees, musiques de Kevin MacLeod, incompetech.com, CC BY 4.0) :
window.TN_PISTES_RESERVE = [["achaidh-cheide.mp3","Achaidh Cheide",-18.8],
  ["air-prelude.mp3","Air Prelude",-31.3],
  ["alchemists-tower.mp3","Alchemists Tower",-20.6],
  ["arcadia.mp3","Arcadia",-21.4],
  ["at-rest.mp3","At Rest",-28.4],
  ["atlantean-twilight.mp3","Atlantean Twilight",-30.8],
  ["autumn-day.mp3","Autumn Day",-15.3],
  ["avec-soin.mp3","Avec Soin",-21.4],
  ["bathed-in-the-light.mp3","Bathed in the Light",-17.7],
  ["calmant.mp3","Calmant",-16.9],
  ["cattails.mp3","Cattails",-14.2],
  ["celtic-impulse.mp3","Celtic Impulse",-18.8],
  ["clear-air.mp3","Clear Air",-20.2],
  ["clear-waters.mp3","Clear Waters",-30.4],
  ["court-of-the-queen.mp3","Court of the Queen",-18],
  ["deliberate-thought.mp3","Deliberate Thought",-20.3],
  ["dreamy-flashback.mp3","Dreamy Flashback",-15.5],
  ["enchanted-valley.mp3","Enchanted Valley",-19.9],
  ["errigal.mp3","Errigal",-19.4],
  ["fairytale-waltz.mp3","Fairytale Waltz",-34.9],
  ["fiddles-mcginty.mp3","Fiddles McGinty",-12.2],
  ["folk-round.mp3","Folk Round",-22.2],
  ["frost-waltz.mp3","Frost Waltz",-18.1],
  ["galway.mp3","Galway",-16.1],
  ["industrious-ferret.mp3","Industrious Ferret",-18.9],
  ["lord-of-the-land.mp3","Lord of the Land",-24.5],
  ["midnight-tale.mp3","Midnight Tale",-21.6],
  ["moonlight-hall.mp3","Moonlight Hall",-18.3],
  ["morning.mp3","Morning",-20.2],
  ["myst-on-the-moor.mp3","Myst on the Moor",-18.9],
  ["teller-of-the-tales.mp3","Teller of the Tales",-26.5],
  ["the-forest-and-the-trees.mp3","The Forest and the Trees",-20.5],
  ["the-other-side-of-the-door.mp3","The Other Side of the Door",-27],
  ["village-consort.mp3","Village Consort",-12.1]];
*/
