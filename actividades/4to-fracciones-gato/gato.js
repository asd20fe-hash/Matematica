/* El gato come fracciones (fracciones de 4to) — interfaz.
   ------------------------------------------------------------
   Historial de cambios
   v1.0.0  (2026-10-18) Primera versión
     + Michi, un gato que come fracciones: hay que darle las que valen lo que pide (1, 1/2, 2…); las otras las escupe.
     + Historias de Michi para escribir a qué equivalen: 4/4 de hora = 1 hora, lo que queda de la sandía,
       2/4 = ?/2, 7/4 = 1 3/4 y juntar 1/2 + 2/4.
     + 3 niveles, rondas de 6, tiras en el nivel 1 y con "Me perdí", registro de eventos, ?debug=1, ?seed=N, ?nivel=N y ?tipo=X.
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var VERSION = '1.0.0', ACT = '4to-fracciones-gato';
  var FRUI = REF4_FRUI, FR = REF4_FR, G = REF4_GATO, cf = FRUI.conFracciones;
  var txt = function (f) { return f.d === 1 ? String(f.n) : f.n + '/' + f.d; };
  var TEXTO_PASO = { come: 'darle de comer a Michi', entero: 'escribir cuántos enteros son', queda: 'escribir lo que queda', simple: 'escribir la fracción de otra forma',
    mixto: 'escribir los enteros y la fracción', junta: 'escribir cuánto es en total' };
  var CARA = { normal: '🐱', come: '😋', feliz: '😸', puaj: '😾', piensa: '🙀' };

  function gato(est, dice) {
    return '<div class="gt-escena"><div class="gt-gato ' + (est.cara || 'normal') + '" id="gato" aria-hidden="true">' + CARA[est.cara || 'normal'] + '</div>' +
      '<div class="gt-dice">' + cf(dice) + '</div></div>';
  }
  function tira(f, op) {
    op = op || {};
    var enteros = Math.max(1, Math.ceil(f.n / f.d)), h = '<div class="gt-tiras">';
    for (var e = 0; e < enteros; e++) {
      var pint = Math.max(0, Math.min(f.d, f.n - e * f.d)), tach = [];
      if (op.comidas) for (var i = 0; i < f.d; i++) if (e * f.d + i < op.comidas) tach.push(i);
      h += FRUI.tiraSVG(f.d, { pintadas: op.comidas ? 0 : pint, pintadas2: op.comidas ? f.d : 0, tachadas: tach, alto: 30, etiqueta: FR.leer(f) });
    }
    return h + '</div>';
  }
  function dibujo(it) {
    var d = it.dibujo; if (!d) return '';
    if (it.tipo === 'queda') return '<div class="fr-tiras"><div class="fila"><span>' + (it.total === 2 ? '2' : '1') + '</span>' +
      tira(FR.fr(it.total * d.d, d.d), { comidas: d.comidas }) + '</div><p class="gt-nota">Las tachadas son las que comió Michi.</p></div>';
    return '<div class="fr-tiras">' + d.tiras.map(function (f, i) {
      return '<div class="fila"><span>' + (it.tipo === 'simple' && i === 1 ? '?/' + it.den : FRUI.fraccionHTML(f)) + '</span>' + tira(f) + '</div>';
    }).join('') + '</div>';
  }

  function pintar(it, api) {
    var est = api.est, nivel = api.nivel, h = '';
    if (!est.iniciado) { est.iniciado = true; est.comidas = []; est.escupidas = []; api.nuevoPaso(it.tipo); }
    if (it.tipo === 'come') {
      var falta = it.fichas.filter(function (x, i) { return !x.codigo && est.comidas.indexOf(i) < 0; }).length;
      h += gato(est, est.dice || it.texto);
      h += '<p class="gt-falta">' + (falta ? 'Le ' + (falta === 1 ? 'falta 1' : 'faltan ' + falta) + ' para llenarse.' : '¡Panza llena!') + '</p>';
      h += '<div class="gt-fichas" id="fichas">' + it.fichas.map(function (x, i) {
        var c = est.comidas.indexOf(i) >= 0 ? ' comida' : (est.escupidas.indexOf(i) >= 0 ? ' mal' : '');
        return '<button type="button" class="gt-ficha' + c + '" data-i="' + i + '"' + (c ? ' disabled' : '') + '>' + FRUI.fraccionHTML(x.f) + '</button>';
      }).join('') + '</div>';
      if (est.tiras || nivel === 1) h += '<div class="fr-tiras">' + it.fichas.map(function (x) { return '<div class="fila"><span>' + FRUI.fraccionHTML(x.f) + '</span>' + tira(x.f) + '</div>'; }).join('') + '</div>';
      api.cont.innerHTML = h;
      return;
    }
    h += gato(est, est.dice || it.texto);
    h += '<div class="fr-preg">' + esc(it.pregunta) + '</div>';
    if (it.tipo === 'simple') h += '<div class="gt-ecuacion">' + FRUI.fraccionHTML(it.f) + ' <span>=</span> <span class="gt-ap"><span class="n">?</span><span class="d">' + it.den + '</span></span></div>';
    if (est.tiras || nivel === 1) h += dibujo(it);
    h += '<div id="ing"></div>';
    api.cont.innerHTML = h;
    if (!est.fin) FRUI.ingreso(document.getElementById('ing'), { modo: it.modo, etiqueta: 'Tu respuesta', sufijo: it.tipo === 'simple' ? '/' + it.den : '',
      onOk: function (f, forma, campos) { responder(it, api, f, forma, campos); } });
    else document.getElementById('ing').innerHTML = '';
    api.botonVoz(function () { return it.texto + ' ' + it.pregunta; });
  }
  function esc(s) { return FRUI.esc(s); }

  // Cambia la cara (y lo que dice) sin volver a pintar, así no se borra lo que está escribiendo.
  function cara(api, c, dice, ms) {
    var est = api.est, g = document.getElementById('gato'), d = document.querySelector('.gt-dice');
    est.cara = c; if (dice !== undefined) est.dice = dice;
    if (g) { g.className = 'gt-gato ' + c; g.textContent = CARA[c]; }
    if (d && dice !== undefined) d.innerHTML = cf(dice);
    clearTimeout(est.tCara);
    if (ms) est.tCara = setTimeout(function () { if (est.cara === c) cara(api, 'normal'); }, ms);
  }
  function responder(it, api, f, forma, campos) {
    if (api.est.fin) return;
    var r = it.modo === 'entero' ? f.n / f.d : f, v = G.validar(it, r, campos);
    var resp = it.modo === 'entero' ? r : FR.formatear(f, { mixto: forma === 'mixto' });
    var p = v.ok ? null : G.pista(it, v.codigo, v.igual ? 'igual' : null);
    api.responder({ paso: it.tipo, ok: v.ok, error: v.codigo, esperado: G.esperadoTexto(it), respuesta: resp, forma: forma, pista: p, mensaje: v.ok ? G.mensaje(it) : null });
    if (v.ok) { api.est.fin = true; cara(api, 'feliz', G.mensaje(it)); comerRespuesta(); api.fin(1700); }
    else cara(api, 'piensa', undefined, 1400);
  }
  // La respuesta vuela a la boca de Michi.
  function comerRespuesta() {
    var g = document.getElementById('gato'); if (!g) return;
    g.classList.add('mastica');
  }
  function volarAlGato(b, listo) {
    var g = document.getElementById('gato'); if (!g || !b) return listo();
    var rb = b.getBoundingClientRect(), rg = g.getBoundingClientRect();
    b.style.setProperty('--dx', (rg.left + rg.width / 2 - rb.left - rb.width / 2) + 'px');
    b.style.setProperty('--dy', (rg.top + rg.height * 0.6 - rb.top - rb.height / 2) + 'px');
    b.classList.add('vuela');
    var hecho = false, fin = function () { if (hecho) return; hecho = true; listo(); };
    b.addEventListener('animationend', fin); setTimeout(fin, 700);
  }

  function enlazar(it, api) {
    if (it.tipo !== 'come') return;
    var est = api.est, cont = document.getElementById('fichas');
    cont.onclick = function (e) {
      var b = e.target.closest('[data-i]'); if (!b || b.disabled || est.ocupado) return;
      var i = +b.dataset.i, v = G.validarCome(it, i), x = it.fichas[i];
      api.intentos.come = 0; // cada ficha cuenta como un paso
      api.responder({ paso: 'come', ok: v.ok, error: v.codigo, esperado: txt(it.objetivo), respuesta: txt(x.f), forma: 'opcion', item: { objetivo: txt(it.objetivo), ficha: txt(x.f) } });
      if (v.ok) {
        est.ocupado = true;
        volarAlGato(b, function () {
          est.ocupado = false; est.comidas.push(i); api.render();
          var quedan = it.fichas.some(function (y, j) { return !y.codigo && est.comidas.indexOf(j) < 0; });
          if (quedan) cara(api, 'come', '¡Ñam! ' + txt(x.f) + ' = ' + txt(it.objetivo) + '. ¡Más!', 900);
          else { cara(api, 'feliz', '¡Qué rico! Todas valían ' + txt(it.objetivo) + '.'); api.fin(1600); }
        });
      } else {
        est.escupidas.push(i); b.classList.add('mal'); b.disabled = true; FRUI.globo(G.pista(it, v.codigo, x.f), 'mal');
        cara(api, 'puaj', undefined, 1200);
      }
    };
  }

  FRUI.actividad({
    act: ACT, titulo: 'El gato come fracciones', version: VERSION, nivelMax: 3,
    tamRonda: G.ronda, tipos: G.tipos, generar: G.generar, tipoFinal: function () { return 'come'; }, // la ronda termina dándole de comer a Michi
    pintar: function (it, api) { pintar(it, api); enlazar(it, api); },
    meperdi: function (it, api) {
      api.est.tiras = true; api.render();
      api.pista(it.tipo === 'come' ? 'Mirá las tiras: las que ocupan lo mismo valen lo mismo.' : G.pista(it, null));
    },
    textoPaso: function (it) { return TEXTO_PASO[it.tipo]; },
    esperado: function (it) { return G.esperadoTexto(it); },
    aprendiste: G.APRENDISTE
  });
})();
