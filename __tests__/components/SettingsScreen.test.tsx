import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { SettingsScreen, type SettingsScreenProps } from '@components/SettingsScreen';

const METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderScreen(props: Partial<SettingsScreenProps> = {}) {
  const onChangeStrengthRestTimer = jest.fn();
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <SettingsScreen
        strengthRestTimer={{ enabled: true, restSec: 120 }}
        onChangeStrengthRestTimer={onChangeStrengthRestTimer}
        {...props}
      />
    </SafeAreaProvider>,
  );
  return onChangeStrengthRestTimer;
}

describe('SettingsScreen', () => {
  test('shows the strength rest timer: on, 2:00', () => {
    renderScreen();

    expect(screen.getByRole('switch', { name: 'Rest timer for strength' }).props.value).toBe(true);
    expect(screen.getByText('2:00')).toBeTruthy();
  });

  test('turning the timer off saves it off, keeping the rest', () => {
    const onChange = renderScreen();

    fireEvent(
      screen.getByRole('switch', { name: 'Rest timer for strength' }),
      'valueChange',
      false,
    );

    expect(onChange).toHaveBeenCalledWith({ enabled: false, restSec: 120 });
  });

  test('+ adds 15 s to the rest', () => {
    const onChange = renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Increase Rest between sets' }));

    expect(onChange).toHaveBeenCalledWith({ enabled: true, restSec: 135 });
  });

  test('while the timer is off there is no rest to set', () => {
    renderScreen({ strengthRestTimer: { enabled: false, restSec: 120 } });

    expect(screen.queryByText('Rest between sets')).toBeNull();
  });
});
