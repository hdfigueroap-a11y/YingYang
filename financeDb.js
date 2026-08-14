// financeDb.js
// Capa de datos de Finanzas — base de datos local SQLite (expo-sqlite), sin
// ningún servicio externo ni credencial (los movimientos nunca salen del
// dispositivo). Fase 5 del roadmap (ver docs/planner.md): por ahora esto es
// solo el diseño de tablas + acceso básico a datos, todavía sin pantallas.
//
// Esquema:
// - accounts (cuentas): efectivo, débito, crédito, ahorro. Las de tipo
//   'credito' pueden tener cupo/día de corte/día de pago (columnas
//   credit_limit, cutoff_day, due_day) — el resto de tipos las deja en null
// - categories (categorías): cada una es de ingreso o de gasto (`kind`)
// - transactions (movimientos): `amount` siempre positivo, el signo lo da la
//   categoría asociada (`kind`), no el monto. `installments` es el número de
//   cuotas de la compra (1 = de contado), solo tiene sentido en tarjeta de
//   crédito
// - budgets (presupuestos): límite mensual por categoría ("YYYY-MM")
//
// Tarjeta de crédito: todo manual, sin conexión a ningún banco (ver
// docs/decisiones.md — se descartó integrar con Nu por no tener API pública
// para apps personales). "Cuándo vence" se calcula a partir de cutoff_day/
// due_day de la cuenta, no se guarda una fecha fija que quedaría desactualizada
// mes a mes.
//
// Se usa la API async de expo-sqlite (openDatabaseAsync/execAsync/runAsync/
// getAllAsync), no la API legacy basada en transacciones con callbacks.

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'finanzas.db';

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

const DEFAULT_ACCOUNTS = [
  { name: 'Efectivo', type: 'efectivo' },
  { name: 'Débito', type: 'debito' },
  { name: 'Crédito', type: 'credito' },
  { name: 'Ahorros', type: 'ahorro' },
];

const DEFAULT_CATEGORIES = [
  { name: 'Comida', kind: 'gasto' },
  { name: 'Transporte', kind: 'gasto' },
  { name: 'Vivienda', kind: 'gasto' },
  { name: 'Servicios', kind: 'gasto' },
  { name: 'Entretenimiento', kind: 'gasto' },
  { name: 'Salud', kind: 'gasto' },
  { name: 'Educación', kind: 'gasto' },
  { name: 'Otros gastos', kind: 'gasto' },
  { name: 'Salario', kind: 'ingreso' },
  { name: 'Otros ingresos', kind: 'ingreso' },
];

// Crea las tablas si no existen y siembra cuentas/categorías por defecto la
// primera vez (no vuelve a insertarlas en corridas siguientes). Debe llamarse
// una vez al entrar a la pantalla de Finanzas, antes de usar el resto de
// funciones de este archivo.
export async function initDatabase() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      credit_limit REAL,
      cutoff_day INTEGER,
      due_day INTEGER
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL CHECK (kind IN ('ingreso', 'gasto'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      installments INTEGER NOT NULL DEFAULT 1,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      UNIQUE(category_id, month)
    );
  `);

  const { count: accountCount } = await db.getFirstAsync('SELECT COUNT(*) as count FROM accounts');
  if (accountCount === 0) {
    for (const account of DEFAULT_ACCOUNTS) {
      await db.runAsync('INSERT INTO accounts (name, type) VALUES (?, ?)', account.name, account.type);
    }
  }

  const { count: categoryCount } = await db.getFirstAsync('SELECT COUNT(*) as count FROM categories');
  if (categoryCount === 0) {
    for (const category of DEFAULT_CATEGORIES) {
      await db.runAsync('INSERT INTO categories (name, kind) VALUES (?, ?)', category.name, category.kind);
    }
  }
}

// --- Cuentas ---

export async function getAccounts() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM accounts ORDER BY name');
}

// `creditLimit`/`cutoffDay`/`dueDay` solo aplican cuando `type === 'credito'`;
// para el resto de tipos se guardan como null.
export async function addAccount(name, type, { creditLimit, cutoffDay, dueDay } = {}) {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO accounts (name, type, credit_limit, cutoff_day, due_day) VALUES (?, ?, ?, ?, ?)',
    name,
    type,
    creditLimit ?? null,
    cutoffDay ?? null,
    dueDay ?? null
  );
  return result.lastInsertRowId;
}

// Actualiza el cupo/día de corte/día de pago de una tarjeta de crédito ya
// creada (ej. después de agregarla con `addAccount` sin esos datos a mano).
export async function setCreditCardDetails(accountId, { creditLimit, cutoffDay, dueDay }) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE accounts SET credit_limit = ?, cutoff_day = ?, due_day = ? WHERE id = ?',
    creditLimit ?? null,
    cutoffDay ?? null,
    dueDay ?? null,
    accountId
  );
}

// --- Categorías ---

export async function getCategories(kind) {
  const db = await getDb();
  if (kind) {
    return db.getAllAsync('SELECT * FROM categories WHERE kind = ? ORDER BY name', kind);
  }
  return db.getAllAsync('SELECT * FROM categories ORDER BY kind, name');
}

export async function addCategory(name, kind) {
  const db = await getDb();
  const result = await db.runAsync('INSERT INTO categories (name, kind) VALUES (?, ?)', name, kind);
  return result.lastInsertRowId;
}

// --- Movimientos ---

// `date` en formato ISO 'YYYY-MM-DD'. `amount` siempre positivo. `installments`
// es el número de cuotas de la compra (1 = de contado) — solo tiene sentido
// cuando `accountId` es una tarjeta de crédito, se guarda igual para el resto
// pero se ignora.
export async function addTransaction({ amount, date, note, accountId, categoryId, installments = 1 }) {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO transactions (amount, date, note, installments, account_id, category_id) VALUES (?, ?, ?, ?, ?, ?)',
    amount,
    date,
    note ?? null,
    installments,
    accountId,
    categoryId
  );
  return result.lastInsertRowId;
}

export async function deleteTransaction(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

// Movimientos de un mes ('YYYY-MM'), más recientes primero, con el nombre y
// tipo de categoría/cuenta ya resueltos (evita otra consulta por fila en la UI).
export async function getTransactionsForMonth(month) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT t.*, c.name as category_name, c.kind as category_kind, a.name as account_name
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     JOIN accounts a ON a.id = t.account_id
     WHERE t.date LIKE ?
     ORDER BY t.date DESC, t.id DESC`,
    `${month}-%`
  );
}

// Resumen del mes: ingresos, gastos y balance, sumando por el `kind` de la
// categoría de cada movimiento (no hay signo guardado en `amount`).
export async function getMonthSummary(month) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT c.kind as kind, SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.date LIKE ?
     GROUP BY c.kind`,
    `${month}-%`
  );
  const income = rows.find((r) => r.kind === 'ingreso')?.total ?? 0;
  const expense = rows.find((r) => r.kind === 'gasto')?.total ?? 0;
  return { income, expense, balance: income - expense };
}

// --- Presupuestos ---

// Crea o reemplaza el presupuesto de una categoría para un mes dado.
export async function setBudget(categoryId, month, amount) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO budgets (category_id, month, amount) VALUES (?, ?, ?)
     ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount`,
    categoryId,
    month,
    amount
  );
}

export async function deleteBudget(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
}

// Presupuestos del mes con el gasto acumulado ya calculado, para pintar la
// barra de progreso (gasto acumulado / presupuesto) sin otra consulta.
export async function getBudgetsForMonth(month) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT b.*, c.name as category_name,
       (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
        WHERE t.category_id = b.category_id AND t.date LIKE ?) as spent
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     WHERE b.month = ?
     ORDER BY c.name`,
    `${month}-%`,
    month
  );
}

// --- Tarjeta de crédito ---
// Todo manual — no hay conexión a ningún banco (ver docs/decisiones.md).
// El "vencimiento" de una tarjeta no es una fecha fija guardada en la base:
// se recalcula cada vez a partir de `due_day`/`cutoff_day`, para que siempre
// refleje el corte/pago que corresponde a la fecha de hoy.

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

// Corte más reciente que ya pasó (o el de hoy, si hoy es el día de corte).
function lastCutoffDate(cutoffDay, from = new Date()) {
  const y = from.getFullYear();
  const m = from.getMonth();
  return from.getDate() >= cutoffDay ? new Date(y, m, cutoffDay) : new Date(y, m - 1, cutoffDay);
}

// Próxima fecha de pago a partir de hoy.
function nextDueDate(dueDay, from = new Date()) {
  const y = from.getFullYear();
  const m = from.getMonth();
  return from.getDate() < dueDay ? new Date(y, m, dueDay) : new Date(y, m + 1, dueDay);
}

// Todas las tarjetas de crédito con lo gastado en el corte actual (compras
// desde el último día de corte hasta hoy), el cupo disponible y la próxima
// fecha de pago — ya calculados, listos para pintar en una pantalla.
export async function getCreditCards() {
  const db = await getDb();
  const cards = await db.getAllAsync("SELECT * FROM accounts WHERE type = 'credito' ORDER BY name");
  const today = new Date();

  const results = [];
  for (const card of cards) {
    let cycleSpent = 0;
    let nextPaymentDate = null;

    if (card.cutoff_day && card.due_day) {
      const cutoffIso = toIsoDate(lastCutoffDate(card.cutoff_day, today));
      const row = await db.getFirstAsync(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND date >= ?',
        card.id,
        cutoffIso
      );
      cycleSpent = row.total;
      nextPaymentDate = toIsoDate(nextDueDate(card.due_day, today));
    }

    results.push({
      ...card,
      cycleSpent,
      nextPaymentDate,
      available: card.credit_limit != null ? card.credit_limit - cycleSpent : null,
    });
  }
  return results;
}

// Compras de una tarjeta (todos los movimientos de esa cuenta), más
// recientes primero — incluye `installments` para mostrar "cuota X de Y".
export async function getCardPurchases(accountId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT t.*, c.name as category_name
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.account_id = ?
     ORDER BY t.date DESC, t.id DESC`,
    accountId
  );
}

// Progreso de cuotas de una compra a la fecha de hoy: cuántas ya se
// "cobraron" (una por cada corte desde la compra) y cuántas faltan. Devuelve
// null si la compra no fue a cuotas (`installments <= 1`).
export function getInstallmentProgress(transaction, today = new Date()) {
  if (!transaction.installments || transaction.installments <= 1) return null;
  const purchaseDate = new Date(transaction.date);
  const monthsElapsed =
    (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (today.getMonth() - purchaseDate.getMonth()) +
    (today.getDate() >= purchaseDate.getDate() ? 1 : 0);
  const paid = Math.min(Math.max(monthsElapsed, 0), transaction.installments);
  return {
    paid,
    remaining: transaction.installments - paid,
    installmentAmount: transaction.amount / transaction.installments,
    total: transaction.installments,
  };
}
