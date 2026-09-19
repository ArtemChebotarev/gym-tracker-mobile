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
        {/* The workout screen (08.7, task 091) — draws its own header, like the root screens. */}
        <Stack.Screen name="workout/[sessionId]" options={{ headerShown: false }} />
        {/* History stubs (task 098) — pushed from the workout screen, each with its own Go back. */}
        <Stack.Screen name="exercise/[id]/history" options={{ headerShown: false }} />
        <Stack.Screen name="meso/[id]" options={{ headerShown: false }} />
      </Stack>
    </QueryProvider>
  );
}
