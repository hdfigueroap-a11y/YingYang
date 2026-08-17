// ConfigCardModal.js
// Modal "Configurar <tarjeta>" de FinanceScreen.js, extraído del archivo
// original (ver AddTransactionModal.js para el contexto de la extracción).

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import AppButton from './AppButton';
import { colors } from './theme';
import { styles } from './financeStyles';

export default function ConfigCardModal({ visible, card, onCancel, onSave }) {
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
            <AppButton
              title="Guardar"
              onPress={handleSave}
              variant="primary"
              size="large"
              style={styles.actionButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
