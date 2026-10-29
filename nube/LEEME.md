# Registro en la nube (planilla de Google)

Cada ejercicio que se hace en cualquier dispositivo se manda a una planilla de Google tuya: una fila por intento, con perfil y dispositivo. Desde **Ajustes de padres** (en cualquier dispositivo) se ve el registro completo, con filtros y descarga en CSV.

## Cómo se arma (una sola vez, unos 5 minutos)

1. Creá una planilla nueva en Google Drive (por ejemplo "Matemática – registro").
2. En la planilla: **Extensiones → Apps Script**. Borrá lo que haya y pegá todo el contenido de `planilla.gs`.
3. Cambiá `CLAVE_LECTURA` por una clave tuya (letras y números, larga). Guardá (💾).
4. Arriba, elegí la función `preparar` y tocá **Ejecutar**. Google pide permisos: aceptalos (es tu propio script). Se crean las hojas `eventos`, `perfiles` y `dispositivos`.
5. **Implementar → Nueva implementación → tipo: Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**.
   - Tocá **Implementar** y copiá la **URL de la aplicación web** (termina en `/exec`).
6. Pasale esa URL a Claude para que la ponga en `core/core.js` (`NUBE_URL`), o pegala en **Ajustes de padres → Registro en la nube → Dirección** de cada dispositivo.
7. En Ajustes de padres escribí la clave de lectura en los dispositivos donde quieras ver el registro (por ejemplo tu PC y tu teléfono).

Si después cambiás el script, usá **Implementar → Administrar implementaciones → editar (lápiz) → Versión: nueva**, así la URL no cambia.

## Qué se guarda

- Hoja `eventos`: `fecha`, `perfil`, `dispositivo`, `act` (actividad), `tema`, `paso`, `intento`, `ok`, `error` (código), `esperado`, `respuesta`, `ms` (tiempo), `ayuda`, `item` (el ejercicio) y `extra` (lo demás, en JSON).
- Entradas: cada vez que un dispositivo abre una página va una fila `tipo` = `conexion` (`paso`: entrada, recarga, navegacion o atras) y cada vez que se elige o cambia de perfil, una `tipo` = `perfil` (`paso`: elige o cambio; el perfil anterior va en `extra`). Con eso y los ejercicios, Ajustes de padres muestra "Tiempo por dispositivo".
- Hoja `perfiles` y `dispositivos`: nombres para mostrar.
- Los nombres de los errores para padres están en el código (registro.js y los paneles de 4to); el panel los muestra traducidos.

## Seguridad

- Cualquiera que vea el código de la página puede ver la URL y mandar filas, pero **no puede leer** nada sin la clave.
- La clave no está en el código de la página: se escribe a mano en Ajustes de padres y queda solo en ese dispositivo.
- Si no hay internet, los ejercicios quedan en una cola en el dispositivo y se mandan después.
