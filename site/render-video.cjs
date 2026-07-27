// Grava um vídeo vertical do site da Doce Pão rolando + interagindo, pra mandar no WhatsApp.
// Rodar com NODE_PATH apontando pra um node_modules com playwright-core.
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const { chromium } = pw;
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Users\\kemilly\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const VDIR = path.join(__dirname, 'video-tmp');
if (!fs.existsSync(VDIR)) fs.mkdirSync(VDIR, { recursive: true });

async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-cursor')) return;
    const c = document.createElement('div');
    c.id = 'demo-cursor';
    c.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    c.style.cssText = 'position:fixed;z-index:999999;pointer-events:none;width:26px;height:26px;left:0;top:0;transition:left .09s,top .09s;filter:drop-shadow(1px 2px 3px rgba(0,0,0,.35));';
    document.body.appendChild(c);
    document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
  });
}

async function scrollToEl(page, sel, { offset = 72, pause = 1300, dur = 1100 } = {}) {
  await page.evaluate(({ sel, offset, dur }) => new Promise((res) => {
    const el = document.querySelector(sel);
    const targetY = el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset) : window.scrollY;
    const startY = window.scrollY;
    const start = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      window.scrollTo(0, startY + (targetY - startY) * ease(t));
      if (t < 1) requestAnimationFrame(frame); else res();
    }
    requestAnimationFrame(frame);
  }), { sel, offset, dur });
  await page.waitForTimeout(pause);
}

async function clickLoc(page, loc, label, clicks = 1, gap = 560) {
  const visible = await loc.isVisible().catch(() => false);
  if (!visible) { console.error('SKIP click (not visible):', label); return; }
  const box = await loc.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
    await page.waitForTimeout(420);
  }
  for (let i = 0; i < clicks; i++) {
    await loc.click().catch((e) => console.error('click fail', label, e.message));
    await page.waitForTimeout(gap);
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({
    viewport: { width: 440, height: 952 },
    deviceScaleFactor: 1,
    recordVideo: { dir: VDIR, size: { width: 440, height: 952 } },
  });
  const page = await ctx.newPage();

  // bloqueia o mapa do Google (trava o render headless); deixa as fontes passarem
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.includes('maps.google') || u.includes('maps.gstatic') || u.includes('/maps')) return route.abort();
    return route.continue();
  });

  const htmlPath = 'file://' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  await page.goto(htmlPath, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  // troca o iframe do mapa por um bloco limpo on-brand
  await page.evaluate(() => {
    const m = document.querySelector('.place .map');
    if (m) m.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;background:#f4e8d6;color:#6e1f30"><div style="font-size:42px">📍</div><div style="font-family:Fraunces,serif;font-weight:700;font-size:20px">Xanxerê · SC</div><div style="font-family:Poppins,sans-serif;font-size:13px;color:#a08c7b">aberto todos os dias</div></div>';
  });

  await injectCursor(page);
  await page.waitForTimeout(1700); // segura no hero

  await scrollToEl(page, '.trust', { pause: 1100 });
  await scrollToEl(page, '.gallery', { pause: 2700 }); // deixa as fotos passarem (marquee)
  await scrollToEl(page, '.order', { pause: 1500 });

  // calculadora de festa: aumenta os convidados
  await scrollToEl(page, '#calc', { pause: 1000 });
  await clickLoc(page, page.locator('.calc .ppl .ctrl button').last(), 'calc +', 4, 600);
  await page.waitForTimeout(1100);

  await scrollToEl(page, '.festa', { pause: 1500 });
  await scrollToEl(page, '#historia', { pause: 1300 });
  await scrollToEl(page, '#cardapio', { pause: 1700 });

  // encomenda por unidade: monta um pedido
  await scrollToEl(page, '#encomenda', { pause: 1000 });
  await clickLoc(page, page.locator('.stp:has(#q_coxinha) button').last(), 'coxinha +', 3, 520);
  await clickLoc(page, page.locator('.stp:has(#q_risole) button').last(), 'risole +', 2, 520);
  await page.waitForTimeout(1200);

  await scrollToEl(page, '#clube', { pause: 1600 });
  await scrollToEl(page, '.testi', { pause: 1600 });
  await scrollToEl(page, '.place', { pause: 1400 });
  await scrollToEl(page, 'footer', { pause: 2000 });

  const video = page.video();
  await ctx.close(); // finaliza o webm
  const webm = await video.path();
  await browser.close();

  const stable = path.join(__dirname, 'doce-pao-site.webm');
  fs.copyFileSync(webm, stable);
  console.log('WEBM:' + stable);
})();
