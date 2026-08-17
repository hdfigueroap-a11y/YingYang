// AddClassModal.js
// Modal "Nueva clase" de ScheduleScreen.js, extraído del archivo original
// (mismo patrón que los modales de Finanzas — ver AddTransactionModal.js).

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Modal, Alert, KeyboardAvoidingView, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import AppButton from './AppButton';
import { colors } from './theme';
import { timeToHHMM, hhmmToDate } from './formatters';
import { styles } from './scheduleStyles';

export const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

export default function AddClassModal({ visible, onCancel, onSave }) {
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
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
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
