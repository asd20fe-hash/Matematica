/* Tablas de multiplicar — interfaz.
   ------------------------------------------------------------
   Historial de cambios
   v1.0.0  (2026-10-18) Primera versión
     + Memorizar: toda la tabla centrada con un tiempo para mirarla (15, 30 o 60 s, o "¡Ya me la sé!").
       Después se borronean todas menos una ("7 × 8 = ☐", en su mismo lugar) y se pregunta cada una en orden al azar.
     + Tiempo de respuesta de cada multiplicación, resumen con colores (rápida, media, lenta) y "Repasar las difíciles".
     + Tabla pitagórica interactiva: camino de la fila y la columna, la gemela (7 × 8 y 8 × 7), tablas enteras,
       cuadrados y "Ocultar resultados".
     + Cada respuesta se registra (hecho "7x8", ms, intento) para el panel de padres y la planilla.
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var VERSION = '1.0.0', ACT = '4to-tablas', TITULO = 'Tablas de multiplicar';
  var TB = REF4_TABLAS, UI = REF4_UI, $ = UI.$, esc = UI.esc;

  var ctx = UI.base({ act: ACT, titulo: TITULO, version: VERSION, nivelMax: 1 });
  if (!ctx) return;
  var app = $('#app'), S = { vista: 'elegir', t: null, segs: ctx.store.get('segs', 30) }, reloj = null, vigia = null;

  function parar() { if (reloj) { clearInterval(reloj); reloj = null; } if (vigia) { vigia.detener(); vigia = null; } UI.fuegos.parar(); UI.globo(null); }
  function pestanas() {
    var memo = S.vista !== 'pita';
    return '<div class="tb-tabs" role="tablist">' +
      '<button type="button" role="tab" class="tb-tab' + (memo ? ' on' : '') + '" aria-selected="' + memo + '" data-tab="elegir">🧠 Memorizar</button>' +
      '<button type="button" role="tab" class="tb-tab' + (!memo ? ' on' : '') + '" aria-selected="' + !memo + '" data-tab="pita">🔢 Tabla pitagórica</button></div>';
  }
  function ir(vista) { parar(); S.vista = vista; render(); }
  function render() {
    if (S.vista === 'elegir') verElegir();
    else if (S.vista === 'pita') verPita();
    app.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { if (S.vista === 'preg' && !confirm('¿Dejás esta vuelta sin terminar?')) return; ir(b.dataset.tab); }; });
  }

  /* ---------- elegir la tabla ---------- */
  function verElegir() {
    var hist = ctx.store.get('historial', {});
    app.innerHTML = pestanas() + '<div class="ref-panel">' +
      '<div class="ref-pregunta">¿Qué tabla querés practicar?<small>Primero la mirás un rato; después se borronea y te pregunto una por una.</small></div>' +
      '<div class="tb-elegir">' + TB.TABLAS.map(function (t) {
        var e = TB.estadoTabla(hist, t);
        return '<button type="button" class="tb-tabla-btn' + (e && e.dominada ? ' dominada' : '') + '" data-t="' + t + '"><b>' + t + '</b><small>' +
          (e ? (e.dominada ? '⭐ ' : '') + 'prom. ' + TB.segundos(e.ultima.prom) : 'nueva') + '</small></button>';
      }).join('') + '</div>' +
      '<p class="tb-sub">Tiempo para mirarla</p><div class="ref-fila">' + TB.TIEMPOS.map(function (s) {
        return '<button type="button" class="ref-opcion' + (S.segs === s ? ' sel' : '') + '" data-s="' + s + '">' + s + ' s</button>'; }).join('') + '</div>' +
      '</div>';
    app.querySelector('.tb-elegir').onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) memorizar(+b.dataset.t, null); };
    app.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { S.segs = +b.dataset.s; ctx.store.set('segs', S.segs); render(); }; });
  }

  /* ---------- la tabla centrada ---------- */
  function filas(modo) {
    return '<div class="tb-tabla" id="tabla">' + TB.FACTORES.map(function (q) {
      var actual = modo === 'preg' && S.cola[S.idx] === q, cls = 'tb-fila', r = String(S.t * q);
      if (modo === 'preg' && !actual) cls += ' borrosa';
      if (actual) { cls += ' actual' + (S.marca ? ' ' + S.marca : ''); r = S.mostrar ? String(S.t * q) : (S.buf.valor() || ' '); }
      return '<div class="' + cls + '"' + (modo === 'preg' && !actual ? ' aria-hidden="true"' : '') + ' data-q="' + q + '">' +
        '<span class="a">' + S.t + '</span><span class="x">×</span><span class="q">' + q + '</span><span class="x">=</span><span class="r' + (actual ? ' slot' : '') + '">' + esc(r) + '</span></div>';
    }).join('') + '</div>';
  }

  /* ---------- memorizar ---------- */
  function memorizar(t, solo) {
    parar();
    S.vista = 'memo'; S.t = t; S.solo = solo; S.tMemo = Date.now();
    var total = (solo ? Math.min(S.segs, 15) : S.segs) * 1000;
    app.innerHTML = pestanas() + '<div class="ref-panel tb-centro">' +
      '<div class="ref-pregunta">Mirá la tabla del ' + t + (solo ? ' (después repasamos las difíciles)' : '') + '</div>' +
      '<div class="tb-tiempo"><i id="barra"></i></div><div class="tb-quedan" id="quedan"></div>' +
      '<div class="ref-fila"><button type="button" class="ref-btn main" id="b-ya">¡Ya me la sé!</button><button type="button" class="ref-btn" id="b-volver">Elegir otra</button></div>' + filas('memo') + '</div>';
    render();
    var t0 = Date.now();
    function tic() {
      var falta = Math.max(0, total - (Date.now() - t0));
      $('#barra').style.width = (100 * falta / total) + '%';
      $('#quedan').textContent = 'Quedan ' + Math.ceil(falta / 1000) + ' s';
      if (falta <= 0) preguntar();
    }
    reloj = setInterval(tic, 100); tic();
    $('#b-ya').onclick = preguntar;
    $('#b-volver').onclick = function () { ir('elegir'); };
  }

  /* ---------- preguntar ---------- */
  function preguntar() {
    parar();
    var memoMs = Date.now() - S.tMemo;
    ctx.reg.iniciarRonda();
    ctx.reg.evento({ tipo: 'paso', paso: 'memorizar', tema: 'tabla' + S.t, intento: 0, item: { tabla: S.t }, ms: memoMs, ok: true, esperado: '', respuesta: '' });
    S.vista = 'preg'; S.cola = TB.orden(ctx.az, S.solo); S.idx = 0; S.res = {}; S.orden = []; S.requeue = {}; S.t0Ronda = Date.now(); S.buf = UI.entrada(3);
    vigia = UI.vigilar(ctx, { texto: function () { return 'responder ' + S.t + ' × ' + S.cola[S.idx]; }, elemento: function () { return document.querySelector('.tb-fila.actual'); } });
    app.innerHTML = pestanas() + '<div class="ref-panel tb-centro">' +
      '<div class="tb-cabeza"><span id="cuenta"></span><span>Tabla del ' + S.t + '</span></div>' +
      '<div class="tb-juego"><div id="zona"></div><div><div class="ref-teclado" id="teclado"></div>' +
      '<div class="ref-fila"><button type="button" class="ref-btn" id="b-pista">💡 Pista</button></div></div></div></div>';
    render();
    UI.teclado($('#teclado'), { digito: function (d) { if (S.bloq) return; S.buf.push(d); pintar(); }, borrar: function () { S.buf.pop(); pintar(); }, ok: responder });
    $('#b-pista').onclick = function () {
      var q = S.cola[S.idx]; S.ayuda = 'pista';
      UI.globo(q > 1 ? 'Armalo desde ' + S.t + ' × ' + (q - 1) + ' = ' + S.t * (q - 1) + ', y le sumás ' + S.t + '.' : 'Una vez ' + S.t + ' es ' + S.t + '.', 'tip');
    };
    nueva();
  }
  function nueva() { S.buf.limpiar(); S.marca = null; S.mostrar = false; S.bloq = false; S.ayuda = 'ninguna'; S.tq = performance.now(); UI.globo(null); pintar(); }
  function pintar() {
    $('#zona').innerHTML = filas('preg');
    $('#cuenta').textContent = Math.min(S.idx + 1, S.cola.length) + ' de ' + S.cola.length;
    if (ctx.debug) UI.debugSet({ tabla: S.t, q: S.cola[S.idx], esperado: S.t * S.cola[S.idx], cola: S.cola.join(',') });
  }
  function responder() {
    if (S.bloq) return;
    var v = S.buf.num(); if (v === null) return;
    var q = S.cola[S.idx], esp = S.t * q, ms = Math.round(performance.now() - S.tq), ok = v === esp;
    var r = S.res[q]; if (!r) { r = S.res[q] = { q: q, ms: ms, intentos: 0, ok1: ok }; S.orden.push(q); }
    r.intentos++;
    var info = ok ? null : TB.clasificar(S.t, q, v);
    ctx.reg.evento({ tipo: 'paso', paso: 'tabla', tema: 'tabla' + S.t, intento: r.intentos, item: { tabla: S.t, q: q, hecho: S.t + 'x' + q },
                     esperado: String(esp), respuesta: String(v), ok: ok, error: info ? info.codigo : null, ms: ms, ayuda: S.ayuda });
    if (ok) {
      UI.sonar('ok'); S.marca = 'ok'; S.mostrar = true; S.bloq = true; UI.globo(null); pintar();
      setTimeout(siguiente, 650);
      return;
    }
    UI.sonar('mal'); S.marca = 'mal';
    if (r.intentos >= 2) {     // segunda vez mal: se muestra y vuelve más adelante
      S.mostrar = true; S.bloq = true; UI.globo(S.t + ' × ' + q + ' = ' + esp + '. Te la vuelvo a preguntar al final.', 'mal'); pintar();
      if (!S.requeue[q]) { S.requeue[q] = true; S.cola.push(q); }
      setTimeout(siguiente, 1800);
      return;
    }
    S.buf.limpiar(); UI.globo(info.pista, 'mal'); S.tq = performance.now(); pintar();
  }
  function siguiente() { if (S.vista !== 'preg') return; S.idx++; if (S.idx >= S.cola.length) return terminar(); nueva(); }

  /* ---------- resumen ---------- */
  function terminar() {
    parar();
    var resultados = S.orden.map(function (q) { return S.res[q]; }), s = TB.resumir(resultados);
    var hist = ctx.store.get('historial', {}), antes = TB.estadoTabla(hist, S.t);
    if (!S.solo) { hist = TB.guardar(hist, S.t, resultados, Date.now()); ctx.store.set('historial', hist); }
    var r = ctx.reg.cerrarRonda(s.pct, Date.now() - S.t0Ronda, false, 1);
    S.vista = 'fin'; S.repasar = s.repasar;
    var mejora = !S.solo && antes && s.pct === 100 && s.prom < antes.mejor ? '<p class="tb-record">¡Récord! Antes tu mejor promedio era ' + TB.segundos(antes.mejor) + '.</p>' : '';
    var est = ''; for (var i = 1; i <= 3; i++) est += '<span class="' + (i <= r.estrellas ? '' : 'off') + '">⭐</span>';
    app.innerHTML = pestanas() + '<div class="ref-panel tb-centro">' +
      '<div class="ref-estrellas">' + est + '</div>' +
      '<div class="ref-pregunta">Tabla del ' + S.t + ': ' + s.ok1 + ' de ' + s.n + ' al primer intento<small>Promedio: ' + TB.segundos(s.prom) + ' por cuenta</small></div>' + mejora +
      '<div class="tb-resultados">' + resultados.slice().sort(function (a, b) { return a.q - b.q; }).map(function (x) {
        var c = !x.ok1 ? 'mal' : TB.velocidad(x.ms);
        return '<div class="tb-res ' + c + '"><b>' + S.t + ' × ' + x.q + ' = ' + S.t * x.q + '</b><span>' + (x.ok1 ? TB.segundos(x.ms) : '✗ ' + TB.segundos(x.ms)) + '</span></div>';
      }).join('') + '</div>' +
      '<p class="tb-ley"><span class="tb-res rapida">rápida</span> menos de 3 s · <span class="tb-res media">media</span> · <span class="tb-res lenta">lenta</span> 6 s o más · <span class="tb-res mal">✗</span> errada</p>' +
      '<div class="ref-fila">' + (s.repasar.length ? '<button type="button" class="ref-btn main" id="b-rep">Repasar las difíciles (' + s.repasar.length + ')</button>' : '') +
      '<button type="button" class="ref-btn' + (s.repasar.length ? '' : ' main') + '" id="b-otra">Otra vez la del ' + S.t + '</button>' +
      '<button type="button" class="ref-btn" id="b-elegir">Elegir otra tabla</button></div></div>';
    render();
    if (s.pct === 100) { UI.celebrar(s.repasar.length ? '¡Todas bien!' : '¡Perfecta!'); UI.fuegos.iniciar(); }
    if (s.repasar.length) $('#b-rep').onclick = function () { memorizar(S.t, S.repasar); };
    $('#b-otra').onclick = function () { memorizar(S.t, null); };
    $('#b-elegir').onclick = function () { ir('elegir'); };
  }

  /* ---------- tabla pitagórica ---------- */
  function verPita() {
    app.innerHTML = pestanas() + '<div class="ref-panel" id="pita"></div>';
    REF4_PITA.montar($('#pita'), { onPracticar: function (t) { memorizar(t, null); } });
  }

  if (ctx.debug) window.__ref4 = { act: ACT, version: VERSION, estado: function () { return { vista: S.vista, t: S.t, q: S.cola && S.cola[S.idx], cola: S.cola }; },
    memorizar: memorizar, preguntar: preguntar, responder: function (v) { S.buf.limpiar(); String(v).split('').forEach(function (d) { S.buf.push(d); }); responder(); } };

  render();
})();
