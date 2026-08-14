// ScheduleScreen.js
// Pantalla de Horario de clases — vista semanal (lunes a sábado) de
// referencia, guardada en scheduleDb.js (SQLite local, separado de
// Finanzas). Cada clase se puede "agendar" como evento semanal recurrente
// en el Calendario nativo del iPhone (deviceCalendar.js,
// createWeeklyRecurringEvent) — eso sí pide permiso de Calendario, igual
// que el resto de la app.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { initScheduleDatabase, getClasses, addClass, deleteClass } from './scheduleDb';
import { hasPermission, requestPermission, createWeeklyRecurringEvent } from './deviceCalendar';
import AppButton from './AppButton';
import { colors, radius, spacing, cardShadow, typography, colorFromString } from './theme';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

function pad2(n) {
  return String(n).padStart(2, '0');
}
function timeToHHMM(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function hhmmToDate(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
function formatTimeLabel(hhmm) {
  return hhmmToDate(hhmm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
// Próxima fecha (incluyendo hoy) para un día de la semana — `day_of_week`
// usa la misma numeración que Date.getDay(), así que no hay que remapear.
function nextDateForWeekday(dayOfWeek, from = new Date()) {
  const result = new Date(from);
  const diff = (dayOfWeek - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
}
function combineDateAndTime(date, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export default function ScheduleScreen() {
  const [ready, setReady] = useState(false);
  const [classes, setClasses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduling, setScheduling] = useState(null);

  const load = useCallback(async () => {
    setClasses(await getClasses());
  }, []);

  useEffect(() => {
    (async () => {
      await initScheduleDatabase();
      await load();
      setReady(true);
    })();
  }, [load]);

  function confirmDelete(cls) {
    Alert.alert('Eliminar clase', `¿Eliminar "${cls.name}" del horario?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteClass(cls.id); load(); } },
    ]);
  }

  async function handleSchedule(cls) {
    setScheduling(cls.id);
    try {
      const granted = (await hasPermission()) || (await requestPermission());
      if (!granted) {
        Alert.alert('Permiso de Calendario necesario', 'Actívalo en Ajustes > Privacidad > Calendarios para poder crear el evento.');
        return;
      }
      const day = nextDateForWeekday(cls.day_of_week);
      const startDate = combineDateAndTime(day, cls.start_time);
      const endDate = combineDateAndTime(day, cls.end_time);
      await createWeeklyRecurringEvent({
        title: cls.name,
        notes: cls.location ? `Lugar: ${cls.location}. Creado desde Canvas Dashboard.` : 'Creado desde Canvas Dashboard',
        startDate,
        endDate,
      });
      Alert.alert('Listo', `Se creó "${cls.name}" como evento semanal en tu Calendario.`);
    } catch (err) {
      Alert.alert('Error creando el evento', String(err.message || err));
    } finally {
      setScheduling(null);
    }
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {DAYS.map((day) => {
          const dayClasses = classes.filter((c) => c.day_of_week === day.value);
          return (
            <View key={day.value} style={styles.section}>
              <Text style={[typography.sectionLabel, styles.sectionLabel]}>{day.label}</Text>
              {dayClasses.length === 0 ? (
                <Text style={styles.empty}>Sin clases</Text>
              ) : (
                dayClasses.map((cls) => (
                  <View key={cls.id} style={[styles.card, { borderLeftColor: colorFromString(cls.name) }]}>
                    <Text style={typography.cardTitle}>{cls.name}</Text>
                    <Text style={styles.cardLine}>
                      {formatTimeLabel(cls.start_time)} – {formatTimeLabel(cls.end_time)}
                      {cls.location ? ` · ${cls.location}` : ''}
                    </Text>
                    <View style={styles.actions}>
                      <AppButton
                        title={scheduling === cls.id ? 'Creando...' : 'Agendar en Calendario'}
                        onPress={() => handleSchedule(cls)}
                        disabled={Boolean(scheduling)}
                        loading={scheduling === cls.id}
                        size="small"
                      />
                      <AppButton title="Eliminar" onPress={() => confirmDelete(cls)} variant="neutral" size="small" />
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      <AppButton title="+ Agregar clase" onPress={() => setShowAddModal(true)} variant="primary" size="large" style={styles.addButton} />

      <AddClassModal
        visible={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onSave={async (data) => {
          await addClass(data);
          setShowAddModal(false);
          load();
        }}
      />
    </View>
  );
}

function AddClassModal({ visible, onCancel, onSave }) {
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState(hhmmToDate('07:00'));
  const [endTime, setEndTime] = useState(hhmmToDate('08:00'));
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName('');
    setDayOfWeek(1);
    setStartTime(hhmmToDate('07:00'));
    setEndTime(hhmmToDate('08:00'));
    setLocation('');
  }, [visible]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresa el nombre de la clase.');
      return;
    }
    if (timeToHHMM(endTime) <= timeToHHMM(startTime)) {
      Alert.alert('Horario inválido', 'La hora de fin debe ser después de la de inicio.');
      return;
    }
    onSave({
      name: name.trim(),
      dayOfWeek,
      startTime: timeToHHMM(startTime),
      endTime: timeToHHMM(endTime),
      location: location.trim(),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
            <Text style={styles.modalTitle}>Nueva clase</Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Cálculo III"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.fieldLabel}>Día</Text>
            <View style={styles.pillWrap}>
              {DAYS.map((d) => (
                <AppButton
                  key={d.value}
                  title={d.label}
                  onPress={() => setDayOfWeek(d.value)}
                  variant={dayOfWeek === d.value ? 'primary' : 'neutral'}
                  size="small"
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Hora de inicio</Text>
            <DateTimePicker
              value={startTime}
              mode="time"
              display="spinner"
              themeVariant="dark"
              onChange={(event, newDate) => newDate && setStartTime(newDate)}
              style={styles.timePicker}
            />

            <Text style={styles.fieldLabel}>Hora de fin</Text>
            <DateTimePicker
              value={endTime}
              mode="time"
              display="spinner"
              themeVariant="dark"
              onChange={(event, newDate) => newDate && setEndTime(newDate)}
              style={styles.timePicker}
            />

            <Text style={styles.fieldLabel}>Lugar (opcional)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ej. Bloque 4, salón 201"
              placeholderTextColor={colors.textTertiary}
            />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // Ver comentario equivalente en FinanceScreen.js: sin flex:1 propio, el
  // ScrollView no se dimensiona bien y empuja "+ Agregar clase" (fijo,
  // después del ScrollView) fuera del área visible.
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionLabel: { marginBottom: spacing.xs },
  empty: { color: colors.textSecondary, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderLeftWidth: 4,
    padding: spacing.lg,
    ...cardShadow,
  },
  cardLine: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  addButton: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalContent: {
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
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.separator, alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.xs },
  modalScroll: { paddingBottom: spacing.lg, gap: spacing.xs },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md, letterSpacing: -0.3 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5,
    borderColor: colors.fill,
    borderRadius: radius.input,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  // El spinner de hora tiene un tamaño de dibujo nativo fijo — no se estira
  // aunque el marco sea más ancho, así que se centra en vez de forzarle un
  // ancho (ver el comentario largo en schedulePicker.js).
  timePicker: { alignSelf: 'center' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  actionButton: { flex: 1 },
});
