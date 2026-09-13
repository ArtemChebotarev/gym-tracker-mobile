// Placeholder handlers behind app/(tabs)/library.tsx's LibraryScreen — see the `code-style`
// skill, "Screens keep the same split, one level up". Lives here rather than beside the route
// file because Expo Router treats every file directly under app/ as a route (see
// components/README.md) — a route's Styles/Logic siblings must live in components/ too, named
// after the exported component rather than the route's filename.
//
// 066 · New/Edit exercise isn't built yet — task 063 scoped to the list screen only (see
// ExerciseLibraryScreen.tsx), so this just says so for now. 064 · Filters has since shipped
// (see ExerciseFiltersSheet.tsx); its wiring lives directly in the route because, unlike this
// stub, it needs closures over the route's own state.

import { Alert } from 'react-native';

export function handleRequestCreate(prefillName?: string): void {
  Alert.alert(
    'Coming soon',
    prefillName
      ? `Creating "${prefillName}" will be available once the New Exercise sheet ships.`
      : 'Creating a new exercise will be available once the New Exercise sheet ships.',
  );
}
