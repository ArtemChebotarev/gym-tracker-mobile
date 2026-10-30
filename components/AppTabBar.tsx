import { View } from 'react-native';

import { AppTabBarStyles as styles } from './AppTabBarStyles';
import { IntervalLockScreenDriver } from './IntervalLockScreenDriver';
import { IntervalTimerDriver } from './IntervalTimerDriver';
import { RestSignalDriver } from './RestSignalDriver';
import { RestTimerDriver } from './RestTimerDriver';
import { TimerKeepAwakeDriver } from './TimerKeepAwakeDriver';
import { TimerCapsuleHost } from './TimerCapsuleHost';
import { useTabBarLift } from './useTabBarClearance';
import { TabBar, type TabBarItem } from '@design/components/TabBar';
import { TabCyclesIcon } from '@design/icons/TabCyclesIcon';
import { TabLibraryIcon } from '@design/icons/TabLibraryIcon';
import { TabSettingsIcon } from '@design/icons/TabSettingsIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';

// The tabs, in bar order, keyed by their route name in app/(tabs). The bar's labels are short
// ("Cycles"); inside the screens the concept stays "training cycle" (08 · Screens & Navigation).
// Settings joined with the strength rest timer (GT-87) — TabBar is built for four.
const TABS: readonly TabBarItem[] = [
  { key: 'index', label: 'Today', icon: TabTodayIcon },
  { key: 'mesocycles', label: 'Cycles', icon: TabCyclesIcon },
  { key: 'library', label: 'Library', icon: TabLibraryIcon },
  { key: 'settings', label: 'Settings', icon: TabSettingsIcon },
];

/**
 * The part of the navigator's tab-bar props used here. Structural, like Today's tab navigation
 * type: expo-router vendors React Navigation instead of depending on
 * `@react-navigation/bottom-tabs`, so its `BottomTabBarProps` isn't importable.
 */
type AppTabBarProps = {
  state: { index: number; routes: readonly { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

// The navigator's tab bar, replaced by the floating design/components/TabBar. Keeps the bar clear
// of the home indicator and laid over the screens rather than under them, so the list scrolls
// beneath the glass; a screen leaves room for it with `useTabBarClearance`. The floating timer
// capsule rides just above the bar (GT-85), in the same overlay, so it stays up on every tab — and
// so does the rest timer that fills it (GT-86).
export function AppTabBar({ state, navigation }: AppTabBarProps) {
  const lift = useTabBarLift();
  const activeKey = state.routes[state.index]?.name ?? '';

  // What the navigator's own bar does on a press: announce `tabPress` first — Today listens, to
  // drop a pinned day — and only then switch, unless a listener prevented it or the tab is
  // already the focused one.
  function handlePress(name: string) {
    const route = state.routes.find((r) => r.name === name);
    if (route === undefined) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (name !== activeKey && !event.defaultPrevented) navigation.navigate(name);
  }

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { paddingBottom: lift }]}>
      <RestTimerDriver />
      <RestSignalDriver />
      <IntervalTimerDriver />
      <IntervalLockScreenDriver />
      {/* The Live Activity is parked (GT-180): <IntervalLiveActivityDriver /> brings it back. */}
      <TimerKeepAwakeDriver />
      <TimerCapsuleHost />
      <TabBar items={TABS} activeKey={activeKey} onChange={handlePress} />
    </View>
  );
}
