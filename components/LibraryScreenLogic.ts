// Placeholder handlers behind app/(tabs)/library.tsx's LibraryScreen — see the `code-style`
// skill, "Screens keep the same split, one level up". Lives here rather than beside the route
// file because Expo Router treats every file directly under app/ as a route (see
// components/README.md) — a route's Styles/Logic siblings must live in components/ too, named
// after the exported component rather than the route's filename.
//
// 066 · New/Edit exercise and 064 · Filters aren't built yet — task 063 scopes to the list
// screen only (see ExerciseLibraryScreen.tsx), so these just say so for now.

import { Alert } from 'react-native';

export function handleRequestCreate(prefillName?: string): void {
  Alert.alert(
    'Coming soon',
    prefillName
      ? `Creating "${prefillName}" will be available once the New Exercise sheet ships.`
      : 'Creating a new exercise will be available once the New Exercise sheet ships.',
  );
}

export function handleRequestFilters(): void {
  Alert.alert('Coming soon', 'Editing filters will be available once the Filters sheet ships.');
}
