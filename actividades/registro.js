/* Registro de actividades. Cargar después de core.js y perfiles.js.
   ruta: relativa a la raíz del proyecto. grados: qué grados la ven (cualquier perfil de ese grado, también los nuevos).
   stats (opcional): función que devuelve estadísticas.
   teoria (opcional): pantalla de teoría, sin rondas ni niveles; no aparece en el panel de refuerzo de 4to.
   errores (opcional): {CODIGO: 'nombre para padres'} de los errores que registra la actividad (los de 4to están en
   REF4_PANEL.ERRORES y REF4_FR.ERRORES). */
(function(){
'use strict';
MATE.actividades=[
  {id:'tabla100',titulo:'Saltos en la Tabla del 100',descripcion:'Sumá y restá saltando en la tabla.',icono:'🔢',grados:['1ro'],ruta:'actividades/1ro-tabla100/index.html',version:'1.10',
   errores:{SALTO_DIRECCION:'Saltó para el lado contrario (sumó en vez de restar o al revés)',SALTO_FILAS:'Saltó una cantidad de filas equivocada',SALTO_COLUMNA:'Se salió de la columna (mezcló saltos de 10 con saltos de 1)',
     DIEZ_COMO_UNO:'Escribió los dieces sin el cero (3 en vez de 30)',DESARME_DIECES:'Desarmó mal los dieces',DESARME_UNOS:'Desarmó mal los unos',AGRUPA_MAL:'No juntó dieces con dieces y unos con unos',
     DIECES_SIN_CERO:'Sumó los dieces pero sin el cero (5 en vez de 50)',SUMA_DIECES:'Error al sumar los dieces',SUMA_UNOS:'Error al sumar los unos',JUNTA_MAL:'Error al juntar dieces y unos en el resultado',
     RESTA_UNOS_EN_VEZ_DE_DIECES:'Restó unos en vez de dieces (2 en vez de 20)',SUMA_EN_VEZ_DE_RESTA:'Sumó en vez de restar',CAMBIA_UNIDAD:'Cambió los unos al restar dieces',FILAS_MAL:'Subió una cantidad de filas equivocada',CUENTA_MAL:'Contó mal para atrás'}},
  // Lectura y escritura de 1ro: los errores de escritura (R_RR, OMITE_TRABADA…) están en LENGUA1.ERRORES. analisis: cómo agrupa el panel de la nube.
  {id:'1ro-escritura',nivelMax:3,analisis:'palabras',titulo:'Escribí lo que ves',descripcion:'Mirá el dibujo y escribí la palabra. Tocá las sílabas para escucharlas.',icono:'✏️',grados:['1ro'],ruta:'actividades/1ro-escritura/index.html',version:'1.0.2'},
  {id:'1ro-ingles',nivelMax:3,analisis:'palabras',titulo:'English',descripcion:'Escuchá palabras en inglés y tocá el dibujo.',icono:'🇺🇸',grados:['1ro'],ruta:'actividades/1ro-ingles/index.html',version:'1.0.1',
   errores:{CONFUNDE_TEMA:'Confundió con otra palabra del mismo tema (DOG por CAT)',CONFUNDE_PARECIDA:'Confundió con una palabra que suena parecido (TREE por THREE)',CONFUNDE_OTRA:'Eligió otra palabra',SI_NO_MAL:'Contestó mal "¿es esto un…?"',LEE_MAL:'Leyó mal la palabra en inglés'}},
  // Inglés con mascota: el código común está en _comun-ingles/ (temas, juegos, mascota, mundo 3D).
  {id:'1ro-ingles-mascota',nivelMax:3,analisis:'palabras',titulo:'Mi mascota en inglés',descripcion:'Cuidá a tu mascota: súper, baño, a dormir y fútbol en el patio, contar, cómo se siente, la ropa (cambiador y tienda), acciones ("Mimi says!"), un álbum de figuritas, salidas al café, al restaurante, a la escuela y al cine y una merienda (cafecito, cupcake y juguito), todo en inglés con Miss Hoot.',icono:'🐾',grados:['1ro'],ruta:'actividades/1ro-ingles-mascota/index.html',version:'1.7.0',
   errores:{CONFUNDE_TEMA:'Confundió con otra palabra del mismo tema (BLUE por RED)',CONFUNDE_PARECIDA:'Confundió con una palabra que suena parecido (TREE por THREE)',CONFUNDE_OTRA:'Eligió otra palabra',CANTIDAD_MAL:'Eligió otra cantidad ("How many?")',COLOR_MAL:'Eligió la prenda pedida pero de otro color ("Dress up!")'},
   stats:()=>MATE.perfiles.filter(p=>p.grado==='1ro').map(p=>{ let m=null; try{ m=JSON.parse(localStorage.getItem('mate.'+p.id+'.1ro-ingles-mascota.pet')||'null'); }catch(e){}
     if(!m||!m.nacido) return p.nombre+': la mascota todavía no nació.';
     const d=Object.values(m.despensa||{}).reduce((a,b)=>a+b,0);
     return p.nombre+': '+m.nombre+', '+m.monedas+' ⭐, '+m.lecciones+' lecciones, '+m.aciertos+' aciertos, '+d+' comidas en la despensa, '+(m.ropa||[]).length+' prendas de ropa, '+(m.album||[]).length+' figuritas en el álbum, '+Object.values(m.salidas||{}).reduce((a,b)=>a+b,0)+' salidas.'; }).join(' ')},
  {id:'1ro-lectura',nivelMax:3,analisis:'preguntas',titulo:'Leé y contestá',descripcion:'Leé la pregunta, mirá el dibujo y contestá.',icono:'📚',grados:['1ro'],ruta:'actividades/1ro-lectura/index.html',version:'1.0.2',
   errores:{CUENTA_TODOS:'Contó todos: no leyó la condición de la pregunta',REPITE_ANTERIOR:'Repitió la respuesta anterior del mismo dibujo (no leyó la pregunta nueva)',LEE_OTRO:'Contó otra cosa (otro color, otro juguete u otra condición)',
     CUENTA_POR_UNO:'Contó uno de más o de menos',CUENTA_MAL:'Contó mal',NO_LEE_COLOR:'Tocó el juguete pedido pero de otro color',NO_LEE_OBJETO:'Tocó el color pedido pero otro juguete',NO_LEE_ATRIBUTO:'Tocó un patito que no cumple lo pedido',
     TOCA_MAL:'Tocó otra cosa',SI_NO_MAL:'Contestó mal sí o no',NO_LEE_PREGUNTA:'Contestó una pregunta parecida (GUAU en vez de MIAU)',NO_COMPRENDE:'La respuesta no tiene que ver con la pregunta'}},
  {id:'4to-division-paso-a-paso',nivelMax:4,titulo:'División paso a paso',descripcion:'Dividí como en la carpeta y controlá cada paso.',icono:'➗',grados:['4to'],ruta:'actividades/4to-division-paso-a-paso/index.html',version:'1.0.6'},
  {id:'4to-multiplicacion-paso-a-paso',nivelMax:4,titulo:'Multiplicación paso a paso',descripcion:'Multiplicá como en la carpeta: anotá, llevate y sumá las filas.',icono:'✖️',grados:['4to'],ruta:'actividades/4to-multiplicacion-paso-a-paso/index.html',version:'1.1.0'},
  {id:'4to-tablas',nivelMax:1,titulo:'Tablas de multiplicar',descripcion:'Mirá la tabla, memorizala y respondé contra reloj. Con la tabla pitagórica.',icono:'🔢',grados:['4to'],ruta:'actividades/4to-tablas/index.html',version:'1.0.0'},
  {id:'4to-cuantas-veces-entra',nivelMax:4,titulo:'¿Cuántas veces entra?',descripcion:'Las tablas al revés: ¿cuántas veces entra y cuánto sobra?',icono:'🪜',grados:['4to'],ruta:'actividades/4to-cuantas-veces-entra/index.html',version:'1.0.4'},
  {id:'4to-detective-problemas',nivelMax:4,titulo:'Detective de problemas',descripcion:'Leé, marcá los datos, armá el plan y respondé.',icono:'🔎',grados:['4to'],ruta:'actividades/4to-detective-problemas/index.html',version:'1.0.5'},
  {id:'4to-tiene-sentido',nivelMax:3,titulo:'¿Tiene sentido?',descripcion:'Estimá, verificá y descubrí resultados imposibles.',icono:'🤔',grados:['4to'],ruta:'actividades/4to-tiene-sentido/index.html',version:'1.0.5'},
  {id:'4to-calculo-con-ceros',nivelMax:4,titulo:'Cálculo con ceros',descripcion:'Multiplicá, dividí y sumá sin perder ni un cero.',icono:'🧮',grados:['4to'],ruta:'actividades/4to-calculo-con-ceros/index.html',version:'1.0.4'},
  // Fracciones de 4to (las siete juntas)
  {id:'4to-fracciones-repartos',nivelMax:3,titulo:'Repartos',descripcion:'Repartí en partes iguales: primero los enteros, después lo que sobra.',icono:'🍕',grados:['4to'],ruta:'actividades/4to-fracciones-repartos/index.html',version:'1.0.2'},
  {id:'4to-fracciones-partes',nivelMax:3,titulo:'Partes iguales',descripcion:'Leé, pintá y armá fracciones: cuenta el tamaño, no los pedazos.',icono:'🍫',grados:['4to'],ruta:'actividades/4to-fracciones-partes/index.html',version:'1.0.2'},
  {id:'4to-fracciones-equivalentes',teoria:true,titulo:'¿Qué son las fracciones equivalentes?',descripcion:'Teoría con dibujos: cortá, juntá y compará para ver que valen lo mismo.',icono:'📖',grados:['4to'],ruta:'actividades/4to-fracciones-equivalentes/index.html',version:'1.0.0',
   stats:()=>MATE.perfiles.filter(p=>p.grado==='4to').map(p=>{ const v=JSON.parse(localStorage.getItem('mate.'+p.id+'.4to-fracciones-equivalentes.progreso')||'null'); if(!v) return p.nombre+' todavía no la abrió.';
     return p.nombre+' vio '+v.vistas.length+' de 5 pantallas'+(v.desafios?'; desafíos: '+v.desafios.ok1+' de '+v.desafios.total+' al primer intento ('+new Date(v.desafios.fecha).toLocaleDateString('es-AR')+').':'; todavía no terminó los desafíos.'); }).join(' ')},
  {id:'4to-fracciones-gato',nivelMax:3,titulo:'El gato come fracciones',descripcion:'Dale a Michi las fracciones que valen lo que pide y escribí a qué equivalen.',icono:'🐱',grados:['4to'],ruta:'actividades/4to-fracciones-gato/index.html',version:'1.1.0'},
  {id:'4to-fracciones-muro',nivelMax:3,titulo:'Muro de fracciones',descripcion:'Fracciones equivalentes: la misma cantidad escrita de otra forma.',icono:'🧱',grados:['4to'],ruta:'actividades/4to-fracciones-muro/index.html',version:'1.0.2'},
  {id:'4to-fracciones-comparar',nivelMax:3,titulo:'¿Cuál es más?',descripcion:'Compará fracciones con criterios, sin adivinar.',icono:'⚖️',grados:['4to'],ruta:'actividades/4to-fracciones-comparar/index.html',version:'1.0.2'},
  {id:'4to-fracciones-cuanto-falta',nivelMax:3,titulo:'¿Cuánto falta?',descripcion:'Cuánto falta, sumas y restas, y problemas para leer con lupa.',icono:'🧩',grados:['4to'],ruta:'actividades/4to-fracciones-cuanto-falta/index.html',version:'1.0.2'},
  {id:'4to-fracciones-potes-vasos',nivelMax:3,titulo:'Potes y vasos',descripcion:'Kilos y litros con fracciones: ¿alcanza, falta o sobra?',icono:'🍯',grados:['4to'],ruta:'actividades/4to-fracciones-potes-vasos/index.html',version:'1.0.2'},
  {id:'4to-fracciones-repaso',nivelMax:1,titulo:'Repaso de fracciones',descripcion:'Un repaso tipo prueba con todo mezclado.',icono:'📝',grados:['4to'],ruta:'actividades/4to-fracciones-repaso/index.html',version:'1.0.2'}
];
})();
