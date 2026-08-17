// financeDb.test.js
// Tests de la lógica de dinero de financeDb.js: progreso de cuotas y
// fechas de corte/pago de tarjeta de crédito. Es el único lugar de la app
// donde un bug silencioso cuesta dinero real, no solo una UI fea — de ahí
// que sea el primer módulo con tests (ver docs/planner.md, Fase 7).
//
// `expo-sqlite` se mockea porque estos tests solo ejercitan funciones
// puras (no tocan la base de datos real); sin el mock, importar
// financeDb.js fallaría al intentar cargar el módulo nativo fuera de un
// dispositivo/simulador.
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const { getInstallmentProgress, lastCutoffDate, nextDueDate } = require('./financeDb');

describe('getInstallmentProgress', () => {
  test('null si la compra no fue a cuotas (installments 1, 0 o ausente)', () => {
    expect(getInstallmentProgress({ date: '2026-01-15', installments: 1, amount: 300000 })).toBeNull();
    expect(getInstallmentProgress({ date: '2026-01-15', installments: 0, amount: 300000 })).toBeNull();
    expect(getInstallmentProgress({ date: '2026-01-15', amount: 300000 })).toBeNull();
  });

  test('el día de la compra ya cuenta como la primera cuota pagada', () => {
    const tx = { date: '2026-01-15', installments: 3, amount: 300000 };
    const progress = getInstallmentProgress(tx, new Date(2026, 0, 15));
    expect(progress).toEqual({ paid: 1, remaining: 2, installmentAmount: 100000, total: 3 });
  });

  test('antes del aniversario mensual, la cuota de ese mes todavía no cuenta', () => {
    const tx = { date: '2026-01-15', installments: 3, amount: 300000 };
    const progress = getInstallmentProgress(tx, new Date(2026, 1, 14)); // 14 feb, un día antes
    expect(progress.paid).toBe(1);
  });

  test('en el aniversario mensual exacto, se suma una cuota más', () => {
    const tx = { date: '2026-01-15', installments: 3, amount: 300000 };
    const progress = getInstallmentProgress(tx, new Date(2026, 1, 15)); // 15 feb
    expect(progress.paid).toBe(2);
  });

  test('el progreso no pasa del total de cuotas aunque haya pasado mucho más tiempo', () => {
    const tx = { date: '2026-01-15', installments: 3, amount: 300000 };
    const progress = getInstallmentProgress(tx, new Date(2026, 8, 1)); // varios meses después
    expect(progress).toEqual({ paid: 3, remaining: 0, installmentAmount: 100000, total: 3 });
  });

  test('usa la fecha local de la compra, no UTC (evita el corrimiento de -1 día en UTC-5)', () => {
    // 'YYYY-MM-DD' con `new Date(...)` a secas se interpretaría como UTC
    // medianoche, que en Colombia (UTC-5) cae el día 14 a las 7pm — un día
    // antes de lo guardado. Con parseIsoDate (fecha local), el aniversario
    // sigue siendo el 15, no el 14.
    const tx = { date: '2026-01-15', installments: 3, amount: 300000 };
    const dayBefore = getInstallmentProgress(tx, new Date(2026, 1, 14)); // 14 feb
    const sameDay = getInstallmentProgress(tx, new Date(2026, 1, 15)); // 15 feb
    expect(dayBefore.paid).toBe(1);
    expect(sameDay.paid).toBe(2);
  });
});

describe('lastCutoffDate', () => {
  test('si hoy es después del día de corte, el corte es este mes', () => {
    expect(lastCutoffDate(15, new Date(2026, 0, 20))).toEqual(new Date(2026, 0, 15));
  });

  test('si hoy es el día de corte, el corte es hoy', () => {
    expect(lastCutoffDate(15, new Date(2026, 0, 15))).toEqual(new Date(2026, 0, 15));
  });

  test('si hoy es antes del día de corte, el corte fue el mes pasado', () => {
    expect(lastCutoffDate(15, new Date(2026, 0, 10))).toEqual(new Date(2025, 11, 15));
  });

  test('cruce de año: enero antes del corte retrocede a diciembre del año anterior', () => {
    expect(lastCutoffDate(28, new Date(2026, 0, 5))).toEqual(new Date(2025, 11, 28));
  });
});

describe('nextDueDate', () => {
  test('si hoy es antes del día de pago, el pago es este mes', () => {
    expect(nextDueDate(5, new Date(2026, 0, 1))).toEqual(new Date(2026, 0, 5));
  });

  test('si hoy es el día de pago o después, el pago es el próximo mes', () => {
    expect(nextDueDate(5, new Date(2026, 0, 5))).toEqual(new Date(2026, 1, 5));
    expect(nextDueDate(5, new Date(2026, 0, 10))).toEqual(new Date(2026, 1, 5));
  });

  test('cruce de año: diciembre después del pago avanza a enero del año siguiente', () => {
    expect(nextDueDate(5, new Date(2026, 11, 10))).toEqual(new Date(2027, 0, 5));
  });
});
