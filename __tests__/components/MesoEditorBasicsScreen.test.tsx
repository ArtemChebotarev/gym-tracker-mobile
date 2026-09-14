import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { MesoEditorBasicsScreen, type MesoEditorBasicsScreenProps } from '@components/MesoEditorBasicsScreen';

// SafeAreaView (used for the top/bottom safe-area insets) throws without a SafeAreaProvider
// ancestor — same fixture RootScreen.test.tsx uses. initialMetrics makes it resolve synchronously
// instead of waiting on a native onLayout that jest's test renderer never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

const BASE_PROPS: MesoEditorBasicsScreenProps = {
  name: 'Upper/Lower — Block 6',
  lengthWeeks: 6,
  daysPerWeek: 4,
  onChangeName: jest.fn(),
  onChangeLengthWeeks: jest.fn(),
  onChangeDaysPerWeek: jest.fn(),
  onClose: jest.fn(),
  onContinue: jest.fn(),
};

describe('MesoEditorBasicsScreen', () => {
  test('matches the step 1 snapshot', () => {
    const tree = renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('renders the header, title, and fields', () => {
    renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} />);

    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    expect(screen.getByText('New mesocycle')).toBeTruthy();
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Mesocycle length')).toBeTruthy();
    expect(screen.getByText('6 weeks')).toBeTruthy();
    expect(screen.getByText('Includes a deload week')).toBeTruthy();
    expect(screen.getByText('Days per week')).toBeTruthy();
    expect(screen.getByText('4 days')).toBeTruthy();
    expect(screen.getByText("You'll pick exercises for each next")).toBeTruthy();
  });

  test('Continue is disabled when Name is empty', () => {
    renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} name="" />);

    expect(
      screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled,
    ).toBe(true);
  });

  test('Continue is enabled with a name and in-range stepper values', () => {
    renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} />);

    expect(
      screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled,
    ).toBe(false);
  });

  test('pressing Continue calls onContinue when enabled', () => {
    const onContinue = jest.fn();
    renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} onContinue={onContinue} />);

    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalled();
  });

  test('pressing Close calls onClose', () => {
    const onClose = jest.fn();
    renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} onClose={onClose} />);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  describe('stepper boundaries', () => {
    test('Mesocycle length decrement is disabled at the minimum (3)', () => {
      renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} lengthWeeks={3} />);

      expect(
        screen.getByRole('button', { name: 'Decrease Mesocycle length' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });

    test('Mesocycle length increment is disabled at the maximum (8)', () => {
      renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} lengthWeeks={8} />);

      expect(
        screen.getByRole('button', { name: 'Increase Mesocycle length' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });

    test('Days per week decrement is disabled at the minimum (1)', () => {
      renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} daysPerWeek={1} />);

      expect(
        screen.getByRole('button', { name: 'Decrease Days per week' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });

    test('Days per week increment is disabled at the maximum (7)', () => {
      renderWithSafeArea(<MesoEditorBasicsScreen {...BASE_PROPS} daysPerWeek={7} />);

      expect(
        screen.getByRole('button', { name: 'Increase Days per week' }).props.accessibilityState
          .disabled,
      ).toBe(true);
    });
  });
});
