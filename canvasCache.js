// canvasCache.js
// Caché local de la última respuesta buena de Canvas (/users/self/todo,
// /courses) — sin esto, TasksScreen.js/CoursesScreen.js quedan vacíos en
// cuanto no hay señal (típico dentro de un edificio de clases), justo el
// momento en que más se necesitan. Usa expo-file-system (misma API nueva
// — File/Directory/Paths — que ya usa backup.js), sin ninguna dependencia
// nueva. Guarda solo la ÚLTIMA respuesta buena de cada endpoint (no
// historial), sobrescrita en cada fetch exitoso: no es una base de datos,
// es una foto de seguridad para cuando falla la red. Vive en el
// directorio de caché (`Paths.cache`, no `Paths.document`) a propósito —
// es contenido desechable que el sistema puede borrar si falta espacio,
// a diferencia del respaldo de Finanzas/Horario en `backup.js`.

import { File, Paths } from 'expo-file-system';

function cacheFile(key) {
  return new File(Paths.cache, `canvas-cache-${key}.json`);
}

// Si falla escribir (ej. disco lleno), no debe tumbar la pantalla que sí
// tiene datos frescos — el caché es una mejora, no algo crítico.
export function saveCache(key, data) {
  try {
    const file = cacheFile(key);
    file.create({ overwrite: true });
    file.write(JSON.stringify({ data, cachedAt: new Date().toISOString() }));
  } catch {
    // silencioso a propósito — ver comentario arriba
  }
}

// Devuelve { data, cachedAt } o null si nunca se guardó o no se pudo leer.
export async function loadCache(key) {
  try {
    const file = cacheFile(key);
    if (!file.exists) return null;
    return JSON.parse(await file.text());
  } catch {
    return null;
  }
}
