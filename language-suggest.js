/* Suggestion de langue/région pour contegames.com.
   - Aucune redirection automatique : l'utilisateur garde toujours le contrôle.
   - Détection locale via les préférences de langue du navigateur.
   - Les 30 URL linguistiques existantes restent inchangées et accessibles aux moteurs. */
(() => {
  'use strict';

  const STORAGE_LANG = 'contegames_preferred_lang';
  const STORAGE_DISMISS = 'contegames_lang_suggestion_dismissed_at';
  const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

  const supported = new Set([
    'fr','en','es','de','it','pt','ja','ko','zh-cn','zh-tw','hi','id',
    'pt-br','es-mx','ar','tr','ru','nl','pl','th','vi','uk','sv','ms',
    'ro','el','cs','hu','fi','he','da','nb','sk','bg','hr','sl','lt','lv','et','ca','is','sr','fil','af','sw','bn','ta','kk','ka','az','sq','mk','hy','uz','gl','eu','mr','te','ne','si','pa','gu','kn','ml','km','lo','my','mn','am','cy'
  ]);

  const labels = {
    'fr':'Français','en':'English','es':'Español','de':'Deutsch','it':'Italiano',
    'pt':'Português','ja':'日本語','ko':'한국어','zh-cn':'简体中文','zh-tw':'繁體中文',
    'hi':'हिन्दी','id':'Bahasa Indonesia','pt-br':'Português (Brasil)',
    'es-mx':'Español (México)','ar':'العربية','tr':'Türkçe','ru':'Русский',
    'nl':'Nederlands','pl':'Polski','th':'ไทย','vi':'Tiếng Việt','uk':'Українська',
    'sv':'Svenska','ms':'Bahasa Melayu','ro':'Română','el':'Ελληνικά',
    'cs':'Čeština','hu':'Magyar','fi':'Suomi','he':'עברית',
    'da':'Dansk',
    'nb':'Norsk bokmål',
    'sk':'Slovenčina',
    'bg':'Български',
    'hr':'Hrvatski',
    'sl':'Slovenščina',
    'lt':'Lietuvių',
    'lv':'Latviešu',
    'et':'Eesti',
    'ca':'Català',
    'is':'Íslenska',
    'sr':'Српски',
    'fil':'Filipino',
    'af':'Afrikaans',
    'sw':'Kiswahili',
    'bn':'বাংলা',
    'ta':'தமிழ்',
    'kk':'Қазақ тілі',
    'ka':'ქართული',
    'az':'Azərbaycan',
    'sq':'Shqip',
    'mk':'Македонски',
    'hy':'Հայերեն',
    'uz':'Oʻzbekcha',
    'gl':'Galego',
    'eu':'Euskara',
    'mr':'मराठी',
    'te':'తెలుగు',
    'ne':'नेपाली',
    'si':'සිංහල',
    'pa':'ਪੰਜਾਬੀ',
    'gu':'ગુજરાતી',
    'kn':'ಕನ್ನಡ',
    'ml':'മലയാളം',
    'km':'ខ្មែរ',
    'lo':'ລາວ',
    'my':'မြန်မာ',
    'mn':'Монгол',
    'am':'አማርኛ',
    'cy':'Cymraeg'
  };

  const prompts = {
    'fr':'Afficher cette page en français ?',
    'en':'View this page in English?',
    'es':'¿Ver esta página en español?',
    'de':'Diese Seite auf Deutsch anzeigen?',
    'it':'Visualizzare questa pagina in italiano?',
    'pt':'Ver esta página em português?',
    'ja':'このページを日本語で表示しますか？',
    'ko':'이 페이지를 한국어로 볼까요?',
    'zh-cn':'用简体中文查看此页面？',
    'zh-tw':'用繁體中文查看此頁面？',
    'hi':'यह पेज हिन्दी में देखें?',
    'id':'Lihat halaman ini dalam Bahasa Indonesia?',
    'pt-br':'Ver esta página em português do Brasil?',
    'es-mx':'¿Ver esta página en español de México?',
    'ar':'عرض هذه الصفحة بالعربية؟',
    'tr':'Bu sayfayı Türkçe görüntülemek ister misiniz?',
    'ru':'Показать эту страницу на русском?',
    'nl':'Deze pagina in het Nederlands bekijken?',
    'pl':'Wyświetlić tę stronę po polsku?',
    'th':'ดูหน้านี้เป็นภาษาไทยหรือไม่?',
    'vi':'Xem trang này bằng tiếng Việt?',
    'uk':'Показати цю сторінку українською?',
    'sv':'Visa den här sidan på svenska?',
    'ms':'Lihat halaman ini dalam Bahasa Melayu?',
    'ro':'Afișați această pagină în limba română?',
    'el':'Προβολή αυτής της σελίδας στα ελληνικά;',
    'cs':'Zobrazit tuto stránku česky?',
    'hu':'Megnézi ezt az oldalt magyarul?',
    'fi':'Näytetäänkö tämä sivu suomeksi?',
    'he':'להציג את הדף הזה בעברית?',
    'da':'Vis denne side på dansk?',
    'nb':'Vise denne siden på norsk?',
    'sk':'Zobraziť túto stránku po slovensky?',
    'bg':'Да се покаже ли тази страница на български?',
    'hr':'Prikazati ovu stranicu na hrvatskom?',
    'sl':'Prikažem to stran v slovenščini?',
    'lt':'Rodyti šį puslapį lietuviškai?',
    'lv':'Rādīt šo lapu latviski?',
    'et':'Kas näidata seda lehte eesti keeles?',
    'ca':'Vols veure aquesta pàgina en català?',
    'is':'Sýna þessa síðu á íslensku?',
    'sr':'Прикажи ову страницу на српском?',
    'fil':'Tingnan ang pahinang ito sa Filipino?',
    'af':'Wys hierdie bladsy in Afrikaans?',
    'sw':'Ungependa kuona ukurasa huu kwa Kiswahili?',
    'bn':'এই পৃষ্ঠাটি বাংলায় দেখবেন?',
    'ta':'இந்தப் பக்கத்தைத் தமிழில் பார்க்கவா?',
    'kk':'Бұл бетті қазақ тілінде көрсету керек пе?',
    'ka':'გსურთ ამ გვერდის ქართულად ნახვა?',
    'az':'Bu səhifəni Azərbaycan dilində göstərək?',
    'sq':'Ta shfaq këtë faqe në shqip?',
    'mk':'Да се прикаже оваа страница на македонски?',
    'hy':'Ցուցադրե՞լ այս էջը հայերենով',
    'uz':'Bu sahifani oʻzbek tilida koʻrsataymi?',
    'gl':'Queres ver esta páxina en galego?',
    'eu':'Orri hau euskaraz ikusi nahi duzu?',
    'mr':'हे पान मराठीत पाहायचे?',
    'te':'ఈ పేజీని తెలుగులో చూడాలా?',
    'ne':'यो पृष्ठ नेपालीमा हेर्ने?',
    'si':'මෙම පිටුව සිංහලෙන් බලන්නද?',
    'pa':'ਕੀ ਇਹ ਪੰਨਾ ਪੰਜਾਬੀ ਵਿੱਚ ਵੇਖਣਾ ਹੈ?',
    'gu':'આ પેજ ગુજરાતીમાં જોવું છે?',
    'kn':'ಈ ಪುಟವನ್ನು ಕನ್ನಡದಲ್ಲಿ ನೋಡಬೇಕೆ?',
    'ml':'ഈ പേജ് മലയാളത്തിൽ കാണണോ?',
    'km':'បង្ហាញទំព័រនេះជាភាសាខ្មែរ?',
    'lo':'ສະແດງໜ້ານີ້ເປັນພາສາລາວບໍ?',
    'my':'ဤစာမျက်နှာကို မြန်မာလို ကြည့်မလား။',
    'mn':'Энэ хуудсыг монголоор харах уу?',
    'am':'ይህን ገጽ በአማርኛ ይመልከቱ?',
    'cy':'Dangos y dudalen hon yn Gymraeg?'
  };

  function localeToSiteCode(locale) {
    if (!locale) return '';
    const normalized = String(locale).trim().replace('_','-').toLowerCase();

    if (normalized === 'pt-br' || normalized.startsWith('pt-br-')) return 'pt-br';
    if (normalized === 'es-mx' || normalized.startsWith('es-mx-')) return 'es-mx';

    if (
      normalized === 'zh-tw' || normalized.startsWith('zh-tw-') ||
      normalized === 'zh-hk' || normalized.startsWith('zh-hk-') ||
      normalized === 'zh-mo' || normalized.startsWith('zh-mo-') ||
      normalized.includes('hant')
    ) return 'zh-tw';

    if (
      normalized === 'zh-cn' || normalized.startsWith('zh-cn-') ||
      normalized === 'zh-sg' || normalized.startsWith('zh-sg-') ||
      normalized.includes('hans')
    ) return 'zh-cn';

    const base = normalized.split('-')[0];
    if (base === 'tl' && supported.has('fil')) return 'fil';
    if ((base === 'no' || base === 'nn') && supported.has('nb')) return 'nb';
    return supported.has(base) ? base : '';
  }

  function currentSiteCode() {
    const first = location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
    return supported.has(first) && first !== 'fr' ? first : 'fr';
  }

  function pageSuffix() {
    const parts = location.pathname.split('/').filter(Boolean);
    const current = currentSiteCode();
    if (current !== 'fr' && parts[0]?.toLowerCase() === current) parts.shift();
    return parts.length ? '/' + parts.join('/') + (location.pathname.endsWith('/') ? '/' : '') : '/';
  }

  function targetUrl(code) {
    const suffix = pageSuffix();
    return code === 'fr' ? suffix : '/' + code + (suffix === '/' ? '/' : suffix);
  }

  function detectedCode() {
    try {
      const saved = localStorage.getItem(STORAGE_LANG);
      if (saved && supported.has(saved)) return saved;
    } catch {}

    const locales = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

    for (const locale of locales) {
      const code = localeToSiteCode(locale);
      if (code) return code;
    }
    return '';
  }

  function dismissedRecently() {
    try {
      const raw = localStorage.getItem(STORAGE_DISMISS);
      if (!raw) return false;
      return Date.now() - Number(raw) < DISMISS_MS;
    } catch {
      return false;
    }
  }

  function rememberLanguageLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest?.('.language-options a[href]');
      if (!link) return;
      try {
        const url = new URL(link.href, location.href);
        const first = url.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
        const code = supported.has(first) ? first : 'fr';
        localStorage.setItem(STORAGE_LANG, code);
        localStorage.removeItem(STORAGE_DISMISS);
      } catch {}
    }, {capture:true});
  }

  function showSuggestion(target) {
    const wrap = document.createElement('aside');
    wrap.className = 'cg-language-suggestion';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', labels[target] || 'Language');

    const text = document.createElement('span');
    text.className = 'cg-language-suggestion__text';
    text.textContent = prompts[target] || prompts.en;

    const go = document.createElement('a');
    go.className = 'cg-language-suggestion__button';
    go.href = targetUrl(target);
    go.hreflang = target === 'zh-cn' ? 'zh-CN' : target === 'zh-tw' ? 'zh-TW' : target === 'pt-br' ? 'pt-BR' : target === 'es-mx' ? 'es-MX' : target;
    go.textContent = labels[target] || target;
    go.addEventListener('click', () => {
      try {
        localStorage.setItem(STORAGE_LANG, target);
        localStorage.removeItem(STORAGE_DISMISS);
      } catch {}
    });

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'cg-language-suggestion__close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', () => {
      try { localStorage.setItem(STORAGE_DISMISS, String(Date.now())); } catch {}
      wrap.remove();
    });

    wrap.append(text, go, close);
    document.body.appendChild(wrap);

    const style = document.createElement('style');
    style.textContent = `
      .cg-language-suggestion{
        position:fixed;left:50%;bottom:18px;z-index:9999;transform:translateX(-50%);
        display:flex;align-items:center;gap:12px;max-width:min(92vw,720px);
        padding:10px 12px 10px 16px;border:1px solid rgba(212,175,55,.85);
        border-radius:12px;background:rgba(16,45,37,.97);color:#fff;
        box-shadow:0 8px 28px rgba(0,0,0,.28);font:inherit;
      }
      .cg-language-suggestion__text{line-height:1.35}
      .cg-language-suggestion__button{
        flex:0 0 auto;padding:8px 12px;border:1px solid #d4af37;border-radius:8px;
        color:#f6e3a1;text-decoration:none;font-weight:700;background:rgba(212,175,55,.08);
      }
      .cg-language-suggestion__button:hover,.cg-language-suggestion__button:focus-visible{
        background:rgba(212,175,55,.18);outline:2px solid #f6e3a1;outline-offset:2px;
      }
      .cg-language-suggestion__close{
        flex:0 0 auto;border:0;background:transparent;color:#fff;font:700 24px/1 sans-serif;
        cursor:pointer;padding:2px 5px;border-radius:6px;
      }
      .cg-language-suggestion__close:focus-visible{outline:2px solid #f6e3a1}
      @media (max-width:640px){
        .cg-language-suggestion{left:12px;right:12px;bottom:12px;transform:none;max-width:none;gap:9px}
        .cg-language-suggestion__text{font-size:.9rem}
        .cg-language-suggestion__button{padding:7px 9px}
      }
    `;
    document.head.appendChild(style);
  }

  rememberLanguageLinks();

  const target = detectedCode();
  if (!target || target === currentSiteCode() || dismissedRecently()) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => showSuggestion(target), {once:true});
  } else {
    showSuggestion(target);
  }
})();