// YinYangMark.js
// Distintivo circular de la app — el nombre "Ying-Yang" se refleja en la
// identidad visual como un orbe de dos mitades (el degradado cian→violeta
// que ya existía en gradients.primary) con un punto de cada color en la
// mitad contraria, tomando prestada la idea de los dos puntos del símbolo
// yin-yang sin dibujar la curva S real — eso pediría una librería de SVG
// nueva (react-native-svg), y esto se logra con Views planas usando lo que
// ya está instalado (expo-linear-gradient). Se usa en LoginScreen.js y en
// el encabezado del menú (App.js).

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from './theme';

export default function YinYangMark({ size = 64 }) {
  const dotSize = Math.round(size * 0.16);
  const half = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: half }]}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <View
        style={[
          styles.dot,
          { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: colors.accent2, top: size * 0.2, left: size * 0.66 },
        ]}
      />
      <View
        style={[
          styles.dot,
          { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: colors.accent, bottom: size * 0.2, right: size * 0.66 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  dot: { position: 'absolute' },
});
