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

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  getInstallmentProgress,
  setCreditCardDetails,
  setBudget,
  deleteBudget,
  getBudgetsForMonth,
} from './financeDb';
import AppButton from './AppButton';
import { colors, radius, spacing, cardShadow, typography, gradients, colorFromString } from './theme';


function pad2(n) {
  return String(n).padStart(2, '0');
}
function monthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}
function isoDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
// 'YYYY-MM-DD' -> Date local. `new Date('YYYY-MM-DD')` se interpreta como
// UTC y en Colombia (UTC-5) puede mostrar el día anterior — se arma a mano.
function parseIsoDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}
function formatMoney(n) {
  return (n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export default function FinanceScreen() {
  const [ready, setReady] = useState(false);
  const [month, setMonth] = useState(monthKey(new Date()));
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cardModal, setCardModal] = useState(null);
  const [cardPurchases, setCardPurchases] = useState([]);
  const [configCard, setConfigCard] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const loadMonth = useCallback(async (targetMonth) => {
    const [summaryData, txData, cardsData, budgetsData] = await Promise.all([
      getMonthSummary(targetMonth),
      getTransactionsForMonth(targetMonth),
      getCreditCards(),
      getBudgetsForMonth(targetMonth),
    ]);
    setSummary(summaryData);
    setTransactions(txData);
    setCreditCards(cardsData);
    setBudgets(budgetsData);
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
          </View>
          <View style={[styles.summaryTile, cardShadow]}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatMoney(summary.expense)}</Text>
          </View>
        </View>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceTile}>
          <Text style={styles.balanceLabel}>Balance del mes</Text>
          <Text style={styles.balanceValue}>{formatMoney(summary.balance)}</Text>
        </LinearGradient>

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
              const barColor = over ? colors.danger : percent >= 0.8 ? '#FF9F1C' : colors.accent;
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

// `visible` controla el modal montado en FinanceScreen; el formulario se
// reinicia cada vez que se abre (mismo patrón que schedulePicker.js).
function AddTransactionModal({ visible, accounts, categories, saving, onCancel, onSave }) {
  const [kind, setKind] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [installments, setInstallments] = useState('1');

  useEffect(() => {
    if (!visible) return;
    setKind('gasto');
    setAmount('');
    setNote('');
    setDate(new Date());
    setInstallments('1');
    const firstCategory = categories.find((c) => c.kind === 'gasto');
    setCategoryId(firstCategory ? firstCategory.id : null);
    setAccountId(accounts[0] ? accounts[0].id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const filteredCategories = categories.filter((c) => c.kind === kind);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isCredit = selectedAccount?.type === 'credito';

  function handleKindChange(newKind) {
    setKind(newKind);
    const first = categories.find((c) => c.kind === newKind);
    setCategoryId(first ? first.id : null);
  }

  function handleSave() {
    const parsedAmount = parseFloat(String(amount).replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero.');
      return;
    }
    if (!categoryId || !accountId) {
      Alert.alert('Faltan datos', 'Elige una categoría y una cuenta.');
      return;
    }
    onSave({
      amount: parsedAmount,
      date: isoDate(date),
      note: note.trim(),
      accountId,
      categoryId,
      installments: isCredit ? Math.max(1, parseInt(installments, 10) || 1) : 1,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>Nuevo movimiento</Text>

            <View style={styles.pillRow}>
              <AppButton
                title="Gasto"
                onPress={() => handleKindChange('gasto')}
                variant={kind === 'gasto' ? 'primary' : 'neutral'}
                size="small"
                style={styles.pill}
              />
              <AppButton
                title="Ingreso"
                onPress={() => handleKindChange('ingreso')}
                variant={kind === 'ingreso' ? 'primary' : 'neutral'}
                size="small"
                style={styles.pill}
              />
            </View>

            <Text style={styles.fieldLabel}>Monto</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.fieldLabel}>Fecha</Text>
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              themeVariant="dark"
              onChange={(event, newDate) => newDate && setDate(newDate)}
              style={styles.datePicker}
            />

            <Text style={styles.fieldLabel}>Categoría</Text>
            <View style={styles.pillWrap}>
              {filteredCategories.map((c) => (
                <AppButton
                  key={c.id}
                  title={c.name}
                  onPress={() => setCategoryId(c.id)}
                  variant={categoryId === c.id ? 'primary' : 'neutral'}
                  size="small"
                  style={styles.pillWrapItem}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Cuenta</Text>
            <View style={styles.pillWrap}>
              {accounts.map((a) => (
                <AppButton
                  key={a.id}
                  title={a.name}
                  onPress={() => setAccountId(a.id)}
                  variant={accountId === a.id ? 'primary' : 'neutral'}
                  size="small"
                  style={styles.pillWrapItem}
                />
              ))}
            </View>

            {isCredit && (
              <>
                <Text style={styles.fieldLabel}>Cuotas</Text>
                <TextInput
                  style={styles.input}
                  value={installments}
                  onChangeText={setInstallments}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textTertiary}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Nota (opcional)</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Ej. Mercado del mes"
              placeholderTextColor={colors.textTertiary}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <AppButton title="Cancelar" onPress={onCancel} variant="neutral" size="large" style={styles.actionButton} />
            <AppButton
              title="Guardar"
              onPress={handleSave}
              variant="primary"
              size="large"
              style={styles.actionButton}
              loading={saving}
              disabled={saving}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CardPurchasesModal({ visible, card, purchases, onClose }) {
  if (!card) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>Compras — {card.name}</Text>
            {purchases.length === 0 ? (
              <Text style={styles.empty}>Sin compras registradas</Text>
            ) : (
              purchases.map((p) => {
                const progress = getInstallmentProgress(p);
                return (
                  <View key={p.id} style={styles.txRow}>
                    <View style={[styles.txDot, { backgroundColor: colorFromString(p.category_name) }]} />
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{p.note || p.category_name}</Text>
                      <Text style={styles.txSubtitle}>
                        {parseIsoDate(p.date).toLocaleDateString('es-CO')}
                        {progress ? ` · cuota ${progress.paid}/${progress.total}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.txAmount}>{formatMoney(p.amount)}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
          <View style={styles.modalActions}>
            <AppButton title="Cerrar" onPress={onClose} variant="neutral" size="large" style={styles.actionButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfigCardModal({ visible, card, onCancel, onSave }) {
  const [creditLimit, setCreditLimit] = useState('');
  const [cutoffDay, setCutoffDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  useEffect(() => {
    if (!card) return;
    setCreditLimit(card.credit_limit != null ? String(card.credit_limit) : '');
    setCutoffDay(card.cutoff_day != null ? String(card.cutoff_day) : '');
    setDueDay(card.due_day != null ? String(card.due_day) : '');
  }, [card]);

  if (!card) return null;

  function handleSave() {
    const cutoff = parseInt(cutoffDay, 10);
    const due = parseInt(dueDay, 10);
    if (!cutoff || cutoff < 1 || cutoff > 31 || !due || due < 1 || due > 31) {
      Alert.alert('Datos inválidos', 'El día de corte y de pago deben ser números entre 1 y 31.');
      return;
    }
    onSave({
      creditLimit: creditLimit ? parseFloat(String(creditLimit).replace(',', '.')) : null,
      cutoffDay: cutoff,
      dueDay: due,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>Configurar {card.name}</Text>

            <Text style={styles.fieldLabel}>Cupo total</Text>
            <TextInput
              style={styles.input}
              value={creditLimit}
              onChangeText={setCreditLimit}
              keyboardType="decimal-pad"
              placeholder="Ej. 3000000"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.fieldLabel}>Día de corte (1-31)</Text>
            <TextInput
              style={styles.input}
              value={cutoffDay}
              onChangeText={setCutoffDay}
              keyboardType="number-pad"
              placeholder="Ej. 15"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.fieldLabel}>Día de pago (1-31)</Text>
            <TextInput
              style={styles.input}
              value={dueDay}
              onChangeText={setDueDay}
              keyboardType="number-pad"
              placeholder="Ej. 5"
              placeholderTextColor={colors.textTertiary}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <AppButton title="Cancelar" onPress={onCancel} variant="neutral" size="large" style={styles.actionButton} />
            <AppButton title="Guardar" onPress={handleSave} variant="primary" size="large" style={styles.actionButton} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// `existingCategoryIds` oculta de la lista las categorías que ya tienen
// presupuesto este mes al CREAR uno nuevo (evita duplicados confusos); al
// EDITAR (`editingBudget` truthy) se muestran todas — es la misma categoría
// que ya se está editando.
function BudgetModal({ visible, categories, editingBudget, existingCategoryIds, onCancel, onSave, onDelete }) {
  const [categoryId, setCategoryId] = useState(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (editingBudget) {
      setCategoryId(editingBudget.category_id);
      setAmount(String(editingBudget.amount));
    } else {
      setCategoryId(null);
      setAmount('');
    }
  }, [visible, editingBudget]);

  const gastoCategories = categories.filter((c) => c.kind === 'gasto');
  const availableCategories = editingBudget
    ? gastoCategories
    : gastoCategories.filter((c) => !existingCategoryIds.includes(c.id));

  function handleSave() {
    const parsedAmount = parseFloat(String(amount).replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Falta la categoría', 'Elige una categoría.');
      return;
    }
    onSave(categoryId, parsedAmount);
  }

  function handleDelete() {
    Alert.alert('Eliminar presupuesto', `¿Eliminar el presupuesto de "${editingBudget.category_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>{editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}</Text>

            <Text style={styles.fieldLabel}>Categoría</Text>
            {availableCategories.length === 0 ? (
              <Text style={styles.empty}>Ya tienes presupuesto en todas las categorías de gasto</Text>
            ) : (
              <View style={styles.pillWrap}>
                {availableCategories.map((c) => (
                  <AppButton
                    key={c.id}
                    title={c.name}
                    onPress={() => setCategoryId(c.id)}
                    variant={categoryId === c.id ? 'primary' : 'neutral'}
                    size="small"
                  />
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Monto mensual</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
            />

            {editingBudget && (
              <AppButton title="Eliminar presupuesto" onPress={handleDelete} variant="plain" style={styles.deleteLink} />
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <AppButton title="Cancelar" onPress={onCancel} variant="neutral" size="large" style={styles.actionButton} />
            <AppButton title="Guardar" onPress={handleSave} variant="primary" size="large" style={styles.actionButton} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // El ScrollView necesita su propio flex:1 además de contentContainerStyle
  // — sin esto no se dimensiona bien dentro de `container` y empuja el
  // botón "+ Agregar movimiento" (que va DESPUÉS del ScrollView, fijo, no
  // dentro de él) fuera del área visible de la pantalla.
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  monthLabel: { fontSize: 16, fontWeight: '600', color: colors.text, textTransform: 'capitalize', minWidth: 150, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  summaryTile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  balanceTile: { borderRadius: radius.card, padding: spacing.lg },
  balanceLabel: { fontSize: 12, fontWeight: '600', color: colors.background, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
  balanceValue: { fontSize: 24, fontWeight: '700', color: colors.background, marginTop: 4 },
  section: { gap: spacing.sm },
  sectionLabel: { marginBottom: spacing.xs },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    ...cardShadow,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetName: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  budgetAmounts: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.fill, overflow: 'hidden', marginTop: spacing.xs },
  progressFill: { height: '100%', borderRadius: 4 },
  deleteLink: { alignSelf: 'center', marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderLeftWidth: 4,
    padding: spacing.lg,
    ...cardShadow,
  },
  cardLine: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  addButton: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    ...cardShadow,
  },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14.5, fontWeight: '500', color: colors.text },
  txSubtitle: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 14.5, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.separator,
    paddingHorizontal: spacing.lg,
    maxHeight: '88%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.separator, alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },
  modalScroll: { paddingBottom: spacing.lg, gap: spacing.xs },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md, letterSpacing: -0.3 },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  pill: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5,
    borderColor: colors.fill,
    borderRadius: radius.input,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  // El calendario "inline" tiene un tamaño de dibujo nativo fijo — no se
  // estira aunque el marco sea más ancho, así que se centra en vez de
  // forzarle un ancho (ver el comentario largo en schedulePicker.js).
  datePicker: { alignSelf: 'center' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  pillWrapItem: {},
  actionButton: { flex: 1 },
});
