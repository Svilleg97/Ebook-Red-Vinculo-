/* Maqueta el libro completo: pagina el contenido y escribe src/libro.html */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { cargarLibro, bloqueHTML, esc } from './bloques.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTE = { antes: 'antes', 'cap-1': 'cap-1', 'cap-2': 'cap-2', 'cap-3': 'cap-3',
  'cap-4': 'cap-4', 'cap-5': 'cap-5', 'cap-6': 'cap-6', 'cap-7': 'cap-7',
  cierre: 'cierre', hoja: 'hoja' };

const doc = cargarLibro();

const svg = (nombre, clase = '') => {
  const bruto = fs.readFileSync(`assets/svg/${nombre}.svg`, 'utf8').trim();
  return bruto.replace('<svg ', `<svg${clase ? ` class="${clase}"` : ''} role="presentation" `);
};

/* ---------- 1 · flujo de items ---------- */
const items = [];
for (const ch of doc.chapters) {
  const tag = ch.tool ? `<span class="apertura__tag">${esc(ch.tool)}</span>` : '';
  const pie = ch.entrada ? `<p class="apertura__pie">${esc(ch.entrada)}</p>` : '';
  items.push({ tipo: 'apertura', capitulo: ch.id, html:
    `<div class="caja apertura">
       <div class="apertura__arte">${svg(ARTE[ch.id])}</div>
       <p class="kicker">${esc(ch.kicker)}</p>
       ${tag}
       <h1>${esc(ch.title)}</h1>
       ${pie}
     </div>` });

  for (const b of ch.blocks) {
    if (b.type === 'break' || b.type === 'salto') { items.push({ tipo: 'salto' }); continue; }
    if (b.type === 'h2' && b.text === 'Tu registro') items.push({ tipo: 'salto' });
    if (b.type === 'practica') {
      items.push({ tipo: 'bloque', atomico: true,
        html: `<div class="practica">${b.blocks.map(bloqueHTML).join('')}</div>` });
      continue;
    }
    const html = bloqueHTML(b);
    if (html) items.push({ tipo: 'bloque', html });
  }
}

/* ---------- 2 · documento de trabajo ---------- */
const cabecera = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Menos peleas, no más paciencia</title>
<link rel="stylesheet" href="../assets/fonts/fonts.css">
<link rel="stylesheet" href="estilos/tokens.css">
<link rel="stylesheet" href="estilos/libro.css">`;

const fuente = items.map(it =>
  `<div class="item" data-tipo="${it.tipo}"${it.capitulo ? ` data-cap="${it.capitulo}"` : ''}${it.atomico ? ' data-atomico="1"' : ''}>${it.html ?? ''}</div>`
).join('\n');

const paginador = `
<script>
// Las fuentes se piden a mano: el contenedor está oculto y sin esto
// document.fonts.ready resuelve antes de que existan métricas reales.
(async () => {
  await Promise.all([
    document.fonts.load('600 30pt Fraunces'),
    document.fonts.load('600 17pt Fraunces'),
    document.fonts.load('400 11.5pt Lora'),
    document.fonts.load('italic 400 12.5pt Lora'),
    document.fonts.load('700 8.5pt Mulish'),
    document.fonts.load('400 9.5pt Mulish'),
  ]);
  await document.fonts.ready;
  const INICIO = 2;                     // el índice es la página 1
  const fuente = document.getElementById('fuente');
  const libro  = document.getElementById('libro');
  const sonda  = document.getElementById('sonda');
  const mapa   = {};
  let pagina, caja, folio = INICIO - 1;

  const nueva = (clase = '') => {
    folio++;
    pagina = document.createElement('section');
    pagina.className = 'pagina' + (clase ? ' ' + clase : '');
    caja = document.createElement('div');
    caja.className = 'caja';
    pagina.appendChild(caja);
    const f = document.createElement('div');
    f.className = 'folio';
    f.innerHTML = '<span class="folio__marca">red vínculo</span><span class="folio__num">' + folio + '</span>';
    pagina.appendChild(f);
    libro.appendChild(pagina);
  };
  const cabe = () => caja.scrollHeight <= caja.clientHeight;
  const libreMM = () => {
    const u = caja.lastElementChild;
    if (!u) return caja.clientHeight / 3.7795;
    return (caja.getBoundingClientRect().bottom - u.getBoundingClientRect().bottom) / 3.7795;
  };
  const lineas = el => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));

  // corta un párrafo dejando al menos dos líneas de cada lado
  const partir = p => {
    if (p.children.length || p.classList.contains('cita')) return null;
    const original = p.textContent;
    const palabras = original.split(/\\s+/);
    if (palabras.length < 12) return null;
    let lo = 1, hi = palabras.length - 1, mejor = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      p.textContent = palabras.slice(0, mid).join(' ');
      if (cabe()) { mejor = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    const restaura = () => { p.textContent = original; return null; };
    if (!mejor) return restaura();
    p.textContent = palabras.slice(0, mejor).join(' ');
    if (lineas(p) < 2) return restaura();

    sonda.style.width = caja.clientWidth + 'px';
    const probar = n => { sonda.innerHTML = ''; const c = p.cloneNode(false);
      c.textContent = palabras.slice(n).join(' '); sonda.appendChild(c); return lineas(c); };
    while (mejor > 2 && probar(mejor) < 2) { mejor--; p.textContent = palabras.slice(0, mejor).join(' '); }
    sonda.innerHTML = '';
    if (lineas(p) < 2 || palabras.length - mejor < 1) return restaura();

    const resto = p.cloneNode(false);
    resto.textContent = palabras.slice(mejor).join(' ');
    return resto;
  };

  // Una tabla larga se parte entre páginas y repite su encabezado.
  // La hoja de registro nunca se parte: se imprime suelta.
  const partirTabla = t => {
    if (t.classList.contains('registro')) return null;
    const tb = t.querySelector('tbody');
    if (!tb || tb.rows.length < 2) return null;
    const movidas = [];
    while (!cabe() && tb.rows.length > 1) movidas.unshift(tb.removeChild(tb.lastElementChild));
    if (!movidas.length || !cabe()) { movidas.forEach(f => tb.appendChild(f)); return null; }
    // que la continuación no arranque con una sola fila suelta
    if (movidas.length === 1 && tb.rows.length > 3) movidas.unshift(tb.removeChild(tb.lastElementChild));
    const clon = t.cloneNode(false);
    const cabecera = t.querySelector('thead');
    if (cabecera) clon.appendChild(cabecera.cloneNode(true));
    const nuevoCuerpo = document.createElement('tbody');
    movidas.forEach(f => nuevoCuerpo.appendChild(f));
    clon.appendChild(nuevoCuerpo);
    return clon;
  };

  nueva();
  for (const item of [...fuente.children]) {
    const tipo = item.dataset.tipo;

    if (tipo === 'apertura') {
      if (caja.children.length) nueva();
      pagina.innerHTML = '';
      pagina.insertAdjacentHTML('beforeend', item.innerHTML);
      pagina.querySelector('.apertura').dataset.cap = item.dataset.cap;
      const f = document.createElement('div');
      f.className = 'folio';
      f.innerHTML = '<span class="folio__marca">red vínculo</span><span class="folio__num">' + folio + '</span>';
      pagina.appendChild(f);
      mapa[item.dataset.cap] = folio;
      nueva();
      continue;
    }
    if (tipo === 'salto') { if (caja.children.length) nueva(); continue; }

    let el = item.firstElementChild;
    while (el) {
      const siguiente = el.nextElementSibling;
      caja.appendChild(el);

      // un título viaja siempre con el bloque que encabeza
      if (/^H[23]$/.test(el.tagName) && cabe()) {
        const proximo = siguiente || item.nextElementSibling?.firstElementChild;
        const solido = proximo && (
          (proximo.tagName === 'TABLE' && proximo.classList.contains('registro')) ||
          /voz|practica|deflist/.test(proximo.className || ''));
        if (solido) {
          const padre = proximo.parentNode, ref = proximo.nextSibling;
          caja.appendChild(proximo);
          const juntos = cabe();
          padre.insertBefore(proximo, ref);   // se devuelve a su sitio, no se descarta
          const par = el.getBoundingClientRect().height + proximo.getBoundingClientRect().height + 24;
          if (!juntos && caja.children.length > 1 && par <= caja.clientHeight) {
            el.remove(); nueva(); caja.appendChild(el);
          }
        }
      }

      if (!cabe()) {
        const esP = el.tagName === 'P' && !el.classList.contains('cita');
        const resto = esP ? partir(el) : (el.tagName === 'TABLE' ? partirTabla(el) : null);
        if (resto) {
          nueva();
          caja.appendChild(resto);
          el = siguiente;
          continue;
        }
        caja.removeChild(el);
        if (caja.children.length === 0) { /* no cabe ni en página vacía */ }
        else nueva();
        caja.appendChild(el);
      }

      // un título nunca se queda solo al pie
      if (/^H[23]$/.test(el.tagName) && libreMM() < 26) {
        caja.removeChild(el);
        if (caja.children.length) nueva();
        caja.appendChild(el);
      }
      el = siguiente;
    }
  }

  if (!caja.children.length) libro.removeChild(pagina);

  // Red de seguridad: ninguna página puede desbordar. Se empuja el último
  // elemento a la siguiente, conservando el orden de lectura.
  const esApertura = pg => !!pg.querySelector('.apertura');
  const nuevaTras = i => {
    const pg = document.createElement('section');
    pg.className = 'pagina';
    const c = document.createElement('div');
    c.className = 'caja';
    pg.appendChild(c);
    const f = document.createElement('div');
    f.className = 'folio';
    f.innerHTML = '<span class="folio__marca">red vínculo</span><span class="folio__num"></span>';
    pg.appendChild(f);
    libro.insertBefore(pg, libro.children[i + 1] || null);
    return pg;
  };
  let empujados = 0;
  for (let i = 0; i < libro.children.length; i++) {
    const pg = libro.children[i];
    if (esApertura(pg)) continue;
    const c = pg.querySelector('.caja');
    while (c.scrollHeight > c.clientHeight && c.children.length > 1) {
      let sig = libro.children[i + 1];
      if (!sig || esApertura(sig)) sig = nuevaTras(i);
      const cs = sig.querySelector('.caja');
      cs.insertBefore(c.lastElementChild, cs.firstChild);
      empujados++;
    }
  }

  // Folios definitivos
  let n = INICIO - 1;
  for (const pg of libro.children) {
    n++;
    pg.querySelector('.folio__num').textContent = n;
    const ap = pg.querySelector('.apertura');
    if (ap) mapa[ap.dataset.cap] = n;
  }

  window.__mapa = mapa;
  window.__ultima = n;
  window.__empujados = empujados;
  window.__listo = true;
})();
</script>`;

fs.writeFileSync('src/_flujo.html', `${cabecera}</head><body style="background:#C9C1B6">
<div id="fuente" hidden>${fuente}</div>
<div id="sonda" style="position:absolute;visibility:hidden;left:-9999px"></div>
<div id="libro"></div>
${paginador}
</body></html>`);

/* ---------- 3 · paginar en el navegador ---------- */
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.resolve('src/_flujo.html')).href, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__listo === true, { timeout: 60000 });
const { mapa, ultima, paginas, empujados } = await page.evaluate(() => ({
  mapa: window.__mapa, ultima: window.__ultima, empujados: window.__empujados,
  paginas: document.getElementById('libro').innerHTML,
}));
await browser.close();

/* ---------- 4 · índice con los folios reales ---------- */
const filas = doc.chapters.map(ch => {
  const num = ch.num ? ch.num[0].toUpperCase() + ch.num.slice(1) : '';
  const sub = ch.tool ? ch.tool : (ch.num ? '' : ch.title);
  const titulo = ch.num ? ch.title : ch.kicker;
  return `<div class="indice__fila">
    <span class="indice__num">${esc(num)}</span>
    <span class="indice__tit">${esc(titulo)}${sub ? `<span class="indice__tag">${esc(sub)}</span>` : ''}</span>
    <span class="indice__pag">${mapa[ch.id]}</span>
  </div>`;
}).join('\n');

const portada = `<section class="pagina pagina--terracota portada">
  ${svg('portada', 'portada__arte')}
  <div class="caja portada">
    <img class="portada__logo" src="../assets/img/logo-blanco.png" alt="Red Vínculo">
    <div class="portada__aire"></div>
    <div>
      <hr class="portada__filete">
      <h1>Menos peleas,<br><em>no más paciencia</em></h1>
      <p class="portada__sub">Ya sabes qué mamá quieres ser. Cuatro herramientas para dejarla salir en los días difíciles.</p>
    </div>
    <div class="portada__aire--bajo"></div>
    <p class="firma"><span>Comprender</span><span>Conectar</span><span>Transformar</span></p>
  </div>
</section>`;

const indice = `<section class="pagina">
  <div class="caja">
    <p class="kicker">Menos peleas, no más paciencia</p>
    <h1 style="font-size:24pt">Índice</h1>
    <div class="indice">${filas}</div>
  </div>
  <div class="folio"><span class="folio__marca">red vínculo</span><span class="folio__num">1</span></div>
</section>`;

const contra = `<section class="pagina pagina--terracota">
  ${svg('portada', 'contra__arte')}
  <div class="caja contra">
    <img class="contra__logo" src="../assets/img/logo-blanco.png" alt="Red Vínculo">
    <p class="contra__firma"><span>Comprender</span><span>Conectar</span><span>Transformar</span></p>
    <p class="contra__web"><a href="https://redvinculo.com">redvinculo.com</a></p>
  </div>
  <p class="contra__legal">Este material brinda información general y no reemplaza el acompañamiento profesional.<br>© Red Vínculo. Todos los derechos reservados.</p>
</section>`;

fs.writeFileSync('src/libro.html', `${cabecera}
<style>
@media screen { body{background:#C9C1B6;padding:10mm 0} .pagina{margin:0 auto 8mm;box-shadow:0 2mm 6mm rgba(0,0,0,.18)} }
@page { size: 148mm 210mm; margin: 0 }
@media print {
  body { background:#fff; padding:0; margin:0 }
  .pagina { margin:0; box-shadow:none; break-after:page; page-break-after:always }
  .pagina:last-child { break-after:auto; page-break-after:auto }
}
a { color: inherit; text-decoration: none; }
</style>
</head><body>
${portada}
${indice}
${paginas}
${contra}
</body></html>`);

const total = 1 + 1 + (ultima - 1) + 1;
console.log('índice de capítulos:', JSON.stringify(mapa));
console.log('elementos reubicados por la red de seguridad:', empujados);
console.log('última página numerada:', ultima);
console.log('total de páginas del PDF:', total);
