// ErrorBoundary.js
// Red de seguridad para toda la app: sin esto, un error de render no
// capturado en cualquier pantalla deja una pantalla en blanco sin
// recuperación. React solo puede capturar errores de render con un
// componente de clase (no hay equivalente en hooks todavía) — no requiere
// ninguna dependencia nueva. "Reintentar" limpia el error y vuelve a
// montar el árbol; si el error persiste (ej. un bug real de código), el
// usuario puede al menos ver qué pasó en vez de una pantalla negra.

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AppButton from './AppButton';
import { colors, radius, spacing, typography } from './theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary capturó un error de render:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={typography.screenTitle}>Algo salió mal</Text>
            <Text style={styles.message}>{String(this.state.error?.message || this.state.error)}</Text>
            <AppButton title="Reintentar" onPress={() => this.setState({ error: null })} variant="primary" />
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
});
