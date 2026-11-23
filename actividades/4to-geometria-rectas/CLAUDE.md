# Rectas: paralelas, perpendiculares y oblicuas (geometría de 4to)

Hay una recta dada (MAYÚSCULA) y varios puntos (minúscula). La consigna pide trazar la recta nueva paralela, perpendicular u oblicua a la dada por un punto. El chico la dibuja arrastrando, la mueve desde el medio y la gira desde las puntas, y toca Comprobar. Cuando acierta, elige la notación (`N // R`, `N ⊥ R`, `N ∠ R`). Plan original: `docs/4to-geometria-rectas/plan_v1.0.md`.

## Archivos

- `rectas-logica.js` (`REF4_RECTAS`, UMD, sin DOM): geometría (`difAng`, `distRecta`, `recortar`, `cruce`), `bolsa` de tipos (con pesos), `generar(az, W, H, {nivel, tipo, usados})`, `comprobar(ej, linea, tolDist)`, `notaciones`, `guia` (pista), `solucion` (debug y pruebas) y `estadisticas(eventos)`. Pruebas en `tests/refuerzo-4to/test-rectas.js`.
- `rectas.js`: la interfaz, con `REF4_UI.base`. Tablero SVG con `viewBox` = tamaño real del tablero al empezar cada ejercicio (1 unidad ≈ 1 px). Las tolerancias van en px de pantalla con `px(n) = n / getScreenCTM().a`.
- Luna 3D de fondo, como en todas las de Ian (`bloques3d.js`, `luna3d.js`).

## Reglas

- **Dirección:** `d` = diferencia de ángulo llevada a [0°, 90°]. Paralela si `d ≤ 6°`, perpendicular si `|d − 90| ≤ 6°`, oblicua si `15° ≤ d ≤ 75°`. **Punto:** distancia del objetivo a la recta infinita del chico ≤ 12 px de pantalla.
- **Pointer:** a menos de 26 px de una punta gira (la otra queda fija), a menos de 22 px del segmento la mueve, y en otro lugar dibuja una recta nueva. Un trazo de menos de 30 px es un toque y deja la recta de antes.
- **Generador:** objetivo a 70 px … 32 % del lado menor (al menos 85), con 55 px de margen; el pie de la perpendicular queda adentro. Los distractores están a más de 45 px de la recta, a más de 110 px entre sí y a más de 40 px de la recta respuesta. Reintenta hasta 200 veces.
- **Letras:** para las rectas, mayúsculas sin I, O ni Q. Para los puntos, solo `a b d e f g h m n q r t`: en Fredoka c/C, s/S, p/P, x/X, etc. se ven iguales, y nunca la misma letra que una recta.
- **Niveles (nivelMax 3):** 1 = recta casi acostada (±25°) y 1 distractor; 2 = ±40° o empinada 25 % y 2 distractores; 3 = empinada 50 % y 3 distractores. Ronda = 5 rectas; las estrellas cuentan las bien a la primera.
- **Bolsa:** los tres tipos mezclados. El que tuvo < 80 % a la primera en los últimos 14 días (con al menos 3 intentos) va doble.

## Eventos

- `paso:'trazar'`, `tema` = tipo, `item:{id:'<ronda>-<i>', tipo, angRef, punto, ref, nueva}`, `esperado:'perpendicular por c'`, `respuesta:'oblicua por q (52.3°, a 40 px)'`, `error`, `ms`, `ayuda`, `pistas`.
- `paso:'notacion'` (`error: NOTACION`) y `paso:'pista'` (`intento: 0`).
- Códigos: `CONFUNDE_TIPO` (trazó otro de los tres tipos), `INCLINACION` (zona dudosa: 6–15° o 75–84°), `PUNTO_EQUIVOCADO` (pasa por un distractor), `NO_PASA_PUNTO`, `NOTACION`. Si fallan la dirección y el punto a la vez, gana la dirección. Los nombres están en el registro y en `REF4_PANEL.ERRORES`.
- Al cerrar cada ronda se guarda `mate.<perfil>.4to-geometria-rectas.resumen` (`estadisticas()`): % a la primera y tiempo medio por tipo, y el error más frecuente. Lo muestra `stats()` en Ajustes de padres.

## Debug

`?debug=1&seed=N`, más `&nivel=N` y `&tipo=paralela|perpendicular|oblicua`. `window.__ref4`: `estado()`, `trazar(a, b)`, `resolver()`, `comprobar()`, `elegir(tipo)`, `siguiente()`.

## Pendiente (fases del plan)

- v1.2: modo "fotocopia", con consignas encadenadas (D ⊥ R por p, E // R por q, S // M por m), donde la recta de referencia es la que el chico trazó antes.
- v1.3 (opcional): hoja imprimible con la misma semilla.
