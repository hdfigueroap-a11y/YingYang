// TodayScreen.js
// Pantalla "Hoy" — resumen del día: tareas urgentes de Canvas (vencen en
// menos de 24h o ya vencidas), clases de hoy (Horario) y eventos ya
// agendados en el Calendario del iPhone, todo junto en vez de tener que
// revisar Tareas/Horario/Calendario por separado. Reutiliza
// useWorkBlockScheduler.js para poder programar un bloque directo desde
// acá, igual que en TasksScreen.js.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTodoItems } from './canvasApi';
import { getClasses } from './scheduleDb';
import { listEventsForDay } from './deviceCalendar';
import { SchedulePickerModal } from './schedulePicker';
import { useWorkBlockScheduler } from './useWorkBlockScheduler';
import { hasNotificationPermission, requestNotificationPermission, scheduleReminder } from './notifications';
import AppButton from './AppButton';
import { colors, radius, spacing, cardShadow, typography, colorFromString } from './theme';

function isUrgent(dueAt) {
  return new Date(dueAt).getTime() - Date.now() < 1000 * 60 * 60 * 24;
}

function classStartDateTime(cls) {
  const [h, m] = cls.start_time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// Recordatorios locales para lo que queda de hoy: 10 min antes de una clase
// o un evento, 1h antes de que venza una tarea urgente. Si el usuario nunca
// dio permiso de notificaciones, se pide una vez acá (sin bloquear el resto
// de la pantalla si lo niega). Se reprograma cada vez que se abre esta
// pantalla — ver el comentario largo en notifications.js sobre esa
// limitación.
async function scheduleTodayReminders(classes, events, urgentTasks) {
  const granted = (await hasNotificationPermission()) || (await requestNotificationPermission());
  if (!granted) return;

  const todayIso = new Date().toISOString().slice(0, 10);

  await Promise.all([
    ...classes.map((c) => {
      const remindAt = new Date(classStartDateTime(c).getTime() - 10 * 60 * 1000);
      return scheduleReminder(`class-${c.id}-${todayIso}`, {
        title: `Clase en 10 min: ${c.name}`,
        body: c.location ? `En ${c.location}` : 'Empieza pronto',
        date: remindAt,
      });
    }),
    ...events.map((ev) => {
      const remindAt = new Date(new Date(ev.startDate).getTime() - 10 * 60 * 1000);
      return scheduleReminder(`event-${ev.id}`, {
        title: `En 10 min: ${ev.title || 'Evento'}`,
        body: 'Revisa tu Calendario',
        date: remindAt,
      });
    }),
    ...urgentTasks
      .filter((item) => item.assignment?.due_at)
      .map((item) => {
        const remindAt = new Date(new Date(item.assignment.due_at).getTime() - 60 * 60 * 1000);
        return scheduleReminder(`task-${item.assignment.id}`, {
          title: `Vence en 1h: ${item.assignment.name ?? 'Tarea'}`,
          body: item.context_name || 'Revisa Canvas',
          date: remindAt,
        });
      }),
  ]);
}
function formatEventTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
// 'HH:MM' -> hora formateada, mismo criterio que ScheduleScreen.js
function formatClassTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function todayLabel() {
  const label = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function TodayScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);

  const scheduler = useWorkBlockScheduler();

  const load = useCallback(async () => {
    try {
      setError(null);
      const today = new Date();
      const [todoItems, classes, events] = await Promise.all([
        getTodoItems(),
        getClasses(),
        // Sin permiso de Calendario todavía no debe bloquear el resto de la
        // pantalla — solo esa sección queda vacía.
        listEventsForDay(today).catch(() => []),
      ]);
      const urgent = todoItems.filter((item) => item.assignment?.due_at && isUrgent(item.assignment.due_at));
      const classesToday = classes.filter((c) => c.day_of_week === today.getDay());
      setUrgentTasks(urgent);
      setTodayClasses(classesToday);
      setTodayEvents(events);
      scheduleTodayReminders(classesToday, events, urgent).catch(() => {});
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const nothingToday = urgentTasks.length === 0 && todayClasses.length === 0 && todayEvents.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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
      >
        <Text style={styles.dateLabel}>{todayLabel()}</Text>
        {error && <Text style={styles.error}>{error}</Text>}

        {nothingToday && !error ? (
          <View style={styles.empty}>
            <Ionicons name="partly-sunny-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nada urgente hoy</Text>
            <Text style={styles.emptySubtitle}>Sin tareas urgentes, clases ni eventos</Text>
          </View>
        ) : (
          <>
            {urgentTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={[typography.sectionLabel, styles.sectionLabel]}>Tareas urgentes</Text>
                {urgentTasks.map((item) => {
                  const assignment = item.assignment;
                  const courseColor = colorFromString(item.context_name || assignment?.name);
                  return (
                    <View key={assignment.id} style={[styles.card, { borderLeftColor: courseColor }]}>
                      <Text style={typography.cardTitle}>{assignment?.name ?? 'Sin título'}</Text>
                      {item.context_name && (
                        <Text style={[styles.cardCourse, { color: courseColor }]}>{item.context_name}</Text>
                      )}
                      <Text style={styles.cardDueUrgent}>Vence: {new Date(assignment.due_at).toLocaleString()}</Text>
                      <AppButton
                        title={scheduler.scheduling === assignment.id ? 'Programando...' : 'Programar bloque de trabajo'}
                        onPress={() => scheduler.scheduleWorkBlock(assignment)}
                        disabled={Boolean(scheduler.scheduling)}
                        loading={scheduler.scheduling === assignment.id}
                        style={styles.cardButton}
                      />
                    </View>
                  );
                })}
              </View>
            )}

            {todayClasses.length > 0 && (
              <View style={styles.section}>
                <Text style={[typography.sectionLabel, styles.sectionLabel]}>Clases de hoy</Text>
                {todayClasses.map((c) => (
                  <View key={c.id} style={[styles.card, { borderLeftColor: colorFromString(c.name) }]}>
                    <Text style={typography.cardTitle}>{c.name}</Text>
                    <Text style={styles.cardLine}>
                      {formatClassTime(c.start_time)} – {formatClassTime(c.end_time)}
                      {c.location ? ` · ${c.location}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {todayEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={[typography.sectionLabel, styles.sectionLabel]}>Eventos de hoy</Text>
                {todayEvents.map((ev) => (
                  <View key={ev.id} style={[styles.card, { borderLeftColor: colorFromString(ev.title || '') }]}>
                    <Text style={typography.cardTitle}>{ev.title || '(sin título)'}</Text>
                    <Text style={styles.cardLine}>
                      {formatEventTime(ev.startDate)} – {formatEventTime(ev.endDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  dateLabel: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  error: { color: colors.danger },
  empty: { alignItems: 'center', paddingTop: 64, gap: spacing.sm },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionLabel: { marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderLeftWidth: 4,
    padding: spacing.lg,
    ...cardShadow,
  },
  cardCourse: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardLine: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  cardDueUrgent: { fontSize: 13, color: colors.danger, fontWeight: '600', marginTop: spacing.sm },
  cardButton: { marginTop: spacing.md },
});
