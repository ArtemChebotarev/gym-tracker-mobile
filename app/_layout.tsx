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
      </Stack>
    </QueryProvider>
  );
}
