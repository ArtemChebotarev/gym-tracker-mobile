import { act, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from 'react-native';

import { StorageGate } from '@components/StorageGate';
import { resetStorageBootstrap } from '@state/useStorageBootstrap';

// The two states task 111's DoD names: screens must not render data before storage is ready, and
// a bootstrap that fails must produce a screen that says so rather than empty lists.
//
// The bootstrap itself is mocked, both to control when it settles and because the real one opens
// a database through expo-sqlite — a native module that cannot load under Jest (task 110). What
// it does when it runs is `bootstrap.test.ts`'s business.

let settle: { resolve: () => void; reject: (error: unknown) => void };

jest.mock('@state/bootstrap', () => ({
  bootstrapStorage: () =>
    new Promise<void>((resolve, reject) => {
      settle = { resolve, reject };
    }),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

const hideAsync = SplashScreen.hideAsync as jest.Mock;

beforeEach(() => {
  resetStorageBootstrap();
  hideAsync.mockClear();
});

function renderGate() {
  return render(
    <StorageGate>
      <Text>Today</Text>
    </StorageGate>,
  );
}

describe('StorageGate', () => {
  test('holds the splash and renders no screen while storage is coming up', () => {
    renderGate();

    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.getByTestId('storage-gate-loading')).toBeTruthy();
    expect(hideAsync).not.toHaveBeenCalled();
  });

  test('lets the splash go and mounts the app once storage is ready', async () => {
    renderGate();

    await act(async () => settle.resolve());

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.queryByTestId('storage-gate-loading')).toBeNull();
    expect(hideAsync).toHaveBeenCalled();
  });

  test('a failed bootstrap shows the restart screen instead of the app', async () => {
    // The gate logs the failure — a migration that fails on a phone is invisible otherwise — and
    // this is the one place that expects it, so the run's console check is silenced for it.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    renderGate();

    await act(async () => settle.reject(new Error('database is locked')));

    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.getByTestId('storage-gate-error')).toBeTruthy();
    expect(screen.getByText('Please restart the app.')).toBeTruthy();
    // No technical detail, and nothing to press: a second attempt fails the same way.
    expect(screen.queryByText(/database is locked/)).toBeNull();
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(hideAsync).toHaveBeenCalled();
  });
});
