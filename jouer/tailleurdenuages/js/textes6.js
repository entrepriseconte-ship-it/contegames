/* Le Tailleur de Nuages - noms des 6 nouvelles regions (m7 a m12) dans les 21 langues. */
(function () {
  var TN = window.TN, N = {
    fr: ['Banquise des aurores', 'Jungle émeraude', 'Récif de corail', 'Dunes d\'or', 'Marais des lucioles', 'Royaume des étoiles'],
    en: ['Aurora Ice Fields', 'Emerald Jungle', 'Coral Reef', 'Golden Dunes', 'Firefly Marsh', 'Kingdom of Stars'],
    es: ['Banquisa de auroras', 'Jungla esmeralda', 'Arrecife de coral', 'Dunas de oro', 'Pantano de luciérnagas', 'Reino de las estrellas'],
    de: ['Polarlicht-Eisfeld', 'Smaragddschungel', 'Korallenriff', 'Goldene Dünen', 'Glühwürmchen-Sumpf', 'Reich der Sterne'],
    it: ['Banchisa delle aurore', 'Giungla di smeraldo', 'Barriera corallina', 'Dune d\'oro', 'Palude delle lucciole', 'Regno delle stelle'],
    'pt-BR': ['Banquisa das auroras', 'Selva esmeralda', 'Recife de coral', 'Dunas de ouro', 'Pântano dos vaga-lumes', 'Reino das estrelas'],
    nl: ['IJsveld van het noorderlicht', 'Smaragdjungle', 'Koraalrif', 'Gouden duinen', 'Vuurvliegjesmoeras', 'Sterrenrijk'],
    pl: ['Lodowe pole zórz', 'Szmaragdowa dżungla', 'Rafa koralowa', 'Złote wydmy', 'Bagno świetlików', 'Królestwo gwiazd'],
    ro: ['Banchiza aurorelor', 'Jungla de smarald', 'Reciful de corali', 'Dunele de aur', 'Mlaștina licuricilor', 'Regatul stelelor'],
    sv: ['Norrskenets isfält', 'Smaragddjungeln', 'Korallrevet', 'De gyllene dynerna', 'Eldflugornas träsk', 'Stjärnornas rike'],
    cs: ['Ledové pole polárních září', 'Smaragdová džungle', 'Korálový útes', 'Zlaté duny', 'Močál světlušek', 'Království hvězd'],
    tr: ['Kutup ışıkları buzulu', 'Zümrüt orman', 'Mercan resifi', 'Altın kumullar', 'Ateş böceği bataklığı', 'Yıldızlar krallığı'],
    ru: ['Льды северного сияния', 'Изумрудные джунгли', 'Коралловый риф', 'Золотые дюны', 'Болото светлячков', 'Королевство звёзд'],
    uk: ['Крига північного сяйва', 'Смарагдові джунглі', 'Кораловий риф', 'Золоті дюни', 'Болото світлячків', 'Королівство зірок'],
    id: ['Padang es aurora', 'Rimba zamrud', 'Terumbu karang', 'Bukit pasir emas', 'Rawa kunang-kunang', 'Kerajaan bintang'],
    vi: ['Băng nguyên cực quang', 'Rừng ngọc lục bảo', 'Rạn san hô', 'Cồn cát vàng', 'Đầm đom đóm', 'Vương quốc các vì sao'],
    th: ['ทุ่งน้ำแข็งแสงเหนือ', 'ป่ามรกต', 'แนวปะการัง', 'เนินทรายทองคำ', 'บึงหิ่งห้อย', 'อาณาจักรแห่งดวงดาว'],
    ja: ['オーロラの氷原', 'エメラルドのジャングル', 'サンゴ礁', '黄金の砂丘', 'ホタルの沼', '星の王国'],
    ko: ['오로라 빙원', '에메랄드 정글', '산호초', '황금 모래언덕', '반딧불이 늪', '별의 왕국'],
    zh: ['极光冰原', '翡翠丛林', '珊瑚礁', '黄金沙丘', '萤火虫沼泽', '星辰王国'],
    'zh-Hant': ['極光冰原', '翡翠叢林', '珊瑚礁', '黃金沙丘', '螢火蟲沼澤', '星辰王國']
  };
  /* message quand aucune video recompensee n'est disponible (appli iPhone / Android) */
  var P = { fr: 'Pas de vidéo disponible pour le moment. Réessaie plus tard.', en: 'No video available right now. Try again later.', es: 'No hay vídeo disponible ahora. Inténtalo más tarde.',
    de: 'Gerade kein Video verfügbar. Versuch es später noch einmal.', it: 'Nessun video disponibile al momento. Riprova più tardi.', 'pt-BR': 'Nenhum vídeo disponível agora. Tente mais tarde.',
    nl: 'Nu geen video beschikbaar. Probeer het later opnieuw.', pl: 'Brak dostępnego filmu. Spróbuj później.', ro: 'Niciun videoclip disponibil acum. Încearcă mai târziu.',
    sv: 'Ingen video tillgänglig just nu. Försök igen senare.', cs: 'Video teď není k dispozici. Zkus to později.', tr: 'Şu anda video yok. Daha sonra tekrar dene.',
    ru: 'Сейчас нет доступного видео. Попробуй позже.', uk: 'Зараз немає доступного відео. Спробуй пізніше.', id: 'Belum ada video saat ini. Coba lagi nanti.',
    vi: 'Hiện chưa có video. Hãy thử lại sau.', th: 'ตอนนี้ยังไม่มีวิดีโอ ลองใหม่ภายหลัง', ja: '今は動画がありません。あとでもう一度お試しください。', ko: '지금은 볼 수 있는 동영상이 없어요. 나중에 다시 시도하세요.',
    zh: '暂时没有可用的视频，请稍后再试。', 'zh-Hant': '暫時沒有可用的影片，請稍後再試。' };
  for (var c2 in P) if (TN.TX[c2]) TN.TX[c2].pubNon = P[c2];
  TN.KEYS.push('pubNon');
  var keys = ['m7', 'm8', 'm9', 'm10', 'm11', 'm12'];
  for (var c in N) if (TN.TX[c]) keys.forEach(function (k, i) { TN.TX[c][k] = N[c][i]; });
  keys.forEach(function (k) { TN.KEYS.push(k); });
})();
