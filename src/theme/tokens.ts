// Design tokens. Single source of truth for colour, type, spacing, radius, motion.
// Dark-first "liquid glass" theme, see WORKSHEET.md section 5.

export const colors = {
  bg: '#0B0B0F',
  bgElevated: '#141419',
  text: '#F5F5F7',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  // Periwinkle for text, icons and route lines on dark surfaces.
  accent: '#B5ABFF',
  accentPressed: '#9C8EF4',
  // Deep violet for solid controls with white labels.
  accentFill: '#5E4CB7',
  accentFillPressed: '#4C399B',
  onAccent: '#FFFFFF',
  danger: '#FF6B81',
  success: '#34D399',
  hairline: 'rgba(255,255,255,0.12)',
  // Liquid glass: low-alpha tint + blur; the map shows through.
  glass: 'rgba(60,60,74,0.30)',
  glassStrong: 'rgba(52,52,66,0.42)',
  // Bottom sheet: a bit denser so list text stays readable over busy map areas.
  glassSheet: 'rgba(46,46,58,0.46)',
  // Fallback fills when the browser has no backdrop-filter (opaque enough to read, still lighter than the map).
  glassNoBlur: 'rgba(44,44,56,0.9)',
  glassSheetNoBlur: 'rgba(38,38,48,0.96)',
  // Glass inside glass: no extra blur, just a light tint.
  glassInner: 'rgba(255,255,255,0.06)',
  glassInnerStrong: 'rgba(255,255,255,0.09)',
  glassHighlight: 'rgba(255,255,255,0.05)',
  glassRim: 'rgba(255,255,255,0.22)',
  scrim: 'rgba(0,0,0,0.45)',
  category: {
    bar: '#FB7185',
    pub: '#F5B83D',
    cafe: '#C8A27A',
    club: '#22D3EE',
    rakija_bar: '#818CF8',
    wine_bar: '#E879F9',
    cocktail_bar: '#2DD4BF',
    brewery: '#EAB308',
  },
} as const;

export type VenueCategory = keyof typeof colors.category;

export const font = {
  regular: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const type = {
  caption: { fontSize: 13, lineHeight: 18 },
  body: { fontSize: 15, lineHeight: 22 },
  headline: { fontSize: 17, lineHeight: 24 },
  title: { fontSize: 22, lineHeight: 28 },
  display: { fontSize: 28, lineHeight: 34 },
} as const;

// 4 pt grid
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, card: 16, sheet: 28, pill: 999 } as const;

export const touch = { min: 44 } as const;

// Spring presets for reanimated withSpring
export const springs = {
  snappy: { damping: 26, stiffness: 320, mass: 0.9 },
  soft: { damping: 22, stiffness: 180, mass: 1 },
} as const;

export const blur = { glass: 24, saturate: 170, brightness: 1.38 } as const;
