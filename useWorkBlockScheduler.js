// useWorkBlockScheduler.js
// Hook reutilizable: agenda un bloque de trabajo en el Calendario para una
// tarea (assignment) de Canvas. El usuario elige la dificultad (fácil = 1h,
// difícil = 2h) y luego el día/hora exactos en el selector — el punto de
// partida del selector es siempre "ahora + 5 min", sin importar la fecha
// límite de la tarea. No se sugiere una hora cercana al vencimiento: el
// usuario elige libremente cuándo quiere trabajar en la tarea. Usado por
// TasksScreen.js y CoursesScreen.js.
//
// A diferencia de CalendarScreen.js (que solo muestra sus bloques rápidos
// después de tener permiso de Calendario), Tareas y Cursos pueden ser la
// primera pantalla que ve el usuario, así que este hook pide el permiso aquí
// mismo si todavía no fue otorgado, en vez de fallar en silencio.

import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { createEvent, hasPermission, requestPermission } from './deviceCalendar';
import { openAndroidPicker } from './schedulePicker';

const DIFFICULTY_DURATION_MIN = { facil: 60, dificil: 120 };

function defaultStart() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now;
}

export function useWorkBlockScheduler() {
  const [scheduling, setScheduling] = useState(null); // id del assignment en proceso
  const [pendingItem, setPendingItem] = useState(null); // { assignment, durationMin }
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showIosPicker, setShowIosPicker] = useState(false);

  function scheduleWorkBlock(assignment) {
    Alert.alert(
      'Dificultad de la tarea',
      `¿Qué tan difícil es "${assignment?.name ?? 'esta tarea'}"?`,
      [
        { text: 'Fácil (1h)', onPress: () => startScheduling(assignment, 'facil') },
        { text: 'Difícil (2h)', onPress: () => startScheduling(assignment, 'dificil') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }

  async function startScheduling(assignment, difficulty) {
    const granted = (await hasPermission()) || (await requestPermission());
    if (!granted) {
      Alert.alert(
        'Permiso de Calendario necesario',
        'Para programar bloques de trabajo, la app necesita acceso a tu Calendario. Puedes otorgarlo desde la pestaña Calendario, o en Ajustes > Privacidad > Calendarios.'
      );
      return;
    }

    const durationMin = DIFFICULTY_DURATION_MIN[difficulty];
    const initial = defaultStart();

    setPendingItem({ assignment, durationMin });
    setPickerDate(initial);

    if (Platform.OS === 'android') {
      openAndroidPicker(
        initial,
        (time) => createWorkBlock(assignment, durationMin, time),
        () => setPendingItem(null)
      );
    } else {
      setShowIosPicker(true);
    }
  }

  function handleIosPickerChange(event, date) {
    if (date) setPickerDate(date);
  }

  function confirmIosPicker() {
    setShowIosPicker(false);
    createWorkBlock(pendingItem.assignment, pendingItem.durationMin, pickerDate);
  }

  function cancelIosPicker() {
    setShowIosPicker(false);
    setPendingItem(null);
  }

  async function createWorkBlock(assignment, durationMin, start) {
    setScheduling(assignment.id);
    try {
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + durationMin);

      const dueNote = assignment.due_at
        ? ` Vence: ${new Date(assignment.due_at).toLocaleString()}`
        : '';

      await createEvent({
        title: `Trabajo: ${assignment.name ?? 'Tarea de Canvas'}`,
        notes: `Creado desde Canvas Dashboard.${dueNote}`,
        startDate: start,
        endDate: end,
      });

      Alert.alert('Listo', 'Se creó el bloque de trabajo en tu Calendario');
    } catch (err) {
      Alert.alert('Error creando el evento', String(err.message || err));
    } finally {
      setScheduling(null);
      setPendingItem(null);
    }
  }

  return {
    scheduling,
    pendingItem,
    pickerDate,
    showIosPicker,
    scheduleWorkBlock,
    handleIosPickerChange,
    confirmIosPicker,
    cancelIosPicker,
  };
}
