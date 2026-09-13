import { render, screen } from '@testing-library/react-native';
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
});
