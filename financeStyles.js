// financeStyles.js
// Estilos compartidos entre FinanceScreen.js y sus modales
// (AddTransactionModal, CardPurchasesModal, ConfigCardModal, BudgetModal).
// Antes vivían todos en un único StyleSheet dentro de FinanceScreen.js
// (904 líneas en un solo archivo); se extrajeron junto con los modales a
// archivos propios sin cambiar ni un valor, solo la ubicación.

import { StyleSheet } from 'react-native';
import { colors, radius, spacing, cardShadow } from './theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  // El ScrollView necesita su propio flex:1 además de contentContainerStyle
  // — sin esto no se dimensiona bien dentro de `container` y empuja el
  // botón "+ Agregar movimiento" (que va DESPUÉS del ScrollView, fijo, no
  // dentro de él) fuera del área visible de la pantalla.
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
    minWidth: 150,
    textAlign: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  summaryTile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  summaryDelta: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  balanceTile: { borderRadius: radius.card, padding: spacing.lg },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  balanceValue: { fontSize: 24, fontWeight: '700', color: colors.background, marginTop: 4 },
  section: { gap: spacing.sm },
  sectionLabel: { marginBottom: spacing.xs },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    ...cardShadow,
  },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetName: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  budgetAmounts: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fill,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  deleteLink: { alignSelf: 'center', marginTop: spacing.sm },
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
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    ...cardShadow,
  },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14.5, fontWeight: '500', color: colors.text },
  txSubtitle: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 14.5, fontWeight: '700' },
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
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modalScroll: { paddingBottom: spacing.lg, gap: spacing.xs },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md, letterSpacing: -0.3 },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  pill: { flex: 1 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.fill,
    borderRadius: radius.input,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  // El calendario "inline" tiene un tamaño de dibujo nativo fijo — no se
  // estira aunque el marco sea más ancho, así que se centra en vez de
  // forzarle un ancho (ver el comentario largo en schedulePicker.js).
  datePicker: { alignSelf: 'center' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  pillWrapItem: {},
  actionButton: { flex: 1 },
});
