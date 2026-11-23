# PLAN — Módulo "Dinero y saltos" (1er grado) · v1.0

> Plan para Claude Code. Objetivo: integrar a la app de matemáticas (repo común de los chicos, ex `Luz_Tabla100`) un módulo de ejercicios con billetes y monedas para 1er grado, tomando como prototipo funcional el archivo `saltos_monedas.html` (se adjunta; es un solo HTML offline que ya funciona).

---

## 0. Antes de escribir código (obligatorio)

1. Leer `registro.js` y **una actividad existente completa** dentro de `actividades/` para copiar exactamente:
   - cómo se registra una actividad (id, nombre, ícono, grado, perfil),
   - cómo se usa el global `MATE` (store por perfil, tema, versión, PIN),
   - cómo se vuelve al menú.
2. Respetar la arquitectura actual: **sin build, sin ES modules**, scripts clásicos (`<script src>`), todo debe funcionar abriendo el archivo offline en teléfono y tablet.
3. No cambiar la API de `MATE`. Si falta algo (ej. guardar estadísticas por actividad), proponerlo primero y esperar confirmación.
4. Si alguna tarea de este plan va a llevar mucho trabajo, avisar y dejarla marcada como "pendiente costosa" antes de hacerla.

## 1. Problema pedagógico a resolver

- La nena de 1er grado **no entiende que la moneda de $2 vale el doble que la de $1**. Cuenta monedas como si cada una valiera 1.
- Ejemplo que no pudo resolver: *¿Cuántas monedas de $2 hacen falta para pagar $20?*
- Necesita aprender a **"hacer saltos" de a más de 1** (de a 2, de a 5, de a 10) en la recta numérica y en la tabla del 100, usando billetes y monedas.
- Contenidos del libro (páginas 88–95, "Sistema monetario vigente", "Composición y comparación de números", "Inicio en el análisis del valor posicional", "Equivalencias de capacidad"):
  - Dibujar billetes de $10 y monedas de $1/$2/$5 para pagar un precio ($21, $32, $45).
  - Ver en el número cuántos billetes de $10 y cuántas monedas hacen falta (decenas/unidades).
  - Precios que aumentan/bajan $10 o $1 → ¿qué cifra cambia?
  - Cambiar un billete de $20 por billetes de $10 y monedas de $1/$2/$5.
  - Contar cuánto dinero tiene cada chico y comparar.
  - Equivalencias de litros: bidón de 10 L = 10 botellas de 1 L = 2 bidones de 5 L.

## 2. Principios de diseño (todas las actividades del módulo)

- **Cada moneda/billete muestra puntos iguales a su valor** ($2 → ●●, $5 → 5 puntos, $10 → 10 puntos). Es la pista visual principal de que "vale más".
- **Cada moneda = un salto** en la recta numérica, con un arco del color de la moneda y etiqueta `+2`.
- **Cuadrícula de 10 por fila** (tipo tabla del 100) debajo de la recta: cada moneda pinta tantas casillas como vale; grupos alternan tono; la casilla donde "cae" el salto queda remarcada. Así se ven los saltos 2, 4, 6… igual que en la tabla del 100.
- **Cadena de conteo**: `0 → 2 → 4 → 6` en chips.
- Lenguaje rioplatense simple ("poné", "tocá", "te falta"), letras grandes, botones ≥ 52 px.
- Voz opcional (`speechSynthesis`, es-AR) que dice el total en cada salto; sonidos con WebAudio. Botón para silenciar.
- **Modo oscuro** siempre (usar el tema de `MATE` si lo provee; si no, las variables CSS del prototipo).
- Errores tratados con calma: "Casi… mirá la ayuda". Nunca castigo, sin cronómetro visible en 1er grado.
- Colores fijos: $1 ámbar `#f5b301`, $2 turquesa `#2ec4b6`, $5 violeta `#b07cf0`, $10 verde `#5cc96b`.

## 3. Componentes reutilizables (crear en un archivo compartido)

Crear `actividades/_comun/dinero.js` (script clásico que cuelga de `window.DINERO` o de `MATE` según el patrón del repo):

| Componente | Responsabilidad | Origen en el prototipo |
|---|---|---|
| `moneyHTML(valor, tamaño)` | Moneda/billete con valor y puntos | `moneyHTML` |
| `moneyName(valor, n)` | "moneda/monedas de $2", "billete/billetes de $10" | `moneyName` |
| `Track` | Recta 0–N + cuadrícula + cadena; `add(v)`, `pop()`, `reset()`, `setN(n)`, `total`, `onChange`, animación con cola de promesas | clase `Track` |
| `Balanza` | Balanza que compara dos platos de dinero | `drawBal` / `updBal` (generalizar a dos listas de monedas) |
| `Teclado` | Teclado numérico 0–9, ⌫, ✔ | tab 4 |
| `Feedback` | `say()`, `beep()`, `confetti()` respetando el silencio | utilidades |

CSS compartido en `actividades/_comun/dinero.css`.

## 4. Actividades (cada una es una carpeta en `actividades/`)

### A. `dinero-moneda2` — "¿Cuánto vale la moneda de $2?" (= pestaña 1 del prototipo)
- Balanza: $2 de un lado; agregar/sacar $1 del otro hasta equilibrar.
- Cambio: elegir 1–10 monedas de $2; cada una se muestra arriba de dos de $1, con el total acumulado ($2, $4, $6…).
- Variante nueva: moneda de $5 contra monedas de $1 y $2 (varias soluciones: 2+2+1, 1+1+1+1+1…).

### B. `dinero-saltos` — Saltos en la recta (= pestaña 2)
- Elegir salto de a 1, 2, 5 o 10. Recta 0–20 (de a 1/2) o 0–50 (de a 5/10).
- Botones Saltar / Volver / Desde 0.
- Nueva variante: **empezar desde un número distinto de 0** (ej. 3 → 5 → 7) para que no memorice sólo los pares.

### C. `dinero-pagar` — Pagar justo (= pestaña 3)
- Precio con producto (emoji). Primer precio fijo: **$20 sólo con monedas de $2** (el ejercicio de la tarea).
- Modo "Sólo monedas de $2" / "Todas" ($1, $2, $5, billete $10).
- Si una moneda haría pasarse: no se agrega, se explica ("serían $21 y cuesta $20").
- Al pagar justo: resumen "Usaste 10 monedas de $2".
- Nueva variante: **pagar con la menor cantidad de monedas** (estrellas extra si usa la mínima).

### D. `dinero-desafio` — Preguntas (= pestaña 4)
Tipos de pregunta con generador aleatorio, salto configurable 2/5/10:
1. ¿Cuántas monedas de $s para pagar $X? (X múltiplo de s)
2. Tengo n monedas de $s, ¿cuánta plata tengo?
3. Seguí contando de a s: a, b, c, __
4. *(nuevo)* ¿Qué falta? $2 + $2 + __ = $8
5. *(nuevo)* ¿Quién tiene más? (dos grupos de monedas, tocar el mayor) — como el ejercicio Luna/Santi del libro.
- Al fallar: se muestra la ayuda animada (el canguro salta moneda por moneda diciendo el total).

### E. `dinero-decenas` — Billetes de $10 y monedas (libro pág. 92)
- Se muestra un precio ($21, $32, $45…). La nena arrastra/toca billetes de $10 y monedas de $1.
- Al completar, se resalta: "3 billetes de $10 y 2 monedas de $1 → **3**2". La cifra de las decenas se pinta del color del billete, la de las unidades del color de la moneda.
- Pregunta de cierre: "¿Qué número te dice cuántos billetes necesitás?"

### F. `dinero-aumentos` — Sube $10 / sube $1 (libro pág. 95)
- Cartel con precio. Botón "+$10" o "+$1" (o "−$10"). La cifra que cambia parpadea; la otra queda igual.
- Preguntas: "Antes $25, hoy $26: ¿subió $1 o $10?" con dos opciones grandes.
- Usar la cuadrícula del 100: +10 = bajar una fila, +1 = moverse una casilla.

### G. `dinero-cambio20` — Cambiar el billete de $20 (libro pág. 91)
- Billete de $20 en el centro; armar el mismo valor con billetes de $10 y monedas de $1/$2/$5 en columnas.
- Validar que la suma dé $20 y mostrar cuántas formas distintas encontró (guardar las encontradas).

### H. `litros-equivalencias` — Bidones y botellas (libro págs. 88–89) — *prioridad baja*
- Mismo motor `Track` con "botellas" de 1 L y "bidones" de 5 L / 10 L en lugar de monedas.
- Preguntas: botellas de 1 L para llenar 10 L; bidones de 10 L para 50 L; bidones de 5 L para 50 L.

## 5. Progresión y niveles

| Nivel | Contenido | Rango |
|---|---|---|
| 1 | Moneda de $2 = 2 de $1 (balanza, cambio) | hasta $10 |
| 2 | Saltos de a 2 desde 0 | hasta 20 |
| 3 | Pagar con monedas de $2 | hasta $20 |
| 4 | Saltos de a 2 desde impar, de a 5 | hasta 30 |
| 5 | Billetes de $10 + monedas de $1 (decenas/unidades) | hasta $99 |
| 6 | Mezcla de monedas, aumentos ±$10 / ±$1 | hasta $99 |

- Un nivel se desbloquea con 5 respuestas correctas seguidas del anterior (configurable).
- Los padres pueden saltar de nivel desde configuración (protegido con el PIN de `MATE`).

## 6. Datos a guardar por perfil (usando el store de `MATE`)

```js
{
  actividad: "dinero-desafio",
  version: "1.0",
  nivel: 3,
  intentos: [ { tipo: "cuantas", salto: 2, objetivo: 20, respuesta: 10, correcto: true, usoAyuda: false, ms: 8400, fecha: "2026-11-23T11:40:00" } ],
  estrellas: 12
}
```
- El tiempo se registra pero **no se muestra** a la nena. Estadísticas sólo en la sección de configuración, a pedido.
- Útil para ver: qué tipo de pregunta falla más, si mejora el uso de ayuda con los días.

## 7. Convenciones del proyecto (respetar siempre)

- Versión en comentario al inicio de cada archivo con la lista de cambios (mejoras / correcciones).
- Versión visible en pantalla (badge) y en `console.log('[actividad] vX.Y')`.
- Archivo entregado con versión en el nombre (`dinero_desafio_v1.0.html`), pero **las referencias internas usan el nombre sin versión** (`index.html`, `dinero.js`).
- Entregar siempre el archivo completo, no fragmentos.
- UI siempre en modo oscuro.
- Todo offline: nada de CDN, fuentes web ni imágenes remotas. Monedas dibujadas con CSS/SVG (no usar fotos de billetes reales).

## 8. Orden de trabajo sugerido

1. Extraer componentes del prototipo a `_comun/dinero.js` + `dinero.css` (sin cambiar comportamiento).
2. Portar A, B, C, D como 4 actividades registradas en `registro.js` (o una sola con pestañas, según el patrón del repo — preguntar).
3. Guardado de intentos en `MATE` + vista de estadísticas en configuración.
4. Actividades nuevas E → F → G.
5. H (litros) si sobra tiempo.

## 9. Criterios de aceptación

- [ ] Abre y funciona en modo avión en Android (Chrome) y tablet.
- [ ] Botones tocables con el dedo, sin zoom accidental; recta con scroll horizontal que sigue al personaje.
- [ ] La ayuda nunca da la respuesta "en seco": siempre la muestra con saltos animados.
- [ ] La moneda de $2 siempre se ve con dos puntos y pinta 2 casillas.
- [ ] Sin errores en consola; versión visible.
- [ ] Silenciar apaga voz y sonidos.
- [ ] Probado con: $20 con monedas de $2 → respuesta 10.
