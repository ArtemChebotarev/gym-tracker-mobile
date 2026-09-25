import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ActionMenu, type ActionMenuItem } from '@design/components/ActionMenu';
import { consumeMenuDismissPress, disarmMenuDismissGuard } from '@design/menuDismissGuard';
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
  disarmMenuDismissGuard();
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

  test('an unavailable action stays listed and disabled, with no reason crammed in', () => {
    renderWithSafeArea(
      <ActionMenu
        accessibilityLabel="Workout menu"
        title="Week 6 Day 2"
        items={[
          {
            key: 'moveUp',
            label: 'Move up',
            icon: PlusIcon,
            systemImage: 'arrow.up',
            disabledReason: 'Already first',
            onPress: jest.fn(),
          },
        ]}
      />,
    );

    // The label stays clean — a native menu row has no column for a reason, and greying the row
    // says enough on its own.
    expect(screen.getByTestId('action-menu-moveUp').props.label).toBe('Move up');
    // It is also the first item, so it carries the guard's appear/disappear pair after it.
    expect(screen.getByTestId('action-menu-moveUp').props.modifiers).toEqual([
      expect.objectContaining({ $type: 'disabled' }),
      expect.objectContaining({ $type: 'onAppear' }),
      expect.objectContaining({ $type: 'onDisappear' }),
    ]);
  });

  test('picking an action runs it', () => {
    renderMenu();

    fireEvent(screen.getByTestId('action-menu-add'), 'buttonPress');

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  // The open signal for `menuDismissGuard`: iOS doesn't swallow the tap that closes the plate, and
  // `Menu` has no open-state prop — the content's own `onAppear` is what there is.
  test('the first item carries the appear/disappear pair the dismiss guard listens to', () => {
    renderMenu();

    expect(screen.getByTestId('action-menu-add').props.modifiers).toEqual([
      expect.objectContaining({ $type: 'onAppear' }),
      expect.objectContaining({ $type: 'onDisappear' }),
    ]);
    expect(screen.getByTestId('action-menu-stop').props.modifiers).toBeUndefined();
  });

  test('picking an action leaves no press for the guard to swallow', () => {
    renderMenu();

    // As if the menu had opened: SwiftUI builds its content and `onAppear` arms the guard.
    fireEvent(screen.getByTestId('action-menu-add'), 'onAppear');
    fireEvent(screen.getByTestId('action-menu-add'), 'buttonPress');

    expect(consumeMenuDismissPress()).toBe(false);
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

  test('an unavailable action is a disabled row with the reason beside it', () => {
    renderWithSafeArea(
      <ActionMenu
        accessibilityLabel="Workout menu"
        title="Week 6 Day 2"
        items={[
          {
            key: 'moveUp',
            label: 'Move up',
            icon: PlusIcon,
            systemImage: 'arrow.up',
            disabledReason: 'Already first',
            onPress: jest.fn(),
          },
        ]}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Workout menu' }));

    // The sheet has the column, so the label stays clean and the reason sits on the right.
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
    expect(screen.getByText('Already first')).toBeTruthy();
  });

  test('an action closes the sheet and runs', () => {
    renderMenu();
    fireEvent.press(screen.getByRole('button', { name: 'Workout menu' }));

    fireEvent.press(screen.getByRole('button', { name: 'Stop mesocycle' }));

    expect(onStop).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Upper/lower')).toBeNull();
  });
});
