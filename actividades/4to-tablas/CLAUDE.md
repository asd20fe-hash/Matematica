# Tablas de multiplicar (4to)

Dos pestañas:

- **🧠 Memorizar:** se elige una tabla (2 a 10) y un tiempo para mirarla (15, 30 o 60 s, en `mate.<perfil>.4to-tablas.segs`). La tabla aparece entera y centrada; al terminar el tiempo (o con "¡Ya me la sé!") se borronean todas las filas menos una, que queda como "7 × 8 = ☐" en su mismo lugar. Se pregunta cada una en orden al azar. Bien: se ve en verde y sigue. Mal: pista en el globo; la segunda vez se muestra la respuesta y vuelve al final de la cola (una vez). El resumen pinta cada cuenta por velocidad (rápida < 3 s, lenta ≥ 6 s, errada) y ofrece "Repasar las difíciles" (las erradas y las lentas, con 15 s de mirada como máximo; esos repasos no se guardan como vuelta).
- **🔢 Tabla pitagórica** (`pitagorica.js`, `REF4_PITA.montar`): tocar una casilla marca el camino de la fila y la columna y su gemela (7 × 8 y 8 × 7); tocar un número del borde marca toda la tabla y ofrece practicarla; "Ocultar resultados" y "Cuadrados". No registra eventos.

## Archivos y datos

- `tablas-logica.js` (`REF4_TABLAS`, UMD): orden al azar, `clasificar` (`SUMO_EN_VEZ` o `TABLA`, con pista), `resumir`, historial (`guardar`, `estadoTabla`). Pruebas en `tests/refuerzo-4to/test-tablas.js`.
- `tablas.js`: interfaz. Usa `REF4_UI.base` (registro, debug, cabecera) con `nivelMax: 1`.
- Eventos: `{tipo:'paso', paso:'tabla', tema:'tabla7', intento, item:{tabla, q, hecho:'7x8'}, esperado, respuesta, ok, error, ms}`; `ms` es desde que aparece la pregunta hasta la respuesta. El tiempo de mirada va como `paso:'memorizar'` con `intento: 0`. Los hechos alimentan el ranking de más errados y más lentos del panel de padres.
- Historial: `mate.<perfil>.4to-tablas.historial` = `{7: [{fecha, prom, pct, ms:{q:ms}, mal:[q], todas}]}` (las últimas 12). El botón de cada tabla muestra el último promedio y ⭐ si salió toda bien y rápida.

## Debug

`?debug=1&seed=N` y `window.__ref4` (`estado()`, `memorizar(t, solo)`, `preguntar()`, `responder(v)`).
