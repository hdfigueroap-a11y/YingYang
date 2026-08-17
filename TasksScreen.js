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
import { Ionicons } from '@expo/vector-icons';
import { getTodoItems } from './canvasApi';
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

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getTodoItems();
      setItems(data);
    } catch (err) {
      setError(String(err.message || err));
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
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.success} />
              <Text style={typography.emptyTitle}>No tienes tareas pendientes</Text>
              <Text style={typography.emptySubtitle}>Disfruta tu tiempo libre</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const assignment = item.assignment;
          const types = assignment?.submission_types || [];
          const canSubmit =
            types.includes('online_text_entry') ||
            types.includes('online_url') ||
            types.includes('online_upload');
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
  listContent: { padding: spacing.lg, gap: spacing.md },
  empty: { alignItems: 'center', paddingTop: 64, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderLeftWidth: 4,
    padding: spacing.lg,
    ...cardShadow,
  },
  cardCourse: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardDue: { ...typography.cardSubtitle, marginTop: spacing.sm },
  cardDueUrgent: { color: colors.danger, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
