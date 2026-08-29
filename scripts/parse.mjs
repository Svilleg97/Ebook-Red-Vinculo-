import fs from 'node:fs';

const RAW = fs.readFileSync('Menos_peleas_no_mas_paciencia_v7.docx.txt', 'utf8')
  .replace(/^﻿/, '')
  .split(/\r?\n/);

// Marcadores de capitulo tal como vienen en el documento original
const CHAPTERS = [
  { marker: 'ANTES DE EMPEZAR', id: 'antes',   num: null, kicker: 'Antes de empezar' },
  { marker: 'UNO',              id: 'cap-1',   num: 'uno',    kicker: 'Capítulo uno' },
  { marker: 'HERRAMIENTA 1',    id: 'cap-2',   num: 'dos',    kicker: 'Capítulo dos', tool: 'Herramienta 1' },
  { marker: 'HERRAMIENTA 2',    id: 'cap-3',   num: 'tres',   kicker: 'Capítulo tres', tool: 'Herramienta 2' },
  { marker: 'HERRAMIENTA 3',    id: 'cap-4',   num: 'cuatro', kicker: 'Capítulo cuatro', tool: 'Herramienta 3' },
  { marker: 'HERRAMIENTA 4',    id: 'cap-5',   num: 'cinco',  kicker: 'Capítulo cinco', tool: 'Herramienta 4' },
  { marker: 'SEIS',             id: 'cap-6',   num: 'seis',   kicker: 'Capítulo seis' },
  { marker: 'SIETE',            id: 'cap-7',   num: 'siete',  kicker: 'Capítulo siete' },
  { marker: 'PARA CERRAR',      id: 'cierre',  num: null, kicker: 'Para cerrar' },
  { marker: 'HOJA DE REFERENCIA', id: 'hoja',  num: null, kicker: 'Hoja de referencia' },
];
const BY_MARKER = new Map(CHAPTERS.map(c => [c.marker, c]));

const isBreak = l => /^_{10,20}$/.test(l.trim());   // salto de página del docx
const isRaya  = l => /^_{30,}$/.test(l.trim());     // renglón para escribir a mano
const isCell = l => /^\t/.test(l);
const isBullet = l => /^\*\s/.test(l);
const isSay = l => /^«.*»$/.test(l.trim());

// Un titulo no termina en signo de puntuacion de frase
const isHeading = l => {
  const t = l.trim();
  if (!t || t.length > 78) return false;
  if (isBullet(t) || isSay(t) || isCell(l)) return false;
  if (/[.;»!?]$/.test(t)) return false;
  if (/:$/.test(t)) return false;   // frase de entrada, no título
  if (/^_+$/.test(t)) return false;
  return true;
};

const H3 = /^(\d+\.\s|Primero:|Segundo:|Tercero:|Uno\.\s|Dos\.\s|Tres\.\s)/;

const doc = { chapters: [] };
let cur = null;
let i = 0;
let pendingBreak = false;

const push = b => { if (cur) cur.blocks.push(b); };

while (i < RAW.length) {
  const line = RAW[i];
  const t = line.trim();

  if (isBreak(line)) { pendingBreak = true; i++; continue; }
  if (isRaya(line))  { push({ type: 'raya' }); i++; continue; }
  if (!t) { i++; continue; }

  if (BY_MARKER.has(t)) {
    const meta = BY_MARKER.get(t);
    // el titulo del capitulo es la siguiente linea con contenido
    let j = i + 1;
    while (j < RAW.length && !RAW[j].trim()) j++;
    cur = { ...meta, title: RAW[j].trim(), blocks: [] };
    doc.chapters.push(cur);
    i = j + 1;
    pendingBreak = false;
    continue;
  }

  if (!cur) { i++; continue; } // portada, se arma aparte

  if (pendingBreak) { push({ type: 'break' }); pendingBreak = false; }

  // tabla: celda inicial sin tab seguida de celdas con tab
  if (isCell(RAW[i + 1] ?? '') && !isCell(line)) {
    const cells = [t];
    let j = i + 1;
    while (j < RAW.length && isCell(RAW[j])) { cells.push(RAW[j].replace(/^\t/, '').trim()); j++; }
    push({ type: 'table-raw', cells });
    i = j;
    continue;
  }

  if (isBullet(line)) {
    const items = [];
    let j = i;
    while (j < RAW.length && (isBullet(RAW[j]) || !RAW[j].trim())) {
      if (isBullet(RAW[j])) items.push(RAW[j].replace(/^\*\s*/, '').trim());
      j++;
      if (j < RAW.length && !RAW[j].trim() && !isBullet(RAW[j + 1] ?? '')) break;
    }
    push({ type: 'ul', items });
    i = j;
    continue;
  }

  if (isSay(line)) {
    const lines = [t];
    let j = i + 1;
    while (j < RAW.length && isSay(RAW[j])) { lines.push(RAW[j].trim()); j++; }
    push({ type: 'say', lines });
    i = j;
    continue;
  }

  if (isHeading(line)) {
    push({ type: H3.test(t) ? 'h3' : 'h2', text: t });
    i++;
    continue;
  }

  push({ type: 'p', text: t });
  i++;
}

fs.writeFileSync('content/libro.json', JSON.stringify(doc, null, 2));

// Reporte de control
let words = 0;
for (const c of doc.chapters) {
  const counts = {};
  for (const b of c.blocks) counts[b.type] = (counts[b.type] || 0) + 1;
  const w = JSON.stringify(c.blocks).split(/\s+/).length;
  words += w;
  console.log(`${c.id.padEnd(8)} ${String(c.title).slice(0, 44).padEnd(46)} ${JSON.stringify(counts)}`);
}
console.log('\ncapitulos:', doc.chapters.length, '| bloques totales:', doc.chapters.reduce((a, c) => a + c.blocks.length, 0));
