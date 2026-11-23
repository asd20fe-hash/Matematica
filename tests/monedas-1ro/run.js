/* Pruebas de Saltos con monedas (1ro). Se corren con: node tests/monedas-1ro/run.js
   Sin dependencias: solo assert. Lógica pura de _comun-1ro/dinero.js y 1ro-monedas/monedas-logica.js. */
'use strict';
var assert = require('assert'), path = require('path');
var RAIZ = path.join(__dirname, '..', '..');
var D = require(path.join(RAIZ, 'actividades/_comun-1ro/dinero.js'));
var M = require(path.join(RAIZ, 'actividades/1ro-monedas/monedas-logica.js'));
var AZ = require(path.join(RAIZ, 'actividades/_comun-4to/azar.js'));
var fallos = 0, n = 0;
function prueba(nombre, fn) { n++; try { fn(); console.log('  ok   ' + nombre); } catch (e) { fallos++; console.log('  FALLA ' + nombre + '\n         ' + (e && e.message)); } }

prueba('nombre: moneda/monedas y billete/billetes', function () {
  assert.strictEqual(D.nombre(2, 1), 'moneda de $2'); assert.strictEqual(D.nombre(2, 3), 'monedas de $2');
  assert.strictEqual(D.nombre(10, 1), 'billete de $10'); assert.strictEqual(D.nombre(10, 2), 'billetes de $10');
});
prueba('resumen de lo pagado, de mayor a menor', function () {
  assert.strictEqual(D.resumen([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]), '10 monedas de $2');
  assert.strictEqual(D.resumen([1, 10, 2, 2]), '1 billete de $10, 2 monedas de $2 y 1 moneda de $1');
});
prueba('menor cantidad: $20 con monedas de $2 son 10; $27 con todas son 4', function () {
  assert.strictEqual(D.menorCantidad(20, [2]).length, 10);
  assert.deepStrictEqual(D.menorCantidad(27, D.VALORES), [10, 10, 5, 2]);
  assert.strictEqual(D.menorCantidad(7, [2]), null);
  for (var p = 1; p <= 30; p++) assert.strictEqual(D.suma(D.menorCantidad(p, D.VALORES)), p);
});
prueba('formas de juntar $5 con $1 y $2 son 3', function () {
  assert.deepStrictEqual(D.formas(5, [1, 2]).map(D.clave).sort(), ['1+1+1+1+1', '2+1+1+1', '2+2+1'].sort());
  assert.strictEqual(D.formas(2, [1]).length, 1);
});
prueba('la pregunta de la tarea: $20 con monedas de $2 → 10', function () {
  var it = M.ronda(1, 2, AZ.crear(1), true)[0];
  assert.strictEqual(it.tipo, 'cuantas'); assert.strictEqual(it.X, 20); assert.strictEqual(it.esperado, 10);
  assert.strictEqual(M.clasificar(it, 10), null);
  assert.strictEqual(M.clasificar(it, 20), 'CUENTA_PESOS');
  assert.strictEqual(M.clasificar(it, 9), 'CUENTA_POR_UNO');
  assert.strictEqual(D.suma(it.ayuda.lista), 20);
});
prueba('1000 ítems por nivel, salto y tipo: respuesta correcta, dentro de la recta y la ayuda llega a la respuesta', function () {
  var az = AZ.crear(12345);
  [1, 2, 3].forEach(function (nivel) {
    M.SALTOS.forEach(function (s) {
      M.tipos(nivel).forEach(function (t) {
        for (var i = 0; i < 1000; i++) {
          var it = M.generar(nivel, s, az, t), ctx = nivel + '/' + s + '/' + t + ' ' + it.clave;
          assert.strictEqual(M.clasificar(it, it.esperado), null, ctx);
          if (t !== 'quien') {
            assert.ok(it.esperado > 0 && it.esperado <= 99, ctx + ' esperado ' + it.esperado);
            var fin = it.ayuda.inicio + D.suma(it.ayuda.lista);
            assert.ok(fin <= M.MAX[s], ctx + ' la ayuda se sale de la recta');
            if (t === 'cuantas') assert.strictEqual(it.ayuda.lista.length, it.esperado, ctx);
            if (t === 'cuanto' || t === 'seguir') assert.strictEqual(fin, it.esperado, ctx);
            if (t === 'falta') { assert.strictEqual(fin, it.total, ctx); assert.strictEqual(D.suma(it.tiene) + it.esperado, it.total, ctx); }
            if (t === 'seguir' && nivel < 3) assert.strictEqual(it.serie[0] % s, 0, ctx);
          } else {
            var tot = it.grupos.map(function (g) { return D.suma(g.lista); });
            assert.notStrictEqual(tot[0], tot[1], ctx + ' empate');
            assert.notStrictEqual(it.grupos[0].lista.length, it.grupos[1].lista.length, ctx);
            var mas = it.grupos[tot[0] > tot[1] ? 0 : 1], otro = it.grupos[tot[0] > tot[1] ? 1 : 0];
            assert.strictEqual(it.esperado, mas.nombre, ctx);
            assert.strictEqual(it.trampa, mas.lista.length < otro.lista.length, ctx + ' trampa mal marcada');
            if (it.trampa) assert.strictEqual(M.clasificar(it, otro.nombre), 'CUENTA_MONEDAS', ctx);
          }
        }
      });
    });
  });
});
prueba('nivel 3: "seguí contando" a veces arranca fuera de la tabla (3, 5, 7…)', function () {
  var az = AZ.crear(7), fuera = 0;
  for (var i = 0; i < 200; i++) { var it = M.generar(3, 2, az, 'seguir'); if (it.serie[0] % 2) fuera++; }
  assert.ok(fuera > 50 && fuera < 150, 'fuera de la tabla: ' + fuera);
});
prueba('errores con nombre: el que cuenta monedas en vez de plata', function () {
  var it = M.generar(1, 2, AZ.crear(3), 'cuanto');
  assert.strictEqual(M.clasificar(it, it.n), 'CUENTA_MONEDAS');
  assert.strictEqual(M.clasificar(it, it.esperado + 2), 'SALTO_DE_MAS');
  var s = M.generar(1, 2, AZ.crear(4), 'seguir');
  assert.strictEqual(M.clasificar(s, s.serie[2] + 1), 'DE_A_UNO');
  var f = M.generar(2, 5, AZ.crear(5), 'falta');
  assert.strictEqual(M.clasificar(f, f.total), 'PONE_TOTAL');
  Object.keys(M.ERRORES).forEach(function (c) { assert.ok(/^[A-Z_]+$/.test(c), c); });
});
prueba('ronda: 8 ítems, sin repetidos y con todos los tipos del nivel', function () {
  [1, 2, 3].forEach(function (nivel) {
    M.SALTOS.forEach(function (s) {
      for (var k = 0; k < 200; k++) {
        var r = M.ronda(nivel, s, AZ.crear(k * 31 + nivel), k === 0), claves = {};
        assert.strictEqual(r.length, M.TAM_RONDA);
        M.tipos(nivel).forEach(function (t) { assert.ok(r.some(function (x) { return x.tipo === t; }), nivel + '/' + s + ' falta ' + t); });
        r.forEach(function (x) { claves[x.clave] = (claves[x.clave] || 0) + 1; });
        assert.ok(Object.keys(claves).length >= M.TAM_RONDA - 1, 'demasiados repetidos ' + JSON.stringify(claves));
      }
    });
  });
});
prueba('el registro tiene un nombre para cada código de error', function () {
  var src = require('fs').readFileSync(path.join(RAIZ, 'actividades/registro.js'), 'utf8'), i = src.indexOf("id:'1ro-monedas'"), tramo = src.slice(i, src.indexOf('stats:', i));
  Object.keys(M.ERRORES).concat(['TE_PASAS']).forEach(function (c) { assert.ok(tramo.indexOf(c + ':') >= 0, c + ' no está en registro.js'); });
});
console.log('\n' + (n - fallos) + ' de ' + n + ' pruebas pasaron');
process.exit(fallos ? 1 : 0);
