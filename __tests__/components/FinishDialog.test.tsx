import { fireEvent, render, screen } from '@testing-library/react-native';

import { FinishDialog } from '@components/FinishDialog';
import type { FinishSummary } from '@components/FinishDialogLogic';

const DAY: FinishSummary = {
  kind: 'day',
  title: 'Day 1 done',
  subtitle: '2 exercises · 4 sets',
  lead: [{ strong: 'Progression added' }, " to next week's Day 1."],
  rows: [
    { key: 'a', name: 'Bench Press', value: '80 kg × 10', delta: '+1 rep' },
    { key: 'b', name: 'Plank', value: '0:40' },
  ],
  upNext: 'Day 2',
  action: 'nextWorkout',
  buttonLabel: 'Next workout',
};

describe('FinishDialog', () => {
  test('GT-220: the day, its rows in a list that scrolls, Up next and the button', () => {
    render(<FinishDialog summary={DAY} onAction={() => {}} />);

    expect(screen.getByText('Day 1 done')).toBeTruthy();
    expect(screen.getByText('2 exercises · 4 sets')).toBeTruthy();
    expect(screen.getByText('Progression added')).toBeTruthy();
    expect(screen.getByTestId('finish-rows')).toBeTruthy();
    expect(screen.getByText('80 kg × 10')).toBeTruthy();
    expect(screen.getByText('+1 rep')).toBeTruthy();
    expect(screen.getByText('Day 2')).toBeTruthy();
  });

  test('the button reports its action; there is no cross (only the button closes it)', () => {
    const onAction = jest.fn();
    render(<FinishDialog summary={DAY} onAction={onAction} />);

    fireEvent.press(screen.getByText('Next workout'));

    expect(onAction).toHaveBeenCalledWith('nextWorkout');
    expect(screen.queryByLabelText('Close')).toBeNull();
  });

  test('the last workout of the cycle: Cycle done and Finish cycle, no list', () => {
    const onAction = jest.fn();
    render(
      <FinishDialog
        summary={{
          kind: 'cycle',
          title: 'Cycle done',
          subtitle: '6 weeks · 23 of 24 workouts',
          body: 'Your next cycle can start from where this one ended.',
          action: 'finishCycle',
          buttonLabel: 'Finish cycle',
        }}
        onAction={onAction}
      />,
    );

    expect(screen.queryByTestId('finish-rows')).toBeNull();
    fireEvent.press(screen.getByText('Finish cycle'));
    expect(onAction).toHaveBeenCalledWith('finishCycle');
  });

  test('draws nothing without a summary', () => {
    render(<FinishDialog summary={undefined} onAction={() => {}} />);

    expect(screen.queryByText('Next workout')).toBeNull();
  });
});
