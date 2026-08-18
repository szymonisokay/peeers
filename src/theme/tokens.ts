/**
 * Peeers design tokens.
 *
 * The `light` values come from the design spec (written in oklch) — the hex codes
 * below are its exact sRGB equivalent and match what was measured from the
 * mockups in assets/design. The `dark` values and the semantic colors were
 * measured directly from the mockups; each one names its source so it can be
 * re-checked.
 */

export const palette = {
  light: {
    /** oklch(0.92 0.005 260) — app background */
    background: '#F6F7F9',
    /** cards, sheets, bars */
    surface: '#FFFFFF',
    /** oklch(0.92 0.005 260) */
    border: '#E3E5E8',
    /** oklch(0.52 0.17 275) */
    accent: '#505AC8',
    /** oklch(0.24 0.01 260) */
    text: '#1C1F24',
    /** measured: 03-feed-przestrzeni (timestamp) */
    textMuted: '#7D8086',
    /** measured: 13-ekran-ty ("Usuń dane z tego telefonu") */
    danger: '#C13C3B',
    /** measured: 41-archiwum-list (checkmark on a closed list) */
    success: '#09672E',
    /** measured: 27-bez-sieci (offline banner) */
    warning: '#DEA143',
    warningSurface: '#FBF1DC',
    warningText: '#5F482E',
  },
  dark: {
    /** measured: 38-feed-ciemny */
    background: '#14161B',
    surface: '#1B1E25',
    border: '#2B2E34',
    /** measured: 38-feed-ciemny (add button) — lighter than light mode for contrast */
    accent: '#7787F3',
    /** measured: 40-notatka-ciemna */
    text: '#F0F2F4',
    textMuted: '#959698',
    /** dark-mode semantics — lightened variants, not present in the mockups */
    danger: '#E86B6A',
    success: '#3FA968',
    warning: '#E5B265',
    warningSurface: '#2A2416',
    warningText: '#E8D6B4',
  },
} as const;

/** Avatar colors — 8 options from 17-edycja-profilu / 33 / 34. Shared by both themes. */
export const avatarColors = [
  '#505AC8',
  '#2E7D46',
  '#C8562A',
  '#00868B',
  '#B4548F',
  '#2A78BE',
  '#8E9A1B',
  '#7A4A28',
] as const;

export const fontFamily = {
  regular: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semibold: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
} as const;

/**
 * Type scale. Headings 25–30/700, body 15–16/400–500,
 * labels 11/600 uppercase with .08em tracking (0.08 × 11 ≈ 0.88 px).
 */
export const typography = {
  titleLarge: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 36 },
  title: { fontFamily: fontFamily.bold, fontSize: 25, lineHeight: 31 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 23 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 23 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 21 },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export type ColorScheme = keyof typeof palette;
export type Colors = (typeof palette)[ColorScheme];
