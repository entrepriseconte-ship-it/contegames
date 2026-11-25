/* Le Tailleur de Nuages - reglages des publicites (AdMob).
   Tant que "test" vaut true, ce sont les identifiants d'essai officiels de Google qui sont utilises.
   Avant toute sortie publique : mettre les VRAIS identifiants de l'appli "Le Tailleur de Nuages" pour iOS ET pour Android,
   puis passer test a false pour la plateforme concernee. */
window.TN = window.TN || {};
window.TN.PUBS = {
  android: { test: true, banniere: 'ca-app-pub-3940256099942544/9214589741', interstitiel: 'ca-app-pub-3940256099942544/1033173712', recompense: 'ca-app-pub-3940256099942544/5224354917' },
  ios: { test: true, banniere: 'ca-app-pub-3940256099942544/2435281174', interstitiel: 'ca-app-pub-3940256099942544/4411468910', recompense: 'ca-app-pub-3940256099942544/1712485313' },
  pasAvantVictoires: 10,     // aucun interstitiel avant 10 victoires
  unNiveauSur: 3,            // ensuite au maximum 1 niveau sur 3
  ecartMinutes: 3            // et au moins 3 minutes entre deux interstitiels
};
