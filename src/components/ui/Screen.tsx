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
  contentStyle?: ViewStyle;
};

/** Safe-area container with the themed background and the standard gutter. */
export function Screen({ children, scroll = false, bleed = false, contentStyle }: ScreenProps) {
  const { colors, spacing } = useTheme();

  const gutter: ViewStyle = { paddingHorizontal: bleed ? 0 : spacing.lg };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[gutter, contentStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.fill, gutter, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
