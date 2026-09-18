import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@components/PlaceholderScreen';

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

describe('PlaceholderScreen', () => {
  test('shows the title and description, and Go back calls onBack', () => {
    const onBack = jest.fn();
    render(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <PlaceholderScreen title="Exercise history" description="Sets will show up here." onBack={onBack} />
      </SafeAreaProvider>,
    );

    expect(screen.getByText('Exercise history')).toBeTruthy();
    expect(screen.getByText('Sets will show up here.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
