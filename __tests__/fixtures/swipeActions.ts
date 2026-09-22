// Pressing an action revealed by swiping a row, in tests.
//
// `fireEvent.press` cannot do it. Gesture-handler keeps the revealed actions behind
// `pointerEvents: 'none'` until the opening animation advances its progress value, and under the
// mocked reanimated that never happens — so RNTL declines the press and the handler is never
// called, however the row is driven. There is no way to open the row from a test either: the
// animation is the thing that is mocked out.
//
// So the action's own press handler is invoked directly. That is deliberately white-box, and it
// is the narrowest thing that keeps the behaviour behind a swipe — including the Delete
// confirmation — under test. What it does *not* check is that a swipe reveals the actions at all;
// that is a gesture, and it is checked on the device (task 117).
//
// Not a test file itself — see `testPathIgnorePatterns` in jest.config.js.

import { act, screen } from '@testing-library/react-native';

export function pressSwipeAction(testID: string): void {
  const action = screen.getByTestId(testID);
  const onPress = action.props.onClick as (() => void) | undefined;
  if (onPress === undefined) {
    throw new Error(`"${testID}" is not a pressable swipe action`);
  }
  act(() => onPress());
}
