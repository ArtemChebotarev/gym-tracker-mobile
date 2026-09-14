import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { MesocyclesScreen } from '@components/MesocyclesScreen';

// SafeAreaView (used by RootScreen for the top safe-area inset) throws without a
// SafeAreaProvider ancestor — same fixture RootScreen.test.tsx uses.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

describe('MesocyclesScreen', () => {
  test('pressing "+" calls onRequestCreate', () => {
    const onRequestCreate = jest.fn();
    renderWithSafeArea(<MesocyclesScreen onRequestCreate={onRequestCreate} />);

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));

    expect(onRequestCreate).toHaveBeenCalled();
  });
});
