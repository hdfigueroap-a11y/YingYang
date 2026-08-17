// scheduleStyles.js
// Estilos compartidos entre ScheduleScreen.js y AddClassModal.js — mismo
// patrón que financeStyles.js: se extraen junto con el modal a un archivo
// propio sin cambiar ningún valor, solo la ubicación.

import { StyleSheet } from 'react-native';
import { colors, radius, spacing, cardShadow } from './theme';

export const styles = StyleSheet.create({
  // paddingTop: todas las demás pantallas del Drawer (Hoy, Tareas, Cursos,
  // Calendario, Finanzas, Ajustes) respiran spacing.md bajo el header — a
  // esta le faltaba, así que el lunes quedaba pegado al borde superior.
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
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
  // Ver el comentario equivalente en financeStyles.js: fondo translúcido +
  // overflow:'hidden' para que el <BlurView> montado como primer hijo (en
  // AddClassModal.js) lea como vidrio esmerilado recortado a las esquinas.
  modalContent: {
    backgroundColor: 'rgba(5, 6, 15, 0.72)',
    overflow: 'hidden',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.glowBorder,
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
