/* El gato come fracciones (fracciones de 4to) — lógica pura, sin DOM.
   Depende de REF4_FR. Patrón UMD: window.REF4_GATO en el navegador, require en node. Versión 1.0.0 (2026-10-18).
   Tipos de ítem (Michi es el gato):
     come    Michi solo come las fracciones que valen tanto (1, 1/2, 2…): tocar las equivalentes; las otras las escupe.
     entero  "durmió 4/4 de hora": ¿cuántos enteros son?           (respuesta: entero)
     queda   "compró una sandía y comió 1/4": ¿qué parte le queda? (fracción; vale cualquier equivalente)
     simple  "comió 2/4 de la torta": escribilo con medios, 2/4 = ?/2 (respuesta: el número de arriba)
     mixto   "tomó 7/4 litros": ¿cuántos enteros y qué fracción?   (número mixto)
     junta   "comió 1/2 y después 2/4": ¿cuánto comió en total?    (vale cualquier forma)
   Errores: los de REF4_FR.ERRORES (EQUIV_SUMA, EQUIV_MAL_ESCALADA, INVERTIDA, CUENTA_PARTES, MIXTO, RESPONDE_EL_DATO,
   OPERA_DENOMINADORES, SE_PASA, NO_LLEGA, CALCULO). */
(function (root) {
  'use strict';
  var req = typeof module === 'object' && module.exports;
  var FR = req ? require('../_comun-4to/fracciones-lib.js') : root.REF4_FR;
  var fr = FR.fr;
  // Escritura tal cual (4/4 queda 4/4, no 1); con denominador 1 es un entero.
  function txt(f) { return f.d === 1 ? String(f.n) : f.n + '/' + f.d; }
  var VERSION = '1.0.0';

  var TIPOS = { 1: ['come', 'entero', 'queda', 'simple'], 2: ['come', 'entero', 'queda', 'simple', 'mixto', 'junta'], 3: ['come', 'entero', 'queda', 'simple', 'mixto', 'junta'] };
  var TEMA = { come: 'equivalencias', entero: 'mayor_que_uno', queda: 'cuanto_falta', simple: 'equivalencias', mixto: 'mayor_que_uno', junta: 'sumas_restas' };
  var DENS = { 1: [2, 3, 4, 6, 8], 2: [2, 3, 4, 5, 6, 8, 10, 12], 3: [2, 3, 4, 5, 6, 8, 9, 10, 12, 16] };
  var OBJETIVOS = { 1: [[1, 1], [1, 2]], 2: [[1, 1], [1, 2], [2, 1], [1, 4], [3, 4]], 3: [[1, 2], [3, 4], [2, 1], [1, 3], [2, 3], [3, 2]] };
  function tipos(nivel) { return TIPOS[nivel] || TIPOS[3]; }
  function ronda() { return 6; }
  function plural(d) { return FR.nombreDen(d, true); }

  // Formas de escribir o con denominadores de la lista (sin repetir la escritura).
  function formas(o, dens) {
    var s = FR.simplificar(o), out = [];
    dens.forEach(function (d) { if (d % s.d === 0) out.push(fr(s.n * d / s.d, d)); });
    return out;
  }
  // Fichas para darle de comer: correctas (codigo null) y distractores con el error que muestran.
  function fichasCome(o, nivel, az) {
    var dens = DENS[nivel], s = FR.simplificar(o), nb = nivel === 1 ? 2 : 3;
    // Primero las escritas de otra forma; la misma que pide (1/4 para 1/4) solo si no alcanzan.
    var otras = az.mezclar(formas(o, dens).filter(function (f) { return !FR.identicas(f, s); }));
    var buenas = (otras.length >= nb ? otras : otras.concat(formas(o, dens).filter(function (f) { return FR.identicas(f, s); }))).slice(0, nb);
    var malas = [];
    function agregar(f, codigo) {
      if (f.n < 1 || f.d < 2 || f.d > 16 || f.n > 40 || FR.iguales(f, o)) return;
      if (malas.concat(buenas).some(function (x) { return FR.identicas(x.f || x, f); })) return;
      malas.push({ f: f, codigo: codigo });
    }
    buenas.forEach(function (b) {
      if (s.n !== s.d) for (var k = 1; k <= 2; k++) agregar(fr(b.n + k, b.d + k), 'EQUIV_SUMA');
      agregar(fr(b.n + 1, b.d), 'SE_PASA'); agregar(fr(b.n - 1, b.d), 'NO_LLEGA');
      if (b.n !== b.d) agregar(fr(b.d, b.n), 'INVERTIDA');
      agregar(fr(s.n * 2, s.d * 3), 'EQUIV_MAL_ESCALADA'); agregar(fr(s.n * 3, s.d * 2), 'EQUIV_MAL_ESCALADA');
    });
    malas = az.mezclar(malas).slice(0, (nivel === 1 ? 5 : 6) - buenas.length);
    return az.mezclar(buenas.map(function (f) { return { f: f, codigo: null }; }).concat(malas));
  }

  var HISTORIAS = {
    entero: [
      { t: 'Michi durmió {f} de hora de siesta.', p: '¿Cuántas horas durmió?', u: 'horas' },
      { t: 'Michi comió {f} de pizza (las pizzas son todas iguales).', p: '¿Cuántas pizzas enteras son?', u: 'pizzas' },
      { t: 'Michi tomó {f} de litro de leche.', p: '¿Cuántos litros son?', u: 'litros' }],
    queda: [
      { t: 'Michi vino, compró una sandía y comió {f}.', p: '¿Qué parte de la sandía le queda?', cosa: 'sandía',
        t2: 'Michi vino, compró 2 sandías iguales y comió {f} de sandía.', p2: '¿Cuánta sandía le queda?' },
      { t: 'Michi compró una torta y se comió {f}.', p: '¿Qué parte de la torta queda?', cosa: 'torta',
        t2: 'Michi compró 2 tortas iguales y se comió {f} de torta.', p2: '¿Cuánta torta queda?' },
      { t: 'Michi tenía una botella de leche llena y tomó {f}.', p: '¿Qué parte de la botella queda?', cosa: 'botella',
        t2: 'Michi tenía 2 botellas de leche llenas y tomó {f} de botella.', p2: '¿Cuánta leche queda, en botellas?' }],
    simple: [
      { t: 'Michi comió {f} de la torta.', cosa: 'torta' },
      { t: 'Michi durmió {f} de la tarde.', cosa: 'tarde' },
      { t: 'Michi se tomó {f} del jugo.', cosa: 'jugo' }],
    mixto: [
      { t: 'Michi tomó {f} litros de leche en la semana.', p: '¿Cuántos litros enteros y qué fracción más?', u: 'litros' },
      { t: 'Michi durmió {f} horas.', p: '¿Cuántas horas enteras y qué fracción más?', u: 'horas' },
      { t: 'Michi comió {f} sandías.', p: '¿Cuántas sandías enteras y qué fracción más?', u: 'sandías' }],
    junta: [
      { t: 'A la mañana Michi comió {a} de sandía y a la tarde, {b}.', p: '¿Cuánta sandía comió en total?' },
      { t: 'Michi durmió {a} de hora antes de comer y {b} de hora después.', p: '¿Cuánto durmió en total?' },
      { t: 'Michi tomó {a} litro de leche y después {b} litro más.', p: '¿Cuánta leche tomó?' }]
  };
  function poner(t, o) { return t.replace(/\{(\w)\}/g, function (_, k) { return txt(o[k]); }); }
  function coprimo(n, d) { return FR.mcd(n, d) === 1; }

  // generar(nivel, tipo, az) → ítem {tipo, tema, texto, pregunta, modo, esperado, dibujo, info, …}
  function generar(nivel, tipo, az) {
    nivel = Math.max(1, Math.min(3, nivel || 1));
    var it = { tipo: tipo, tema: TEMA[tipo], nivel: nivel }, h;
    if (tipo === 'come') {
      var ob = az.elegir(OBJETIVOS[nivel]), o = fr(ob[0], ob[1]);
      it.objetivo = o; it.fichas = fichasCome(o, nivel, az);
      it.texto = 'Michi solo come fracciones que valen ' + (FR.esEntero(o) ? (o.n === 1 ? '1 entero' : o.n + ' enteros') : txt(o)) + '. Dale todas las que valen eso.';
      it.info = { objetivo: txt(o) }; return it;
    }
    if (tipo === 'entero') {
      var k = nivel === 1 ? 1 : az.entero(1, nivel === 2 ? 3 : 4), ds = nivel === 1 ? [2, 3, 4, 5, 6, 8] : (nivel === 2 ? [2, 3, 4] : [2, 3, 4, 5, 6, 8]);
      var d = az.elegir(ds); if (k * d > 24) k = Math.max(1, Math.floor(24 / d));
      var f = fr(k * d, d); h = az.elegir(HISTORIAS.entero);
      it.f = f; it.esperado = fr(k, 1); it.modo = 'entero'; it.texto = poner(h.t, { f: f }); it.pregunta = h.p; it.unidad = h.u;
      it.dibujo = { tiras: [f] }; it.info = { f: txt(f) }; return it;
    }
    if (tipo === 'queda') {
      var dq = az.elegir(nivel === 1 ? [2, 3, 4] : DENS[nivel].filter(function (x) { return x <= 10; })), nq = az.entero(1, dq - 1);
      var dos = nivel === 3 && az.prob(0.35), fq = fr(nq, dq);
      h = az.elegir(HISTORIAS.queda);
      it.f = fq; it.total = dos ? 2 : 1; it.esperado = FR.restar(fr(it.total, 1), fq); it.modo = dos ? 'mixto' : 'fraccion'; it.cosa = h.cosa;
      it.texto = poner(dos ? h.t2 : h.t, { f: fq }); it.pregunta = dos ? h.p2 : h.p;
      it.dibujo = { tiras: dos ? [fr(dq, dq), fr(dq, dq)] : [fr(dq, dq)], comidas: nq, d: dq }; it.info = { f: txt(fq), total: it.total }; return it;
    }
    if (tipo === 'simple') {
      var qs = nivel === 1 ? [2, 4] : [2, 3, 4, 5], q = az.elegir(qs), p, max = nivel === 3 ? 16 : (nivel === 2 ? 12 : 8), ks = [];
      do { p = az.entero(1, q - 1); } while (!coprimo(p, q));
      for (var i = 1; q * i <= max; i++) ks.push(i);
      var k1 = az.elegir(ks), k2; do { k2 = az.elegir(ks); } while (k2 === k1);
      h = az.elegir(HISTORIAS.simple);
      it.f = fr(p * k1, q * k1); it.den = q * k2; it.esperado = fr(p * k2, 1); it.modo = 'entero';
      it.texto = poner(h.t, { f: it.f }); it.pregunta = 'Escribilo con ' + plural(it.den) + ': ¿cuántos ' + plural(it.den) + ' son?';
      it.dibujo = { tiras: [it.f, fr(p * k2, q * k2)] }; it.info = { f: txt(it.f), den: it.den }; return it;
    }
    if (tipo === 'mixto') {
      var dm = az.elegir(nivel === 2 ? [2, 3, 4] : [2, 3, 4, 5, 6, 8]), nm;
      do { nm = az.entero(dm + 1, dm * (nivel === 2 ? 2 : 3) - 1); } while (nm % dm === 0);
      var fm = fr(nm, dm); h = az.elegir(HISTORIAS.mixto);
      it.f = fm; it.esperado = fm; it.modo = 'mixto'; it.texto = poner(h.t, { f: fm }); it.pregunta = h.p; it.unidad = h.u;
      it.dibujo = { tiras: [fm] }; it.info = { f: txt(fm) }; return it;
    }
    if (tipo === 'junta') {
      var a, b;
      if (nivel === 2) { a = fr(1, 2); b = fr(az.entero(1, 3), 4); }
      else {
        var base = az.elegir([2, 3, 4]), mult = base === 4 ? 2 : az.elegir([2, 3]);
        do { a = fr(az.entero(1, base - 1), base); } while (!coprimo(a.n, a.d));
        b = fr(az.entero(1, base * mult - 1), base * mult);
      }
      if (az.prob(0.5)) { var t = a; a = b; b = t; }
      h = az.elegir(HISTORIAS.junta);
      it.a = a; it.b = b; it.esperado = FR.sumar(a, b); it.modo = 'mixto'; it.texto = poner(h.t, { a: a, b: b }); it.pregunta = h.p;
      it.dibujo = { tiras: [a, b] }; it.info = { a: txt(a), b: txt(b) }; return it;
    }
    throw new Error('tipo desconocido ' + tipo);
  }

  /* ---------- validar: devuelven {ok, codigo} ---------- */
  function validarCome(it, i) { var c = it.fichas[i].codigo; return { ok: !c, codigo: c }; }
  // r: número (entero/simple) o fracción {n,d}; campos: {entero,num,den} del ingreso (para saber si escribió el mixto).
  function validar(it, r, campos) {
    var e = it.esperado;
    if (it.tipo === 'entero') {
      if (r === e.n) return { ok: true };
      return { ok: false, codigo: r === it.f.n ? 'CUENTA_PARTES' : 'MIXTO' };
    }
    if (it.tipo === 'simple') {
      if (r === e.n) return { ok: true };
      if (r === it.f.n + (it.den - it.f.d)) return { ok: false, codigo: 'EQUIV_SUMA' };
      return { ok: false, codigo: 'EQUIV_MAL_ESCALADA' };
    }
    if (it.tipo === 'mixto') {
      var escribio = campos && String(campos.entero || '') !== '' && String(campos.num || '') !== '';
      if (FR.iguales(r, e) && escribio && +campos.num < +campos.den) return { ok: true };
      if (FR.iguales(r, e)) return { ok: false, codigo: 'MIXTO', igual: true };
      return { ok: false, codigo: 'MIXTO' };
    }
    if (FR.iguales(r, e)) return { ok: true };
    if (r.n === e.d && r.d === e.n) return { ok: false, codigo: 'INVERTIDA' };
    if (it.tipo === 'queda') {
      if (FR.iguales(r, it.f)) return { ok: false, codigo: 'RESPONDE_EL_DATO' };
      return { ok: false, codigo: 'CALCULO' };
    }
    if (it.tipo === 'junta') {
      if (r.n === it.a.n + it.b.n && r.d === it.a.d + it.b.d) return { ok: false, codigo: 'OPERA_DENOMINADORES' };
      return { ok: false, codigo: FR.comparar(r, e) > 0 ? 'SE_PASA' : 'CALCULO' };
    }
    return { ok: false, codigo: 'CALCULO' };
  }

  /* ---------- pistas (voseo, cortas, sin retar) ---------- */
  // pista(ítem, código, extra): extra es la ficha escupida (come) o 'igual' (mixto con el valor bien pero sin enteros).
  function pista(it, codigo, ficha) {
    if (it.tipo === 'come') {
      var f = ficha, o = it.objetivo;
      if (codigo === 'EQUIV_SUMA') return '¡Puaj! A ' + txt(f) + ' le sumaron lo mismo arriba y abajo: así cambia de tamaño. Hay que multiplicar.';
      if (codigo === 'INVERTIDA') return '¡Puaj! ' + txt(f) + ' está dado vuelta. Mirá bien cuál va arriba.';
      if (codigo === 'SE_PASA') return '¡Puaj! ' + txt(f) + ' es más que ' + txt(o) + ': se pasa.';
      if (codigo === 'NO_LLEGA') return '¡Puaj! ' + txt(f) + ' es menos que ' + txt(o) + ': no llega.';
      return '¡Puaj! En ' + txt(f) + ' no multiplicaron arriba y abajo por el mismo número.';
    }
    if (it.tipo === 'entero') {
      var d = it.f.d;
      return 'Con ' + d + ' ' + plural(d) + ' se arma 1 entero. ¿Cuántos grupos de ' + d + ' hay en ' + it.f.n + '?';
    }
    if (it.tipo === 'simple') {
      var de = it.f.d, a = it.den;
      if (codigo === 'EQUIV_SUMA') return 'Sumar lo mismo arriba y abajo cambia el tamaño. Abajo pasó de ' + de + ' a ' + a + ': ¿por cuánto?';
      return a > de ? 'Abajo pasó de ' + de + ' a ' + a + ': multiplicó por ' + (a / de) + '. Hacé lo mismo arriba.'
        : 'Abajo pasó de ' + de + ' a ' + a + ': dividió por ' + (de / a) + '. Hacé lo mismo arriba.';
    }
    if (it.tipo === 'queda') {
      var dq = it.f.d;
      if (codigo === 'RESPONDE_EL_DATO') return 'Eso es lo que se comió. ¿Y lo que queda?';
      return (it.total === 2 ? 'Las 2 enteras son ' + (2 * dq) + '/' + dq : 'La ' + it.cosa + ' entera son ' + dq + '/' + dq) + '. Si se comió ' + txt(it.f) + ', ¿cuántos ' + plural(dq) + ' quedan?';
    }
    if (it.tipo === 'mixto') {
      if (ficha === 'igual') return '¡Vale lo mismo! Ahora escribilo con enteros: tocá la casilla grande para los enteros.';
      return 'Cada ' + it.f.d + '/' + it.f.d + ' es un entero. ¿Cuántos enteros entran en ' + txt(it.f) + ' y cuántos ' + plural(it.f.d) + ' sobran?';
    }
    if (it.tipo === 'junta') {
      var den = FR.mcm(it.a.d, it.b.d);
      if (codigo === 'OPERA_DENOMINADORES') return 'Los de abajo no se suman: dicen el tamaño de las partes. Pasá todo a ' + plural(den) + '.';
      return 'Pasá todo a ' + plural(den) + ': ' + txt(it.a) + ' = ' + txt(FR.aDenominador(it.a, den)) + ' y ' + txt(it.b) + ' = ' + txt(FR.aDenominador(it.b, den)) + '. Después sumá los de arriba.';
    }
    return 'Probá de nuevo.';
  }
  // Lo que dice Michi cuando sale bien (la equivalencia escrita).
  function mensaje(it) {
    var e = it.esperado;
    if (it.tipo === 'entero') return txt(it.f) + ' = ' + e.n + ' ' + (e.n === 1 ? it.unidad.replace(/s$/, '') : it.unidad) + '. ¡Ñam!';
    if (it.tipo === 'simple') return txt(it.f) + ' = ' + e.n + '/' + it.den + '. ¡Ñam!';
    if (it.tipo === 'mixto') return txt(it.f) + ' = ' + FR.formatear(it.f, { mixto: true }) + '. ¡Ñam!';
    if (it.tipo === 'queda') return 'Le queda ' + FR.formatear(e, { mixto: true }) + '. ¡Ñam!';
    if (it.tipo === 'junta') return txt(it.a) + ' + ' + txt(it.b) + ' = ' + FR.formatear(e, { mixto: true }) + '. ¡Ñam!';
    return '¡Ñam!';
  }
  // Lo que espera (para el debug y los eventos).
  function esperadoTexto(it) {
    if (it.tipo === 'come') return it.fichas.filter(function (x) { return !x.codigo; }).map(function (x) { return txt(x.f); }).join(' ');
    if (it.tipo === 'mixto') return FR.formatear(it.f, { mixto: true });
    return FR.formatear(it.esperado);
  }

  var APRENDISTE = [
    { frase: '4/4 es lo mismo que…', opciones: ['1 entero', '4 enteros', '8'] },
    { frase: 'Para escribir la misma fracción de otra forma, tengo que…', opciones: ['multiplicar o dividir arriba y abajo por el mismo número', 'sumar lo mismo arriba y abajo', 'cambiar solo el número de abajo'] },
    { frase: 'Si Michi comió 1/4 de la sandía, le queda…', opciones: ['3/4', '1/3', '4/4'] },
    { frase: 'Para sumar 1/2 + 1/4, primero…', opciones: ['paso 1/2 a cuartos: 2/4', 'sumo 2 + 4 abajo', 'sumo solo los de arriba'] }
  ];

  var api = { VERSION: VERSION, TIPOS: TIPOS, tipos: tipos, ronda: ronda, generar: generar, validarCome: validarCome, validar: validar, pista: pista,
    mensaje: mensaje, esperadoTexto: esperadoTexto, formas: formas, APRENDISTE: APRENDISTE };
  if (req) module.exports = api; else root.REF4_GATO = api;
})(typeof window !== 'undefined' ? window : this);
