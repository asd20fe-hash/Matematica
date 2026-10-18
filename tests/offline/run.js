/* Modo sin conexión: controla que ARCHIVOS de sw.js tenga todos los archivos de la app (ni más ni menos).
   Se corre con: node tests/offline/run.js            (con --escribir rearma la lista dentro de sw.js)
   Entran index.html, perfiles.js, manifest.webmanifest y todo lo de core/ y actividades/ menos los .md. */
'use strict';
var fs = require('fs'), path = require('path'), assert = require('assert');
var RAIZ = path.join(__dirname, '..', '..'), SW = path.join(RAIZ, 'sw.js');
var INI = '  // ARCHIVOS (lista armada por tests/offline/run.js --escribir)', FIN = '  // fin de ARCHIVOS';

function recorrer(dir, out) {
  fs.readdirSync(path.join(RAIZ, dir)).forEach(function (n) {
    var rel = dir + '/' + n, st = fs.statSync(path.join(RAIZ, rel));
    if (st.isDirectory()) recorrer(rel, out); else if (!/\.md$/.test(n)) out.push(rel);
  });
  return out;
}
function archivos() {
  var l = ['index.html', 'perfiles.js', 'manifest.webmanifest'].concat(recorrer('core', []), recorrer('actividades', []));
  return l.sort();
}
function bloque(lista) {
  var grupos = {}, orden = [];
  lista.forEach(function (f) { var c = f.indexOf('/') < 0 ? '' : f.slice(0, f.lastIndexOf('/')); if (!grupos[c]) { grupos[c] = []; orden.push(c); } grupos[c].push(f); });
  return orden.map(function (c) { return '  ' + grupos[c].map(function (f) { return "'" + f + "'"; }).join(', ') + ','; }).join('\n');
}
function leer() {
  var s = fs.readFileSync(SW, 'utf8'), a = s.indexOf(INI), b = s.indexOf(FIN);
  assert.ok(a >= 0 && b > a, 'sw.js tiene que tener las marcas de ARCHIVOS');
  return { s: s, a: a, b: b, lista: (s.slice(a + INI.length, b).match(/'([^']+)'/g) || []).map(function (x) { return x.slice(1, -1); }) };
}

var hay = archivos();
if (process.argv.indexOf('--escribir') >= 0) {
  var r = leer(); fs.writeFileSync(SW, r.s.slice(0, r.a + INI.length) + '\n' + bloque(hay) + '\n' + r.s.slice(r.b));
  console.log('sw.js: ' + hay.length + ' archivos en ARCHIVOS');
}
var fallos = 0;
function prueba(nombre, fn) { try { fn(); console.log('  ok   ' + nombre); } catch (e) { fallos++; console.log('  FALLA ' + nombre + '\n         ' + e.message); } }
prueba('sw.js guarda todos los archivos de la app', function () {
  var l = leer().lista, falta = hay.filter(function (f) { return l.indexOf(f) < 0; }), sobra = l.filter(function (f) { return hay.indexOf(f) < 0; });
  assert.ok(!falta.length && !sobra.length, (falta.length ? 'faltan: ' + falta.join(', ') + '. ' : '') + (sobra.length ? 'sobran: ' + sobra.join(', ') + '. ' : '') + 'Correr node tests/offline/run.js --escribir');
});
prueba('sw.js no tiene errores de sintaxis', function () { new Function(fs.readFileSync(SW, 'utf8')); });
prueba('cada página tiene el core (que registra el service worker)', function () {
  hay.filter(function (f) { return /\.html$/.test(f); }).forEach(function (f) {
    assert.ok(/core\/core\.js/.test(fs.readFileSync(path.join(RAIZ, f), 'utf8')), f + ' no carga core.js');
  });
});
prueba('los recursos externos de las páginas están en EXTERNOS', function () {
  var s = fs.readFileSync(SW, 'utf8');
  hay.filter(function (f) { return /\.(html|js|css)$/.test(f); }).forEach(function (f) {
    (fs.readFileSync(path.join(RAIZ, f), 'utf8').match(/https:\/\/(cdnjs\.cloudflare\.com|fonts\.googleapis\.com\/css2)[^"' )]*/g) || []).forEach(function (u) {
      assert.ok(s.indexOf("'" + u + "'") >= 0, f + ' usa ' + u + ' y no está en EXTERNOS');
    });
  });
});
console.log('\n' + (4 - fallos) + ' de 4 pruebas pasaron');
process.exit(fallos ? 1 : 0);
