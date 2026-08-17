// ScheduleScreen.js
// Pantalla de Horario de clases — vista semanal (lunes a sábado) de
// referencia, guardada en scheduleDb.js (SQLite local, separado de
// Finanzas). Cada clase se puede "agendar" como evento semanal recurrente
// en el Calendario nativo del iPhone (deviceCalendar.js,
// createWeeklyRecurringEvent) — eso sí pide permiso de Calendario, igual
// que el resto de la app.
//
// El modal "Nueva clase" vive en AddClassModal.js (antes estaba definido
// acá mismo — ver el mismo patrón aplicado a FinanceScreen.js).

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { initScheduleDatabase, getClasses, addClass, deleteClass } from './scheduleDb';
import { hasPermission, requestPermission, createWeeklyRecurringEvent } from './deviceCalendar';
import AppButton from './AppButton';
import { colors, typography, colorFromString } from './theme';
import { nextDateForWeekday, combineDateAndTime, formatTimeLabel } from './formatters';
import { styles } from './scheduleStyles';
import AddClassModal, { DAYS } from './AddClassModal';

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
