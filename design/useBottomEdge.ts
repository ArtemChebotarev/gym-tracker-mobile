// What sits over the bottom of a view, in points — for a layout that pins something (a button) to
// its bottom edge and must keep it clear (EmptyState). Two things can:
//
// - the software keyboard: `keyboardOverlap`, how much of the view it covers;
// - the home indicator: `safeAreaShortfall`, how much of the bottom safe area the view still
//   reaches into. A screen whose SafeAreaView already keeps off it (WizardScreen) gets 0; one that
//   runs to the bottom of the window (a detail screen with `edges={['top']}`) gets the whole inset.
//
// Measured in the window, not taken from onLayout: onLayout is relative to the parent, so under a
// header or inside a SafeAreaView it misjudges both (which is why this isn't KeyboardAvoidingView).
// It also checks the keyboard on layout, not only on a keyboard event: the empty state that
// appears as the user types a search with no match mounts with the keyboard already up.

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

export function useBottomEdge() {
  const ref = useRef<View>(null);
  const safeBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const [frameBottom, setFrameBottom] = useState<number | null>(null);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);

  const measure = useCallback(() => {
    ref.current?.measureInWindow((_x, y, _width, height) => setFrameBottom(y + height));
  }, []);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subscriptions = [
      Keyboard.addListener(show, (event) => setKeyboardTop(event.endCoordinates.screenY)),
      Keyboard.addListener(hide, () => setKeyboardTop(null)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  const onLayout = useCallback(() => {
    setKeyboardTop(Keyboard.isVisible() ? (Keyboard.metrics()?.screenY ?? null) : null);
    measure();
  }, [measure]);

  return {
    ref,
    onLayout,
    ...bottomEdge({
      frameBottom,
      keyboardTop,
      safeBottom,
      windowHeight: Dimensions.get('window').height,
    }),
  };
}

/** The arithmetic behind useBottomEdge — every value in window points; `null` while unknown. */
export function bottomEdge({
  frameBottom,
  keyboardTop,
  safeBottom,
  windowHeight,
}: {
  frameBottom: number | null;
  keyboardTop: number | null;
  safeBottom: number;
  windowHeight: number;
}): { keyboardOverlap: number; safeAreaShortfall: number } {
  if (frameBottom === null) {
    return { keyboardOverlap: 0, safeAreaShortfall: 0 };
  }
  return {
    keyboardOverlap: keyboardTop === null ? 0 : Math.max(0, frameBottom - keyboardTop),
    safeAreaShortfall: Math.max(0, safeBottom - (windowHeight - frameBottom)),
  };
}
