import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  IntervalTimerScreen,
  type IntervalTimerScreenProps,
} from '@components/IntervalTimerScreen';
import type { IntervalTimerView } from '@components/IntervalTimerScreenLogic';

const WORK: IntervalTimerView = {
  title: 'Heavy bag',
  subtitle: 'Round 2 of 3',
  segments: [
    { fill: 1, tone: 'done' },
    { fill: 0.3, tone: 'running' },
    { fill: 0, tone: 'empty' },
  ],
  phase: 'Work',
  time: '1:24',
  of: 'of 2:00',
  progress: 0.7,
  runsOutAt: Date.now() + 84_000,
  tone: 'running',
  next: 'Then rest 0:45',
  paused: false,
  canSkipRest: false,
};

function renderScreen(overrides: Partial<IntervalTimerScreenProps> = {}) {
  const props: IntervalTimerScreenProps = {
    view: WORK,
    onPause: jest.fn(),
    onResume: jest.fn(),
    onSkipRest: jest.fn(),
    endEarlyMessage: () => 'Round 1 is in the log. Round 2 will be logged as 0:36 of 2:00.',
    onEndEarly: jest.fn(),
    onBackToWorkout: jest.fn(),
    ...overrides,
  };
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <IntervalTimerScreen {...props} />
    </SafeAreaProvider>,
  );
  return props;
}

describe('IntervalTimerScreen', () => {
  test('running work: the round, the phase, the time, Pause and End early — no Skip rest', () => {
    const props = renderScreen();
    expect(screen.getByText('Heavy bag')).toBeTruthy();
    expect(screen.getByText('Round 2 of 3')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('1:24')).toBeTruthy();
    expect(screen.getByText('Then rest 0:45')).toBeTruthy();
    expect(screen.queryByLabelText('Skip rest')).toBeNull();

    fireEvent.press(screen.getByLabelText('Pause'));
    expect(props.onPause).toHaveBeenCalledTimes(1);
  });

  test('paused: the same round button, now Resume, and End early as before', () => {
    const props = renderScreen({
      view: { ...WORK, paused: true, phase: 'Paused · work', tone: 'paused', runsOutAt: undefined },
    });
    expect(screen.queryByLabelText('Pause')).toBeNull();
    fireEvent.press(screen.getByLabelText('Resume'));
    expect(props.onResume).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('End early')).toBeTruthy();
  });

  test('a rest offers Skip rest', () => {
    const props = renderScreen({
      view: { ...WORK, phase: 'Rest', tone: 'rest', canSkipRest: true },
    });
    fireEvent.press(screen.getByLabelText('Skip rest'));
    expect(props.onSkipRest).toHaveBeenCalledTimes(1);
  });

  test('End early asks first, says what goes into the log, and ends only on End timer', () => {
    const props = renderScreen();
    fireEvent.press(screen.getByLabelText('End early'));
    expect(screen.getByText('End the timer?')).toBeTruthy();
    expect(
      screen.getByText('Round 1 is in the log. Round 2 will be logged as 0:36 of 2:00.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Keep going'));
    expect(props.onEndEarly).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('End early'));
    fireEvent.press(screen.getByText('End timer'));
    expect(props.onEndEarly).toHaveBeenCalledTimes(1);
  });

  test('done: the summary, which stays until Back to workout', () => {
    const props = renderScreen({
      summary: { title: 'Heavy bag', rounds: '3 of 3 rounds', totals: '6:00 work · 1:30 rest' },
    });
    expect(screen.getByText('All rounds done')).toBeTruthy();
    expect(screen.getByText('3 of 3 rounds')).toBeTruthy();
    expect(screen.getByText('6:00 work · 1:30 rest')).toBeTruthy();
    fireEvent.press(screen.getByText('Back to workout'));
    expect(props.onBackToWorkout).toHaveBeenCalledTimes(1);
  });
});
