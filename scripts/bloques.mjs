/* Convierte el contenido normalizado en fragmentos de HTML del sistema editorial. */
import fs from 'node:fs';

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Párrafos que se promueven a cita destacada. Es solo tipografía, el texto no cambia. */
const CITAS = new Set([
  'No falló la técnica. Y no fallaste tú.',
  'La pausa no es para que él se calme. Es para que tú no empeores la escena.',
  'La culpa no te está haciendo mejor mamá. Te está costando los límites.',
  'No es que seas inconsistente. Es que estabas en otro cuerpo.',
  'El vínculo no se construye en los momentos buenos. Se construye en la vuelta después del mal momento.',
  'Cuando la rutina decide, tú dejas de ser la que decide. Y él deja de pelear contigo para empezar a pelear con una estructura. Eso es mucho menos personal, y muchísimo menos desgastante para el vínculo.',
  'Pedir ayuda no significa que fallaste. Significa que estás haciendo lo que hay que hacer.',
]);

/* Correcciones de texto autorizadas por la clienta */
const CORRECCIONES = [
  ['Línea 106 – Salud Mental', 'Línea 106, Salud Mental'],
  ['Servicio gratuito y confidencial de orientación en salud mental.',
   'Servicio gratuito y confidencial de orientación en salud mental, en Bogotá.'],
];
const corregir = t => CORRECCIONES.reduce((s, [a, b]) => s.split(a).join(b), String(t));
// La segunda mención de la Línea 106, en la nota de cierre
const corregirRutas = t => corregir(t).replace(
  'la Línea 106 brinda orientación gratuita y confidencial en salud mental, 24/7',
  'la Línea 106 brinda orientación gratuita y confidencial en salud mental en Bogotá, 24/7');

/* La sección que se muestra como caja de práctica */
const PRACTICAS = new Set(['Empieza esta noche: nombra tu escalón en voz alta']);

function tabla(b) {
  const anchoClave = b.head && b.head.length === 2 ? ' class="tabla--ancha"' : '';
  const head = b.head
    ? `<thead><tr>${b.head.map(h => `<th>${esc(corregir(h))}</th>`).join('')}</tr></thead>`
    : '';
  const enlazar = t => t.replace('minjusticia.gov.co',
    '<a href="https://www.minjusticia.gov.co">minjusticia.gov.co</a>');
  const rows = b.rows.map(r =>
    `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="clave"' : ''}>${enlazar(esc(corregir(c)))}</td>`).join('')}</tr>`
  ).join('');
  return `<table${anchoClave}>${head}<tbody>${rows}</tbody></table>`;
}

function registro(b) {
  const head = `<thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>`;
  const fila = `<tr>${b.head.map(() => '<td></td>').join('')}</tr>`;
  return `<table class="registro">${head}<tbody>${fila.repeat(b.rows)}</tbody></table>`;
}

function deflist(b) {
  const items = b.items.map(({ term, def }) => {
    let cuerpo;
    if (typeof def === 'string') cuerpo = esc(def);
    else cuerpo = `${esc(def.lead)}<ul>${def.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`
       + esc(def.tail).replace('mi ventana', '<strong>mi ventana</strong>');
    return `<div class="deflist__item"><div class="deflist__term">${esc(term)}</div><div class="deflist__def">${cuerpo}</div></div>`;
  }).join('');
  return `<div class="deflist">${items}</div>`;
}

export function bloqueHTML(b) {
  switch (b.type) {
    case 'h2':   return `<h2>${esc(b.text)}</h2>`;
    case 'h3':   return `<h3>${esc(b.text)}</h3>`;
    case 'p':    return (b.cita || CITAS.has(b.text))
                   ? `<p class="cita">${esc(b.text)}</p>`
                   : `<p>${esc(corregir(b.text))}</p>`;
    case 'ul':   return `<ul>${b.items.map(i => `<li>${esc(corregir(i))}</li>`).join('')}</ul>`;
    case 'say':  return `<div class="voz">${b.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
    case 'table': return tabla(b);
    case 'registro': return registro(b);
    case 'deflist':  return deflist(b);
    case 'cierre-libro':
      return `<div class="cierre-libro">
        <img class="cierre-libro__icono" src="../assets/img/icono.png" alt="">
        <p class="cierre-libro__marca">Red Vínculo</p>
        ${b.nota ? `<p class="nota">${esc(corregirRutas(b.nota))}</p>` : ''}
      </div>`;
    case 'fill': return `<div class="campo"><p class="campo__label">${esc(b.label)}</p><div class="campo__linea"></div></div>`;
    case 'fill-inline':
      return `<div class="campos-linea">${b.fields.map(f => `<div><span>${esc(f)}</span><div class="campo__linea"></div></div>`).join('')}</div>`;
    default: return '';
  }
}

export function cargarLibro() {
  const doc = JSON.parse(fs.readFileSync('content/libro.normalizado.json', 'utf8'));
  for (const ch of doc.chapters) {
    // el primer párrafo sube a la apertura del capítulo
    const primero = ch.blocks[0];
    if (primero?.type === 'p' && primero.text.length < 240) {
      ch.entrada = primero.text;
      ch.blocks = ch.blocks.slice(1);
    }
    // el cierre de la hoja de registro va junto, en caja de práctica
    const iR = ch.blocks.findIndex(b => b.type === 'registro');
    if (iR >= 0) {
      const cola = ch.blocks.slice(iR + 1);
      const cierreP = cola.at(-1)?.type === 'p' ? cola.pop() : null;
      ch.blocks = ch.blocks.slice(0, iR + 1);
      ch.blocks.push({ type: 'salto' });
      ch.blocks.push({ type: 'practica', blocks: cola });
      if (cierreP) ch.blocks.push({ type: 'p', text: cierreP.text, cita: true });
    }

    // la sección final del capítulo uno va en caja de práctica
    const iP = ch.blocks.findIndex(b => b.type === 'h2' && PRACTICAS.has(b.text));
    if (iP >= 0) {
      const dentro = ch.blocks.slice(iP);
      ch.blocks = ch.blocks.slice(0, iP);
      ch.blocks.push({ type: 'practica', blocks: dentro });
    }
  }
  return doc;
}

export { esc, corregir };
