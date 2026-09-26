// Styles for app/_layout.tsx — see the code-style skill: a route's Styles sibling lives in
// components/, named after the route's exported component, never beside the route file (Expo
// Router would treat it as a route of its own).

import { DarkTheme, type Theme } from 'expo-router';
import { StyleSheet } from 'react-native';

import { COLORS } from '@design/tokens';

export const styles = StyleSheet.create({
  // GestureHandlerRootView has no size of its own and must fill the window, or everything inside
  // it collapses to nothing.
  root: { flex: 1 },
});

/**
 * The navigation theme around every stack. Without one, React Navigation falls back to its light
 * default, and its background — near-white — is what a screen container shows while nothing of
 * ours is painted over it. Closing two screens in one go does exactly that: `dismissTo` from the
 * Copy editor opened on a mesocycle's detail screen (08.9) pops the modal and the detail page
 * together, and the gap flashed white on the way to the Mesocycles tab. Dark, with the page's own
 * surface, so any gap reads as more of the app.
 */
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS['surface/page'],
    card: COLORS['surface/page'],
  },
};
