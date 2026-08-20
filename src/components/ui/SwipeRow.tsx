import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/Icon';
import { useReducedMotion, useTheme } from '@/hooks';

type Action = {
  onTrigger: () => void;
  icon: IconName;
  color: string;
};

type SwipeRowProps = {
  children: ReactNode;
  /** Dragging the row leftwards. The panel appears on the right, behind it. */
  left?: Action;
  /** Dragging the row rightwards. The panel appears on the left. */
  right?: Action;
};

/**
 * A row that can be dragged sideways to do something.
 *
 * No mockup draws this — it was asked for on top of them, so the affordance is
 * built from what the tokens already say: a coloured panel behind the row with
 * one icon on it, and the row itself sliding to uncover it.
 *
 * The action fires when the finger lifts past a third of the width, not while
 * dragging, so a drag that changes its mind costs nothing. The row always
 * springs back, because what it did is visible in the list itself: a checked
 * item travels to ODHACZONE, a removed one leaves.
 *
 * The travelling is this component's job, not `CheckboxRow`'s. Whatever the
 * list maps over is the child whose position changes, and that is this — a
 * layout animation on the row inside would see no movement at all, because the
 * row does not move relative to the wrapper around it.
 */
export function SwipeRow({ children, left, right }: SwipeRowProps) {
  const { colors, motion, spacing } = useTheme();
  const reduced = useReducedMotion();

  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const laidOut = useSharedValue(false);

  const pan = Gesture.Pan()
    // Sideways only: a vertical drag belongs to the list underneath, and a
    // near-vertical one must not stutter the row on its way.
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      const dx = event.translationX;
      if ((dx < 0 && !left) || (dx > 0 && !right)) return;

      // Bounded by the row's own width: past that the row has left the screen
      // and the drag has stopped meaning anything.
      const limit = width.value;
      x.value = Math.max(-limit, Math.min(limit, dx));
    })
    .onEnd(() => {
      // Before the first layout there is no width to measure a third of, and
      // `0 >= 0` would fire the action on the smallest twitch.
      if (!laidOut.value) {
        x.value = 0;
        return;
      }

      const threshold = width.value / 3;

      if (left && x.value <= -threshold) runOnJS(left.onTrigger)();
      else if (right && x.value >= threshold) runOnJS(right.onTrigger)();

      x.value = reduced ? 0 : withSpring(0, motion.spring);
    });

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const leftPanel = useAnimatedStyle(() => ({ opacity: x.value < 0 ? 1 : 0 }));
  const rightPanel = useAnimatedStyle(() => ({ opacity: x.value > 0 ? 1 : 0 }));

  return (
    <Animated.View
      onLayout={(event) => {
        width.value = event.nativeEvent.layout.width;
        laidOut.value = event.nativeEvent.layout.width > 0;
      }}
      // Checking an item moves this row from one section to the other; it
      // travels there rather than teleporting, and leaves by fading when it is
      // removed. See 07 and its dark counterpart 39.
      layout={reduced ? undefined : LinearTransition.duration(motion.duration.base)}
      entering={reduced ? undefined : FadeIn.duration(motion.duration.base)}
      exiting={reduced ? undefined : FadeOut.duration(motion.duration.fast)}
    >
      {left ? (
        <Animated.View
          style={[
            styles.panel,
            styles.toRight,
            leftPanel,
            { backgroundColor: left.color, paddingHorizontal: spacing.xl },
          ]}
        >
          <Icon name={left.icon} size={22} color="#FFFFFF" />
        </Animated.View>
      ) : null}

      {right ? (
        <Animated.View
          style={[
            styles.panel,
            styles.toLeft,
            rightPanel,
            { backgroundColor: right.color, paddingHorizontal: spacing.xl },
          ]}
        >
          <Icon name={right.icon} size={22} color="#FFFFFF" />
        </Animated.View>
      ) : null}

      <GestureDetector gesture={pan}>
        {/* Opaque, or the panel behind shows through the row it is meant to sit under. */}
        <Animated.View style={[slide, { backgroundColor: colors.surface }]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  toRight: { alignItems: 'flex-end' },
  toLeft: { alignItems: 'flex-start' },
});
