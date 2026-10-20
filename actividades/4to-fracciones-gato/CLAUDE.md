# El gato come fracciones (4to)

Michi es un gato que come fracciones. Usa el marco común `REF4_FRUI.actividad` (rondas de 6, 3 niveles, eventos, "Me perdí", 🔊, "¿Qué aprendiste?").

## Tipos de ítem (`gato-logica.js`, `REF4_GATO`, UMD y puro)

- **come:** Michi pide fracciones que valen un número (1, 1/2, 2, 3/4…). Se tocan las fichas: las equivalentes vuelan a su boca; las otras las escupe con una pista. Los distractores salen de errores típicos: sumar lo mismo arriba y abajo (`EQUIV_SUMA`), dar vuelta (`INVERTIDA`), una parte de más o de menos (`SE_PASA`/`NO_LLEGA`), multiplicar distinto (`EQUIV_MAL_ESCALADA`). Cada toque es un evento `paso:'come'` con `intento: 1`.
- **entero:** "Michi durmió 4/4 de hora": ¿cuántas horas? (`CUENTA_PARTES` si contesta el de arriba).
- **queda:** "compró una sandía y comió 1/2": ¿qué parte queda? Vale cualquier equivalente (`RESPONDE_EL_DATO`, `INVERTIDA`). En el nivel 3 a veces son 2 enteros.
- **simple:** "comió 2/4": escribilo con medios, 2/4 = ?/2.
- **mixto:** "tomó 7/4 litros": enteros y fracción (1 3/4); si escribe una fracción que vale lo mismo sin enteros, la pista lo dice.
- **junta:** 1/2 + 2/4 (`OPERA_DENOMINADORES` si suma los de abajo).

Niveles: el 1 usa medios, tercios y cuartos (y tiras siempre a la vista); el 2 suma mixto y junta; el 3 llega a dieciseisavos. Pruebas en `tests/fracciones-4to/test-gato.js`.

## Interfaz (`gato.js`)

Michi y su dueño son de bloques en 3D (`gato3d.js`, `REF4_GATO3D`: `montar`, `estado`, `boca`): un solo renderer, y `montar` mueve el mismo canvas cada vez que se repinta. Sin three.js o WebGL queda el emoji. La cara de Michi cambia sin volver a pintar (`cara()`), así no se borra lo que el chico está escribiendo. Debug: `?debug=1&seed=N&nivel=N&tipo=come` y `window.__fr`.
