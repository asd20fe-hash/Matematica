/* El gato come fracciones — Michi y su dueño en 3D, hechos de bloques con texturas de pixeles (three.js r128).
   window.REF4_GATO3D = {montar(cont) → true si pudo, estado(cara), boca() → {x, y} en pantalla}.
   Un solo renderer para toda la actividad: montar() mueve el mismo canvas al contenedor nuevo (la interfaz repinta seguido).
   Caras/estados: normal, come (mastica y vuelan migas), feliz (saltan los dos), puaj (escupe y sacude la cabeza),
   piensa (inclina la cabeza). Versión 1.0.0 (2026-10-19). */
(function (root) {
  'use strict';
  var T = root.THREE, R = null, escena, camara, gato = {}, chico = {}, parts = [], estado = 'normal', tEstado = 0, reloj = 0, ult = 0, ok = null;
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
      camara = new T.PerspectiveCamera(30, 1.4, 0.1, 50); camara.position.set(0.25, 1.5, 4.6); camara.lookAt(0, 0.92, 0);
      escena.add(new T.HemisphereLight(0xffffff, 0x8a7a6a, 0.75));
      var sol = new T.DirectionalLight(0xffffff, 0.65); sol.position.set(2, 4, 3); escena.add(sol);
      var piso = new T.Mesh(new T.BoxGeometry(3.2, 0.12, 1.6), [0, 0, 0, 0, 0, 0].map(function (_, i) {
        return i === 2 ? tex(16, 8, '#5fae3c', null, 0.5) : tex(16, 8, '#8a5a35', function (px) { px(0, 0, '#5fae3c', 16, 2); }, 0.5);
      }));
      piso.position.set(0, -0.06, 0); escena.add(piso);
      var gg = armarGato(); gg.position.set(0.55, 0, 0.2); gg.rotation.y = -0.75; gg.scale.setScalar(1.2); escena.add(gg);
      var cc = armarChico(); cc.position.set(-0.7, 0, -0.1); cc.rotation.y = 0.35; escena.add(cc);
      requestAnimationFrame(cuadro); ok = true;
    } catch (e) { ok = false; if (root.console) console.warn('[gato 3D] sin 3D, uso el dibujo:', e.message); }
    return ok;
  }

  function cuadro(ms) {
    requestAnimationFrame(cuadro);
    var c = R.domElement; if (!c.isConnected || document.hidden) { ult = ms; return; }
    var dt = Math.min(0.05, ult ? (ms - ult) / 1000 : 0.016); ult = ms; reloj += dt; tEstado += dt;
    var w = c.parentNode.clientWidth, h = c.parentNode.clientHeight;
    if (w && h && (c.width !== Math.round(w * R.getPixelRatio()) || c.height !== Math.round(h * R.getPixelRatio()))) { R.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix(); }
    animar(dt);
    R.render(escena, camara);
  }

  function animar(dt) {
    var t = reloj, e = tEstado, G = gato, C = chico, s = Math.sin;
    // reposo
    G.g.position.y = 0; G.cab.rotation.set(s(t * 1.6) * 0.04, 0, 0); G.cola.rotation.set(0, 0, s(t * 2.4) * 0.35);
    G.patas.forEach(function (p) { p.rotation.x = 0; });
    C.g.position.y = 0; C.cab.rotation.set(0, s(t * 0.7) * 0.12, 0);
    C.bi.rotation.set(s(t * 1.8) * 0.06, 0, 0); C.bd.rotation.set(-s(t * 1.8) * 0.06, 0, 0); C.pi.rotation.x = 0; C.pd.rotation.x = 0;
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
    // Pone el canvas dentro de cont (si no hay WebGL o three.js devuelve false y la interfaz usa el emoji).
    montar: function (cont) { if (!cont || !crear()) return false; if (R.domElement.parentNode !== cont) cont.appendChild(R.domElement); return true; },
    estado: function (c) { if (!ok) return; if (c === 'normal' && estado !== 'normal' && tEstado < 0.6) return; if (c !== estado || c !== 'normal') cambiar(c); },
    // Dónde está la boca de Michi en la pantalla (para que las fichas vuelen ahí).
    boca: function () {
      if (!ok || !R.domElement.isConnected) return null;
      var p = bocaMundo().project(camara), r = R.domElement.getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    },
    activo: function () { return !!ok; }
  };
  root.REF4_GATO3D = API;
})(window);
