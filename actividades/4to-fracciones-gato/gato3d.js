/* El gato come fracciones — Michi y su dueño en 3D, hechos de bloques con texturas de pixeles (three.js r128).
   window.REF4_GATO3D = {fondo() → true si pudo, estado(cara), boca() → {x, y} en pantalla, activo(), alTocar(fn)}.
   v1.1: a pantalla completa, detrás de la interfaz (como la mascota de Luz), en una isla de pasto con árboles,
   flores y una sandía. La cámara deja a Michi a la izquierda (horizontal) o arriba (vertical), donde no tapa el panel.
   v1.2: arrastrar (mouse o dedo) gira la escena, con inercia; la rueda o dos dedos acercan; doble toque la endereza.
   Tocar: a Michi (salta), al chico (saluda), la sandía (Michi va y come), un árbol (se sacude), una flor (salta) o el pasto
   (Michi camina hasta ahí; a los 8 s vuelve a su lugar).
   Caras/estados: normal, come (mastica y vuelan migas), feliz (saltan los dos), puaj (escupe y sacude la cabeza),
   piensa (inclina la cabeza). Versión 1.2.0 (2026-10-20). */
(function (root) {
  'use strict';
  var T = root.THREE, R = null, cont = null, tocar = null, ray = null, mundo = {}, dBase = 6, giro = { yaw: 0, pitch: 0, zoom: 1, vel: 0, volver: false }, saludo = 0, escena, camara, gato = {}, chico = {}, parts = [], estado = 'normal', tEstado = 0, reloj = 0, ult = 0, ok = null;
  var PX = 1 / 16; // un pixel de textura = 1/16 de bloque

  /* ---------- texturas de pixeles ---------- */
  var semilla = 7; function azar() { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; }
  // tex(w, h, base, dibujar(px)) → material con textura de pixeles; px(x, y, color) pinta uno; el ruido le da el aire de bloque.
  function tex(w, h, base, dibujar, ruido) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var r = azar(); if (r < (ruido || 0.25)) { g.fillStyle = r < (ruido || 0.25) / 2 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.08)'; g.fillRect(x, y, 1, 1); } }
    if (dibujar) dibujar(function (x, y, col, ww, hh) { g.fillStyle = col; g.fillRect(x, y, ww || 1, hh || 1); });
    var t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter;
    return new T.MeshLambertMaterial({ map: t });
  }
  // caja(w, h, d en pixeles, [der, izq, arriba, abajo, frente, atrás]) con el pivote arriba (py=1), en el medio o abajo.
  function caja(w, h, d, mats, piv) {
    var geo = new T.BoxGeometry(w * PX, h * PX, d * PX);
    if (piv === 'arriba') geo.translate(0, -h * PX / 2, 0); else if (piv === 'abajo') geo.translate(0, h * PX / 2, 0);
    return new T.Mesh(geo, mats);
  }
  function seis(m) { return [m, m, m, m, m, m]; }

  /* ---------- Michi: gato naranja atigrado ---------- */
  var NAR = '#e89a3c', RAY = '#b86a22', CLARO = '#f6d7a8';
  function rayado(w, h) { return tex(w, h, NAR, function (px) { for (var x = 1; x < w; x += 3) px(x, 0, RAY, 1, Math.max(1, h - 1)); }); }
  function armarGato() {
    var g = new T.Group();
    var cuerpo = caja(6, 6, 14, [rayado(14, 6), rayado(14, 6), rayado(6, 14), tex(6, 14, CLARO), tex(6, 6, NAR), tex(6, 6, NAR)]);
    cuerpo.position.set(0, 10 * PX, 0); g.add(cuerpo);
    var frente = tex(6, 5, NAR, function (px) { px(1, 1, '#ffffff'); px(1, 2, '#3cbf5a'); px(4, 1, '#ffffff'); px(4, 2, '#3cbf5a'); px(2, 0, RAY); px(3, 0, RAY); });
    var cab = new T.Group(); cab.position.set(0, 13 * PX, 8 * PX); g.add(cab);
    var cabeza = caja(6, 5, 5, [tex(5, 5, NAR), tex(5, 5, NAR), rayado(6, 5), tex(6, 5, NAR), frente, tex(6, 5, NAR)]);
    cabeza.position.set(0, 0, 1.5 * PX); cab.add(cabeza);
    var hocico = caja(3, 2, 1, [tex(1, 2, CLARO), tex(1, 2, CLARO), tex(3, 1, CLARO), tex(3, 1, CLARO), tex(3, 2, CLARO, function (px) { px(1, 0, '#e5677f'); }), tex(3, 2, CLARO)]);
    hocico.position.set(0, -1.5 * PX, 4.5 * PX); cab.add(hocico);
    [-2, 2].forEach(function (x) { var o = caja(1, 2, 2, [tex(2, 2, NAR), tex(2, 2, NAR), tex(1, 2, NAR), tex(1, 2, NAR), tex(1, 2, '#f19aa8'), tex(1, 2, NAR)], 'abajo'); o.position.set(x * PX, 2.5 * PX, 1.5 * PX); cab.add(o); });
    var patas = [];
    [[-2, 5], [2, 5], [-2, -5], [2, -5]].forEach(function (p) {
      var l = caja(2, 7, 2, seis(tex(2, 7, NAR, function (px) { px(0, 6, CLARO, 2, 1); })), 'arriba'); l.position.set(p[0] * PX, 7 * PX, p[1] * PX); g.add(l); patas.push(l);
    });
    var cola = new T.Group(); cola.position.set(0, 12 * PX, -7 * PX); g.add(cola);
    var c1 = caja(1, 8, 1, seis(rayado(1, 8)), 'arriba'); c1.rotation.x = -0.9; cola.add(c1);
    var c2 = caja(1, 6, 1, seis(tex(1, 6, NAR, function (px) { px(0, 4, RAY, 1, 2); })), 'arriba'); c2.position.set(0, -8 * PX * Math.cos(0.9), -8 * PX * Math.sin(0.9)); c2.rotation.x = -0.3; cola.add(c2);
    gato = { g: g, cab: cab, patas: patas, cola: cola, hocico: hocico };
    return g;
  }

  /* ---------- el chico (jugador de bloques) ---------- */
  var PIEL = '#e0a77c', PELO = '#5a3a1e', REM = '#27a3b5', PANT = '#3b3fa6';
  function armarChico() {
    var g = new T.Group();
    var cara = tex(8, 8, PIEL, function (px) {
      px(0, 0, PELO, 8, 2); px(0, 2, PELO); px(7, 2, PELO);
      px(1, 4, '#ffffff'); px(2, 4, '#3a5fcd'); px(5, 4, '#3a5fcd'); px(6, 4, '#ffffff');
      px(3, 5, '#c98a62', 2, 1); px(3, 6, '#8a4a3a', 2, 1);
    });
    var lado = tex(8, 8, PIEL, function (px) { px(0, 0, PELO, 8, 3); px(5, 3, PELO, 3, 2); });
    var nuca = tex(8, 8, PELO, function (px) { px(0, 7, PELO, 8, 1); });
    var cab = new T.Group(); cab.position.set(0, 24 * PX, 0); g.add(cab);
    var cabeza = caja(8, 8, 8, [lado, lado, tex(8, 8, PELO), tex(8, 8, PIEL), cara, nuca], 'abajo'); cab.add(cabeza);
    var cuerpo = caja(8, 12, 4, seis(tex(8, 12, REM, function (px) { px(3, 0, '#1e8292', 2, 1); })), 'abajo'); cuerpo.position.y = 12 * PX; g.add(cuerpo);
    var brazo = function () { return caja(4, 12, 4, seis(tex(4, 12, PIEL, function (px) { px(0, 0, REM, 4, 4); })), 'arriba'); };
    var bi = brazo(), bd = brazo(); bi.position.set(-6 * PX, 24 * PX, 0); bd.position.set(6 * PX, 24 * PX, 0); g.add(bi, bd);
    var pierna = function () { return caja(4, 12, 4, seis(tex(4, 12, PANT, function (px) { px(0, 10, '#6b6b6b', 4, 2); })), 'arriba'); };
    var pi = pierna(), pd = pierna(); pi.position.set(-2 * PX, 12 * PX, 0); pd.position.set(2 * PX, 12 * PX, 0); g.add(pi, pd);
    chico = { g: g, cab: cab, bi: bi, bd: bd, pi: pi, pd: pd };
    return g;
  }

  /* ---------- el mundo: isla de pasto, árboles, flores y una sandía ---------- */
  function bloque(w, h, d, mats) { return new T.Mesh(new T.BoxGeometry(w, h, d), mats.length ? mats : seis(mats)); }
  function armarMundo() {
    var g = new T.Group(), pasto = tex(16, 16, '#5fae3c', null, 0.5), costado = tex(16, 16, '#8a5a35', function (px) { px(0, 0, '#5fae3c', 16, 4); px(0, 4, '#6f9e35', 16, 1); }, 0.5);
    var tierra = tex(16, 16, '#8a5a35', null, 0.5);
    var isla = bloque(6.4, 0.5, 3.4, [costado, costado, pasto, tierra, costado, costado]); isla.position.set(0, -0.25, -0.3); g.add(isla);
    var abajo = bloque(4.6, 0.5, 2.2, [tierra, tierra, tierra, tierra, tierra, tierra]); abajo.position.set(0, -0.75, -0.3); g.add(abajo);
    var tronco = tex(8, 16, '#7a5230', function (px) { for (var x = 1; x < 8; x += 3) px(x, 0, '#5e3d22', 1, 16); }), hojas = tex(16, 16, '#3f8f2f', null, 0.6);
    mundo = { isla: isla, arboles: [], flores: [] };
    [[-2.5, -1.3, 1.3], [2.6, -1.4, 1.1], [-1.4, -1.7, 0.9]].forEach(function (a) {
      var ar = new T.Group(); ar.position.set(a[0], 0, a[1]); g.add(ar); mundo.arboles.push(ar);
      var t = bloque(0.3, a[2] * 1.2, 0.3, tronco); t.position.set(0, a[2] * 0.6, 0); ar.add(t);
      var c = bloque(a[2], a[2] * 0.8, a[2], hojas); c.position.set(0, a[2] * 1.2 + a[2] * 0.3, 0); ar.add(c);
      var c2 = bloque(a[2] * 0.55, a[2] * 0.45, a[2] * 0.55, hojas); c2.position.set(0, a[2] * 1.2 + a[2] * 0.85, 0); ar.add(c2);
      ar.userData.copa = a[2] * 1.5;
    });
    var COL = ['#e5484d', '#f5c84a', '#ffffff', '#b07cff'];
    [[-1.9, 0.6], [-2.8, 0.1], [1.7, 0.9], [2.9, 0.4], [-0.2, 1.0], [1.2, -0.8], [-2.2, -0.6], [2.2, -0.2]].forEach(function (a, i) {
      var tallo = bloque(0.04, 0.18, 0.04, new T.MeshLambertMaterial({ color: 0x3f8f2f })); tallo.position.set(a[0], 0.09, a[1]); g.add(tallo);
      var flor = bloque(0.11, 0.11, 0.11, new T.MeshLambertMaterial({ color: COL[i % COL.length] })); flor.position.set(a[0], 0.21, a[1]); g.add(flor);
      flor.userData.color = COL[i % COL.length]; mundo.flores.push(flor);
    });
    var melon = tex(16, 16, '#5aa02c', function (px) { for (var x = 0; x < 16; x += 4) px(x, 0, '#3d7a1c', 2, 16); }), melonTapa = tex(16, 16, '#5aa02c', function (px) { px(3, 3, '#3d7a1c', 10, 10); px(5, 5, '#5aa02c', 6, 6); });
    var sandia = bloque(0.42, 0.42, 0.42, [melon, melon, melonTapa, melon, melon, melon]); sandia.position.set(1.55, 0.21, 0.55); sandia.rotation.y = 0.4; g.add(sandia); mundo.sandia = sandia;
    var tajada = bloque(0.3, 0.1, 0.2, [tex(8, 4, '#e5484d', function (px) { px(0, 3, '#5aa02c', 8, 1); px(2, 1, '#222222'); px(5, 1, '#222222'); })]); tajada.position.set(1.15, 0.05, 0.85); tajada.rotation.y = -0.3; g.add(tajada);
    return g;
  }

  /* ---------- migas, corazones y escupida (cubitos) ---------- */
  var cubo = null;
  function chispas(n, color, desde, vel) {
    if (!cubo) cubo = new T.BoxGeometry(1.4 * PX, 1.4 * PX, 1.4 * PX);
    for (var i = 0; i < n; i++) {
      var m = new T.Mesh(cubo, new T.MeshLambertMaterial({ color: Array.isArray(color) ? color[i % color.length] : color }));
      m.position.copy(desde); escena.add(m);
      parts.push({ m: m, v: new T.Vector3(vel.x + (azar() - 0.5) * vel.r, vel.y + azar() * vel.r, vel.z + (azar() - 0.5) * vel.r), vida: 0.9 + azar() * 0.4, g: vel.g === undefined ? -2.2 : vel.g });
    }
  }
  function bocaMundo() { var p = new T.Vector3(); gato.hocico.getWorldPosition(p); return p; }

  /* ---------- armar la escena ---------- */
  function crear() {
    if (ok !== null) return ok;
    try {
      if (!T) throw new Error('sin three.js');
      R = new T.WebGLRenderer({ antialias: true, alpha: true }); R.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
      R.domElement.className = 'gt-canvas';
      escena = new T.Scene();
      camara = new T.PerspectiveCamera(30, 1.4, 0.1, 80);
      escena.add(new T.HemisphereLight(0xffffff, 0x8a7a6a, 0.75));
      var sol = new T.DirectionalLight(0xffffff, 0.65); sol.position.set(2, 4, 3); escena.add(sol);
      escena.add(armarMundo());
      var gg = armarGato(); gg.position.set(0.55, 0, 0.2); gg.rotation.y = -0.75; gg.scale.setScalar(1.2); escena.add(gg);
      var cc = armarChico(); cc.position.set(-0.7, 0, -0.1); cc.rotation.y = 0.35; escena.add(cc);
      gg.userData.casa = gg.position.clone(); gg.userData.rot = gg.rotation.y; gato.rotQuiere = gg.rotation.y;
      ray = new T.Raycaster(); manejarToques(R.domElement);
      requestAnimationFrame(cuadro); ok = true;
    } catch (e) { ok = false; if (root.console) console.warn('[gato 3D] sin 3D, uso el dibujo:', e.message); }
    return ok;
  }

  function cuadro(ms) {
    requestAnimationFrame(cuadro);
    var c = R.domElement; if (!c.isConnected || document.hidden) { ult = ms; return; }
    var dt = Math.min(0.05, ult ? (ms - ult) / 1000 : 0.016); ult = ms; reloj += dt; tEstado += dt;
    var w = c.parentNode.clientWidth, h = c.parentNode.clientHeight;
    if (w && h && (c.width !== Math.round(w * R.getPixelRatio()) || c.height !== Math.round(h * R.getPixelRatio()))) encuadrar(w, h);
    if (giro.volver) { giro.yaw *= 0.86; giro.pitch *= 0.86; giro.zoom += (1 - giro.zoom) * 0.14; if (Math.abs(giro.yaw) + Math.abs(giro.pitch) < 0.002) giro.volver = false; }
    else if (!arrastrando && giro.vel) { giro.yaw += giro.vel * dt; giro.vel *= Math.pow(0.04, dt); if (Math.abs(giro.vel) < 0.02) giro.vel = 0; }
    ponerCamara();
    animar(dt);
    R.render(escena, camara);
  }

  // Michi y el chico van en la parte libre de la pantalla: a la izquierda en horizontal (el panel está a la derecha)
  // o arriba en vertical. Se aleja la cámara hasta que entran y se corre la imagen con setViewOffset.
  // Las mismas medidas que en gato.css (760 px y horizontal).
  function encuadrar(w, h) {
    R.setSize(w, h, false); camara.aspect = w / h;
    var horiz = w >= 760 && w >= h, zx = horiz ? 0.34 : 0.96, zy = horiz ? 0.66 : 0.26, cx = horiz ? 0.22 : 0.5, cy = horiz ? 0.55 : 0.22;
    var tg = Math.tan(camara.fov * Math.PI / 360);
    dBase = Math.max(3 / (zx * 2 * tg * camara.aspect), 2.3 / (zy * 2 * tg));
    camara.setViewOffset(w, h, w * (0.5 - cx), h * (0.5 - cy), w, h); camara.updateProjectionMatrix(); ponerCamara();
  }
  // La cámara gira alrededor de Michi y el chico (yaw libre, pitch entre casi a ras del pasto y desde arriba).
  var MIRA = null, YAW0 = Math.atan2(0.06, 1), PITCH0 = Math.asin(0.2 / Math.hypot(0.06, 0.2, 1));
  function ponerCamara() {
    if (!MIRA) MIRA = new T.Vector3(0, 0.95, 0);
    giro.pitch = Math.max(0.02 - PITCH0, Math.min(1.25 - PITCH0, giro.pitch)); giro.zoom = Math.max(0.6, Math.min(1.7, giro.zoom));
    var y = YAW0 + giro.yaw, p = PITCH0 + giro.pitch, d = dBase * giro.zoom;
    camara.position.set(MIRA.x + Math.sin(y) * Math.cos(p) * d, MIRA.y + Math.sin(p) * d, MIRA.z + Math.cos(y) * Math.cos(p) * d); camara.lookAt(MIRA);
  }

  /* ---------- toques: arrastrar gira, dos dedos o la rueda acercan, tocar hace cosas ---------- */
  var arrastrando = false, dedos = {}, pista = null;
  function manejarToques(el) {
    var x0 = 0, y0 = 0, xa = 0, ta = 0, movio = false, pinza = 0, zoom0 = 1;
    var lista = function () { return Object.keys(dedos).map(function (k) { return dedos[k]; }); };
    el.addEventListener('pointerdown', function (ev) {
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura */ }
      dedos[ev.pointerId] = { x: ev.clientX, y: ev.clientY }; giro.volver = false; giro.vel = 0;
      var l = lista();
      if (l.length === 1) { arrastrando = true; movio = false; x0 = xa = ev.clientX; y0 = ev.clientY; ta = performance.now(); }
      else if (l.length === 2) { pinza = Math.hypot(l[0].x - l[1].x, l[0].y - l[1].y); zoom0 = giro.zoom; movio = true; }
    });
    el.addEventListener('pointermove', function (ev) {
      var dd = dedos[ev.pointerId]; if (!dd) return;
      var dx = ev.clientX - dd.x, dy = ev.clientY - dd.y; dd.x = ev.clientX; dd.y = ev.clientY;
      var l = lista();
      if (l.length >= 2) { var dist = Math.hypot(l[0].x - l[1].x, l[0].y - l[1].y); if (pinza) giro.zoom = zoom0 * pinza / dist; return; }
      if (!movio && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 7) { movio = true; quitarPista(); }
      if (!movio) return;
      giro.yaw -= dx * 0.009; giro.pitch += dy * 0.006;
      var ahora = performance.now(), dt = Math.max(8, ahora - ta); giro.vel = -(ev.clientX - xa) * 0.009 / (dt / 1000); xa = ev.clientX; ta = ahora;
    });
    var soltar = function (ev) {
      if (!dedos[ev.pointerId]) return;
      delete dedos[ev.pointerId];
      if (lista().length) return;
      arrastrando = false;
      if (performance.now() - ta > 90) giro.vel = 0;        // soltó quieto: sin inercia
      if (!movio && ev.type === 'pointerup') tocarEn(ev.clientX, ev.clientY);
    };
    el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar);
    el.addEventListener('wheel', function (ev) { ev.preventDefault(); giro.zoom *= 1 + Math.max(-0.3, Math.min(0.3, ev.deltaY * 0.0012)); }, { passive: false });
    el.addEventListener('dblclick', function () { giro.volver = true; giro.vel = 0; });
  }
  function quitarPista() { if (pista) { pista.classList.add('fuera'); var p = pista; pista = null; setTimeout(function () { p.remove(); }, 600); } }
  function tocarEn(x, y) {
    var r = R.domElement.getBoundingClientRect(), v = new T.Vector2((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    ray.setFromCamera(v, camara);
    var hit = function (o) { return ray.intersectObject(o, true)[0]; };
    if (hit(gato.g)) { cambiar('feliz'); if (tocar) tocar(); return; }
    if (hit(chico.g)) { saludo = 1.6; chispas(5, [0xffd34d, 0xffffff], chico.cab.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.6, 0)), { x: 0, y: 0.9, z: 0, r: 0.6, g: 0.3 }); return; }
    if (hit(mundo.sandia)) { var sp = mundo.sandia.position; caminar(sp.x - 0.15, sp.z + 0.55, function () { cambiar('come'); chispas(10, [0xe5484d, 0x5aa02c, 0x222222], bocaMundo(), { x: 0, y: 0.6, z: 0, r: 1 }); }); return; }
    for (var i = 0; i < mundo.arboles.length; i++) {
      var ar = mundo.arboles[i];
      if (hit(ar)) { ar.userData.sacude = 1; chispas(12, [0x3f8f2f, 0x5fae3c, 0x2f6f22], ar.position.clone().setY(ar.userData.copa), { x: 0, y: 0.3, z: 0.3, r: 1.4, g: -1.2 }); return; }
    }
    for (var j = 0; j < mundo.flores.length; j++) {
      var f = mundo.flores[j];
      if (hit(f)) { f.userData.salta = 1; chispas(6, [new T.Color(f.userData.color).getHex(), 0xffffff], f.position.clone(), { x: 0, y: 1, z: 0, r: 0.7, g: -1.5 }); return; }
    }
    var p = hit(mundo.isla); if (p) caminar(p.point.x, p.point.z);
  }
  // Michi camina hasta (x, z) (sin salir de la parte que se ve) y al llegar hace fin(); a los 8 s quieto vuelve a su lugar.
  function caminar(x, z, fin) {
    gato.destino = new T.Vector3(Math.max(-1.7, Math.min(2, x)), 0, Math.max(-1.2, Math.min(1.1, z))); gato.alLlegar = fin || null; gato.quieto = 0;
  }
  function moverGato(dt) {
    var G = gato, g = G.g;
    if (!G.destino) {
      G.quieto = (G.quieto || 0) + dt;
      if (G.quieto > 8 && g.position.distanceTo(g.userData.casa) > 0.1) caminar(g.userData.casa.x, g.userData.casa.z, function () { G.rotQuiere = g.userData.rot; });
    } else {
      var dx = G.destino.x - g.position.x, dz = G.destino.z - g.position.z, dist = Math.hypot(dx, dz);
      if (dist < 0.04) { G.destino = null; G.quieto = 0; var f = G.alLlegar; G.alLlegar = null; if (f) f(); }
      else {
        var paso = Math.min(dist, 1.1 * dt); g.position.x += dx / dist * paso; g.position.z += dz / dist * paso; G.rotQuiere = Math.atan2(dx, dz);
        G.patas.forEach(function (p, i) { p.rotation.x = Math.sin(reloj * 14 + (i % 3 ? Math.PI : 0)) * 0.6; });
      }
    }
    var dr = G.rotQuiere - g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); g.rotation.y += dr * Math.min(1, dt * 8);
    mundo.arboles.forEach(function (ar) { var k = ar.userData.sacude || 0; if (k > 0) { ar.userData.sacude = Math.max(0, k - dt * 1.4); ar.rotation.z = Math.sin(k * 30) * 0.08 * k; ar.rotation.x = Math.cos(k * 26) * 0.05 * k; } });
    mundo.flores.forEach(function (f) { var k = f.userData.salta || 0; if (k > 0) { f.userData.salta = Math.max(0, k - dt * 2); f.position.y = 0.21 + Math.sin((1 - k) * Math.PI) * 0.25; f.rotation.y += dt * 12 * k; } });
  }

  function animar(dt) {
    var t = reloj, e = tEstado, G = gato, C = chico, s = Math.sin;
    // reposo
    G.g.position.y = 0; G.cab.rotation.set(s(t * 1.6) * 0.04, 0, 0); G.cola.rotation.set(0, 0, s(t * 2.4) * 0.35);
    if (!G.destino) G.patas.forEach(function (p) { p.rotation.x = 0; });
    C.g.position.y = 0; C.cab.rotation.set(0, s(t * 0.7) * 0.12, 0);
    C.bi.rotation.set(s(t * 1.8) * 0.06, 0, 0); C.bd.rotation.set(-s(t * 1.8) * 0.06, 0, 0); C.pi.rotation.x = 0; C.pd.rotation.x = 0;
    if (saludo > 0) { saludo -= dt; C.bd.rotation.z = 2.7 + s(t * 14) * 0.35; C.g.position.y = Math.max(0, s((1.6 - saludo) * 6)) * 0.08; }
    if (estado === 'come') {
      G.cab.rotation.x = 0.25 + s(e * 18) * 0.22;
      if (e > 1.4) cambiar('normal');
    } else if (estado === 'feliz') {
      var salto = Math.abs(s(e * 6)) * 0.22; G.g.position.y = salto; C.g.position.y = Math.abs(s(e * 6 + 1)) * 0.16;
      C.bi.rotation.z = -2.6 + s(e * 12) * 0.3; C.bd.rotation.z = 2.6 - s(e * 12) * 0.3;
      G.cola.rotation.z = s(t * 9) * 0.6; G.patas.forEach(function (p, i) { p.rotation.x = salto > 0.05 ? (i < 2 ? -0.6 : 0.6) : 0; });
      if (e > 2.6) cambiar('normal');
    } else if (estado === 'puaj') {
      G.cab.rotation.y = s(e * 22) * 0.45 * Math.max(0, 1 - e); G.cab.rotation.x = -0.15;
      C.bi.rotation.z = -0.5; C.bd.rotation.z = 0.5; C.cab.rotation.z = 0.15;
      if (e > 1.3) cambiar('normal');
    } else if (estado === 'piensa') {
      G.cab.rotation.z = 0.32; C.bd.rotation.x = -2.4; C.bd.rotation.z = 0.35; C.cab.rotation.z = -0.12;
      if (e > 1.5) cambiar('normal');
    }
    moverGato(dt);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.vida -= dt; p.v.y += p.g * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += dt * 5; p.m.rotation.y += dt * 4;
      if (p.vida <= 0) { escena.remove(p.m); p.m.material.dispose(); parts.splice(i, 1); }
    }
  }
  function cambiar(c) {
    estado = c; tEstado = 0; if (!ok) return;
    var b = bocaMundo();
    if (c === 'come') chispas(10, [0xf3c46a, 0xd98b3a, 0xffffff], b, { x: 0, y: 0.6, z: 0.5, r: 1.1 });
    if (c === 'feliz') chispas(9, [0xff4f7b, 0xff8fb0], b.clone().add(new T.Vector3(0, 0.35, 0)), { x: 0, y: 0.9, z: 0, r: 0.9, g: 0.2 });
    if (c === 'puaj') chispas(8, [0x7bd34a, 0x4caf50], b, { x: -0.5, y: 0.5, z: 0.9, r: 0.7 });
  }

  var API = {
    // Pone la escena a pantalla completa detrás de la interfaz (sin WebGL o three.js devuelve false y la interfaz usa el emoji).
    fondo: function () {
      if (!crear()) return false;
      if (!cont) {
        cont = document.createElement('div'); cont.id = 'gt-mundo'; cont.setAttribute('aria-hidden', 'true'); document.body.insertBefore(cont, document.body.firstChild); cont.appendChild(R.domElement);
        pista = document.createElement('div'); pista.className = 'gt-pista'; pista.textContent = '👆 Arrastrá para girar · tocá a Michi, el árbol o la sandía'; cont.appendChild(pista);
        setTimeout(quitarPista, 14000);
      }
      return true;
    },
    alTocar: function (fn) { tocar = fn; },
    estado: function (c) { if (!ok) return; if (c === 'normal' && estado !== 'normal' && tEstado < 0.6) return; if (c !== estado || c !== 'normal') cambiar(c); },
    // Dónde está la boca de Michi en la pantalla (para que las fichas vuelen ahí).
    boca: function () {
      if (!ok || !R.domElement.isConnected) return null;
      var p = bocaMundo().project(camara), r = R.domElement.getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    },
    activo: function () { return !!ok; },
    giro: giro, tocarEn: function (x, y) { tocarEn(x, y); }, caminar: function (x, z) { caminar(x, z); }, gato: function () { return gato.g; }
  };
  root.REF4_GATO3D = API;
})(window);
