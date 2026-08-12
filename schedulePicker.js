// schedulePicker.js
// Selector de fecha/hora reutilizable entre CalendarScreen y TasksScreen.
// En Android abre el diálogo nativo (fecha y luego hora, encadenados) — el
// propio diálogo de fecha de Android ya se muestra como calendario mensual.
// En iOS no hay diálogo nativo equivalente, así que se expone
// <SchedulePickerModal>: calendario mensual (display="inline") + hora, y
// debajo la lista de eventos que ya existen ese día en el Calendario del
// iPhone, para que el usuario vea sus compromisos antes de confirmar.

import React, { useState, useEffect } from 'react';
import {
  Platform,
  Modal,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { listEventsForDay } from './deviceCalendar';
import AppButton from './AppButton';
import { colors, radius, spacing, typography } from './theme';

// Abre el flujo de selección en Android. En iOS no hace nada: la pantalla
// debe mostrar <SchedulePickerModal> en su lugar.
export function openAndroidPicker(initialDate, onConfirm, onCancel) {
  if (Platform.OS !== 'android') return;

  DateTimePickerAndroid.open({
    value: initialDate,
    mode: 'date',
    onChange: (dateEvent, date) => {
      if (dateEvent.type !== 'set' || !date) {
        onCancel();
        return;
      }
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        onChange: (timeEvent, time) => {
          if (timeEvent.type !== 'set' || !time) {
            onCancel();
            return;
          }
          onConfirm(time);
        },
      });
    },
  });
}

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SchedulePickerModal({ visible, label, date, onChange, onConfirm, onCancel }) {
  const [dayEvents, setDayEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const dayKey = date.toDateString();

  useEffect(() => {
    if (!visible || Platform.OS !== 'ios') return;
    let cancelled = false;
    setLoadingEvents(true);
    listEventsForDay(date)
      .then((items) => !cancelled && setDayEvents(items))
      .catch(() => !cancelled && setDayEvents([]))
      .finally(() => !cancelled && setLoadingEvents(false));
    return () => {
      cancelled = true;
    };
    // Solo re-consulta cuando cambia el día visible, no en cada minuto de la hora.
  }, [visible, dayKey]);

  if (Platform.OS !== 'ios') return null;

  function handleDateChange(event, newDate) {
    if (!newDate) return;
    const merged = new Date(date);
    merged.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    onChange(merged);
  }

  function handleTimeChange(event, newTime) {
    if (!newTime) return;
    const merged = new Date(date);
    merged.setHours(newTime.getHours(), newTime.getMinutes());
    onChange(merged);
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.content}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.label}>{label}</Text>

            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              onChange={handleDateChange}
            />

            <Text style={[typography.sectionLabel, styles.sectionLabel]}>Hora</Text>
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />

            <Text style={[typography.sectionLabel, styles.sectionLabel]}>Ese día ya tienes</Text>
            {loadingEvents ? (
              <ActivityIndicator color={colors.accent} />
            ) : dayEvents.length === 0 ? (
              <Text style={styles.noEvents}>Sin eventos ese día</Text>
            ) : (
              dayEvents.map((ev) => (
                <View key={ev.id} style={styles.conflictRow}>
                  <View style={styles.conflictDot} />
                  <View style={styles.conflictInfo}>
                    <Text style={styles.conflictTitle}>{ev.title || '(sin título)'}</Text>
                    <Text style={styles.conflictTime}>
                      {formatTime(ev.startDate)}–{formatTime(ev.endDate)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.actions}>
            <AppButton title="Cancelar" onPress={onCancel} variant="neutral" size="large" style={styles.actionButton} />
            <AppButton title="Confirmar" onPress={onConfirm} variant="primary" size="large" style={styles.actionButton} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  scrollContent: { paddingBottom: 24 },
  label: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md, letterSpacing: -0.3 },
  sectionLabel: { marginTop: spacing.md, marginBottom: spacing.sm },
  noEvents: { fontSize: 13, color: colors.textSecondary },
  conflictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  conflictDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  conflictInfo: { flex: 1 },
  conflictTitle: { fontSize: 13.5, fontWeight: '500', color: colors.text },
  conflictTime: { fontSize: 12, color: colors.danger, marginTop: 1 },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  actionButton: { flex: 1 },
});
