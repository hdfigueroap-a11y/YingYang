// deviceCalendar.js
// Maneja permisos y eventos usando el Calendario nativo del iPhone (EventKit),
// sin ninguna cuenta externa ni servicio en la nube.

import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

// Pide permiso de Calendario al usuario (solo la primera vez se muestra el diálogo)
export async function requestPermission() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function hasPermission() {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === 'granted';
}

// Encuentra (o identifica) el calendario por defecto donde crear los eventos.
// En iOS, se busca el calendario marcado como "por defecto" del sistema.
async function getDefaultCalendarId() {
  if (Platform.OS === 'ios') {
    const defaultCal = await Calendar.getDefaultCalendarAsync();
    return defaultCal.id;
  }

  // Fallback (Android u otros): toma el primer calendario modificable
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((cal) => cal.allowsModifications);
  return writable?.id ?? calendars[0]?.id;
}

// Crea un evento en el Calendario nativo
export async function createEvent({ title, notes, startDate, endDate }) {
  const calendarId = await getDefaultCalendarId();
  if (!calendarId) {
    throw new Error('No se encontró un calendario disponible en el dispositivo.');
  }

  return Calendar.createEventAsync(calendarId, {
    title,
    notes,
    startDate,
    endDate,
    timeZone: undefined, // usa la zona horaria local del dispositivo
  });
}

// Crea un evento semanal recurrente (usado por el Horario de clases: una
// clase fija cada semana). `occurrenceCount` por defecto cubre un semestre
// típico (16 semanas) — no hay UI para cambiarlo, se puede volver a crear
// si se necesita extender.
export async function createWeeklyRecurringEvent({ title, notes, startDate, endDate, occurrenceCount = 16 }) {
  const calendarId = await getDefaultCalendarId();
  if (!calendarId) {
    throw new Error('No se encontró un calendario disponible en el dispositivo.');
  }

  return Calendar.createEventAsync(calendarId, {
    title,
    notes,
    startDate,
    endDate,
    timeZone: undefined,
    recurrenceRule: {
      frequency: Calendar.Frequency.WEEKLY,
      interval: 1,
      occurrenceCount,
    },
  });
}

// Trae los eventos entre dos fechas (por defecto, próximos 7 días)
export async function listUpcomingEvents(days = 7) {
  const calendarId = await getDefaultCalendarId();
  if (!calendarId) return [];

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);

  const events = await Calendar.getEventsAsync([calendarId], start, end);
  return events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

// Trae los eventos ya existentes de un día específico (00:00 a 23:59), para
// mostrarlos junto al selector de fecha/hora y evitar choques de horario.
export async function listEventsForDay(date) {
  const calendarId = await getDefaultCalendarId();
  if (!calendarId) return [];

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const events = await Calendar.getEventsAsync([calendarId], start, end);
  return events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}
