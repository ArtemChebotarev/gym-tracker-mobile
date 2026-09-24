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
let pressing = false;

/**
 * What `useNavigation()` returns: `tabPress` subscriptions and this tab's own `setParams`.
 *
 * `setParams` is here and not only on the router because the two are not interchangeable — see
 * `isTabBeingPressed`. A caller that doesn't care passes nothing.
 */
export function tabNavigation(
  setParams: (params: Record<string, string | undefined>) => void = () => {},
) {
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
    setParams,
  };
}

/**
 * True while a `tabPress` is being delivered, which is the window in which the tab being *left* is
 * still the focused route. A test's `useRouter().setParams` should do nothing then: that is what
 * the real imperative router effectively does to this tab, since it writes to the focused route
 * (`navigationRef.current.setParams`). Without modelling that, a screen clearing its params
 * through the router would look like it worked here and do nothing on the device — which is
 * exactly what happened on 24.09.2026.
 */
export function isTabBeingPressed(): boolean {
  return pressing;
}

/** Fires `tabPress` — the user tapping the Today tab while another one is still focused. */
export function pressTodayTab(): void {
  pressing = true;
  try {
    act(() => {
      for (const listener of [...listeners]) {
        listener();
      }
    });
  } finally {
    pressing = false;
  }
}

/** Forgets every subscription — between tests, so one file's screens don't outlive their test. */
export function resetTabNavigation(): void {
  listeners = [];
  pressing = false;
}
