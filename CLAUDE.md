# CLAUDE.md

Guía para Claude Code (claude.ai/code) en este repositorio.

## Qué es

"Matemática": app de práctica de matemática para Luz (1ro, 6 años) e Ian (4to, 10 años). Un shell con perfiles y menú abre actividades independientes. Luz tiene la Tabla del 100 (`actividades/1ro-tabla100/`), Escritura, Lectura e Inglés (`actividades/1ro-escritura/`, `actividades/1ro-lectura/`, `actividades/1ro-ingles/`) y Mi mascota en inglés (`actividades/1ro-ingles-mascota/`, 3D); Ian, las actividades de refuerzo de 4to las de fracciones y las Tablas de multiplicar con la tabla pitagórica (`actividades/4to-*`). El diseño de la estructura está en `PLAN.md`.

- **Ejecutar:** abrir `index.html` en el navegador, o servir la carpeta (`python -m http.server`). Con `file://` Chrome comparte localStorage entre archivos y Firefox lo aísla por archivo; con `http://localhost` todo se comparte. El perfil, el tema y el fondo viajan también por la URL (`?p=luz&t=dark&f=oceano`). Hace falta internet la primera vez para three.js r128 (cdnjs) y las fuentes; con http/https después quedan guardadas (`sw.js`).
- **Sin conexión:** `sw.js` guarda la app; con internet los archivos propios salen siempre de la red (la copia guardada se usa solo sin conexión). **Al agregar, sacar o renombrar un archivo** correr `node tests/offline/run.js --escribir` (rearma `ARCHIVOS`); la prueba falla si la lista no coincide. Un recurso externo nuevo va en `EXTERNOS`.
- **Pruebas** (node, sin dependencias): `node tests/offline/run.js`, `node tests/ingles/run.js`, `node tests/lectoescritura-1ro/run.js`, `node tests/refuerzo-4to/run.js` y `node tests/fracciones-4to/run.js`.
- **Depurar:** logs con prefijo `[Mate vX.Y]` (core y shell) y `[<actividad> vX.Y]` en cada actividad; muchas tienen `?debug=1`.
- **Publicación:** se usa desde GitHub Pages (https://asd20fe-hash.github.io/Matematica/), que publica `main` solo. Hace falta `.nojekyll` en la raíz (sin él Jekyll no publica las carpetas que empiezan con `_`, como `_comun-4to`).
- **Probar sin ensuciar la planilla:** antes de abrir actividades en un navegador de prueba, desviar la nube con `localStorage.setItem('mate.global.nube.url', JSON.stringify('http://localhost:9/nada'))` en un perfil aparte. La clave de lectura de la planilla nunca va en el código: se escribe a mano en Ajustes de padres.

## Estructura

```
index.html              shell: perfiles (y "➕ Nuevo perfil"), menú, ajustes de padres con PIN, "Reiniciar progreso" y "⏱️ Tiempo de juego" y "📱 Este dispositivo" (v3.0)
sw.js                   modo sin conexión: guarda toda la app (ARCHIVOS), three.js y las fuentes; core.js lo registra con http/https
manifest.webmanifest    instalación como app en pantalla completa (íconos en core/iconos/; el shell lo enlaza solo con http/https)
perfiles.js             MATE.perfiles = [{id,nombre,grado,avatar,color}] + los creados en el dispositivo
core/core.css           tokens claro/oscuro, estilos base y fondos
core/core.js            global MATE (único global), con la cola de la nube
core/panel-nube.js      "Registro en la nube" de Ajustes de padres (solo el shell)
nube/                   planilla.gs (Apps Script de la planilla de Google) y LEEME.md (cómo implementarlo)
actividades/registro.js MATE.actividades = [{id,titulo,descripcion,icono,grados,ruta,version,stats?,teoria?,errores?}]
actividades/<id>/       cada actividad (con su propio CLAUDE.md)
```

Orden de scripts: `core.js`, `perfiles.js`, `registro.js`, y después el de la página. Todos clásicos.

## Reglas

- **Sin compilar:** sin bundlers, npm ni build. Varios archivos, scripts clásicos (sin ES modules ni `fetch` local, porque no funcionan en `file://`), todo colgado de `MATE`.
- **Versiones:** el shell tiene la suya (v3.0) y cada actividad la suya. Cada cambio sube la versión, agrega una entrada al historial del comentario del principio del archivo (`vX.Y  descripción`, viñetas con `+`) y actualiza la línea `Versión:`. Se muestra en pantalla en elementos `.ver`. Si cambia una actividad, actualizar `version` en el registro.
- **Modo claro/oscuro:** tokens CSS en `:root` con overrides por `[data-theme]` (media query y atributo). Todo color o elemento nuevo tiene que verse bien en los dos modos.
- **Textos en español rioplatense con voseo** ("Elegí", "Probá"); comentarios y logs también en español. Cada actividad decide su tono y tipografía: la de Luz usa frases cortas y MAYÚSCULAS de imprenta; eso no es regla del shell.
- Estilo compacto: nombres cortos, varias sentencias por línea, sin frameworks.

## API de MATE (core.js)

- `MATE.tema.get/set/oscuro/alternar()`: guarda `mate.global.theme` y aplica `data-theme`.
- `MATE.fondo.get/set(id)`, `MATE.fondo.lista` (`{id,nombre,muestra}`) y `MATE.fondo.menu(boton)` (menú flotante para elegir): fondo **global** (Aurora, Océano, Bosque, Atardecer, Espacio) en `mate.global.fondo`, viaja por `?f=`. Se aplica como `data-bg` en `<html>` ("aurora" sin atributo) y core.js agrega solo la capa `#mate-fondo` (z-index −1) al `<body>`; los tokens `--bg`, `--blob1..5`, `--blob-op`, `--star` están en `core.css`, en claro y oscuro. Una página que quiera el fondo tiene que dejar ver `--bg` (sin fondo opaco en contenedores de pantalla completa).
- `MATE.store(idActividad)` → `{get,set}` en `mate.<perfil>.<actividad>.<clave>` (sin perfil no guarda). `MATE.global.get/set` → `mate.global.<clave>`.
- `MATE.perfil()` (activo o null), `MATE.setPerfil(id)`, `MATE.perfiles`, `MATE.actividades`.
- `MATE.perfilesNuevos.lista/crear(nombre,avatar,grado)/borrar(id)`: perfiles creados en el dispositivo (`mate.global.perfiles`, id `nombre-xxxx` para que no se mezclen). `MATE.puedeVer(actividad, perfil)`: por `grados` (o por ids en `perfiles`, lo viejo).
- `MATE.dispositivo` `{id, nombre, renombrar(n)}` en `mate.global.dispositivo`.
- `MATE.acceso` `{ocultos(), puede(id), visibles(), ver(id, si), nuevos(v?)}`: qué perfiles se ven en **este** dispositivo (`mate.global.acceso.ocultos`) y si aparece "➕ Nuevo perfil" (`mate.global.acceso.nuevos`). Se elige en Ajustes de padres > 📱 Este dispositivo. Un perfil oculto no entra ni con `?p=` (`MATE.perfil()` da null).
- `MATE.conexion` `{visita, motivo, lista(), anotar(tipo, paso, extra)}`: al abrir cualquier página manda a la planilla `tipo:'conexion'` (`paso`: `entrada`, `recarga`, `navegacion`, `atras`; `act` = actividad o `menu`) y `MATE.setPerfil(id)` manda `tipo:'perfil'` (`paso`: `elige`/`cambio`, con `anterior`). Todo evento lleva `visita` (id de la pestaña, en sessionStorage). Las últimas 300 quedan en `mate.global.conexiones`. El panel de la nube arma con eso "Tiempo por dispositivo" (visitas cortadas con 15 min sin eventos).
- `MATE.ejercicio(act, ev)`: registra un intento del perfil activo y lo encola para la nube. `MATE.nube`: `enviar(e)` (cola en `mate.global.nube.cola`, lotes de 300, reintenta sin internet), `vaciar()`, `leer(clave)`, `subirHistorial()`, `pendientes()`, `estado()`. La URL del Apps Script va en `NUBE_URL` (core.js) o en `mate.global.nube.url`; cada evento lleva un `id` estable y la planilla descarta los repetidos.
- `MATE.irMenu()` y `MATE.abrir(id)`: navegan conservando `?p=&t=&f=`. `MATE.raiz`: URL de la raíz del proyecto.
- `MATE.log(tag, ...)`, `MATE.ver(el)`.
- `MATE.pantalla` `{disponible, activa(), instalada(), alternar(), boton(junto)}`: core.js pone solo el botón ⛶ antes de `#tema`/`#themeBtn` en cada página. Queda prendida en `mate.global.pantalla` y se vuelve a pedir con el primer toque al abrir otra página (el navegador la apaga al navegar). Navegar con `MATE.irMenu`/`MATE.abrir` para que no cuente como apagarla.
- `MATE.offline` `{disponible(), listo(), estado()}`: registra `sw.js` y cada 6 h con internet le pide que vuelva a bajar todo (`mate.global.offline.ts`).
- `MATE.tiempo`: en toda página de actividad (la que coincide con una `ruta` del registro) arma solo tramos de tal hora a tal hora, `aprendizaje` por defecto; la actividad puede poner `MATE.tiempo.clase = () => 'libre'|'aprendizaje'|null` y `MATE.tiempo.ocupado = () => bool` (la mascota lo hace). Se cortan al cambiar de clase, con la pestaña oculta o sin tocar 3 minutos. Cada tramo va a la planilla (`tipo:'tramo'`, `tema` = clase, `desde`/`hasta`, `ms`) y queda en `mate.<perfil>.tiempo.tramos` y `.totales`; `resumen(perfil)` da hoy, 7 días y total (lo muestra Ajustes de padres).
- `MATE.pin.check/set`: en `mate.global.pin`, por defecto 1234 (hash simple; es un candado para chicos, no seguridad).

## Contrato de una actividad

- Incluye `core.css`, `core.js`, `perfiles.js` y `registro.js` con rutas relativas.
- Lee el perfil con MATE; sin perfil, vuelve al menú.
- Guarda solo con `MATE.store(idActividad)`; lo global, en `mate.global.<clave>`.
- Botón "Volver al menú", respeta el tema y el fondo globales (botón 🎨 con `MATE.fondo.menu`) y muestra su versión.
- **Registra cada intento** (todas las actividades, de cualquier grado): `MATE.ejercicio(id, {tipo:'paso', tema, paso, intento, item, esperado, respuesta, ok, error, ms, ayuda, v, sesion})`; `error` es un código en MAYÚSCULAS y su nombre para padres va en `errores:{}` de su entrada del registro. También `ronda_inicio`/`ronda_fin`/`item_fin` si tiene rondas. Las de 4to lo hacen solas con `REF4_EV` (que reenvía cada evento a `MATE.nube`).
- Opcional: `stats()` en su entrada del registro, que devuelve un texto para Ajustes de padres.

## Cómo agregar una actividad

1. Crear `actividades/<grado>-<nombre>/index.html` (y un `CLAUDE.md` con su arquitectura) siguiendo el contrato.
2. Agregar su entrada a `actividades/registro.js` (`grados` = grados que la ven, p. ej. `['1ro']`; `ruta` relativa a la raíz; `errores` con los nombres de sus códigos).
3. Probar con `file://` y con `http.server`, en claro y oscuro, y revisar que la consola quede limpia.

## Actividades de 1ro (lectura y escritura): convenciones

- **Código común** en `actividades/_comun-1ro/` (UMD): `lengua.js` (`LENGUA1`: sílabas, cómo suena, `clasificar`/`elegirMejor` con códigos de error de escritura y `ERRORES`), `repaso.js` (`REPASO1`: cajas de Leitner; estados nuevo/bien/repaso/persiste/aprendido), `ui-1ro.js` (`UI1`: cabecera con ABC/abc, voz, teclado en pantalla, sílabas que suenan, resumen) y `comun-1ro.css` (letras en Andika). Usan también `REF4_AZAR`, `REF4_EV` (registro local + nube) y `REF4_UI` (sonidos, fuegos, voz) de `_comun-4to/`.
- **MAYÚS/minús**: por perfil en `mate.<perfil>.1ro-lengua.caso`; cada evento lleva `forma`. `UI1.txt` para letras sueltas, `UI1.frase` para oraciones.
- **Repaso**: lo que sale mal al primer intento vuelve seguido hasta que se afirma y después cada tanto (`REPASO1.elegir` con `minRepaso`). Se guarda en `mate.<perfil>.<act>.repaso`.
- **Panel**: `analisis:'palabras'|'preguntas'` en el registro arma la tabla por ítem en "Registro en la nube".
- **Inglés** (`1ro-ingles`): oral y con dibujos; voz en inglés propia de la actividad (en-US/en-GB). Para escribir en inglés, `LENGUA1.clasificar(…, {idioma:'en'})` (sin reglas del castellano).
- **Pruebas:** `node tests/lectoescritura-1ro/run.js` (lectura e inglés con 1000 rondas por nivel y semilla fija).

## Rama de inglés (`_comun-ingles/`): convenciones

- **Modular para crecer:** vocabulario por temas (`temas/*.js` se registran en `ING_VOCAB`), minijuegos (`juegos/*.js` en `ING_JUEGOS`: pintar, comer, tocar, buscar, contar, sentir, vestir, hacer, cafe, resto, mochila), lecciones como datos (`ING_LECC`), estado de la mascota puro (`ING_PET`), súper y despensa puros (`ING_TIENDA`), ropa pura (`ING_ROPA`), álbum de figuritas puro (`ING_ALBUM`), salidas puras (`ING_SALIDAS`) y la parte 3D aparte (`mundo3d.js`, `mascota3d.js`, `profe3d.js`, `objetos3d.js`, `escena-super.js`, `escenas-casa.js` (baño, dormitorio, patio y el placard), `escenas-salidas.js` (café, restaurante, escuela y cine), `ropa3d.js`, con three.js r128). Una escena nueva es un grupo que esconde `M.cuarto` (`M.sala()` arma piso y pared). Detalle en `actividades/1ro-ingles-mascota/CLAUDE.md`.
- **Sin modelos:** la mascota y la profe son formas con contorno; cada palabra se ve como un emoji en una ficha 3D. Archivos externos no (nada de `fetch`: tiene que andar con `file://`).
- **Mascota sin culpa:** las necesidades bajan con tope (`ING_PET.PISO`) y nunca se enferma.
- **Pruebas:** `node tests/ingles/run.js`.

## Actividades de 4to: convenciones

- **Código común** en `actividades/_comun-4to/` (scripts clásicos con patrón UMD: `window.REF4_*` en el navegador, `require` en node). Base: `azar.js` (`REF4_AZAR`, semilla), `eventos.js` (`REF4_EV`), `ui-comun.js` (`REF4_UI`: arranque, teclado, globo, inactividad, resumen), `panel-estadisticas.js` (`REF4_PANEL`). División: `division-lib.js`, `cuaderno.js`. La multiplicación paso a paso tiene su lógica en su carpeta (`multiplicacion-logica.js`). Escena 3D: `bloques3d.js` (`REF4_BLOQUES`: texturas de pixeles, cajas y `escena(op)` a pantalla completa detrás de la interfaz, con giro arrastrando, rueda para acercar, dos dedos y doble toque; `body.b3d` en `comun.css` corre el panel a la derecha o abajo) y `luna3d.js` (`REF4_LUNA`: el astronauta en la luna, en todas las de Ian menos el gato, que tiene la suya; botón 🚀 en la cabecera, `mate.global.escena3d`; reacciona a `REF4_UI.sonar` ok/mal/sube y a `celebrar`). Una página nueva de 4to suma three.js r128, `bloques3d.js` y `luna3d.js` después de `ui-comun.js`. Fracciones: `fracciones-lib.js` (`REF4_FR`), `fracciones-figuras.js` (`REF4_FIG`), `fracciones-gen.js` + `fracciones-gen-2.js` (`REF4_FRGEN`), `fracciones-modulo.js` (`REF4_FRMOD`, Anexo A), `fracciones-ui.js` (`REF4_FRUI`), `fracciones.css`, `panel-fracciones.js` (`REF4_PANEL_FR`). Solo se agregan archivos o funciones retrocompatibles.
- **Carpetas e ids:** `actividades/4to-<nombre>/` (id = carpeta). Con el prefijo `4to-` el panel de padres las muestra solas. Lógica pura en `*-logica.js` o en los generadores comunes; la interfaz en `<nombre>.js`, con el changelog al principio y `VERSION = 'X.Y.Z'`.
- **Eventos** (`REF4_EV.crearRegistro`, guardados en `mate.<perfil>.<act>.eventos|agregados|estado`, hasta 3000 con compactación): `{v, act, perfil, ts, sesion, ronda, nivel, tipo, …}`. `tipo` es la clase de evento: `paso`, `ronda_inicio`, `ronda_fin`, `inactividad`, `nivel_cambio`. Los de `paso` llevan `paso, intento, item, esperado, respuesta, ok, error, ms, ayuda`; los de fracciones suman `tema`, `tipoItem` (R1, P3…), `forma` y `modulo`. Lo que no cuenta para las estrellas (audio, "¿Qué aprendiste?") va con `intento: 0`.
- **Códigos de error:** en MAYÚSCULAS (`RESTO_MAYOR`, `INVERTIDA`, `OPERA_DENOMINADORES`…). Nombres para el panel en `REF4_PANEL.ERRORES` y `REF4_FR.ERRORES`; los clasificadores devuelven el más específico (orden en `docs/*/DECISIONES.md`).
- **Niveles y adaptación:** sube con 2 rondas seguidas ≥ 80 % al primer intento y baja con 2 < 50 % (`REF4_EV.ajustarNivel`); `nivelMax` va en la entrada de `registro.js` y el nivel se fija a mano desde Ajustes de padres. Los generadores dan peso doble a lo que falló o fue lento en los últimos 14 días.
- **Pistas:** voseo, 2 renglones como máximo, nunca retan; en el globo `#globo` (`aria-live`). En fracciones se escriben "3/4" y `REF4_FRUI.conFracciones` las apila (el chico nunca ve una barra); `REF4_FR.paraVoz` las pasa a palabras para el 🔊.
- **Debug:** `?debug=1` muestra el panel (versión, semilla, nivel, ítem, esperado, últimos eventos) y expone `window.__fr` / `window.__ref4`; `?seed=N` repite los ejercicios; con debug, `?nivel=N` y `?tipo=X` fuerzan nivel y tipo. Logs con el prefijo `[<act> vX.Y.Z]`.
- **Pruebas:** `node tests/refuerzo-4to/run.js` y `node tests/fracciones-4to/run.js` (solo `assert`, sin dependencias). Cada generador se prueba con 1000 ítems por nivel y tipo y con semilla fija.
- **Sumar un tema nuevo:**
  1. Lógica pura (generador con `tipos(nivel)`, `ronda(nivel)`, `generar(nivel, tipo, az, ses)`, validadores y pistas) en `_comun-4to/` o en la carpeta de la actividad, con sus pruebas.
  2. `index.html` copiado de una actividad de fracciones (mismos scripts y encabezado) y `<nombre>.js` con `REF4_FRUI.actividad({act, titulo, version, nivelMax, tamRonda, tipos, generar, pintar, meperdi, textoPaso, esperado, aprendiste})`: el marco hace la ronda, el registro, el resumen, el debug y la inactividad.
  3. Colores solo con variables (claro y oscuro), botones de 48 px o más, todo tocando; probar a 375 px y 1024 px en los dos temas.
  4. Alta en `actividades/registro.js` (con `nivelMax` y `grados:['4to']`) recién cuando funciona y pasa sus pruebas.
