// schedulePicker.js
// Selector de fecha/hora reutilizable entre CalendarScreen, TasksScreen y
// CoursesScreen. En Android abre el diálogo nativo (fecha y luego hora,
// encadenados) — el propio diálogo de fecha de Android ya se muestra como
// calendario mensual. En iOS no hay diálogo nativo equivalente, así que se
// expone <SchedulePickerModal>: calendario mensual (display="inline") + hora,
// y debajo la lista de eventos que ya existen ese día en el Calendario del
// iPhone, para que el usuario vea sus compromisos antes de confirmar.
//
// El día y la hora se manejan como estado LOCAL del modal (no como un valor
// controlado desde el padre que se reconstruye en cada cambio) — con dos
// DateTimePicker controlados compartiendo un mismo valor combinado, cada
// cambio de uno pisaba el cambio del otro en el siguiente render y la fecha
// quedaba "atascada". Aquí cada picker solo escribe su propio pedazo de
// estado (día u hora), y la fecha final se arma una sola vez al confirmar.
//
// themeVariant="dark" fuerza a que el picker siempre pinte texto claro sobre
// fondo oscuro, para que combine con el diseño oscuro de la app en vez de
// seguir el modo claro/oscuro del sistema del iPhone (que podía mostrar un
// picker claro flotando sobre un modal oscuro).
//
// El calendario en modo "inline" (y el spinner de hora) tienen un tamaño de
// dibujo NATIVO fijo (no lo estiran aunque el marco que les demos sea más
// ancho — ya se probó con porcentaje y con píxeles exactos, en ambos casos
// el picker se queda pegado a la izquierda y deja el resto del marco vacío
// a la derecha). Como no se puede forzar a que su contenido ocupe más
// espacio, la solución es dejarlo con su ancho natural (sin `width` fijo) y
// centrarlo (`alignSelf: 'center'`) dentro del modal, que sí es ancho.

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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
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

// `initialDate` solo se usa para sembrar el día/hora la primera vez que el
// modal se abre — de ahí en adelante el usuario controla ambos libremente.
// `onConfirm(finalDate)` recibe la fecha ya combinada al tocar "Confirmar".
export function SchedulePickerModal({ visible, label, initialDate, onConfirm, onCancel }) {
  const [day, setDay] = useState(initialDate);
  const [time, setTime] = useState(initialDate);
  const [dayEvents, setDayEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Cada vez que el modal se abre, arranca desde la fecha sugerida —
  // mientras está abierto, el usuario la mueve libremente sin que nada la
  // reinicie.
  useEffect(() => {
    if (visible) {
      setDay(initialDate);
      setTime(initialDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dayKey = day.toDateString();

  useEffect(() => {
    if (!visible || Platform.OS !== 'ios') return;
    let cancelled = false;
    setLoadingEvents(true);
    listEventsForDay(day)
      .then((items) => !cancelled && setDayEvents(items))
      .catch(() => !cancelled && setDayEvents([]))
      .finally(() => !cancelled && setLoadingEvents(false));
    return () => {
      cancelled = true;
    };
    // Solo re-consulta cuando cambia el día visible, no en cada minuto de la hora.
  }, [visible, dayKey]);

  if (Platform.OS !== 'ios') return null;

  function handleDayChange(event, newDay) {
    if (newDay) setDay(newDay);
  }

  function handleTimeChange(event, newTime) {
    if (newTime) setTime(newTime);
  }

  function handleConfirm() {
    const finalDate = new Date(day);
    finalDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
    onConfirm(finalDate);
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
              value={day}
              mode="date"
              display="inline"
              themeVariant="dark"
              style={styles.picker}
              onChange={handleDayChange}
            />

            <Text style={[typography.sectionLabel, styles.sectionLabel]}>Hora</Text>
            <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              themeVariant="dark"
              style={styles.picker}
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
            <AppButton
              title="Confirmar"
              onPress={handleConfirm}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  content: {
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
  picker: { alignSelf: 'center' },
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
