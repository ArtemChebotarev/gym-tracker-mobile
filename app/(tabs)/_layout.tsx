import { Tabs } from 'expo-router';

import { AppTabBar } from '@components/AppTabBar';

// Every screen draws its own header inside its content (see e.g. 08.6 · Библиотека упражнений,
// "Шапка"), so the native per-tab header is redundant chrome — hidden here rather than themed.
// Screens whose content sits flush against the top edge are responsible for their own safe-area
// inset (see components/ExerciseLibraryScreen.tsx) now that the header isn't reserving that
// space for them.
//
// The bar itself is the floating capsule of 08.0 · Design SDK, "Таб-бар" (task 151), drawn by
// components/AppTabBar.tsx in place of the navigator's default; the tabs, their labels and icons
// are listed there. The routes below only have to exist under the names it lists.
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="mesocycles" options={{ title: 'Cycles' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
    </Tabs>
  );
}
