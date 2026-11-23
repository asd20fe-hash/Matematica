# Plan: generador de ejercicios de geometría — Rectas (4to grado)
<!-- plan v1.0 — primera versión: actividad "Trazar rectas" (paralela / perpendicular / oblicua por un punto) -->

> Para pegar en Claude Code dentro del repo de la app de matemáticas.
> Leé primero `registro.js`, una actividad existente en `actividades/` y cómo se usa el global `MATE`, y seguí exactamente ese mismo patrón.

## 1. Objetivo

Una actividad nueva para el hijo de 4to que repasa lo que vieron en la carpeta (hojas 70–71 y la fotocopia "Trazá las rectas indicadas"):

- Ya hay **una recta dibujada** (con nombre en MAYÚSCULA) y **varios puntos** (con nombre en minúscula).
- La consigna pide trazar una recta nueva **paralela, perpendicular u oblicua** a la dada **que pase por un punto específico**.
- El chico dibuja la recta **arrastrando con el dedo o el mouse**, después la **mueve y la gira** hasta que pase por el punto, y toca **Comprobar**.
- Al acertar, elige la notación correcta: `N // R`, `N ⊥ R` o `N ∠ R` (los mismos símbolos que usa la fotocopia de la escuela).

## 2. Ubicación y arquitectura (respetar las convenciones del repo)

- Carpeta: `actividades/geometria-rectas/index.html` (un solo archivo con el HTML, el CSS y el JS juntos; sin build y sin ES modules).
- Se registra en `registro.js` como un ítem más del menú (sección 4to grado, título "Rectas: paralelas, perpendiculares y oblicuas").
- Usar `MATE` para el perfil, el tema (modo oscuro obligatorio, que respete el tema global), la versión y el store de resultados.
- Versión de la actividad: `const VERSION = '1.0'`, que se ve en el pie de la pantalla y en los logs de consola (`[geometria-rectas v1.0] ...`).
- Las referencias internas van sin versión en el nombre (`index.html`, no `index_v1.0.html`).

## 3. Pantalla

De arriba hacia abajo (en el celular todo en columna; en la PC lo mismo, con el tablero más ancho):

1. Barra: título, contador `✔ aciertos / rondas`, botón para volver al menú.
2. **Consigna** grande: "Trazá la recta **N** paralela a **R** que pase por el punto **c**."
3. Una ayuda chica: "Arrastrá para dibujar. Movela desde el medio, girala desde las puntas."
4. **Tablero SVG** con fondo cuadriculado de cuaderno, que ocupa el resto del alto (`touch-action: none`).
5. Zona de feedback (las dos comprobaciones con ✔/✘).
6. Botones: **Borrar**, **Pista**, **Comprobar** y **Siguiente** (este último activo solo después de acertar la recta y la notación).

Los botones tienen que medir al menos 44 px de alto; el texto tiene que ser grande y legible para un chico de 10 años.

## 4. Generador de rondas (`generarRonda()`)

Todo es aleatorio, pero con controles para que el ejercicio siempre se pueda resolver dentro del tablero.

- **Tipo**: se saca de una "bolsa" mezclada con `['paralela','perpendicular','oblicua']` que se rellena al vaciarse (así no se repite mucho el mismo tipo). Más adelante se puede ponderar hacia el tipo que más le cueste según las estadísticas.
- **Recta dada**: ángulo al azar entre −40° y 40° (75 % de las veces) o empinada, entre ±55° y ±80° (25 %). Pasa por un punto central (35–65 % del ancho, 38–62 % del alto) y se recorta a los bordes con un margen de 25 px. Su etiqueta va cerca del extremo derecho, corrida hacia afuera de la recta.
- **Nombres**: dos mayúsculas distintas para la recta dada y la nueva (evitar I, O y Q), y minúsculas para los puntos (evitar i, l, o y j).
- **Punto objetivo**: a una distancia de entre 70 px y el 32 % del lado menor de la recta, del lado que salga al azar, y dentro del tablero con un margen de 55 px. Para la perpendicular, el pie de la perpendicular también tiene que caer adentro.
- **Puntos distractores**: 2, a más de 45 px de la recta y a más de 110 px de los otros puntos. Así el chico tiene que **leer la letra** y no puede ir al único punto que hay.
- Si algo no cumple las condiciones, se reintenta (hasta 200 veces).
- **Ejercicio tipo fotocopia (fase 2)**: en una misma ronda, varias rectas encadenadas: "D ⊥ R por p", "E // R por q", "S // M por m" (la recta de referencia de un paso es la que el chico dibujó en el paso anterior).

## 5. Interacción (pointer events, sirve para dedo y mouse)

- Las coordenadas se convierten con `svg.getScreenCTM().inverse()`. Las tolerancias se definen en **píxeles de pantalla** y se pasan a unidades del viewBox (`px(n) = n / getScreenCTM().a`), para que se sientan igual en el celular y en la PC.
- `pointerdown`:
  - a menos de `px(26)` de una punta → **girar** desde esa punta (la otra queda fija);
  - a menos de `px(22)` del cuerpo de la recta → **mover** (traslación);
  - en otro lugar → **dibujar una recta nueva** (reemplaza la anterior).
- `pointerup`: si la recta nueva mide menos de `px(30)`, se descarta (fue un toque, no un trazo).
- El trazo del chico se dibuja sólido, con una **extensión punteada** hasta los bordes ("la recta no tiene principio ni fin"). Esto además ayuda a ver si pasa por el punto.
- Las puntas tienen manijas circulares visibles. La etiqueta de la recta nueva va cerca de una punta.
- Usar `setPointerCapture` y limitar los puntos al tablero.

## 6. Corrección (`comprobar()`)

- `d` = diferencia de ángulo entre las dos rectas, llevada a [0°, 90°].
- `dist` = distancia del punto objetivo a la recta **infinita** del chico.

| Tipo | Dirección OK si |
|---|---|
| paralela | `d ≤ 6°` |
| perpendicular | `|d − 90| ≤ 6°` |
| oblicua | `15° ≤ d ≤ 75°` |

- El punto está OK si `dist ≤ px(12)`.
- Se muestran **las dos comprobaciones por separado**, con mensajes pensados para un chico:
  - "✘ Esa recta es perpendicular, y te pedí paralela. Las paralelas nunca se cortan."
  - "✘ Todavía no forma 4 ángulos rectos (como la esquina de la escuadra)."
  - "✘ Parece paralela. Una oblicua tiene que cortar a R sin formar ángulos rectos."
  - "✘ Pasa por el punto **q**, pero te pedí el punto **c**." (si pasa por un distractor)
  - "✘ No pasa por el punto c. Arrastrala desde el medio para acercarla."
- **Al acertar**: si es perpendicular, se marca el cuadradito del ángulo recto en la intersección; se bloquea la edición y aparece la **pregunta de notación** con 3 botones en orden aleatorio (`N // R`, `N ⊥ R`, `N ∠ R`). Si elige mal, se le explica el símbolo y vuelve a intentar.

## 7. Pista

- Hace titilar el punto objetivo durante unos 2 segundos.
- Muestra en una esquina un segmento guía punteado con **la inclinación correcta**, pero que NO pasa por el punto: "Copiá esta inclinación y llevala hasta el punto c". Para la oblicua, la guía va a 45° de R.
- Cuenta cuántas pistas se usaron en la ronda.

## 8. Datos y estadísticas (con `MATE` y el store del perfil)

Por ronda se guarda: `{fecha, tipo, angRef, intentos, pistas, tiempoMs, aciertoPrimera, errores:[{dirección|punto|puntoIncorrecto|notación}]}`.
El informe solo aparece en la sección de configuración, como ya funciona en el resto de la app: % de aciertos a la primera por tipo, tiempo medio y error más frecuente.

## 9. Fases

1. **v1.0** — Lo descripto en las secciones 3 a 7: una recta por ronda, los tres tipos, notación, pista y modo oscuro.
2. **v1.1** — Guardado de estadísticas (sección 8) y bolsa de tipos ponderada hacia el que más le cuesta.
3. **v1.2** — Modo "fotocopia": consignas encadenadas (D, M, E, S) como en la hoja de la escuela.
4. **v1.3 (opcional)** — Hoja imprimible generada con la misma semilla (recta + puntos + consignas), para practicar en papel con regla y escuadra.

## 10. Criterios de aceptación (que Claude Code los verifique)

- [ ] Aparece en el menú desde `registro.js` y abre sin errores de consola.
- [ ] Se puede dibujar, mover y girar con el mouse y con el touch (probar en el emulador móvil de Chrome DevTools).
- [ ] 100 rondas generadas en un loop de prueba: todos los puntos quedan dentro del tablero, el pie de la perpendicular cae adentro y los distractores están a más de 110 px entre sí.
- [ ] Hay tests de la función `comprobar()` con casos límite: 5,9° / 6,1°, 84° / 96°, 14° / 16°, y distancia 11 / 13 px.
- [ ] Las rectas usan mayúscula y los puntos minúscula en todas las consignas y etiquetas.
- [ ] Se ve bien en modo oscuro y en modo claro, a 360 px de ancho y en la PC.
- [ ] La versión aparece en el pie y en los logs.
