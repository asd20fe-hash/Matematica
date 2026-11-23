/* Rectas: paralelas, perpendiculares y oblicuas — lógica pura (sin DOM).
   Genera los ejercicios (recta dada + puntos) y corrige la recta que traza el chico.
   Patrón UMD sin módulos: window.REF4_RECTAS en el navegador, require en node.
   Unidades: las del tablero (el viewBox del SVG mide lo mismo que el tablero en pantalla al empezar cada ejercicio). */
(function (root) {
  'use strict';
  var TIPOS = ['paralela', 'perpendicular', 'oblicua'];
  var MAYUS = 'ABCDEFGHJKLMNPRSTUVWXYZ'.split('');   // sin I, O, Q
  // puntos: solo minúsculas que no se parecen a su mayúscula (c/C, s/S, p/P, x/X… se confunden en Fredoka) y sin i, l, o, j
  var MINUS = 'abdefghmnqrt'.split('');
  var TOL_ANG = 6, OBL_MIN = 15, OBL_MAX = 75, EPS = 1e-9;
  var SIMBOLO = { paralela: '//', perpendicular: '⊥', oblicua: '∠' };
  var D2R = Math.PI / 180;

  /* ---------- geometría ---------- */
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  // distancia de p a la recta infinita que pasa por a y b
  function distRecta(p, a, b) { var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / L; }
  function angulo(a, b) { return Math.atan2(b.y - a.y, b.x - a.x) / D2R; }
  // diferencia entre las direcciones de dos rectas, llevada a [0°, 90°]
  function difAng(a1, a2) { var d = Math.abs(a1 - a2) % 180; return d > 90 ? 180 - d : d; }
  // pie de la perpendicular de p sobre la recta ab
  function pie(p, a, b) { var dx = b.x - a.x, dy = b.y - a.y, t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1); return { x: a.x + t * dx, y: a.y + t * dy }; }
  // intersección de dos rectas infinitas (null si son paralelas)
  function cruce(a, b, c, d) {
    var r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y }, den = r.x * s.y - r.y * s.x;
    if (Math.abs(den) < 1e-9) return null;
    var t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den; return { x: a.x + t * r.x, y: a.y + t * r.y };
  }
  /* Recorta la recta que pasa por p con dirección ang (grados) al rectángulo [m, W-m] × [m, H-m].
     Devuelve {a, b} (a a la izquierda) o null si no lo cruza. */
  function recortar(p, ang, W, H, m) {
    m = m || 0;
    var dx = Math.cos(ang * D2R), dy = Math.sin(ang * D2R), t0 = -Infinity, t1 = Infinity;
    function lado(q, d, lo, hi) {
      if (Math.abs(d) < 1e-12) return q >= lo && q <= hi;
      var ta = (lo - q) / d, tb = (hi - q) / d; if (ta > tb) { var x = ta; ta = tb; tb = x; }
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); return t0 <= t1;
    }
    if (!lado(p.x, dx, m, W - m) || !lado(p.y, dy, m, H - m)) return null;
    var a = { x: p.x + t0 * dx, y: p.y + t0 * dy }, b = { x: p.x + t1 * dx, y: p.y + t1 * dy };
    return a.x <= b.x ? { a: a, b: b } : { a: b, b: a };
  }
  function adentro(p, W, H, m) { return p.x >= m && p.x <= W - m && p.y >= m && p.y <= H - m; }

  /* Clase de la dirección según la diferencia de ángulo d (0..90). */
  function claseDir(d) {
    if (d <= TOL_ANG + EPS) return 'paralela';
    if (Math.abs(d - 90) <= TOL_ANG + EPS) return 'perpendicular';
    if (d >= OBL_MIN - EPS && d <= OBL_MAX + EPS) return 'oblicua';
    return d < 45 ? 'casi-paralela' : 'casi-perpendicular';
  }

  /* ---------- niveles ----------
     1: recta dada casi acostada (−25°..25°), 1 punto que distrae.
     2: lo del plan: −40°..40° (75 %) o empinada ±55°..±80° (25 %), 2 puntos que distraen.
     3: empinada la mitad de las veces y 3 puntos que distraen. */
  var NIVELES = { 1: { empinada: 0, suave: 25, distractores: 1 }, 2: { empinada: 0.25, suave: 40, distractores: 2 }, 3: { empinada: 0.5, suave: 40, distractores: 3 } };

  /* Bolsa de tipos: se mezcla y se rellena al vaciarse. pesos {tipo: n} (opcional) repite el que más cuesta. */
  function bolsa(az, pesos) {
    var b = [];
    return {
      sacar: function () {
        if (!b.length) {
          TIPOS.forEach(function (t) { var n = Math.max(1, Math.min(3, (pesos && pesos[t]) || 1)); for (var i = 0; i < n; i++) b.push(t); });
          b = az.mezclar(b);
        }
        return b.pop();
      }
    };
  }

  /* Genera un ejercicio dentro de un tablero de W × H.
     opts: {nivel, tipo, usados:[letras mayúsculas a evitar]}. Devuelve
     {tipo, W, H, angRef, ref:{nombre, a, b, etiqueta}, nueva:{nombre}, objetivo:{nombre,x,y}, puntos:[{nombre,x,y,objetivo}], intentosGen} */
  function generar(az, W, H, opts) {
    opts = opts || {};
    var cfg = NIVELES[opts.nivel] || NIVELES[2], tipo = opts.tipo || az.elegir(TIPOS), ultimo = null;
    var menor = Math.min(W, H), dMin = 70, dMax = Math.max(dMin + 15, 0.32 * menor);
    for (var k = 1; k <= 200; k++) {
      var ang = az.prob(cfg.empinada) ? (az.prob(0.5) ? 1 : -1) * (55 + az.siguiente() * 25) : -cfg.suave + az.siguiente() * 2 * cfg.suave;
      ang = Math.round(ang * 10) / 10;
      var c = { x: W * (0.35 + az.siguiente() * 0.3), y: H * (0.38 + az.siguiente() * 0.24) };
      var seg = recortar(c, ang, W, H, 25); if (!seg || dist(seg.a, seg.b) < 120) continue;
      var a = seg.a, b = seg.b, ux = (b.x - a.x) / dist(a, b), uy = (b.y - a.y) / dist(a, b), nx = -uy, ny = ux;
      // punto objetivo: desde un pie sobre la recta dada, a una distancia dMin..dMax, de un lado al azar
      var t = 0.15 + az.siguiente() * 0.7, f = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      var lado = az.prob(0.5) ? 1 : -1, d = dMin + az.siguiente() * (dMax - dMin);
      var obj = { x: f.x + nx * d * lado, y: f.y + ny * d * lado };
      if (!adentro(obj, W, H, 55)) continue;
      if (tipo === 'perpendicular' && !adentro(f, W, H, 25)) continue;
      // la recta que se espera (para alejar a los distractores)
      var angResp = tipo === 'paralela' ? ang : (tipo === 'perpendicular' ? ang + 90 : null);
      var oResp = angResp === null ? null : { x: obj.x + Math.cos(angResp * D2R), y: obj.y + Math.sin(angResp * D2R) };
      var puntos = [obj], ok = true;
      for (var j = 0; j < cfg.distractores && ok; j++) {
        var p = null;
        for (var r = 0; r < 60 && !p; r++) {
          var q = { x: 55 + az.siguiente() * (W - 110), y: 55 + az.siguiente() * (H - 110) };
          if (distRecta(q, a, b) <= 45.5) continue;            // medio px de margen por el redondeo a 0,1
          if (puntos.some(function (o) { return dist(o, q) <= 110.5; })) continue;
          if (oResp && distRecta(q, obj, oResp) <= 40) continue;       // que no quede sobre la respuesta
          p = q;
        }
        if (p) puntos.push(p); else ok = false;
      }
      ultimo = k;
      if (!ok) continue;
      // nombres
      var evitar = opts.usados || [], may = az.mezclar(MAYUS.filter(function (l) { return evitar.indexOf(l) < 0; }));
      if (may.length < 2) may = az.mezclar(MAYUS.slice());
      var min = az.mezclar(MINUS.filter(function (l) { return l !== may[0].toLowerCase() && l !== may[1].toLowerCase(); }));   // ni la letra de una recta
      var pts = az.mezclar(puntos.map(function (p, i) { return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, objetivo: i === 0 }; }));
      pts.forEach(function (p, i) { p.nombre = min[i]; });
      var objetivo = pts.filter(function (p) { return p.objetivo; })[0];
      // etiqueta de la recta dada: cerca del extremo derecho, corrida hacia afuera
      var lx = b.x - ux * 22 + nx * 18, ly = b.y - uy * 22 + ny * 18;
      if (!adentro({ x: lx, y: ly }, W, H, 12)) { lx = b.x - ux * 22 - nx * 18; ly = b.y - uy * 22 - ny * 18; }
      return { tipo: tipo, nivel: opts.nivel || 2, W: W, H: H, angRef: ang, intentosGen: k,
               ref: { nombre: may[0], a: a, b: b, etiqueta: { x: lx, y: ly } }, nueva: { nombre: may[1] },
               objetivo: objetivo, puntos: pts, pie: f, dist: d };
    }
    throw new Error('rectas: no pude armar un ejercicio en ' + W + '×' + H + ' (último ' + ultimo + ')');
  }

  /* ---------- modo hoja ("fotocopia"): consignas encadenadas sobre un mismo tablero ----------
     Como la hoja de la escuela: "D ⊥ R por p", "E // R por q", "S // D por m"… La recta de referencia de los pasos
     encadenados es la que el chico trazó antes (la suya, no la ideal). Solo se encadena sobre paralelas y
     perpendiculares trazadas a R: la dirección de una oblicua del chico no se puede prever, y encadenar sobre una
     encadenada suma las torceduras (6° + 6°). El punto de un encadenado queda a 150 px como máximo (a lo largo de la
     referencia) del punto por el que pasa esa recta, así la tolerancia de 6° no lo acerca a menos de ~40 px.
     Nivel 1: 3 pasos (2 sobre R y 1 encadenado); 2 y 3: 4 pasos (2 y 2) y 1 o 2 puntos de más. */
  var HOJA = { 1: { pasos: 3, extra: 0 }, 2: { pasos: 4, extra: 1 }, 3: { pasos: 4, extra: 2 } };
  var SEP_HOJA = 95, LEJOS_REF = 45.5, LEJOS_HIJA = 58;   // separación entre puntos; distancia de un punto a R y a las rectas que traza el chico

  /* Qué se pide en cada paso: tipo y referencia (-1 = R, j = la recta del paso j). Sin geometría. */
  function planHoja(az, n, tipoExtra) {
    var tipos = az.mezclar(TIPOS.slice()); while (tipos.length < n) tipos.push(tipoExtra || az.elegir(TIPOS));
    tipos = az.mezclar(tipos);
    var k = tipos.indexOf(tipos.filter(function (t) { return t !== 'oblicua'; })[0]), x = tipos[0]; tipos[0] = tipos[k]; tipos[k] = x;   // el primero sirve de referencia
    var pasos = [], usadas = {};
    tipos.forEach(function (t, i) {
      var ref = -1;
      if (i >= 2) {   // encadenado: la recta no oblicua más nueva (trazada a R) que todavía no fue referencia (si no, la más nueva)
        var cand = pasos.map(function (p, j) { return j; }).filter(function (j) { return pasos[j].tipo !== 'oblicua' && pasos[j].ref < 0; }).reverse();
        ref = cand.filter(function (j) { return !usadas[j]; })[0]; if (ref === undefined) ref = cand[0];
        usadas[ref] = 1;
      }
      pasos.push({ tipo: t, ref: ref });
    });
    return pasos;
  }

  /* Genera una hoja en W × H. opts: {nivel, tipoExtra}. Devuelve
     {modo:'hoja', W, H, nivel, angRef, ref:{nombre,a,b,etiqueta}, puntos:[{nombre,x,y}],
      pasos:[{tipo, ref, refNombre, nueva:{nombre}, objetivo:{nombre,x,y}, ideal:{a,b}|null}], intentosGen} */
  function generarHoja(az, W, H, opts) {
    opts = opts || {};
    var nivel = HOJA[opts.nivel] ? opts.nivel : 2, cfg = NIVELES[nivel], hc = HOJA[nivel];
    var menor = Math.min(W, H), dMin = 70, dMax = Math.max(dMin + 15, 0.3 * menor);
    // en un tablero chico (celular acostado) primero se sacan los puntos de más y después un paso
    var h = armar(hc.pasos, hc.extra, 150) || armar(hc.pasos, 0, 150) || armar(3, 0, 400);
    if (!h) throw new Error('rectas: no pude armar una hoja en ' + W + '×' + H);
    h.recortada = h.pasos.length < hc.pasos || h.puntos.length < hc.pasos + hc.extra;
    return h;
    function armar(nPasos, nExtra, maxK) {
    for (var k = 1; k <= maxK; k++) {
      var plan = planHoja(az, nPasos, opts.tipoExtra);
      var ang = az.prob(cfg.empinada) ? (az.prob(0.5) ? 1 : -1) * (55 + az.siguiente() * 25) : -cfg.suave + az.siguiente() * 2 * cfg.suave;
      ang = Math.round(ang * 10) / 10;
      var c = { x: W * (0.35 + az.siguiente() * 0.3), y: H * (0.38 + az.siguiente() * 0.24) };
      var segR = recortar(c, ang, W, H, 25); if (!segR || dist(segR.a, segR.b) < 120) continue;
      // rectas conocidas: R y las ideales de los pasos no oblicuos ({p, ang, hija})
      var rectas = [{ p: c, ang: ang, hija: false }], ideales = [], puntos = [], ok = true;
      for (var i = 0; i < plan.length && ok; i++) {
        var P = plan[i], base = P.ref < 0 ? rectas[0] : ideales[P.ref];
        var seg = recortar(base.p, base.ang, W, H, P.ref < 0 ? 25 : 40), obj = null, angN = null;
        if (!seg) { ok = false; break; }
        var L = dist(seg.a, seg.b), ux = (seg.b.x - seg.a.x) / L, uy = (seg.b.y - seg.a.y) / L;
        for (var r = 0; r < 50 && !obj; r++) {
          var t = 0.12 + az.siguiente() * 0.76, f = { x: seg.a.x + (seg.b.x - seg.a.x) * t, y: seg.a.y + (seg.b.y - seg.a.y) * t };
          if (P.ref >= 0) { var sp = -150 + az.siguiente() * 300; f = { x: base.p.x + ux * sp, y: base.p.y + uy * sp }; if (!adentro(f, W, H, 40)) continue; }
          var lado = az.prob(0.5) ? 1 : -1, d = dMin + az.siguiente() * (dMax - dMin);
          var q = { x: f.x - uy * d * lado, y: f.y + ux * d * lado };
          if (!adentro(q, W, H, 50)) continue;
          if (P.tipo === 'perpendicular' && !adentro(f, W, H, P.ref < 0 ? 25 : 40)) continue;
          if (puntos.some(function (o) { return dist(o, q) <= SEP_HOJA; })) continue;
          if (rectas.some(function (R) { return distRecta(q, R.p, { x: R.p.x + Math.cos(R.ang * D2R), y: R.p.y + Math.sin(R.ang * D2R) }) <= (R.hija ? LEJOS_HIJA : LEJOS_REF); })) continue;
          var an = P.tipo === 'oblicua' ? null : base.ang + (P.tipo === 'perpendicular' ? 90 : 0);
          if (an !== null) {
            var q2 = { x: q.x + Math.cos(an * D2R), y: q.y + Math.sin(an * D2R) };
            if (puntos.some(function (o) { return distRecta(o, q, q2) <= 40; })) continue;   // la respuesta no pasa por otro punto
          }
          obj = q; angN = an;
        }
        if (!obj) { ok = false; break; }
        puntos.push(obj);
        ideales.push(angN === null ? null : { p: obj, ang: angN });
        if (angN !== null) rectas.push({ p: obj, ang: angN, hija: true });
      }
      if (!ok) continue;
      var nObj = puntos.length;
      for (var j = 0; j < nExtra && ok; j++) {
        var p = null;
        for (var r2 = 0; r2 < 60 && !p; r2++) {
          var q3 = { x: 50 + az.siguiente() * (W - 100), y: 50 + az.siguiente() * (H - 100) };
          if (puntos.some(function (o) { return dist(o, q3) <= SEP_HOJA; })) continue;
          if (rectas.some(function (R) { return distRecta(q3, R.p, { x: R.p.x + Math.cos(R.ang * D2R), y: R.p.y + Math.sin(R.ang * D2R) }) <= (R.hija ? LEJOS_HIJA : LEJOS_REF); })) continue;
          p = q3;
        }
        if (p) puntos.push(p); else ok = false;
      }
      if (!ok) continue;
      // nombres: R y una mayúscula por paso; los puntos, minúsculas que no repiten la letra de ninguna recta
      var may = az.mezclar(MAYUS.slice()).slice(0, plan.length + 1), bajas = may.map(function (l) { return l.toLowerCase(); });
      var min = az.mezclar(MINUS.filter(function (l) { return bajas.indexOf(l) < 0; }));
      var pts = puntos.map(function (q, i) { return { x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10, i: i }; });
      az.mezclar(pts.slice()).forEach(function (q, i) { q.nombre = min[i]; });   // letras al azar, sin que el orden delate cuál es cuál
      var a = segR.a, b = segR.b, uxR = (b.x - a.x) / dist(a, b), uyR = (b.y - a.y) / dist(a, b);
      var lx = b.x - uxR * 22 - uyR * 18, ly = b.y - uyR * 22 + uxR * 18;
      if (!adentro({ x: lx, y: ly }, W, H, 12)) { lx = b.x - uxR * 22 + uyR * 18; ly = b.y - uyR * 22 - uxR * 18; }
      var pasos = plan.map(function (P, i) {
        var o = pts[i], id = ideales[i];
        return { tipo: P.tipo, ref: P.ref, refNombre: P.ref < 0 ? may[0] : may[P.ref + 1], nueva: { nombre: may[i + 1] }, objetivo: { nombre: o.nombre, x: o.x, y: o.y },
                 ideal: id ? { a: { x: o.x - Math.cos(id.ang * D2R) * 80, y: o.y - Math.sin(id.ang * D2R) * 80 }, b: { x: o.x + Math.cos(id.ang * D2R) * 80, y: o.y + Math.sin(id.ang * D2R) * 80 } } : null };
      });
      var lista = pts.map(function (q) { return { nombre: q.nombre, x: q.x, y: q.y }; });
      return { modo: 'hoja', W: W, H: H, nivel: nivel, angRef: ang, intentosGen: k, nObjetivos: nObj,
               ref: { nombre: may[0], a: a, b: b, etiqueta: { x: lx, y: ly } }, puntos: az.mezclar(lista), pasos: pasos };
    }
    return null;
    }
  }

  /* El ejercicio del paso i de una hoja, con la forma que usa comprobar(), guia() y solucion().
     lineas[j] = la recta {a,b} que trazó el chico en el paso j (la referencia de los encadenados). */
  function pasoHoja(h, i, lineas) {
    var P = h.pasos[i], ref, angRef;
    if (P.ref < 0) { ref = { nombre: h.ref.nombre, a: h.ref.a, b: h.ref.b }; angRef = h.angRef; }
    else {
      var L = lineas[P.ref]; angRef = angulo(L.a, L.b);
      var s = recortar({ x: (L.a.x + L.b.x) / 2, y: (L.a.y + L.b.y) / 2 }, angRef, h.W, h.H, 0) || { a: L.a, b: L.b };
      ref = { nombre: P.refNombre, a: s.a, b: s.b };
    }
    return { modo: 'hoja', paso: i, tipo: P.tipo, nivel: h.nivel, W: h.W, H: h.H, angRef: angRef, ref: ref, nueva: { nombre: P.nueva.nombre }, encadenada: P.ref >= 0,
             objetivo: { nombre: P.objetivo.nombre, x: P.objetivo.x, y: P.objetivo.y, objetivo: true },
             puntos: h.puntos.map(function (p) { return { nombre: p.nombre, x: p.x, y: p.y, objetivo: p.nombre === P.objetivo.nombre }; }) };
  }
  /* "D ⊥ R por p": la consigna con el símbolo, como en la fotocopia. */
  function consignaHoja(P) { return P.nueva.nombre + ' ' + SIMBOLO[P.tipo] + ' ' + P.refNombre + ' por ' + P.objetivo.nombre; }

  /* ---------- corrección ----------
     linea = {a:{x,y}, b:{x,y}} (la del chico); tolDist en unidades del tablero (12 px de pantalla).
     Devuelve {ok, dirOk, puntoOk, d, distancia, trazada, puntoTocado, error, msgDir, msgPunto}. */
  function comprobar(ej, linea, tolDist) {
    if (tolDist === undefined) tolDist = 12;
    var R = ej.ref.nombre, c = ej.objetivo.nombre, tipo = ej.tipo;
    var d = difAng(ej.angRef, angulo(linea.a, linea.b)), distancia = distRecta(ej.objetivo, linea.a, linea.b);
    var trazada = claseDir(d), dirOk = trazada === tipo, puntoOk = distancia <= tolDist + EPS;
    var otro = null;
    if (!puntoOk) ej.puntos.forEach(function (p) { if (!p.objetivo && !otro && distRecta(p, linea.a, linea.b) <= tolDist + EPS) otro = p.nombre; });
    var msgDir, msgPunto, error = null;
    if (dirOk) msgDir = '✔ Es ' + tipo + ' a ' + R + '.';
    else if (tipo === 'paralela') msgDir = trazada === 'perpendicular' ? '✘ Esa recta es perpendicular, y te pedí paralela. Las paralelas nunca se cortan.'
      : '✘ Todavía no es paralela: si la estirás, en algún momento corta a ' + R + '. Copiá la inclinación de ' + R + '.';
    else if (tipo === 'perpendicular') msgDir = trazada === 'paralela' ? '✘ Esa recta es paralela, y te pedí perpendicular. La perpendicular corta a ' + R + ' formando ángulos rectos.'
      : '✘ Todavía no forma 4 ángulos rectos (como la esquina de la escuadra).';
    else msgDir = trazada === 'paralela' || trazada === 'casi-paralela' ? '✘ Parece paralela. Una oblicua tiene que cortar a ' + R + ' sin formar ángulos rectos.'
      : '✘ Parece perpendicular. Una oblicua corta a ' + R + ' inclinada, sin ángulos rectos.';
    if (puntoOk) msgPunto = '✔ Pasa por el punto ' + c + '.';
    else if (otro) msgPunto = '✘ Pasa por el punto ' + otro + ', pero te pedí el punto ' + c + '.';
    else msgPunto = '✘ No pasa por el punto ' + c + '. Arrastrala desde el medio para acercarla.';
    // el error más específico: primero la dirección (lo que se está aprendiendo), después el punto
    if (!dirOk) error = TIPOS.indexOf(trazada) >= 0 ? 'CONFUNDE_TIPO' : 'INCLINACION';
    else if (otro) error = 'PUNTO_EQUIVOCADO';
    else if (!puntoOk) error = 'NO_PASA_PUNTO';
    return { ok: dirOk && puntoOk, dirOk: dirOk, puntoOk: puntoOk, d: d, distancia: distancia, trazada: trazada, puntoTocado: otro, error: error, msgDir: msgDir, msgPunto: msgPunto };
  }

  /* ---------- notación ---------- */
  function notaciones(ej) { var N = ej.nueva.nombre, R = ej.ref.nombre; return TIPOS.map(function (t) { return { tipo: t, texto: N + ' ' + SIMBOLO[t] + ' ' + R }; }); }
  var EXPLICA = { paralela: '"//" quiere decir paralelas: nunca se cortan.', perpendicular: '"⊥" quiere decir perpendiculares: se cortan formando ángulos rectos.',
                  oblicua: '"∠" quiere decir oblicuas: se cortan sin formar ángulos rectos.' };

  /* ---------- pista ----------
     Un segmento guía de largo L con la inclinación correcta, en una esquina, que NO pasa por el punto objetivo.
     Para la oblicua, a 45° de la recta dada. */
  function guia(ej, L) {
    L = L || 80;
    var ang = ej.angRef + (ej.tipo === 'paralela' ? 0 : ej.tipo === 'perpendicular' ? 90 : 45), dx = Math.cos(ang * D2R) * L / 2, dy = Math.sin(ang * D2R) * L / 2;
    var m = L / 2 + 14, esquinas = [{ x: m, y: m }, { x: ej.W - m, y: m }, { x: m, y: ej.H - m }, { x: ej.W - m, y: ej.H - m }], mejor = null, md = -1;
    esquinas.forEach(function (c) {
      var a = { x: c.x - dx, y: c.y - dy }, b = { x: c.x + dx, y: c.y + dy };
      var cerca = Math.min(distRecta(ej.objetivo, a, b), dist(c, ej.objetivo) / 2);
      ej.puntos.forEach(function (p) { cerca = Math.min(cerca, dist(c, p) / 2); });
      var sep = distRecta(c, ej.ref.a, ej.ref.b);   // lejos de la recta dada, para que no se mezclen
      var puntaje = Math.min(cerca, 60) + Math.min(sep, 40);
      if (distRecta(ej.objetivo, a, b) > 30 && puntaje > md) { md = puntaje; mejor = { a: a, b: b, ang: ang }; }
    });
    return mejor || { a: { x: esquinas[0].x - dx, y: esquinas[0].y - dy }, b: { x: esquinas[0].x + dx, y: esquinas[0].y + dy }, ang: ang };
  }

  /* La recta correcta (para el debug y las pruebas): pasa por el objetivo; la oblicua a 45°. */
  function solucion(ej, L) {
    L = L || 160; var ang = ej.angRef + (ej.tipo === 'paralela' ? 0 : ej.tipo === 'perpendicular' ? 90 : 45), o = ej.objetivo;
    return { a: { x: o.x - Math.cos(ang * D2R) * L / 2, y: o.y - Math.sin(ang * D2R) * L / 2 }, b: { x: o.x + Math.cos(ang * D2R) * L / 2, y: o.y + Math.sin(ang * D2R) * L / 2 } };
  }

  /* ---------- estadísticas para Ajustes de padres (desde los eventos) ----------
     Por tipo: % de rectas bien al primer intento y tiempo medio hasta acertar; error más frecuente. */
  function estadisticas(eventos) {
    var por = {}, err = {};
    (eventos || []).forEach(function (e) {
      if (e.tipo !== 'paso' || e.paso !== 'trazar' || !e.item) return;
      var t = e.item.tipo, x = por[t] || (por[t] = { n: 0, ok1: 0, ms: [], abierto: {} });
      var clave = e.sesion + '|' + e.item.id;
      if (e.intento === 1) { x.n++; if (e.ok) x.ok1++; x.abierto[clave] = 0; }
      if (clave in x.abierto) { x.abierto[clave] += e.ms || 0; if (e.ok) { x.ms.push(x.abierto[clave]); delete x.abierto[clave]; } }
      if (e.error) err[e.error] = (err[e.error] || 0) + 1;
    });
    (eventos || []).forEach(function (e) { if (e.tipo === 'paso' && e.paso === 'notacion' && e.error) err[e.error] = (err[e.error] || 0) + 1; });
    var tipos = TIPOS.filter(function (t) { return por[t]; }).map(function (t) {
      var x = por[t], m = x.ms.length ? x.ms.reduce(function (a, b) { return a + b; }, 0) / x.ms.length : 0;
      return { tipo: t, n: x.n, pct1: x.n ? Math.round(100 * x.ok1 / x.n) : 0, msMedio: Math.round(m) };
    });
    var masErr = Object.keys(err).sort(function (a, b) { return err[b] - err[a]; })[0] || null;
    return { tipos: tipos, error: masErr, nError: masErr ? err[masErr] : 0 };
  }

  var ERRORES = {
    CONFUNDE_TIPO: 'Rectas: trazó otro tipo de recta (paralela en vez de perpendicular, etc.)',
    INCLINACION: 'Rectas: la inclinación no alcanza (casi paralela o casi perpendicular)',
    PUNTO_EQUIVOCADO: 'Rectas: la hizo pasar por otro punto',
    NO_PASA_PUNTO: 'Rectas: no pasa por el punto pedido',
    NOTACION: 'Rectas: eligió mal el símbolo (//, ⊥, ∠)'
  };

  var api = {
    TIPOS: TIPOS, MAYUS: MAYUS, MINUS: MINUS, TOL_ANG: TOL_ANG, OBL_MIN: OBL_MIN, OBL_MAX: OBL_MAX, SIMBOLO: SIMBOLO, NIVELES: NIVELES, ERRORES: ERRORES, EXPLICA: EXPLICA,
    dist: dist, distRecta: distRecta, angulo: angulo, difAng: difAng, pie: pie, cruce: cruce, recortar: recortar, adentro: adentro, claseDir: claseDir,
    HOJA: HOJA, planHoja: planHoja, generarHoja: generarHoja, pasoHoja: pasoHoja, consignaHoja: consignaHoja,
    bolsa: bolsa, generar: generar, comprobar: comprobar, notaciones: notaciones, guia: guia, solucion: solucion, estadisticas: estadisticas
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  else { root.REF4_RECTAS = api; }
})(typeof window !== 'undefined' ? window : this);
