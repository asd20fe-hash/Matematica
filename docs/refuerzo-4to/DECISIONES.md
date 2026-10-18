# Decisiones — refuerzo de 4to

Registro de decisiones tomadas sin consultar, siguiendo la regla "manda el repo". Cada una dice qué se decidió, por qué y qué alternativa se descartó.

## 1. API real del repo (reconocimiento)

El prompt usa nombres ilustrativos. La API real, leída en `core/core.js`, `actividades/registro.js` y `index.html`:

| Tema | API real |
|---|---|
| Registrar una actividad | Entrada en `MATE.actividades` (`actividades/registro.js`): `{id, titulo, descripcion, icono, perfiles:[ids], ruta, version, stats?}`. `ruta` es relativa a la raíz. El menú del shell filtra por `perfiles`. |
| Perfil / grado | `MATE.perfiles` (`perfiles.js`): Ian es el de 4to (`id:'ian'`). Las actividades nuevas van con `perfiles:['ian']`. |
| Store por perfil | `MATE.store(idActividad)` → `{get(k,def), set(k,v)}`, guarda JSON en `mate.<perfil>.<actividad>.<clave>`. Sin perfil activo no guarda. Globales: `MATE.global`. |
| Tema | `MATE.tema.get/set/oscuro/alternar()`; pone `data-theme` en `<html>`. CSS: tokens en `:root` + media query `prefers-color-scheme` + `[data-theme]`. |
| Versión | Cada actividad tiene la suya; se muestra en un elemento `.ver`. `MATE.ver(el)` muestra la del shell. |
| PIN / configuración | `MATE.pin.check/set`; "Ajustes de padres" vive en `index.html` (`verPin` / `verAjustes`). |
| Navegación | `MATE.irMenu()`, `MATE.abrir(id)`; conservan `?p=&t=`. |
| Entrenador de tablas | **No existe** en este repo (solo está la Tabla del 100, que no guarda hechos). No hay formato de hechos para reutilizar. |

## 2. Decisiones de adaptación

**Nombres de carpeta.** La convención del repo es `actividades/<grado>-<nombre>` (por ejemplo `1ro-tabla100`). Se usan `4to-division-paso-a-paso`, `4to-cuantas-veces-entra`, `4to-detective-problemas`, `4to-tiene-sentido`, `4to-calculo-con-ceros` y `actividades/_comun-4to/` para lo compartido. Alternativa descartada: los nombres sin prefijo del prompt (rompen la convención).

**Claves de almacenamiento.** El prompt pide `ref4:<act>:eventos|estado|agregados`. El store real ya antepone perfil y actividad, así que se guardan como `mate.<perfil>.<act>.eventos|estado|agregados` (con `MATE.store(act)` y las claves `eventos`, `estado`, `agregados`). Alternativa descartada: claves `ref4:` a mano en `localStorage` (esquivaría el store por perfil).

**Panel de estadísticas.** El shell no tiene el perfil activo al entrar a Ajustes de padres, y `MATE.store` solo escribe para el perfil activo. El panel (`panel-estadisticas.js`) lee y escribe `localStorage` con el mismo esquema `mate.<perfil>.<act>.<clave>`. Es un adaptador en código propio; no se tocó el core. Con `file://` en Firefox el shell no ve los datos de las actividades (limitación ya anotada en `PLAN.md`).

**Versión `1.0.0`.** El repo usa `vX.Y` para el shell y la Tabla del 100, pero el prompt pide semver `X.Y.Z` para estas actividades. Se usa `1.0.0` en estas; las existentes no se tocan.

**Campo `tipo` en los eventos.** Se agrega `tipo` (`paso`, `ronda_inicio`, `ronda_fin`, `inactividad`, `nivel_cambio`) a todos los eventos para distinguirlos. Los de paso llevan además `item.hecho` (por ejemplo `"7x8"`) cuando corresponde, para el ranking de hechos.

**Sonido.** El repo guarda la preferencia de sonido por actividad (Tabla del 100). Acá se usa `MATE.global` con la clave `sonido` (compartida entre las actividades nuevas, por defecto activado).

**Tabla del divisor en blanco (A1, niveles 3 y 4).** El ×1 viene escrito (es el divisor) y se completan ×2 a ×9. Alternativa descartada: pedir también el ×1 (paso sin valor didáctico).

**Nivel 4 de A1 (modo carpeta).** El flujo sigue la cuenta correcta y las respuestas del chico se anotan sin corregir; al terminar toca "Revisar" y la app marca el primer paso erróneo y lo deja corregir desde ahí (se descartan las respuestas posteriores). Un factor equivocado no desvía la estructura de la cuenta; se detecta en la revisión.

**Máximos de nivel.** A4 tiene 3 niveles (la tabla del prompt define 3); las demás, 4.

**"Errores de control" para subir de nivel.** A1: `RESTO_MAYOR`, `CONTROL`, `ESTIMACION`, `VERIFICACION`. A4: todos. A2, A3 y A5: ninguno (solo cuenta el 80 %), salvo `ESTIMACION` en A5.

**Estrellas.** 3 con 85 % o más al primer intento, 2 con 60 % o más, 1 en otro caso.

## 3. Decisiones tomadas durante la implementación

**Almacén que avisa si está lleno.** `MATE.store().set` se traga los errores de `localStorage`, así que no se podría compactar cuando se llena. `ui-comun.js` usa un almacén propio con el mismo esquema de claves (`mate.<perfil>.<act>.<clave>`) que lanza la excepción; `eventos.js` la atrapa, compacta la mitad de los eventos en agregados y reintenta. Alternativa descartada: usar `MATE.store` directamente (nunca se enteraría del error).

**Guardado diferido.** Los eventos se escriben cada 1 s (agrupados), al cerrar la ronda y al ocultar la página, no en cada pulsación (3000 eventos serializados en cada tecla es lento en una tablet).

**Fijar el nivel desde la URL.** `?nivel=N` solo funciona junto con `?debug=1` (sirve para probar). El nivel real lo fija la progresión o el panel de padres.

**A1, nivel 4 (carpeta).** Se agregó el paso "Revisar mi cuenta" al final (después de la verificación). Marca en rojo el primer paso erróneo y el botón "Corregir desde acá" corta las respuestas desde ahí. Las respuestas del chico se registran como eventos en el momento (con su acierto real), aunque no se le muestre la corrección.

**A1, factor en los niveles 2 y 3.** El factor equivocado se acepta; se descubre en el producto ("se pasa") o en el control del resto. Se registra un evento `factor` con `FACTOR_CHICO`/`FACTOR_GRANDE`/`CERO_OMITIDO` recién cuando se descubre, y el control (nivel 2) queda como acierto si el chico dijo "no".

**A1, bajar con el teclado** (v1.0.4). Escribir la cifra que toca bajar vale como tocarla; escribir otra cifra del dividendo cuenta como tocar esa (`BAJAR`). `PASO_EXTRA` queda para un número de más de una cifra (antes, cualquier número escrito era `PASO_EXTRA`).

**Atajos de teclado** (`REF4_UI.atajos`, desde las versiones del 2026-10-13). S y N tocan el botón "Sí…" o "No…" que se ve; ← y → recorren los botones de opción y Enter elige el que tiene el foco.

**A1, ejercicios del cuaderno.** 976 : 7 y 300 : 8 pueden aparecer desde el nivel 2; los otros tres (de 4 cifras) desde el nivel 3 o 4 según el rango de divisor. Máximo uno por sesión de pantalla.

**A2, ítem B y hechos.** Los productos "vecinos" siempre incluyen uno que se pasa de n. El récord del nivel 4 solo cuenta rondas con 80 % o más al primer intento, para que no premie apurarse sin cuidado; se guarda en la clave `record`.

**A2, ayudas.** En el nivel 1 la escalera está siempre; "Ver tabla" (nivel 2) cuenta como ayuda `tabla`; "Me perdí" (niveles 3 y 4) abre la escalera y cuenta como `me_perdi`.

**A3, selección del plan.** El plan se arma con listas desplegables nativas (operando, operación, operando), accesibles y cómodas en pantallas táctiles. Se compara por forma canónica: no importa el orden de los pasos independientes ni el orden de los operandos de + y ×. Alternativa descartada: fichas arrastrables (frágiles en táctil).

**A3, cálculo.** En los niveles 3 y 4 el chico escribe solo el resultado del último paso (hay calculadora); si es una división con resto, la app avisa "Da X y sobran Y". En C8 se pide la diferencia en valor absoluto y se aceptan las dos restas.

**A3, errores en el nivel 4.** Sin pistas automáticas: después de un error aparece "Todavía no" y la pista queda disponible con el botón 💡.

**A3, lectura.** El tiempo de lectura se mide hasta tocar "Ya lo leí"; si es menor a 4 s en un texto de más de 25 palabras se registra `lectura_rapida`. El audio se registra con `intento: 0` para que no cuente en el porcentaje.

**A4, cuentas sanas.** El 30 % de las cuentas de T2 no tiene error en todos los niveles (el prompt lo pide en el 3), para que el nivel 1 y 2 tampoco enseñen "todo está mal". En el nivel 3 de T2 se usan cuentas de 3 o 4 cifras (con ceros posibles) para poder plantar `CERO_OMITIDO`.

**A4, T2.** Elegir mal la zona se registra como `DETECCION_OMITIDA` (no encontró el error real).

**A5, ítems M1 sin ceros en el multiplicando.** Para que haya una fila por cifra. Los ceros aparecen en los productos parciales (9 × 30 = 270), que es donde falla.

**A5, M4.** Cada columna tiene tres pasos: suma (con lo que se llevó), cifra que se anota y cuánto se lleva. La última columna no lleva reserva.

**Pasos y paneles.** El campo `nivelMax` se agregó a las entradas de `registro.js` de las cinco actividades para que el panel de padres sepa los niveles disponibles.

**Colores.** Se agregaron los tokens `--sobre-acento` y `--velo` (texto sobre el color de acento y fondo de los diálogos) con versión clara y oscura, en lugar de `#fff` y `rgba()` sueltos.

**Shell v2.1.** Se subió la versión del shell (`index.html`) porque cambió Ajustes de padres. El `.ver` de la pantalla de perfiles ahora muestra v2.1; el core sigue en v2.0.

## 4. Multiplicación paso a paso (2026-10-18)

**Sin los datos del libro.** La foto del libro con los tipos de ejercicios de multiplicación no quedó guardada en el repo, así que la actividad sigue el algoritmo convencional de la carpeta: por una cifra (niveles 1 y 2) y por dos cifras con el 0 en la segunda fila y la suma de las filas (niveles 3 y 4). Si el libro pide otra forma (descomposición, por partes, sin el 0), se agrega como tipo nuevo.

**El 0 de la segunda fila se pide.** Es un paso propio (`cero`) con el error `CERO_OMITIDO`, porque correr mal la fila es el error típico. Alternativa descartada: dejar el lugar vacío.

**Reservas.** Solo se ven las de la fila que se está multiplicando (las de la fila anterior confunden); las de la suma se escriben solas. Errores nuevos: `ANOTO_TODO` (anotó 42 en vez de 2) y `SUMA`.
