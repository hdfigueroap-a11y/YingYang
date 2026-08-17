// formatters.js
// Utilidades de fecha/hora/dinero compartidas. Antes vivían duplicadas
// (con el mismo nombre y a veces el mismo cuerpo, ej. pad2) dentro de
// FinanceScreen.js y ScheduleScreen.js por separado — dos implementaciones
// del mismo cálculo es exactamente el patrón que ya causó bugs de UI
// documentados en docs/decisiones.md. Un solo lugar para tocar esta lógica.

export function pad2(n) {
  return String(n).padStart(2, '0');
}

// Date -> 'YYYY-MM-DD'
export function isoDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// 'YYYY-MM-DD' -> Date local. `new Date('YYYY-MM-DD')` se interpreta como
// UTC y en Colombia (UTC-5) puede mostrar el día anterior — se arma a mano.
export function parseIsoDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date -> 'HH:MM'
export function timeToHHMM(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// 'HH:MM' -> Date (hoy, a esa hora)
export function hhmmToDate(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function formatTimeLabel(hhmm) {
  return hhmmToDate(hhmm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Próxima fecha (incluyendo hoy) para un día de la semana — usa la misma
// numeración que Date.getDay() (0=domingo..6=sábado), así que valores como
// `day_of_week` de scheduleDb.js no necesitan remapeo.
export function nextDateForWeekday(dayOfWeek, from = new Date()) {
  const result = new Date(from);
  const diff = (dayOfWeek - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
}

export function combineDateAndTime(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// Date -> 'YYYY-MM'
export function monthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function previousMonthKey(month) {
  const [y, m] = month.split('-').map(Number);
  return monthKey(new Date(y, m - 2, 1));
}

export function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

// null si no hay dato del período anterior (recién empezando a usar la
// app, mes sin ningún movimiento, etc.) — así el badge de comparación no
// se muestra en vez de calcular un "Infinity%" sin sentido.
export function percentChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function formatMoney(n) {
  return (n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}
