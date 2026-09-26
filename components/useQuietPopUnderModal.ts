// A pushed screen that opens the Copy editor over itself — the mesocycle detail screen (08.9) and a
// History session (`session/[id]`, 130). Saving the copy leaves with `dismissTo('/mesocycles')`
// (MesoEditorScreen), which takes the editor modal *and* every pushed page under it off the stack
// in one go. iOS plays that as two transitions back to back — the modal sliding down, then the
// pushed page popping — and it read as a slow, drawn-out exit (Artem, 26.09.2026). From the
// Mesocycles list, where the editor sits straight on the tabs, the same save is one slide and fast.
//
// The pop's animation is the popped screen's own (react-native-screens takes the `animation` of the
// screen coming off the top), so the page switches it to `none` just before it raises the editor:
// covered by a full-screen modal, nothing about it is visible anyway. Only the modal's slide is
// left. When the page is focused again — the editor was cancelled, or a pushed History day was
// backed out of — the default comes back, so an ordinary Back still animates.
//
// A hook rather than a helper, because the reset has to follow the screen's focus.

import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback } from 'react';

/** Call right before opening the editor modal from a pushed page. */
export type QuietPopUnderModal = () => void;

export function useQuietPopUnderModal(): QuietPopUnderModal {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ animation: 'default' });
    }, [navigation]),
  );

  return useCallback(() => {
    navigation.setOptions({ animation: 'none' });
  }, [navigation]);
}
