import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the OS asks for reduced motion.
 *
 * When true, animations must not play at all rather than merely running
 * shorter — that is what the accessibility setting means. Every animated
 * primitive reads this and falls back to an instant state change.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
