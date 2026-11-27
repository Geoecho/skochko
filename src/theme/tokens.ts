// Design tokens. Single source of truth for colour, type, spacing, radius, motion.
// Soft monochrome surfaces and high contrast controls.

export const colors = {
  bg: '#F1F2F3',
  bgElevated: '#F4F4F5',
  text: '#191919',
  textSecondary: '#696969',
  textTertiary: '#767676',
  // Periwinkle for text, icons and route lines on dark surfaces.
  accent: '#272727',
  accentPressed: '#454545',
  // Deep violet for solid controls with white labels.
  accentFill: '#191919',
  accentFillPressed: '#363636',
  onAccent: '#FFFFFF',
  danger: '#B5364A',
  success: '#23754D',
  hairline: 'rgba(25,25,25,0.10)',
  // Liquid glass: low-alpha tint + blur; the map shows through.
  glass: '#FFFFFF',
  glassStrong: '#FFFFFF',
  // Bottom sheet: a bit denser so list text stays readable over busy map areas.
  glassSheet: '#F1F2F3',
  // Fallback fills when the browser has no backdrop-filter (opaque enough to read, still lighter than the map).
  glassNoBlur: '#FFFFFF',
  glassSheetNoBlur: '#F1F2F3',
  // Glass inside glass: no extra blur, just a light tint.
  glassInner: '#FFFFFF',
  glassInnerStrong: 'rgba(25,25,25,0.10)',
  glassHighlight: '#FFFFFF',
  glassRim: 'rgba(25,25,25,0.08)',
  scrim: 'rgba(0,0,0,0.45)',
  category: {
    bar: '#F4E9D5',
    pub: '#DEEDE4',
    cafe: '#DEEDE4',
    club: '#E9E3F2',
    rakija_bar: '#F4E9D5',
    wine_bar: '#E9E3F2',
    cocktail_bar: '#E9E3F2',
    brewery: '#DEEDE4',
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
  title: { fontSize: 24, lineHeight: 31 },
  display: { fontSize: 32, lineHeight: 39 },
} as const;

// 4 pt grid
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 22, card: 28, sheet: 34, pill: 999 } as const;

export const touch = { min: 44 } as const;

// Spring presets for reanimated withSpring
export const springs = {
  snappy: { damping: 26, stiffness: 320, mass: 0.9 },
  soft: { damping: 22, stiffness: 180, mass: 1 },
} as const;

export const blur = { glass: 24, saturate: 170, brightness: 1.38 } as const;
