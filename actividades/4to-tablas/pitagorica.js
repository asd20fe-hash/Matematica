/* Tabla pitagórica interactiva (10 × 10). Solo interfaz; no registra ejercicios.
   Tocar una casilla marca el camino de la fila y la columna y su gemela (7 × 8 y 8 × 7);
   tocar un número del borde marca toda esa tabla. "Ocultar resultados" tapa las casillas y cada toque destapa una.
   window.REF4_PITA.montar(contenedor, {onPracticar(t)}) */
(function (root) {
  'use strict';
  var N = 10;

  function montar(cont, opts) {
    opts = opts || {};
    var st = { f: null, c: null, tabla: null, ocultar: false, cuadrados: false, vistas: {} };

    function casilla(f, c) {
      var cls = 'pt-c', p = f * c, txt = String(p);
      if (st.tabla) { if (f === st.tabla || c === st.tabla) cls += ' tabla'; }
      if (st.f !== null) {
        if ((f === st.f && c <= st.c) || (c === st.c && f <= st.f)) cls += ' camino';
        if (f === st.f && c === st.c) cls += ' activa';
        else if (f === st.c && c === st.f) cls += ' gemela';
      }
      if (st.cuadrados && f === c) cls += ' cuadrado';
      if (st.ocultar && !st.vistas[f + 'x' + c] && !(f === st.f && c === st.c)) { cls += ' tapada'; txt = ''; }
      return '<button type="button" class="' + cls + '" data-f="' + f + '" data-c="' + c + '" aria-label="' + f + ' por ' + c + '">' + txt + '</button>';
    }
    function cabecera(n, eje) {
      var on = st.tabla === n || (eje === 'f' ? st.f === n : st.c === n);
      return '<button type="button" class="pt-h' + (on ? ' on' : '') + '" data-t="' + n + '" aria-label="Tabla del ' + n + '">' + n + '</button>';
    }
    function texto() {
      if (st.f !== null) {
        var p = st.f * st.c, gem = st.f !== st.c ? '<small>También ' + st.c + ' × ' + st.f + ' = ' + p + ': el orden no cambia el resultado.</small>' : '<small>' + st.f + ' × ' + st.f + ' es un cuadrado: está en la diagonal.</small>';
        return '<b>' + st.f + ' × ' + st.c + ' = ' + p + '</b>' + gem;
      }
      if (st.tabla) {
        var l = []; for (var q = 1; q <= N; q++) l.push(st.tabla * q);
        return '<b>Tabla del ' + st.tabla + '</b><small>' + l.join(', ') + '. Cada una es ' + st.tabla + ' más que la anterior.</small>';
      }
      return '<b>Tocá una casilla</b><small>o un número del borde para ver toda su tabla.</small>';
    }
    function pintar() {
      var h = '<div class="pt-info" aria-live="polite">' + texto() + '</div>' +
        '<div class="pt-opc"><button type="button" class="ref-btn chico' + (st.ocultar ? ' main' : '') + '" data-o="ocultar" aria-pressed="' + st.ocultar + '">🙈 Ocultar resultados</button>' +
        '<button type="button" class="ref-btn chico' + (st.cuadrados ? ' main' : '') + '" data-o="cuadrados" aria-pressed="' + st.cuadrados + '">◩ Cuadrados</button>' +
        (st.tabla && opts.onPracticar ? '<button type="button" class="ref-btn chico main" data-o="practicar">🧠 Practicar la del ' + st.tabla + '</button>' : '') + '</div>' +
        '<div class="pt-grilla" role="grid"><span class="pt-x">×</span>';
      for (var c = 1; c <= N; c++) h += cabecera(c, 'c');
      for (var f = 1; f <= N; f++) { h += cabecera(f, 'f'); for (c = 1; c <= N; c++) h += casilla(f, c); }
      cont.innerHTML = h + '</div>';
    }
    cont.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.o === 'ocultar') { st.ocultar = !st.ocultar; st.vistas = {}; }
      else if (b.dataset.o === 'cuadrados') st.cuadrados = !st.cuadrados;
      else if (b.dataset.o === 'practicar') return opts.onPracticar(st.tabla);
      else if (b.dataset.t) { var t = +b.dataset.t; st.tabla = st.tabla === t && st.f === null ? null : t; st.f = st.c = null; }
      else if (b.dataset.f) {
        var f = +b.dataset.f, c = +b.dataset.c;
        if (st.ocultar) st.vistas[f + 'x' + c] = true;
        if (st.f === f && st.c === c) { st.f = st.c = null; } else { st.f = f; st.c = c; st.tabla = null; }
      }
      pintar();
    };
    pintar();
    return { pintar: pintar };
  }

  root.REF4_PITA = { montar: montar };
})(window);
