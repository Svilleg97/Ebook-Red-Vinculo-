# Prompt de producción: ebook Red Vínculo

Actúa como diseñador editorial senior. Diseña y produce el ebook de Red Vínculo
en HTML + CSS de impresión, renderizado a PDF con Puppeteer.

## Marca

Brandbook: `Brandbook Red Vinculo.png`, dentro de la carpeta del proyecto

Paleta cerrada, sin colores fuera de esta lista:

| Rol | Hex |
|---|---|
| Primario terracota | #A8563F |
| Terracota claro (segundo tono del logo) | #D28C72 |
| Arena | #EADCC8 |
| Café tinta (texto) | #3F342E |
| Salvia (acento secundario) | #8FA48E |
| Hueso (fondo de página) | #F7F4EF |

Tono: cálida, serena, confiable, profunda, humana.
Voz: español de Colombia, profesional pero cercana, sin tecnicismos innecesarios.
Tagline: Comprender, Conectar, Transformar.
Recursos gráficos permitidos: rama de línea, círculos superpuestos, onda,
retícula de puntos, iconos de línea (vínculos, comprender, crecer, hogar, presencia).

Logos: `Logo.png` (horizontal) y `Icono.png`.
Ambos traen artefactos de recorte (píxeles amarillos y rojos sueltos).
Limpiarlos con Pillow antes de usarlos: mapear cada píxel opaco al tono de marca
más cercano y conservar la transparencia. Versión en blanco para fondos terracota.

## Contenido

Fuente única: `Menos_peleas_no_mas_paciencia_v7.docx.txt` (6.851 palabras).
No se reescribe, no se resume, no se agrega contenido nuevo.
Solo se permite normalización tipográfica: reconstruir las tablas que el docx
exportó rotas, reemplazar los separadores de punto medio por listas o saltos de
línea, y unificar comillas.

Prohibido inventar estadísticas, estudios, citas de autores o testimonios.
Los datos legales y las rutas de ayuda del capítulo siete se transcriben literal.

Título: Menos peleas, no más paciencia
Subtítulo: Ya sabes qué mamá quieres ser. Cuatro herramientas para dejarla salir en los días difíciles.
Público: mamás colombianas de 25 a 46 años, con hijos de 0 a 13 años.

## Estructura

1. Portada
2. Índice, primera página con folio
3. Antes de empezar
4. Capítulo uno: Las tres razones por las que no te funcionó
5. Capítulo dos, Herramienta 1: El Mapa de los Siete Días, más hoja de registro imprimible
6. Capítulo tres, Herramienta 2: Los Quince Minutos que No se Negocian
7. Capítulo cuatro, Herramienta 3: La Reparación
8. Capítulo cinco, Herramienta 4: Las Rutinas Ancla, más las cinco ventanas comunes
9. Capítulo seis: Cuando hay otro adulto en la casa
10. Capítulo siete: Lo que este libro no resuelve, más rutas de ayuda en Colombia
11. Para cerrar: los próximos catorce días
12. Hoja de referencia: todo en una página
13. Contraportada

Sin llamado a la acción comercial. Sin links de venta.

## Sistema de diseño

Formato: A5 vertical, 148 x 210 mm, pensado para pantalla de celular, computador
y tablet. Misma proporción que A4, así que las páginas imprimibles escalan limpio.

Márgenes: 16 mm laterales, 15 mm superior, 18 mm inferior.
Tipografía:
- Títulos: Fraunces (sustituto libre de Recoleta)
- Cuerpo: Lora
- Etiquetas, tablas, folios y numeración: Mulish
Fuentes descargadas localmente e incrustadas en el PDF, sin llamados a internet.

Escala: H1 de apertura 34pt, H2 20pt, H3 14pt, cuerpo 11.5pt con interlínea 1.62,
citas destacadas 17pt en itálica terracota, tablas 10pt, folios 8pt.
Medida de 52 a 58 caracteres por línea. Sin viudas ni huérfanas.
Contraste mínimo AA en todo texto, en especial sobre fondo terracota.

Componentes:
- Apertura de capítulo a página completa, con ilustración, número en palabra y título
- Caja de práctica sobre fondo arena
- Tabla editorial con cabecera terracota y filas alternas
- Cita destacada con filete corto terracota
- Frase de guion, la que la mamá dice en voz alta, en bloque diferenciado
- Hoja de registro con filas vacías para llenar a mano
- Folio con nombre de marca discreto

Reglas de estilo, según las preferencias del cliente:
- Sin raya larga, sin raya media, sin punto medio en el texto redactado
- El separador de la firma Comprender, Conectar, Transformar es la única excepción
- Sin secciones numeradas tipo 01 02 03 en la ornamentación
- Sin texto en versalitas espaciadas usado como recurso decorativo repetido
- Nada de plantilla genérica ni layouts simétricos repetidos página tras página

## Ilustraciones

SVG vectoriales propios, trazo de línea en terracota, coherentes con la
iconografía del brandbook. Sin fotografías. Una apertura por capítulo:

1. La escalera de la rabia, escalones ascendentes con una figura a media subida
2. Retícula de siete días con una franja marcada, la ventana
3. Dos figuras sentadas en el piso dentro de un círculo de tiempo protegido
4. Dos lazos del logo que se separan y vuelven a entrelazarse
5. Onda con puntos de anclaje fijos y repetidos
6. Dos círculos superpuestos con un tercero pequeño
7. Rama abierta hacia una puerta, idea de pedir ayuda

## Producción

- Estructura en `~/Desktop/Ebook Red Vinculo/`: `src/` con HTML y CSS,
  `assets/fonts`, `assets/img`, `scripts/render.mjs`, `out/`, `preview/`
- Render con puppeteer-core apuntando al Chrome instalado, sin descargar Chromium
- PDF con `printBackground: true`, fuentes incrustadas, metadatos completos
- Entrega: PDF final, fuente editable y previews en PNG
- No se publican artefactos, todo queda como archivo local

## Flujo

1. Preparar assets y limpiar logos
2. Normalizar el texto y armar el mapa de páginas
3. Construir el sistema de diseño en CSS
4. Dibujar las ilustraciones
5. Entregar preview en PNG de portada, apertura de capítulo y página de texto con tabla, y esperar visto bueno
6. Maquetar el libro completo
7. Renderizar el PDF y revisar cortes de página
8. Checklist final: índice coincide con folios, sin texto huérfano, contraste,
   tablas completas, rutas de ayuda intactas, peso del archivo razonable
