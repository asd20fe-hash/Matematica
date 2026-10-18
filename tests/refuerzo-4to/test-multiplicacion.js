'use strict';
var assert = require('assert');
var AZ = require('../../actividades/_comun-4to/azar.js');
var MO = require('../../actividades/4to-multiplicacion-paso-a-paso/multiplicacion-logica.js');

// Responde todos los pasos con la respuesta correcta (revisa al final en el nivel 4).
function resolver(M) {
  var ev = [], p, n = 0;
  while ((p = MO.actual(M)) && n++ < 200) {
    if (p.tipo === 'revision') { assert.ok(MO.revisar(M).ok); continue; }
    var r = MO.responder(M, p.esp); r.eventos.forEach(function (e) { ev.push(e); });
  }
  return ev;
}
function hasta(M, tipo, pred) {
  for (var i = 0; i < 200; i++) { var p = MO.actual(M); if (p.tipo === tipo && (!pred || pred(p))) return p; MO.responder(M, p.esp); }
  throw new Error('no llegó a ' + tipo);
}

prueba('multiplicación: 1000 cuentas por nivel dentro del rango y con reservas', function () {
  for (var nivel = 1; nivel <= 4; nivel++) {
    var az = AZ.crear(100 + nivel), cfg = MO.NIVELES[nivel];
    for (var i = 0; i < 1000; i++) {
      var g = MO.generar(nivel, az), la = String(g.a).length, lb = String(g.b).length;
      assert.ok(la >= cfg.la[0] && la <= cfg.la[1], 'cifras de a ' + g.a);
      assert.strictEqual(lb, cfg.lb, 'cifras de b ' + g.b);
      assert.ok(g.b % 10 >= 2, 'las unidades del multiplicador no son 0 ni 1: ' + g.b);
      var C = MO.filas(g.a, g.b);
      assert.ok(C.filas.some(function (F) { return F.cols.some(function (c) { return c.lleva > 0; }); }), 'tiene reservas ' + g.a + 'x' + g.b);
    }
  }
});
prueba('multiplicación: la cuenta resuelta coincide con a × b (filas y suma)', function () {
  var az = AZ.crear(7);
  for (var i = 0; i < 2000; i++) {
    var a = az.entero(10, 9999), b = az.entero(2, 99), C = MO.filas(a, b);
    C.filas.forEach(function (F) {
      var txt = F.cols.map(function (c) { return String(c.anota); }).reverse().join('') + (F.r ? '0' : '');
      assert.strictEqual(+txt, F.valor, 'fila ' + a + 'x' + F.f);
    });
    if (C.suma) assert.strictEqual(+C.suma.map(function (s) { return String(s.anota); }).reverse().join(''), a * b, 'suma ' + a + 'x' + b);
  }
});
prueba('multiplicación: un bot con respuestas correctas termina cada cuenta en todos los niveles', function () {
  for (var nivel = 1; nivel <= 4; nivel++) {
    var az = AZ.crear(30 + nivel);
    for (var i = 0; i < 200; i++) {
      var g = MO.generar(nivel, az), M = MO.crear({ a: g.a, b: g.b, nivel: nivel }), ev = resolver(M);
      assert.ok(MO.terminada(M), 'terminó ' + g.a + 'x' + g.b);
      assert.ok(ev.length && ev.every(function (e) { return e.ok && e.tipo === 'paso'; }), 'sin errores');
      var V = MO.vista(M, ''), filaFinal = V.suma || V.filas[0], txt = '';
      Object.keys(filaFinal).map(Number).sort(function (x, y) { return y - x; }).forEach(function (k) { txt += filaFinal[k].d; });
      assert.strictEqual(+txt, g.a * g.b, 'la cuenta dibujada da ' + g.a * g.b);
    }
  }
});
prueba('multiplicación: pasos de cada nivel', function () {
  var tipos = function (M) { return MO.planDe(M.C, M.nivel).map(function (p) { return p.tipo; }); };
  var m1 = MO.crear({ a: 347, b: 6, nivel: 1 });  // 42 (anoto 2, llevo 4), 24+4=28 (anoto 8, llevo 2), 18+2=20
  assert.deepStrictEqual(tipos(m1), ['mult', 'anoto', 'llevo', 'mult', 'sumo', 'anoto', 'llevo', 'mult', 'sumo', 'anoto']);
  var m3 = MO.crear({ a: 347, b: 26, nivel: 3 });
  var t3 = tipos(m3);
  assert.strictEqual(t3[0], 'estimacion'); assert.strictEqual(t3.indexOf('cero'), 6); assert.strictEqual(t3.filter(function (t) { return t === 'suma'; }).length, 4);
  assert.strictEqual(m3.plan[0].esp, 4);   // 347 × 26 = 9022
});
prueba('multiplicación: clasificación de errores', function () {
  var M = MO.crear({ a: 347, b: 6, nivel: 1 });
  var r = MO.responder(M, 40); assert.strictEqual(r.codigo, 'TABLA'); assert.ok(!r.ok);
  MO.responder(M, 42);
  r = MO.responder(M, 42); assert.strictEqual(r.codigo, 'ANOTO_TODO');
  r = MO.responder(M, 4); assert.strictEqual(r.codigo, 'RESERVA');
  MO.responder(M, 2); MO.responder(M, 4); MO.responder(M, 24);
  r = MO.responder(M, 24); assert.strictEqual(r.codigo, 'RESERVA');                    // sumo: no sumó lo que se llevó
  var M3 = MO.crear({ a: 347, b: 26, nivel: 3 });
  MO.responder(M3, 4);
  r = MO.responder(M3, 42); assert.strictEqual(r.codigo, 'ANOTO_TODO');
  MO.responder(M3, 2); MO.responder(M3, 4);
  r = MO.responder(M3, 4); assert.strictEqual(r.codigo, 'RESERVA');                      // 6×4=24: anotó 4, se olvidó del 4 que se llevaba
  hasta(M3, 'anoto', function (p) { return p.c.last; });
  r = MO.responder(M3, 0); assert.strictEqual(r.codigo, 'RESERVA');                      // la última: 20 entero
  hasta(M3, 'cero');
  r = MO.responder(M3, 4); assert.strictEqual(r.codigo, 'CERO_OMITIDO');
  hasta(M3, 'suma', function (p) { return p.s.entra > 0; });
  var p = MO.actual(M3); r = MO.responder(M3, (p.s.s - p.s.entra) % 10); assert.strictEqual(r.codigo, 'RESERVA');
  r = MO.responder(M3, (p.esp + 3) % 10 === (p.s.s - p.s.entra) % 10 ? (p.esp + 4) % 10 : (p.esp + 3) % 10); assert.strictEqual(r.codigo, 'SUMA');
});
prueba('multiplicación: errores registrados con hecho e intento', function () {
  var M = MO.crear({ a: 347, b: 6, nivel: 2 });
  var r = MO.responder(M, 41), e = r.eventos[0];
  assert.strictEqual(e.item.hecho, '6x7'); assert.strictEqual(e.intento, 1); assert.strictEqual(e.esperado, '42'); assert.strictEqual(e.error, 'TABLA');
  e = MO.responder(M, 42).eventos[0]; assert.strictEqual(e.intento, 2); assert.ok(e.ok);
  r = MO.responder(M, 42); assert.strictEqual(r.codigo, 'ANOTO_TODO');   // anotó el 42 entero en vez del 2
});
prueba('multiplicación: nivel 4 anota todo y marca el primer error al revisar', function () {
  var M = MO.crear({ a: 347, b: 26, nivel: 4 });
  MO.responder(M, 4);                                // estimación bien
  var r = MO.responder(M, 42); assert.ok(r.ok && r.silencioso);   // anota 42 en vez de 2: no se corrige todavía
  var p; while ((p = MO.actual(M)).tipo !== 'revision') MO.responder(M, p.esp);
  var rv = MO.revisar(M); assert.ok(!rv.ok); assert.strictEqual(rv.error.indice, 1); assert.strictEqual(rv.error.codigo, 'ANOTO_TODO');
  var V = MO.vista(M, '', rv.error); assert.ok(V.filas[0][0].err, 'marca la cifra con error');
  MO.corregir(M, rv.error.indice); assert.strictEqual(MO.actual(M).tipo, 'anoto');
  resolver(M); assert.ok(MO.terminada(M));
});
prueba('multiplicación: los hechos que fallan salen más seguido', function () {
  var cuenta = function (pesos) { var az = AZ.crear(5), n = 0; for (var i = 0; i < 2000; i++) if (MO.generar(1, az, pesos).b === 7) n++; return n; };
  assert.ok(cuenta({ '7x8': 2, '7x6': 2 }) > cuenta({}), 'el 7 sale más');
});
