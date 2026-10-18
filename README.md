# Generador de puzles · SVG para láser

Genera puzles para corte láser en un único color. Todo ocurre en el navegador.

- **Tipos de pieza**: clásica (con lengüetas), recta, ondulada, hexagonal, hexagonal recta y triangular.
- **Tamaño** (ancho × alto en mm) y **número de piezas** (aproximado; columnas y filas se pueden fijar a mano).
- **Marco y base** opcionales: el marco es un anillo alrededor del puzle (comparte el corte exterior con él) y la base es una placa del mismo tamaño total.
- Semilla para repetir o cambiar el reparto, tamaño de lengüeta, irregularidad, amplitud de la onda, esquinas redondeadas, color y grosor de línea.
- Cada línea de corte aparece **una sola vez** (sin duplicar bordes compartidos).

## SVG
Medidas en mm, sin transformaciones ni texto. Un único grupo `corte` con los trazados `contorno`, `cortes` (interiores), y opcionalmente `marco` y `base`.

## Desarrollo
```
npm test
```
Sin dependencias. Publicación: GitHub Pages → rama `main`, carpeta `/docs`.
