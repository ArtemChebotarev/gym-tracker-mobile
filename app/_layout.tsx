// Root layout. `GestureHandlerRootView` wraps everything (task 117): gesture-handler routes
// touches through its own root, and a gesture inside a subtree without one never fires — which is
// how a swipeable row would silently do nothing. It is outermost rather than around the one screen
// that swipes, so the next gesture anywhere doesn't have to remember this.

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { StorageGate } from '@components/StorageGate';
import { QueryProvider } from '@state/QueryProvider';
import { styles } from '@components/RootLayoutStyles';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StorageGate>
        <QueryProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* One route per mesocycle editor flow, each covering all of that flow's steps — see
              components/MesoEditorScreen.tsx for why step transitions are handled inside that single
              screen instead of by pushing a route per step. Flow C's source-week step is part of
              its flow the same way, not a route in front of it (08.8, task 124). */}
            <Stack.Screen
              name="meso-editor/new"
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="meso-editor/copy"
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="meso-editor/edit/[id]"
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            {/* The Exercise screen (08.6, task 065) — pushed from the library and from a workout's
              exercise card, with its own back button in the header. */}
            <Stack.Screen name="exercise/[id]/index" options={{ headerShown: false }} />
            {/* Mesocycle detail (08.9, task 129) — pushed from 08.3 and the workout menu, own back. */}
            <Stack.Screen name="meso/[id]" options={{ headerShown: false }} />
            {/* A day of a closed block (08.9, task 130) — pushed from the detail screen's grid, in
              History mode, with its own back button. */}
            <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
            {/* The developer door (task 070) — no link leads here, five taps on the Library title do. */}
            <Stack.Screen name="debug" options={{ headerShown: false, presentation: 'modal' }} />
          </Stack>
        </QueryProvider>
      </StorageGate>
    </GestureHandlerRootView>
  );
}
