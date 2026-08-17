// BudgetModal.js
// Modal "Nuevo/Editar presupuesto" de FinanceScreen.js, extraído del
// archivo original (ver AddTransactionModal.js para el contexto).
// `existingCategoryIds` oculta de la lista las categorías que ya tienen
// presupuesto este mes al CREAR uno nuevo (evita duplicados confusos); al
// EDITAR (`editingBudget` truthy) se muestran todas — es la misma categoría
// que ya se está editando.

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import AppButton from './AppButton';
import { colors } from './theme';
import { styles } from './financeStyles';

export default function BudgetModal({ visible, categories, editingBudget, existingCategoryIds, onCancel, onSave, onDelete }) {
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
