/* Rectas: paralelas, perpendiculares y oblicuas — interfaz.
   ------------------------------------------------------------
   Historial de cambios
   v1.0.0  (2026-11-23) Primera versión (plan_geometria_rectas v1.0, fases 1 y 2)
     + Una recta dada (MAYÚSCULA) y puntos (minúscula): trazar la paralela, la perpendicular o la oblicua por un punto.
     + Dibujar arrastrando; mover desde el medio y girar desde las puntas (dedo y mouse); extensión punteada hasta los bordes.
     + Comprobar dirección y punto por separado, con mensajes para chicos; ángulo recto marcado al acertar la perpendicular.
     + Notación (N // R, N ⊥ R, N ∠ R) al acertar la recta; pista con guía de la inclinación y el punto que titila.
     + Rondas de 5 rectas con estrellas y 3 niveles; cada intento se registra (planilla y panel de padres);
       la bolsa de tipos repite el que más le cuesta (últimos 14 días).
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var VERSION = '1.0.0', ACT = '4to-geometria-rectas', TITULO = 'Rectas: paralelas, perpendiculares y oblicuas', NIVEL_MAX = 3, TAM = 5;
  var RC = REF4_RECTAS, UI = REF4_UI, $ = UI.$, esc = UI.esc, NS = 'http://www.w3.org/2000/svg', DIA = 86400000;

  var ctx = UI.base({ act: ACT, titulo: TITULO, version: VERSION, nivelMax: NIVEL_MAX });
  if (!ctx) return;
  var app = $('#app'), S = {}, vigia = null, bolsa = null, svg = null;

  /* ---------- la bolsa de tipos: doble el que salió peor en los últimos 14 días ---------- */
  function pesos() {
    var ahora = Date.now(), recientes = ctx.reg.eventos().filter(function (e) { return ahora - e.ts < 14 * DIA; });
    var w = {}; RC.estadisticas(recientes).tipos.forEach(function (t) { if (t.n >= 3 && t.pct1 < 80) w[t.tipo] = 2; });
    return w;
  }

  /* ---------- ronda ---------- */
  function ronda() {
    if (vigia) vigia.detener();
    UI.fuegos.parar();
    ctx.reg.iniciarRonda();
    var nivel = +(ctx.debug && ctx.params.get('nivel')) || ctx.reg.estado().nivel || 1;
    S = { nivel: Math.min(NIVEL_MAX, nivel), idx: 0, ok1: 0, hechos: 0, t0: Date.now(), usados: [] };
    bolsa = RC.bolsa(ctx.az, pesos());
    app.innerHTML = '<div class="ref-panel">' +
      '<div class="rc-cabeza"><span class="rc-cuenta" id="cuenta"></span><span id="prog"></span><span>Nivel ' + S.nivel + '</span></div>' +
      '<p class="rc-consigna" id="consigna"></p>' +
      '<p class="rc-ayuda">Arrastrá para dibujar. Movela desde el medio, girala desde las puntas.</p>' +
      '<svg class="rc-tablero" id="tablero" role="img" aria-label="Tablero para trazar la recta"></svg>' +
      '<div class="rc-fb" id="fb" aria-live="polite"></div>' +
      '<div class="rc-notacion" id="nota" hidden></div>' +
      '<div class="rc-botones"><button type="button" class="ref-btn" id="b-borrar">🧽 Borrar</button><button type="button" class="ref-btn" id="b-pista">💡 Pista</button>' +
      '<button type="button" class="ref-btn main" id="b-comp">✔ Comprobar</button><button type="button" class="ref-btn" id="b-sig" disabled>Siguiente ➜</button></div></div>';
    svg = $('#tablero');
    svg.addEventListener('pointerdown', abajo); svg.addEventListener('pointermove', mover);
    svg.addEventListener('pointerup', arriba); svg.addEventListener('pointercancel', arriba);
    $('#b-borrar').onclick = function () { if (S.fase !== 'trazar') return; S.linea = null; $('#fb').innerHTML = ''; dibujarNueva(); };
    $('#b-pista').onclick = pista; $('#b-comp').onclick = comprobar; $('#b-sig').onclick = siguiente;
    vigia = UI.vigilar(ctx, { texto: function () { return S.fase === 'nota' ? 'elegir cómo se escribe' : 'trazar la recta ' + S.ej.nueva.nombre; },
                              elemento: function () { return S.fase === 'nota' ? $('#nota') : svg; } });
    nuevo();
  }

  function nuevo() {
    var r = svg.getBoundingClientRect(), W = Math.max(280, Math.round(r.width)), H = Math.max(240, Math.round(r.height));
    var tipo = (ctx.debug && ctx.params.get('tipo')) || bolsa.sacar();
    S.ej = RC.generar(ctx.az, W, H, { nivel: S.nivel, tipo: tipo, usados: S.usados });
    S.usados = [S.ej.ref.nombre, S.ej.nueva.nombre];
    S.linea = null; S.fase = 'trazar'; S.intentos = 0; S.pistas = 0; S.notaInt = 0; S.tItem = Date.now(); S.tq = performance.now(); S.guia = null;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.classList.remove('ok');
    var e = S.ej, txt = { paralela: 'paralela a', perpendicular: 'perpendicular a', oblicua: 'oblicua a' }[e.tipo];
    $('#consigna').innerHTML = 'Trazá la recta <b>' + esc(e.nueva.nombre) + '</b> ' + txt + ' <b>' + esc(e.ref.nombre) + '</b> que pase por el punto <b>' + esc(e.objetivo.nombre) + '</b>.';
    $('#fb').innerHTML = ''; $('#nota').hidden = true; $('#nota').innerHTML = '';
    $('#b-sig').disabled = true; $('#b-comp').disabled = false; $('#b-pista').disabled = false; $('#b-borrar').disabled = false;
    $('#b-sig').classList.remove('main'); $('#b-comp').classList.add('main');
    UI.globo(null); cabeza(); dibujarTodo();
    ctx.log('ejercicio', e.tipo, 'ángulo', e.angRef, 'punto', e.objetivo.nombre, e.W + '×' + e.H, 'intentos del generador', e.intentosGen);
    debug();
  }
  function cabeza() {
    $('#cuenta').textContent = '✔ ' + S.ok1 + ' / ' + S.hechos;
    $('#prog').innerHTML = UI.progreso(TAM, S.idx);
  }
  function debug() {
    if (!ctx.debug) return;
    UI.debugSet({ nivel: S.nivel, tipo: S.ej.tipo, angRef: S.ej.angRef, objetivo: S.ej.objetivo, linea: S.linea, fase: S.fase });
  }

  /* ---------- SVG ---------- */
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); if (padre) padre.appendChild(n); return n; }
  function texto(t, x, y, cls, padre) { var n = el('text', { x: x, y: y, 'class': cls, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, padre); n.textContent = t; return n; }
  function escala() { var m = svg.getScreenCTM(); return m && m.a ? m.a : 1; }
  function px(n) { return n / escala(); }               // px de pantalla → unidades del tablero
  function aSvg(ev) {
    var m = svg.getScreenCTM(), p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; p = p.matrixTransform(m.inverse());
    return { x: Math.max(0, Math.min(S.ej.W, p.x)), y: Math.max(0, Math.min(S.ej.H, p.y)) };
  }
  function dibujarTodo() {
    svg.innerHTML = '';
    var e = S.ej;
    S.gGuia = el('g', {}, svg);
    el('line', { x1: e.ref.a.x, y1: e.ref.a.y, x2: e.ref.b.x, y2: e.ref.b.y, 'class': 'rc-ref' }, svg);
    texto(e.ref.nombre, e.ref.etiqueta.x, e.ref.etiqueta.y, 'rc-ref-txt', svg);
    S.gNueva = el('g', {}, svg);
    S.gRecto = el('g', {}, svg);
    S.marcas = {};
    e.puntos.forEach(function (p) {
      S.marcas[p.nombre] = el('circle', { cx: p.x, cy: p.y, r: 6, 'class': 'rc-punto' }, svg);
      texto(p.nombre, p.x + 14, p.y - 16, 'rc-punto-txt', svg);
    });
    dibujarNueva(); dibujarGuia();
  }
  function dibujarNueva() {
    var g = S.gNueva, L = S.linea; g.innerHTML = '';
    if (!L) return;
    var ang = RC.angulo(L.a, L.b), medio = { x: (L.a.x + L.b.x) / 2, y: (L.a.y + L.b.y) / 2 };
    var ext = RC.recortar(medio, ang, S.ej.W, S.ej.H, 0);
    if (ext) el('line', { x1: ext.a.x, y1: ext.a.y, x2: ext.b.x, y2: ext.b.y, 'class': 'rc-ext' }, g);
    el('line', { x1: L.a.x, y1: L.a.y, x2: L.b.x, y2: L.b.y, 'class': 'rc-seg' }, g);
    var r = px(11);
    el('circle', { cx: L.a.x, cy: L.a.y, r: r, 'class': 'rc-manija' }, g); el('circle', { cx: L.b.x, cy: L.b.y, r: r, 'class': 'rc-manija' }, g);
    // etiqueta cerca de la punta de la derecha, corrida hacia afuera
    var d = RC.dist(L.a, L.b) || 1, ux = (L.b.x - L.a.x) / d, uy = (L.b.y - L.a.y) / d, fin = L.a.x > L.b.x ? L.a : L.b, s = fin === L.b ? 1 : -1;
    var lx = fin.x + s * ux * 22 - uy * 20, ly = fin.y + s * uy * 22 + ux * 20;
    if (!RC.adentro({ x: lx, y: ly }, S.ej.W, S.ej.H, 12)) { lx = fin.x - s * ux * 26 + uy * 20; ly = fin.y - s * uy * 26 - ux * 20; }
    texto(S.ej.nueva.nombre, lx, ly, 'rc-nueva-txt', g);
  }
  function dibujarGuia() {
    var g = S.gGuia; g.innerHTML = ''; if (!S.guia) return;
    var G = S.guia;
    el('line', { x1: G.a.x, y1: G.a.y, x2: G.b.x, y2: G.b.y, 'class': 'rc-guia' }, g);
    var mx = (G.a.x + G.b.x) / 2, my = (G.a.y + G.b.y) / 2;
    texto('guía', mx, my + (my < S.ej.H / 2 ? 50 : -50), 'rc-guia-txt', g);
  }
  function marcarRecto() {
    var L = S.linea, e = S.ej, c = RC.cruce(e.ref.a, e.ref.b, L.a, L.b); if (!c) return;
    var d = RC.dist(e.ref.a, e.ref.b), ux = (e.ref.b.x - e.ref.a.x) / d, uy = (e.ref.b.y - e.ref.a.y) / d, nx = -uy, ny = ux;
    if ((e.objetivo.x - c.x) * nx + (e.objetivo.y - c.y) * ny < 0) { nx = -nx; ny = -ny; }
    var s = 16, p = function (a, b) { return (c.x + ux * a + nx * b).toFixed(1) + ',' + (c.y + uy * a + ny * b).toFixed(1); };
    el('polyline', { points: [p(s, 0), p(s, s), p(0, s)].join(' '), 'class': 'rc-recto' }, S.gRecto);
  }

  /* ---------- dedo y mouse ---------- */
  function distSeg(p, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1);
    t = Math.max(0, Math.min(1, t)); return RC.dist(p, { x: a.x + t * dx, y: a.y + t * dy });
  }
  function abajo(ev) {
    if (S.fase !== 'trazar' || S.arrastre) return;
    ev.preventDefault();
    var p = aSvg(ev), L = S.linea, modo = 'dibujar';
    if (L && RC.dist(p, L.a) < px(26)) modo = 'girarA';
    else if (L && RC.dist(p, L.b) < px(26)) modo = 'girarB';
    else if (L && distSeg(p, L.a, L.b) < px(22)) modo = 'mover';
    S.arrastre = { id: ev.pointerId, modo: modo, p0: p, antes: L ? { a: { x: L.a.x, y: L.a.y }, b: { x: L.b.x, y: L.b.y } } : null };
    if (modo === 'dibujar') S.linea = { a: p, b: { x: p.x, y: p.y } };
    try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura */ }
    dibujarNueva();
  }
  function mover(ev) {
    var A = S.arrastre; if (!A || ev.pointerId !== A.id) return;
    ev.preventDefault();
    var p = aSvg(ev), L = S.linea;
    if (A.modo === 'dibujar' || A.modo === 'girarB') L.b = p;
    else if (A.modo === 'girarA') L.a = p;
    else {   // mover sin que se salga del tablero
      var dx = p.x - A.p0.x, dy = p.y - A.p0.y, a = A.antes.a, b = A.antes.b, W = S.ej.W, H = S.ej.H;
      dx = Math.max(-Math.min(a.x, b.x), Math.min(W - Math.max(a.x, b.x), dx));
      dy = Math.max(-Math.min(a.y, b.y), Math.min(H - Math.max(a.y, b.y), dy));
      L.a = { x: a.x + dx, y: a.y + dy }; L.b = { x: b.x + dx, y: b.y + dy };
    }
    dibujarNueva();
  }
  function arriba(ev) {
    var A = S.arrastre; if (!A || ev.pointerId !== A.id) return;
    S.arrastre = null;
    try { svg.releasePointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    if (RC.dist(S.linea.a, S.linea.b) < px(30)) S.linea = A.antes;    // fue un toque, no un trazo: queda la de antes
    else $('#fb').innerHTML = '';                                        // la recta cambió: las comprobaciones viejas ya no valen
    dibujarNueva(); debug();
  }

  /* ---------- comprobar ---------- */
  function linea(ok, t) { return '<p class="' + (ok ? 'ok' : 'mal') + '">' + esc(t) + '</p>'; }
  function comprobar() {
    if (S.fase !== 'trazar') return;
    if (!S.linea) { UI.globo('Primero dibujá la recta ' + S.ej.nueva.nombre + ': arrastrá el dedo sobre la hoja.', 'tip'); return; }
    var e = S.ej, r = RC.comprobar(e, S.linea, px(12)), ms = Math.round(performance.now() - S.tq);
    S.intentos++; S.tq = performance.now();
    var resp = r.trazada + (r.puntoOk ? ' por ' + e.objetivo.nombre : r.puntoTocado ? ' por ' + r.puntoTocado : ' sin pasar por el punto');
    ctx.reg.evento({ tipo: 'paso', paso: 'trazar', tema: e.tipo, intento: S.intentos,
      item: { id: ctx.reg.ctx.ronda + '-' + S.idx, tipo: e.tipo, angRef: e.angRef, punto: e.objetivo.nombre, ref: e.ref.nombre, nueva: e.nueva.nombre },
      esperado: e.tipo + ' por ' + e.objetivo.nombre, respuesta: resp + ' (' + Math.round(r.d * 10) / 10 + '°, a ' + Math.round(r.distancia / px(1)) + ' px)',
      ok: r.ok, error: r.error, ms: ms, ayuda: S.pistas ? 'pista' : 'ninguna', pistas: S.pistas });
    $('#fb').innerHTML = linea(r.dirOk, r.msgDir) + linea(r.puntoOk, r.msgPunto);
    if (!r.ok) {
      UI.sonar('mal');
      if (S.intentos >= 2 && !S.pistas) UI.globo('Si querés, tocá 💡 Pista: te muestro la inclinación.', 'tip');
      debug(); return;
    }
    UI.sonar('ok'); UI.globo(null);
    if (S.intentos === 1) S.ok1++;
    S.hechos++; cabeza();
    S.fase = 'nota'; svg.classList.add('ok');
    if (e.tipo === 'perpendicular') marcarRecto();
    $('#b-comp').disabled = true; $('#b-pista').disabled = true; $('#b-borrar').disabled = true;
    preguntarNotacion(); debug();
  }

  /* ---------- notación ---------- */
  function preguntarNotacion() {
    var e = S.ej, ops = ctx.az.mezclar(RC.notaciones(e)), n = $('#nota');
    n.hidden = false; S.tq = performance.now();
    n.innerHTML = '<p>¿Cómo se escribe?</p><div class="ref-fila">' + ops.map(function (o) {
      return '<button type="button" class="ref-opcion" data-t="' + o.tipo + '">' + esc(o.texto) + '</button>'; }).join('') + '</div><p id="nota-fb" class="rc-ayuda"></p>';
    n.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { elegir(b); }; });
    var pri = n.querySelector('[data-t]'); if (pri) pri.focus();
  }
  function elegir(b) {
    if (S.fase !== 'nota') return;
    var e = S.ej, t = b.dataset.t, ok = t === e.tipo, ms = Math.round(performance.now() - S.tq);
    S.notaInt++; S.tq = performance.now();
    ctx.reg.evento({ tipo: 'paso', paso: 'notacion', tema: e.tipo, intento: S.notaInt, item: { id: ctx.reg.ctx.ronda + '-' + S.idx, tipo: e.tipo },
      esperado: e.nueva.nombre + ' ' + RC.SIMBOLO[e.tipo] + ' ' + e.ref.nombre, respuesta: b.textContent, ok: ok, error: ok ? null : 'NOTACION', ms: ms, ayuda: 'ninguna' });
    if (!ok) {
      UI.sonar('mal'); b.classList.add('mal'); b.disabled = true;
      $('#nota-fb').textContent = RC.EXPLICA[t] + ' Probá otra vez.';
      return;
    }
    UI.sonar('ok'); b.classList.add('ok'); UI.celebrar();
    S.fase = 'listo';
    $('#nota').querySelectorAll('[data-t]').forEach(function (x) { x.disabled = true; });
    $('#nota-fb').textContent = RC.EXPLICA[t];
    var sig = $('#b-sig'); sig.disabled = false; sig.classList.add('main'); $('#b-comp').classList.remove('main'); sig.focus();
    debug();
  }

  /* ---------- pista ---------- */
  function pista() {
    if (S.fase !== 'trazar') return;
    S.pistas++;
    var e = S.ej, m = S.marcas[e.objetivo.nombre];
    m.classList.remove('titila'); void m.getBoundingClientRect(); m.classList.add('titila');
    setTimeout(function () { m.classList.remove('titila'); }, 2200);
    S.guia = RC.guia(e, px(90)); dibujarGuia();
    UI.globo('Copiá la inclinación de la guía naranja y llevala hasta el punto ' + e.objetivo.nombre + '.' +
             (e.tipo === 'oblicua' ? ' Cualquier inclinación sirve, mientras no sea paralela ni perpendicular.' : ''), 'tip');
    ctx.reg.evento({ tipo: 'paso', paso: 'pista', tema: e.tipo, intento: 0, item: { id: ctx.reg.ctx.ronda + '-' + S.idx, tipo: e.tipo }, ok: true, esperado: '', respuesta: '' });
  }

  /* ---------- siguiente y fin de ronda ---------- */
  function siguiente() {
    if (S.fase !== 'listo') return;
    S.idx++;
    if (S.idx < TAM) return nuevo();
    if (vigia) { vigia.detener(); vigia = null; }
    var pct = Math.round(100 * S.ok1 / TAM), r = ctx.reg.cerrarRonda(pct, Date.now() - S.t0, false, NIVEL_MAX);
    ctx.store.set('resumen', RC.estadisticas(ctx.reg.eventos()));    // para Estadísticas en Ajustes de padres
    if (r.cambio > 0) UI.logroNivel(r.nivel);
    cabeza();
    UI.resumen({ estrellas: r.estrellas, pct: pct, extra: S.ok1 + ' de ' + TAM + ' rectas bien a la primera.' }, ronda, function () { MATE.irMenu(); });
  }

  if (ctx.debug) window.__ref4 = { act: ACT, version: VERSION, estado: function () { return { fase: S.fase, ej: S.ej, linea: S.linea, idx: S.idx }; },
    trazar: function (a, b) { S.linea = { a: a, b: b }; dibujarNueva(); }, resolver: function () { S.linea = RC.solucion(S.ej, 160); dibujarNueva(); comprobar(); },
    comprobar: comprobar, siguiente: siguiente, elegir: function (tipo) { var b = document.querySelector('#nota [data-t="' + tipo + '"]'); if (b) elegir(b); } };

  ronda();
})();
