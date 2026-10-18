/* Panel de estadísticas del refuerzo de 4to, para "Ajustes de padres" (detrás del PIN).
   Lee y escribe localStorage con el esquema de MATE (mate.<perfil>.<actividad>.<clave>).
   Depende de REF4_EV. window.REF4_PANEL.render(contenedor, {perfiles, actividades}) */
(function (root) {
  'use strict';
  var EV = root.REF4_EV;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var ERRORES = {
    TABLA: 'Producto mal (tabla)', FACTOR_CHICO: 'Factor chico (uno menos)', FACTOR_GRANDE: 'Factor que se pasa', REGISTRO_COCIENTE: 'Anotó el producto en el casillero',
    RESTA: 'Resta mal hecha', RESTO_MAYOR: 'No vio que el resto era mayor que el divisor', CONTROL: 'Control del resto', PARCIAL_CHICO: 'Primer parcial chico',
    BAJAR: 'Bajó una cifra equivocada', PASO_EXTRA: 'Restó sin bajar / cifra de más', CERO_OMITIDO: 'No puso el 0', ESTIMACION: 'Estimación', VERIFICACION: 'Verificación',
    PREGUNTA: 'No identificó la pregunta', DATOS_FALTAN: 'Faltó marcar un dato', DATOS_DE_MAS: 'Marcó un dato que sobra', PLAN_OPERACION: 'Operación equivocada',
    PLAN_ORDEN: 'Orden equivocado', PLAN_INCOMPLETO: 'Plan incompleto', RESTO_INTERPRETACION: 'No supo qué hacer con el resto', UNIDAD: 'Unidad equivocada',
    DETECCION_OMITIDA: 'No vio un error', FALSA_ALARMA: 'Marcó error donde no había', MOTIVO: 'Eligió mal la causa', CERO_PERDIDO: 'Perdió o agregó un cero',
    MEZCLA_ESTRATEGIA: 'Redondeó sin compensar', MITAD_AUTOMATICA: 'Respondió la mitad del dividendo', RESERVA: 'Se llevó mal', OTRO: 'Otro',
    ANOTO_TODO: 'Anotó el número entero sin llevarse', SUMA: 'Suma de las filas mal hecha'
  };

  function ejemplo(e) {
    if (!e) return '';
    var it = e.item || {}, partes = [];
    if (it.dividendo) partes.push(it.dividendo + ' : ' + it.divisor); else if (it.a) partes.push(it.a + ' × ' + it.d); else if (it.hecho) partes.push(it.hecho.replace('x', ' × '));
    else if (it.plantilla) partes.push(it.plantilla); else if (it.sumandos) partes.push(it.sumandos.join(' + '));
    if (e.paso) partes.push('paso ' + e.paso);
    if (e.esperado !== undefined && e.respuesta !== undefined) partes.push('esperado ' + String(e.esperado).slice(0, 30) + ', respondió ' + String(e.respuesta).slice(0, 30));
    return partes.join(' · ');
  }

  // Detección de errores plantados y falsas alarmas (Actividad 4), a partir de los eventos que siguen guardados.
  function deteccion(eventos) {
    var por = {}, falsas = { n: 0, mal: 0 };
    eventos.forEach(function (e) {
      if (e.tipo !== 'paso' || e.paso !== 'veredicto' || e.intento !== 1 || !e.item) return;
      var t = e.item.errorPlantado;
      if (t) { var x = por[t] || (por[t] = { n: 0, ok: 0 }); x.n++; if (e.ok) x.ok++; }
      else { falsas.n++; if (!e.ok) falsas.mal++; }
    });
    return { por: por, falsas: falsas };
  }

  function porcentaje(a, b) { return b ? Math.round(100 * a / b) + ' %' : '—'; }

  function render(cont, cfg) {
    var ls = cfg.ls || root.localStorage, ahora = Date.now();
    var perfiles = cfg.perfiles || [];
    var out = '';
    perfiles.forEach(function (p) {
      var acts = cfg.actividades.filter(function (a) { return a.grados ? a.grados.indexOf(p.grado) >= 0 : (!a.perfiles || a.perfiles.indexOf(p.id) >= 0); });
      if (!acts.length) return;
      out += '<div class="ref4-perfil"><h3>' + esc(p.avatar) + ' ' + esc(p.nombre) + ' · refuerzo de ' + esc(p.grado) + '</h3>';
      var todosAg = [];
      acts.forEach(function (a) {
        var d = EV.leerDirecto(ls, p.id, a.id), r = EV.resumir(d.eventos, d.agregados, ahora);
        todosAg.push(EV.combinar(d.eventos, d.agregados));
        out += '<details class="ref4-act" open><summary><b>' + esc(a.icono || '') + ' ' + esc(a.titulo) + '</b> · nivel ' + (d.estado.nivel || 1) + '</summary>';
        out += '<div class="ref4-grid"><div><b>' + r.rondas7 + '</b><small>rondas en 7 días</small></div><div><b>' + r.min7 + '</b><small>minutos en 7 días</small></div>' +
               '<div><b>' + r.rondas30 + '</b><small>rondas en 30 días</small></div><div><b>' + r.min30 + '</b><small>minutos en 30 días</small></div>' +
               '<div><b>' + (r.pct1 === null ? '—' : r.pct1 + ' %') + '</b><small>bien al primer intento</small></div><div><b>' + r.desconexionesPorRonda + '</b><small>desconexiones por ronda</small></div></div>';
        if (r.errores.length) {
          out += '<p><b>Errores más frecuentes</b></p><ol class="ref4-err">' + r.errores.map(function (e) {
            return '<li><b>' + esc(ERRORES[e.codigo] || e.codigo) + '</b> <small>(' + esc(e.codigo) + ', ' + e.n + (e.n === 1 ? ' vez' : ' veces') + ')</small>' + (e.ejemplo ? '<br><small>Ejemplo: ' + esc(ejemplo(e.ejemplo)) + '</small>' : '') + '</li>';
          }).join('') + '</ol>';
        } else out += '<p><small>Todavía no hay errores registrados.</small></p>';
        if (a.id === '4to-tiene-sentido') {
          var det = deteccion(d.eventos), filas = Object.keys(det.por).map(function (t) { return '<li>' + esc(ERRORES[t] || t) + ': ' + porcentaje(det.por[t].ok, det.por[t].n) + ' detectado (' + det.por[t].n + ')</li>'; }).join('');
          out += '<p><b>Detección de errores plantados</b> <small>(eventos recientes)</small></p><ul class="ref4-err">' + (filas || '<li><small>Sin datos todavía.</small></li>') + '<li>Falsas alarmas: ' + porcentaje(det.falsas.mal, det.falsas.n) + ' (' + det.falsas.n + ' cuentas bien)</li></ul>';
        }
        out += '<div class="ref4-acc"><label>Fijar nivel <select data-nivel="' + esc(a.id) + '" data-perfil="' + esc(p.id) + '">' +
               Array.apply(null, Array(a.nivelMax || 4)).map(function (_, i) { return '<option value="' + (i + 1) + '"' + ((d.estado.nivel || 1) === i + 1 ? ' selected' : '') + '>' + (i + 1) + '</option>'; }).join('') +
               '</select></label> <button class="btn" data-fijar="' + esc(a.id) + '" data-perfil="' + esc(p.id) + '">Fijar</button> ' +
               '<button class="btn" data-reiniciar="' + esc(a.id) + '" data-perfil="' + esc(p.id) + '">Reiniciar estadísticas</button></div></details>';
      });
      var rk = EV.rankingHechos(todosAg);
      out += '<details class="ref4-act" open><summary><b>Hechos (d × q) más errados y más lentos</b></summary>';
      out += '<div class="ref4-dos"><div><p><b>Más errados</b></p><ol class="ref4-err">' + (rk.errados.length ? rk.errados.map(function (h) { return '<li>' + esc(h.hecho.replace('x', ' × ')) + ' <small>' + h.errores + ' de ' + h.n + '</small></li>'; }).join('') : '<li><small>Sin datos todavía.</small></li>') + '</ol></div>' +
             '<div><p><b>Más lentos</b></p><ol class="ref4-err">' + (rk.lentos.length ? rk.lentos.map(function (h) { return '<li>' + esc(h.hecho.replace('x', ' × ')) + ' <small>' + (Math.round(h.ms / 100) / 10) + ' s</small></li>'; }).join('') : '<li><small>Sin datos todavía.</small></li>') + '</ol></div></div></details>';
      out += '<div class="ref4-acc"><button class="btn main" data-exportar="' + esc(p.id) + '">Exportar todo (JSON)</button></div></div>';
    });
    cont.innerHTML = out || '<p class="sub">No hay actividades de refuerzo para mostrar.</p>';

    cont.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var perfil = b.dataset.perfil;
      if (b.dataset.fijar) {
        var sel = cont.querySelector('select[data-nivel="' + b.dataset.fijar + '"][data-perfil="' + perfil + '"]'), act = cfg.actividades.filter(function (x) { return x.id === b.dataset.fijar; })[0];
        var d = EV.leerDirecto(ls, perfil, b.dataset.fijar), est = d.estado || {}; est.nivel = Math.max(1, Math.min(act.nivelMax || 4, +sel.value)); est.buenas = 0; est.malas = 0;
        try { ls.setItem(EV.claveAlmacen(perfil, b.dataset.fijar, 'estado'), JSON.stringify(est)); } catch (err) { /* sin espacio */ }
        render(cont, cfg);
      } else if (b.dataset.reiniciar) {
        if (!root.confirm('¿Seguro que querés borrar las estadísticas de esta actividad? No se puede deshacer.')) return;
        ['eventos', 'agregados', 'estado', 'record'].forEach(function (c) { try { ls.removeItem(EV.claveAlmacen(perfil, b.dataset.reiniciar, c)); } catch (err) { /* nada */ } });
        render(cont, cfg);
      } else if (b.dataset.exportar) {
        var todo = { exportado: new Date().toISOString(), perfil: b.dataset.exportar, actividades: {} };
        cfg.actividades.forEach(function (a) { todo.actividades[a.id] = EV.leerDirecto(ls, b.dataset.exportar, a.id); });
        var blob = new Blob([JSON.stringify(todo, null, 1)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = 'refuerzo-' + b.dataset.exportar + '-' + todo.exportado.slice(0, 10) + '.json'; document.body.appendChild(link); link.click();
        setTimeout(function () { link.remove(); URL.revokeObjectURL(url); }, 500);
      }
    };
  }

  root.REF4_PANEL = { render: render, ERRORES: ERRORES, deteccion: deteccion, ejemplo: ejemplo };
})(window);
