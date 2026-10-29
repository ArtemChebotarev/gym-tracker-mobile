// Whether the software keyboard is on screen — for a sheet that lays itself out differently while
// it is (BottomSheet, GT-151). iOS reports the change as the keyboard starts to move (`Will`), in
// step with KeyboardAvoidingView; Android only once it has (`Did`).

import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(() => Keyboard.isVisible());

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subscriptions = [
      Keyboard.addListener(show, () => setVisible(true)),
      Keyboard.addListener(hide, () => setVisible(false)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return visible;
}
