/* El astronauta en la luna: escena 3D de bloques detrás de las actividades de Ian (menos el gato, que tiene la suya).
   Depende de three.js r128, REF4_BLOQUES y (si está) REF4_UI. window.REF4_LUNA. Versión 1.0.0 (2026-10-20).
   - Se prende y se apaga con el botón 🚀 de la cabecera (mate.global.escena3d, prendida de entrada).
   - Reacciona a las respuestas: REF4_UI.sonar('ok') → salta despacito (gravedad de la luna) con estrellas;
     'mal' → niega con la cabeza; 'sube' y celebrar() → salta y despega el cohete.
   - Tocar: al astronauta (salta), el cohete (despega y vuelve), una piedra (rebota lejos), la bandera (flamea),
     la Tierra (gira) o el suelo (camina a saltitos hasta ahí y a los 10 s vuelve).
   - REF4_LUNA = {E, estado(c), activa()}. */
(function (root) {
  'use strict';
  var B = root.REF4_BLOQUES; if (!B || !root.THREE) return;
  var T = root.THREE, tex = B.tex, caja = B.caja, bloque = B.bloque, PX = B.PX;
  var astro = {}, mundo = { piedras: [] }, estado = 'normal', tEstado = 0, tierraGiro = 0, cohete = null, bandera = null;

  /* ---------- el astronauta ---------- */
  var BLANCO = '#eef1f6', GRIS = '#9aa3b2', OSCURO = '#5b6475';
  function armarAstronauta() {
    var g = new T.Group();
    var visor = tex(10, 10, BLANCO, function (px) { px(1, 2, '#2a2f45', 8, 6); px(2, 3, '#d9a441', 6, 4); px(2, 3, '#f4cf6b', 2, 1); px(7, 6, '#8a6a2a'); px(0, 9, GRIS, 10, 1); });
    var casco = tex(10, 10, BLANCO, function (px) { px(0, 9, GRIS, 10, 1); px(4, 0, '#d0d6e0', 2, 10); });
    var cab = new T.Group(); cab.position.y = 24 * PX; g.add(cab);
    cab.add(caja(10, 10, 10, [casco, casco, tex(10, 10, BLANCO), tex(10, 10, GRIS), visor, casco], 'abajo'));
    var ant = caja(1, 4, 1, tex(1, 4, GRIS), 'abajo'); ant.position.set(3 * PX, 10 * PX, -2 * PX); cab.add(ant);
    var mLuz = new T.MeshLambertMaterial({ color: 0xff5050, emissive: 0x801010 }), luz = caja(2, 2, 2, mLuz, 'abajo'); luz.position.set(3 * PX, 14 * PX, -2 * PX); cab.add(luz);
    var pecho = tex(8, 12, BLANCO, function (px) { px(2, 3, '#c9ced8', 4, 4); px(2, 3, '#4f8cff'); px(4, 3, '#ff5a5a'); px(2, 5, '#5ad17a'); px(4, 5, '#ffd34d'); px(0, 9, GRIS, 8, 1); });
    var cuerpo = caja(8, 12, 5, [tex(5, 12, BLANCO), tex(5, 12, BLANCO), tex(8, 5, BLANCO), tex(8, 5, GRIS), pecho, tex(8, 12, BLANCO)], 'abajo'); cuerpo.position.y = 12 * PX; g.add(cuerpo);
    var mochila = caja(7, 9, 3, tex(7, 9, GRIS, function (px) { px(1, 1, OSCURO, 5, 1); px(1, 7, OSCURO, 5, 1); }), 'abajo'); mochila.position.set(0, 14 * PX, -4 * PX); g.add(mochila);
    var brazo = function () { return caja(4, 12, 4, tex(4, 12, BLANCO, function (px) { px(0, 9, GRIS, 4, 3); px(0, 4, '#d0d6e0', 4, 1); }), 'arriba'); };
    var bi = brazo(), bd = brazo(); bi.position.set(-6 * PX, 24 * PX, 0); bd.position.set(6 * PX, 24 * PX, 0); g.add(bi, bd);
    var pierna = function () { return caja(4, 12, 4, tex(4, 12, BLANCO, function (px) { px(0, 9, OSCURO, 4, 3); px(0, 5, '#d0d6e0', 4, 1); }), 'arriba'); };
    var pi = pierna(), pd = pierna(); pi.position.set(-2 * PX, 12 * PX, 0); pd.position.set(2 * PX, 12 * PX, 0); g.add(pi, pd);
    astro = { g: g, cab: cab, bi: bi, bd: bd, pi: pi, pd: pd, luz: mLuz };
    return g;
  }

  /* ---------- la luna, la Tierra, el cohete y la bandera ---------- */
  function armarMundo(E) {
    var esc = E.escena, g = new T.Group(); esc.add(g);
    var suelo = tex(16, 16, '#b9bcc4', function (px) { px(3, 4, '#a2a6b0', 3, 2); px(10, 9, '#a2a6b0', 2, 3); px(12, 2, '#cdd0d6'); px(6, 12, '#cdd0d6'); }, 0.5);
    var costado = tex(16, 16, '#8f939d', function (px) { px(0, 0, '#b9bcc4', 16, 3); }, 0.5);
    var isla = bloque(7.2, 0.6, 4.2, [costado, costado, suelo, costado, costado, costado]); isla.position.set(0, -0.3, -0.4); g.add(isla); mundo.isla = isla;
    var abajo = bloque(5, 0.6, 2.8, costado); abajo.position.set(0, -0.9, -0.4); g.add(abajo);
    // cráteres: un hueco oscuro con borde de bloquecitos
    [[-1.9, 0.7, 0.7], [1.2, -1.5, 0.9], [2.7, 0.5, 0.5], [-0.5, -1.7, 0.6]].forEach(function (c) {
      var hueco = bloque(c[2], 0.02, c[2], tex(8, 8, '#8c9099', null, 0.4)); hueco.position.set(c[0], 0.011, c[1]); g.add(hueco);
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
        var b = bloque(d[0] ? 0.12 : c[2], 0.09, d[1] ? 0.12 : c[2], tex(4, 4, '#c6c9d0')); b.position.set(c[0] + d[0] * c[2] / 2, 0.045, c[1] + d[1] * c[2] / 2); g.add(b);
      });
    });
    // piedras (se tocan)
    [[-2.6, -0.6, 0.28], [0.9, 1.0, 0.18], [-1.1, 1.2, 0.14], [3.0, -1.2, 0.3], [1.9, 1.1, 0.12]].forEach(function (p) {
      var r = bloque(p[2], p[2] * 0.8, p[2], tex(8, 8, '#9ea2ab', null, 0.6)); r.position.set(p[0], p[2] * 0.4, p[1]); r.rotation.y = p[0]; g.add(r);
      r.userData.base = r.position.clone(); mundo.piedras.push(r);
    });
    // la Tierra en el cielo
    var mar = tex(16, 16, '#2f7fe0', function (px) { px(2, 3, '#4cb050', 5, 4); px(9, 8, '#4cb050', 4, 5); px(4, 11, '#4cb050', 3, 2); px(11, 2, '#ffffff', 3, 1); px(1, 13, '#ffffff', 4, 1); }, 0.2);
    var tierra = bloque(2.4, 2.4, 2.4, mar); tierra.position.set(-9, 8, -26); g.add(tierra); mundo.tierra = tierra;
    // estrellas
    var pos = []; for (var i = 0; i < 420; i++) { var a = B.azar() * Math.PI * 2, b = B.azar() * 1.3 - 0.2, rr = 70; pos.push(Math.cos(a) * Math.cos(b) * rr, Math.sin(b) * rr, Math.sin(a) * Math.cos(b) * rr); }
    var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    esc.add(new T.Points(geo, new T.PointsMaterial({ color: 0xffffff, size: 0.35 })));
    // cohete
    cohete = new T.Group(); cohete.position.set(2.3, 0, -1.1); g.add(cohete);
    var casco = tex(8, 16, '#f2f2f2', function (px) { px(0, 3, '#d63a3a', 8, 1); px(2, 6, '#5ab4ff', 4, 4); px(3, 7, '#bfe4ff'); });
    var cuerpo = bloque(0.42, 1.1, 0.42, casco); cuerpo.position.y = 0.75; cohete.add(cuerpo);
    var punta1 = bloque(0.3, 0.2, 0.3, tex(4, 4, '#d63a3a')); punta1.position.y = 1.4; cohete.add(punta1);
    var punta2 = bloque(0.14, 0.16, 0.14, tex(4, 4, '#d63a3a')); punta2.position.y = 1.58; cohete.add(punta2);
    [[0.27, 0], [-0.27, 0], [0, 0.27], [0, -0.27]].forEach(function (f) { var al = bloque(f[0] ? 0.12 : 0.04, 0.4, f[1] ? 0.12 : 0.04, tex(4, 4, '#d63a3a')); al.position.set(f[0], 0.32, f[1]); cohete.add(al); });
    var tobera = bloque(0.26, 0.14, 0.26, tex(4, 4, '#555b66')); tobera.position.y = 0.14; cohete.add(tobera);
    cohete.userData = { vuelo: -1 };
    // bandera (celeste y blanca)
    bandera = new T.Group(); bandera.position.set(-1.2, 0, -0.9); g.add(bandera);
    var palo = bloque(0.05, 1.3, 0.05, tex(2, 8, '#d0d0d0')); palo.position.y = 0.65; bandera.add(palo);
    var tela = new T.Group(); tela.position.set(0.03, 1.15, 0); bandera.add(tela);
    var pano = bloque(0.6, 0.38, 0.02, tex(12, 8, '#ffffff', function (px) { px(0, 0, '#74acdf', 12, 3); px(0, 5, '#74acdf', 12, 3); px(5, 3, '#f6b40e', 2, 2); }, 0)); pano.position.x = 0.3; tela.add(pano);
    bandera.userData = { tela: tela, flamea: 0 };
    var a2 = armarAstronauta(); a2.position.set(0.2, 0, 0.2); a2.rotation.y = -0.35; a2.scale.setScalar(1.05); esc.add(a2);
    a2.userData.casa = a2.position.clone(); a2.userData.rot = a2.rotation.y; astro.rotQuiere = a2.rotation.y;
    esc.add(new T.HemisphereLight(0xdfe6ff, 0x404a60, 0.8));
    var sol = new T.DirectionalLight(0xffffff, 0.75); sol.position.set(4, 6, 3); esc.add(sol);
  }

  /* ---------- animación ---------- */
  function polvo(E, desde, n) { E.chispas(n || 6, [0xc9ccd3, 0xa9adb6], desde, { x: 0, y: 0.25, z: 0, r: 0.9, g: -0.5, vida: 1.4 }); }
  function cambiar(E, c) {
    estado = c; tEstado = 0;
    var cabeza = astro.cab.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.9, 0));
    if (c === 'feliz') E.chispas(10, [0xffd34d, 0xffffff, 0x8ad1ff], cabeza, { x: 0, y: 0.6, z: 0, r: 1, g: -0.25, vida: 1.8 });
    if (c === 'festeja') { E.chispas(16, [0xffd34d, 0xff6b9a, 0x8ad1ff, 0x5ad17a], cabeza, { x: 0, y: 0.9, z: 0, r: 1.4, g: -0.3, vida: 2 }); despegar(); }
  }
  function despegar() { if (cohete.userData.vuelo < 0) cohete.userData.vuelo = 0; }
  function caminar(x, z) { astro.destino = new T.Vector3(Math.max(-2, Math.min(2.4, x)), 0, Math.max(-1.6, Math.min(1.3, z))); astro.quieto = 0; }
  function animar(E, dt, t) {
    var A = astro, g = A.g, s = Math.sin, e = (tEstado += dt);
    // reposo: flota un poco (poca gravedad)
    var y = 0.025 + s(t * 1.4) * 0.025;
    A.cab.rotation.set(0, s(t * 0.5) * 0.25, 0); A.bi.rotation.set(s(t * 1.2) * 0.08, 0, -0.08); A.bd.rotation.set(-s(t * 1.2) * 0.08, 0, 0.08);
    A.pi.rotation.x = 0; A.pd.rotation.x = 0; A.luz.emissive.setHex(s(t * 4) > 0 ? 0xc02020 : 0x300808);
    if (A.destino) {
      var dx = A.destino.x - g.position.x, dz = A.destino.z - g.position.z, dist = Math.hypot(dx, dz);
      if (dist < 0.05) { A.destino = null; A.quieto = 0; polvo(E, g.position.clone(), 8); }
      else { var paso = Math.min(dist, 0.8 * dt); g.position.x += dx / dist * paso; g.position.z += dz / dist * paso; A.rotQuiere = Math.atan2(dx, dz); y += Math.abs(s(t * 5)) * 0.28; A.pi.rotation.x = 0.5; A.pd.rotation.x = 0.3; A.bi.rotation.x = -0.6; A.bd.rotation.x = -0.6; }
    } else {
      A.quieto = (A.quieto || 0) + dt;
      if (A.quieto > 10 && g.position.distanceTo(g.userData.casa) > 0.1) { caminar(g.userData.casa.x, g.userData.casa.z); A.vuelve = true; }
      else if (A.vuelve && g.position.distanceTo(g.userData.casa) <= 0.1) { A.vuelve = false; A.rotQuiere = g.userData.rot; }
    }
    if (estado === 'feliz' || estado === 'festeja') {
      var k = Math.min(1, e / 1.8); y += s(k * Math.PI) * 0.9;
      A.bi.rotation.z = -2.7; A.bd.rotation.z = 2.7; A.pi.rotation.x = -0.4 * s(k * Math.PI); A.pd.rotation.x = 0.4 * s(k * Math.PI);
      if (k >= 1) { estado = 'normal'; polvo(E, g.position.clone(), 10); }
    } else if (estado === 'mal') {
      A.cab.rotation.y = s(e * 18) * 0.5 * Math.max(0, 1 - e / 1.2); A.bi.rotation.z = -0.5; A.bd.rotation.z = 0.5;
      if (e > 1.2) estado = 'normal';
    }
    g.position.y = y;
    var dr = A.rotQuiere - g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); g.rotation.y += dr * Math.min(1, dt * 6);
    // la Tierra, el cohete, la bandera y las piedras
    tierraGiro = Math.max(0, tierraGiro - dt * 0.8); mundo.tierra.rotation.y += dt * (0.08 + tierraGiro * 4); mundo.tierra.rotation.x = 0.3;
    var c = cohete.userData;
    if (c.vuelo >= 0) {
      c.vuelo += dt; var v = c.vuelo;
      cohete.position.y = v < 2.5 ? Math.pow(v, 2) * 1.6 : (v < 4 ? 10 : Math.max(0, 10 - (v - 4) * 3));
      cohete.rotation.y += dt * 2;
      if (v < 2.5 || (v > 4 && cohete.position.y > 0.05)) E.chispas(2, [0xffa133, 0xffe066, 0xff5a1f], cohete.position.clone().add(new T.Vector3(0, 0.05, 0)), { x: 0, y: -1.2, z: 0, r: 0.5, g: 0, vida: 0.5 });
      if (v > 4 && cohete.position.y <= 0) { c.vuelo = -1; cohete.position.y = 0; polvo(E, cohete.position.clone(), 14); }
    }
    var bu = bandera.userData; bu.flamea = Math.max(0, bu.flamea - dt * 0.5); bu.tela.rotation.y = s(t * 3) * 0.08 + s(t * 11) * 0.35 * bu.flamea;
    mundo.piedras.forEach(function (r) {
      var u = r.userData; if (!u.salto) return;
      u.salto.t += dt; var k = Math.min(1, u.salto.t / 1.6);
      r.position.x = u.salto.x0 + (u.salto.x1 - u.salto.x0) * k; r.position.z = u.salto.z0 + (u.salto.z1 - u.salto.z0) * k;
      r.position.y = u.base.y + Math.sin(k * Math.PI) * 0.8; r.rotation.x += dt * 4;
      if (k >= 1) { u.salto = null; polvo(E, r.position.clone(), 5); }
    });
  }
  function tocar(E, ray) {
    var hit = function (o) { return ray.intersectObject(o, true)[0]; };
    if (hit(astro.g)) { cambiar(E, 'feliz'); return true; }
    if (hit(cohete)) { despegar(); return true; }
    if (hit(bandera)) { bandera.userData.flamea = 1; return true; }
    if (hit(mundo.tierra)) { tierraGiro = 1.5; return true; }
    for (var i = 0; i < mundo.piedras.length; i++) {
      var r = mundo.piedras[i];
      if (hit(r)) { if (!r.userData.salto) { var a = B.azar() * Math.PI * 2; r.userData.salto = { t: 0, x0: r.position.x, z0: r.position.z, x1: Math.max(-3, Math.min(3, r.position.x + Math.cos(a) * 0.9)), z1: Math.max(-2, Math.min(1.4, r.position.z + Math.sin(a) * 0.6)) }; polvo(E, r.position.clone(), 4); } return true; }
    }
    var p = hit(mundo.isla); if (p) { caminar(p.point.x, p.point.z); return true; }
    return false;
  }

  /* ---------- armar, botón 🚀 y reacciones ---------- */
  var E = B.escena({ fondo: '#0b1030', mira: [0, 1.0, 0], dir: [0.1, 0.22, 1], ancho: 3.2, alto: 2.5,
    pista: '👆 Arrastrá para girar · rueda para acercar · tocá al astronauta, el cohete o la Tierra', armar: armarMundo, animar: animar, tocar: tocar });
  if (!E) return;
  var prendida = !root.MATE || MATE.global.get('escena3d', true) !== false;
  function poner(on) {
    prendida = on; E.mostrar(on); if (root.MATE) MATE.global.set('escena3d', on);
    var b = document.getElementById('b3d-btn'); if (b) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); b.title = on ? 'Esconder la luna' : 'Mostrar la luna'; }
  }
  function boton() {
    var junto = document.getElementById('fondo') || document.getElementById('tema'); if (!junto || document.getElementById('b3d-btn')) return;
    var b = document.createElement('button'); b.className = 'ref-btn'; b.id = 'b3d-btn'; b.type = 'button'; b.textContent = '🚀';
    b.onclick = function () { poner(!prendida); };
    junto.parentNode.insertBefore(b, junto); poner(prendida);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boton); else boton();
  E.mostrar(prendida);
  var UI = root.REF4_UI;
  if (UI) {
    var sonar = UI.sonar, celebrar = UI.celebrar;
    UI.sonar = function (que) { if (prendida) { if (que === 'ok') cambiar(E, 'feliz'); else if (que === 'mal') cambiar(E, 'mal'); else if (que === 'sube') cambiar(E, 'festeja'); } return sonar.apply(this, arguments); };
    if (celebrar) UI.celebrar = function () { if (prendida) cambiar(E, 'festeja'); return celebrar.apply(this, arguments); };
  }
  root.REF4_LUNA = { E: E, estado: function (c) { cambiar(E, c); }, activa: function () { return prendida; }, caminar: caminar, astro: function () { return astro.g; }, cohete: function () { return cohete; } };
})(window);
