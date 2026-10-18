/* Multiplicación paso a paso: generador, plan de pasos y validadores (lógica pura, sin DOM).
   La cuenta "parada" de la carpeta: se multiplica cifra por cifra desde las unidades, se anota y se lleva;
   con dos cifras en el multiplicador, la segunda fila empieza con un 0 y al final se suman las filas.
   El plan de pasos es fijo para cada cuenta; el estado es la lista de respuestas aceptadas (resp).
   Patrón UMD sin módulos: window.REF4_MULMOTOR. */
(function (root) {
  'use strict';

  /* ---------- niveles ----------
     1: 2-3 cifras × 1 cifra, todos los pasos (multiplico, sumo lo que me llevo, anoto, me llevo).
     2: 3-4 cifras × 1 cifra (a veces con un 0 en el medio), multiplico y sumo en un solo paso.
     3: 2-3 cifras × 2 cifras, la cuenta mental de cada columna, el 0 de la segunda fila y la suma; estimación.
     4: 3 cifras × 2 cifras como en la carpeta: se corrige al final con "Revisar mi cuenta". */
  var NIVELES = { 1: { la: [2, 3], lb: 1 }, 2: { la: [3, 4], lb: 1, cero: 0.3 }, 3: { la: [2, 3], lb: 2 }, 4: { la: [3, 3], lb: 2 } };
  var RONDA = { 1: 3, 2: 2, 3: 2, 4: 1 }, MAX_NIVEL = 4;
  var CONTROLES = ['ESTIMACION'];
  var LUGARES = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil'];

  function cifras(n) { return String(n).split('').reverse().map(Number); } // unidades primero
  function hecho(f, x) { return f + 'x' + x; }

  /* ---------- generador ----------
     pesos = REF4_EV.pesosHechos(...): {"7x8": 2}; las cifras de esos hechos salen el doble. */
  function generar(nivel, az, pesos) {
    var cfg = NIVELES[nivel], w = pesos || {};
    var ds = [2, 3, 4, 5, 6, 7, 8, 9];
    var pesoF = function (f) { var p = f >= 6 && f <= 8 ? 3 : 1; for (var k in w) if (+k.split('x')[0] === f) p += w[k]; return p; };
    for (var t = 0; t < 300; t++) {
      var la = az.entero(cfg.la[0], cfg.la[1]), a = 0, i, f1 = az.pesado(ds, ds.map(pesoF)), b = f1;
      for (i = 0; i < la; i++) {
        var lo = i === 0 ? 1 : 2, x = az.entero(lo, 9);
        if (w[hecho(f1, x)] === undefined && az.prob(0.25)) x = az.entero(lo, 9);   // segundo tiro: más chance a los hechos que fallan
        a = a * 10 + x;
      }
      if (cfg.cero && la >= 3 && az.prob(cfg.cero)) { var s = String(a).split(''), pos = az.entero(1, la - 2); s[pos] = '0'; a = +s.join(''); }
      if (cfg.lb === 2) b = az.pesado([1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 3, 3, 2, 2, 2, 2, 2, 2]) * 10 + f1;
      var plan = filas(a, b), lleva = plan.filas.some(function (F) { return F.cols.some(function (c) { return c.lleva > 0; }); });
      if (!lleva) continue;                                                           // tiene que haber reservas
      if (cfg.lb === 2 && plan.filas[1].cols.every(function (c) { return c.lleva === 0; }) && az.prob(0.6)) continue;
      return { a: a, b: b };
    }
    return nivel <= 2 ? { a: 347, b: 6 } : { a: 347, b: 26 };
  }

  /* ---------- la cuenta resuelta ---------- */
  function filas(a, b) {
    var A = cifras(a), B = cifras(b), out = { a: a, b: b, total: a * b, filas: [], suma: null };
    B.forEach(function (f, r) {
      var carry = 0, cols = [];
      A.forEach(function (x, i) {
        var p = x * f, t = p + carry, last = i === A.length - 1;
        cols.push({ i: i, x: x, f: f, p: p, entra: carry, t: t, last: last, anota: last ? t : t % 10, lleva: last ? 0 : Math.floor(t / 10) });
        carry = last ? 0 : Math.floor(t / 10);
      });
      out.filas.push({ r: r, f: f, cols: cols, valor: a * f * Math.pow(10, r), texto: String(a * f) + (r ? new Array(r + 1).join('0') : '') });
    });
    if (B.length > 1) {
      var K = Math.max.apply(null, out.filas.map(function (F) { return F.texto.length; })), carry = 0, sc = [];
      for (var k = 0; k < K; k++) {
        var digs = out.filas.map(function (F) { var s = F.texto; return k < s.length ? +s[s.length - 1 - k] : null; });
        var s = digs.reduce(function (x, y) { return x + (y || 0); }, 0) + carry, last = k === K - 1;
        sc.push({ k: k, digs: digs, entra: carry, s: s, last: last, anota: last ? s : s % 10, lleva: last ? 0 : Math.floor(s / 10) });
        carry = last ? 0 : Math.floor(s / 10);
      }
      out.suma = sc;
    }
    return out;
  }

  /* ---------- plan de pasos ---------- */
  function planDe(C, nivel) {
    var P = [];
    if (nivel >= 3) P.push({ tipo: 'estimacion', esp: String(C.total).length });
    C.filas.forEach(function (F) {
      if (F.r > 0) P.push({ tipo: 'cero', fila: F.r, col: 0, esp: 0 });
      F.cols.forEach(function (c) {
        var base = { fila: F.r, col: c.i, c: c };
        var paso = function (tipo, esp, extra) { var o = { tipo: tipo, esp: esp }; for (var k in base) o[k] = base[k]; for (k in extra) o[k] = extra[k]; P.push(o); };
        if (nivel === 1) { paso('mult', c.p); if (c.entra) paso('sumo', c.t); }
        else if (nivel === 2) paso('columna', c.t);
        if (nivel <= 2) { if (!c.last) { paso('anoto', c.anota); paso('llevo', c.lleva); } else paso('anoto', c.anota, { auto: true }); }
        else { paso('anoto', c.anota); if (!c.last) paso('llevo', c.lleva); }
      });
    });
    if (C.suma) C.suma.forEach(function (s) { P.push({ tipo: 'suma', col: s.k, s: s, esp: s.anota }); });
    return P;
  }

  function crear(cfg) {
    var C = filas(cfg.a, cfg.b);
    return { a: cfg.a, b: cfg.b, nivel: cfg.nivel, dif: cfg.nivel === 4, C: C, plan: planDe(C, cfg.nivel), resp: [], intentos: {}, revisado: false };
  }

  /* ---------- estado ---------- */
  function actual(M) {
    if (M.resp.length < M.plan.length) {
      var p = M.plan[M.resp.length];
      if (p.auto) return actual(autoAnotar(M));
      return p;
    }
    if (M.dif && !M.revisado) return { tipo: 'revision' };
    return null;
  }
  // En los niveles 1 y 2 la última cifra de cada fila se anota sola (es el número que ya calculó).
  function autoAnotar(M) { var p = M.plan[M.resp.length]; M.resp.push({ k: M.resp.length, valor: p.esp, ok: true, auto: true }); return M; }
  function terminada(M) { return actual(M) === null; }

  /* ---------- pistas y clasificación ---------- */
  var PISTAS = {
    TABLA: 'Armalo desde el anterior: {f} × {x1} = {prev}, y le sumás {f}.',
    RESERVA_SUMO: 'Sumale lo que te llevaste: {p} + {e}.',
    RESERVA_OLVIDO: 'No te olvides de sumar lo que te llevaste: {e}.',
    ANOTO_TODO: '{t} no entra en un solo lugar: anotás el {u} y te llevás {l}.',
    ANOTO: 'De {t} anotás las unidades, el {u}. Las decenas te las llevás.',
    LLEVO: 'De {t} te llevás las decenas: {l}. El {u} ya lo anotaste.',
    ULTIMA: 'Es la última cifra: no queda adónde llevar, así que anotás el {t} entero.',
    CERO: 'Ahora multiplicás por las decenas: {f} decenas son {f0}. En las unidades va un 0.',
    SUMA: 'Sumá la columna de las {lugar}: {det}.',
    ESTIMACION: '{a} × 10 = {a10} y {a} × 100 = {a100}. ¿{a} × {b} está más cerca de cuál?',
    ESTIMACION1: '{a} × 10 = {a10}. ¿{a} × {b} es más o menos que eso?',
    OTRO: 'Revisalo con calma y probá de nuevo.'
  };
  function fmt(t, c) { return t.replace(/\{(\w+)\}/g, function (m, k) { return c[k] !== undefined ? c[k] : m; }); }
  function ctxPista(M, p) {
    var c = { a: M.a, b: M.b, a10: M.a * 10, a100: M.a * 100 };
    if (p.c) { var q = p.c; c.f = q.f; c.x = q.x; c.p = q.p; c.e = q.entra; c.t = q.t; c.u = q.t % 10; c.l = Math.floor(q.t / 10); c.x1 = q.x - 1; c.prev = q.f * (q.x - 1); }
    if (p.tipo === 'cero') { c.f = M.C.filas[p.fila].f; c.f0 = c.f * 10; }
    if (p.s) { c.lugar = LUGARES[p.col]; c.det = p.s.digs.filter(function (d) { return d !== null; }).join(' + ') + (p.s.entra ? ' + ' + p.s.entra + ' (lo que te llevaste)' : ''); }
    return c;
  }
  function pistaTabla(c) { return c.x >= 2 ? fmt(PISTAS.TABLA, c) : 'Mirá la tabla: ' + c.f + ' × ' + c.x + '.'; }

  // Clasifica una respuesta incorrecta y devuelve {codigo, pista}.
  function clasificar(M, p, v) {
    var c = ctxPista(M, p), q = p.c;
    switch (p.tipo) {
      case 'estimacion': return { codigo: 'ESTIMACION', pista: fmt(PISTAS.ESTIMACION, c) };
      case 'mult': return { codigo: 'TABLA', pista: pistaTabla(c) };
      case 'sumo': return { codigo: 'RESERVA', pista: fmt(PISTAS.RESERVA_SUMO, c) };
      case 'columna':
        if (q.entra && v === q.p) return { codigo: 'RESERVA', pista: fmt(PISTAS.RESERVA_OLVIDO, c) };
        return { codigo: 'TABLA', pista: 'Primero ' + q.f + ' × ' + q.x + (q.entra ? ', y después sumale ' + q.entra + '.' : '.') };
      case 'anoto':
        if (q.last) {
          if (q.t > 9 && v === q.t % 10) return { codigo: 'RESERVA', pista: fmt(PISTAS.ULTIMA, c) };
          if (q.entra && v === q.p) return { codigo: 'RESERVA', pista: fmt(PISTAS.RESERVA_OLVIDO, c) };
          return { codigo: 'TABLA', pista: 'Revisá: ' + q.f + ' × ' + q.x + (q.entra ? ', y sumale ' + q.entra + '.' : '.') };
        }
        if (q.t > 9 && v === q.t) return { codigo: 'ANOTO_TODO', pista: fmt(PISTAS.ANOTO_TODO, c) };
        if (M.nivel <= 2) return { codigo: 'RESERVA', pista: fmt(PISTAS.ANOTO, c) };
        if (q.entra && v === q.p % 10) return { codigo: 'RESERVA', pista: fmt(PISTAS.RESERVA_OLVIDO, c) };
        if (q.t > 9 && v === Math.floor(q.t / 10)) return { codigo: 'RESERVA', pista: fmt(PISTAS.ANOTO, c) };
        return { codigo: 'TABLA', pista: 'Revisá: ' + q.f + ' × ' + q.x + (q.entra ? ', y sumale ' + q.entra + ' que te llevaste.' : '.') };
      case 'llevo': return { codigo: 'RESERVA', pista: fmt(PISTAS.LLEVO, c) };
      case 'cero': return { codigo: 'CERO_OMITIDO', pista: fmt(PISTAS.CERO, c) };
      case 'suma':
        if (p.s.entra && v === (p.s.s - p.s.entra) % 10) return { codigo: 'RESERVA', pista: fmt(PISTAS.RESERVA_OLVIDO, { e: p.s.entra }) };
        if (p.s.last && p.s.s > 9 && v === p.s.s % 10) return { codigo: 'RESERVA', pista: fmt(PISTAS.ULTIMA, { t: p.s.s }) };
        return { codigo: 'SUMA', pista: fmt(PISTAS.SUMA, c) };
    }
    return { codigo: 'OTRO', pista: PISTAS.OTRO };
  }

  function hechoDe(M, p) { return (p.tipo === 'mult' || p.tipo === 'columna' || p.tipo === 'anoto') && p.c && p.c.f >= 2 && p.c.x >= 2 ? hecho(p.c.f, p.c.x) : null; }
  function eventoPaso(M, p, intento, valor, ok, codigo) {
    var item = { a: M.a, d: M.b }, h = hechoDe(M, p); if (h) item.hecho = h;
    return { tipo: 'paso', paso: p.tipo, fila: p.fila === undefined ? null : p.fila, col: p.col === undefined ? null : p.col,
             intento: intento, item: item, esperado: String(p.esp), respuesta: String(valor), ok: ok, error: codigo || null };
  }

  /* responder(M, valor) → {ok, silencioso, codigo, pista, eventos:[...], terminada} */
  function responder(M, valor) {
    var p = actual(M);
    if (!p || p.tipo === 'revision') return { ok: false, eventos: [], pista: null };
    var k = M.resp.length, intento = (M.intentos[k] || 0) + 1; M.intentos[k] = intento;
    var ok = valor === p.esp, info = ok ? null : clasificar(M, p, valor), cod = info ? info.codigo : null;
    var ev = [eventoPaso(M, p, intento, valor, ok, cod)];
    if (M.dif) {   // modo carpeta: se anota todo y se corrige al final
      M.resp.push({ k: k, valor: valor, ok: ok, codigo: cod, pista: info ? info.pista : null });
      return { ok: true, silencioso: true, eventos: ev, terminada: false };
    }
    if (!ok) return { ok: false, codigo: cod, pista: info.pista, eventos: ev, terminada: false };
    M.resp.push({ k: k, valor: valor, ok: true });
    var sig = actual(M);
    return { ok: true, eventos: ev, terminada: sig === null };
  }

  /* ---------- revisión del nivel 4 ---------- */
  function revisar(M) {
    if (!actual(M) || actual(M).tipo !== 'revision') return { ok: false };
    for (var k = 0; k < M.resp.length; k++) if (!M.resp[k].ok) {
      var p = M.plan[k];
      return { ok: false, error: { indice: k, tipo: p.tipo, fila: p.fila, col: p.col, codigo: M.resp[k].codigo, pista: M.resp[k].pista } };
    }
    M.revisado = true;
    return { ok: true, terminada: true };
  }
  function corregir(M, indice) { M.resp.length = indice; }

  /* ---------- textos ---------- */
  function nombreFila(M, r) { return M.C.filas.length > 1 ? (r === 0 ? 'primera fila' : 'segunda fila') : ''; }
  function pregunta(M) {
    var p = actual(M); if (!p) return '¡Cuenta terminada!';
    var q = p.c;
    switch (p.tipo) {
      case 'estimacion': return '¿Cuántas cifras va a tener el resultado?';
      case 'mult': return '¿Cuánto da ' + q.f + ' × ' + q.x + '?';
      case 'sumo': return 'Sumale lo que te llevaste: ' + q.p + ' + ' + q.entra + ' = ?';
      case 'columna': return q.entra ? '¿Cuánto da ' + q.f + ' × ' + q.x + ' + ' + q.entra + '?' : '¿Cuánto da ' + q.f + ' × ' + q.x + '?';
      case 'anoto':
        if (M.nivel <= 2) return 'Te dio ' + q.t + '. ¿Qué anotás abajo?';
        return (q.last ? 'Última cifra: ' : '') + q.f + ' × ' + q.x + (q.entra ? ' + ' + q.entra : '') + '. ¿Qué anotás abajo?';
      case 'llevo': return M.nivel <= 2 ? 'Te dio ' + q.t + '. ¿Cuánto te llevás?' : '¿Cuánto te llevás?';
      case 'cero': return 'Segunda fila: multiplicás por las decenas. ¿Qué anotás en las unidades?';
      case 'suma': return 'Sumá las filas. Columna de las ' + LUGARES[p.col] + ': ¿qué anotás?';
      case 'revision': return 'Revisemos tu cuenta.';
    }
    return '';
  }
  function ayuda(M, explicita) {
    var p = actual(M); if (!p) return '';
    var c = ctxPista(M, p), q = p.c;
    switch (p.tipo) {
      case 'estimacion': return M.b > 9 ? fmt(PISTAS.ESTIMACION, c) : fmt(PISTAS.ESTIMACION1, c);
      case 'mult': return explicita ? q.f + ' × ' + q.x + ' = ' + q.p + '.' : pistaTabla(c);
      case 'sumo': return explicita ? q.p + ' + ' + q.entra + ' = ' + q.t + '.' : fmt(PISTAS.RESERVA_SUMO, c);
      case 'columna': return explicita ? q.f + ' × ' + q.x + ' = ' + q.p + (q.entra ? ', más ' + q.entra + ' que te llevaste: ' + q.t : '') + '.' : 'Multiplicá ' + q.f + ' × ' + q.x + (q.entra ? ' y sumale lo que te llevaste, ' + q.entra + '.' : '.');
      case 'anoto':
        if (q.last) return explicita ? 'Es la última: anotás ' + q.t + ' entero.' : 'Es la última cifra de la fila: anotás todo lo que te da.';
        return explicita ? q.f + ' × ' + q.x + (q.entra ? ' + ' + q.entra : '') + ' = ' + q.t + ': anotás el ' + q.anota + '.' : 'Anotás solo las unidades de lo que te da; las decenas te las llevás.';
      case 'llevo': return explicita ? 'De ' + q.t + ' te llevás ' + q.lleva + '.' : 'Te llevás las decenas de lo que te dio. Si no llega a 10, te llevás 0.';
      case 'cero': return fmt(PISTAS.CERO, c);
      case 'suma': return fmt(PISTAS.SUMA, c) + (explicita ? ' Da ' + p.s.s + (p.s.last ? '.' : ': anotás ' + p.s.anota + ' y te llevás ' + p.s.lleva + '.') : '');
      case 'revision': return 'Tocá "Revisar mi cuenta" para ver cómo te fue.';
    }
    return '';
  }

  var BARRA_NOMBRES = ['Multiplico', 'Sumo lo que llevo', 'Anoto', 'Me llevo'];
  var BARRA = { mult: 0, columna: 0, sumo: 1, anoto: 2, llevo: 3 };

  /* ---------- vista para dibujar la cuenta ----------
     Devuelve lo que hay escrito: reservas de la fila actual, cifras de cada fila, suma, slot activo y marcas. */
  function vista(M, buf, marca) {
    var p = actual(M), C = M.C, nf = C.filas.length;
    var filasTxt = C.filas.map(function () { return {}; }), suma = {}, reservas = {}, err = {};
    var filaAct = marca && marca.fila !== undefined ? marca.fila : (p && p.fila !== undefined ? p.fila : nf);   // fila cuyas reservas se ven
    M.resp.forEach(function (r) {
      var q = M.plan[r.k], v = String(r.valor), id = q.tipo + '@' + (q.fila === undefined ? '' : q.fila) + '@' + q.col;
      if (marca && marca.indice === r.k) err[id] = true;
      if (q.tipo === 'anoto' || q.tipo === 'cero') {
        var pos = q.tipo === 'cero' ? 0 : q.col + q.fila;
        if (q.tipo === 'anoto' && q.c.last) for (var j = 0; j < v.length; j++) filasTxt[q.fila][pos + v.length - 1 - j] = { d: v[j], err: err[id] };
        else filasTxt[q.fila][pos] = { d: v.slice(-1), err: err[id] };
      } else if (q.tipo === 'llevo') { if (q.fila === filaAct && (+r.valor > 0 || err[id])) reservas[q.col + 1] = { d: v, err: err[id] }; }
      else if (q.tipo === 'suma') {
        if (q.s.last) for (var m = 0; m < v.length; m++) suma[q.col + v.length - 1 - m] = { d: v[m], err: err[id] };
        else suma[q.col] = { d: v.slice(-1), err: err[id] };
      }
    });
    // reservas de la suma (se escriben solas, chiquitas, sobre la primera fila)
    var resSuma = {};
    if (C.suma && p && p.tipo === 'suma') C.suma.forEach(function (s) { if (s.k < p.col && s.lleva) resSuma[s.k + 1] = String(s.lleva); });
    var V = { a: String(M.a), b: String(M.b), filas: filasTxt, suma: C.suma ? suma : null, reservas: reservas, resSuma: resSuma,
              anchoCols: Math.max(String(C.total).length, String(M.a).length + 1, String(M.b).length + 1, C.filas[nf - 1].texto.length + (nf > 1 ? 1 : 0)),
              lenFilas: C.filas.map(function (F) { return F.texto.length; }), lenSuma: C.suma ? String(C.total).length : 0,
              terminada: p === null, total: String(C.total), activo: null, foco: null };
    if (p && p.c) V.foco = { fila: p.fila, colA: p.col, colB: p.fila };
    if (p && p.tipo === 'cero') V.foco = { fila: p.fila, colA: null, colB: p.fila };
    if (p && p.tipo === 'suma') V.foco = { suma: p.col };
    if (p) {
      var len = 1;
      if (p.tipo === 'anoto' && p.c.last) len = String(p.esp).length;
      if (p.tipo === 'suma' && p.s.last) len = String(p.esp).length;
      var zona = { anoto: 'fila', cero: 'fila', llevo: 'reserva', suma: 'suma' }[p.tipo];
      if (zona) V.activo = { zona: zona, fila: p.fila, col: zona === 'fila' ? (p.tipo === 'cero' ? 0 : p.col + p.fila) : (zona === 'reserva' ? p.col + 1 : p.col), len: len, buf: buf || '' };
    }
    return V;
  }
  // Cuentita del costado (niveles 1 y 2): lo que se calculó de cabeza en la columna actual.
  function borrador(M) {
    var p = actual(M); if (!p || !p.c || M.nivel > 2) return [];
    var out = [], q = p.c, k = M.resp.length - 1;
    while (k >= 0 && M.plan[k].c === q) {
      var t = M.plan[k].tipo;
      if (t === 'mult') out.unshift(q.f + ' × ' + q.x + ' = ' + q.p);
      if (t === 'sumo') out.push(q.p + ' + ' + q.entra + ' = ' + q.t);
      if (t === 'columna') out.unshift(q.f + ' × ' + q.x + (q.entra ? ' + ' + q.entra : '') + ' = ' + q.t);
      k--;
    }
    return out;
  }
  // Lo que se está calculando de cabeza en el paso actual ("7 × 6", "42 + 4"), o null.
  function cuentita(M) {
    var p = actual(M); if (!p || !p.c) return null; var q = p.c;
    if (p.tipo === 'mult') return q.f + ' × ' + q.x;
    if (p.tipo === 'sumo') return q.p + ' + ' + q.entra;
    if (p.tipo === 'columna') return q.f + ' × ' + q.x + (q.entra ? ' + ' + q.entra : '');
    return null;
  }
  function descripcion(M) { var p = actual(M); return p ? { paso: p.tipo, fila: p.fila, col: p.col, esperado: p.esp === undefined ? '' : String(p.esp) } : { paso: 'fin' }; }
  function esperadoTexto(M) { var p = actual(M); return p && p.esp !== undefined ? String(p.esp) : ''; }

  var api = { NIVELES: NIVELES, RONDA: RONDA, MAX_NIVEL: MAX_NIVEL, CONTROLES: CONTROLES, PISTAS: PISTAS, BARRA: BARRA, BARRA_NOMBRES: BARRA_NOMBRES,
              generar: generar, filas: filas, planDe: planDe, crear: crear, actual: actual, terminada: terminada, responder: responder, revisar: revisar,
              corregir: corregir, pregunta: pregunta, ayuda: ayuda, vista: vista, borrador: borrador, cuentita: cuentita, descripcion: descripcion, esperadoTexto: esperadoTexto,
              clasificar: clasificar, nombreFila: nombreFila, fmt: fmt };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.REF4_MULMOTOR = api; }
})(typeof window !== 'undefined' ? window : this);
