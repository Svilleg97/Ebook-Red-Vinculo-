import fs from 'node:fs';

const doc = JSON.parse(fs.readFileSync('content/libro.json', 'utf8'));

// Una entrada por tabla, en orden de aparicion en el libro
const SPECS = [
  { chapter: 'cap-2', cols: 3, header: true,  kind: 'table',    caption: 'Qué se registra' },
  { chapter: 'cap-2', cols: 5, header: true,  kind: 'registro' },
  { chapter: 'cap-3', cols: 2, header: true,  kind: 'table' },
  { chapter: 'cap-4', cols: 2, header: true,  kind: 'table' },
  { chapter: 'cap-7', cols: 2, header: true,  kind: 'table' },
  { chapter: 'cierre', cols: 2, header: true, kind: 'table' },
  { chapter: 'hoja', cols: 2, header: false,  kind: 'deflist' },
  { chapter: 'hoja', cols: 2, header: false,  kind: 'deflist' },
];

// Los dos unicos textos que traen punto medio como separador
const PUNTO_MEDIO = {
  'Anoto cada conflicto: día y hora · situación · mi estado 1-10 · qué hice · cómo terminó. Al séptimo día encuentro mi VENTANA: la franja del día donde los conflictos se repiten con el mismo guion.': {
    lead: 'Anoto cada conflicto:',
    items: ['día y hora', 'situación', 'mi estado 1-10', 'qué hice', 'cómo terminó'],
    tail: 'Al séptimo día encuentro mi ventana: la franja del día donde los conflictos se repiten con el mismo guion.',
  },
  'A mi ventana le pongo: secuencia fija · aviso que él pueda ver u oír · algo visible en la pared · dos semanas antes de juzgar si funciona. Una ventana a la vez.': {
    lead: 'A mi ventana le pongo:',
    items: ['secuencia fija', 'aviso que él pueda ver u oír', 'algo visible en la pared', 'dos semanas antes de juzgar si funciona'],
    tail: 'Una ventana a la vez.',
  },
};

const isHeadingish = t => t && t.length < 78 && !/[.;»!?:]$/.test(t) && !/^_+$/.test(t);

// Subtítulos que cuelgan de una sección mayor
const SUBTITULOS = new Set([
  'Te va a poner a prueba', 'Va a pedir más', 'Te va a costar a ti más que a él',
  'Y ahora lo importante: si no puedes',
  'Nombra lo que pasó, sin adjetivos sobre ti', 'Separa lo que hiciste de lo que eres',
  'Elige una sola cosa concreta',
  'La hora de dormir', 'Las pantallas', 'Las tareas', 'Alistarse para el colegio', 'La hora de comer',
  'Una persona, no una red', 'La franja protegida', 'Bajar el estándar a propósito',
]);
const report = [];
let specIndex = 0;

for (const ch of doc.chapters) {
  const out = [];
  for (const b of ch.blocks) {
    if (b.type !== 'table-raw') { out.push(b); continue; }

    const spec = SPECS[specIndex++];
    if (spec.chapter !== ch.id) throw new Error(`spec desalineado: esperaba ${spec.chapter}, llegó ${ch.id}`);

    const cells = [...b.cells];
    const sobra = cells.length % spec.cols ? cells.pop() : null;

    const grid = [];
    for (let i = 0; i < cells.length; i += spec.cols) grid.push(cells.slice(i, i + spec.cols));

    if (spec.kind === 'registro') {
      out.push({ type: 'registro', head: grid.shift(), rows: grid.length });
      report.push(`registro: ${grid.length} filas en blanco x ${spec.cols} columnas`);
    } else if (spec.kind === 'deflist') {
      out.push({
        type: 'deflist',
        items: grid.map(([term, def]) => ({ term, def: PUNTO_MEDIO[def] ?? def })),
      });
      report.push(`deflist: ${grid.length} entradas`);
    } else {
      const head = spec.header ? grid.shift() : null;
      out.push({ type: 'table', caption: spec.caption ?? null, head, rows: grid });
      report.push(`tabla ${ch.id}: ${grid.length} filas x ${spec.cols} columnas`);
    }

    if (sobra != null) {
      const t = sobra.trim();
      if (!t || /^_+$/.test(t)) report.push(`  celda suelta descartada en ${ch.id}: ${JSON.stringify(t)}`);
      else { out.push({ type: isHeadingish(t) ? 'h2' : 'p', text: t }); report.push(`  celda suelta recolocada en ${ch.id}: "${t.slice(0, 50)}"`); }
    }
  }

  // El renglon para llenar a mano: h2 con dos puntos seguido de un break falso
  const fixed = [];
  for (let i = 0; i < out.length; i++) {
    const b = out[i];
    if ((b.type === 'p' || b.type === 'h2') && /:$/.test(b.text) && out[i + 1]?.type === 'raya') {
      fixed.push({ type: 'fill', label: b.text, fields: 1 });
      i++;
      report.push(`campo para llenar: "${b.text}"`);
      continue;
    }
    if (b.type === 'h2' && /_{4,}/.test(b.text)) {
      const partes = b.text.split(/_{4,}/).map(s => s.trim()).filter(Boolean);
      fixed.push({ type: 'fill-inline', fields: partes });
      report.push(`campos en linea: ${JSON.stringify(partes)}`);
      continue;
    }
    fixed.push(b);
  }
  ch.blocks = fixed;
}

// Jerarquía: los subtítulos bajan un nivel
for (const ch of doc.chapters) {
  for (const b of ch.blocks) {
    if (b.type === 'h2' && SUBTITULOS.has(b.text)) { b.type = 'h3'; report.push(`subtítulo: ${b.text}`); }
  }
}

// La lista de señales se tragó el título de la tabla de rutas
for (const ch of doc.chapters) {
  const i = ch.blocks.findIndex(b => b.type === 'ul' && b.items.at(-1) === 'Rutas en Colombia');
  if (i >= 0) {
    const t = ch.blocks[i].items.pop();
    ch.blocks.splice(i + 1, 0, { type: 'h2', text: t });
    report.push(`título recuperado de una lista: ${t}`);
  }
}

// El cierre del libro: firma de marca y nota legal, no un título más
for (const ch of doc.chapters) {
  const i = ch.blocks.findIndex(b => b.type === 'h2' && b.text === 'Red Vínculo');
  if (i >= 0) {
    const nota = ch.blocks[i + 1];
    ch.blocks.splice(i, nota && nota.type === 'p' ? 2 : 1,
      { type: 'cierre-libro', nota: nota && nota.type === 'p' ? nota.text : null });
    report.push('cierre del libro convertido en firma con nota legal');
  }
}

fs.writeFileSync('content/libro.normalizado.json', JSON.stringify(doc, null, 2));
console.log(report.join('\n'));
console.log('\ntablas procesadas:', specIndex, 'de', SPECS.length);
