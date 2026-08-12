// theme.js
// Paleta y constantes de estilo compartidas — estilo iOS nativo (SF Pro,
// superficies blancas sobre fondo gris #F2F2F7, acento azul del sistema).
// Un solo lugar para tocar colores/espaciados en vez de repetir hex sueltos
// en cada pantalla.

export const colors = {
  background: '#f2f2f7', // fondo agrupado (detrás de las tarjetas)
  surface: '#ffffff', // fondo de tarjetas/inputs
  text: '#1c1c1e',
  textSecondary: '#6c6c70',
  textTertiary: '#aeaeb2',
  accent: '#007aff',
  accentSoft: '#f0f8ff', // fondo suave para botones secundarios de acento
  danger: '#c0392b',
  dangerSoft: '#fff5f5',
  success: '#34c759',
  successSoft: '#f0fff4',
  separator: '#c6c6c8',
  fill: '#e5e5ea', // fondo neutro (botones "Cancelar", inputs deshabilitados)
  fillSoft: '#f2f2f7',
};

export const radius = {
  card: 14,
  button: 12,
  buttonSmall: 9,
  input: 10,
  sheet: 20,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Sombra sutil de tarjeta (solo iOS — la app es de uso exclusivo en iPhone)
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
};

export const typography = {
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: { fontSize: 15.5, fontWeight: '600', color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary },
};

// Paleta amplia para darle color a cursos, bloques y eventos (tarjetas con
// franja de color, íconos, puntos de evento) sin depender solo del azul de
// acento. Colores vivos pero del mismo "temperamento" visual (saturación y
// brillo similares) para que combinen entre sí.
export const palette = [
  '#FF3B30', // rojo
  '#FF9500', // naranja
  '#FFCC00', // amarillo
  '#34C759', // verde
  '#00C7BE', // teal
  '#30B0C7', // cian
  '#007AFF', // azul
  '#5856D6', // índigo
  '#AF52DE', // púrpura
  '#FF2D55', // rosa
];

// Asigna un color de la paleta a partir de un texto (ej. nombre de curso),
// siempre el mismo color para el mismo texto — así cada curso/evento tiene
// una identidad de color consistente en toda la app sin tener que guardarla.
export function colorFromString(text) {
  const str = text || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
