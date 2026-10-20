/* Matemática — modo sin conexión (service worker).
   ------------------------------------------------------------
   Historial de cambios
   v1.0  (2026-10-18) Primera versión
     + Guarda toda la app al instalarse (ARCHIVOS) y además three.js r128 y las fuentes de Google (Fredoka, Andika).
     + Archivos propios: primero la red (hasta 4 s) y, si no hay, lo guardado; así con internet siempre está al día.
       Fuentes y three.js: primero lo guardado.
     + Una vez cada 6 h, con internet, core.js le pide que vuelva a bajar todo (mensaje 'actualizar'), así las secciones
       que no se abrieron también quedan al día para cuando no haya conexión.
     + No toca lo que no es GET ni la planilla (script.google.com): la cola de la nube ya espera a tener internet.
   ------------------------------------------------------------
   ARCHIVOS se controla con `node tests/offline/run.js` (avisa si falta o sobra algo; con --escribir la rearma). */
'use strict';
const VERSION = '1.0', CACHE = 'mate-' + VERSION;
const ARCHIVOS = [
  './',
  // ARCHIVOS (lista armada por tests/offline/run.js --escribir)
  'actividades/1ro-escritura/escritura.js', 'actividades/1ro-escritura/index.html', 'actividades/1ro-escritura/palabras.js',
  'actividades/1ro-ingles-mascota/index.html', 'actividades/1ro-ingles-mascota/juego.js',
  'actividades/1ro-ingles/index.html', 'actividades/1ro-ingles/ingles-logica.js', 'actividades/1ro-ingles/ingles.js',
  'actividades/1ro-lectura/index.html', 'actividades/1ro-lectura/lectura-logica.js', 'actividades/1ro-lectura/lectura.js',
  'actividades/1ro-tabla100/index.html',
  'actividades/4to-calculo-con-ceros/ceros-logica.js', 'actividades/4to-calculo-con-ceros/ceros.css', 'actividades/4to-calculo-con-ceros/ceros.js', 'actividades/4to-calculo-con-ceros/index.html',
  'actividades/4to-cuantas-veces-entra/entra-logica.js', 'actividades/4to-cuantas-veces-entra/entra.css', 'actividades/4to-cuantas-veces-entra/entra.js', 'actividades/4to-cuantas-veces-entra/index.html',
  'actividades/4to-detective-problemas/detective-logica.js', 'actividades/4to-detective-problemas/detective.css', 'actividades/4to-detective-problemas/detective.js', 'actividades/4to-detective-problemas/index.html', 'actividades/4to-detective-problemas/problemas.js',
  'actividades/4to-division-paso-a-paso/division-logica.js', 'actividades/4to-division-paso-a-paso/division.css', 'actividades/4to-division-paso-a-paso/division.js', 'actividades/4to-division-paso-a-paso/index.html',
  'actividades/4to-fracciones-comparar/comparar.css', 'actividades/4to-fracciones-comparar/comparar.js', 'actividades/4to-fracciones-comparar/index.html',
  'actividades/4to-fracciones-cuanto-falta/falta.css', 'actividades/4to-fracciones-cuanto-falta/falta.js', 'actividades/4to-fracciones-cuanto-falta/index.html',
  'actividades/4to-fracciones-equivalentes/equivalentes.css', 'actividades/4to-fracciones-equivalentes/equivalentes.js', 'actividades/4to-fracciones-equivalentes/index.html',
  'actividades/4to-fracciones-gato/gato-logica.js', 'actividades/4to-fracciones-gato/gato.css', 'actividades/4to-fracciones-gato/gato.js', 'actividades/4to-fracciones-gato/gato3d.js', 'actividades/4to-fracciones-gato/index.html',
  'actividades/4to-fracciones-muro/index.html', 'actividades/4to-fracciones-muro/muro.css', 'actividades/4to-fracciones-muro/muro.js',
  'actividades/4to-fracciones-partes/index.html', 'actividades/4to-fracciones-partes/partes.css', 'actividades/4to-fracciones-partes/partes.js',
  'actividades/4to-fracciones-potes-vasos/index.html', 'actividades/4to-fracciones-potes-vasos/potes.css', 'actividades/4to-fracciones-potes-vasos/potes.js',
  'actividades/4to-fracciones-repartos/index.html', 'actividades/4to-fracciones-repartos/repartos.css', 'actividades/4to-fracciones-repartos/repartos.js',
  'actividades/4to-fracciones-repaso/index.html', 'actividades/4to-fracciones-repaso/repaso.css', 'actividades/4to-fracciones-repaso/repaso.js',
  'actividades/4to-multiplicacion-paso-a-paso/index.html', 'actividades/4to-multiplicacion-paso-a-paso/multiplicacion-logica.js', 'actividades/4to-multiplicacion-paso-a-paso/multiplicacion.css', 'actividades/4to-multiplicacion-paso-a-paso/multiplicacion.js',
  'actividades/4to-tablas/index.html', 'actividades/4to-tablas/pitagorica.js', 'actividades/4to-tablas/tablas-logica.js', 'actividades/4to-tablas/tablas.css', 'actividades/4to-tablas/tablas.js',
  'actividades/4to-tiene-sentido/index.html', 'actividades/4to-tiene-sentido/sentido-logica.js', 'actividades/4to-tiene-sentido/sentido.css', 'actividades/4to-tiene-sentido/sentido.js',
  'actividades/_comun-1ro/comun-1ro.css', 'actividades/_comun-1ro/lengua.js', 'actividades/_comun-1ro/repaso.js', 'actividades/_comun-1ro/ui-1ro.js',
  'actividades/_comun-4to/azar.js', 'actividades/_comun-4to/clasificadores.js', 'actividades/_comun-4to/comun.css', 'actividades/_comun-4to/cuaderno.js', 'actividades/_comun-4to/division-lib.js', 'actividades/_comun-4to/eventos.js', 'actividades/_comun-4to/fracciones-figuras.js', 'actividades/_comun-4to/fracciones-gen-2.js', 'actividades/_comun-4to/fracciones-gen.js', 'actividades/_comun-4to/fracciones-lib.js', 'actividades/_comun-4to/fracciones-modulo.js', 'actividades/_comun-4to/fracciones-ui.js', 'actividades/_comun-4to/fracciones.css', 'actividades/_comun-4to/panel-estadisticas.js', 'actividades/_comun-4to/panel-fracciones.js', 'actividades/_comun-4to/ui-comun.js',
  'actividades/_comun-ingles/album.js', 'actividades/_comun-ingles/escena-super.js', 'actividades/_comun-ingles/escenas-casa.js', 'actividades/_comun-ingles/escenas-salidas.js', 'actividades/_comun-ingles/ingles.css', 'actividades/_comun-ingles/juegos.js', 'actividades/_comun-ingles/lecciones.js', 'actividades/_comun-ingles/mascota-estado.js', 'actividades/_comun-ingles/mascota3d.js', 'actividades/_comun-ingles/mundo3d.js', 'actividades/_comun-ingles/objetos3d.js', 'actividades/_comun-ingles/profe3d.js', 'actividades/_comun-ingles/ropa.js', 'actividades/_comun-ingles/ropa3d.js', 'actividades/_comun-ingles/salidas.js', 'actividades/_comun-ingles/tienda.js', 'actividades/_comun-ingles/vocab.js', 'actividades/_comun-ingles/voz-en.js',
  'actividades/_comun-ingles/juegos/buscar.js', 'actividades/_comun-ingles/juegos/comer.js', 'actividades/_comun-ingles/juegos/contar.js', 'actividades/_comun-ingles/juegos/hacer.js', 'actividades/_comun-ingles/juegos/menu.js', 'actividades/_comun-ingles/juegos/mochila.js', 'actividades/_comun-ingles/juegos/pintar.js', 'actividades/_comun-ingles/juegos/sentir.js', 'actividades/_comun-ingles/juegos/tocar.js', 'actividades/_comun-ingles/juegos/vestir.js',
  'actividades/_comun-ingles/temas/acciones.js', 'actividades/_comun-ingles/temas/cafe.js', 'actividades/_comun-ingles/temas/colores.js', 'actividades/_comun-ingles/temas/comida.js', 'actividades/_comun-ingles/temas/cosas.js', 'actividades/_comun-ingles/temas/cuerpo.js', 'actividades/_comun-ingles/temas/escuela.js', 'actividades/_comun-ingles/temas/numeros.js', 'actividades/_comun-ingles/temas/platos.js', 'actividades/_comun-ingles/temas/ropa.js', 'actividades/_comun-ingles/temas/sentimientos.js',
  'actividades/registro.js',
  'core/core.css', 'core/core.js', 'core/panel-nube.js',
  'core/iconos/icono-192.png', 'core/iconos/icono-512.png', 'core/iconos/icono-maskable-512.png',
  'index.html', 'manifest.webmanifest', 'perfiles.js',
  // fin de ARCHIVOS
];
const EXTERNOS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@400;500;600;700&display=swap'
];
const AFUERA = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const log = (...a) => console.log('[Mate sw v' + VERSION + ']', ...a);

// Baja todo y lo guarda. Lo que falla se saltea (una sección rota no deja sin conexión a las demás).
async function guardarTodo() {
  const c = await caches.open(CACHE); let ok = 0, mal = 0;
  await Promise.all(ARCHIVOS.map(async u => {
    try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) { await c.put(clave(new URL(u, self.registration.scope).href), r); ok++; } else mal++; } catch (e) { mal++; }
  }));
  for (const u of EXTERNOS) {
    try {
      const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) { mal++; continue; }
      if (u.indexOf('fonts.googleapis') >= 0) {     // la hoja de las fuentes trae las direcciones de los .woff2
        const css = await r.clone().text(), fuentes = css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"]+/g) || [];
        await Promise.all(fuentes.map(f => fetch(f).then(x => x.ok && c.put(f, x)).catch(() => {})));
      }
      await c.put(u, r); ok++;
    } catch (e) { mal++; }
  }
  log('guardado', ok, 'archivos', mal ? '(' + mal + ' no se pudieron)' : '');
  return { ok, mal };
}

self.addEventListener('install', e => { e.waitUntil(guardarTodo().then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('mate-') === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  if (e.data && e.data.tipo === 'actualizar') e.waitUntil(guardarTodo().then(r => { if (e.source) e.source.postMessage({ tipo: 'actualizado', ok: r.ok, mal: r.mal, version: VERSION }); }));
});

// Los propios se guardan sin ?p=&t=&f= (la misma página con otro perfil es el mismo archivo); la carpeta, como index.html.
function clave(u) { const x = new URL(u); x.search = ''; x.hash = ''; if (x.pathname.slice(-1) === '/') x.pathname += 'index.html'; return x.href; }
async function redPrimero(req) {
  const c = await caches.open(CACHE);
  try {
    const r = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('lento')), 4000))]);
    if (r && r.ok) c.put(clave(req.url), r.clone());
    return r;
  } catch (e) {
    const g = await c.match(clave(req.url)) || (req.mode === 'navigate' ? await c.match(clave(self.registration.scope)) : null);
    if (g) return g;
    throw e;
  }
}
async function guardadoPrimero(req) {
  const c = await caches.open(CACHE), g = await c.match(req.url);
  if (g) return g;
  const r = await fetch(req); if (r.ok || r.type === 'opaque') c.put(req.url, r.clone());
  return r;
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) e.respondWith(redPrimero(req));
  else if (AFUERA.indexOf(u.hostname) >= 0) e.respondWith(guardadoPrimero(req));
});
