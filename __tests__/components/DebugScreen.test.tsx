import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { DebugScreen, type DebugScreenProps } from '@components/DebugScreen';

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

const BASE_PROPS: DebugScreenProps = {
  onExport: jest.fn(),
  isExporting: false,
  onBack: jest.fn(),
};

function renderScreen(props: Partial<DebugScreenProps> = {}) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <DebugScreen {...BASE_PROPS} {...props} />
    </SafeAreaProvider>,
  );
}

describe('DebugScreen', () => {
  test('exports on press', () => {
    const onExport = jest.fn();
    renderScreen({ onExport });

    fireEvent.press(screen.getByRole('button', { name: 'Export backup' }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });

  test('says so and takes no second press while an export is running', () => {
    const onExport = jest.fn();
    renderScreen({ onExport, isExporting: true });

    const button = screen.getByRole('button', { name: 'Exporting…' });
    fireEvent.press(button);

    expect(onExport).not.toHaveBeenCalled();
  });

  test('shows why an export failed', () => {
    renderScreen({ error: 'Sharing is not available on this device.' });

    expect(screen.getByText('Sharing is not available on this device.')).toBeTruthy();
  });

  test('offers no import — restoring replaces everything and needs a screen that can ask first', () => {
    renderScreen();

    expect(screen.queryByText(/import/i)).toBeNull();
    expect(screen.queryByText(/restore/i)).toBeNull();
  });
});
