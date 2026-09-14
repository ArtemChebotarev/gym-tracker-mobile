import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { WizardScreen } from '@design/components/WizardScreen';

// SafeAreaView throws without a SafeAreaProvider ancestor — same fixture RootScreen.test.tsx
// uses. initialMetrics makes it resolve synchronously instead of waiting on a native onLayout
// that jest's test renderer never fires.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

describe('WizardScreen', () => {
  test('renders the header, children, and footer', () => {
    renderWithSafeArea(
      <WizardScreen
        title="New mesocycle"
        currentStep={1}
        totalSteps={3}
        onClose={() => {}}
        footer={<Text>Footer content</Text>}
      >
        <Text>Step content</Text>
      </WizardScreen>,
    );

    expect(screen.getByText('New mesocycle')).toBeTruthy();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    expect(screen.getByText('Step content')).toBeTruthy();
    expect(screen.getByText('Footer content')).toBeTruthy();
  });

  test('shows Close and calls onClose when given onClose', () => {
    const onClose = jest.fn();
    renderWithSafeArea(
      <WizardScreen title="New mesocycle" currentStep={1} totalSteps={3} onClose={onClose} footer={null}>
        <Text>Step content</Text>
      </WizardScreen>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  test('shows Back and calls onBack when given onBack', () => {
    const onBack = jest.fn();
    renderWithSafeArea(
      <WizardScreen title="Days & exercises" currentStep={2} totalSteps={3} onBack={onBack} footer={null}>
        <Text>Step content</Text>
      </WizardScreen>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });
});
