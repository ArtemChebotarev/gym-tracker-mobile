import { Tabs } from 'expo-router';

import { TabLibraryIcon } from '@design/icons/TabLibraryIcon';
import { TabMesocyclesIcon } from '@design/icons/TabMesocyclesIcon';
import { TabTodayIcon } from '@design/icons/TabTodayIcon';
import { COLORS, ICON_SIZES } from '@design/tokens';

// Every screen draws its own header inside its content (see e.g. 08.6 · Библиотека упражнений,
// "Шапка"), so the native per-tab header is redundant chrome — hidden here rather than themed.
// Screens whose content sits flush against the top edge are responsible for their own safe-area
// inset (see components/ExerciseLibraryScreen.tsx) now that the header isn't reserving that
// space for them.
//
// Tab icons are `icon/tab-*` from 08.0 · Design SDK at `ICON_SIZES['icon/tab']`; the navigator
// hands each one the active/inactive tint below, so the icon and its label always share a color
// (08.0, "Иконки": accent when active, text/faint when not).
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS['surface/raised'],
          borderTopColor: COLORS['border/divider'],
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS['text/faint'],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabTodayIcon size={ICON_SIZES['icon/tab']} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mesocycles"
        options={{
          title: 'Mesocycles',
          tabBarIcon: ({ color }) => (
            <TabMesocyclesIcon size={ICON_SIZES['icon/tab']} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <TabLibraryIcon size={ICON_SIZES['icon/tab']} color={color} />,
        }}
      />
    </Tabs>
  );
}
