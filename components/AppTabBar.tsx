import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar, type TabBarItem } from '@design/components/TabBar';
import { TabCyclesIcon } from '@design/icons/TabCyclesIcon';
import { TabLibraryIcon } from '@design/icons/TabLibraryIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';
import { COLORS } from '@design/tokens';

// The tabs, in bar order, keyed by their route name in app/(tabs). The bar's labels are short
// ("Cycles"); inside the screens the concept stays "training cycle" (08 · Screens & Navigation).
// Settings joins this list with v1.0, once its route exists — TabBar already fits four.
const TABS: readonly TabBarItem[] = [
  { key: 'index', label: 'Today', icon: TabTodayIcon },
  { key: 'mesocycles', label: 'Cycles', icon: TabCyclesIcon },
  { key: 'library', label: 'Library', icon: TabLibraryIcon },
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
// of the home indicator and on the page colour the screens sit on.
export function AppTabBar({ state, navigation }: AppTabBarProps) {
  const insets = useSafeAreaInsets();
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
    <View style={{ backgroundColor: COLORS['surface/page'], paddingBottom: insets.bottom }}>
      <TabBar items={TABS} activeKey={activeKey} onChange={handlePress} />
    </View>
  );
}
