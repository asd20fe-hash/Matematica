# CLAUDE.md — Saltos con monedas (1ro)

Actividad de Luz: que entienda que la moneda de $2 vale el doble que la de $1 y que aprenda a saltar de a 2, 5 y 10.
Sale del prototipo `docs/1ro-monedas/prototipo_saltos_monedas_v1.0.html`; el plan completo (con lo que falta) está en
`docs/1ro-monedas/PLAN_dinero_y_saltos_v1.0.md`. Reglas generales en `../../CLAUDE.md`.

- **Archivos:** `index.html` (marcado y CSS propio, prefijo `mo-`), `monedas-logica.js` (`MONEDAS1`, puro, UMD) y
  `monedas.js` (interfaz, con el historial y `VERSION`). Lo reutilizable de dinero está en `../_comun-1ro/dinero.js`
  (`DINERO`) y `dinero.css` (prefijo `din-`), para las actividades que siguen (decenas, aumentos, cambio de $20, litros).
- **Pruebas:** `node tests/monedas-1ro/run.js` (1000 ítems por nivel, salto y tipo con semilla fija; la pregunta de la
  tarea "$20 con monedas de $2 → 10").
- **Depurar:** `?debug=1` (logs `[1ro-monedas v1.0.0]`, `window.__monedas`), `?seed=N`, `?nivel=N`.

## Pestañas (una sola actividad en el menú)

1. **La de $2:** balanza (`DINERO.Balanza`: $2 contra $1, o $5 contra $1 y $2; las formas de $5 encontradas quedan en
   `store.formas5`) y cambio ($2 → dos de $1, con el total arriba).
2. **Saltos:** recta de a 1/2/5/10, empezando en 0–9.
3. **Pagar:** el primer precio es $20 solo con monedas de $2 (la tarea). "Todas" premia con ⭐ pagar con
   `DINERO.menorCantidad`. Una moneda que se pasa no entra (evento `TE_PASAS`).
4. **Desafío:** rondas de 8 (`MONEDAS1.ronda`), niveles 1–3 con `REF4_EV` (`nivelMax:3` en el registro). Nivel 1:
   cuantas, cuanto, seguir; nivel 2 suma falta y quien; nivel 3, "seguí contando" a veces fuera de la tabla (3, 5, 7).
   Al errar, la ayuda salta con el canguro (`it.ayuda`); nunca muestra la respuesta en seco.

## Convenciones

- **Pista visual principal:** cada moneda tiene tantos puntos como vale y cada moneda es un salto (arco del color de
  la moneda, cuadrícula de 10 por fila y cadena 0 → 2 → 4). Colores fijos: $1 `#f5b301`, $2 `#2ec4b6`, $5 `#b07cf0`, $10 `#5cc96b`.
- `DINERO.Recta`: `setN(N, inicio)`, `add(v)`/`pop()`/`reset()` devuelven la promesa de la animación (cola), `total`
  incluye `inicio`. Escalas: N ≤ 20 → 36 px por número; ≤ 30 → 26; más → 16 (etiquetas de a 5).
- **Registro:** cada intento con `ctx.reg.evento({tipo:'paso', tema, paso, …})`; `tema` es `desafio`, `pagar` o
  `moneda2`. La balanza va con `intento: 0` (exploración, no cuenta). Códigos en `MONEDAS1.ERRORES` + `TE_PASAS`,
  todos con nombre en `registro.js` (una prueba lo controla).
- **Textos en MAYÚSCULAS** por CSS (`#app`); la voz (`decir`) lee "$20" como "20 pesos". Sonido: `DINERO.beep` y
  `REF4_UI.sonar`, los dos respetan el botón 🔊 (`mate.global.sonido`).
- Claro y oscuro: los tokens `--din-*` están en `dinero.css`; las monedas tienen colores fijos que se ven en los dos.
