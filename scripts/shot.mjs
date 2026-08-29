/* Captura paginas sueltas: node scripts/shot.mjs <archivo> <prefijo> [indices]
   sin indices captura la pagina completa en un solo png */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [, , file, prefijo, indices] = process.argv;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 620, height: 900, deviceScaleFactor: 2.6 });
await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

if (!indices) {
  await page.screenshot({ path: `${prefijo}.png`, fullPage: true });
  console.log('ok ->', `${prefijo}.png`);
} else {
  const pags = await page.$$('.pagina');
  for (const n of indices.split(',').map(Number)) {
    const el = pags[n - 1];
    if (!el) { console.log('no existe la pagina', n); continue; }
    const out = `${prefijo}-p${n}.png`;
    await el.screenshot({ path: out });
    console.log('ok ->', out);
  }
}
await browser.close();
