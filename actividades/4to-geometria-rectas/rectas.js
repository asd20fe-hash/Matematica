/* Rectas: paralelas, perpendiculares y oblicuas — interfaz.
   ------------------------------------------------------------
   Historial de cambios
   v1.1.0  (2026-11-23) Modo hoja ("fotocopia", fase 3 del plan)
     + Botón 📄 Hoja / ✏️ De a una (queda guardado por perfil): una hoja con 3 o 4 consignas encadenadas sobre el mismo
       tablero, escritas con el símbolo como en la fotocopia ("D ⊥ R por p", "S // D por m").
     + La referencia de un paso encadenado es la recta que trazó el chico (la suya, no la ideal); se encadena solo sobre
       paralelas y perpendiculares a R. Las rectas hechas quedan en la hoja y la referencia del paso se resalta.
     + En la hoja no hay pregunta de notación: leer el símbolo es el ejercicio; si lo confunde, se explica el símbolo.
     + Eventos con item.modo 'hoja', item.paso y item.encadenada; ?modo=hoja para probar.
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
  var VERSION = '1.1.0', ACT = '4to-geometria-rectas', TITULO = 'Rectas: paralelas, perpendiculares y oblicuas', NIVEL_MAX = 3, TAM = 5;
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
    var modo = (ctx.debug && ctx.params.get('modo')) || ctx.store.get('modo', 'una');
    S = { nivel: Math.min(NIVEL_MAX, nivel), idx: 0, ok1: 0, hechos: 0, t0: Date.now(), usados: [], modo: modo === 'hoja' ? 'hoja' : 'una', total: TAM, hoja: null, lineas: [] };
    bolsa = RC.bolsa(ctx.az, pesos());
    app.innerHTML = '<div class="ref-panel">' +
      '<div class="rc-cabeza"><span class="rc-cuenta" id="cuenta"></span><span id="prog"></span><span>Nivel ' + S.nivel + '</span>' +
      '<button type="button" class="ref-btn rc-modo" id="b-modo">' + (S.modo === 'hoja' ? '✏️ De a una' : '📄 Hoja') + '</button></div>' +
      '<div class="rc-consigna" id="consigna"></div>' +
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
    $('#b-modo').onclick = function () { ctx.store.set('modo', S.modo === 'hoja' ? 'una' : 'hoja'); if (ctx.debug) ctx.params.delete('modo'); ronda(); };
    vigia = UI.vigilar(ctx, { texto: function () { return S.fase === 'nota' ? 'elegir cómo se escribe' : 'trazar la recta ' + S.ej.nueva.nombre; },
                              elemento: function () { return S.fase === 'nota' ? $('#nota') : svg; } });
    nuevo();
  }

  function nuevo() {
    var r = svg.getBoundingClientRect(), W = Math.max(280, Math.round(r.width)), H = Math.max(240, Math.round(r.height));
    if (S.modo === 'hoja') {
      if (!S.hoja) {   // la hoja se arma una vez: el tablero queda igual en todos los pasos
        S.hoja = RC.generarHoja(ctx.az, W, H, { nivel: S.nivel, tipoExtra: bolsa.sacar() }); S.lineas = []; S.total = S.hoja.pasos.length;
        svg.setAttribute('viewBox', '0 0 ' + S.hoja.W + ' ' + S.hoja.H);
        ctx.log('hoja', S.hoja.pasos.map(RC.consignaHoja).join(' · '), S.hoja.W + '×' + S.hoja.H, 'intentos del generador', S.hoja.intentosGen, S.hoja.recortada ? '(recortada: tablero chico)' : '');
      }
      S.ej = RC.pasoHoja(S.hoja, S.idx, S.lineas);
    } else {
      var tipo = (ctx.debug && ctx.params.get('tipo')) || bolsa.sacar();
      S.ej = RC.generar(ctx.az, W, H, { nivel: S.nivel, tipo: tipo, usados: S.usados });
      S.usados = [S.ej.ref.nombre, S.ej.nueva.nombre];
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }
    S.linea = null; S.fase = 'trazar'; S.intentos = 0; S.pistas = 0; S.notaInt = 0; S.tItem = Date.now(); S.tq = performance.now(); S.guia = null;
    svg.classList.remove('ok');
    var e = S.ej, txt = { paralela: 'paralela a', perpendicular: 'perpendicular a', oblicua: 'oblicua a' }[e.tipo];
    if (S.modo === 'hoja') $('#consigna').innerHTML = '<span class="rc-hoja-tit">Trazá las rectas indicadas:</span> ' + S.hoja.pasos.map(function (P, i) {
      return '<span class="rc-chip' + (i < S.idx ? ' hecho' : i === S.idx ? ' actual' : '') + '">' + (i < S.idx ? '✔ ' : '') + esc(RC.consignaHoja(P)) + '</span>'; }).join(' ');
    else $('#consigna').innerHTML = 'Trazá la recta <b>' + esc(e.nueva.nombre) + '</b> ' + txt + ' <b>' + esc(e.ref.nombre) + '</b> que pase por el punto <b>' + esc(e.objetivo.nombre) + '</b>.';
    $('#fb').innerHTML = ''; $('#nota').hidden = true; $('#nota').innerHTML = '';
    $('#b-sig').disabled = true; $('#b-comp').disabled = false; $('#b-pista').disabled = false; $('#b-borrar').disabled = false;
    $('#b-sig').classList.remove('main'); $('#b-comp').classList.add('main');
    UI.globo(null); cabeza(); dibujarTodo();
    ctx.log('ejercicio', S.modo === 'hoja' ? 'hoja paso ' + (S.idx + 1) + ': ' + RC.consignaHoja(S.hoja.pasos[S.idx]) : e.tipo, 'ángulo', e.angRef, 'punto', e.objetivo.nombre, e.W + '×' + e.H, 'intentos del generador', e.intentosGen);
    debug();
  }
  function cabeza() {
    $('#cuenta').textContent = '✔ ' + S.ok1 + ' / ' + S.hechos;
    $('#prog').innerHTML = UI.progreso(S.total, S.idx);
  }
  function debug() {
    if (!ctx.debug) return;
    UI.debugSet({ nivel: S.nivel, modo: S.modo, paso: S.modo === 'hoja' ? (S.idx + 1) + '/' + S.total + (S.ej.encadenada ? ' encadenado' : '') : '-', tipo: S.ej.tipo, angRef: S.ej.angRef, objetivo: S.ej.objetivo, linea: S.linea, fase: S.fase });
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
  /* Etiqueta de una recta ya trazada (hoja): cerca de una punta, del lado que queda más lejos de lo que ya está escrito. */
  function lugarEtiqueta(s, ocupados) {
    var d = RC.dist(s.a, s.b) || 1, ux = (s.b.x - s.a.x) / d, uy = (s.b.y - s.a.y) / d, mejor = null, md = -1;
    [[s.b, -1], [s.a, 1]].forEach(function (f) { [1, -1].forEach(function (lado) {
      var q = { x: f[0].x + f[1] * ux * 24 - uy * 18 * lado, y: f[0].y + f[1] * uy * 24 + ux * 18 * lado };
      if (!RC.adentro(q, S.ej.W, S.ej.H, 12)) return;
      var m = ocupados.reduce(function (a, o) { return Math.min(a, RC.dist(o, q)); }, 999);
      if (m > md) { md = m; mejor = q; }
    }); });
    return mejor || { x: s.b.x - ux * 24, y: s.b.y - uy * 24 };
  }
  function dibujarTodo() {
    svg.innerHTML = '';
    var e = S.ej, hoja = S.modo === 'hoja', refAct = hoja && !e.encadenada ? ' rc-actual' : '';
    S.gGuia = el('g', {}, svg);
    S.gRecto = el('g', {}, svg);
    var R = hoja ? S.hoja.ref : e.ref;
    el('line', { x1: R.a.x, y1: R.a.y, x2: R.b.x, y2: R.b.y, 'class': 'rc-ref' + refAct }, svg);
    texto(R.nombre, R.etiqueta.x, R.etiqueta.y, 'rc-ref-txt' + refAct, svg);
    if (hoja) {   // las rectas que ya trazó, enteras, con su nombre (y el ángulo recto de las perpendiculares)
      var ocupados = [R.etiqueta].concat(e.puntos.map(function (p) { return { x: p.x + 14, y: p.y - 16 }; }));
      for (var j = 0; j < S.idx; j++) {
        var L = S.lineas[j], s = RC.recortar({ x: (L.a.x + L.b.x) / 2, y: (L.a.y + L.b.y) / 2 }, RC.angulo(L.a, L.b), e.W, e.H, 0) || L;
        var act = e.encadenada && S.hoja.pasos[S.idx].ref === j ? ' rc-actual' : '';
        el('line', { x1: s.a.x, y1: s.a.y, x2: s.b.x, y2: s.b.y, 'class': 'rc-hecha' + act }, svg);
        var q = lugarEtiqueta(s, ocupados); ocupados.push(q);
        texto(S.hoja.pasos[j].nueva.nombre, q.x, q.y, 'rc-hecha-txt' + act, svg);
        if (S.hoja.pasos[j].tipo === 'perpendicular') marcarRecto(RC.pasoHoja(S.hoja, j, S.lineas), L);
      }
    }
    S.gNueva = el('g', {}, svg);
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
  function marcarRecto(e, L) {
    var c = RC.cruce(e.ref.a, e.ref.b, L.a, L.b); if (!c) return;
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
      item: itemEv({ angRef: Math.round(e.angRef * 10) / 10, punto: e.objetivo.nombre, ref: e.ref.nombre, nueva: e.nueva.nombre }),
      esperado: e.tipo + ' por ' + e.objetivo.nombre, respuesta: resp + ' (' + Math.round(r.d * 10) / 10 + '°, a ' + Math.round(r.distancia / px(1)) + ' px)',
      ok: r.ok, error: r.error, ms: ms, ayuda: S.pistas ? 'pista' : 'ninguna', pistas: S.pistas });
    $('#fb').innerHTML = linea(r.dirOk, r.msgDir) + linea(r.puntoOk, r.msgPunto) +
      (S.modo === 'hoja' && r.error === 'CONFUNDE_TIPO' ? '<p class="info">' + esc('En ' + RC.consignaHoja(S.hoja.pasos[S.idx]) + ', ' + RC.EXPLICA[e.tipo]) + '</p>' : '');
    if (!r.ok) {
      UI.sonar('mal');
      if (S.intentos >= 2 && !S.pistas) UI.globo('Si querés, tocá 💡 Pista: te muestro la inclinación.', 'tip');
      debug(); return;
    }
    UI.sonar('ok'); UI.globo(null);
    if (S.intentos === 1) S.ok1++;
    S.hechos++; cabeza();
    svg.classList.add('ok');
    if (e.tipo === 'perpendicular') marcarRecto(e, S.linea);
    $('#b-comp').disabled = true; $('#b-pista').disabled = true; $('#b-borrar').disabled = true;
    if (S.modo === 'hoja') {   // en la hoja no se pregunta la notación: la consigna ya venía con el símbolo
      S.lineas[S.idx] = { a: { x: S.linea.a.x, y: S.linea.a.y }, b: { x: S.linea.b.x, y: S.linea.b.y } };
      S.fase = 'listo'; $('#fb').innerHTML += '<p class="info">' + esc(RC.EXPLICA[e.tipo]) + '</p>';
      var sig = $('#b-sig'); sig.disabled = false; sig.classList.add('main'); $('#b-comp').classList.remove('main'); sig.focus();
      if (S.idx === S.total - 1) UI.celebrar();
    } else { S.fase = 'nota'; preguntarNotacion(); }
    debug();
  }
  function itemEv(x) {
    var e = S.ej, it = { id: ctx.reg.ctx.ronda + '-' + S.idx, tipo: e.tipo };
    if (S.modo === 'hoja') { it.modo = 'hoja'; it.paso = S.idx + 1; it.encadenada = !!e.encadenada; }
    for (var k in x || {}) it[k] = x[k];
    return it;
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
    ctx.reg.evento({ tipo: 'paso', paso: 'notacion', tema: e.tipo, intento: S.notaInt, item: itemEv(),
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
    ctx.reg.evento({ tipo: 'paso', paso: 'pista', tema: e.tipo, intento: 0, item: itemEv(), ok: true, esperado: '', respuesta: '' });
  }

  /* ---------- siguiente y fin de ronda ---------- */
  function siguiente() {
    if (S.fase !== 'listo') return;
    S.idx++;
    if (S.idx < S.total) return nuevo();
    if (vigia) { vigia.detener(); vigia = null; }
    var pct = Math.round(100 * S.ok1 / S.total), r = ctx.reg.cerrarRonda(pct, Date.now() - S.t0, false, NIVEL_MAX);
    ctx.store.set('resumen', RC.estadisticas(ctx.reg.eventos()));    // para Estadísticas en Ajustes de padres
    if (r.cambio > 0) UI.logroNivel(r.nivel);
    cabeza();
    UI.resumen({ estrellas: r.estrellas, pct: pct, extra: S.ok1 + ' de ' + S.total + ' rectas bien a la primera' + (S.modo === 'hoja' ? ' en la hoja.' : '.') }, ronda, function () { MATE.irMenu(); });
  }

  if (ctx.debug) window.__ref4 = { act: ACT, version: VERSION, estado: function () { return { modo: S.modo, fase: S.fase, ej: S.ej, linea: S.linea, idx: S.idx, hoja: S.hoja, lineas: S.lineas }; },
    trazar: function (a, b) { S.linea = { a: a, b: b }; dibujarNueva(); }, resolver: function () { S.linea = RC.solucion(S.ej, 160); dibujarNueva(); comprobar(); },
    comprobar: comprobar, siguiente: siguiente, elegir: function (tipo) { var b = document.querySelector('#nota [data-t="' + tipo + '"]'); if (b) elegir(b); } };

  ronda();
})();
