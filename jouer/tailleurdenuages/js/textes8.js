/* Le Tailleur de Nuages - 24/11/2026 : « Découvrez nos autres jeux » devient « Découvrez nos autres applications »
   dans les 26 langues (directive du chef, demande d'Anthony : le site contegames.com montre aussi des applis qui ne sont pas des jeux). */
(function () {
  var TN = window.TN, A = {
    fr: 'Découvrez nos autres applications', en: 'Discover our other apps', es: 'Nuestras otras aplicaciones',
    de: 'Unsere anderen Apps', it: 'Le nostre altre app', 'pt-BR': 'Nossos outros aplicativos', nl: 'Onze andere apps',
    pl: 'Nasze inne aplikacje', ro: 'Celelalte aplicații ale noastre', sv: 'Våra andra appar', cs: 'Naše další aplikace',
    tr: 'Diğer uygulamalarımız', ru: 'Другие наши приложения', uk: 'Інші наші застосунки', id: 'Aplikasi kami lainnya',
    vi: 'Ứng dụng khác của chúng tôi', th: 'แอปอื่นของเรา', ja: 'ほかのアプリ', ko: '다른 앱 보기', zh: '我们的其他应用',
    'zh-Hant': '我們的其他應用程式', da: 'Opdag vores andre apps', nb: 'Oppdag de andre appene våre', fi: 'Tutustu muihin sovelluksiimme',
    hu: 'Fedezd fel többi alkalmazásunkat', el: 'Ανακάλυψε τις άλλες εφαρμογές μας'
  };
  for (var c in A) if (TN.TX[c]) TN.TX[c].autres = A[c];
})();
