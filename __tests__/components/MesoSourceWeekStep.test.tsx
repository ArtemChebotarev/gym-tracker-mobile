import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  MesoSourceWeekStep,
  type MesoSourceWeekStepProps,
} from '@components/MesoSourceWeekStep';
import {
  NO_SOURCE_WEEKS_HINT,
  SOURCE_WEEK_HINT,
} from '@components/MesoSourceWeekStepLogic';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { STAMPS } from '../fixtures/stamps';

function mesocycle(id: string, name: string): Mesocycle {
  return {
    ...STAMPS,
    id,
    name,
    lengthWeeks: 6,
    daysPerWeek: 3,
    status: 'completed',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
  };
}

const SOURCES = [mesocycle('meso-2', 'Upper/Lower'), mesocycle('meso-1', 'Push/Pull')];

function makeProps(overrides: Partial<MesoSourceWeekStepProps> = {}): MesoSourceWeekStepProps {
  return {
    mesocycles: SOURCES,
    selectedMesoId: 'meso-2',
    onChangeMesoId: jest.fn(),
    weeks: [
      { weekNumber: 3, completedCount: 3, sessionCount: 3 },
      { weekNumber: 4, completedCount: 1, sessionCount: 3 },
    ],
    selectedWeekNumber: 4,
    onChangeWeekNumber: jest.fn(),
    ...overrides,
  };
}

/**
 * A row in an open Dropdown's panel. The trigger carries the selected option's text as well, so a
 * label can match twice; the panel renders below the trigger, so the row is the later of the two.
 */
function openOption(label: string) {
  const matches = screen.getAllByRole('button', { name: label });
  return matches[matches.length - 1]!;
}

describe('MesoSourceWeekStep', () => {
  test('shows both fields, each answered by its default', () => {
    render(<MesoSourceWeekStep {...makeProps()} />);

    expect(screen.getByRole('button', { name: 'Mesocycle' })).toBeTruthy();
    expect(screen.getByText('Upper/Lower')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Week' })).toBeTruthy();
    expect(screen.getByText('Week 4 · 1 of 3 workouts')).toBeTruthy();
  });

  // DoD: a deload week can't be chosen and the screen explains why. It is not on the list at all
  // now, so the explanation is this line under the field (08.8, 23.09.2026).
  test('DoD: says why deload weeks are not among the options', () => {
    render(<MesoSourceWeekStep {...makeProps()} />);

    expect(screen.getByText(SOURCE_WEEK_HINT)).toBeTruthy();
  });

  test('offers exactly the weeks it was given, in order', () => {
    render(<MesoSourceWeekStep {...makeProps()} />);

    fireEvent.press(screen.getByRole('button', { name: 'Week' }));

    expect(openOption('Week 3 · 3 of 3 workouts')).toBeTruthy();
    expect(openOption('Week 4 · 1 of 3 workouts')).toBeTruthy();
  });

  // DoD: a week with nothing completed is selectable like the rest.
  test('DoD: an untrained week can be picked', () => {
    const onChangeWeekNumber = jest.fn();
    render(
      <MesoSourceWeekStep
        {...makeProps({
          weeks: [{ weekNumber: 5, completedCount: 0, sessionCount: 3 }],
          selectedWeekNumber: 5,
          onChangeWeekNumber,
        })}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Week' }));
    fireEvent.press(openOption('Week 5 · 0 of 3 workouts'));

    expect(onChangeWeekNumber).toHaveBeenCalledWith(5);
  });

  test('picking another block reports its id', () => {
    const onChangeMesoId = jest.fn();
    render(<MesoSourceWeekStep {...makeProps({ onChangeMesoId })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Mesocycle' }));
    fireEvent.press(screen.getByRole('button', { name: 'Push/Pull' }));

    expect(onChangeMesoId).toHaveBeenCalledWith('meso-1');
  });

  test('holds the Week field back until its options are known', () => {
    render(<MesoSourceWeekStep {...makeProps({ weeks: undefined })} />);

    expect(screen.queryByRole('button', { name: 'Week' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Mesocycle' })).toBeTruthy();
  });

  test('explains a block with no week to copy instead of an empty dropdown', () => {
    render(<MesoSourceWeekStep {...makeProps({ weeks: [], selectedWeekNumber: undefined })} />);

    expect(screen.getByText(NO_SOURCE_WEEKS_HINT)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Week' })).toBeNull();
    // The other blocks are still reachable — it is an explanation, not a dead end.
    expect(screen.getByRole('button', { name: 'Mesocycle' })).toBeTruthy();
  });

  // 08.8, "Чего на этом шаге нет": the source week gives structure only, so nothing here may
  // suggest that picking a different one moves week 1's numbers.
  test('says nothing about RIR, weight or reps', () => {
    render(<MesoSourceWeekStep {...makeProps()} />);

    expect(screen.queryByText(/RIR/i)).toBeNull();
    expect(screen.queryByText(/\bkg\b/i)).toBeNull();
    expect(screen.queryByText(/reps/i)).toBeNull();
  });
});
