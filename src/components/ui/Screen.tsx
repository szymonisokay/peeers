import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks';

type ScreenProps = {
  children: ReactNode;
  /** Wrap the content in a ScrollView. */
  scroll?: boolean;
  /** Drop the standard horizontal padding, for full-bleed rows and lists. */
  bleed?: boolean;
  /**
   * Paint the screen in `surface` rather than `background`. 07 and 15 are white
   * edge to edge, unlike 35, where cards sit on the app background.
   */
  surface?: boolean;
  contentStyle?: ViewStyle;
};

/** Safe-area container with the themed background and the standard gutter. */
export function Screen({
  children,
  scroll = false,
  bleed = false,
  surface = false,
  contentStyle,
}: ScreenProps) {
  const { colors, spacing } = useTheme();

  const gutter: ViewStyle = { paddingHorizontal: bleed ? 0 : spacing.lg };

  return (
    <SafeAreaView
      style={[styles.fill, { backgroundColor: surface ? colors.surface : colors.background }]}
    >
      {scroll ? (
        <ScrollView contentContainerStyle={[gutter, contentStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.fill, gutter, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
