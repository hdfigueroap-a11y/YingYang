// CardPurchasesModal.js
// Modal "Compras — <tarjeta>" de FinanceScreen.js, extraído del archivo
// original (ver AddTransactionModal.js para el contexto de la extracción).

import React from 'react';
import { View, Text, ScrollView, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import AppButton from './AppButton';
import { colorFromString } from './theme';
import { parseIsoDate, formatMoney } from './formatters';
import { getInstallmentProgress } from './financeDb';
import { styles } from './financeStyles';

export default function CardPurchasesModal({ visible, card, purchases, onClose }) {
  if (!card) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
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
