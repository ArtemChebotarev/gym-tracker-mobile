import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ActionMenu, type ActionMenuItem } from '@design/components/ActionMenu';
import { PlusIcon } from '@design/icons/PlusIcon';
import { StopIcon } from '@design/icons/StopIcon';

// The fallback's BottomSheet renders a SafeAreaView, which throws without a provider above it.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

const onAdd = jest.fn();
const onStop = jest.fn();

function items(): ActionMenuItem[] {
  return [
    { key: 'add', label: 'Add exercise', icon: PlusIcon, systemImage: 'plus', onPress: onAdd },
    {
      key: 'stop',
      label: 'Stop mesocycle',
      icon: StopIcon,
      systemImage: 'stop.circle',
      destructive: true,
      onPress: onStop,
    },
  ];
}

function renderMenu() {
  return renderWithSafeArea(
    <ActionMenu
      accessibilityLabel="Workout menu"
      title="Week 6 Day 2"
      subtitle="Upper/lower"
      items={items()}
    />,
  );
}

beforeEach(() => {
  onAdd.mockClear();
  onStop.mockClear();
});

describe('ActionMenu — iOS', () => {
  test('DoD: the trigger is the native menu, one native button per action', () => {
    const tree = renderMenu();

    expect(screen.getByTestId('action-menu')).toBeTruthy();
    expect(screen.getByTestId('action-menu-add').props.label).toBe('Add exercise');
    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('a destructive action is destructive to iOS, the rest are not', () => {
    renderMenu();

    expect(screen.getByTestId('action-menu-stop').props.role).toBe('destructive');
    expect(screen.getByTestId('action-menu-add').props.role).toBe('default');
  });

  test('an action names its SF Symbol, so the menu row gets an icon', () => {
    renderMenu();

    expect(screen.getByTestId('action-menu-stop').props.systemImage).toBe('stop.circle');
  });

  test('picking an action runs it', () => {
    renderMenu();

    fireEvent(screen.getByTestId('action-menu-add'), 'buttonPress');

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  test('no sheet is rendered — nothing opens over the screen', () => {
    renderMenu();

    expect(screen.queryByText('Week 6 Day 2')).toBeNull();
  });
});

describe('ActionMenu — without SwiftUI', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  test('DoD: the `⋯` button opens a titled sheet of the same actions', () => {
    const tree = renderMenu();

    expect(screen.queryByText('Week 6 Day 2')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Workout menu' }));

    expect(screen.getByText('Week 6 Day 2')).toBeTruthy();
    expect(screen.getByText('Upper/lower')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add exercise' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Stop mesocycle' })).toBeTruthy();
    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('an action closes the sheet and runs', () => {
    renderMenu();
    fireEvent.press(screen.getByRole('button', { name: 'Workout menu' }));

    fireEvent.press(screen.getByRole('button', { name: 'Stop mesocycle' }));

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Upper/lower')).toBeNull();
  });
});
