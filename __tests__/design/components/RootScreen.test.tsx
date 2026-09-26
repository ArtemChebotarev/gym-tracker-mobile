import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { RootScreen } from '@design/components/RootScreen';

// SafeAreaView (used for the top safe-area inset) throws without a SafeAreaProvider ancestor.
// initialMetrics makes it resolve synchronously instead of waiting on a native onLayout that
// jest's test renderer never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>,
  );
}

describe('RootScreen', () => {
  test('a tab root has no back button', () => {
    renderWithSafeArea(<RootScreen title="Today" />);

    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  test('onBack draws a back button above the title, for a screen pushed as a page (130)', () => {
    const onBack = jest.fn();
    renderWithSafeArea(<RootScreen title="Week 1" onBack={onBack} />);

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });

  test('renders the title', () => {
    renderWithSafeArea(<RootScreen title="Exercises" />);

    expect(screen.getByText('Exercises')).toBeTruthy();
  });

  test('renders an optional trailing accessory next to the title', () => {
    renderWithSafeArea(
      <RootScreen title="Exercises" trailing={<Text>+</Text>} />,
    );

    expect(screen.getByText('+')).toBeTruthy();
  });

  test('renders children below the title row', () => {
    renderWithSafeArea(
      <RootScreen title="Today">
        <Text>Nothing planned</Text>
      </RootScreen>,
    );

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Nothing planned')).toBeTruthy();
  });

  test('renders an optional title suffix in the same title line', () => {
    renderWithSafeArea(<RootScreen title="Week 6" titleSuffix="Day 2" />);

    expect(screen.getByText('Week 6 Day 2')).toBeTruthy();
    expect(screen.getByText('Day 2')).toBeTruthy();
  });

  test('renders an optional accessory after the title and a subtitle under it', () => {
    renderWithSafeArea(
      <RootScreen
        title="Week 6"
        titleAccessory={<Text>✓</Text>}
        subtitle="Tue, 15 Sep · Upper/lower"
      />,
    );

    expect(screen.getByText('✓')).toBeTruthy();
    expect(screen.getByText('Tue, 15 Sep · Upper/lower')).toBeTruthy();
  });
});

describe('RootScreen — a tappable title', () => {
  test('calls back on a press when a handler is given', () => {
    const onTitlePress = jest.fn();
    renderWithSafeArea(<RootScreen title="Exercises" onTitlePress={onTitlePress} />);

    fireEvent.press(screen.getByText('Exercises'));

    expect(onTitlePress).toHaveBeenCalledTimes(1);
  });

  test('stays a plain title otherwise — nothing to press, nothing announced as pressable', () => {
    renderWithSafeArea(<RootScreen title="Exercises" />);

    // A Pressable, even a disabled one, would add press handling and an accessibility state to
    // what is only ever text on the other two tabs.
    expect(screen.queryByRole('button', { name: 'Exercises' })).toBeNull();
  });
});
