# Menos peleas, no más paciencia
Ebook de Red Vínculo. 58 páginas, A5 vertical (148 x 210 mm), pensado para leer en pantalla.

## El archivo final

`out/Menos-peleas-no-mas-paciencia.pdf`

Fuentes incrustadas, enlaces activos, metadatos completos, 1,5 MB.

## Para cambiar algo

Todo se regenera con comandos. No hay que tocar el PDF a mano.

| Qué querés cambiar | Dónde | Después corré |
|---|---|---|
| Un color, un tamaño de letra, un margen | `src/estilos/tokens.css` | `npm run libro` |
| Un componente (tabla, cita, caja de práctica) | `src/estilos/libro.css` | `npm run libro` |
| Una ilustración | `scripts/ilustraciones.py` | `python3 scripts/ilustraciones.py` y luego `npm run libro` |
| El texto del libro | `Menos_peleas_no_mas_paciencia_v7.docx.txt` | `npm run texto` y luego `npm run libro` |

`npm run libro` maqueta y genera el PDF. `npm run qa` corre los 14 controles.

## Estructura

- `src/libro.html` el libro completo, se abre en cualquier navegador
- `src/estilos/` las fichas de diseño y el sistema editorial
- `assets/fonts/` Fraunces, Lora y Mulish, en local
- `assets/img/` los logos limpios, en color y en blanco
- `assets/svg/` las once ilustraciones
- `content/libro.normalizado.json` el contenido estructurado
- `scripts/` el parser, el maquetador, el renderizador y el control de calidad
- `preview/` los pliegos de contacto para revisar

## Decisiones que quedaron tomadas

- Recoleta es de pago, se sustituyó por **Fraunces** con suavidad al máximo y tamaño óptico 20, que es lo más cercano libre. Cuerpo en **Lora**, apoyos en **Mulish**.
- La numeración arranca en el índice. Portada y contraportada no llevan folio.
- La hoja de registro nunca se parte entre páginas: se imprime suelta.
- La tabla de rutas sí se parte, y repite su encabezado.
- La Línea 106 aparece como servicio de Bogotá, en la tabla y en la nota de cierre.
