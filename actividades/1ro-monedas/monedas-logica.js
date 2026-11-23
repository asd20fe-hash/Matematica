/* Saltos con monedas (1ro) — lógica pura del Desafío. window.MONEDAS1 (UMD: también require en node).
   Versión 1.1.0 (2026-11-23). Generador de preguntas, ronda y clasificador de errores; sin DOM.
   v1.1.0: MENOS (qué billetes y monedas hay según hasta dónde llega) y objetivoMenos (número para llegar con la menor
   cantidad: nunca un valor que sea una sola pieza y con al menos 3 piezas en la mejor forma, para que haya que pensar).
   Tipos: cuantas (¿cuántas monedas de $s para $X?), cuanto (tengo n monedas de $s, ¿cuánta plata?), seguir (seguí contando
   de a s), falta ($2 + $2 + __ = $8) y quien (¿quién tiene más plata?, con la trampa de más monedas pero menos plata).
   Cada ítem trae su ayuda como saltos: {inicio, lista, desde?} (la ayuda nunca da la respuesta en seco, la muestra saltando). */
(function (root, fabrica) {
  'use strict';
  var M = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = M; else root.MONEDAS1 = M;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var M = {};
  M.SALTOS = [2, 5, 10];
  M.MAX = { 2: 20, 5: 30, 10: 50 };          // hasta dónde llega la recta según el salto
  M.TAM_RONDA = 8;
  M.NOMBRES = [['Luna', '👧'], ['Santi', '👦'], ['Mora', '👧'], ['Tomi', '👦']];
  M.ERRORES = {
    CUENTA_MONEDAS: 'Contó las monedas como si cada una valiera $1 (no la plata)',
    CUENTA_PESOS: 'Dijo la plata en vez de cuántas monedas',
    DE_A_UNO: 'Siguió contando de a 1 en vez de saltar',
    SALTO_DE_MAS: 'Un salto de más o de menos',
    CUENTA_POR_UNO: 'Contó una moneda de más o de menos',
    PONE_TOTAL: 'Puso el total en vez de lo que falta',
    PONE_LO_QUE_TIENE: 'Puso lo que ya tenía en vez de lo que falta',
    NO_MINIMA: 'Llegó al número pero no con la menor cantidad de billetes y monedas',
    OTRO: 'Otra respuesta'
  };
  // "Con menos": hasta 20 con $1, $2, $5 y $10; hasta 50 suma el de $20; hasta 100 suma $50 y $100.
  M.MENOS = { 20: [1, 2, 5, 10], 50: [1, 2, 5, 10, 20], 100: [1, 2, 5, 10, 20, 50, 100] };
  M.minimo = function (x, valores) {
    var v = valores.slice().sort(function (a, b) { return b - a; }), out = [];
    v.forEach(function (c) { while (x >= c) { out.push(c); x -= c; } });
    return out;
  };
  M.objetivoMenos = function (hasta, az, anterior) {
    var val = M.MENOS[hasta], x, g = 0;
    do { x = az.entero(Math.max(6, Math.floor(hasta / 3)), hasta === 100 ? 99 : hasta); g++; }
    while ((x === anterior || val.indexOf(x) >= 0 || M.minimo(x, val).length < 3) && g < 100);
    return x;
  };
  M.tipos = function (nivel) { return nivel <= 1 ? ['cuantas', 'cuanto', 'seguir'] : ['cuantas', 'cuanto', 'seguir', 'falta', 'quien']; };
  var rep = function (v, n) { var l = []; for (var i = 0; i < n; i++) l.push(v); return l; };
  var nombre = function (v, n) { return v >= 10 ? (n === 1 ? 'billete' : 'billetes') + ' de $' + v : (n === 1 ? 'moneda' : 'monedas') + ' de $' + v; };
  M.nombre = nombre;

  // Un ítem. az = REF4_AZAR.crear(semilla). fijo: {X} para la pregunta de la tarea ($20 con monedas de $2).
  M.generar = function (nivel, s, az, tipo, fijo) {
    var MAX = M.MAX[s], maxN = Math.min(10, MAX / s), it = { tipo: tipo, s: s, nivel: nivel };
    if (tipo === 'cuantas') {
      var n = fijo && fijo.X ? fijo.X / s : az.entero(2, maxN);
      it.n = n; it.X = n * s; it.esperado = n;
      it.texto = '¿Cuántas ' + nombre(s, 2) + ' necesitás para pagar $' + it.X + '?';
      it.ayuda = { inicio: 0, lista: rep(s, n) };
    } else if (tipo === 'cuanto') {
      var n2 = az.entero(2, maxN);
      it.n = n2; it.esperado = n2 * s; it.monedas = rep(s, n2);
      it.texto = 'Tengo ' + n2 + ' ' + nombre(s, n2) + '. ¿Cuánta plata tengo?';
      it.ayuda = { inicio: 0, lista: rep(s, n2) };
    } else if (tipo === 'seguir') {
      // nivel 3: a veces arranca fuera de la tabla (3, 5, 7… o 4, 9, 14…), para que no memorice solo los pares
      var off = nivel >= 3 && az.prob(0.5) ? az.entero(1, s - 1) : 0;
      var st = az.entero(0, Math.floor((MAX - off) / s) - 3);
      it.serie = [0, 1, 2].map(function (k) { return off + (st + k) * s; });
      it.esperado = it.serie[2] + s;
      it.texto = 'Seguí contando de a ' + s + ': ' + it.serie.join(', ') + ', …';
      it.ayuda = { inicio: it.serie[0], lista: rep(s, 3) };
    } else if (tipo === 'falta') {
      var k = az.entero(1, 3), j = az.entero(1, 2);
      while ((k + j) * s > MAX) k--;
      it.tiene = rep(s, k); it.total = (k + j) * s; it.j = j; it.esperado = j * s;
      it.texto = rep('$' + s, k).join(' + ') + ' + __ = $' + it.total + '. ¿Cuánto falta?';
      it.ayuda = { inicio: 0, lista: rep(s, k + j), desde: k };
    } else if (tipo === 'quien') {
      var s2 = s === 10 ? az.elegir([2, 5]) : s, trampa = az.prob(0.65), na, nb, g = 0;
      // A: monedas de $1; B: menos monedas de $s2. Con trampa B tiene más plata aunque tenga menos monedas.
      do {
        na = az.entero(3, 8);
        nb = trampa ? az.entero(Math.floor(na / s2) + 1, na - 1) : az.entero(1, Math.max(1, Math.ceil(na / s2) - 1));
        g++;
      } while ((nb * s2 === na || nb >= na || nb < 1 || nb * s2 > M.MAX[s2] || (trampa && nb * s2 < na) || (!trampa && nb * s2 > na)) && g < 200);
      if (g >= 200) { na = 5; nb = 3; s2 = 2; trampa = true; }
      var par = az.mezclar(M.NOMBRES.slice()).slice(0, 2), A = { nombre: par[0][0], cara: par[0][1], lista: rep(1, na) }, B = { nombre: par[1][0], cara: par[1][1], lista: rep(s2, nb) };
      it.grupos = az.prob(0.5) ? [A, B] : [B, A];
      it.trampa = trampa; it.esperado = (na > nb * s2 ? A : B).nombre;
      it.texto = '¿Quién tiene más plata?';
      it.ayuda = { grupos: it.grupos.map(function (x) { return { nombre: x.nombre, inicio: 0, lista: x.lista }; }) };
    }
    it.clave = tipo + ':' + s + ':' + (it.X || it.n || (it.serie && it.serie[0]) || it.total || (it.grupos && it.grupos.map(function (x) { return x.lista.length + 'x' + x.lista[0]; }).join('/')));
    return it;
  };

  // Ronda de TAM_RONDA ítems con los tipos del nivel repartidos; sin dos iguales seguidos.
  // primera: arranca con la pregunta de la tarea ($20 con monedas de $2), si el salto es 2.
  M.ronda = function (nivel, s, az, primera) {
    var tipos = M.tipos(nivel), lista = [], usadas = {};
    if (primera && s === 2) { lista.push(M.generar(nivel, 2, az, 'cuantas', { X: 20 })); usadas[lista[0].clave] = 1; }
    var bolsa = [];
    while (lista.length + bolsa.length < M.TAM_RONDA) bolsa = bolsa.concat(az.mezclar(tipos.slice()));
    bolsa = bolsa.slice(0, M.TAM_RONDA - lista.length);
    bolsa.forEach(function (t) {
      var it, g = 0;
      do { it = M.generar(nivel, s, az, t); g++; } while (usadas[it.clave] && g < 20);
      usadas[it.clave] = 1; lista.push(it);
    });
    return lista;
  };

  // Código de error (null si está bien). resp: número (o nombre en "quien").
  M.clasificar = function (it, resp) {
    if (it.tipo === 'quien') {
      if (resp === it.esperado) return null;
      var g = it.grupos.filter(function (x) { return x.nombre === resp; })[0], o = it.grupos.filter(function (x) { return x.nombre !== resp; })[0];
      return g && o && g.lista.length > o.lista.length ? 'CUENTA_MONEDAS' : 'OTRO';
    }
    resp = Number(resp);
    if (resp === it.esperado) return null;
    var s = it.s, d = Math.abs(resp - it.esperado);
    if (it.tipo === 'cuantas') return resp === it.X ? 'CUENTA_PESOS' : (d === 1 ? 'CUENTA_POR_UNO' : 'OTRO');
    if (it.tipo === 'cuanto') return resp === it.n ? 'CUENTA_MONEDAS' : (d === s ? 'SALTO_DE_MAS' : (d === 1 ? 'CUENTA_POR_UNO' : 'OTRO'));
    if (it.tipo === 'seguir') return resp === it.serie[2] + 1 ? 'DE_A_UNO' : (d === s ? 'SALTO_DE_MAS' : 'OTRO');
    if (it.tipo === 'falta') return resp === it.total ? 'PONE_TOTAL' : (resp === it.j && it.j !== it.esperado ? 'CUENTA_MONEDAS' : (resp === it.total - it.esperado ? 'PONE_LO_QUE_TIENE' : (d === s ? 'SALTO_DE_MAS' : 'OTRO')));
    return 'OTRO';
  };
  return M;
});
