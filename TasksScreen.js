// TasksScreen.js
// Muestra la lista real de tareas pendientes (/users/self/todo) de Canvas.
//
// Cualquier tarea (tenga o no fecha límite) puede programarse como bloque de
// trabajo en el Calendario, en el día y la hora que el usuario elija, y
// entregarse por texto o URL si el tipo de entrega lo permite. Esa lógica
// vive en useWorkBlockScheduler.js y useAssignmentSubmission.js, compartida
// con CoursesScreen.js.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { getTodoItems } from './canvasApi';
import { saveCache, loadCache } from './canvasCache';
import { SchedulePickerModal } from './schedulePicker';
import { useWorkBlockScheduler } from './useWorkBlockScheduler';
import { useAssignmentSubmission } from './useAssignmentSubmission';
import AppButton from './AppButton';
import { colors, radius, spacing, cardShadow, typography, colorFromString } from './theme';

function isUrgent(dueAt) {
  return new Date(dueAt).getTime() - Date.now() < 1000 * 60 * 60 * 24;
}

export default function TasksScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [offlineNotice, setOfflineNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getTodoItems();
      setItems(data);
      setOfflineNotice(null);
      saveCache('todo', data);
    } catch (err) {
      // Sin conexión (típico dentro de un edificio de clases) no debe
      // dejar la pantalla vacía si ya se tiene una respuesta buena
      // anterior — se muestra esa, con aviso, en vez del error a secas.
      const cached = await loadCache('todo');
      if (cached) {
        setItems(cached.data);
        setOfflineNotice(`Sin conexión — mostrando datos del ${new Date(cached.cachedAt).toLocaleString('es-CO')}`);
      } else {
        setError(String(err.message || err));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const scheduler = useWorkBlockScheduler();
  const submission = useAssignmentSubmission(load);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {offlineNotice && <Text style={styles.offlineNotice}>{offlineNotice}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item, i) => String(item.assignment?.id ?? i)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          !error && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>No tienes tareas pendientes</Text>
              <Text style={styles.emptySubtitle}>Disfruta tu tiempo libre</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const assignment = item.assignment;
          const types = assignment?.submission_types || [];
          const canSubmit =
            types.includes('online_text_entry') || types.includes('online_url') || types.includes('online_upload');
          const urgent = assignment?.due_at && isUrgent(assignment.due_at);
          const courseColor = colorFromString(item.context_name || assignment?.name);

          return (
            <View style={[styles.card, { borderLeftColor: courseColor }]}>
              <Text style={typography.cardTitle}>{assignment?.name ?? 'Sin título'}</Text>
              {item.context_name && (
                <Text style={[styles.cardCourse, { color: courseColor }]}>{item.context_name}</Text>
              )}
              {assignment?.due_at && (
                <Text style={[styles.cardDue, urgent && styles.cardDueUrgent]}>
                  Vence: {new Date(assignment.due_at).toLocaleString()}
                </Text>
              )}
              <View style={styles.actions}>
                <AppButton
                  title={scheduler.scheduling === assignment?.id ? 'Programando...' : 'Programar bloque de trabajo'}
                  onPress={() => scheduler.scheduleWorkBlock(assignment)}
                  disabled={Boolean(scheduler.scheduling)}
                  loading={scheduler.scheduling === assignment?.id}
                />
                {canSubmit && (
                  <AppButton
                    title={submission.submitting === assignment?.id ? 'Entregando...' : 'Entregar tarea'}
                    onPress={() => submission.handleSubmit(assignment)}
                    disabled={Boolean(submission.submitting)}
                    loading={submission.submitting === assignment?.id}
                  />
                )}
              </View>
            </View>
          );
        }}
      />

      <SchedulePickerModal
        visible={scheduler.showIosPicker}
        label={scheduler.pendingItem ? `¿Cuándo empiezas "${scheduler.pendingItem.assignment?.name}"?` : ''}
        initialDate={scheduler.initialDate}
        onConfirm={scheduler.confirmIosPicker}
        onCancel={scheduler.cancelIosPicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  error: { color: colors.danger, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  offlineNotice: { color: colors.warning, fontSize: 12.5, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  listContent: { padding: spacing.lg, gap: spacing.md },
  empty: { alignItems: 'center', paddingTop: 64, gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderLeftWidth: 4,
    padding: spacing.lg,
    ...cardShadow,
  },
  cardCourse: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardDue: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  cardDueUrgent: { color: colors.danger, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
