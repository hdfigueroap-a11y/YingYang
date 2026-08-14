// theme.js
// Paleta y constantes de estilo compartidas — diseño oscuro "futurista": fondo
// casi negro con tinte azul-violeta, tarjetas con borde sutil y resplandor
// (glow) cian, acentos en gradiente cian → violeta vía expo-linear-gradient
// (ver AppButton.js). Un solo lugar para tocar colores/espaciados en vez de
// repetir hex sueltos en cada pantalla.

export const colors = {
  background: '#05060f', // fondo base, casi negro con tinte azul
  surface: '#12162a', // fondo de tarjetas/inputs
  surfaceRaised: '#181d38', // variante más clara (elementos elevados/focus)
  text: '#eef1ff',
  textSecondary: '#8f97b8',
  textTertiary: '#565d7a',
  accent: '#00e5ff', // cian eléctrico
  accent2: '#7b2ff7', // violeta — segundo color del gradiente de acento
  accentSoft: 'rgba(0, 229, 255, 0.1)', // fondo suave para botones secundarios de acento
  danger: '#ff3864',
  dangerSoft: 'rgba(255, 56, 100, 0.12)',
  success: '#00ffa3',
  successSoft: 'rgba(0, 255, 163, 0.12)',
  separator: '#232a45',
  fill: '#1b2140', // fondo neutro (botones "Cancelar", inputs deshabilitados)
  fillSoft: '#151933',
};

// Gradientes reutilizables (expo-linear-gradient) — el botón primario y
// algunos acentos visuales usan estos en vez de un color sólido, para el
// efecto "futurista" de degradado cian → violeta.
export const gradients = {
  primary: ['#00e5ff', '#7b2ff7'],
  success: ['#00ffa3', '#00c2ff'],
  danger: ['#ff3864', '#ff00c8'],
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

// Sombra de tarjeta estilo "glow": borde sutil + resplandor cian en vez de la
// sombra negra clásica (una sombra negra no se nota sobre un fondo casi
// negro). Solo iOS — la app es de uso exclusivo en iPhone.
export const cardShadow = {
  borderWidth: 1,
  borderColor: colors.separator,
  shadowColor: colors.accent,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
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
// franja de color, íconos, puntos de evento) sin depender solo del acento
// cian. Tonos neón, elegidos para leerse bien sobre el fondo casi negro.
export const palette = [
  '#FF3B5C', // rojo neón
  '#FF9F1C', // naranja
  '#FFD60A', // amarillo
  '#39FF88', // verde neón
  '#00F5D4', // teal neón
  '#00E5FF', // cian (acento)
  '#3D8BFF', // azul
  '#7B2FF7', // violeta
  '#C77DFF', // púrpura claro
  '#FF2DA0', // rosa neón
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
