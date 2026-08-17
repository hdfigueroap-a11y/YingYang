// CalendarScreen.js
// Usa el Calendario nativo del iPhone — sin login, sin cuentas externas.
// Solo pide permiso del sistema una vez.

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { openAndroidPicker, SchedulePickerModal } from './schedulePicker';
import {
  requestPermission,
  hasPermission,
  createEvent,
  listUpcomingEvents,
} from './deviceCalendar';
import AppButton from './AppButton';
import { colors, radius, spacing, cardShadow, typography, colorFromString, palette } from './theme';

// Plantillas rápidas para los bloques que definimos: sueño, lectura, gym, trabajo.
// Cada uno con su propio color e ícono para diferenciarlos de un vistazo,
// tomado de `palette` (theme.js) en vez de repetir el hex a mano. "Trabajo"
// usa colors.danger/colors.accent (no la paleta categórica) porque ahí el
// color SÍ es semántico — difícil=urgente, fácil=acción por defecto.
const QUICK_BLOCKS = [
  { title: 'Sueño', durationMin: 480, icon: '😴', color: palette[5] }, // violeta, 8h
  { title: 'Lectura', durationMin: 60, icon: '📖', color: palette[1] }, // naranja quemado
  { title: 'Gimnasio', durationMin: 60, icon: '🏋️', color: palette[2] }, // verde
  { title: 'Trabajo — tarea difícil', durationMin: 120, icon: '🔴', color: colors.danger },
  { title: 'Trabajo — tarea fácil', durationMin: 60, icon: '🔵', color: colors.accent },
];

function formatDuration(durationMin) {
  return durationMin >= 60 ? `${durationMin / 60}h` : `${durationMin}min`;
}

export default function CalendarScreen() {
  const [granted, setGranted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [creating, setCreating] = useState(null);
  const [pendingBlock, setPendingBlock] = useState(null); // bloque esperando fecha/hora
  const [initialDate, setInitialDate] = useState(new Date()); // solo para sembrar el modal al abrirlo
  const [showIosPicker, setShowIosPicker] = useState(false);

  useEffect(() => {
    (async () => {
      setGranted(await hasPermission());
      setChecking(false);
    })();
  }, []);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const items = await listUpcomingEvents(7);
      setEvents(items);
    } catch (err) {
      Alert.alert('Error cargando eventos', String(err.message || err));
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (granted) loadEvents();
  }, [granted, loadEvents]);

  async function handleRequestPermission() {
    const ok = await requestPermission();
    setGranted(ok);
    if (!ok) {
      Alert.alert(
        'Permiso denegado',
        'Puedes habilitarlo luego en Ajustes > Privacidad > Calendarios.'
      );
    }
  }

  function openScheduler(block) {
    const initial = new Date();
    initial.setMinutes(initial.getMinutes() + 5);
    setPendingBlock(block);
    setInitialDate(initial);

    if (Platform.OS === 'android') {
      openAndroidPicker(
        initial,
        (time) => createBlockEvent(block, time),
        () => setPendingBlock(null)
      );
    } else {
      setShowIosPicker(true);
    }
  }

  function confirmIosPicker(finalDate) {
    setShowIosPicker(false);
    createBlockEvent(pendingBlock, finalDate);
  }

  function cancelIosPicker() {
    setShowIosPicker(false);
    setPendingBlock(null);
  }

  async function createBlockEvent(block, start) {
    setCreating(block.title);
    try {
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + block.durationMin);

      await createEvent({
        title: block.title,
        notes: 'Creado desde Canvas Dashboard',
        startDate: start,
        endDate: end,
      });

      Alert.alert('Listo', `Se creó el bloque "${block.title}" en tu Calendario`);
      loadEvents();
    } catch (err) {
      Alert.alert('Error creando el evento', String(err.message || err));
    } finally {
      setCreating(null);
      setPendingBlock(null);
    }
  }

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionBadge}>
          <Text style={styles.permissionIcon}>📅</Text>
        </View>
        <Text style={styles.permissionTitle}>Acceso al Calendario</Text>
        <Text style={styles.permissionSubtitle}>
          Canvas Dashboard necesita acceso a tu Calendario de iPhone para crear
          bloques de trabajo y ver tus próximos eventos.
        </Text>
        <AppButton
          title="Dar permiso"
          onPress={handleRequestPermission}
          variant="primary"
          size="large"
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.sectionLabel}>Crear bloque rápido</Text>
          </View>
          {QUICK_BLOCKS.map((block, i) => (
            <View
              key={block.title}
              style={[styles.blockRow, i < QUICK_BLOCKS.length - 1 && styles.rowDivider]}
            >
              <View style={[styles.blockIcon, { backgroundColor: `${block.color}22` }]}>
                <Text style={styles.blockIconText}>{block.icon}</Text>
              </View>
              <View style={styles.blockInfo}>
                <Text style={styles.blockLabel}>{block.title}</Text>
                <Text style={[styles.blockDuration, { color: block.color }]}>
                  {formatDuration(block.durationMin)}
                </Text>
              </View>
              <AppButton
                title={creating === block.title ? '...' : 'Crear'}
                onPress={() => openScheduler(block)}
                disabled={Boolean(creating)}
                size="small"
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.sectionLabel}>Próximos eventos — 7 días</Text>
          </View>
          {loadingEvents ? (
            <ActivityIndicator style={styles.eventsLoading} color={colors.accent} />
          ) : events.length === 0 ? (
            <Text style={styles.empty}>Sin eventos próximos</Text>
          ) : (
            events.map((item, i) => (
              <View
                key={item.id}
                style={[styles.eventRow, i < events.length - 1 && styles.rowDivider]}
              >
                <View style={[styles.eventDot, { backgroundColor: colorFromString(item.title) }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{item.title ?? '(sin título)'}</Text>
                  <Text style={styles.eventTime}>{new Date(item.startDate).toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <SchedulePickerModal
        visible={showIosPicker}
        label={pendingBlock ? `¿Cuándo empieza "${pendingBlock.title}"?` : ''}
        initialDate={initialDate}
        onConfirm={confirmIosPicker}
        onCancel={cancelIosPicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  permissionBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...cardShadow,
  },
  permissionIcon: { fontSize: 30 },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  permissionSubtitle: {
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  permissionButton: { width: 220 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.fill,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.fillSoft },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  blockIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  blockIconText: { fontSize: 16 },
  blockInfo: { flex: 1, marginRight: spacing.sm },
  blockLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  blockDuration: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14.5, fontWeight: '500', color: colors.text },
  eventTime: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  eventsLoading: { paddingVertical: spacing.lg },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
});
