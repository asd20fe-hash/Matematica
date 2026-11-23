# Dinero y saltos (1ro) — estado del plan

Plan original: `PLAN_dinero_y_saltos_v1.0.md` (estaba en `incoming/`). Prototipo: `prototipo_saltos_monedas_v1.0.html`.

## Decisiones (23/11/2026)

- **Una sola actividad con pestañas** (`actividades/1ro-monedas/`, "Saltos con monedas") en vez de 4 a 8 entradas en el
  menú: para una nena de 6 años un menú corto es mejor, y así lo armaba el prototipo.
- **Claro y oscuro**, no "siempre oscuro" como pedía el plan: es regla del proyecto y el fondo es global.
- **Código común en `_comun-1ro/dinero.js` + `dinero.css`** (no en `_comun/`, que no existe en el repo).
- **Registro con los eventos del proyecto** (`REF4_EV` → `MATE.nube`, `tipo:'paso'` con códigos de error) en vez del
  formato `{intentos:[…]}` del plan §6: así va a la planilla y al panel de Ajustes de padres sin cambiar la API de MATE.
- **Niveles 1–3 de `REF4_EV`** (sube con 2 rondas ≥ 80 %) en vez de los 6 niveles con "5 seguidas" del plan §5; el nivel
  se fija a mano en Ajustes de padres (`nivelMax:3`). El salto (2, 5, 10) se elige en el Desafío.
- Las fuentes (Andika, Fredoka) siguen saliendo de Google Fonts como en las otras actividades; `sw.js` las guarda para
  usar sin conexión.

## Hecho (v1.0.0)

- [x] Componentes en `_comun-1ro/dinero.js` (moneda con puntos, nombre, Recta, Balanza, beep, confeti, menorCantidad, formas).
- [x] A `moneda2` (pestaña "La de $2"): balanza $2 y la variante $5 con $1 y $2 (guarda las formas encontradas) + cambio.
- [x] B `saltos`: de a 1/2/5/10, empezando en 0–9.
- [x] C `pagar`: $20 solo con monedas de $2 primero; "Todas" con estrella por la menor cantidad de monedas.
- [x] D `desafio`: cuantas, cuanto, seguir, falta (nuevo) y quien tiene más (nuevo, con trampa de más monedas y menos plata).
- [x] Registro de intentos + `stats()` en Ajustes de padres. Pruebas: `node tests/monedas-1ro/run.js`.

## Pendiente (en este orden)

- [ ] E `decenas`: billetes de $10 y monedas de $1 → la cifra de las decenas y la de las unidades (libro pág. 92).
- [ ] F `aumentos`: sube/baja $10 o $1, qué cifra cambia, en la cuadrícula del 100 (pág. 95). Se puede apoyar en la Tabla del 100.
- [ ] G `cambio20`: armar $20 con $10, $5, $2 y $1 y contar las formas (`DINERO.formas(20, [10,5,2,1])`) (pág. 91).
- [ ] H `litros` (prioridad baja): `DINERO.Recta` con botellas de 1 L y bidones de 5 L / 10 L (págs. 88–89).
- Cada una puede ser una pestaña más de `1ro-monedas` o una actividad aparte; decidir cuando se haga E.
- Sin probar en un Android real en modo avión (solo Chrome headless a 375 y 1024 px, claro y oscuro).
