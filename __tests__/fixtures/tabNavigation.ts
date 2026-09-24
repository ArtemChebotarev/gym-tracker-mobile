// The tab navigation object the Today tab subscribes to, for tests that mock `expo-router`.
//
// `app/(tabs)/index.tsx` drops its pinned day on `tabPress` — the tab bar being tapped, which is
// how coming back to Today is told apart from pushing a screen out of it (see `unpinDay`). A test
// that mocks the module has to supply that object, and a test about the pin has to be able to fire
// the event; both go through here rather than being hand-rolled in each Today test file.
//
// Not a test file itself — see `testPathIgnorePatterns` in jest.config.js.

import { act } from '@testing-library/react-native';

let listeners: (() => void)[] = [];

/** What `useNavigation()` returns — registers `tabPress` listeners and hands back an unsubscribe. */
export function tabNavigation() {
  return {
    addListener(event: string, listener: () => void) {
      if (event !== 'tabPress') {
        return () => {};
      }
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((registered) => registered !== listener);
      };
    },
  };
}

/** Fires `tabPress` — the user tapping the Today tab. */
export function pressTodayTab(): void {
  act(() => {
    for (const listener of [...listeners]) {
      listener();
    }
  });
}

/** Forgets every subscription — between tests, so one file's screens don't outlive their test. */
export function resetTabNavigation(): void {
  listeners = [];
}
