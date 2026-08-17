// SettingsScreen.js
// Última sección del menú: respaldo/restauración de Finanzas y Horario —
// las dos bases de datos que solo existen en este dispositivo (SQLite
// local, sin sincronizar a ningún lado). Si se pierde o resetea el
// teléfono, esos datos se pierden — este es el único mecanismo para no
// perderlos. Ver backup.js para la lógica real; acá solo la UI.

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { exportBackup, pickBackupFile, restoreBackup } from './backup';
import AppButton from './AppButton';
import { colors, radius, spacing, cardShadow, typography } from './theme';

export default function SettingsScreen() {
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup();
    } catch (err) {
      Alert.alert('Error exportando el respaldo', String(err.message || err));
    } finally {
      setExporting(false);
    }
  }

  async function handleRestore() {
    try {
      const payload = await pickBackupFile();
      if (!payload) return; // el usuario canceló el selector

      Alert.alert(
        'Restaurar respaldo',
        `Este archivo es del ${new Date(payload.exportedAt).toLocaleString('es-CO')}.\n\nEsto reemplaza TODOS tus movimientos, presupuestos, tarjetas y horario actuales por los del archivo — no se pueden combinar. ¿Continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar',
            style: 'destructive',
            onPress: async () => {
              setRestoring(true);
              try {
                await restoreBackup(payload);
                Alert.alert('Listo', 'Se restauraron Finanzas y Horario desde el respaldo.');
              } catch (err) {
                Alert.alert('Error restaurando el respaldo', String(err.message || err));
              } finally {
                setRestoring(false);
              }
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error leyendo el archivo', String(err.message || err));
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[typography.sectionLabel, styles.sectionLabel]}>Respaldo de datos</Text>
          <View style={styles.card}>
            <Text style={typography.cardTitle}>Finanzas y Horario</Text>
            <Text style={styles.cardLine}>
              Estos datos solo viven en este teléfono — si se pierde o se resetea, se pierden con él. Exporta un archivo
              de respaldo de vez en cuando y guárdalo donde quieras (Archivos, iCloud, correo).
            </Text>

            {exporting ? (
              <ActivityIndicator style={styles.spinner} color={colors.accent} />
            ) : (
              <AppButton
                title="Exportar respaldo"
                onPress={handleExport}
                variant="primary"
                size="large"
                style={styles.button}
              />
            )}

            {restoring ? (
              <ActivityIndicator style={styles.spinner} color={colors.accent} />
            ) : (
              <AppButton
                title="Restaurar desde respaldo"
                onPress={handleRestore}
                variant="neutral"
                size="large"
                style={styles.button}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionLabel: { marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    ...cardShadow,
  },
  cardLine: { fontSize: 13.5, color: colors.textSecondary, lineHeight: 19 },
  button: { marginTop: spacing.xs },
  spinner: { marginTop: spacing.xs },
});
