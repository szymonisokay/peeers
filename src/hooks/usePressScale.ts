import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useReducedMotion } from './useReducedMotion';
import { useTheme } from './useTheme';

/**
 * Shrink-on-press feedback, shared by every pressable primitive.
 *
 * Returns a style that never changes when the OS asks for reduced motion — the
 * press still registers, it just does not move.
 */
export function usePressScale() {
  const { motion } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return {
    style,
    onPressIn: () => {
      if (!reduced) scale.value = withSpring(motion.pressScale, motion.spring);
    },
    onPressOut: () => {
      if (!reduced) scale.value = withSpring(1, motion.spring);
    },
  };
}
