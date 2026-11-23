/* Dinero de 1ro — monedas, billetes y saltos en la recta. window.DINERO (UMD: en node solo la parte pura).
   Versión 1.1.0 (2026-11-23). Sale del prototipo saltos_monedas v1.0 (docs/1ro-monedas/PLAN_dinero_y_saltos_v1.0.md).
   Historial de cambios
   v1.1.0  (2026-11-23) Billetes de $20, $50 y $100
     + VALORES = 1, 2, 5, 10, 20, 50, 100. Los billetes muestran barritas de 10 puntos (como las filas de la tabla del
       100): $10 una barrita, $20 dos, $100 diez. Colores: $20 coral, $50 azul, $100 rosa.
     + canje(lista, valores): un cambio que deja menos piezas ($5 + $5 → $10), para la ayuda de "menor cantidad".
     + Recta hasta 100 (9 px por número, números de a 10).
   v1.0.0  (2026-11-23) Primera versión
     + Parte pura: COLOR, VALORES, nombre(v, n), contar(lista), resumen(lista), menorCantidad(precio, valores), formas(total, valores).
     + Con DOM: html(v, tam, clase) (moneda o billete con tantos puntos como vale), svg(x, y, r, v), Recta (recta numérica
       + cuadrícula de 10 por fila + cadena 0 → 2 → 4, con salto animado y cola de promesas), Balanza (dos platos de
       monedas que se inclina hacia el que tiene más plata), beep(f, d) y confeti(); el sonido respeta REF4_UI.sonidoOn().
   Regla: cada moneda muestra puntos iguales a su valor y cada moneda es un salto (es la pista de que la de $2 vale más). */
(function (root, fabrica) {
  'use strict';
  var D = fabrica(root);
  if (typeof module === 'object' && module.exports) module.exports = D; else root.DINERO = D;
})(typeof window !== 'undefined' ? window : this, function (root) {
  'use strict';
  var D = {};
  D.VALORES = [1, 2, 5, 10, 20, 50, 100];
  D.COLOR = { 1: '#f5b301', 2: '#2ec4b6', 5: '#b07cf0', 10: '#5cc96b', 20: '#ff7a6b', 50: '#5b8def', 100: '#e879b9' };
  D.esBillete = function (v) { return v >= 10; };

  /* ---------- parte pura ---------- */
  // "moneda de $2", "monedas de $2", "billete de $10"…
  D.nombre = function (v, n) { return D.esBillete(v) ? (n === 1 ? 'billete' : 'billetes') + ' de $' + v : (n === 1 ? 'moneda' : 'monedas') + ' de $' + v; };
  D.suma = function (l) { var s = 0; for (var i = 0; i < l.length; i++) s += l[i]; return s; };
  // {10: 1, 2: 3} (cuántas de cada una)
  D.contar = function (l) { var c = {}; l.forEach(function (v) { c[v] = (c[v] || 0) + 1; }); return c; };
  // "1 billete de $10 y 3 monedas de $2" (de mayor a menor)
  D.resumen = function (l) {
    var c = D.contar(l), p = Object.keys(c).map(Number).sort(function (a, b) { return b - a; }).map(function (v) { return c[v] + ' ' + D.nombre(v, c[v]); });
    return p.length < 2 ? p.join('') : p.slice(0, -1).join(', ') + ' y ' + p[p.length - 1];
  };
  // Menor cantidad de monedas para pagar justo (con 1, 2, 5 y 10 alcanza ir de la más grande a la más chica).
  D.menorCantidad = function (precio, valores) {
    var v = (valores || D.VALORES).slice().sort(function (a, b) { return b - a; }), out = [], r = precio;
    v.forEach(function (x) { while (r >= x) { out.push(x); r -= x; } });
    return r ? null : out;
  };
  // Todas las formas de juntar total con esos valores (cada forma ordenada de mayor a menor), para la balanza y el cambio.
  D.formas = function (total, valores) {
    var v = valores.slice().sort(function (a, b) { return b - a; }), out = [];
    (function rec(i, r, act) {
      if (r === 0) { out.push(act.slice()); return; }
      if (i >= v.length) return;
      for (var k = Math.floor(r / v[i]); k >= 0; k--) { for (var j = 0; j < k; j++) act.push(v[i]); rec(i + 1, r - k * v[i], act); act.length -= k; }
    })(0, total, []);
    return out;
  };
  // Un canje que deja menos piezas: varias monedas/billetes de lo pagado que suman justo otro valor más grande.
  // Devuelve {quitar:[...], poner:v} (el más grande posible) o null si ya es la menor cantidad.
  D.canje = function (lista, valores) {
    var v = valores.slice().sort(function (a, b) { return b - a; });
    for (var i = 0; i < v.length; i++) {
      var chicas = lista.filter(function (x) { return x < v[i]; }).sort(function (a, b) { return b - a; }), sol = null;
      (function rec(k, r, act) {
        if (sol) return;
        if (r === 0) { if (act.length >= 2) sol = act.slice(); return; }
        for (var j = k; j < chicas.length; j++) { if (j > k && chicas[j] === chicas[j - 1]) continue; if (chicas[j] <= r) { act.push(chicas[j]); rec(j + 1, r - chicas[j], act); act.pop(); } }
      })(0, v[i], []);
      if (sol) return { quitar: sol, poner: v[i] };
    }
    return null;
  };
  D.clave = function (l) { return l.slice().sort(function (a, b) { return b - a; }).join('+'); };

  if (typeof document === 'undefined') return D;

  /* ---------- con DOM ---------- */
  // Moneda (redonda) o billete (rectangular) con su valor y un punto por cada peso.
  D.html = function (v, tam, clase) {
    return '<span class="din din-' + v + ' ' + (D.esBillete(v) ? 'billete' : 'moneda') + ' ' + (clase || '') + '" style="--s:' + (tam || 56) + 'px" aria-label="' + D.nombre(v, 1) + '">' +
      '<b>$' + v + '</b><span class="din-puntos">' + (D.esBillete(v) ? new Array(v / 10 + 1).join('<i class="d"></i>') : new Array(v + 1).join('<i></i>')) + '</span></span>';
  };
  D.svg = function (x, y, r, v) {
    var s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + D.COLOR[v] + '" stroke="rgba(255,255,255,.5)" stroke-width="3"/>' +
      '<text x="' + x + '" y="' + (y - r * 0.12) + '" class="din-ctxt" font-size="' + (r * 0.72) + '" text-anchor="middle" dominant-baseline="middle">$' + v + '</text>';
    var dr = r * (v > 2 ? 0.1 : 0.13), gap = dr * 2.6;
    for (var i = 0; i < v; i++) s += '<circle cx="' + (x - (v - 1) * gap / 2 + i * gap) + '" cy="' + (y + r * 0.5) + '" r="' + dr + '" fill="rgba(0,0,0,.55)"/>';
    return s;
  };

  /* ---------- sonido ---------- */
  var actx = null;
  D.sonidoOn = function () { return root.REF4_UI ? root.REF4_UI.sonidoOn() : true; };
  D.beep = function (f, d) {
    if (!D.sonidoOn()) return;
    try {
      actx = actx || new (root.AudioContext || root.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain(); d = d || 0.12;
      o.type = 'sine'; o.frequency.value = f || 600;
      g.gain.setValueAtTime(0.16, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + d);
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d);
    } catch (e) { /* sin audio */ }
  };
  D.confeti = function () {
    var em = ['⭐', '🪙', '🎉', '✨', '💚'];
    for (var i = 0; i < 26; i++) {
      var s = document.createElement('span'); s.className = 'din-conf'; s.setAttribute('aria-hidden', 'true');
      s.textContent = em[i % em.length]; s.style.left = Math.random() * 100 + 'vw'; s.style.animationDelay = Math.random() * 0.6 + 's';
      document.body.appendChild(s); (function (x) { setTimeout(function () { x.remove(); }, 2600); })(s);
    }
    [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { D.beep(f, 0.18); }, i * 110); });
  };

  /* ---------- Recta: recta numérica + cuadrícula + cadena ----------
     new D.Recta(cont, {N, inicio, saltarin, alCambiar}); add(v) / pop() / reset() devuelven una promesa (la animación).
     total = inicio + lo saltado; items = valores saltados (cada uno es una moneda). */
  function Recta(cont, op) {
    op = op || {};
    this.cont = cont; this.saltarin = op.saltarin || '🐸'; this.alCambiar = op.alCambiar || null; this.cola = Promise.resolve();
    cont.classList.add('din-recta');
    cont.innerHTML = '<div class="din-nl-wrap"><svg class="din-nl" aria-hidden="true"></svg></div><div class="din-cadena" aria-live="polite"></div><div class="din-grilla" aria-hidden="true"></div>';
    this.wrap = cont.querySelector('.din-nl-wrap'); this.svgEl = cont.querySelector('svg');
    this.cadEl = cont.querySelector('.din-cadena'); this.grEl = cont.querySelector('.din-grilla');
    this.setN(op.N || 20, op.inicio || 0);
  }
  Recta.prototype = {
    get total() { return this.inicio + D.suma(this.items); },
    x: function (i) { return this.pad + i * this.u; },
    arcoH: function (v) { return Math.min(70, 20 + v * this.u * 0.32); },
    setN: function (N, inicio) {
      this.N = N; this.inicio = inicio || 0; this.items = [];
      var u = this.u = N <= 20 ? 36 : N <= 30 ? 26 : N <= 50 ? 16 : 9, pad = this.pad = 24;
      this.W = N * u + pad * 2; this.H = 132; this.y = this.H - 36;
      this.svgEl.setAttribute('viewBox', '0 0 ' + this.W + ' ' + this.H);
      this.svgEl.style.minWidth = (N <= 20 ? 560 : N <= 30 ? 640 : N <= 50 ? 780 : 900) + 'px';
      var y = this.y, cada = N <= 30 ? 1 : N <= 50 ? 5 : 10;
      var s = '<line x1="' + pad + '" y1="' + y + '" x2="' + (this.W - pad) + '" y2="' + y + '" class="din-eje"/>';
      for (var i = 0; i <= N; i++) {
        var x = this.x(i), g = i % (N > 50 ? 10 : 5) === 0;
        s += '<line x1="' + x + '" y1="' + (y - (g ? 10 : 6)) + '" x2="' + x + '" y2="' + (y + (g ? 10 : 6)) + '" class="din-marca"/>';
        if (i % cada === 0 || i === this.inicio) s += '<text x="' + x + '" y="' + (y + 30) + '" class="din-num" data-i="' + i + '">' + i + '</text>';
      }
      s += '<g class="din-arcos"></g><text class="din-salta" text-anchor="middle">' + this.saltarin + '</text>';
      this.svgEl.innerHTML = s;
      this.arcG = this.svgEl.querySelector('.din-arcos'); this.salEl = this.svgEl.querySelector('.din-salta');
      this.nums = [].slice.call(this.svgEl.querySelectorAll('.din-num'));
      this.poner(this.inicio, 0);
      var gr = ''; for (var k = 1; k <= N; k++) gr += '<div class="din-celda">' + k + '</div>';
      this.grEl.innerHTML = gr; this.celdas = [].slice.call(this.grEl.children);
      this.pintar(false);
      var me = this; setTimeout(function () { me.centrar(me.inicio); }, 30);
    },
    poner: function (p, alto) { this.salEl.setAttribute('x', this.x(p)); this.salEl.setAttribute('y', this.y - 8 - alto); },
    animar: function (de, a) {
      var me = this;
      return new Promise(function (res) {
        var h = me.arcoH(Math.abs(a - de)), t0 = performance.now(), DUR = 430;
        (function f(now) {
          var t = Math.min(1, (now - t0) / DUR);
          me.poner(de + (a - de) * t, 4 * h * t * (1 - t));
          if (t < 1) requestAnimationFrame(f); else { me.centrar(a); res(); }
        })(t0);
      });
    },
    centrar: function (p) {
      var r = this.svgEl.getBoundingClientRect(); if (!r.width) return;
      this.wrap.scrollTo({ left: this.x(p) * r.width / this.W - this.wrap.clientWidth / 2, behavior: 'smooth' });
    },
    puede: function (v) { return this.total + v <= this.N; },
    mover: function (cambio, anim) { var de = this.total; cambio(); this.pintar(anim); var a = this.total, me = this; this.cola = this.cola.then(function () { return de === a ? null : me.animar(de, a); }); return this.cola; },
    add: function (v) { if (!this.puede(v)) return false; var me = this; return this.mover(function () { me.items.push(v); }, true); },
    pop: function () { var me = this; return this.mover(function () { me.items.pop(); }, false); },
    reset: function () { var me = this; return this.mover(function () { me.items = []; }, false); },
    pintar: function (animUlt) {
      var a = this.inicio, arcos = '', caen = {}, me = this; caen[a] = 1;
      this.celdas.forEach(function (c, i) { c.className = 'din-celda' + (i + 1 <= me.inicio ? ' antes' : '') + (i + 1 === me.inicio ? ' cae' : ''); c.style.background = ''; });
      this.items.forEach(function (v, gi) {
        var b = a + v, xa = me.x(a), xb = me.x(b), h = me.arcoH(v), y = me.y, ult = animUlt && gi === me.items.length - 1;
        arcos += '<path pathLength="1" class="din-arco' + (ult ? ' nuevo' : '') + '" stroke="' + D.COLOR[v] + '" d="M' + xa + ' ' + y + ' Q' + (xa + xb) / 2 + ' ' + (y - 2 * h) + ' ' + xb + ' ' + y + '"/>' +
          '<text class="din-arcl" fill="' + D.COLOR[v] + '" x="' + (xa + xb) / 2 + '" y="' + (y - h - 8) + '">+' + v + '</text>';
        for (var i = a + 1; i <= b; i++) { var c = me.celdas[i - 1]; if (!c) continue; c.className = 'din-celda llena' + (gi % 2 ? ' alt' : '') + (i === b ? ' cae' : ''); c.style.background = D.COLOR[v]; }
        caen[b] = 1; a = b;
      });
      this.arcG.innerHTML = arcos;
      this.nums.forEach(function (l) { l.classList.toggle('cae', me.items.length > 0 && !!caen[+l.getAttribute('data-i')]); });
      var ch = '<span class="din-chip">' + this.inicio + '</span>'; a = this.inicio;
      this.items.forEach(function (v) { a += v; ch += '<span class="din-fl">→</span><span class="din-chip" style="border-color:' + D.COLOR[v] + '">' + a + '</span>'; });
      this.cadEl.innerHTML = ch;
      if (this.alCambiar) this.alCambiar(this);
    }
  };
  D.Recta = Recta;

  /* ---------- Balanza: dos platos con listas de monedas; se inclina hacia el que tiene más plata ---------- */
  function Balanza(svgEl) { this.svgEl = svgEl; this.ang = 0; this.raf = null; this.izq = []; this.der = []; }
  Balanza.prototype = {
    plato: function (l, px, py, r) {
      var n = l.length, sp = n > 1 ? Math.min(r * 2, 100 / (n - 1)) : 0, s = '';
      l.forEach(function (v, i) { s += D.svg(px - (n - 1) * sp / 2 + i * sp, py + 54 - (n > 4 && i % 2 ? 10 : 0), r, v); });
      return s;
    },
    dibujar: function (ang) {
      var cx = 200, cy = 58, L = 135, rad = ang * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
      var lx = cx - L * c, ly = cy - L * s, rx = cx + L * c, ry = cy + L * s;
      var h = '<path d="M' + cx + ' ' + cy + ' L' + cx + ' 222 M' + (cx - 55) + ' 222 L' + (cx + 55) + ' 222" class="din-pie"/>' +
        '<line x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" class="din-brazo"/><circle cx="' + cx + '" cy="' + cy + '" r="9" class="din-eje-b"/>';
      var plato = function (px, py) {
        return '<line x1="' + px + '" y1="' + py + '" x2="' + (px - 48) + '" y2="' + (py + 72) + '" class="din-hilo"/><line x1="' + px + '" y1="' + py + '" x2="' + (px + 48) + '" y2="' + (py + 72) + '" class="din-hilo"/>' +
          '<path d="M' + (px - 58) + ' ' + (py + 72) + ' Q' + px + ' ' + (py + 100) + ' ' + (px + 58) + ' ' + (py + 72) + ' Z" class="din-plato"/>';
      };
      h += plato(lx, ly) + plato(rx, ry) + this.plato(this.izq, lx, ly, this.izq.length > 1 ? 18 : 24) + this.plato(this.der, rx, ry, 17);
      this.svgEl.innerHTML = h;
    },
    // Actualiza y anima: positivo = baja el plato derecho.
    poner: function (izq, der) {
      this.izq = izq.slice(); this.der = der.slice();
      var dif = D.suma(this.der) - D.suma(this.izq), obj = Math.max(-20, Math.min(20, dif * 9)), me = this;
      cancelAnimationFrame(this.raf);
      (function paso() {
        me.ang += (obj - me.ang) * 0.15; if (Math.abs(obj - me.ang) < 0.2) me.ang = obj;
        me.dibujar(me.ang); if (me.ang !== obj) me.raf = requestAnimationFrame(paso);
      })();
      return dif;
    }
  };
  D.Balanza = Balanza;
  return D;
});
