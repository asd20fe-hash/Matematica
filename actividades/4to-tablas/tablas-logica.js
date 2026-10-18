/* Tablas de multiplicar: orden de las preguntas, clasificación de errores, tiempos e historial (lógica pura, sin DOM).
   Patrón UMD sin módulos: window.REF4_TABLAS. */
(function (root) {
  'use strict';
  var TABLAS = [2, 3, 4, 5, 6, 7, 8, 9, 10], FACTORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var TIEMPOS = [15, 30, 60];          // segundos para memorizar
  var RAPIDA = 3000, LENTA = 6000;     // ms: rápida < 3 s, lenta ≥ 6 s
  var HIST_MAX = 12;                   // vueltas guardadas por tabla

  // Orden al azar de los factores (todos, o solo los de la lista).
  function orden(az, solo) { return az.mezclar(solo && solo.length ? solo.slice() : FACTORES.slice()); }

  function velocidad(ms) { return ms < RAPIDA ? 'rapida' : (ms < LENTA ? 'media' : 'lenta'); }

  /* Clasifica una respuesta incorrecta de t × q → {codigo, pista}. */
  function clasificar(t, q, v) {
    if (v === t + q) return { codigo: 'SUMO_EN_VEZ', pista: 'Ojo: ' + t + ' + ' + q + ' es ' + (t + q) + '. Acá multiplicás: ' + q + ' veces ' + t + '.' };
    if (q > 1 && (v === t * (q - 1) || v === t * (q + 1))) return { codigo: 'TABLA', pista: 'Te fuiste al vecino. Armalo desde ' + t + ' × ' + (q - 1) + ' = ' + t * (q - 1) + ', y le sumás ' + t + '.' };
    if (q === 10) return { codigo: 'TABLA', pista: 'Por 10 le agregás un 0: ' + t + ' → ' + t + '0.' };
    if (q === 1) return { codigo: 'TABLA', pista: 'Una vez ' + t + ' es ' + t + '.' };
    if (q === 5) return { codigo: 'TABLA', pista: t + ' × 5 es la mitad de ' + t + ' × 10 = ' + t * 10 + '.' };
    if (q === 2) return { codigo: 'TABLA', pista: t + ' × 2 es el doble de ' + t + ': ' + t + ' + ' + t + '.' };
    return { codigo: 'TABLA', pista: 'Armalo desde uno que sepas: ' + t + ' × ' + (q - 1) + ' = ' + t * (q - 1) + ', y le sumás ' + t + '.' };
  }

  /* resultados = [{q, ms, intentos, ok1}] (ms: hasta la primera respuesta). Resumen de la vuelta. */
  function resumir(resultados) {
    var n = resultados.length, ok1 = 0, tot = 0, lentas = [], mal = [];
    resultados.forEach(function (r) {
      if (r.ok1) ok1++; else mal.push(r.q);
      tot += r.ms;
      if (r.ok1 && velocidad(r.ms) === 'lenta') lentas.push(r.q);
    });
    return { n: n, ok1: ok1, pct: n ? Math.round(100 * ok1 / n) : 0, prom: n ? Math.round(tot / n) : 0, lentas: lentas, mal: mal,
             repasar: mal.concat(lentas).sort(function (a, b) { return a - b; }) };
  }

  /* Historial por tabla: {7: [{fecha, prom, pct, ms:{q:ms}, mal:[q]}, ...]} (lo último al final). */
  function guardar(hist, t, resultados, fecha) {
    var h = {}; for (var k in hist) h[k] = hist[k].slice();
    var s = resumir(resultados), ms = {};
    resultados.forEach(function (r) { ms[r.q] = r.ms; });
    var lista = h[t] || []; lista.push({ fecha: fecha, prom: s.prom, pct: s.pct, ms: ms, mal: s.mal, todas: resultados.length === FACTORES.length });
    if (lista.length > HIST_MAX) lista = lista.slice(-HIST_MAX);
    h[t] = lista;
    return h;
  }
  // Última vuelta completa de la tabla (o null) y el mejor promedio.
  function estadoTabla(hist, t) {
    var lista = (hist[t] || []).filter(function (x) { return x.todas; });
    if (!lista.length) return null;
    var ult = lista[lista.length - 1], mejor = Math.min.apply(null, lista.map(function (x) { return x.prom; }));
    var dominada = ult.pct === 100 && Object.keys(ult.ms).every(function (q) { return ult.ms[q] < RAPIDA; });
    return { ultima: ult, mejor: mejor, vueltas: lista.length, dominada: dominada };
  }
  function segundos(ms) { return (Math.round(ms / 100) / 10).toString().replace('.', ',') + ' s'; }

  var api = { TABLAS: TABLAS, FACTORES: FACTORES, TIEMPOS: TIEMPOS, RAPIDA: RAPIDA, LENTA: LENTA,
              orden: orden, velocidad: velocidad, clasificar: clasificar, resumir: resumir, guardar: guardar, estadoTabla: estadoTabla, segundos: segundos };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.REF4_TABLAS = api; }
})(typeof window !== 'undefined' ? window : this);
