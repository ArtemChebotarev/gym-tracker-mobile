import { AppTabBar } from '@components/AppTabBar';
import { HourglassIcon } from '@design/icons/HourglassIcon';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

// The interval timer's driver rides in the bar's overlay and writes rounds through storage (GT-98).
withRepositories();

const ROUTES = [
  { key: 'index-1', name: 'index' },
  { key: 'mesocycles-1', name: 'mesocycles' },
  { key: 'library-1', name: 'library' },
  { key: 'settings-1', name: 'settings' },
];
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function tabBar(index: number, navigation: Parameters<typeof AppTabBar>[0]['navigation']) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <AppTabBar state={{ index, routes: ROUTES }} navigation={navigation} />
    </SafeAreaProvider>
  );
}

function setup(index: number, defaultPrevented = false) {
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented })),
    navigate: jest.fn(),
  };
  const { rerender } = renderWithRepositories(tabBar(index, navigation));
  return { ...navigation, showTab: (next: number) => rerender(tabBar(next, navigation)) };
}

afterEach(() => {
  act(() => useTimerCapsuleStore.getState().clear());
});

describe('AppTabBar', () => {
  test('shows Today, Cycles, Library and Settings', () => {
    setup(0);

    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Today',
      'Cycles',
      'Library',
      'Settings',
    ]);
  });

  test('announces tabPress, then switches to the pressed tab', () => {
    const navigation = setup(0);

    fireEvent.press(screen.getByRole('button', { name: 'Library' }));

    expect(navigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'library-1',
      canPreventDefault: true,
    });
    expect(navigation.navigate).toHaveBeenCalledWith('library');
  });

  test('does not switch when a listener prevented the press', () => {
    const navigation = setup(0, true);

    fireEvent.press(screen.getByRole('button', { name: 'Library' }));

    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test('pressing the focused tab announces tabPress but does not navigate', () => {
    const navigation = setup(0);

    fireEvent.press(screen.getByRole('button', { name: 'Today' }));

    expect(navigation.emit).toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test('draws no timer capsule while no timer runs', () => {
    setup(0);

    expect(screen.queryByRole('timer')).toBeNull();
  });

  test('keeps the timer capsule over the bar when the tab changes', () => {
    const navigation = setup(0);
    act(() =>
      useTimerCapsuleStore.getState().show(
        {
          state: 'running',
          icon: HourglassIcon,
          title: '1:46',
          caption: 'Rest · set 3 next',
          progress: 0.5,
        },
        'rest',
      ),
    );
    expect(screen.getByText('1:46')).toBeTruthy();

    navigation.showTab(2);

    expect(screen.getByText('1:46')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Library' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });
});
