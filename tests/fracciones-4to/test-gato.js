'use strict';
var assert = require('assert');
var FR = require('../../actividades/_comun-4to/fracciones-lib.js'), AZ = require('../../actividades/_comun-4to/azar.js');
var G = require('../../actividades/4to-fracciones-gato/gato-logica.js');
var fr = FR.fr;

function cada(fn) {
  for (var nivel = 1; nivel <= 3; nivel++) G.tipos(nivel).forEach(function (tipo) {
    var az = AZ.crear(500 + nivel * 13 + tipo.length);
    for (var i = 0; i < 1000; i++) fn(G.generar(nivel, tipo, az), nivel, tipo);
  });
}

prueba('gato: con la misma semilla da los mismos ítems', function () {
  var a = AZ.crear(9), b = AZ.crear(9);
  for (var i = 0; i < 40; i++) { var t = G.tipos(3)[i % 6]; assert.strictEqual(JSON.stringify(G.generar(3, t, a)), JSON.stringify(G.generar(3, t, b))); }
});

prueba('gato: 1000 ítems por nivel y tipo, la respuesta esperada valida y las fichas están bien marcadas', function () {
  cada(function (it, nivel, tipo) {
    assert.strictEqual(it.tipo, tipo);
    if (tipo === 'come') {
      var buenas = it.fichas.filter(function (x) { return !x.codigo; });
      assert.ok(buenas.length >= 2, 'al menos 2 para comer (' + FR.formatear(it.objetivo) + ')');
      assert.ok(it.fichas.length > buenas.length, 'hay alguna para escupir');
      it.fichas.forEach(function (x, i) {
        assert.strictEqual(FR.iguales(x.f, it.objetivo), !x.codigo, FR.formatear(x.f) + ' vs ' + FR.formatear(it.objetivo));
        assert.ok(x.f.d >= 2 && x.f.n >= 1, 'ficha válida');
        it.fichas.forEach(function (y, j) { if (i !== j) assert.ok(!FR.identicas(x.f, y.f), 'fichas repetidas'); });
        assert.strictEqual(G.validarCome(it, i).ok, !x.codigo);
      });
      return;
    }
    assert.ok(it.texto && it.pregunta, 'tiene historia y pregunta');
    assert.ok(!/\{/.test(it.texto), 'sin marcas sin reemplazar');
    var r = it.modo === 'entero' ? it.esperado.n : it.esperado;
    var campos = null;
    if (tipo === 'mixto') { var m = FR.aMixto(it.f); campos = { entero: String(m.entero), num: String(m.n), den: String(m.d) }; assert.ok(m.entero >= 1 && m.n >= 1); }
    assert.ok(G.validar(it, r, campos).ok, tipo + ' nivel ' + nivel + ': ' + JSON.stringify(it.info));
    assert.ok(G.pista(it, 'CALCULO').length < 160, 'pista corta');
    assert.ok(G.mensaje(it).length > 0);
    if (tipo === 'entero') assert.ok(it.f.n % it.f.d === 0 && it.f.n <= 24);
    if (tipo === 'simple') { assert.notStrictEqual(it.den, it.f.d); assert.ok(FR.iguales(fr(it.esperado.n, it.den), it.f)); }
    if (tipo === 'queda') assert.ok(it.esperado.n > 0 && FR.iguales(FR.sumar(it.esperado, it.f), fr(it.total, 1)));
  });
});

prueba('gato: clasifica los errores típicos', function () {
  var it = { tipo: 'entero', f: fr(4, 4), esperado: fr(1, 1), unidad: 'horas' };
  assert.strictEqual(G.validar(it, 4).codigo, 'CUENTA_PARTES');
  it = { tipo: 'simple', f: fr(2, 4), den: 2, esperado: fr(1, 1) };
  assert.strictEqual(G.validar(it, 0).codigo, 'EQUIV_SUMA');      // 2 - 2 = 0
  assert.strictEqual(G.validar(it, 2).codigo, 'EQUIV_MAL_ESCALADA');
  it = { tipo: 'queda', f: fr(1, 4), total: 1, esperado: fr(3, 4), cosa: 'sandía' };
  assert.ok(G.validar(it, fr(6, 8)).ok, 'vale una equivalente');
  assert.strictEqual(G.validar(it, fr(1, 4)).codigo, 'RESPONDE_EL_DATO');
  assert.strictEqual(G.validar(it, fr(4, 3)).codigo, 'INVERTIDA');
  it = { tipo: 'junta', a: fr(1, 2), b: fr(2, 4), esperado: fr(1, 1) };
  assert.ok(G.validar(it, fr(4, 4)).ok);
  assert.strictEqual(G.validar(it, fr(3, 6)).codigo, 'OPERA_DENOMINADORES');
  it = { tipo: 'mixto', f: fr(7, 4), esperado: fr(7, 4) };
  assert.ok(G.validar(it, fr(7, 4), { entero: '1', num: '3', den: '4' }).ok);
  var v = G.validar(it, fr(7, 4), { entero: '', num: '7', den: '4' });
  assert.ok(!v.ok && v.igual, 'la fracción sin enteros vale lo mismo pero no es lo pedido');
});
