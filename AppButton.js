// AppButton.js
// Botón reutilizable con el estilo "futurista" de la app. El <Button> nativo
// de React Native no permite personalizar fondo/radio/padding, así que este
// usa Pressable.
//
// Variantes:
// - primary: degradado cian → violeta (expo-linear-gradient), texto oscuro
//   "recortado" — la acción principal de cada pantalla
// - secondary: fondo cian translúcido con borde de resplandor, texto cian
// - neutral: fondo gris-azulado oscuro, texto claro (ej. "Cancelar")
// - plain: sin fondo, solo texto de color (ej. "Cerrar sesión")

import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, gradients } from './theme';

const VARIANTS = {
  primary: { gradient: gradients.primary, text: colors.background },
  secondary: { bg: colors.accentSoft, bgPressed: 'rgba(0, 229, 255, 0.2)', text: colors.accent, border: 'rgba(0, 229, 255, 0.35)' },
  neutral: { bg: colors.fill, bgPressed: colors.separator, text: colors.text },
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
  const isGradient = variant === 'primary';

  const content = loading ? (
    <ActivityIndicator size="small" color={isGradient ? v.text : colors.accent} />
  ) : (
    <View style={styles.content}>
      <Text style={[styles.text, styles[`text_${size}`], variant === 'plain' && styles.textPlain, { color: v.text }]}>
        {title}
      </Text>
    </View>
  );

  if (isGradient) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          styles.gradientRim,
          sizeStyle,
          style,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressedOverlay,
        ]}
      >
        <LinearGradient
          colors={v.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variant === 'plain' && styles.plainPadding,
        {
          backgroundColor: pressed && !isDisabled ? v.bgPressed : v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
        },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.buttonSmall,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Filo claro de 1px sobre el degradado — el botón primario es la única
  // superficie de acento sólida de la app (las tarjetas son oscuras con
  // borde cian); sin este realce se ve plano al lado del resplandor de las
  // tarjetas. Un solo borderColor translúcido en vez de borde por lado
  // porque RN no soporta gradientes de borde nativos.
  gradientRim: { borderWidth: 1, borderColor: colors.rimLight },
  default: { paddingVertical: 9, paddingHorizontal: 14 },
  small: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8 },
  large: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.button, width: '100%' },
  plainPadding: { paddingVertical: 4, paddingHorizontal: 0 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 13.5, fontWeight: '600' },
  text_default: {},
  text_small: { fontSize: 14 },
  text_large: { fontSize: 16, fontWeight: '700' },
  textPlain: { fontSize: 13.5, fontWeight: '500' },
  disabled: { opacity: 0.5 },
  pressedOverlay: { opacity: 0.88 },
});
