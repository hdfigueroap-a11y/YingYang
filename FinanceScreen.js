// FinanceScreen.js
// Pantalla de Finanzas — Fase 5 del roadmap (ver docs/planner.md). Registro
// manual de movimientos (ingresos/gastos), resumen del mes, y un apartado de
// tarjeta de crédito (cupo, día de corte/pago, compras a cuotas). Todo vive
// en financeDb.js (SQLite local) — sin conexión a ningún banco (ver
// docs/decisiones.md: se descartó enlazar con Nu directamente).
//
// Simplificación deliberada: una compra a cuotas se guarda con el monto
// TOTAL en la fecha de la compra (no se prorratea mes a mes) — el resumen
// del mes refleja el total gastado ese día, y el progreso de cuotas
// (`getInstallmentProgress`) se muestra aparte, en el detalle de la tarjeta.
//
// Los 4 modales de esta pantalla (agregar movimiento, ver compras de
// tarjeta, configurar tarjeta, presupuesto) viven en sus propios archivos
// (AddTransactionModal.js, CardPurchasesModal.js, ConfigCardModal.js,
// BudgetModal.js), compartiendo estilos vía financeStyles.js — antes los
// cuatro estaban definidos acá mismo, en un archivo de 900+ líneas.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  initDatabase,
  getMonthSummary,
  getTransactionsForMonth,
  getAccounts,
  getCategories,
  addTransaction,
  deleteTransaction,
  getCreditCards,
  getCardPurchases,
  setCreditCardDetails,
  setBudget,
  deleteBudget,
  getBudgetsForMonth,
  getExpenseByCategory,
} from './financeDb';
import { hasNotificationPermission, requestNotificationPermission, scheduleReminder } from './notifications';
import AppButton from './AppButton';
import { colors, cardShadow, typography, gradients, colorFromString } from './theme';
import { parseIsoDate, monthKey, previousMonthKey, monthLabel, percentChange, formatMoney } from './formatters';
import { styles } from './financeStyles';
import AddTransactionModal from './AddTransactionModal';
import CardPurchasesModal from './CardPurchasesModal';
import ConfigCardModal from './ConfigCardModal';
import BudgetModal from './BudgetModal';

// Recordatorio local un día antes del pago de cada tarjeta configurada, a
// las 9am. Se reprograma cada vez que se abre la pantalla (mismo criterio
// que los recordatorios de TodayScreen.js — ver notifications.js).
async function scheduleCardReminders(cards) {
  const granted = (await hasNotificationPermission()) || (await requestNotificationPermission());
  if (!granted) return;

  await Promise.all(
    cards
      .filter((card) => card.nextPaymentDate)
      .map((card) => {
        const paymentDate = parseIsoDate(card.nextPaymentDate);
        const remindAt = new Date(paymentDate);
        remindAt.setDate(remindAt.getDate() - 1);
        remindAt.setHours(9, 0, 0, 0);
        return scheduleReminder(`card-${card.id}-${card.nextPaymentDate}`, {
          title: `Pago de ${card.name} mañana`,
          body: `Gastado este corte: ${formatMoney(card.cycleSpent)}`,
          date: remindAt,
        });
      })
  );
}

export default function FinanceScreen() {
  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState(monthKey(new Date()));
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [previousSummary, setPreviousSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenseByCategory, setExpenseByCategory] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardModal, setCardModal] = useState(null);
  const [cardPurchases, setCardPurchases] = useState([]);
  const [configCard, setConfigCard] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const loadMonth = useCallback(async (targetMonth) => {
    const [summaryData, previousSummaryData, txData, cardsData, budgetsData, categoryData] = await Promise.all([
      getMonthSummary(targetMonth),
      getMonthSummary(previousMonthKey(targetMonth)),
      getTransactionsForMonth(targetMonth),
      getCreditCards(),
      getBudgetsForMonth(targetMonth),
      getExpenseByCategory(targetMonth),
    ]);
    setSummary(summaryData);
    setPreviousSummary(previousSummaryData);
    setTransactions(txData);
    setCreditCards(cardsData);
    scheduleCardReminders(cardsData).catch(() => {});
    setBudgets(budgetsData);
    setExpenseByCategory(categoryData);
  }, []);

  useEffect(() => {
    (async () => {
      await initDatabase();
      const [accountsData, categoriesData] = await Promise.all([getAccounts(), getCategories()]);
      setAccounts(accountsData);
      setCategories(categoriesData);
      await loadMonth(month);
      setReady(true);
    })();
    // Solo al montar — cambios de mes los maneja el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) loadMonth(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  function changeMonth(delta) {
    const [y, m] = month.split('-').map(Number);
    setMonth(monthKey(new Date(y, m - 1 + delta, 1)));
  }

  function confirmDelete(tx) {
    Alert.alert('Eliminar movimiento', `¿Eliminar "${tx.note || tx.category_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(tx.id);
          loadMonth(month);
        },
      },
    ]);
  }

  async function openCardPurchases(card) {
    setCardModal(card);
    setCardPurchases(await getCardPurchases(card.id));
  }

  // La categoría con más gasto del mes marca el 100% de la barra — así se
  // ve de un vistazo cuál se lleva la mayor parte, no un porcentaje del
  // total general (que se aplana mucho con muchas categorías chicas).
  const maxCategoryExpense = expenseByCategory[0]?.total ?? 0;

  // Comparación contra el mes anterior — "favorable" decide el color, no el
  // signo: más ingresos es bueno (verde), más gastos es malo (ámbar), igual
  // que en la barra de presupuestos.
  const incomeChange = percentChange(summary.income, previousSummary?.income);
  const expenseChange = percentChange(summary.expense, previousSummary?.expense);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.monthRow}>
          <AppButton title="‹" onPress={() => changeMonth(-1)} variant="neutral" size="small" />
          <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
          <AppButton title="›" onPress={() => changeMonth(1)} variant="neutral" size="small" />
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryTile, cardShadow]}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{formatMoney(summary.income)}</Text>
            {incomeChange !== null && (
              <Text style={[styles.summaryDelta, { color: incomeChange >= 0 ? colors.success : colors.textSecondary }]}>
                {incomeChange >= 0 ? '▲' : '▼'} {Math.abs(incomeChange).toFixed(0)}% vs. mes pasado
              </Text>
            )}
          </View>
          <View style={[styles.summaryTile, cardShadow]}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatMoney(summary.expense)}</Text>
            {expenseChange !== null && (
              <Text style={[styles.summaryDelta, { color: expenseChange > 0 ? colors.warning : colors.success }]}>
                {expenseChange >= 0 ? '▲' : '▼'} {Math.abs(expenseChange).toFixed(0)}% vs. mes pasado
              </Text>
            )}
          </View>
        </View>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceTile}>
          <Text style={styles.balanceLabel}>Balance del mes</Text>
          <Text style={styles.balanceValue}>{formatMoney(summary.balance)}</Text>
        </LinearGradient>

        {expenseByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.sectionLabel, styles.sectionLabel]}>Gastos por categoría</Text>
            {expenseByCategory.map((c) => {
              const percent = maxCategoryExpense > 0 ? c.total / maxCategoryExpense : 0;
              return (
                <View key={c.category_name} style={styles.budgetRow}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetName}>{c.category_name}</Text>
                    <Text style={styles.budgetAmounts}>{formatMoney(c.total)}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percent * 100}%`, backgroundColor: colorFromString(c.category_name) },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {creditCards.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.sectionLabel, styles.sectionLabel]}>Tarjetas de crédito</Text>
            {creditCards.map((card) => (
              <View key={card.id} style={[styles.card, { borderLeftColor: colorFromString(card.name) }]}>
                <Text style={typography.cardTitle}>{card.name}</Text>
                {card.due_day ? (
                  <>
                    <Text style={styles.cardLine}>Gastado este corte: {formatMoney(card.cycleSpent)}</Text>
                    {card.credit_limit != null && (
                      <Text style={styles.cardLine}>
                        Disponible: {formatMoney(card.available)} de {formatMoney(card.credit_limit)}
                      </Text>
                    )}
                    <Text style={styles.cardLine}>
                      Próximo pago: {parseIsoDate(card.nextPaymentDate).toLocaleDateString('es-CO')}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.cardLine}>Sin configurar cupo/corte/pago todavía</Text>
                )}
                <View style={styles.actions}>
                  <AppButton title="Ver compras" onPress={() => openCardPurchases(card)} size="small" />
                  <AppButton title="Configurar" onPress={() => setConfigCard(card)} variant="neutral" size="small" />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={typography.sectionLabel}>Presupuestos del mes</Text>
            <AppButton
              title="+ Agregar"
              onPress={() => {
                setEditingBudget(null);
                setShowBudgetModal(true);
              }}
              variant="secondary"
              size="small"
            />
          </View>
          {budgets.length === 0 ? (
            <Text style={styles.empty}>Sin presupuestos este mes</Text>
          ) : (
            budgets.map((b) => {
              const percent = b.amount > 0 ? Math.min(b.spent / b.amount, 1) : 0;
              const over = b.spent > b.amount;
              const barColor = over ? colors.danger : percent >= 0.8 ? colors.warning : colors.accent;
              return (
                <Pressable
                  key={b.id}
                  style={styles.budgetRow}
                  onPress={() => {
                    setEditingBudget(b);
                    setShowBudgetModal(true);
                  }}
                >
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetName}>{b.category_name}</Text>
                    <Text style={[styles.budgetAmounts, over && { color: colors.danger }]}>
                      {formatMoney(b.spent)} / {formatMoney(b.amount)}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percent * 100}%`, backgroundColor: barColor }]} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={[typography.sectionLabel, styles.sectionLabel]}>Movimientos del mes (toca uno para eliminarlo)</Text>
          {transactions.length === 0 ? (
            <Text style={styles.empty}>Sin movimientos este mes</Text>
          ) : (
            transactions.map((tx) => (
              <Pressable key={tx.id} style={styles.txRow} onPress={() => confirmDelete(tx)}>
                <View style={[styles.txDot, { backgroundColor: colorFromString(tx.category_name) }]} />
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.note || tx.category_name}</Text>
                  <Text style={styles.txSubtitle}>
                    {tx.category_name} · {tx.account_name}
                    {tx.installments > 1 ? ` · a ${tx.installments} cuotas` : ''}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.category_kind === 'ingreso' ? colors.success : colors.danger }]}>
                  {tx.category_kind === 'ingreso' ? '+' : '-'}
                  {formatMoney(tx.amount)}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <AppButton
        title="+ Agregar movimiento"
        onPress={() => setShowAddModal(true)}
        variant="primary"
        size="large"
        style={styles.addButton}
      />

      <AddTransactionModal
        visible={showAddModal}
        accounts={accounts}
        categories={categories}
        saving={saving}
        onCancel={() => setShowAddModal(false)}
        onSave={async (data) => {
          setSaving(true);
          try {
            await addTransaction(data);
            setShowAddModal(false);
            await loadMonth(month);
          } catch (err) {
            Alert.alert('Error guardando el movimiento', String(err.message || err));
          } finally {
            setSaving(false);
          }
        }}
      />

      <CardPurchasesModal visible={Boolean(cardModal)} card={cardModal} purchases={cardPurchases} onClose={() => setCardModal(null)} />

      <ConfigCardModal
        visible={Boolean(configCard)}
        card={configCard}
        onCancel={() => setConfigCard(null)}
        onSave={async (details) => {
          await setCreditCardDetails(configCard.id, details);
          setConfigCard(null);
          await loadMonth(month);
        }}
      />

      <BudgetModal
        visible={showBudgetModal}
        categories={categories}
        editingBudget={editingBudget}
        existingCategoryIds={budgets.map((b) => b.category_id)}
        onCancel={() => {
          setShowBudgetModal(false);
          setEditingBudget(null);
        }}
        onSave={async (categoryId, amount) => {
          await setBudget(categoryId, month, amount);
          setShowBudgetModal(false);
          setEditingBudget(null);
          await loadMonth(month);
        }}
        onDelete={async () => {
          await deleteBudget(editingBudget.id);
          setShowBudgetModal(false);
          setEditingBudget(null);
          await loadMonth(month);
        }}
      />
    </View>
  );
}
