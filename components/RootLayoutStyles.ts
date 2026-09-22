// Styles for app/_layout.tsx — see the code-style skill: a route's Styles sibling lives in
// components/, named after the route's exported component, never beside the route file (Expo
// Router would treat it as a route of its own).

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // GestureHandlerRootView has no size of its own and must fill the window, or everything inside
  // it collapses to nothing.
  root: { flex: 1 },
});
