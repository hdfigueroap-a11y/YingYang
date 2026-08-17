// scheduleDb.js
// Capa de datos del Horario de clases — base de datos local SQLite
// (expo-sqlite), separada de financeDb.js porque es un dominio distinto
// (horario académico fijo, no movimientos de dinero).
//
// `day_of_week` usa la misma numeración que `Date.getDay()` de JS (0=domingo,
// 1=lunes, ..., 6=sábado) para poder calcular la próxima fecha de una clase
// sin tener que remapear — el horario cubre lunes(1) a sábado(6), nunca 0.
// `start_time`/`end_time` son texto 'HH:MM' (24h).

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'horario.db';

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initScheduleDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      location TEXT
    );
  `);
}

export async function getClasses() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM classes ORDER BY day_of_week, start_time');
}

export async function addClass({ name, dayOfWeek, startTime, endTime, location }) {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO classes (name, day_of_week, start_time, end_time, location) VALUES (?, ?, ?, ?, ?)',
    name,
    dayOfWeek,
    startTime,
    endTime,
    location || null
  );
  return result.lastInsertRowId;
}

export async function deleteClass(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM classes WHERE id = ?', id);
}

// --- Respaldo (backup.js) ---

export async function exportAllClasses() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM classes');
}

// Reemplaza TODAS las clases guardadas por las de `classes` — destructivo a
// propósito, es una restauración de respaldo, no un merge.
export async function importAllClasses(classes) {
  const db = await getDb();
  await db.execAsync('DELETE FROM classes;');
  for (const c of classes || []) {
    await db.runAsync(
      'INSERT INTO classes (id, name, day_of_week, start_time, end_time, location) VALUES (?, ?, ?, ?, ?, ?)',
      c.id,
      c.name,
      c.day_of_week,
      c.start_time,
      c.end_time,
      c.location ?? null
    );
  }
}
