// AddTransactionModal.js
// Modal de "Nuevo movimiento" de FinanceScreen.js — extraído de ahí (era uno
// de cuatro modales definidos dentro del mismo archivo de 900+ líneas).
// `visible` controla el modal montado en FinanceScreen; el formulario se
// reinicia cada vez que se abre (mismo patrón que schedulePicker.js).

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppButton from './AppButton';
import { colors } from './theme';
import { isoDate } from './formatters';
import { styles } from './financeStyles';

export default function AddTransactionModal({ visible, accounts, categories, saving, onCancel, onSave }) {
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
