'use strict';
var assert = require('assert');
var AZ = require('../../actividades/_comun-4to/azar.js');
var TB = require('../../actividades/4to-tablas/tablas-logica.js');

prueba('tablas: el orden pasa por todas una sola vez y es reproducible con la semilla', function () {
  for (var i = 0; i < 1000; i++) {
    var o = TB.orden(AZ.crear(i + 1));
    assert.deepStrictEqual(o.slice().sort(function (a, b) { return a - b; }), TB.FACTORES);
  }
  assert.deepStrictEqual(TB.orden(AZ.crear(9)), TB.orden(AZ.crear(9)));
  assert.deepStrictEqual(TB.orden(AZ.crear(3), [4, 8]).sort(), [4, 8]);
});
prueba('tablas: clasificación de errores con pista', function () {
  assert.strictEqual(TB.clasificar(7, 8, 15).codigo, 'SUMO_EN_VEZ');
  assert.strictEqual(TB.clasificar(7, 8, 49).codigo, 'TABLA');
  assert.ok(/7 × 7 = 49/.test(TB.clasificar(7, 8, 63).pista));
  TB.TABLAS.forEach(function (t) { TB.FACTORES.forEach(function (q) { var c = TB.clasificar(t, q, t * q + 1); assert.ok(c.codigo && c.pista); }); });
});
prueba('tablas: resumen, velocidades e historial', function () {
  var res = TB.FACTORES.map(function (q) { return { q: q, ms: q === 8 ? 7000 : (q === 6 ? 4000 : 1500), intentos: q === 7 ? 2 : 1, ok1: q !== 7 }; });
  var s = TB.resumir(res);
  assert.strictEqual(s.ok1, 9); assert.strictEqual(s.pct, 90); assert.deepStrictEqual(s.repasar, [7, 8]);
  assert.strictEqual(TB.velocidad(2999), 'rapida'); assert.strictEqual(TB.velocidad(3000), 'media'); assert.strictEqual(TB.velocidad(6000), 'lenta');
  var h = TB.guardar({}, 7, res, 1); assert.strictEqual(TB.estadoTabla(h, 7).dominada, false);
  var bien = TB.FACTORES.map(function (q) { return { q: q, ms: 1000, intentos: 1, ok1: true }; });
  h = TB.guardar(h, 7, bien, 2); var e = TB.estadoTabla(h, 7);
  assert.ok(e.dominada); assert.strictEqual(e.vueltas, 2); assert.strictEqual(e.mejor, 1000);
  for (var i = 0; i < 20; i++) h = TB.guardar(h, 7, bien, 3 + i);
  assert.ok(h[7].length <= 12, 'historial acotado');
  assert.strictEqual(TB.estadoTabla(TB.guardar({}, 7, bien.slice(0, 3), 1), 7), null, 'un repaso parcial no cuenta como vuelta');
  assert.strictEqual(TB.segundos(2340), '2,3 s');
});
