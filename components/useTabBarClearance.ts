import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SIZES, SPACING } from '@design/tokens';

/**
 * How far the floating tab bar (components/AppTabBar.tsx) is lifted off the bottom edge. Only
 * half of the home indicator's inset: the bar rides low, close to the indicator like the native
 * iOS 26 one, instead of standing a full inset above it.
 */
export function useTabBarLift(): number {
  const { bottom } = useSafeAreaInsets();
  return bottom / 2;
}

/**
 * How much room the bar takes at the bottom of a root screen: the bar, its own gap to the edge and
 * its lift. A root screen's scrolling content pads its bottom by this so its last row can be
 * scrolled clear of the bar.
 */
export function useTabBarClearance(): number {
  const lift = useTabBarLift();
  return lift + SIZES['size/tabbar'] + SPACING['space/gap-tight'] + SPACING['space/gap'];
}
