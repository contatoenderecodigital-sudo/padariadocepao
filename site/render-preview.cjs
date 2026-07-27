// Gera previews PNG do site pra conferência visual. Bloqueia o mapa (trava headless).
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const { chromium } = pw;
const path = require('path');
const CHROME = 'C:\\Users\\kemilly\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';
const here = (f) => 'file://' + path.resolve(__dirname, f).replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });

  async function shot(file, out, opts = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 1.5 });
    const p = await ctx.newPage();
    await p.route('**/*', (route) => {
      const u = route.request().url();
      if (u.includes('maps.google') || u.includes('maps.gstatic') || u.includes('/maps')) return route.abort();
      return route.continue();
    });
    if (opts.seed) {
      await p.addInitScript(() => {
        localStorage.setItem('docepao_clube', JSON.stringify({ nome: 'Ana', zap: '49 99999-0000', stamps: 4,
          history: [
            { data: '12 de junho', itens: '50 coxinhas, 30 risoles e 1 torta', total: 'R$ 175,00' },
            { data: '28 de maio', itens: '1 bolo de 2kg e 100 docinhos', total: 'R$ 220,00' }
          ] }));
      });
    }
    await p.goto(here(file), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(500);
    // dispara animações reveal rolando a página
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')));
    await p.waitForTimeout(500);
    if (opts.selector) {
      const el = await p.$(opts.selector);
      await el.screenshot({ path: path.join(__dirname, out) });
    } else {
      await p.screenshot({ path: path.join(__dirname, out), fullPage: !!opts.full });
    }
    console.log('OK ' + out);
    await ctx.close();
  }

  await shot('index.html', 'preview-topo.png', {});                       // nav + hero + banner dourado
  await shot('index.html', 'preview-order.png', { selector: '.order' });  // como encomendar
  await shot('index.html', 'preview-clube-login.png', { selector: '#clube' });
  await shot('index.html', 'preview-clube-membro.png', { selector: '#clube', seed: true });
  await shot('encomenda.html', 'preview-encomenda.png', { full: true });

  await browser.close();
  console.log('Pronto.');
})();
