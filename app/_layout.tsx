import { Stack } from 'expo-router';

import { StorageGate } from '@components/StorageGate';
import { QueryProvider } from '@state/QueryProvider';

export default function RootLayout() {
  return (
    <StorageGate>
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
          {/* The Exercise screen (08.6, task 065) — pushed from the library and from a workout's
            exercise card, with its own back button in the header. */}
          <Stack.Screen name="exercise/[id]/index" options={{ headerShown: false }} />
          {/* Mesocycle history, still a stub (task 098), with its own Go back. */}
          <Stack.Screen name="meso/[id]" options={{ headerShown: false }} />
          {/* The developer door (task 070) — no link leads here, five taps on the Library title do. */}
          <Stack.Screen name="debug" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
      </QueryProvider>
    </StorageGate>
  );
}
