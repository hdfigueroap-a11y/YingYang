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
  warning: '#ffb020', // aviso (ej. presupuesto acercándose al límite) — color de estado, nunca de la paleta categórica
  warningSoft: 'rgba(255, 176, 32, 0.12)',
  separator: '#232a45',
  fill: '#1b2140', // fondo neutro (botones "Cancelar", inputs deshabilitados)
  fillSoft: '#151933',
  glowBorder: 'rgba(0, 229, 255, 0.16)', // borde de tarjeta con tinte cian sutil — reemplaza `separator` en cardShadow para reforzar el efecto "vidrio" en vez de un borde gris neutro
  rimLight: 'rgba(255, 255, 255, 0.14)', // realce claro de 1px en el borde superior de botones con degradado — simula el filo iluminado típico del estilo "futurista"
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

// Sombra de tarjeta estilo "glow": borde con tinte cian + resplandor en vez
// de la sombra negra clásica (una sombra negra no se nota sobre un fondo
// casi negro). El borde pasó de gris neutro (`separator`) a `glowBorder`
// (cian muy tenue) para que la tarjeta lea como un panel de vidrio con luz
// propia, no solo como un rectángulo con sombra debajo — mismo lenguaje
// visual que ya usaban el degradado de acento y el resplandor. Solo iOS — la
// app es de uso exclusivo en iPhone.
export const cardShadow = {
  borderWidth: 1,
  borderColor: colors.glowBorder,
  shadowColor: colors.accent,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.24,
  shadowRadius: 14,
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

// Paleta categórica para darle identidad de color a cursos, categorías,
// bloques y eventos (franja de color, puntos de evento, barras de gráfico)
// sin depender solo del acento cian. Validada con la herramienta de
// paletas categóricas del skill de dataviz contra el fondo oscuro de la
// app (#05060f): banda de luminosidad, piso de croma, separación CVD
// (daltonismo) en pares adyacentes, piso de visión normal y contraste —
// las seis pasan. La paleta anterior (10 tonos) fallaba: varios colores
// eran demasiado claros para el fondo oscuro, y el cian de acento
// (#00E5FF) y un teal casi idéntico eran indistinguibles incluso con
// visión de color normal. Se bajó a 7 tonos bien separados — se
// intentó meter un octavo (amarillo/dorado) pero esa franja del círculo
// de color choca con naranja y con verde en casi cualquier variante
// probada (el propio skill documenta que amarillo-naranja es un par
// difícil); mejor menos colores bien distinguibles que más colores
// parecidos. Ver docs/decisiones.md.
export const palette = [
  '#E11D48', // rojo carmesí
  '#D9720A', // naranja quemado
  '#16A34A', // verde
  '#0891A6', // teal
  '#1D5FD1', // azul
  '#8B3DFF', // violeta
  '#E11D74', // magenta
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
