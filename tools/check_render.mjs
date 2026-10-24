import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const failures = [];
const base = 'http://127.0.0.1:8765';
const pages = [
  '/', '/cocoboum/', '/en/', '/en/cocoboum/', '/pt-br/',
  '/es-mx/cocoboum/', '/ja/', '/ko/cocoboum/',
  '/ar/', '/ar/cocoboum/', '/he/', '/zh-cn/', '/hi/',
  '/th/', '/tr/tableauxensorceles/',
  '/tableauxensorceles/', '/en/tableauxensorceles/', '/de/tableauxensorceles/',
  '/es/tableauxensorceles/', '/it/tableauxensorceles/', '/pt/tableauxensorceles/', '/de/cocoboum/',
  '/de/', '/ja/tableauxensorceles/', '/ar/royaumedesmotscroises/', '/he/mieuxchaquejour/', '/mieuxchaquejour/', '/en/mieuxchaquejour/', '/ja/mieuxchaquejour/', '/th/tableauxensorceles/', '/caligulavsgladiators/', '/sauvequifleche/', '/royaumedesenigmes/', '/en/sauvequifleche/', '/ar/royaumedesenigmes/', '/ja/caligulavsgladiators/', '/he/sauvequifleche/', '/da/', '/nb/cocoboum/', '/bg/', '/lt/sauvequifleche/', '/ca/royaumedesenigmes/', '/et/mieuxchaquejour/', '/is/', '/sr/cocoboum/', '/fil/sauvequifleche/', '/bn/', '/ka/royaumedesenigmes/', '/az/tableauxensorceles/', '/hy/', '/mk/cocoboum/', '/si/sauvequifleche/', '/te/', '/eu/royaumedesenigmes/', '/km/', '/my/cocoboum/', '/am/sauvequifleche/', '/ml/', '/cy/royaumedesenigmes/', '/lo/tableauxensorceles/', '/fa/', '/ur/cocoboum/', '/ga/royaumedesenigmes/', '/mt/', '/be/sauvequifleche/', '/zu/mieuxchaquejour/'
];

try {
  for (const width of [390, 1440]) {
    for (const path of pages) {
      const page = await browser.newPage({viewport: {width, height: 850}, reducedMotion: 'reduce'});
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(String(e)));
      try {
        const response = await page.goto(base + path, {waitUntil: 'domcontentloaded', timeout: 20000});
        await page.locator('.official-logo, .hero-video').waitFor({state:'visible', timeout:10000});
        const audit = await page.evaluate(() => ({
          title: document.title,
          lang: document.documentElement.lang,
          contentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          mainHeading: document.querySelectorAll('main h1').length,
          languages: document.querySelectorAll('.language-options a').length,
          heroLoaded: Boolean(document.querySelector('.hero-video iframe')) || Boolean(document.querySelector('.official-logo')?.complete && document.querySelector('.official-logo')?.naturalWidth > 0),
          css: getComputedStyle(document.querySelector('body')).backgroundColor
        }));
        if (response?.status() !== 200) failures.push(path + ' HTTP ' + response?.status());
        if (audit.mainHeading !== 1) failures.push(path + ' H1=' + audit.mainHeading);
        if (audit.languages !== 80) failures.push(path + ' menu=' + audit.languages);
        if (audit.contentWidth > audit.viewportWidth + 3) failures.push(path + ' horizontal overflow ' + audit.contentWidth + ' > ' + audit.viewportWidth + ' at ' + width);
        if (!audit.heroLoaded) failures.push(path + ' hero image failed to load');
        if (pageErrors.length) failures.push(path + ' JS error: ' + pageErrors.join(' | ').slice(0,300));
        const summary = page.locator('.language-menu summary');
        await summary.click();
        if (!(await page.locator('.language-menu').evaluate(el => el.hasAttribute('open')))) failures.push(path + ' language menu does not open');
        console.log('CHECK', width, path, audit.lang, audit.contentWidth, audit.viewportWidth);
      } catch(e) {failures.push(path + ' ' + width + ': ' + String(e).slice(0,240));}
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log('Render smoke test:', pages.length, 'pages x 2 viewports; failures:', failures.length);
if (failures.length) {
  for (const message of failures) console.error('ERROR', message);
  process.exitCode = 1;
}
