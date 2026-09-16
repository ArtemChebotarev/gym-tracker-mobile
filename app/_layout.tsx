import { Stack } from 'expo-router';

import { QueryProvider } from '@state/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* One route for the whole mesocycle editor flow (all of Flow A's steps) — see
            components/MesoEditorScreen.tsx for why step transitions are handled inside that single
            screen instead of by pushing a route per step. */}
        <Stack.Screen
          name="meso-editor/new"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="meso-editor/edit/[id]"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
    </QueryProvider>
  );
}
