# Rectas: paralelas, perpendiculares y oblicuas (geometría de 4to)

Hay una recta dada (MAYÚSCULA) y varios puntos (minúscula). La consigna pide trazar la recta nueva paralela, perpendicular u oblicua a la dada por un punto. El chico la dibuja arrastrando, la mueve desde el medio y la gira desde las puntas, y toca Comprobar. Cuando acierta, elige la notación (`N // R`, `N ⊥ R`, `N ∠ R`). Desde la v1.1.0 hay también un **modo hoja** ("fotocopia") con consignas encadenadas. Plan original: `docs/4to-geometria-rectas/plan_v1.0.md` (su "v1.2" es la fase 3 = la v1.1.0 de la actividad).

## Archivos

- `rectas-logica.js` (`REF4_RECTAS`, UMD, sin DOM): geometría (`difAng`, `distRecta`, `recortar`, `cruce`), `bolsa` de tipos (con pesos), `generar(az, W, H, {nivel, tipo, usados})`, `comprobar(ej, linea, tolDist)`, `notaciones`, `guia` (pista), `solucion` (debug y pruebas) y `estadisticas(eventos)`. Modo hoja: `generarHoja(az, W, H, {nivel, tipoExtra})`, `pasoHoja(hoja, i, lineas)` (arma el ejercicio del paso i con la forma de `generar`, para `comprobar`/`guia`/`solucion`) y `consignaHoja(paso)` ("D ⊥ R por p"). Pruebas en `tests/refuerzo-4to/test-rectas.js`.
- `rectas.js`: la interfaz, con `REF4_UI.base`. Tablero SVG con `viewBox` = tamaño real del tablero al empezar cada ejercicio (1 unidad ≈ 1 px). Las tolerancias van en px de pantalla con `px(n) = n / getScreenCTM().a`.
- Luna 3D de fondo, como en todas las de Ian (`bloques3d.js`, `luna3d.js`).

## Reglas

- **Dirección:** `d` = diferencia de ángulo llevada a [0°, 90°]. Paralela si `d ≤ 6°`, perpendicular si `|d − 90| ≤ 6°`, oblicua si `15° ≤ d ≤ 75°`. **Punto:** distancia del objetivo a la recta infinita del chico ≤ 12 px de pantalla.
- **Pointer:** a menos de 26 px de una punta gira (la otra queda fija), a menos de 22 px del segmento la mueve, y en otro lugar dibuja una recta nueva. Un trazo de menos de 30 px es un toque y deja la recta de antes.
- **Generador:** objetivo a 70 px … 32 % del lado menor (al menos 85), con 55 px de margen; el pie de la perpendicular queda adentro. Los distractores están a más de 45 px de la recta, a más de 110 px entre sí y a más de 40 px de la recta respuesta. Reintenta hasta 200 veces.
- **Letras:** para las rectas, mayúsculas sin I, O ni Q. Para los puntos, solo `a b d e f g h m n q r t`: en Fredoka c/C, s/S, p/P, x/X, etc. se ven iguales, y nunca la misma letra que una recta.
- **Niveles (nivelMax 3):** 1 = recta casi acostada (±25°) y 1 distractor; 2 = ±40° o empinada 25 % y 2 distractores; 3 = empinada 50 % y 3 distractores. Ronda = 5 rectas; las estrellas cuentan las bien a la primera.
- **Bolsa:** los tres tipos mezclados. El que tuvo < 80 % a la primera en los últimos 14 días (con al menos 3 intentos) va doble.

## Modo hoja ("fotocopia", v1.1.0)

- Botón **📄 Hoja / ✏️ De a una** en la cabecera; el modo queda en `mate.<perfil>.4to-geometria-rectas.modo` (`'una'` por defecto). Con debug, `?modo=hoja`.
- Una hoja = una ronda: R y 3 pasos (nivel 1) o 4 (niveles 2 y 3, con 1 o 2 puntos de más), todos sobre el mismo tablero (el `viewBox` se fija al armar la hoja). Están siempre los tres tipos; el que falta sale de la bolsa ponderada.
- Pasos 1 y 2 sobre R (el 1 nunca oblicua); los siguientes **encadenados**: su referencia es la recta que **trazó el chico** (`S.lineas[j]`, la suya, no la ideal), como en papel.
- **Solo se encadena sobre paralelas y perpendiculares trazadas a R.** La oblicua del chico puede tener cualquier inclinación (15–75°) y encadenar sobre una encadenada suma las torceduras (6° + 6°): con eso el punto llegaba a quedar a 25 px de su referencia. El punto de un encadenado queda a 150 px como máximo (a lo largo de la referencia) del punto por el que pasa esa recta, y así el peor caso aceptado (5,9°, 11,9 px) lo deja a más de 35 px.
- Puntos a más de 95 px entre sí, a más de 45 px de R y a más de 58 px de las rectas ideales de los pasos; la respuesta de cada paso no pasa a menos de 40 px de otro punto.
- Tablero chico (340×300, celular acostado): primero saca los puntos de más y después baja a 3 pasos (`hoja.recortada`). Desde 360×380 la hoja sale completa.
- Las consignas van **con el símbolo** ("K // S por d"), en fichas; no hay pregunta de notación porque leer el símbolo es el ejercicio. Si confunde el tipo se le explica el símbolo. Las rectas hechas quedan enteras en verde azulado con su nombre (y el ángulo recto); la referencia del paso actual va más gruesa y su nombre en el color de acento.

## Eventos

- `paso:'trazar'`, `tema` = tipo, `item:{id:'<ronda>-<i>', tipo, angRef, punto, ref, nueva}`, `esperado:'perpendicular por c'`, `respuesta:'oblicua por q (52.3°, a 40 px)'`, `error`, `ms`, `ayuda`, `pistas`.
- En la hoja, `item` suma `modo:'hoja'`, `paso` (1…4) y `encadenada`; `angRef` es el de la referencia real (la del chico si es encadenada).
- `paso:'notacion'` (`error: NOTACION`, solo de a una) y `paso:'pista'` (`intento: 0`).
- Códigos: `CONFUNDE_TIPO` (trazó otro de los tres tipos), `INCLINACION` (zona dudosa: 6–15° o 75–84°), `PUNTO_EQUIVOCADO` (pasa por un distractor), `NO_PASA_PUNTO`, `NOTACION`. Si fallan la dirección y el punto a la vez, gana la dirección. Los nombres están en el registro y en `REF4_PANEL.ERRORES`.
- Al cerrar cada ronda se guarda `mate.<perfil>.4to-geometria-rectas.resumen` (`estadisticas()`): % a la primera y tiempo medio por tipo, y el error más frecuente. Lo muestra `stats()` en Ajustes de padres.

## Debug

`?debug=1&seed=N`, más `&nivel=N` y `&tipo=paralela|perpendicular|oblicua`. `&modo=hoja`. `window.__ref4`: `estado()` (con `modo`, `hoja`, `lineas`), `trazar(a, b)`, `resolver()`, `comprobar()`, `elegir(tipo)`, `siguiente()`.

## Pendiente (fases del plan)

- Fase 4 del plan (opcional): hoja imprimible con la misma semilla (podría salir de `generarHoja`).
- Sin probar con el dedo en una tablet de verdad: el modo hoja se probó en Chrome headless (1024×800 y 375×740, claro y oscuro) resolviendo con `__ref4`.
