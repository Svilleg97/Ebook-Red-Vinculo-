/* Genera el PDF final con fuentes incrustadas, enlaces vivos y metadatos. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PDFDocument } from 'pdf-lib';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SALIDA = 'out/Menos-peleas-no-mas-paciencia.pdf';

fs.mkdirSync('out', { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.resolve('src/libro.html')).href, { waitUntil: 'networkidle0' });

// Las fuentes se piden a mano antes de imprimir
await page.evaluate(async () => {
  await Promise.all([
    document.fonts.load('600 30pt Fraunces'),
    document.fonts.load('600 17pt Fraunces'),
    document.fonts.load('400 11.5pt Lora'),
    document.fonts.load('italic 400 12.5pt Lora'),
    document.fonts.load('700 8.5pt Mulish'),
    document.fonts.load('400 9.5pt Mulish'),
  ]);
  await document.fonts.ready;
});

await page.pdf({
  path: SALIDA,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  displayHeaderFooter: false,
  tagged: true,
});
await browser.close();

/* Metadatos del documento */
const bytes = fs.readFileSync(SALIDA);
const pdf = await PDFDocument.load(bytes);
pdf.setTitle('Menos peleas, no más paciencia');
pdf.setAuthor('Red Vínculo');
pdf.setSubject('Cuatro herramientas para mamás en los días difíciles');
pdf.setKeywords(['crianza', 'vínculo', 'maternidad', 'límites', 'rutinas', 'Red Vínculo']);
pdf.setCreator('Red Vínculo');
pdf.setProducer('Red Vínculo');
pdf.setLanguage('es-CO');
pdf.setCreationDate(new Date());
pdf.setModificationDate(new Date());
fs.writeFileSync(SALIDA, await pdf.save());

/* Control final */
const final = await PDFDocument.load(fs.readFileSync(SALIDA));
const p0 = final.getPage(0).getSize();
const mm = pt => Math.round(pt / 72 * 25.4 * 10) / 10;
const tamanos = new Set(final.getPages().map(p => `${mm(p.getSize().width)}x${mm(p.getSize().height)}`));
console.log('archivo:', SALIDA);
console.log('paginas:', final.getPageCount());
console.log('tamano de pagina:', `${mm(p0.width)} x ${mm(p0.height)} mm`, '| tamanos distintos:', [...tamanos].join(', '));
console.log('peso:', (fs.statSync(SALIDA).size / 1024 / 1024).toFixed(2), 'MB');
console.log('titulo:', final.getTitle(), '| autor:', final.getAuthor());
