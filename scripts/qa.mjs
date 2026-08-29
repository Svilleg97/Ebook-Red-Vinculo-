/* Lista de control final del ebook. */
import fs from 'node:fs';
import zlib from 'node:zlib';
import { PDFDocument } from 'pdf-lib';

const PDF = 'out/Menos-peleas-no-mas-paciencia.pdf';
const html = fs.readFileSync('src/libro.html', 'utf8');
// Las etiquetas en linea se quitan sin dejar hueco, para no partir frases
const plano = html
  .replace(/<\/?(a|strong|em|b|i|span)\b[^>]*>/g, '')
  .replace(/<[^>]+>/g, '\n')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');
const ok = [], mal = [];
const probar = (nombre, cond, detalle = '') => (cond ? ok : mal).push(`${nombre}${detalle ? ': ' + detalle : ''}`);

/* Contenido */
const src = fs.readFileSync('Menos_peleas_no_mas_paciencia_v7.docx.txt', 'utf8').replace(/^﻿/, '').split(/\r?\n/);
const CORR = [
  ['Línea 106 – Salud Mental', 'Línea 106, Salud Mental'],
  ['Servicio gratuito y confidencial de orientación en salud mental.', 'Servicio gratuito y confidencial de orientación en salud mental, en Bogotá.'],
  ['la Línea 106 brinda orientación gratuita y confidencial en salud mental, 24/7', 'la Línea 106 brinda orientación gratuita y confidencial en salud mental en Bogotá, 24/7'],
];
const MARCAS = new Set(['ANTES DE EMPEZAR', 'UNO', 'HERRAMIENTA 1', 'HERRAMIENTA 2', 'HERRAMIENTA 3', 'HERRAMIENTA 4', 'SEIS', 'SIETE', 'PARA CERRAR', 'HOJA DE REFERENCIA']);
let ausentes = 0, partidos = 0;
for (let i = 6; i < src.length; i++) {
  let t = src[i].replace(/^\t/, '').replace(/^\*\s*/, '').trim();
  if (!t || /^_{6,}$/.test(t) || MARCAS.has(t)) continue;
  for (const [a, b] of CORR) t = t.split(a).join(b);
  const n = t.replace(/\s+/g, ' ');
  if (plano.includes(n)) continue;
  const w = n.split(' ');
  let corte = 0;
  for (let k = 1; k < w.length; k++) if (plano.includes(w.slice(0, k).join(' '))) corte = k;
  if (corte > 2 && plano.includes(w.slice(corte).join(' '))) partidos++; else ausentes++;
}
probar('contenido completo', ausentes === 3, `${ausentes} lineas reestructuradas con permiso, ${partidos} parrafos partidos entre paginas`);

/* Estilo */
probar('sin raya larga, raya media ni punto medio', !/[—–·]/.test(plano));
probar('sin texto de relleno', !/lorem ipsum|placeholder/i.test(plano) && !/\b(TODO|PENDIENTE|FIXME|XXX)\b/.test(plano));

/* Índice contra folios */
const pares = [...html.matchAll(/class="indice__pag">(\d+)</g)].map(m => +m[1]);
const aperturas = [...html.matchAll(/class="caja apertura"[\s\S]*?class="folio__num">(\d+)</g)].map(m => +m[1]);
probar('el indice coincide con los folios', JSON.stringify(pares) === JSON.stringify(aperturas), `${pares.length} entradas`);
const folios = [...html.matchAll(/class="folio__num">(\d+)</g)].map(m => +m[1]);
probar('folios consecutivos', folios.every((v, i) => i === 0 || v === folios[i - 1] + 1), `del ${folios[0]} al ${folios.at(-1)}`);

/* Integridad de la tabla partida */
probar('la tabla de rutas repite su encabezado', (html.match(/<th>Dónde<\/th>/g) || []).length === 2);
probar('la hoja de registro sigue entera', (html.match(/class="registro"/g) || []).length === 1 && (html.match(/<tr><td><\/td>/g) || []).length === 14);

/* PDF */
const pdf = await PDFDocument.load(fs.readFileSync(PDF));
const mm = pt => Math.round(pt / 72 * 25.4);
const tamanos = new Set(pdf.getPages().map(p => `${mm(p.getSize().width)}x${mm(p.getSize().height)}`));
probar('PDF con 58 paginas', pdf.getPageCount() === 58, `${pdf.getPageCount()} paginas`);
probar('todas las paginas en A5', tamanos.size === 1 && [...tamanos][0] === '148x210', [...tamanos].join(', '));
probar('metadatos del documento', !!pdf.getTitle() && !!pdf.getAuthor(), `${pdf.getTitle()} / ${pdf.getAuthor()}`);

const bytes = fs.readFileSync(PDF);
const partes = [bytes];
for (const m of bytes.toString('latin1').matchAll(/stream\r?\n/g)) {
  const i = m.index + m[0].length, j = bytes.indexOf('endstream', i);
  if (j < 0) continue;
  try { partes.push(zlib.inflateSync(bytes.subarray(i, j))); } catch { /* no comprimido */ }
}
const todo = Buffer.concat(partes).toString('latin1');
const familias = [...new Set([...todo.matchAll(/[A-Z]{6}\+([A-Za-z0-9\-]+)/g)].map(m => m[1].split('-')[0]))];
probar('fuentes incrustadas como subconjunto', ['Fraunces', 'Lora', 'MulishRoman'].every(f => familias.includes(f)), familias.join(', '));
probar('sin fuentes de respaldo', !/Georgia|Helvetica|TimesNewRoman/.test(todo));
probar('enlaces vivos', (todo.match(/\/URI/g) || []).length >= 2, [...new Set([...todo.matchAll(/\/URI\s*\(([^)]*)\)/g)].map(m => m[1]))].join(', '));
probar('peso razonable', fs.statSync(PDF).size < 5 * 1024 * 1024, (fs.statSync(PDF).size / 1024 / 1024).toFixed(2) + ' MB');

console.log('\nCONTROL FINAL\n');
ok.forEach(l => console.log('  ok   ' + l));
mal.forEach(l => console.log('  MAL  ' + l));
console.log(`\n${ok.length} de ${ok.length + mal.length} controles pasan`);
process.exit(mal.length ? 1 : 0);
