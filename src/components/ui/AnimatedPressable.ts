import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

/** `Pressable` that accepts Reanimated styles, for press feedback. */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
