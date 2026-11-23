/* Saltos con monedas (1ro) — interfaz.
   ------------------------------------------------------------
   Historial de cambios
   v1.1.0  (2026-11-23) Billetes de $20, $50 y $100 y "Con menos"
     + Pestaña nueva "💵 Con menos": llegar a un número con la menor cantidad de billetes y monedas. "Hasta 20" con $1, $2,
       $5 y $10; "hasta 50" suma $20; "hasta 100" suma $50 y $100 (la cuadrícula queda como la tabla del 100).
     + Si llega con más piezas de las necesarias, la ayuda propone un canje concreto ("Cambiá $5 + $5 por un billete de
       $10") con el botón 🔄 Cambiar, hasta llegar a la menor cantidad. ⭐ si lo logra a la primera.
     + Pagar con "Todas" suma el billete de $20. Evento paso 'menos' con NO_MINIMA cuando no fue la menor cantidad.
   v1.0.0  (2026-11-23) Primera versión (sale del prototipo saltos_monedas v1.0; plan en docs/1ro-monedas/)
     + Para que Luz vea que la moneda de $2 vale el doble que la de $1: cada moneda tiene tantos puntos como vale y
       cada moneda es un salto en la recta, con la cuadrícula de 10 por fila (como la tabla del 100) y la cadena 0 → 2 → 4.
     + La de $2: balanza ($2 contra monedas de $1, o $5 contra monedas de $1 y $2, guardando las formas que encontró) y
       cambio de monedas de $2 por pares de $1.
     + Saltos: de a 1, 2, 5 o 10, empezando en 0 o en otro número (3 → 5 → 7) para que no memorice solo los pares.
     + Pagar: el primer precio es el de la tarea ($20 solo con monedas de $2); con "Todas" premia pagar con la menor
       cantidad de monedas. Si una moneda lo pasa del precio, no entra y se explica.
     + Desafío: rondas de 8 preguntas (cuántas monedas, cuánta plata, seguí contando, cuánto falta, quién tiene más);
       al errar, la ayuda muestra los saltos del canguro. Niveles 1 a 3 con REF4_EV; el primero de la sesión con salto 2
       es "¿cuántas monedas de $2 para pagar $20?".
     + Registro de cada intento (REF4_EV → MATE.nube) con códigos de error (CUENTA_MONEDAS, CUENTA_PESOS, DE_A_UNO…).
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var VERSION = '1.1.0', ACT = '1ro-monedas';
  var D = DINERO, MO = MONEDAS1, UI = REF4_UI;
  var ctx = UI1.base({ act: ACT, version: VERSION, titulo: 'Saltos con monedas' });
  if (!ctx) return;
  var $ = function (s) { return document.querySelector(s); };
  var espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  // La voz lee "$20" como "20 pesos".
  var decir = function (t) { UI1.hablar(String(t).replace(/<[^>]*>/g, ' ').replace(/\$(\d+)/g, '$1 pesos').replace(/__/g, 'cuánto').replace(/[→…]/g, ' ')); };
  var callar = function () { if (window.speechSynthesis) speechSynthesis.cancel(); };
  var estrellas = ctx.store.get('estrellas', 0);
  var sumarEstrella = function (n) { estrellas += n || 1; ctx.store.set('estrellas', estrellas); $('#des-est').textContent = $('#men-est').textContent = '⭐ ' + estrellas; };
  var paso = function (o) { return ctx.reg.evento(Object.assign({ tipo: 'paso' }, o)); };

  /* ==== PESTAÑAS ==== */
  var tab = ctx.store.get('tab', 'dos');
  function verTab(t) {
    tab = t; ctx.store.set('tab', t); callar();
    [].forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.classList.toggle('on', b.dataset.t === t); b.setAttribute('aria-selected', b.dataset.t === t); });
    [].forEach.call(document.querySelectorAll('.mo-sec'), function (s) { s.hidden = s.id !== 'sec-' + t; });
    if (t === 'desafio' && !R) nuevaRonda();
    if (t === 'saltos') recSal.centrar(recSal.total);
    if (t === 'menos') decir('Llegá a $' + men.obj + ' con la menor cantidad');
  }
  $('#tabs').onclick = function (e) { var b = e.target.closest('button'); if (b) verTab(b.dataset.t); };
  function seg(cont, valores, actual, alElegir, antesDe) {
    valores.forEach(function (v) {
      var b = document.createElement('button'); b.className = 'l1-btn' + (v === actual ? ' on' : ''); b.textContent = v; b.dataset.v = v;
      b.onclick = function () { [].forEach.call(cont.querySelectorAll('button[data-v]'), function (x) { x.classList.toggle('on', x === b); }); alElegir(v); };
      if (antesDe) cont.insertBefore(b, antesDe); else cont.appendChild(b);
    });
  }

  /* ==== 1 · LA MONEDA DE $2: balanza ==== */
  var bal = new D.Balanza($('#bal')), balObj = 2, balDer = [], balYa = false, formas5 = ctx.store.get('formas5', []);
  var balTodas = D.formas(5, [1, 2]).map(D.clave);
  seg($('#bal-obj'), ['$2', '$5'], '$2', function (v) { balObj = v === '$5' ? 5 : 2; balDer = []; armarBal(); });
  function armarBal() {
    $('#bal-tit').textContent = '¿Cuánto vale la moneda de $' + balObj + '?';
    $('#bal-pista').textContent = balObj === 2 ? 'Poné monedas de $1 del otro lado hasta que la balanza quede derechita.' : 'Poné monedas de $1 y de $2 del otro lado hasta que quede derechita. ¡Hay varias formas!';
    $('#bal-btns').innerHTML = '<button class="l1-btn" data-b="sacar">↩ Sacar</button>' + (balObj === 2 ? [1] : [1, 2]).map(function (v) { return '<button class="l1-btn main" data-b="' + v + '">+ ' + D.html(v, 34) + '</button>'; }).join('');
    actBal();
  }
  $('#bal-btns').onclick = function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.b === 'sacar') { if (!balDer.length) return; balDer.pop(); D.beep(400); }
    else { if (balDer.length >= 8) return; balDer.push(+b.dataset.b); D.beep(500 + D.suma(balDer) * 60); }
    actBal();
  };
  function actBal() {
    var dif = bal.poner([balObj], balDer), tot = D.suma(balDer), m = $('#bal-msg');
    if (dif < 0) { m.className = 'l1-msg'; m.textContent = tot === 0 ? 'Del lado de la moneda de $' + balObj + ' hay más plata. ¡Poné una moneda!' : '$' + tot + ' todavía es menos que $' + balObj + '. ¡Poné otra!'; balYa = false; return; }
    if (dif > 0) { m.className = 'l1-msg mal'; m.textContent = 'Ahora hay más plata del lado de las monedas chicas ($' + tot + '). Sacá una.'; balYa = false; return; }
    if (balYa) return;
    balYa = true; m.className = 'l1-msg ok';
    var cuenta = balDer.map(function (v) { return '$' + v; }).join(' + ') + ' = $' + balObj;
    if (balObj === 2) { m.innerHTML = '¡Derechita! 🎉<br>1 moneda de $2 = 2 monedas de $1<br>' + cuenta; decir('¡Muy bien! Una moneda de dos vale lo mismo que dos monedas de uno'); }
    else {
      var k = D.clave(balDer), nueva = formas5.indexOf(k) < 0;
      if (nueva) { formas5.push(k); ctx.store.set('formas5', formas5); }
      var faltan = balTodas.filter(function (x) { return formas5.indexOf(x) < 0; }).length;
      m.innerHTML = '¡Derechita! 🎉<br>' + cuenta + '<br>' + (nueva ? '¡Forma nueva! ' : 'Esa ya la tenías. ') + (faltan ? 'Hay ' + faltan + (faltan === 1 ? ' forma más' : ' formas más') + '. ¿La buscás?' : '¡Encontraste las ' + balTodas.length + ' formas!');
      decir('¡Muy bien! ' + cuenta.replace(/\$/g, ''));
    }
    D.confeti();
    paso({ tema: 'moneda2', paso: 'balanza', intento: 0, item: { objetivo: balObj }, esperado: balObj, respuesta: D.clave(balDer), ok: true, error: null, ms: 0, ayuda: 'ninguna' });
  }
  armarBal();

  /* ==== 1 · LA MONEDA DE $2: cambio ==== */
  var exN = 1;
  function armarEx() {
    $('#ex-n').textContent = exN;
    var h = '';
    for (var i = 1; i <= exN; i++) h += '<div class="mo-col"><span class="tot">$' + i * 2 + '</span>' + D.html(2, 52, i === exN ? 'din-pop' : '') + '<span class="fl">⇩</span><div class="par">' + D.html(1, 38) + D.html(1, 38) + '</div></div>';
    $('#ex-cols').innerHTML = h;
    $('#ex-msg').innerHTML = exN + ' ' + D.nombre(2, exN) + ' = ' + exN * 2 + ' ' + D.nombre(1, exN * 2) + ' = <span class="mo-acc">$' + exN * 2 + '</span>';
  }
  $('#ex-mas').onclick = function () { if (exN < 10) { exN++; armarEx(); D.beep(500 + exN * 50); decir(exN * 2); } };
  $('#ex-menos').onclick = function () { if (exN > 1) { exN--; armarEx(); D.beep(400); decir(exN * 2); } };
  armarEx();

  /* ==== 2 · SALTOS EN LA RECTA ==== */
  var salS = 2, salIni = 0;
  var recSal = new D.Recta($('#sal-recta'), { N: 20, saltarin: '🐸', alCambiar: function (r) {
    var k = r.items.length, tot = r.total, fin = !r.puede(salS);
    $('#sal-msg').className = 'l1-msg' + (fin && k ? ' ok' : '');
    $('#sal-msg').innerHTML = k === 0 ? 'Tocá <b>¡Saltar!</b>' :
      (r.inicio ? 'Desde ' + r.inicio + ', ' : '') + k + (k === 1 ? ' salto' : ' saltos') + ' de a ' + salS + ' = <span class="mo-acc">' + tot + '</span>' +
      (r.inicio ? '' : '<br><small style="color:var(--muted)">' + k + ' ' + D.nombre(salS, k) + ' = $' + tot + '</small>') + (fin ? '<br>¡Llegaste al final! 🎉' : '');
    $('#sal-saltar').disabled = fin;
  } });
  function armarSal() { $('#sal-moneda').innerHTML = D.html(salS, 50); $('#sal-ini').textContent = salIni; recSal.setN(salS <= 2 ? 20 : 50, salIni); }
  seg($('#sal-seg'), [1, 2, 5, 10], 2, function (v) { salS = v; armarSal(); });
  $('#sal-ini-mas').onclick = function () { if (salIni < 9) { salIni++; armarSal(); } };
  $('#sal-ini-menos').onclick = function () { if (salIni > 0) { salIni--; armarSal(); } };
  $('#sal-saltar').onclick = function () {
    var p = recSal.add(salS); if (!p) return;
    p.then(function () { D.beep(440 + recSal.total * 15); decir(recSal.total); if (!recSal.puede(salS)) D.confeti(); });
  };
  $('#sal-volver').onclick = function () { recSal.pop(); D.beep(300); };
  $('#sal-reset').onclick = function () { recSal.reset(); };
  armarSal();

  /* ==== 3 · PAGAR JUSTO ==== */
  var PAG_TODAS = [1, 2, 5, 10, 20];
  var PRODS = ['🧸', '🧃', '🍭', '✏️', '🍎', '🎈', '📒', '🍪', '🧩', '🚗'];
  var pag = { modo: 'dos', precio: 20, pagado: false, pasadas: 0, t0: Date.now() };
  var recPag = new D.Recta($('#pag-recta'), { N: 20, saltarin: '🐰' });
  var rand = function (a, b) { return ctx.az.entero(a, b); };
  function nuevoPrecio(primero) {
    var p;
    if (primero) p = 20;           // el problema de la tarea: $20 con monedas de $2
    else do { p = pag.modo === 'dos' ? 2 * rand(2, 10) : rand(5, 30); } while (p === pag.precio);
    pag.precio = p; pag.pagado = false; pag.pasadas = 0; pag.t0 = Date.now();
    $('#pag-precio').textContent = '$' + p; $('#pag-prod').textContent = PRODS[rand(0, PRODS.length - 1)];
    [].forEach.call(document.querySelectorAll('#pag-modo [data-m]'), function (b) { b.classList.toggle('on', b.dataset.m === pag.modo); });
    $('#pag-monedero').innerHTML = (pag.modo === 'dos' ? [2] : PAG_TODAS).map(function (v) { return '<button data-v="' + v + '" aria-label="' + D.nombre(v, 1) + '">' + D.html(v, 66) + '</button>'; }).join('');
    recPag.setN(pag.modo === 'dos' ? 20 : 30, 0); actPag();
    if (tab === 'pagar') decir('Cuesta $' + p);
  }
  function actPag() {
    var tot = recPag.total, falta = pag.precio - tot, a = 0;
    $('#pag-bandeja').innerHTML = recPag.items.map(function (v, i) { a += v; return '<div class="slot">' + D.html(v, 46, i === recPag.items.length - 1 ? 'din-pop' : '') + '<small>$' + a + '</small></div>'; }).join('') || '<span style="color:var(--muted);align-self:center">Acá van las monedas</span>';
    $('#pag-falta').textContent = falta > 0 ? 'Te falta $' + falta : '¡Justo!';
    var m = $('#pag-msg');
    if (falta === 0 && recPag.items.length) {
      var res = D.resumen(recPag.items), min = D.menorCantidad(pag.precio, pag.modo === 'dos' ? [2] : PAG_TODAS), esMin = min && recPag.items.length === min.length;
      m.className = 'l1-msg ok';
      m.innerHTML = '¡Pagaste justo $' + pag.precio + '! 🎉<br>Usaste ' + res + (pag.modo === 'todas' ? (esMin ? '<br>⭐ ¡Con la menor cantidad de monedas!' : '<br><small>Se puede con ' + min.length + (min.length === 1 ? ' sola' : '') + '. ¿Probás con menos?</small>') : '');
      if (!pag.pagado) {
        pag.pagado = true;
        if (pag.modo === 'todas' && esMin) sumarEstrella();
        paso({ tema: 'pagar', paso: pag.modo === 'dos' ? 'pagar_con_2' : 'pagar', intento: pag.pasadas + 1, item: { precio: pag.precio, modo: pag.modo, monedas: recPag.items.length, minima: min ? min.length : null },
          esperado: pag.precio, respuesta: D.clave(recPag.items), ok: true, error: null, ms: Date.now() - pag.t0, ayuda: 'ninguna' });
        setTimeout(function () { D.confeti(); decir('¡Muy bien! Pagaste ' + pag.precio + ' pesos con ' + res.replace(/\$/g, '')); }, 450);
      }
    } else { m.className = 'l1-msg'; m.textContent = recPag.items.length ? 'Llevás $' + tot : ''; pag.pagado = false; }
  }
  $('#pag-monedero').onclick = function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var v = +b.dataset.v, tot = recPag.total;
    if (tot === pag.precio) return;
    if (tot + v > pag.precio) {
      pag.pasadas++;
      $('#pag-msg').className = 'l1-msg mal'; $('#pag-msg').textContent = 'Con esa te pasás: serían $' + (tot + v) + ' y cuesta $' + pag.precio + '.';
      var mo = $('#pag-monedero'); mo.classList.remove('mo-sacude'); void mo.offsetWidth; mo.classList.add('mo-sacude');
      D.beep(180, 0.25); decir('Te pasás');
      paso({ tema: 'pagar', paso: pag.modo === 'dos' ? 'pagar_con_2' : 'pagar', intento: pag.pasadas, item: { precio: pag.precio, modo: pag.modo, llevaba: tot, moneda: v }, esperado: pag.precio, respuesta: tot + v, ok: false, error: 'TE_PASAS', ms: Date.now() - pag.t0, ayuda: 'ninguna' });
      return;
    }
    recPag.add(v).then(function () { D.beep(440 + recPag.total * 15); if (recPag.total !== pag.precio) decir(recPag.total); });
    actPag();
  };
  $('#pag-sacar').onclick = function () { recPag.pop(); actPag(); D.beep(300); };
  $('#pag-vaciar').onclick = function () { recPag.reset(); actPag(); };
  $('#pag-otro').onclick = function () { nuevoPrecio(false); };
  [].forEach.call(document.querySelectorAll('#pag-modo [data-m]'), function (b) { b.onclick = function () { if (pag.modo !== b.dataset.m) { pag.modo = b.dataset.m; nuevoPrecio(false); } }; });
  nuevoPrecio(true);

  /* ==== 4 · CON MENOS: llegar a un número con la menor cantidad de billetes y monedas ==== */
  var men = { hasta: ctx.store.get('menosHasta', 20), obj: 0, val: [], min: [], intento: 1, t0: 0, listo: false, canje: null };
  if (!MO.MENOS[men.hasta]) men.hasta = 20;
  var recMen = new D.Recta($('#men-recta'), { N: 20, saltarin: '🐿️' });
  seg($('#men-seg'), [20, 50, 100], men.hasta, function (v) { men.hasta = v; ctx.store.set('menosHasta', v); nuevoMenos(); }, $('#men-seg-fin'));
  $('#men-est').textContent = '⭐ ' + estrellas;
  function nuevoMenos() {
    men.val = MO.MENOS[men.hasta]; men.obj = MO.objetivoMenos(men.hasta, ctx.az, men.obj); men.min = MO.minimo(men.obj, men.val);
    men.intento = 1; men.t0 = Date.now(); men.listo = false; men.canje = null;
    $('#men-obj').textContent = '$' + men.obj;
    $('#men-monedero').innerHTML = men.val.map(function (v) { return '<button data-v="' + v + '" aria-label="' + D.nombre(v, 1) + '">' + D.html(v, D.esBillete(v) ? 52 : 58) + '</button>'; }).join('');
    recMen.setN(men.hasta, 0); actMenos();
    if (tab === 'menos') decir('Llegá a $' + men.obj + ' con la menor cantidad');
    if (ctx.debug) ctx.log('con menos', men.obj, 'mínimo', men.min.join('+'));
  }
  function actMenos() {
    var l = recMen.items, tot = recMen.total, falta = men.obj - tot, a = 0, m = $('#men-msg');
    $('#men-bandeja').innerHTML = l.map(function (v, i) { a += v; return '<div class="slot">' + D.html(v, D.esBillete(v) ? 40 : 44, i === l.length - 1 ? 'din-pop' : '') + '<small>$' + a + '</small></div>'; }).join('') || '<span style="color:var(--muted);align-self:center">Acá van los billetes y las monedas</span>';
    $('#men-falta').textContent = l.length ? (falta > 0 ? 'Llevás $' + tot + ' · te falta $' + falta : '¡Llegaste a $' + men.obj + '!') : '';
    $('#men-canje').hidden = true; men.canje = null;
    if (falta > 0 || !l.length) { m.className = 'l1-msg'; m.textContent = l.length ? '' : 'Tocá los billetes y las monedas.'; return; }
    var esMin = l.length === men.min.length, primera = men.intento === 1;
    if (esMin) {
      m.className = 'l1-msg ok';
      m.innerHTML = '¡Con la menor cantidad! 🎉<br>' + l.length + (l.length === 1 ? ' pieza: ' : ' piezas: ') + D.resumen(l);
      if (!men.listo) {
        men.listo = true; if (primera) sumarEstrella();
        paso({ tema: 'menos', paso: 'menos', intento: men.intento, item: { objetivo: men.obj, hasta: men.hasta, minima: men.min.length }, esperado: D.clave(men.min), respuesta: D.clave(l), ok: true, error: null, ms: Date.now() - men.t0, ayuda: primera ? 'ninguna' : 'canje' });
        setTimeout(function () { D.confeti(); decir('¡Muy bien! Con ' + l.length + ' nomás'); }, 450);
      }
      return;
    }
    // Llegó, pero se puede con menos: un canje concreto que deja menos piezas.
    men.canje = D.canje(l, men.val);
    // Se registra solo cuando llegó tocando ella (no cada paso intermedio de los canjes).
    if (!men.porCanje) { paso({ tema: 'menos', paso: 'menos', intento: men.intento, item: { objetivo: men.obj, hasta: men.hasta, minima: men.min.length, usadas: l.length }, esperado: D.clave(men.min), respuesta: D.clave(l), ok: false, error: 'NO_MINIMA', ms: Date.now() - men.t0, ayuda: men.intento === 1 ? 'ninguna' : 'canje' }); men.intento++; }
    men.porCanje = false;
    m.className = 'l1-msg mal';
    m.innerHTML = 'Llegaste con ' + l.length + '. ¡Se puede con menos! 💡' + (men.canje ? '<br><span class="mo-canje">Cambiá ' + men.canje.quitar.map(function (v) { return D.html(v, 30); }).join(' + ') + ' por ' + D.html(men.canje.poner, 30) + '</span>' : '');
    $('#men-canje').hidden = !men.canje;
    D.beep(300, 0.2); decir('Llegaste. ¡Pero se puede con menos!');
  }
  $('#men-monedero').onclick = function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var v = +b.dataset.v, tot = recMen.total;
    if (tot === men.obj) return;
    if (tot + v > men.obj) {
      $('#men-msg').className = 'l1-msg mal'; $('#men-msg').textContent = 'Con ese te pasás: serían $' + (tot + v) + ' y tenés que llegar a $' + men.obj + '.';
      var mo = $('#men-monedero'); mo.classList.remove('mo-sacude'); void mo.offsetWidth; mo.classList.add('mo-sacude');
      D.beep(180, 0.25); decir('Te pasás');
      paso({ tema: 'menos', paso: 'menos_pasa', intento: 0, item: { objetivo: men.obj, llevaba: tot, moneda: v }, esperado: men.obj, respuesta: tot + v, ok: false, error: 'TE_PASAS', ms: Date.now() - men.t0, ayuda: 'ninguna' });
      return;
    }
    recMen.add(v).then(function () { D.beep(440 + recMen.total * 6); if (recMen.total !== men.obj) decir(recMen.total); });
    actMenos();
  };
  // Canje: saca las piezas chicas y pone la grande (la recta se rearma con los saltos nuevos, de mayor a menor).
  $('#men-canje').onclick = function () {
    var c = men.canje; if (!c) return;
    var l = recMen.items.slice(); c.quitar.forEach(function (q) { l.splice(l.lastIndexOf(q), 1); }); l.push(c.poner);
    l.sort(function (a, b) { return b - a; });
    recMen.items = l; recMen.pintar(false); D.beep(660, 0.15); men.porCanje = true; actMenos();
  };
  $('#men-sacar').onclick = function () { recMen.pop(); actMenos(); D.beep(300); };
  $('#men-vaciar').onclick = function () { recMen.reset(); actMenos(); };
  $('#men-otro').onclick = function () { nuevoMenos(); };
  nuevoMenos();

  /* ==== 5 · DESAFÍO ==== */
  var desS = ctx.store.get('salto', 2), R = null, primeraRonda = true, tokAyuda = 0;
  if (MO.SALTOS.indexOf(desS) < 0) desS = 2;
  var recDes = new D.Recta($('#des-recta'), { N: 20, saltarin: '🦘' });
  seg($('#des-seg'), MO.SALTOS, desS, function (v) { desS = v; ctx.store.set('salto', v); nuevaRonda(); }, $('#des-seg-fin'));
  $('#des-est').textContent = '⭐ ' + estrellas;
  function nivelActual() {
    var n = ctx.reg.estado().nivel;
    if (ctx.debug && ctx.params.get('nivel')) n = Math.max(1, Math.min(3, parseInt(ctx.params.get('nivel'), 10) || n));
    return n;
  }
  function nuevaRonda() {
    ctx.reg.iniciarRonda();
    var nivel = nivelActual(); ctx.reg.ctx.nivel = nivel;
    var lista = MO.ronda(nivel, desS, ctx.az, primeraRonda); primeraRonda = false;
    R = { nivel: nivel, lista: lista, res: lista.map(function () { return null; }), idx: 0, t0r: Date.now() };
    ctx.log('ronda', nivel, 'salto', desS, lista.map(function (x) { return x.clave; }));
    nuevaPregunta();
  }
  function nuevaPregunta() {
    tokAyuda++; UI.fuegos.parar();
    var it = R.it = R.lista[R.idx]; R.intento = 1; R.buf = ''; R.t0 = Date.now(); R.ayuda = 'ninguna'; R.listo = false;
    $('#des-prog').innerHTML = UI1.progreso(R.res, R.idx);
    $('#des-preg').innerHTML = it.tipo === 'seguir' ? 'Seguí contando de a ' + it.s + ':' : it.tipo === 'falta' ? '¿Cuánto falta?' : it.texto.replace(/\$(\d+)/, '<span class="mo-acc">$$$1</span>');
    var v = '';
    if (it.tipo === 'cuantas') v = D.html(it.s, 60) + '<span class="mo-big">→ $' + it.X + '</span>';
    else if (it.tipo === 'cuanto') it.monedas.forEach(function (x) { v += D.html(x, it.s >= 10 ? 44 : 50); });
    else if (it.tipo === 'seguir') v = it.serie.map(function (n) { return '<span class="din-chip">' + n + '</span>'; }).join('<span class="din-fl">→</span>') + '<span class="din-fl">→</span><span class="din-chip">?</span>';
    else if (it.tipo === 'falta') v = it.tiene.map(function (x) { return D.html(x, 50); }).join('<span class="mo-big">+</span>') + '<span class="mo-big">+ ? = $' + it.total + '</span>';
    else if (it.tipo === 'quien') v = it.grupos.map(function (g) { return '<button class="mo-chico" data-n="' + g.nombre + '"><span class="cara">' + g.cara + '</span><span class="nom">' + g.nombre + '</span><span class="mon">' + g.lista.map(function (x) { return D.html(x, 40); }).join('') + '</span></button>'; }).join('');
    $('#des-vis').innerHTML = v;
    $('#des-resp-zona').hidden = it.tipo === 'quien';
    $('#des-resp').textContent = '?'; $('#des-resp').className = 'mo-resp';
    $('#des-msg').textContent = it.tipo === 'quien' ? 'Tocá al que tiene más plata.' : ''; $('#des-msg').className = 'l1-msg';
    $('#des-ayuda-box').hidden = true; $('#des-sig').hidden = true; $('#des-ayuda').hidden = false;
    if (ctx.debug) ctx.log('pregunta', it.clave, 'esperado', it.esperado);
    if (tab === 'desafio') decir(it.texto);
  }
  $('#des-oir').onclick = function () { if (R) decir(R.it.texto); };
  $('#des-vis').onclick = function (e) { var b = e.target.closest('.mo-chico'); if (b && R && !R.listo) responder(b.dataset.n, b); };

  var TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✔'];
  $('#des-pad').innerHTML = TECLAS.map(function (k) { return '<button type="button" class="l1-tecla' + (k === '✔' ? ' listo' : k === '⌫' ? ' borrar' : '') + '" data-k="' + k + '" aria-label="' + (k === '⌫' ? 'Borrar' : k === '✔' ? 'Listo' : k) + '">' + k + '</button>'; }).join('');
  function tecla(k) {
    if (!R || R.listo || R.it.tipo === 'quien') return;
    if (k === '✔') { if (R.buf) responder(+R.buf); return; }
    if (k === '⌫') R.buf = R.buf.slice(0, -1); else if (R.buf.length < 2) R.buf += k;
    D.beep(700, 0.05); $('#des-resp').className = 'mo-resp'; $('#des-resp').textContent = R.buf || '?';
  }
  $('#des-pad').onclick = function (e) { var b = e.target.closest('[data-k]'); if (b) tecla(b.dataset.k); };
  document.addEventListener('keydown', function (e) {
    if (tab !== 'desafio' || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.l1-modal')) return;
    if (/^[0-9]$/.test(e.key)) tecla(e.key); else if (e.key === 'Backspace') { e.preventDefault(); tecla('⌫'); } else if (e.key === 'Enter') { e.preventDefault(); tecla('✔'); }
  });

  function responder(resp, boton) {
    var it = R.it, err = MO.clasificar(it, resp), ok = !err;
    paso({ tema: 'desafio', paso: it.tipo, intento: R.intento, item: { clave: it.clave, s: it.s, texto: it.texto }, esperado: it.esperado, respuesta: resp, ok: ok, error: err, ms: Date.now() - R.t0, ayuda: R.ayuda });
    if (ok) {
      R.listo = true; tokAyuda++;
      if (R.res[R.idx] === null) R.res[R.idx] = R.intento === 1 && R.ayuda === 'ninguna' ? 'ok' : 'ayuda';
      if (R.res[R.idx] === 'ok') sumarEstrella();
      if (boton) boton.classList.add('ok'); else $('#des-resp').className = 'mo-resp ok';
      $('#des-msg').className = 'l1-msg ok'; $('#des-msg').textContent = R.intento === 1 ? '¡Muy bien! 🎉' : '¡Ahora sí! 🎉';
      UI.sonar('ok'); D.confeti(); decir(R.intento === 1 ? '¡Muy bien!' : '¡Ahora sí!');
      $('#des-sig').hidden = false; $('#des-ayuda').hidden = true; $('#des-sig').focus();
      $('#des-prog').innerHTML = UI1.progreso(R.res.map(function (r) { return r === 'ayuda' ? 'ok' : r; }), -1);
      return;
    }
    R.intento++; R.res[R.idx] = 'mal'; R.buf = '';
    if (boton) boton.classList.add('mal'); else $('#des-resp').className = 'mo-resp mal';
    $('#des-msg').className = 'l1-msg mal'; $('#des-msg').textContent = 'Casi… mirá los saltos y probá de nuevo 💡';
    UI.sonar('mal'); decir('Casi. Miremos los saltos');
    setTimeout(function () { if (boton) boton.classList.remove('mal'); }, 900);
    ayuda();
  }
  // Ayuda animada: el canguro salta moneda por moneda diciendo el total (nunca da la respuesta en seco).
  async function ayuda() {
    var it = R.it, tok = ++tokAyuda, box = $('#des-ayuda-box'), msg = $('#des-ayuda-msg');
    if (R.ayuda === 'ninguna') R.ayuda = 'saltos';
    box.hidden = false;
    var corre = function () { return tok === tokAyuda; };
    async function saltar(inicio, lista, N, cada) {
      recDes.setN(N, inicio); await espera(350);
      for (var i = 0; i < lista.length; i++) {
        if (!corre()) return false;
        await recDes.add(lista[i]); if (!corre()) return false;
        D.beep(440 + recDes.total * 12); decir(recDes.total); if (cada) cada(i);
        await espera(700);
      }
      return true;
    }
    if (it.tipo === 'quien') {
      var tots = [], N = Math.max(10, Math.ceil(Math.max.apply(null, it.grupos.map(function (g) { return D.suma(g.lista); })) / 10) * 10);
      for (var g = 0; g < it.ayuda.grupos.length; g++) {
        var gr = it.ayuda.grupos[g];
        msg.innerHTML = 'Las monedas de ' + gr.nombre + ':';
        if (!(await saltar(0, gr.lista, N))) return;
        tots.push(gr.nombre + ' tiene <span class="mo-acc">$' + recDes.total + '</span>');
        msg.innerHTML = tots.join(' · '); await espera(1200);
      }
      return;
    }
    var a = it.ayuda, N2 = MO.MAX[it.s];
    msg.textContent = '';
    await saltar(a.inicio, a.lista, N2, function (i) {
      var k = i + 1;
      if (it.tipo === 'falta') msg.innerHTML = k < a.desde ? '' : k === a.desde ? 'Ya tenés <span class="mo-acc">$' + recDes.total + '</span>. Seguí saltando hasta $' + it.total + '.' : 'Saltaste ' + (k - a.desde) + ' más: estás en $' + recDes.total + '.';
      else if (it.tipo === 'seguir') msg.innerHTML = 'De a ' + it.s + ': ' + recDes.total;
      else msg.innerHTML = k + ' ' + D.nombre(it.s, k) + ' = <span class="mo-acc">$' + recDes.total + '</span>';
    });
  }
  $('#des-ayuda').onclick = function () { if (R && !R.listo) { if (R.ayuda === 'ninguna') R.ayuda = 'saltos'; ayuda(); } };
  $('#des-sig').onclick = function () {
    callar();
    if (R.idx < R.lista.length - 1) { R.idx++; nuevaPregunta(); return; }
    var ok1 = R.res.filter(function (r) { return r === 'ok'; }).length, pct = Math.round(100 * ok1 / R.res.length);
    var c = ctx.reg.cerrarRonda(pct, Date.now() - R.t0r, false, 3);
    UI1.resumen({ estrellas: c.estrellas, extra: '<p class="l1-msg">' + ok1 + ' de ' + R.res.length + ' a la primera' + (c.cambio ? (c.nivel > R.nivel ? '<br>¡Subiste al nivel ' + c.nivel + '!' : '') : '') + '</p>' }, nuevaRonda);
  };

  verTab(tab);
  if (ctx.debug) window.__monedas = { ctx: ctx, R: function () { return R; }, recSal: recSal, recPag: recPag, recDes: recDes, recMen: recMen, men: men };
})();
