'use strict';
var assert = require('assert');
var AZ = require('../../actividades/_comun-4to/azar.js');
var RC = require('../../actividades/4to-geometria-rectas/rectas-logica.js');

var D2R = Math.PI / 180;
// ejercicio fijo: recta dada horizontal R por (100,200)-(500,200), objetivo c en (300,100), distractor q en (100,100)
function ej(tipo) {
  return { tipo: tipo, W: 600, H: 400, angRef: 0, ref: { nombre: 'R', a: { x: 100, y: 200 }, b: { x: 500, y: 200 } }, nueva: { nombre: 'N' },
           objetivo: { nombre: 'c', x: 300, y: 100, objetivo: true },
           puntos: [{ nombre: 'c', x: 300, y: 100, objetivo: true }, { nombre: 'q', x: 100, y: 100, objetivo: false }] };
}
// recta del chico con ángulo ang (grados) que pasa a "corr" de c (corrida en vertical si es casi horizontal, si no en horizontal)
function linea(ang, corr, centro) {
  var c = centro || { x: 300, y: 100 }, dx = Math.cos(ang * D2R) * 80, dy = Math.sin(ang * D2R) * 80;
  return { a: { x: c.x - dx, y: c.y - dy + (corr || 0) }, b: { x: c.x + dx, y: c.y + dy + (corr || 0) } };
}

prueba('rectas: comprobar() en los límites de ángulo (5,9° / 6,1°, 84° / 96°, 14° / 16°)', function () {
  assert.ok(RC.comprobar(ej('paralela'), linea(5.9)).dirOk);
  assert.ok(!RC.comprobar(ej('paralela'), linea(6.1)).dirOk);
  assert.ok(RC.comprobar(ej('paralela'), linea(-5.9)).dirOk);
  assert.ok(RC.comprobar(ej('paralela'), linea(180 - 5.9)).dirOk, 'la dirección no depende del sentido del trazo');
  assert.ok(RC.comprobar(ej('perpendicular'), linea(84)).dirOk);
  assert.ok(RC.comprobar(ej('perpendicular'), linea(96)).dirOk);
  assert.ok(!RC.comprobar(ej('perpendicular'), linea(83.9)).dirOk);
  assert.ok(!RC.comprobar(ej('perpendicular'), linea(96.1)).dirOk);
  assert.ok(RC.comprobar(ej('perpendicular'), linea(-90)).dirOk);
  assert.ok(!RC.comprobar(ej('oblicua'), linea(14)).dirOk);
  assert.ok(RC.comprobar(ej('oblicua'), linea(16)).dirOk);
  assert.ok(RC.comprobar(ej('oblicua'), linea(74)).dirOk);
  assert.ok(!RC.comprobar(ej('oblicua'), linea(76)).dirOk);
  assert.ok(RC.comprobar(ej('oblicua'), linea(-45)).dirOk);
});
prueba('rectas: comprobar() en el límite de distancia (11 / 13 con tolerancia 12)', function () {
  assert.ok(RC.comprobar(ej('paralela'), linea(0, 11), 12).puntoOk);
  assert.ok(!RC.comprobar(ej('paralela'), linea(0, 13), 12).puntoOk);
  assert.ok(RC.comprobar(ej('paralela'), linea(0, -11), 12).ok);
  var r = RC.comprobar(ej('paralela'), linea(0, 13), 12);
  assert.strictEqual(r.error, 'NO_PASA_PUNTO'); assert.ok(/punto c/.test(r.msgPunto));
  // la distancia es a la recta infinita: un trazo corto lejos del punto pero alineado sirve
  assert.ok(RC.comprobar(ej('paralela'), linea(0, 0, { x: 520, y: 100 })).ok);
  // la tolerancia cambia con la pantalla (px de pantalla → unidades del tablero)
  assert.ok(RC.comprobar(ej('paralela'), linea(0, 20), 24).puntoOk);
});
prueba('rectas: errores y mensajes', function () {
  var r = RC.comprobar(ej('paralela'), linea(90));
  assert.strictEqual(r.error, 'CONFUNDE_TIPO'); assert.ok(/perpendicular, y te pedí paralela/.test(r.msgDir));
  r = RC.comprobar(ej('perpendicular'), linea(70));
  assert.strictEqual(r.error, 'CONFUNDE_TIPO'); assert.ok(/ángulos rectos/.test(r.msgDir));
  r = RC.comprobar(ej('perpendicular'), linea(80));
  assert.strictEqual(r.error, 'INCLINACION'); assert.ok(/4 ángulos rectos/.test(r.msgDir));
  r = RC.comprobar(ej('oblicua'), linea(10));
  assert.strictEqual(r.error, 'INCLINACION'); assert.ok(/Parece paralela/.test(r.msgDir));
  r = RC.comprobar(ej('oblicua'), linea(0));
  assert.strictEqual(r.error, 'CONFUNDE_TIPO');
  // pasa por el distractor q (horizontal por y=100 pasa por q y por c: eso es acierto)
  r = RC.comprobar(ej('perpendicular'), linea(90, 0, { x: 100, y: 150 }));
  assert.strictEqual(r.puntoTocado, 'q'); assert.strictEqual(r.error, 'PUNTO_EQUIVOCADO'); assert.ok(/punto q, pero te pedí el punto c/.test(r.msgPunto));
  r = RC.comprobar(ej('perpendicular'), linea(90));
  assert.ok(r.ok && r.error === null && /✔/.test(r.msgDir) && /✔/.test(r.msgPunto));
  // dirección mal y punto mal: el código es el de la dirección
  assert.strictEqual(RC.comprobar(ej('paralela'), linea(90, 0, { x: 450, y: 300 })).error, 'CONFUNDE_TIPO');
});
prueba('rectas: 1000 ejercicios por nivel y tamaño quedan adentro y se pueden resolver', function () {
  [[340, 300], [360, 420], [900, 520], [600, 380]].forEach(function (wh) {
    var W = wh[0], H = wh[1];
    [1, 2, 3].forEach(function (nivel) {
      var az = AZ.crear(1000 * W + nivel), b = RC.bolsa(az), cuenta = {};
      for (var i = 0; i < 1000; i++) {
        var e = RC.generar(az, W, H, { nivel: nivel, tipo: b.sacar() });
        cuenta[e.tipo] = (cuenta[e.tipo] || 0) + 1;
        assert.strictEqual(e.puntos.length, 1 + RC.NIVELES[nivel].distractores);
        e.puntos.forEach(function (p) { assert.ok(RC.adentro(p, W, H, 55 - 0.1), 'punto adentro ' + JSON.stringify(p)); });
        for (var j = 0; j < e.puntos.length; j++) for (var k = j + 1; k < e.puntos.length; k++) assert.ok(RC.dist(e.puntos[j], e.puntos[k]) > 110, 'distractores separados');
        e.puntos.forEach(function (p) { if (!p.objetivo) assert.ok(RC.distRecta(p, e.ref.a, e.ref.b) > 45, 'distractor lejos de la recta'); });
        var dObj = RC.distRecta(e.objetivo, e.ref.a, e.ref.b);
        assert.ok(dObj >= 69.9 && dObj <= Math.max(85, 0.32 * Math.min(W, H)) + 0.2, 'distancia del objetivo ' + dObj);
        assert.ok(RC.adentro(e.ref.a, W, H, 24.9) && RC.adentro(e.ref.b, W, H, 24.9), 'recta dada recortada');
        if (e.tipo === 'perpendicular') assert.ok(RC.adentro(RC.pie(e.objetivo, e.ref.a, e.ref.b), W, H, 24.9), 'pie adentro');
        assert.ok(/^[A-Z]$/.test(e.ref.nombre) && /^[A-Z]$/.test(e.nueva.nombre) && e.ref.nombre !== e.nueva.nombre);
        assert.ok('IOQ'.indexOf(e.ref.nombre) < 0 && 'IOQ'.indexOf(e.nueva.nombre) < 0);
        e.puntos.forEach(function (p) { assert.ok(/^[a-z]$/.test(p.nombre) && 'ilojcpsuvwxyzk'.indexOf(p.nombre) < 0, 'minúscula inconfundible');
          assert.ok(p.nombre !== e.ref.nombre.toLowerCase() && p.nombre !== e.nueva.nombre.toLowerCase(), 'no repite la letra de una recta'); });
        assert.strictEqual(new Set(e.puntos.map(function (p) { return p.nombre; })).size, e.puntos.length);
        assert.ok(RC.comprobar(e, RC.solucion(e), 12).ok, 'la solución pasa');
        var g = RC.guia(e); assert.ok(RC.distRecta(e.objetivo, g.a, g.b) > 30, 'la guía no pasa por el punto');
        assert.ok(RC.comprobar(e, g, 12).dirOk, 'la guía tiene la inclinación correcta');
        var ang = e.angRef; assert.ok(nivel === 1 ? Math.abs(ang) <= 25 : Math.abs(ang) <= 80);
      }
      RC.TIPOS.forEach(function (t) { assert.ok(cuenta[t] >= 300, 'la bolsa reparte los tipos'); });
    });
  });
});
prueba('rectas: reproducible con la semilla, notación y estadísticas', function () {
  assert.deepStrictEqual(RC.generar(AZ.crear(5), 600, 400, { nivel: 2 }), RC.generar(AZ.crear(5), 600, 400, { nivel: 2 }));
  var e = RC.generar(AZ.crear(7), 600, 400, { nivel: 2, usados: ['A', 'B'] });
  assert.ok(e.ref.nombre !== 'A' && e.ref.nombre !== 'B');
  var n = RC.notaciones(ej('paralela')).map(function (x) { return x.texto; });
  assert.deepStrictEqual(n, ['N // R', 'N ⊥ R', 'N ∠ R']);
  var evs = [
    { tipo: 'paso', paso: 'trazar', sesion: 's', intento: 1, ok: false, error: 'CONFUNDE_TIPO', ms: 3000, item: { id: 1, tipo: 'paralela' } },
    { tipo: 'paso', paso: 'trazar', sesion: 's', intento: 2, ok: true, ms: 2000, item: { id: 1, tipo: 'paralela' } },
    { tipo: 'paso', paso: 'trazar', sesion: 's', intento: 1, ok: true, ms: 4000, item: { id: 2, tipo: 'paralela' } },
    { tipo: 'paso', paso: 'notacion', sesion: 's', intento: 1, ok: false, error: 'NOTACION', item: { id: 2, tipo: 'paralela' } },
    { tipo: 'paso', paso: 'trazar', sesion: 's', intento: 1, ok: false, error: 'CONFUNDE_TIPO', ms: 1000, item: { id: 3, tipo: 'oblicua' } }
  ];
  var s = RC.estadisticas(evs);
  assert.deepStrictEqual(s.tipos[0], { tipo: 'paralela', n: 2, pct1: 50, msMedio: 4500 });
  assert.strictEqual(s.tipos[1].tipo, 'oblicua'); assert.strictEqual(s.error, 'CONFUNDE_TIPO'); assert.strictEqual(s.nError, 2);
  // bolsa con pesos: el que más cuesta sale más
  var b = RC.bolsa(AZ.crear(3), { perpendicular: 3 }), c = {};
  for (var i = 0; i < 50; i++) { var t = b.sacar(); c[t] = (c[t] || 0) + 1; }
  assert.strictEqual(c.perpendicular, 30);
});
