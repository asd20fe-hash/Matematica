/* Multiplicación paso a paso — interfaz.
   ------------------------------------------------------------
   Historial de cambios
   v1.1.0  (2026-10-18) Cuatro cifras por dos
     + Nivel 4: multiplicandos de 3 y 4 cifras por 2 cifras (antes solo 3 cifras).
   v1.0.0  (2026-10-18) Primera versión
     + La cuenta parada de la carpeta en el cuaderno cuadriculado: reservas chiquitas arriba, filas, el 0 de la
       segunda fila y la suma final.
     + 4 niveles: por una cifra con todos los pasos (multiplico, sumo lo que me llevo, anoto, me llevo) →
       por dos cifras como en la carpeta, con "Revisar mi cuenta". Rondas de 3, 2, 2 y 1 cuentas.
     + Clasifica los errores (tabla, reservas, anotar el número entero, el 0 de la segunda fila, la suma).
     + Las cifras de los hechos que fallan o tardan salen el doble; registro de eventos, ?debug=1 y ?seed=N.
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var VERSION = '1.1.0', ACT = '4to-multiplicacion-paso-a-paso', TITULO = 'Multiplicación paso a paso';
  var MO = REF4_MULMOTOR, UI = REF4_UI, $ = UI.$, esc = UI.esc;

  var ctx = UI.base({ act: ACT, titulo: TITULO, version: VERSION, nivelMax: MO.MAX_NIVEL });
  if (!ctx) return;
  var app = $('#app'), vigia = null, R = null;
  var NOMBRE_PASO = { estimacion: 'estimar las cifras', mult: 'multiplicar', sumo: 'sumar lo que te llevaste', columna: 'multiplicar', anoto: 'anotar',
                      llevo: 'anotar lo que te llevás', cero: 'anotar el 0', suma: 'sumar las filas', revision: 'revisar' };
  var NUMERICOS = ['mult', 'sumo', 'columna', 'anoto', 'llevo', 'cero', 'suma'];

  /* ---------- ronda ---------- */
  function nivelActual() {
    var n = ctx.reg.estado().nivel;
    if (ctx.debug && ctx.params.get('nivel')) n = Math.max(1, Math.min(MO.MAX_NIVEL, parseInt(ctx.params.get('nivel'), 10) || n));
    return n;
  }
  function nuevaRonda() {
    ctx.reg.iniciarRonda();
    var nivel = nivelActual(); ctx.reg.ctx.nivel = nivel;
    R = { nivel: nivel, total: MO.RONDA[nivel], idx: 0, cont: UI.contador(), M: null, buf: UI.entrada(3), ayuda: 'ninguna', tPaso: Date.now(),
          marca: null, corregir: null, barra: nivel <= 2, hecha: false, pesos: REF4_EV.pesosHechos(ctx.reg.eventos(), Date.now()) };
    nuevaCuenta();
  }
  function nuevaCuenta() {
    var g = MO.generar(R.nivel, ctx.az, R.pesos);
    R.M = MO.crear({ a: g.a, b: g.b, nivel: R.nivel });
    UI.fuegos.parar(); R.hecha = false; R.marca = null; R.corregir = null; R.buf.limpiar(); R.ayuda = 'ninguna'; R.tPaso = Date.now();
    ctx.log('cuenta', g.a + ' × ' + g.b);
    UI.globo(null); render();
  }

  /* ---------- dibujo de la cuenta ---------- */
  function dibujar(cont, V, ancho) {
    var nf = V.filas.length, W = V.anchoCols + 1;
    var c = Math.max(28, Math.min(52, Math.floor(Math.min(ancho, 520) / (W + 0.6))));
    var X = function (j) { return (W - 1 - j) * c + c * 0.3; };
    var yA = c * 0.6, yB = yA + c, gap = nf > 1 ? c * 0.5 : c * 0.15, yF = function (r) { return yB + c + gap + r * c; };
    var ySum = yF(nf) + c * 0.15, alto = (V.suma ? ySum + c : yF(nf)) + c * 0.25, anchoT = W * c + c * 0.6;
    var html = '', svg = '', act = V.activo || {}, foco = V.foco || {};
    function cel(txt, x, y, cls, h, fs) {
      return '<div class="cel ' + (cls || '') + '" style="left:' + x + 'px;top:' + y + 'px;width:' + c + 'px;height:' + (h || c) + 'px;font-size:' + Math.round(fs || c * 0.62) + 'px">' + esc(txt) + '</div>';
    }
    function raya(x1, y, x2) { svg += '<line class="raya" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/>'; }
    function slot(zona, y, h, fs) {
      if (act.zona !== zona) return;
      var len = Math.max(act.len || 1, act.buf.length);
      for (var i = 0; i < len; i++) { var ch = act.buf.length - len + i >= 0 ? act.buf[act.buf.length - len + i] : ''; html += cel(ch, X(act.col + len - 1 - i), y, 'slot', h, fs); }
    }
    // reservas de la fila que se está multiplicando (chiquitas, arriba)
    Object.keys(V.reservas).forEach(function (j) { var r = V.reservas[j]; html += cel(r.d, X(+j), 0, 'res' + (r.err ? ' error' : ''), c * 0.6, c * 0.42); });
    slot('reserva', 0, c * 0.6, c * 0.42);
    // factores
    for (var i = 0; i < V.a.length; i++) { var ja = V.a.length - 1 - i; html += cel(V.a[i], X(ja), yA, foco.colA === ja ? 'pulsa' : ''); }
    for (i = 0; i < V.b.length; i++) { var jb = V.b.length - 1 - i; html += cel(V.b[i], X(jb), yB, foco.colB === jb ? 'pulsa' : ''); }
    html += cel('×', X(V.b.length), yB, 'signo');
    raya(X(W - 1) + c * 0.2, yB + c, X(0) + c * 0.9);
    // reservas de la suma (se escriben solas)
    Object.keys(V.resSuma).forEach(function (j) { html += cel(V.resSuma[j], X(+j), yB + c, 'res', gap, c * 0.38); });
    // filas
    V.filas.forEach(function (F, r) {
      Object.keys(F).forEach(function (j) { html += cel(F[j].d, X(+j), yF(r), (F[j].err ? 'error' : '') + (V.terminada && !V.suma ? ' ok' : '')); });
      if (act.zona === 'fila' && act.fila === r) slot('fila', yF(r));
    });
    if (V.suma) {
      html += cel('+', X(Math.max.apply(null, V.lenFilas)), yF(nf - 1), 'signo');
      raya(X(W - 1) + c * 0.2, yF(nf) + c * 0.07, X(0) + c * 0.9);
      Object.keys(V.suma).forEach(function (j) { var s = V.suma[j]; html += cel(s.d, X(+j), ySum, (s.err ? 'error' : '') + (V.terminada ? ' ok' : '')); });
      slot('suma', ySum);
    }
    cont.innerHTML = '<div class="cuenta-caja" style="width:' + anchoT + 'px;height:' + alto + 'px;background-size:' + c + 'px ' + c + 'px;background-position:' + (c * 0.3) + 'px ' + (c * 0.6) + 'px">' +
      html + '<svg width="' + anchoT + '" height="' + alto + '" viewBox="0 0 ' + anchoT + ' ' + alto + '" aria-hidden="true">' + svg + '</svg></div>';
  }

  /* ---------- pantalla ---------- */
  function render() {
    app.innerHTML =
      UI.progreso(R.total, R.idx) +
      '<div class="ref-panel">' +
        '<div class="mul-cabecera"><span>Nivel ' + R.nivel + ' · Cuenta ' + (R.idx + 1) + ' de ' + R.total + '</span><span id="donde"></span></div>' +
        '<div class="pasos-barra" id="barra"' + (R.barra ? '' : ' hidden') + '></div>' +
        '<div class="mul-zona"><div id="cuenta"></div><div class="mul-borrador" id="borrador" hidden></div></div>' +
        '<div class="ref-pregunta" id="pregunta" aria-live="polite"></div>' +
        '<div class="mul-control" id="control"></div>' +
        '<div class="ref-teclado" id="teclado" hidden></div>' +
        '<div class="mul-acciones"><button class="ref-btn" id="b-pista">💡 Pista</button><button class="ref-btn" id="b-perdi">Me perdí</button></div>' +
      '</div>';
    $('#b-pista').onclick = function () { pedirAyuda(false); };
    $('#b-perdi').onclick = function () { pedirAyuda(true); };
    UI.teclado($('#teclado'), { digito: tecla, borrar: function () { R.buf.pop(); pintar(); }, ok: confirmar });
    if (!vigia) vigia = UI.vigilar(ctx, { texto: function () { var a = MO.actual(R.M); return a ? NOMBRE_PASO[a.tipo] || 'seguir' : 'seguir'; },
                                         elemento: function () { return document.querySelector('.cel.slot, .ref-teclado button.ok, #control button'); } });
    pintar();
  }

  // Redibuja la cuenta y los controles del paso actual (sin reconstruir la página).
  function pintar() {
    var M = R.M, a = MO.actual(M), V = MO.vista(M, R.buf.valor(), R.marca);
    dibujar($('#cuenta'), V, Math.min(app.clientWidth, 900) - 40);
    var nf = M.C.filas.length;
    $('#donde').textContent = a && a.fila !== undefined && nf > 1 ? (a.fila === 0 ? 'Primera fila: × ' + M.C.filas[0].f : 'Segunda fila: × ' + M.C.filas[1].f + '0') : (a && a.tipo === 'suma' ? 'Suma de las filas' : '');
    var barra = $('#barra'), idx = a && MO.BARRA[a.tipo] !== undefined ? MO.BARRA[a.tipo] : -1;
    barra.hidden = !R.barra || R.nivel === 4;
    barra.innerHTML = MO.BARRA_NOMBRES.map(function (n, i) { return '<span class="' + (i === idx ? 'on' : '') + '">' + n + '</span>'; }).join('');
    // borrador de la columna (niveles 1 y 2)
    var bo = $('#borrador'), lineas = MO.borrador(M);
    bo.hidden = R.nivel > 2 || R.hecha || !a || !a.c;
    if (!bo.hidden) bo.innerHTML = '<small>De cabeza</small>' + lineas.map(function (l) { return '<div>' + esc(l) + '</div>'; }).join('') +
      (MO.cuentita(M) ? '<div>' + esc(MO.cuentita(M)) + ' = <span class="ref-entrada">' + esc(R.buf.valor() || ' ') + '</span></div>' : '');
    $('#pregunta').textContent = R.hecha ? '' : MO.pregunta(M);
    var c = $('#control'); c.innerHTML = ''; c.onclick = null;
    $('#teclado').hidden = R.hecha || !a || NUMERICOS.indexOf(a.tipo) < 0;
    $('#b-pista').disabled = $('#b-perdi').disabled = R.hecha;
    if (R.hecha) {
      c.innerHTML = '<div class="mul-fin">¡Cuenta terminada! ' + M.a + ' × ' + M.b + ' = ' + UI.miles(M.C.total) + '</div>' +
        '<button class="ref-btn main" id="b-sig">' + (R.idx + 1 < R.total ? 'Siguiente cuenta' : 'Terminar ronda') + '</button>';
      $('#b-sig').onclick = siguiente;
      return;
    }
    if (!a) return;
    if (a.tipo === 'estimacion') {
      c.innerHTML = '<div class="ref-fila">' + [3, 4, 5, 6].map(function (n) { return '<button class="ref-opcion" data-v="' + n + '">' + n + ' cifras</button>'; }).join('') + '</div>';
      c.onclick = function (e) { var b = e.target.closest('[data-v]'); if (b) enviar(+b.dataset.v); };
    } else if (a.tipo === 'revision') {
      c.innerHTML = R.corregir ? '<button class="ref-btn main chico" id="b-corr">Corregir desde acá</button>' : '<button class="ref-btn main chico" id="b-rev">Revisar mi cuenta</button>';
      if (R.corregir) $('#b-corr').onclick = corregir; else $('#b-rev').onclick = revisar;
    } else if ((a.tipo === 'mult' || a.tipo === 'sumo' || a.tipo === 'columna') && R.nivel > 2) {
      c.innerHTML = '<span class="ref-entrada" aria-live="polite">' + esc(R.buf.valor() || ' ') + '</span>';
    }
    if (ctx.debug) UI.debugSet(MO.descripcion(M));
  }

  /* ---------- entrada ---------- */
  function tecla(d) {
    var a = MO.actual(R.M); if (!a || R.hecha || NUMERICOS.indexOf(a.tipo) < 0) return;
    R.buf.push(d); pintar();
    if (a.tipo === 'llevo' || a.tipo === 'cero') confirmar();     // un solo dígito: se envía enseguida
  }
  function confirmar() {
    var a = MO.actual(R.M); if (!a || R.hecha) return;
    var n = R.buf.num(); if (n === null) return;
    enviar(n);
  }
  function pedirAyuda(meperdi) {
    var a = MO.actual(R.M); if (!a) return;
    if (meperdi) { R.ayuda = 'me_perdi'; R.barra = true; }
    else if (R.ayuda !== 'me_perdi') R.ayuda = 'pista';
    UI.globo(MO.ayuda(R.M, meperdi), 'tip'); pintar();
  }
  function enviar(valor) {
    var a0 = MO.actual(R.M); if (!a0 || R.hecha) return;
    var ms = Date.now() - R.tPaso, res = MO.responder(R.M, valor);
    res.eventos.forEach(function (e) { e.ms = ms; e.ayuda = R.ayuda; ctx.reg.evento(e); R.cont.paso(e.intento, e.ok, e.error, MO.CONTROLES); });
    R.buf.limpiar(); R.marca = null;
    if (res.silencioso) { R.tPaso = Date.now(); R.ayuda = 'ninguna'; UI.globo(null); }
    else if (res.ok) { UI.sonar('ok'); UI.globo(null); R.tPaso = Date.now(); R.ayuda = 'ninguna'; }
    else { UI.sonar('mal'); if (R.nivel === 3) R.barra = true; UI.globo(res.pista, 'mal'); }
    if (res.terminada) return terminarCuenta();
    pintar();
  }

  /* ---------- nivel 4: revisar y corregir ---------- */
  function revisar() {
    var r = MO.revisar(R.M);
    if (r.ok) return terminarCuenta();
    R.corregir = r.error; R.marca = r.error;
    UI.sonar('mal'); UI.globo(r.error.pista || 'Revisá este paso.', 'mal'); pintar();
    $('#cuenta').scrollIntoView({ block: 'nearest' });
  }
  function corregir() { MO.corregir(R.M, R.corregir.indice); R.corregir = null; R.marca = null; R.tPaso = Date.now(); UI.globo(null); pintar(); }

  /* ---------- fin de cuenta y de ronda ---------- */
  function terminarCuenta() {
    R.hecha = true; R.marca = null;
    UI.sonar('ok'); UI.celebrar(R.cont.pct() === 100 ? '¡Impecable, sin errores!' : null); UI.fuegos.iniciar();
    pintar();
  }
  function siguiente() {
    if (R.idx + 1 < R.total) { R.idx++; nuevaCuenta(); return; }
    var pct = R.cont.pct();
    var r = ctx.reg.cerrarRonda(pct, Date.now() - R.cont.t0, R.cont.errorControl, ctx.nivelMax);
    UI.resumen({ estrellas: r.estrellas, pct: pct, extra: r.cambio === 1 ? '¡Subiste al nivel ' + r.nivel + '!' : (r.cambio === -1 ? 'Vamos a practicar un poco más el nivel ' + r.nivel + '.' : '') },
      function () { nuevaRonda(); }, function () { MATE.irMenu(); });
    if (r.cambio === 1) UI.sonar('sube');
  }

  /* ---------- gancho para pruebas con ?debug=1 ---------- */
  if (ctx.debug) window.__ref4 = { act: ACT, version: VERSION, estado: function () { return { nivel: R.nivel, paso: MO.descripcion(R.M), cuenta: [R.M.a, R.M.b] }; },
    responder: enviar, motor: function () { return R.M; } };

  nuevaRonda();
  window.addEventListener('resize', function () { if (R) pintar(); });
})();
