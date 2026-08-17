// notifications.js
// Notificaciones locales (expo-notifications) — recordatorios antes de que
// empiece una clase/evento de hoy, antes del vencimiento de una tarea
// urgente, y un día antes del pago de una tarjeta de crédito. Todo se
// calcula y programa en el dispositivo; no hay servidor ni Expo push token
// de por medio (son notificaciones LOCALES, no push).
//
// Limitación real: como no hay un proceso en segundo plano que reprograme
// esto solo, los recordatorios se (re)programan cada vez que se abre la
// pantalla que los usa (TodayScreen.js, FinanceScreen.js) — si la app no se
// abre en varios días, los recordatorios de esos días no se generan. Cada
// recordatorio tiene un id estable (incluye la fecha del día en cuestión),
// así que reabrir la pantalla el mismo día solo reemplaza el aviso
// existente, nunca duplica.

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function hasNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Programa (o reemplaza, si ya existía con el mismo id) un recordatorio
// para una fecha futura. Si la fecha ya pasó, no hace nada — evita
// notificaciones "vencidas" que nunca se iban a mostrar.
export async function scheduleReminder(id, { title, body, date }) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  if (!date || date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function cancelReminder(id) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
