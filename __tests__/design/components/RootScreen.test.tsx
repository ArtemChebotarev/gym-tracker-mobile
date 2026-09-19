import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { RootScreen } from '@design/components/RootScreen';
import { COLORS, SPACING } from '@design/tokens';

// SafeAreaView (used for the top safe-area inset) throws without a SafeAreaProvider ancestor.
// initialMetrics makes it resolve synchronously instead of waiting on a native onLayout that
// jest's test renderer never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

describe('RootScreen', () => {
  test('renders the title', () => {
    renderWithSafeArea(<RootScreen title="Exercises" />);

    expect(screen.getByText('Exercises')).toBeTruthy();
  });

  test('renders an optional trailing accessory next to the title', () => {
    renderWithSafeArea(<RootScreen title="Exercises" trailing={<Text>+</Text>} />);

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

  test('the header is a raised band, like the tab bar, over the page', () => {
    renderWithSafeArea(<RootScreen title="Exercises" />);

    const band = screen.getByTestId('root-screen-header');
    expect(StyleSheet.flatten(band.props.style).backgroundColor).toBe(COLORS['surface/raised']);
    // The body stays on the screen's own `surface/page`.
    expect(
      StyleSheet.flatten(screen.getByTestId('root-screen-body').props.style).backgroundColor,
    ).toBeUndefined();
  });

  test('pads its children by default, and not with flushContent', () => {
    renderWithSafeArea(<RootScreen title="Mesocycles" />);
    expect(
      StyleSheet.flatten(screen.getByTestId('root-screen-body').props.style).paddingHorizontal,
    ).toBe(SPACING['space/screen']);

    screen.rerender(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <RootScreen title="Week 6" flushContent />
      </SafeAreaProvider>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('root-screen-body').props.style).paddingHorizontal,
    ).toBeUndefined();
  });
});
