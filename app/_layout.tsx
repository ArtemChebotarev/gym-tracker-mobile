import { Stack } from 'expo-router';

import { QueryProvider } from '@state/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="meso-editor/basics"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        {/* Steps after the first (days, and review once it exists) are NOT their own modal —
            they're plain pushes inside the modal "New mesocycle" already presented by basics,
            so stepping forward/back within the flow reads as switching steps, not opening
            another modal on top of one (task 076 review: giving this the same fullScreenModal
            presentation as basics made Continue look like a second popup sliding up). */}
        <Stack.Screen name="meso-editor/days" options={{ headerShown: false, animation: 'none' }} />
      </Stack>
    </QueryProvider>
  );
}
