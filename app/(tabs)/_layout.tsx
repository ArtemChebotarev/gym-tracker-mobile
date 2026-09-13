import { Tabs } from 'expo-router';

import { COLORS } from '@design/tokens';

// Every screen draws its own header inside its content (see e.g. 08.6 · Библиотека упражнений,
// "Шапка"), so the native per-tab header is redundant chrome — hidden here rather than themed.
// Screens whose content sits flush against the top edge are responsible for their own safe-area
// inset (see components/ExerciseLibraryScreen.tsx) now that the header isn't reserving that
// space for them.
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
        tabBarInactiveTintColor: COLORS['text/muted'],
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="mesocycles" options={{ title: 'Mesocycles' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
    </Tabs>
  );
}
