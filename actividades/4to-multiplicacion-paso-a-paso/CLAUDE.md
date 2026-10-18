# Multiplicación paso a paso (4to)

La cuenta "parada" de la carpeta, interactiva como la división paso a paso: se multiplica cifra por cifra desde las unidades, se anota, se lleva (la reserva chiquita arriba) y, con dos cifras en el multiplicador, la segunda fila empieza con un 0 y al final se suman las filas.

## Archivos

- `multiplicacion-logica.js` (`REF4_MULMOTOR`, UMD, sin DOM): generador, la cuenta resuelta (`filas`), el plan de pasos (`planDe`), `responder`, `revisar`/`corregir` (nivel 4), pistas, `vista` (lo que hay escrito) y `borrador` / `cuentita` (lo que se calcula de cabeza).
- `multiplicacion.js`: interfaz (dibujo de la cuenta en el cuaderno cuadriculado de `comun.css`, teclado, globo, ronda y resumen). Changelog al principio.
- Pruebas: `tests/refuerzo-4to/test-multiplicacion.js` (se corren con `node tests/refuerzo-4to/run.js`).

## Niveles

| Nivel | Cuentas | Pasos por columna | Además |
|---|---|---|---|
| 1 | 2-3 cifras × 1 cifra, 3 por ronda | Multiplico (`mult`), sumo lo que me llevo (`sumo`), anoto, me llevo | Borrador "De cabeza" y barra de pasos |
| 2 | 3-4 cifras × 1 cifra (30 % con un 0 en el medio), 2 por ronda | `columna` (multiplico y sumo juntos), anoto, me llevo | Borrador y barra |
| 3 | 2-3 cifras × 2 cifras, 2 por ronda | Anoto y me llevo (de cabeza) | Estimación de cifras, el 0 de la segunda fila (`cero`), suma de las filas (`suma`) |
| 4 | 3-4 cifras × 2 cifras, 1 por ronda | Como el 3, sin corregir | "Revisar mi cuenta" marca el primer error y "Corregir desde acá" corta las respuestas |

En los niveles 1 y 2 la última cifra de la fila se anota sola (es el número que ya calculó). En los 3 y 4 se pide entera ("anotás el 20").

## Errores

`TABLA` (el producto), `RESERVA` (no sumó lo que se llevaba, se llevó mal o anotó solo las unidades en la última cifra), `ANOTO_TODO` (anotó el número de dos cifras sin llevarse), `CERO_OMITIDO` (el 0 de la segunda fila), `SUMA` (suma de las filas) y `ESTIMACION` (control). Los nombres para padres están en `REF4_PANEL.ERRORES`.

Los eventos de paso llevan `fila` y `col` (desde las unidades), `item: {a, d, hecho}` con `d` = multiplicador y `hecho` = "f×x" (cifra del multiplicador × cifra del multiplicando). El generador usa `REF4_EV.pesosHechos` para que salgan más las cifras de los hechos que fallaron o tardaron.

## Debug

`?debug=1&seed=N&nivel=N` y `window.__ref4` (`estado()`, `responder(v)`, `motor()`).
