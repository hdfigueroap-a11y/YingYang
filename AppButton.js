// AppButton.js
// Botón reutilizable con el estilo del diseño de Figma Make (fondos "pill",
// sin borde, con estado de presionado). El <Button> nativo de React Native no
// permite personalizar fondo/radio/padding, así que este usa Pressable.
//
// Variantes:
// - primary: fondo azul sólido, texto blanco (acciones principales)
// - secondary: fondo azul suave, texto azul (acciones secundarias en tarjetas)
// - neutral: fondo gris, texto oscuro (ej. "Cancelar")
// - plain: sin fondo, solo texto de color (ej. "Cerrar sesión")

import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, radius } from './theme';

const VARIANTS = {
  primary: { bg: colors.accent, bgPressed: '#0064d6', text: '#fff' },
  secondary: { bg: colors.fillSoft, bgPressed: '#e2e2ea', text: colors.accent },
  neutral: { bg: colors.fill, bgPressed: '#d8d8dd', text: colors.text },
  plain: { bg: 'transparent', bgPressed: 'transparent', text: colors.textSecondary },
};

export default function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'secondary',
  size = 'default',
  style,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.secondary;
  const isDisabled = disabled || loading;
  const sizeStyle = styles[size] ?? styles.default;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variant === 'plain' && styles.plainPadding,
        { backgroundColor: pressed && !isDisabled ? v.bgPressed : v.bg },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : colors.accent} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.text, styles[`text_${size}`], variant === 'plain' && styles.textPlain, { color: v.text }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.buttonSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: { paddingVertical: 9, paddingHorizontal: 14 },
  small: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8 },
  large: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.button, width: '100%' },
  plainPadding: { paddingVertical: 4, paddingHorizontal: 0 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 13.5, fontWeight: '500' },
  text_default: {},
  text_small: { fontSize: 14 },
  text_large: { fontSize: 16, fontWeight: '600' },
  textPlain: { fontSize: 13.5 },
  disabled: { opacity: 0.5 },
});
