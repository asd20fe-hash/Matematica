/* Matemática — núcleo compartido. Único global: MATE. Script clásico (sin módulos).
   Historial de cambios
   v2.5  Modo sin conexión
     + Registra el service worker (sw.js, en la raíz) con http/https: la app queda guardada y anda sin internet.
     + Una vez cada 6 h, con internet, le pide que vuelva a bajar todo (mate.global.offline.ts).
     + MATE.offline: {disponible(), listo(), estado()} para mostrarlo en el shell.
   v2.4  Pantalla completa
     + MATE.pantalla: botón ⛶ que core.js agrega solo al lado del botón de tema (#tema o #themeBtn) en todas las páginas.
       Queda prendida en mate.global.pantalla: al abrir otra sección vuelve a pantalla completa con el primer toque
       (el navegador la apaga al cambiar de página y solo deja pedirla con un toque). Si se sale con el gesto de
       "atrás" del sistema, se apaga. Se esconde si la app está instalada (display-mode) y no aparece sin la API.
   v2.3  Perfiles nuevos y registro en la nube
     + MATE.perfilesNuevos: perfiles creados desde el menú (mate.global.perfiles), con id único para no mezclarse.
     + MATE.puedeVer(actividad, perfil): por grados (o por ids de perfiles, como antes).
     + MATE.dispositivo: id y nombre de este dispositivo (mate.global.dispositivo).
     + MATE.nube: cada ejercicio se encola (mate.global.nube.cola) y se manda a la planilla de Google (Apps Script);
       si no hay internet, se manda después. leer(clave) trae el registro completo para Ajustes de padres.
     + MATE.ejercicio(act, ev): registro común de ejercicios para cualquier actividad (lo usan la Tabla del 100 y REF4_EV).
   v2.2  Fondo global
*/
(function(){
'use strict';
const VERSION='2.5';
const MATE=window.MATE=window.MATE||{};
MATE.version=VERSION;
MATE.perfiles=MATE.perfiles||[];
MATE.actividades=MATE.actividades||[];

/* ==== LOG Y VERSIÓN ==== */
MATE.log=(tag,...a)=>console.log('[Mate v'+VERSION+']['+tag+']',...a);
MATE.ver=el=>{ if(el) el.textContent='v'+VERSION; };

/* ==== RUTAS ==== */
// Raíz del proyecto: dos niveles arriba de core/core.js
const me=document.currentScript;
const RAIZ=me&&me.src?new URL('../',me.src).href:location.href;
MATE.raiz=RAIZ;

/* ==== GUARDADO ==== */
const ls={
  get(k,d){ try{ const v=localStorage.getItem(k); return v===null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
MATE.global={ get:(k,d)=>ls.get('mate.global.'+k,d), set:(k,v)=>ls.set('mate.global.'+k,v) };

/* ==== URL (perfil y tema viajan también por ?p=&t=) ==== */
const qs=new URLSearchParams(location.search);

/* ==== TEMA ==== */
const root=document.documentElement;
MATE.tema={
  get(){ return root.dataset.theme||null; },
  set(t){
    if(t==='dark'||t==='light'){ root.dataset.theme=t; MATE.global.set('theme',t); }
    else { delete root.dataset.theme; ls.del('mate.global.theme'); }
    MATE.log('tema',t);
  },
  oscuro(){ return root.dataset.theme?root.dataset.theme==='dark':!!(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches); },
  alternar(){ const t=MATE.tema.oscuro()?'light':'dark'; MATE.tema.set(t); return t; }
};
{ const t=qs.get('t')||MATE.global.get('theme',null); if(t==='dark'||t==='light'){ root.dataset.theme=t; if(qs.get('t')) MATE.global.set('theme',t); } }

/* ==== FONDO (global para todos los perfiles y actividades) ==== */
// mate.global.fondo; viaja también por ?f= como el tema. "aurora" es el de base (sin data-bg).
const FONDOS=[
  {id:'aurora',nombre:'Aurora',muestra:'linear-gradient(135deg,#ff8cc6,#a78bfa,#5ee0c4)'},
  {id:'oceano',nombre:'Océano',muestra:'linear-gradient(135deg,#38bdf8,#2563eb,#2dd4bf)'},
  {id:'bosque',nombre:'Bosque',muestra:'linear-gradient(135deg,#86efac,#16a34a,#facc15)'},
  {id:'atardecer',nombre:'Atardecer',muestra:'linear-gradient(135deg,#fdba74,#fb7185,#c084fc)'},
  {id:'espacio',nombre:'Espacio',muestra:'radial-gradient(circle at 30% 30%,#fff 0 8%,transparent 10%),linear-gradient(135deg,#1e1b4b,#4c1d95)'}
];
const fondoOk=f=>FONDOS.some(x=>x.id===f);
let fondo='aurora';
const pintaFondo=()=>{ if(fondo==='aurora') delete root.dataset.bg; else root.dataset.bg=fondo; };
const montaFondo=()=>{
  if(document.getElementById('mate-fondo')) return;
  const d=document.createElement('div'); d.id='mate-fondo'; d.setAttribute('aria-hidden','true');
  d.innerHTML='<div class="stars"></div><div class="stars s2"></div><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div><div class="blob b5"></div>';
  document.body.insertBefore(d,document.body.firstChild);
};
MATE.fondo={
  lista:FONDOS,
  get:()=>fondo,
  set(f){ if(!fondoOk(f)) f='aurora'; fondo=f; pintaFondo(); MATE.global.set('fondo',f); MATE.log('fondo',f); },
  // muestra un menú flotante junto al botón para elegir el fondo
  menu(btn){
    const viejo=document.getElementById('mate-fondos'); if(viejo){ viejo.remove(); return; }
    const m=document.createElement('div'); m.id='mate-fondos'; m.setAttribute('role','menu');
    m.innerHTML='<b>Fondo</b>'+FONDOS.map(x=>'<button role="menuitemradio" data-f="'+x.id+'" class="'+(x.id===fondo?'on':'')+'" aria-checked="'+(x.id===fondo)+'"><i class="mate-swatch" style="background:'+x.muestra+'"></i>'+x.nombre+'</button>').join('');
    document.body.appendChild(m);
    const r=btn.getBoundingClientRect(), w=m.offsetWidth;
    m.style.top=Math.round(r.bottom+8)+'px'; m.style.left=Math.round(Math.max(8,Math.min(innerWidth-w-8,r.right-w)))+'px';
    const cerrar=()=>{ m.remove(); document.removeEventListener('pointerdown',fuera,true); document.removeEventListener('keydown',tecla); };
    const fuera=e=>{ if(!m.contains(e.target)&&!btn.contains(e.target)) cerrar(); };
    const tecla=e=>{ if(e.key==='Escape'){ cerrar(); btn.focus(); } };
    m.onclick=e=>{ const b=e.target.closest('[data-f]'); if(!b) return; MATE.fondo.set(b.dataset.f); cerrar(); };
    document.addEventListener('pointerdown',fuera,true); document.addEventListener('keydown',tecla);
    const on=m.querySelector('.on'); if(on) on.focus();
  }
};
{ const f=qs.get('f')||MATE.global.get('fondo',null); if(fondoOk(f)){ fondo=f; if(qs.get('f')) MATE.global.set('fondo',f); } pintaFondo(); }
if(document.body) montaFondo(); else document.addEventListener('DOMContentLoaded',montaFondo);

/* ==== PERFIL ==== */
let perfilId=qs.get('p')||MATE.global.get('perfil',null);
MATE.perfil=()=>MATE.perfiles.find(p=>p.id===perfilId)||null;
MATE.setPerfil=id=>{ perfilId=id||null; if(id) MATE.global.set('perfil',id); else ls.del('mate.global.perfil'); MATE.log('perfil',id); };
// Perfiles creados en este dispositivo (los de la familia están en perfiles.js, que suma estos a MATE.perfiles).
const COLORES=['#8b5cf6','#f97316','#16a34a','#e11d48','#0284c7','#ca8a04','#db2777','#0d9488'];
MATE.perfilesNuevos={
  lista:()=>MATE.global.get('perfiles',[]),
  avatares:['🐼','🐯','🐸','🐙','🦖','🐝','🐬','🦁','🐨','🐧','🐱','🐶','🐰','🦋','🐢','🦉','🚀','⚽','🎸','🌈','⭐','🍀','🌻','🐳'],
  crear(nombre,avatar,grado){
    const base=String(nombre).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'').slice(0,12)||'perfil';
    const p={id:base+'-'+Math.random().toString(36).slice(2,6),nombre:String(nombre).trim().slice(0,20),avatar,grado,color:COLORES[Math.floor(Math.random()*COLORES.length)],nuevo:true,creado:Date.now()};
    const l=MATE.perfilesNuevos.lista(); l.push(p); MATE.global.set('perfiles',l); MATE.perfiles.push(p); MATE.log('perfil','creado',p.id); return p;
  },
  borrar(id){ MATE.global.set('perfiles',MATE.perfilesNuevos.lista().filter(p=>p.id!==id)); const i=MATE.perfiles.findIndex(p=>p.id===id&&p.nuevo); if(i>=0) MATE.perfiles.splice(i,1); MATE.log('perfil','borrado',id); }
};
// ¿Este perfil ve esta actividad? Por grados; si la actividad no tiene grados, por ids de perfiles (como antes).
MATE.puedeVer=(a,p)=>!!p&&(a.grados?a.grados.indexOf(p.grado)>=0:(!a.perfiles||a.perfiles.indexOf(p.id)>=0));

/* ==== GUARDADO POR ACTIVIDAD ==== */
// mate.<perfil>.<actividad>.<clave>; sin perfil activo no guarda nada
MATE.store=act=>{
  const k=c=>'mate.'+perfilId+'.'+act+'.'+c;
  return {
    get:(c,d)=>perfilId?ls.get(k(c),d):d,
    set:(c,v)=>{ if(perfilId) ls.set(k(c),v); }
  };
};

/* ==== NAVEGACIÓN ==== */
let saliendo=false;   // al navegar, el navegador sale de pantalla completa: eso no cuenta como apagarla
const query=()=>{ const p=new URLSearchParams(); if(perfilId) p.set('p',perfilId); const t=MATE.tema.get(); if(t) p.set('t',t); if(fondo!=='aurora') p.set('f',fondo); const s=p.toString(); return s?'?'+s:''; };
MATE.irMenu=()=>{ saliendo=true; location.href=RAIZ+'index.html'+query(); };
MATE.abrir=act=>{ const a=typeof act==='string'?MATE.actividades.find(x=>x.id===act):act; if(!a) return MATE.log('abrir','actividad inexistente',act); saliendo=true; location.href=RAIZ+a.ruta+query(); };

/* ==== PIN (candado para chicos, no seguridad real) ==== */
const hash=s=>{ let h=5381; for(const c of String(s)) h=((h*33)^c.charCodeAt(0))>>>0; return h.toString(36); };
MATE.pin={
  check(p){ const g=MATE.global.get('pin',null); return hash(p)===(g||hash('1234')); },
  set(p){ MATE.global.set('pin',hash(p)); MATE.log('pin','actualizado'); }
};

/* ==== DISPOSITIVO ==== */
// Id al azar y nombre (editable en Ajustes de padres), para separar los resultados por dispositivo.
MATE.dispositivo=(()=>{
  let d=MATE.global.get('dispositivo',null);
  if(!d||!d.id){
    const ua=navigator.userAgent, tipo=/iPad/.test(ua)?'iPad':/iPhone/.test(ua)?'iPhone':/Android/.test(ua)?(/Mobile/.test(ua)?'Teléfono Android':'Tablet Android'):/Windows/.test(ua)?'PC Windows':/Mac/.test(ua)?'Mac':'Dispositivo';
    const id='d'+Math.random().toString(36).slice(2,8); d={id,nombre:tipo+' '+id.slice(-3)}; MATE.global.set('dispositivo',d);
  }
  return d;
})();
MATE.dispositivo.renombrar=n=>{ MATE.dispositivo.nombre=String(n).trim().slice(0,30)||MATE.dispositivo.nombre; MATE.global.set('dispositivo',{id:MATE.dispositivo.id,nombre:MATE.dispositivo.nombre}); };

/* ==== NUBE: registro de ejercicios en una planilla de Google (Apps Script) ==== */
// Dirección del script ("Implementar > Aplicación web"). En Ajustes de padres se puede cambiar por dispositivo.
const NUBE_URL='https://script.google.com/macros/s/AKfycbwzIEfZznimkmCb_QHrFQAC_PVzYblFeTnGr3ptAka-tQoCIEukFxhJ89wPLlnsnNVY/exec';
const COLA='nube.cola', MAX_COLA=20000, LOTE=300;
let timerNube=null, enviando=false;
const guardaCola=c=>{ try{ localStorage.setItem('mate.global.'+COLA,JSON.stringify(c)); }catch(err){ MATE.log('nube','cola llena: descarto la mitad más vieja'); c.splice(0,c.length>>1); ls.set('mate.global.'+COLA,c); } };
MATE.nube={
  url:()=>MATE.global.get('nube.url',null)||NUBE_URL,
  // Id estable: el mismo si el evento se manda en vivo o desde el historial (la planilla descarta los repetidos).
  idEvento:e=>hash([MATE.dispositivo.id,e.perfil,e.act,e.ts,e.sesion||'',e.tipo||'',e.paso||'',e.intento||0,e.respuesta===undefined?'':String(e.respuesta)].join('|'))+e.ts.toString(36),
  enviar(e){
    const p=MATE.perfiles.find(x=>x.id===e.perfil)||{};
    const r=Object.assign({},e,{id:e.id||MATE.nube.idEvento(e),perfilNombre:p.nombre||e.perfil,dispositivo:MATE.dispositivo.id,dispositivoNombre:MATE.dispositivo.nombre});
    const cola=MATE.global.get(COLA,[]); cola.push(r); if(cola.length>MAX_COLA) cola.splice(0,cola.length-MAX_COLA);
    guardaCola(cola); MATE.nube.agendar(3000);
  },
  pendientes:()=>MATE.global.get(COLA,[]).length,
  estado:()=>MATE.global.get('nube.estado',{}),
  agendar(ms){ if(!MATE.nube.url()) return; clearTimeout(timerNube); timerNube=setTimeout(()=>MATE.nube.vaciar(),ms||0); },
  // Manda la cola de a lotes; lo que la planilla confirma sale de la cola.
  async vaciar(){
    const url=MATE.nube.url(); if(!url||enviando||navigator.onLine===false) return false;
    enviando=true; let ok=true;
    try{
      for(;;){
        const cola=MATE.global.get(COLA,[]); if(!cola.length) break;
        const lote=cola.slice(0,LOTE), ids=new Set(lote.map(e=>e.id));
        const perfiles=[...new Set(lote.map(e=>e.perfil))].map(id=>{ const p=MATE.perfiles.find(x=>x.id===id); return p?{id:p.id,nombre:p.nombre,avatar:p.avatar,grado:p.grado,color:p.color}:{id}; });
        const res=await fetch(url,{method:'POST',body:JSON.stringify({accion:'guardar',eventos:lote,perfiles,dispositivo:{id:MATE.dispositivo.id,nombre:MATE.dispositivo.nombre}})});
        const j=await res.json(); if(!j.ok) throw new Error(j.error||'respuesta inválida');
        guardaCola(MATE.global.get(COLA,[]).filter(e=>!ids.has(e.id)));
        MATE.global.set('nube.estado',{ultimoEnvio:Date.now(),enviados:(MATE.nube.estado().enviados||0)+lote.length});
        MATE.log('nube','enviados',lote.length,'nuevos',j.nuevos);
      }
    }catch(err){ ok=false; MATE.global.set('nube.estado',Object.assign(MATE.nube.estado(),{ultimoError:String(err.message||err),errorTs:Date.now()})); MATE.log('nube','no se pudo enviar',String(err)); MATE.nube.agendar(60000); }
    enviando=false; return ok;
  },
  // Trae todo el registro (para Ajustes de padres). clave: la de lectura que está en el script.
  async leer(clave){
    const url=MATE.nube.url(); if(!url) throw new Error('Falta la dirección de la planilla.');
    const res=await fetch(url+(url.indexOf('?')<0?'?':'&')+'accion=leer&clave='+encodeURIComponent(clave||''));
    const j=await res.json(); if(!j.ok) throw new Error(j.error==='clave'?'La clave de lectura no es correcta.':(j.error||'Error al leer.'));
    return j;
  },
  // Encola (una sola vez por dispositivo) los eventos viejos guardados acá: mate.<perfil>.<act>.eventos.
  subirHistorial(forzar){
    if(!forzar&&MATE.global.get('nube.historial',false)) return 0;
    const ya=new Set(MATE.global.get(COLA,[]).map(e=>e.id)), nuevos=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i), m=/^mate\.([^.]+)\.(.+)\.eventos$/.exec(k); if(!m||m[1]==='global') continue;
      let evs; try{ evs=JSON.parse(localStorage.getItem(k)); }catch(e){ continue; } if(!Array.isArray(evs)) continue;
      evs.forEach(e=>{ if(!e||!e.ts) return; const r=Object.assign({},e,{perfil:e.perfil||m[1],act:e.act||m[2]}); r.id=MATE.nube.idEvento(r); if(!ya.has(r.id)){ ya.add(r.id); nuevos.push(r); } });
    }
    nuevos.sort((a,b)=>a.ts-b.ts);
    const cola=MATE.global.get(COLA,[]); nuevos.forEach(e=>{ const p=MATE.perfiles.find(x=>x.id===e.perfil)||{}; cola.push(Object.assign(e,{perfilNombre:p.nombre||e.perfil,dispositivo:MATE.dispositivo.id,dispositivoNombre:MATE.dispositivo.nombre})); });
    guardaCola(cola); MATE.global.set('nube.historial',true); MATE.log('nube','historial encolado',nuevos.length); MATE.nube.agendar(500); return nuevos.length;
  }
};
// Registro común de un ejercicio: {tipo:'paso', paso, intento, item, esperado, respuesta, ok, error, ms, ayuda, ...}.
MATE.ejercicio=(act,ev)=>{ const p=MATE.perfil(); if(!p) return null; const e=Object.assign({act,perfil:p.id,ts:Date.now()},ev); MATE.nube.enviar(e); return e; };
window.addEventListener('online',()=>MATE.nube.agendar(1000));
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&MATE.nube.pendientes()) MATE.nube.vaciar(); });
if(MATE.nube.url()) setTimeout(()=>{ MATE.nube.subirHistorial(); MATE.nube.vaciar(); },2500);

/* ==== PANTALLA COMPLETA ==== */
MATE.pantalla=(()=>{
  const d=document, el=d.documentElement;
  const soporta=!!(el.requestFullscreen||el.webkitRequestFullscreen);
  const activa=()=>!!(d.fullscreenElement||d.webkitFullscreenElement);
  // app instalada (o ventana en pantalla completa sin el documento): no hace falta el botón. Se mira en el momento,
  // porque al cargar una página nueva la ventana puede estar todavía saliendo de la pantalla completa anterior.
  const mm=q=>!!(window.matchMedia&&matchMedia(q).matches);
  const instalada=()=>mm('(display-mode: standalone)')||(mm('(display-mode: fullscreen)')&&!activa());
  const pedir=()=>{ try{ const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el,{navigationUI:'hide'}); if(r&&r.catch) r.catch(e=>MATE.log('pantalla','no se pudo',e.message)); }catch(e){ MATE.log('pantalla','no se pudo',e.message); } };
  const salir=()=>{ try{ (d.exitFullscreen||d.webkitExitFullscreen).call(d); }catch(e){} };
  let btn=null;
  const pinta=()=>{ if(!btn) return; const on=activa(); btn.hidden=instalada(); btn.textContent=on?'🗗':'⛶'; btn.title=on?'Salir de pantalla completa':'Pantalla completa'; btn.setAttribute('aria-pressed',on); };
  const P={
    disponible:soporta, activa, instalada,
    alternar(){ if(activa()){ MATE.global.set('pantalla',false); salir(); } else { MATE.global.set('pantalla',true); pedir(); } },
    boton(junto){ if(!P.disponible||!junto||d.getElementById('pantallaBtn')) return null;
      btn=d.createElement('button'); btn.type='button'; btn.id='pantallaBtn'; btn.className=junto.className;
      btn.onclick=P.alternar; junto.parentNode.insertBefore(btn,junto); pinta(); return btn; }
  };
  if(P.disponible){
    const ev=()=>{ pinta(); if(!activa()&&!saliendo&&!d.hidden) MATE.global.set('pantalla',false); };
    d.addEventListener('fullscreenchange',ev); d.addEventListener('webkitfullscreenchange',ev);
    window.addEventListener('pagehide',()=>{ saliendo=true; }); window.addEventListener('beforeunload',()=>{ saliendo=true; });
    // si estaba prendida, se vuelve a pedir con el primer toque o tecla (el navegador exige un gesto)
    const reanudar=()=>{ if(MATE.global.get('pantalla',false)&&!activa()&&!instalada()) pedir(); d.removeEventListener('pointerup',reanudar,true); d.removeEventListener('keydown',reanudar,true); };
    if(MATE.global.get('pantalla',false)){ d.addEventListener('pointerup',reanudar,true); d.addEventListener('keydown',reanudar,true); }
    const poner=()=>{ P.boton(d.getElementById('tema')||d.getElementById('themeBtn')); setTimeout(pinta,1500); };
    if(window.matchMedia) ['(display-mode: fullscreen)','(display-mode: standalone)'].forEach(q=>{ const m=matchMedia(q); if(m.addEventListener) m.addEventListener('change',pinta); });
    if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',poner); else poner();
  }
  return P;
})();

/* ==== SIN CONEXIÓN (service worker) ==== */
MATE.offline=(()=>{
  const sw=navigator.serviceWorker, O={
    disponible:()=>!!sw&&/^https?:$/.test(location.protocol),
    listo:()=>!!(sw&&sw.controller),
    estado:()=>({disponible:O.disponible(),listo:O.listo(),enLinea:navigator.onLine,ultima:MATE.global.get('offline.ts',0)})
  };
  if(!O.disponible()) return O;
  const pedir=reg=>{ const w=reg.active||(sw.controller); if(!w||!navigator.onLine) return; if(Date.now()-MATE.global.get('offline.ts',0)<6*3600e3) return;
    MATE.global.set('offline.ts',Date.now()); w.postMessage({tipo:'actualizar'}); MATE.log('offline','actualizando la copia guardada'); };
  sw.addEventListener('message',e=>{ if(e.data&&e.data.tipo==='actualizado') MATE.log('offline','copia al día',e.data.ok,'archivos'); });
  window.addEventListener('load',()=>{
    sw.register(RAIZ+'sw.js').then(reg=>{ MATE.log('offline','service worker',reg.active?'activo':'instalando'); if(reg.active) pedir(reg); else MATE.global.set('offline.ts',Date.now()); })
      .catch(e=>MATE.log('offline','no se pudo registrar',e.message));
  });
  return O;
})();

MATE.log('core','listo');
})();
