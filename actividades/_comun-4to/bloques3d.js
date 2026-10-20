/* Escenas 3D de bloques (estilo cubos con texturas de pixeles) a pantalla completa detrás de la interfaz. three.js r128.
   window.REF4_BLOQUES. Versión 1.0.0 (2026-10-20).
   - Ayudas: PX (un pixel de textura = 1/16 de bloque), tex(w, h, base, dibujar(px), ruido) → material de pixeles,
     caja(w, h, d en pixeles, mats, pivote 'arriba'|'abajo'), bloque(w, h, d en unidades, mats), seis(m), azar().
   - escena(op) → E | null (sin three.js o sin WebGL). op: {fondo (color del cielo o null = transparente), mira [x,y,z],
     dir [x,y,z] (de dónde mira la cámara), ancho, alto (lo que tiene que entrar en la parte libre), pista (texto),
     armar(E), animar(E, dt, t), tocar(E, ray) (true si tocó algo)}.
     E: {T, escena, camara, R, giro, chispas(n, colores, desde, vel), mostrar(on), visible(), proyectar(v3) → {x, y}}.
   - Controles: arrastrar gira (con inercia), la rueda acerca y aleja (y gira con la rueda de costado o Shift),
     dos dedos acercan, doble toque endereza. Un toque sin arrastrar llama a op.tocar.
   - Encuadre: en horizontal (≥ 760 px) la escena va a la izquierda y el panel a la derecha; en vertical, arriba
     (las mismas medidas que body.b3d en comun.css). */
(function (root) {
  'use strict';
  var T = root.THREE, PX = 1 / 16;
  var semilla = 7; function azar() { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; }
  function tex(w, h, base, dibujar, ruido) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'), rr = ruido === undefined ? 0.25 : ruido;
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var r = azar(); if (r < rr) { g.fillStyle = r < rr / 2 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.08)'; g.fillRect(x, y, 1, 1); } }
    if (dibujar) dibujar(function (x, y, col, ww, hh) { g.fillStyle = col; g.fillRect(x, y, ww || 1, hh || 1); });
    var t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter;
    return new T.MeshLambertMaterial({ map: t });
  }
  function seis(m) { return [m, m, m, m, m, m]; }
  function caja(w, h, d, mats, piv) {
    var geo = new T.BoxGeometry(w * PX, h * PX, d * PX);
    if (piv === 'arriba') geo.translate(0, -h * PX / 2, 0); else if (piv === 'abajo') geo.translate(0, h * PX / 2, 0);
    return new T.Mesh(geo, Array.isArray(mats) ? mats : seis(mats));
  }
  function bloque(w, h, d, mats) { return new T.Mesh(new T.BoxGeometry(w, h, d), Array.isArray(mats) ? mats : seis(mats)); }

  function escena(op) {
    if (!T) return null;
    var R;
    try { R = new T.WebGLRenderer({ antialias: true, alpha: !op.fondo }); } catch (e) { console.warn('[bloques 3D] sin WebGL:', e.message); return null; }
    R.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); R.domElement.className = 'b3d-canvas';
    var esc = new T.Scene(); if (op.fondo) esc.background = new T.Color(op.fondo);
    var cam = new T.PerspectiveCamera(30, 1.4, 0.1, 200), giro = { yaw: 0, pitch: 0, zoom: 1, vel: 0, volver: false };
    var mira = new T.Vector3().fromArray(op.mira || [0, 1, 0]), d0 = new T.Vector3().fromArray(op.dir || [0.06, 0.2, 1]);
    var YAW0 = Math.atan2(d0.x, d0.z), PITCH0 = Math.asin(d0.y / d0.length()), dBase = 6, parts = [], cubo = new T.BoxGeometry(1.4 * PX, 1.4 * PX, 1.4 * PX);
    var cont = document.createElement('div'); cont.className = 'b3d-mundo'; cont.setAttribute('aria-hidden', 'true'); cont.appendChild(R.domElement);
    var E = { T: T, escena: esc, camara: cam, R: R, giro: giro, cont: cont, encendida: false };

    E.chispas = function (n, color, desde, vel) {
      for (var i = 0; i < n; i++) {
        var m = new T.Mesh(cubo, new T.MeshLambertMaterial({ color: Array.isArray(color) ? color[i % color.length] : color }));
        m.position.copy(desde); esc.add(m);
        parts.push({ m: m, v: new T.Vector3(vel.x + (azar() - 0.5) * vel.r, vel.y + azar() * vel.r, vel.z + (azar() - 0.5) * vel.r), vida: vel.vida || (0.9 + azar() * 0.4), g: vel.g === undefined ? -2.2 : vel.g });
      }
    };
    E.proyectar = function (v) { var p = v.clone().project(cam), r = R.domElement.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; };

    function encuadrar(w, h) {
      R.setSize(w, h, false); cam.aspect = w / h;
      var horiz = w >= 760 && w >= h, zx = horiz ? 0.34 : 0.96, zy = horiz ? 0.66 : 0.26, cx = horiz ? 0.22 : 0.5, cy = horiz ? 0.55 : 0.22;
      var tg = Math.tan(cam.fov * Math.PI / 360);
      dBase = Math.max((op.ancho || 3) / (zx * 2 * tg * cam.aspect), (op.alto || 2.3) / (zy * 2 * tg));
      cam.setViewOffset(w, h, w * (0.5 - cx), h * (0.5 - cy), w, h); cam.updateProjectionMatrix();
    }
    function ponerCamara() {
      giro.pitch = Math.max(0.02 - PITCH0, Math.min(1.3 - PITCH0, giro.pitch)); giro.zoom = Math.max(0.45, Math.min(2.2, giro.zoom));
      var y = YAW0 + giro.yaw, p = PITCH0 + giro.pitch, d = dBase * giro.zoom;
      cam.position.set(mira.x + Math.sin(y) * Math.cos(p) * d, mira.y + Math.sin(p) * d, mira.z + Math.cos(y) * Math.cos(p) * d); cam.lookAt(mira);
    }

    /* ---------- controles ---------- */
    var dedos = {}, arrastrando = false, pista = null;
    function quitarPista() { if (pista) { pista.classList.add('fuera'); var p = pista; pista = null; setTimeout(function () { p.remove(); }, 600); } }
    (function (el) {
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
        if (performance.now() - ta > 90) giro.vel = 0;
        if (!movio && ev.type === 'pointerup' && op.tocar) {
          var r = el.getBoundingClientRect(), ray = new T.Raycaster();
          ray.setFromCamera(new T.Vector2((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1), cam);
          op.tocar(E, ray);
        }
      };
      el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar);
      // Rueda: acercar y alejar; de costado (trackpad) o con Shift, girar.
      el.addEventListener('wheel', function (ev) {
        ev.preventDefault(); quitarPista();
        var lado = ev.shiftKey ? ev.deltaY : ev.deltaX;
        if (Math.abs(lado) > Math.abs(ev.shiftKey ? 0 : ev.deltaY)) giro.yaw -= Math.max(-0.4, Math.min(0.4, lado * 0.004));
        else giro.zoom *= 1 + Math.max(-0.3, Math.min(0.3, ev.deltaY * 0.0012));
      }, { passive: false });
      el.addEventListener('dblclick', function () { giro.volver = true; giro.vel = 0; });
    })(R.domElement);

    /* ---------- bucle ---------- */
    var ult = 0, reloj = 0;
    function cuadro(ms) {
      requestAnimationFrame(cuadro);
      if (!E.encendida || document.hidden) { ult = ms; return; }
      var dt = Math.min(0.05, ult ? (ms - ult) / 1000 : 0.016); ult = ms; reloj += dt;
      var c = R.domElement, w = cont.clientWidth, h = cont.clientHeight;
      if (w && h && (c.width !== Math.round(w * R.getPixelRatio()) || c.height !== Math.round(h * R.getPixelRatio()))) encuadrar(w, h);
      if (giro.volver) { giro.yaw *= 0.86; giro.pitch *= 0.86; giro.zoom += (1 - giro.zoom) * 0.14; if (Math.abs(giro.yaw) + Math.abs(giro.pitch) < 0.002) giro.volver = false; }
      else if (!arrastrando && giro.vel) { giro.yaw += giro.vel * dt; giro.vel *= Math.pow(0.04, dt); if (Math.abs(giro.vel) < 0.02) giro.vel = 0; }
      ponerCamara();
      if (op.animar) op.animar(E, dt, reloj);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.vida -= dt; p.v.y += p.g * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += dt * 5; p.m.rotation.y += dt * 4;
        if (p.vida <= 0) { esc.remove(p.m); p.m.material.dispose(); parts.splice(i, 1); }
      }
      R.render(esc, cam);
    }

    E.mostrar = function (on) {
      E.encendida = !!on;
      if (on && !cont.parentNode) {
        document.body.insertBefore(cont, document.body.firstChild);
        if (op.pista) { pista = document.createElement('div'); pista.className = 'b3d-pista'; pista.textContent = op.pista; cont.appendChild(pista); setTimeout(quitarPista, 14000); }
      }
      cont.hidden = !on; document.body.classList.toggle('b3d', !!on);
    };
    E.visible = function () { return E.encendida; };
    if (op.armar) op.armar(E);
    requestAnimationFrame(cuadro);
    return E;
  }

  root.REF4_BLOQUES = { VERSION: '1.0.0', PX: PX, tex: tex, caja: caja, bloque: bloque, seis: seis, azar: azar, escena: escena };
})(window);
