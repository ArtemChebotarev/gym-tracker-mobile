import { fireEvent, render, screen } from '@testing-library/react-native';
import { processColor, Text } from 'react-native';

import { TimerCapsule, type TimerCapsuleProps } from '@design/components/TimerCapsule';
import { HourglassIcon } from '@design/icons/HourglassIcon';
import type { IconProps } from '@design/icons/IconFrame';
import { COLORS, ICON_SIZES } from '@design/tokens';

// react-native-svg hands a stroke over as a processed color, not the token's string.
function arcStroke(): unknown {
  return (screen.getByTestId('timer-capsule-arc').props.stroke as { payload: unknown }).payload;
}

const RUNNING: TimerCapsuleProps = {
  state: 'running',
  icon: HourglassIcon,
  title: '1:46',
  caption: 'Rest · set 3 next',
  progress: 0.5,
};

describe('TimerCapsule', () => {
  test('shows the time and what it is for', () => {
    render(<TimerCapsule {...RUNNING} />);

    expect(screen.getByText('1:46')).toBeTruthy();
    expect(screen.getByText('Rest · set 3 next')).toBeTruthy();
  });

  test('shows only the actions it is given', () => {
    render(<TimerCapsule {...RUNNING} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  test('running: Skip and Pause call back', () => {
    const onSkip = jest.fn();
    const onPause = jest.fn();
    render(<TimerCapsule {...RUNNING} onSkip={onSkip} onPause={onPause} onResume={jest.fn()} />);

    fireEvent.press(screen.getByRole('button', { name: 'Skip' }));
    fireEvent.press(screen.getByRole('button', { name: 'Pause' }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull();
  });

  test('paused: Resume instead of Pause, and the arc goes grey', () => {
    const onResume = jest.fn();
    render(<TimerCapsule {...RUNNING} state="paused" onPause={jest.fn()} onResume={onResume} />);

    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Resume' }));
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(arcStroke()).toBe(processColor(COLORS['text/faint']));
  });

  test('the running arc is the orange of running time', () => {
    render(<TimerCapsule {...RUNNING} />);

    expect(arcStroke()).toBe(processColor(COLORS['brand/orange']));
  });

  test('an empty ring draws no arc', () => {
    render(<TimerCapsule {...RUNNING} progress={0} />);

    expect(screen.queryByTestId('timer-capsule-arc')).toBeNull();
  });

  test('the ring is the pause control: pause while running, play while paused', () => {
    const onPause = jest.fn();
    const onResume = jest.fn();
    const { rerender } = render(
      <TimerCapsule {...RUNNING} onPause={onPause} onResume={onResume} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalledTimes(1);

    rerender(<TimerCapsule {...RUNNING} state="paused" onPause={onPause} onResume={onResume} />);
    fireEvent.press(screen.getByRole('button', { name: 'Resume' }));
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  test('the phase icon leads the caption, not the ring', () => {
    function Probe({ size, color }: IconProps) {
      return <Text>{`phase ${size} ${String(color)}`}</Text>;
    }
    render(<TimerCapsule {...RUNNING} icon={Probe} />);

    expect(
      screen.getByText(`phase ${ICON_SIZES['icon/glyph']} ${COLORS['text/muted']}`),
    ).toBeTruthy();
  });

  test('finished: no Skip or Pause, a cross that dismisses', () => {
    const onDismiss = jest.fn();
    render(
      <TimerCapsule
        {...RUNNING}
        state="finished"
        title="Rest is over"
        caption="Set 3 next"
        onSkip={jest.fn()}
        onPause={jest.fn()}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('Rest is over')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('with onPress the body is a button of its own', () => {
    const onPress = jest.fn();
    render(
      <TimerCapsule {...RUNNING} onPress={onPress} accessibilityLabel="Open interval timer" />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Open interval timer' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
