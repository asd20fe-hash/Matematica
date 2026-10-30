/* Matemática — registro de ejercicios en una planilla de Google (Apps Script).
   Se pega en Extensiones > Apps Script de la planilla y se implementa como aplicación web
   (Ejecutar como: yo; Quién tiene acceso: cualquier persona). Instrucciones en nube/LEEME.md.
   Versión 1.1 (2026-10-30).
   v1.1 + Permisos por dispositivo: la hoja "dispositivos" suma acceso (qué perfiles ve hoy el dispositivo), nota (nombre o
          descripción del administrador, nunca se manda al dispositivo) y permitidos (perfiles de la familia habilitados,
          en JSON; vacía = sin configurar). La hoja "eventos" suma dispositivoNota. A las hojas viejas se les agregan solas
          las columnas nuevas al final.
        + POST {accion:'permisos', clave, dispositivo, permitidos:[...], nota}: lo guarda el panel del administrador.
        + GET ?accion=permisos&dispositivo=...: el dispositivo pregunta qué perfiles puede usar (solo eso, sin la nota).
   - POST {accion:'guardar', eventos:[...], perfiles:[...], dispositivo:{id,nombre}}: agrega una fila por evento
     a la hoja "eventos" (descarta los id repetidos) y actualiza "perfiles" y "dispositivos".
   - GET ?accion=leer&clave=...: devuelve todo el registro en JSON. Sin la clave correcta no devuelve nada. */

// Cambiá esta clave por una tuya (letras y números). Es la que vas a escribir en Ajustes de padres para ver el registro.
const CLAVE_LECTURA = 'cambiame-por-una-clave-larga';

const COLS = ['id', 'fecha', 'ts', 'perfil', 'perfilNombre', 'dispositivo', 'dispositivoNombre', 'act', 'v', 'tipo', 'tema', 'sesion', 'ronda', 'nivel',
  'paso', 'intento', 'ok', 'error', 'esperado', 'respuesta', 'ms', 'ayuda', 'tipoItem', 'item', 'extra', 'dispositivoNota'];
const COLS_PER = ['id', 'nombre', 'avatar', 'grado', 'color', 'actualizado'];
const COLS_DIS = ['id', 'nombre', 'actualizado', 'acceso', 'nota', 'permitidos'];
const COLS_DIS_DISP = ['id', 'nombre', 'actualizado', 'acceso'];   // lo que escribe el dispositivo (no pisa nota ni permitidos)

function hoja(nombre, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');   // todo como texto: que "3/4" no se vuelva una fecha
    sh.setFrozenRows(1);
  } else {
    // hoja de una versión anterior: agrega al final las columnas que falten
    const n = sh.getLastColumn(), cab = n ? sh.getRange(1, 1, 1, n).getValues()[0].map(String) : [];
    cols.forEach(function (c) {
      if (cab.indexOf(c) >= 0) return;
      cab.push(c);
      sh.getRange(1, cab.length).setValue(c).setFontWeight('bold');
      sh.getRange(1, cab.length, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  }
  return sh;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function texto(v) { return v === undefined || v === null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    const d = JSON.parse(e.postData.contents);
    if (d.accion === 'permisos') return permisos(d);
    if (d.accion !== 'guardar' || !Array.isArray(d.eventos)) return json({ ok: false, error: 'pedido inválido' });
    const sh = hoja('eventos', COLS), ult = sh.getLastRow();
    const ya = new Set(ult > 1 ? sh.getRange(2, 1, ult - 1, 1).getValues().map(function (r) { return String(r[0]); }) : []);
    const filas = [], notas = {};
    leerHoja('dispositivos', COLS_DIS).forEach(function (o) { notas[String(o.id)] = o.nota; });
    d.eventos.slice(0, 500).forEach(function (ev) {
      if (!ev || !ev.id || ya.has(String(ev.id))) return;
      ya.add(String(ev.id));
      const extra = {};
      Object.keys(ev).forEach(function (k) { if (COLS.indexOf(k) < 0) extra[k] = ev[k]; });
      ev.fecha = Utilities.formatDate(new Date(Number(ev.ts)), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd HH:mm:ss');
      ev.extra = Object.keys(extra).length ? extra : '';
      ev.dispositivoNota = notas[String(ev.dispositivo)] || '';
      filas.push(COLS.map(function (c) { return texto(ev[c]).slice(0, 2000); }));
    });
    if (filas.length) sh.getRange(sh.getLastRow() + 1, 1, filas.length, COLS.length).setNumberFormat('@').setValues(filas);
    upsert(hoja('perfiles', COLS_PER), COLS_PER, (d.perfiles || []).filter(function (p) { return p && p.id; }));
    if (d.dispositivo && d.dispositivo.id) upsert(hoja('dispositivos', COLS_DIS), COLS_DIS_DISP, [d.dispositivo]);
    return json({ ok: true, recibidos: d.eventos.length, nuevos: filas.length });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Agrega o actualiza filas por id.
function upsert(sh, cols, lista) {
  if (!lista.length) return;
  const ult = sh.getLastRow(), ids = ult > 1 ? sh.getRange(2, 1, ult - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const ahora = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd HH:mm');
  lista.forEach(function (o) {
    o.actualizado = ahora;
    const fila = cols.map(function (c) { return texto(o[c]); }), i = ids.indexOf(String(o.id));
    if (i >= 0) sh.getRange(i + 2, 1, 1, cols.length).setValues([fila]);
    else { sh.getRange(sh.getLastRow() + 1, 1, 1, cols.length).setNumberFormat('@').setValues([fila]); ids.push(String(o.id)); }
  });
}

function claveOk(c) { return !!CLAVE_LECTURA && CLAVE_LECTURA !== 'cambiame-por-una-clave-larga' && c === CLAVE_LECTURA; }

// Panel del administrador: perfiles habilitados y nota de un dispositivo (crea la fila si todavía no mandó nada).
function permisos(d) {
  if (!claveOk(d.clave)) return json({ ok: false, error: 'clave' });
  if (!d.dispositivo) return json({ ok: false, error: 'falta el dispositivo' });
  const sh = hoja('dispositivos', COLS_DIS), ult = sh.getLastRow();
  const ids = ult > 1 ? sh.getRange(2, 1, ult - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  let i = ids.indexOf(String(d.dispositivo));
  if (i < 0) { sh.getRange(sh.getLastRow() + 1, 1, 1, 1).setNumberFormat('@').setValue(String(d.dispositivo)); i = ids.length; }
  const lista = (Array.isArray(d.permitidos) ? d.permitidos : []).map(String).slice(0, 20);
  const fila = i + 2, cN = COLS_DIS.indexOf('nota') + 1, cP = COLS_DIS.indexOf('permitidos') + 1;
  sh.getRange(fila, cN).setValue(String(d.nota || '').slice(0, 200));
  sh.getRange(fila, cP).setValue(JSON.stringify(lista));
  return json({ ok: true, permitidos: lista });
}

function leerHoja(nombre, cols) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues().map(function (r) {
    const o = {}; cols.forEach(function (c, i) { o[c] = r[i]; }); return o;
  });
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.accion === 'permisos') {
    const o = leerHoja('dispositivos', COLS_DIS).filter(function (x) { return String(x.id) === String(p.dispositivo || ''); })[0];
    let lista = [], conf = !!(o && String(o.permitidos) !== '');
    if (conf) { try { lista = JSON.parse(o.permitidos); } catch (err) { lista = []; } }
    return json({ ok: true, configurado: conf, permitidos: lista });
  }
  if (p.accion !== 'leer') return json({ ok: true, info: 'Registro de Matemática. Para leer hace falta la clave.' });
  if (!claveOk(p.clave)) return json({ ok: false, error: 'clave' });
  const desde = Number(p.desde || 0);
  const eventos = leerHoja('eventos', COLS).filter(function (o) { return Number(o.ts) >= desde; });
  return json({ ok: true, eventos: eventos, perfiles: leerHoja('perfiles', COLS_PER), dispositivos: leerHoja('dispositivos', COLS_DIS) });
}

// Para probar desde el editor: crea las hojas.
function preparar() { hoja('eventos', COLS); hoja('perfiles', COLS_PER); hoja('dispositivos', COLS_DIS); }
