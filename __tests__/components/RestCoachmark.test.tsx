import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useRef } from 'react';
import { View } from 'react-native';

import { RestCoachmark } from '@components/RestCoachmark';
import { useRestTimerStore } from '@state/restTimerStore';
import { readOnboardingFlags } from '@usecases/onboarding';

import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const repositories = withRepositories();

const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, name: 'Press', setNumber: 2 },
  durationSec: 60,
};

function Host() {
  const capsuleRef = useRef<View>(null);
  return (
    <>
      <View ref={capsuleRef} />
      <RestCoachmark capsuleRef={capsuleRef} />
    </>
  );
}

const permission = (status: string, granted: boolean) =>
  jest
    .mocked(Notifications.getPermissionsAsync)
    .mockResolvedValue({ status, granted } as Awaited<
      ReturnType<typeof Notifications.getPermissionsAsync>
    >);

const seen = async () =>
  (await readOnboardingFlags({ settingsRepo: repositories().settingsRepo })).restCoachmarkSeen;

beforeEach(() => {
  jest.clearAllMocks();
  permission('granted', true);
});

afterEach(() => {
  act(() => useRestTimerStore.getState().clear());
});

describe('RestCoachmark', () => {
  test('with no rest running there is nothing to show', async () => {
    renderWithRepositories(<Host />);

    await act(() => new Promise((resolve) => setTimeout(resolve, 500)));

    expect(screen.queryByText('Rest starts after each set')).toBeNull();
  });

  test('not asked yet: Turn on brings up the prompt, and closes it for good', async () => {
    permission('undetermined', false);
    renderWithRepositories(<Host />);
    act(() => useRestTimerStore.getState().start(REST));

    fireEvent.press(await screen.findByText('Turn on'));

    await waitFor(() => expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1));
    await waitFor(async () => expect(await seen()).toBe(true));
  });

  test('not asked yet: Not now closes it without the prompt', async () => {
    permission('undetermined', false);
    renderWithRepositories(<Host />);
    act(() => useRestTimerStore.getState().start(REST));

    fireEvent.press(await screen.findByText('Not now'));

    await waitFor(async () => expect(await seen()).toBe(true));
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test.each([
    ['granted', true],
    ['denied', false],
  ] as const)('%s: Got it closes it without the prompt', async (status, granted) => {
    permission(status, granted);
    renderWithRepositories(<Host />);
    act(() => useRestTimerStore.getState().start(REST));

    fireEvent.press(await screen.findByText('Got it'));

    await waitFor(async () => expect(await seen()).toBe(true));
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
