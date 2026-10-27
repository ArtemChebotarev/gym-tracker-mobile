import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { SettingsScreen, type SettingsScreenProps } from '@components/SettingsScreen';

const METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderScreen(props: Partial<SettingsScreenProps> = {}) {
  const onChangeRestBetweenSets = jest.fn();
  const onChangeGetReadySec = jest.fn();
  const onChangeSignals = jest.fn();
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <SettingsScreen
        restBetweenSets={{ enabled: true, restSec: 120 }}
        getReadySec={5}
        signals={{ sound: true, vibration: true }}
        onChangeRestBetweenSets={onChangeRestBetweenSets}
        onChangeGetReadySec={onChangeGetReadySec}
        onChangeSignals={onChangeSignals}
        {...props}
      />
    </SafeAreaProvider>,
  );
  return { onChange: onChangeRestBetweenSets, onChangeGetReadySec, onChangeSignals };
}

describe('SettingsScreen', () => {
  test('shows the rest timer, on at 2:00, for strength and power alike (GT-188)', () => {
    renderScreen();

    expect(screen.getByRole('switch', { name: 'Rest timer' }).props.value).toBe(true);
    expect(screen.getByText('Starts after you log a strength or power set')).toBeTruthy();
    expect(screen.getByText('2:00')).toBeTruthy();
  });

  test('turning the timer off saves it off, keeping the rest', () => {
    const { onChange } = renderScreen();

    fireEvent(screen.getByRole('switch', { name: 'Rest timer' }), 'valueChange', false);

    expect(onChange).toHaveBeenCalledWith({ enabled: false, restSec: 120 });
  });

  test('+ adds 15 s to the rest', () => {
    const { onChange } = renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Increase Rest between sets' }));

    expect(onChange).toHaveBeenCalledWith({ enabled: true, restSec: 135 });
  });

  test('the rest goes no lower than 1:00', () => {
    const { onChange } = renderScreen({ restBetweenSets: { enabled: true, restSec: 60 } });
    fireEvent.press(screen.getByRole('button', { name: 'Decrease Rest between sets' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('the rest goes no higher than 5:00', () => {
    const { onChange } = renderScreen({ restBetweenSets: { enabled: true, restSec: 300 } });
    fireEvent.press(screen.getByRole('button', { name: 'Increase Rest between sets' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('while the timer is off there is no rest to set', () => {
    renderScreen({ restBetweenSets: { enabled: false, restSec: 120 } });

    expect(screen.queryByText('Rest between sets')).toBeNull();
  });

  test('shows Get ready, 0:05, and steps it by the second within 0–10 s (GT-188)', () => {
    const { onChangeGetReadySec } = renderScreen();

    expect(screen.getByText('Get ready')).toBeTruthy();
    expect(screen.getByText('0:05')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Increase Get ready' }));
    expect(onChangeGetReadySec).toHaveBeenLastCalledWith(6);
    fireEvent.press(screen.getByRole('button', { name: 'Decrease Get ready' }));
    expect(onChangeGetReadySec).toHaveBeenLastCalledWith(4);
  });

  test('Get ready goes no higher than 0:10', () => {
    const atMax = renderScreen({ getReadySec: 10 });
    fireEvent.press(screen.getByRole('button', { name: 'Increase Get ready' }));
    expect(atMax.onChangeGetReadySec).not.toHaveBeenCalled();
  });

  test('Get ready goes no lower than 0:00', () => {
    const atMin = renderScreen({ getReadySec: 0 });
    fireEvent.press(screen.getByRole('button', { name: 'Decrease Get ready' }));
    expect(atMin.onChangeGetReadySec).not.toHaveBeenCalled();
  });

  test('shows the signals, sound and vibration both on (GT-172)', () => {
    renderScreen();

    expect(screen.getByText('Signals')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Sound' }).props.value).toBe(true);
    expect(screen.getByText('End of rest, start of work and rest')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Vibration' }).props.value).toBe(true);
  });

  test('turning the sound off saves it off, keeping the vibration', () => {
    const { onChangeSignals } = renderScreen();

    fireEvent(screen.getByRole('switch', { name: 'Sound' }), 'valueChange', false);

    expect(onChangeSignals).toHaveBeenCalledWith({ sound: false, vibration: true });
  });

  test('turning the vibration off saves it off, keeping the sound', () => {
    const { onChangeSignals } = renderScreen({ signals: { sound: false, vibration: true } });

    fireEvent(screen.getByRole('switch', { name: 'Vibration' }), 'valueChange', false);

    expect(onChangeSignals).toHaveBeenCalledWith({ sound: false, vibration: false });
  });
});
