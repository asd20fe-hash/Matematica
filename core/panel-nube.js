/* Matemática — panel "Registro en la nube" de Ajustes de padres (solo lo carga el shell). Versión 1.1 (2026-10-29).
   v1.1 + "Tiempo por dispositivo": arma las visitas con las entradas (tipo:'conexion' y 'perfil' de core.js v2.7), los
          ejercicios y los tramos; una visita se corta con 15 minutos sin nada. Desde, hasta, duración, perfiles y entradas.
   - Este dispositivo: nombre, envíos pendientes, dirección de la planilla, enviar ahora y subir el historial.
   - Registro: con la clave de lectura trae todo de la planilla y muestra, por perfil y dispositivo, el resumen por
     actividad, los errores más frecuentes y la lista de cada error; descarga en CSV o JSON. */
(function(){
'use strict';
const esc=s=>String(s===undefined||s===null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fecha=ts=>ts?new Date(+ts).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'}):'—';
let datos=null, filtro={perfil:'',disp:'',act:'',dias:'30',soloErr:true}, cuantos=100;

// Nombre del error: el de la actividad (registro.js) o los de 4to.
function nombreError(act,cod){
  const a=MATE.actividades.find(x=>x.id===act);
  return (a&&a.errores&&a.errores[cod])||(window.LENGUA1&&LENGUA1.ERRORES[cod])||(window.REF4_PANEL&&REF4_PANEL.ERRORES[cod])||(window.REF4_FR&&REF4_FR.ERRORES&&REF4_FR.ERRORES[cod])||cod;
}
const objeto=v=>{ if(v&&typeof v==='object') return v; try{ return JSON.parse(v)||{}; }catch(e){ return {}; } };
/* Análisis por ítem (actividades con analisis:'palabras' o 'preguntas'): cada palabra o tipo de pregunta con sus
   resultados al primer intento en orden. Estado: persiste (las 2 últimas mal), aprendida (la erró y después 2 seguidas bien),
   en repaso (la erró y todavía no la afirma) o bien (nunca la erró). */
function analisis(evs,a){
  const porPalabra=a.analisis==='palabras', items={};
  evs.filter(e=>e.act===a.id&&e.tipo==='paso'&&e.intento===1).sort((x,y)=>x.ts-y.ts).forEach(e=>{
    const it=objeto(e.item), k=porPalabra?(it.palabra||e.esperado):(it.clave||e.paso), x=items[k]||(items[k]={k,txt:porPalabra?(it.img?it.img+' ':'')+k:(it.texto||k),res:[],err:{},resp:[],formas:{},ult:0});
    x.res.push(e.okB); x.ult=e.ts;
    if(!e.okB){ if(e.error) x.err[e.error]=(x.err[e.error]||0)+1; if(porPalabra&&x.resp.indexOf(e.respuesta)<0) x.resp.push(e.respuesta); x.formas[e.forma||'?']=(x.formas[e.forma||'?']||0)+1; }
    if(!porPalabra) x.txt=it.texto||x.txt;
  });
  const estado=x=>{ const r=x.res, n=r.length, errada=r.indexOf(false)>=0; if(!errada) return 'bien'; if(n>=2&&!r[n-1]&&!r[n-2]) return 'persiste'; const ui=r.lastIndexOf(false); return n-1-ui>=2?'aprendida':'en repaso'; };
  const ORD={persiste:0,'en repaso':1,aprendida:2,bien:3}, ICO={persiste:'🔴 persiste','en repaso':'🟡 en repaso',aprendida:'🟢 aprendida',bien:'✅ bien'};
  const lista=Object.values(items).map(x=>Object.assign(x,{est:estado(x)})).sort((x,y)=>ORD[x.est]-ORD[y.est]||y.res.filter(v=>!v).length-x.res.filter(v=>!v).length);
  if(!lista.length) return '';
  const cuenta={}; lista.forEach(x=>cuenta[x.est]=(cuenta[x.est]||0)+1);
  let h='<h3>'+esc(tituloAct(a.id))+': por '+(porPalabra?'palabra':'tipo de pregunta')+'</h3><p><small>'+Object.keys(ORD).filter(k=>cuenta[k]).map(k=>ICO[k]+': '+cuenta[k]).join(' · ')+'</small></p>';
  h+='<div class="nube-scroll"><table class="fr4-mapa nube-err"><thead><tr><th>'+(porPalabra?'Palabra':'Pregunta')+'</th><th>Estado</th><th>Veces</th><th>Bien a la 1ª</th><th>Historial</th><th>Errores</th>'+(porPalabra?'<th>Cómo la escribió</th>':'')+'</tr></thead><tbody>'+lista.map(x=>{
    const malas=x.res.filter(v=>!v).length, errs=Object.keys(x.err).sort((p,q)=>x.err[q]-x.err[p]).map(c=>esc(nombreError(a.id,c))+' <small>('+x.err[c]+')</small>').join('<br>');
    return '<tr><td style="text-align:left;white-space:normal">'+esc(x.txt)+'</td><td>'+ICO[x.est]+'</td><td>'+x.res.length+'</td><td>'+(x.res.length-malas)+'</td><td>'+x.res.slice(-8).map(v=>v?'✔':'✘').join('')+'</td><td>'+(errs||'—')+'</td>'+
      (porPalabra?'<td style="white-space:normal">'+esc(x.resp.slice(-4).join(', '))+(x.formas.minus?' <small>('+x.formas.minus+' en minúsculas)</small>':'')+'</td>':'')+'</tr>'; }).join('')+'</tbody></table></div>';
  if(porPalabra){
    const tipos={}; lista.forEach(x=>Object.keys(x.err).forEach(c=>{ const t=tipos[c]||(tipos[c]={n:0,ej:[]}); t.n+=x.err[c]; if(t.ej.length<4) t.ej.push(x.k); }));
    const ks=Object.keys(tipos).sort((p,q)=>tipos[q].n-tipos[p].n);
    if(ks.length) h+='<p><b>Qué tipo de error comete más</b></p><ol class="ref4-err">'+ks.map(c=>'<li><b>'+esc(nombreError(a.id,c))+'</b> <small>('+tipos[c].n+'; en '+esc(tipos[c].ej.join(', '))+')</small></li>').join('')+'</ol>';
  }else{
    const mem=evs.filter(e=>e.act===a.id&&e.tipo==='paso'&&(e.error==='CUENTA_TODOS'||e.error==='REPITE_ANTERIOR')).length;
    if(mem) h+='<p><small>Señales de que contesta sin leer (contó todos o repitió la respuesta anterior): <b>'+mem+'</b>.</small></p>';
  }
  return h;
}
const tituloAct=id=>{ if(id==='menu') return '🏠 Menú'; const a=MATE.actividades.find(x=>x.id===id); return a?a.icono+' '+a.titulo:id; };
/* Visitas por dispositivo: todos sus eventos en orden (un tramo cuenta desde su inicio hasta su fin); 15 minutos sin
   ningún evento cortan la visita. Duración = del primero al último. */
const CORTE=15*60000;
function visitas(evs){
  const porD={}; evs.forEach(e=>{ if(!e.dispositivo||!e.ts) return; const a=+e.inicio||e.ts, b=+e.fin||e.ts; (porD[e.dispositivo]=porD[e.dispositivo]||[]).push({a,b,e}); });
  const res=[];
  Object.keys(porD).forEach(d=>{ let v=null; porD[d].sort((x,y)=>x.a-y.a).forEach(x=>{
    if(!v||x.a-v.hasta>CORTE){ v={disp:d,desde:x.a,hasta:x.b,perfiles:new Set(),entradas:0,recargas:0,cambios:0,ejercicios:0}; res.push(v); }
    v.hasta=Math.max(v.hasta,x.b); if(x.e.perfil) v.perfiles.add(x.e.perfil);
    if(x.e.tipo==='conexion'){ if(x.e.paso==='recarga') v.recargas++; else v.entradas++; }
    else if(x.e.tipo==='perfil'&&x.e.paso==='cambio') v.cambios++;
    else if(x.e.tipo==='paso'&&x.e.intento>=1) v.ejercicios++;
  }); });
  return res.sort((x,y)=>y.desde-x.desde);
}
function item(v){
  let o=v; if(typeof o==='string'){ if(!o) return ''; try{ o=JSON.parse(o); }catch(e){ return o; } }
  if(!o||typeof o!=='object') return String(o);
  if(o.cuenta) return o.cuenta;
  if(o.palabra) return (o.img?o.img+' ':'')+o.palabra;
  if(o.texto) return o.texto;
  if(o.desde!==undefined&&o.salto!==undefined) return o.desde+(o.salto>0?' + ':' − ')+Math.abs(o.salto);
  return Object.keys(o).map(k=>k+': '+(typeof o[k]==='object'?JSON.stringify(o[k]):o[k])).join(', ').slice(0,90);
}

function render(cont){
  const est=MATE.nube.estado(), url=MATE.global.get('nube.url',null);
  cont.innerHTML='<h2>☁️ Registro en la nube</h2>'+
    (MATE.nube.url()?'':'<p class="msg bad">Todavía no está conectada la planilla. Seguí los pasos de nube/LEEME.md; mientras tanto los ejercicios se guardan en este dispositivo y se mandan después.</p>')+
    '<details class="ref4-act"><summary><b>Este dispositivo</b>&nbsp;· '+esc(MATE.dispositivo.nombre)+' · '+MATE.nube.pendientes()+' sin enviar</summary>'+
    '<label class="nube-campo">Nombre del dispositivo <input id="nb-nombre" value="'+esc(MATE.dispositivo.nombre)+'" maxlength="30"></label>'+
    '<p><small>Último envío: '+fecha(est.ultimoEnvio)+(est.ultimoError?' · último error: '+esc(est.ultimoError)+' ('+fecha(est.errorTs)+')':'')+'</small></p>'+
    '<label class="nube-campo">Dirección de la planilla (solo si no está en el código) <input id="nb-url" value="'+esc(url||'')+'" placeholder="https://script.google.com/macros/s/…/exec"></label>'+
    '<div class="row"><button class="btn" id="nb-guardar">Guardar</button><button class="btn" id="nb-enviar">Enviar ahora</button><button class="btn" id="nb-hist">Subir historial de este dispositivo</button></div><div class="msg" id="nb-msg"></div></details>'+
    '<div class="nube-clave"><label class="nube-campo">Clave de lectura <input id="nb-clave" type="password" value="'+esc(MATE.global.get('nube.clave',''))+'" autocomplete="off"></label>'+
    '<button class="btn main" id="nb-cargar">Cargar registro</button></div><div class="msg" id="nb-msg2"></div><div id="nb-reg"></div>';
  const $=s=>cont.querySelector(s), msg=(t,ok,id)=>{ const m=$(id||'#nb-msg'); m.className='msg '+(ok?'ok':'bad'); m.textContent=t; };
  $('#nb-guardar').onclick=()=>{ MATE.dispositivo.renombrar($('#nb-nombre').value); const u=$('#nb-url').value.trim(); if(u) MATE.global.set('nube.url',u); else localStorage.removeItem('mate.global.nube.url'); msg('Guardado.',true); };
  $('#nb-enviar').onclick=async()=>{ if(!MATE.nube.url()) return msg('Falta la dirección de la planilla.'); msg('Enviando…',true); const ok=await MATE.nube.vaciar(); ok?msg('Listo: no queda nada pendiente.',true):msg('No se pudo enviar: '+(MATE.nube.estado().ultimoError||'')); };
  $('#nb-hist').onclick=()=>{ const n=MATE.nube.subirHistorial(true); msg(n?n+' ejercicios viejos en la cola para enviar.':'No hay ejercicios viejos nuevos para subir.',true); };
  $('#nb-cargar').onclick=async()=>{
    const c=$('#nb-clave').value.trim(); MATE.global.set('nube.clave',c); msg('Cargando…',true,'#nb-msg2');
    try{ datos=await MATE.nube.leer(c); datos.eventos.forEach(e=>{ const x=objeto(e.extra); Object.keys(x).forEach(k=>{ if(e[k]===undefined||e[k]==='') e[k]=x[k]; }); e.ts=+e.ts; e.okB=e.ok===true||e.ok==='true'; e.intento=+e.intento||0; }); msg(datos.eventos.length+' registros.',true,'#nb-msg2'); cuantos=100; pintar($('#nb-reg')); }
    catch(err){ msg(String(err.message||err),false,'#nb-msg2'); }
  };
  if(datos) pintar($('#nb-reg'));
}

function filtrados(){
  const desde=filtro.dias?Date.now()-filtro.dias*86400000:0;
  return datos.eventos.filter(e=>e.ts>=desde&&(!filtro.perfil||e.perfil===filtro.perfil)&&(!filtro.disp||e.dispositivo===filtro.disp)&&(!filtro.act||e.act===filtro.act));
}
function pintar(el){
  const nomP=id=>{ const p=datos.perfiles.find(x=>x.id===id)||MATE.perfiles.find(x=>x.id===id); return p?(p.avatar?p.avatar+' ':'')+p.nombre:id; };
  const nomD=id=>{ const d=datos.dispositivos.find(x=>x.id===id); return d?d.nombre:id; };
  const uniq=k=>[...new Set(datos.eventos.map(e=>e[k]).filter(Boolean))];
  const sel=(id,val,ops)=>'<select id="'+id+'">'+ops.map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===val?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
  const evs=filtrados(), pasos=evs.filter(e=>e.tipo==='paso'&&e.intento>=1), errs=pasos.filter(e=>!e.okB).sort((a,b)=>b.ts-a.ts);
  let h='<div class="ref4-acc nube-filtros">'+
    sel('f-perfil',filtro.perfil,[['','Todos los perfiles']].concat(uniq('perfil').map(p=>[p,nomP(p)])))+
    sel('f-disp',filtro.disp,[['','Todos los dispositivos']].concat(uniq('dispositivo').map(d=>[d,nomD(d)])))+
    sel('f-act',filtro.act,[['','Todas las actividades']].concat(uniq('act').map(a=>[a,tituloAct(a)])))+
    sel('f-dias',filtro.dias,[['7','Últimos 7 días'],['30','Últimos 30 días'],['90','Últimos 90 días'],['','Todo']])+
    '<button class="btn" id="f-csv">⬇ CSV</button><button class="btn" id="f-json">⬇ JSON</button></div>';
  // resumen por perfil y actividad
  const grupos={}; pasos.forEach(e=>{ const k=e.perfil+'|'+e.act, g=grupos[k]||(grupos[k]={perfil:e.perfil,act:e.act,n:0,p1:0,ok1:0,err:{},ayuda:0,dias:new Set()}); g.n++; g.dias.add(new Date(e.ts).toDateString()); if(e.intento===1){ g.p1++; if(e.okB) g.ok1++; } if(!e.okB&&e.error) g.err[e.error]=(g.err[e.error]||0)+1; if(e.ayuda&&e.ayuda!=='ninguna') g.ayuda++; });
  const gs=Object.values(grupos).sort((a,b)=>(a.perfil+a.act).localeCompare(b.perfil+b.act));
  h+='<h3>Resumen</h3>'+(gs.length?'<div class="nube-scroll"><table class="fr4-mapa"><thead><tr><th>Perfil</th><th>Actividad</th><th>Días</th><th>Intentos</th><th>Bien al 1er intento</th><th>Errores más frecuentes</th></tr></thead><tbody>'+gs.map(g=>{
    const top=Object.keys(g.err).sort((a,b)=>g.err[b]-g.err[a]).slice(0,3).map(c=>esc(nombreError(g.act,c))+' <small>('+g.err[c]+')</small>').join('<br>');
    return '<tr><td>'+esc(nomP(g.perfil))+'</td><td>'+esc(tituloAct(g.act))+'</td><td>'+g.dias.size+'</td><td>'+g.n+'</td><td>'+(g.p1?Math.round(100*g.ok1/g.p1)+' %':'—')+'</td><td style="text-align:left">'+(top||'—')+'</td></tr>'; }).join('')+'</tbody></table></div>':'<p class="sub">No hay ejercicios en este filtro.</p>');
  // análisis por palabra o por pregunta (lectura y escritura)
  MATE.actividades.filter(a=>a.analisis&&(!filtro.act||filtro.act===a.id)).forEach(a=>{ h+=analisis(evs,a); });
  // tiempo por dispositivo (visitas)
  const vs=visitas(evs), dur=ms=>{ const m=Math.round(ms/60000); return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min'; }, hora=t=>new Date(t).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const totD={}; vs.forEach(v=>{ totD[v.disp]=(totD[v.disp]||0)+v.hasta-v.desde; });
  h+='<h3>Tiempo por dispositivo</h3>'+(vs.length?'<p><small>'+Object.keys(totD).map(d=>esc(nomD(d))+': <b>'+dur(totD[d])+'</b>').join(' · ')+'</small></p><div class="nube-scroll"><table class="fr4-mapa nube-err"><thead><tr><th>Día</th><th>Dispositivo</th><th>Desde–hasta</th><th>Duración</th><th>Perfiles</th><th>Entradas</th><th>Recargas</th><th>Cambios de perfil</th><th>Ejercicios</th></tr></thead><tbody>'+
    vs.slice(0,60).map(v=>'<tr><td>'+new Date(v.desde).toLocaleDateString('es-AR',{dateStyle:'short'})+'</td><td>'+esc(nomD(v.disp))+'</td><td>'+hora(v.desde)+'–'+hora(v.hasta)+'</td><td>'+dur(v.hasta-v.desde)+'</td><td style="white-space:normal">'+([...v.perfiles].map(p=>esc(nomP(p))).join(', ')||'—')+'</td><td>'+v.entradas+'</td><td>'+v.recargas+'</td><td>'+v.cambios+'</td><td>'+v.ejercicios+'</td></tr>').join('')+
    '</tbody></table></div><p><small>Una visita se corta con 15 minutos sin entradas ni ejercicios.</small></p>':'<p class="sub">No hay entradas en este filtro.</p>');
  // lista de errores
  h+='<h3>Cada error ('+errs.length+')</h3>'+(errs.length?'<div class="nube-scroll"><table class="fr4-mapa nube-err"><thead><tr><th>Fecha</th><th>Perfil</th><th>Dispositivo</th><th>Actividad</th><th>Paso</th><th>Ejercicio</th><th>Esperado</th><th>Puso</th><th>Error</th></tr></thead><tbody>'+
    errs.slice(0,cuantos).map(e=>'<tr><td>'+fecha(e.ts)+'</td><td>'+esc(nomP(e.perfil))+'</td><td>'+esc(nomD(e.dispositivo))+'</td><td>'+esc(tituloAct(e.act))+'</td><td>'+esc(e.paso)+(e.intento>1?' <small>(intento '+e.intento+')</small>':'')+'</td><td>'+esc(item(e.item))+'</td><td>'+esc(e.esperado)+'</td><td>'+esc(e.respuesta)+'</td><td>'+esc(e.error?nombreError(e.act,e.error):'—')+(e.ayuda&&e.ayuda!=='ninguna'?' <small>(con ayuda)</small>':'')+'</td></tr>').join('')+
    '</tbody></table></div>'+(errs.length>cuantos?'<div class="row"><button class="btn" id="f-mas">Ver más</button></div>':''):'<p class="sub">¡Sin errores en este filtro!</p>');
  el.innerHTML=h;
  const q=s=>el.querySelector(s);
  [['f-perfil','perfil'],['f-disp','disp'],['f-act','act'],['f-dias','dias']].forEach(([id,k])=>q('#'+id).onchange=e=>{ filtro[k]=e.target.value; cuantos=100; pintar(el); });
  const m=q('#f-mas'); if(m) m.onclick=()=>{ cuantos+=200; pintar(el); };
  q('#f-csv').onclick=()=>bajar(csv(evs.map(e=>Object.assign({},e,{perfilNombre:nomP(e.perfil),dispositivoNombre:nomD(e.dispositivo),actividad:tituloAct(e.act),errorNombre:e.error?nombreError(e.act,e.error):''}))),'text/csv','csv');
  q('#f-json').onclick=()=>bajar(JSON.stringify(evs,null,1),'application/json','json');
}
function csv(lista){
  const cols=['fecha','perfilNombre','dispositivoNombre','actividad','tema','paso','intento','ok','error','errorNombre','esperado','respuesta','ms','ayuda','item','nivel','tipo','id'];
  const c=v=>{ const s=String(v===undefined||v===null?'':v); return /[",;\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  return '﻿'+cols.join(';')+'\n'+lista.map(e=>cols.map(k=>c(k==='item'?item(e.item):e[k])).join(';')).join('\n');
}
function bajar(texto,tipo,ext){
  const b=new Blob([texto],{type:tipo}), u=URL.createObjectURL(b), a=document.createElement('a');
  a.href=u; a.download='matematica-registro-'+new Date().toISOString().slice(0,10)+'.'+ext; document.body.appendChild(a); a.click(); setTimeout(()=>{ a.remove(); URL.revokeObjectURL(u); },500);
}
MATE.panelNube={render,item,csv};
})();
