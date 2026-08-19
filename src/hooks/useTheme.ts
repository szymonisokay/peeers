import { useColorScheme } from 'react-native';

import { fontFamily, motion, palette, radius, spacing, typography, type ColorScheme } from '@/theme';

/**
 * Theme for the device's current color scheme.
 *
 * The "Wygląd" screen (22-wyglad) lets the user force light/dark and scale text —
 * wire that in here once user settings exist.
 */
export function useTheme() {
  // useColorScheme can return null / 'unspecified' — both are treated as light.
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return {
    scheme,
    colors: palette[scheme],
    typography,
    spacing,
    radius,
    fontFamily,
    motion,
  };
}
