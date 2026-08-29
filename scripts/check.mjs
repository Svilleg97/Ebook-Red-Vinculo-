/* Revisa que ninguna pagina se desborde y que no haya colisiones con el folio. */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const file = process.argv[2];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

const informe = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.pagina').forEach((pag, i) => {
    const caja = pag.querySelector('.caja');
    if (!caja) return;
    const sobra = caja.scrollHeight - caja.clientHeight;
    const folio = pag.querySelector('.folio');
    let choque = null;
    if (folio) {
      const f = folio.getBoundingClientRect();
      for (const el of caja.children) {
        const r = el.getBoundingClientRect();
        if (r.bottom > f.top + 1) { choque = el.tagName + (el.className ? '.' + el.className : ''); break; }
      }
    }
    const ultimo = caja.lastElementChild;
    const libre = ultimo ? Math.round((caja.getBoundingClientRect().bottom - ultimo.getBoundingClientRect().bottom) / 3.7795) : 0;
    out.push({ pagina: i + 1, sobra: Math.round(sobra / 3.7795), libre_mm: libre, choque });
  });
  return out;
});

await browser.close();
let malas = 0;
for (const p of informe) {
  if (p.sobra > 0 || p.choque) {
    malas++;
    console.log(`  pagina ${String(p.pagina).padStart(2)}  DESBORDA ${p.sobra}mm` + (p.choque ? `  choca con el folio: ${p.choque}` : ''));
  } else {
    console.log(`  pagina ${String(p.pagina).padStart(2)}  ok, ${p.libre_mm}mm libres al pie`);
  }
}
console.log(malas ? `\n${malas} paginas con problema` : '\ntodas las paginas caben');
