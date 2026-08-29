/* Pliego de contacto: todas las páginas en miniatura para revisión visual. */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1.6 });
await p.goto(pathToFileURL(path.resolve('src/libro.html')).href, { waitUntil: 'networkidle0' });
await p.evaluate(() => document.fonts.ready);
const desde = Number(process.argv[2] || 1), hasta = Number(process.argv[3] || 60);
await p.evaluate(({ desde, hasta }) => {
  document.body.style.cssText = 'background:#948C82;padding:16px;margin:0;display:grid;grid-template-columns:repeat(6,1fr);gap:10px';
  document.querySelectorAll('.pagina').forEach((pg, i) => {
    const n = i + 1;
    if (n < desde || n > hasta) { pg.remove(); return; }
    pg.style.cssText += 'transform:scale(.42);transform-origin:top left;margin:0;box-shadow:0 1px 4px rgba(0,0,0,.3)';
    const caja = document.createElement('div');
    caja.style.cssText = 'width:' + (148 * 3.7795 * .42) + 'px;height:' + (210 * 3.7795 * .42) + 'px;overflow:hidden;position:relative';
    pg.parentNode.insertBefore(caja, pg);
    caja.appendChild(pg);
  });
}, { desde, hasta });
await p.screenshot({ path: `preview/05-pliego-${desde}-${hasta}.png`, fullPage: true });
await b.close();
console.log('ok -> preview/05-pliego-' + desde + '-' + hasta + '.png');
