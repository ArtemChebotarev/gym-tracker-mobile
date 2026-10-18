import { fireEvent, render, screen } from '@testing-library/react-native';

import { CyclePlanSheet, type CyclePlanSheetProps } from '@components/CyclePlanSheet';
import { HEAVY_BAG_CONFIG } from '../fixtures/hybridExercises';

const bag = { ...HEAVY_BAG_CONFIG, rounds: 3 };

function renderSheet(overrides: Partial<CyclePlanSheetProps> = {}) {
  const props: CyclePlanSheetProps = {
    visible: true,
    exerciseName: 'Heavy bag',
    dayNumber: 2,
    settings: bag,
    sets: 3,
    onChangeSettings: jest.fn(),
    onChangeSets: jest.fn(),
    onReset: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  render(<CyclePlanSheet {...props} />);
  return props;
}

describe('CyclePlanSheet (GT-92)', () => {
  test('interval: rounds, the three times, Progress by and Step', () => {
    renderSheet();

    expect(screen.getByText('Heavy bag')).toBeTruthy();
    expect(screen.getByText('Plan for this training cycle · Day 2')).toBeTruthy();
    for (const label of ['Rounds', 'Work', 'Get ready', 'Progress by', 'Step']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText('2:00')).toBeTruthy();
    expect(screen.getByText('0:45')).toBeTruthy();
    expect(screen.getByText('Less rest')).toBeTruthy();
    expect(screen.getByText('None')).toBeTruthy();
    // The note under the fields was dropped on review (18.10.2026).
    expect(screen.queryByText(/Week 1 of this cycle/)).toBeNull();
  });

  test('interval: a change goes out as the whole new settings', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByLabelText('Increase Rounds'));
    expect(props.onChangeSettings).toHaveBeenLastCalledWith({ ...bag, rounds: 4 });

    fireEvent.press(screen.getByText('+1 round'));
    expect(props.onChangeSettings).toHaveBeenLastCalledWith({ ...bag, lever: 'rounds' });

    fireEvent.press(screen.getByText('10 s'));
    expect(props.onChangeSettings).toHaveBeenLastCalledWith({ ...bag, stepSec: 10 });
  });

  test('interval: no Step for a lever that does not move time', () => {
    renderSheet({ settings: { ...bag, lever: 'none' } });

    expect(screen.queryByText('Step')).toBeNull();
  });

  test('power: the day’s sets and the rest, no Progress by', () => {
    const props = renderSheet({
      exerciseName: 'Medball throw',
      settings: { type: 'power', load: 'weight', restSec: 60, noHeavierAvailable: false },
    });

    expect(screen.getByText('Sets')).toBeTruthy();
    expect(screen.getByText('1:00')).toBeTruthy();
    expect(screen.queryByText('Progress by')).toBeNull();

    fireEvent.press(screen.getByLabelText('Increase Sets'));
    expect(props.onChangeSets).toHaveBeenCalledWith(4);
  });

  test('mobility: its length alone', () => {
    const props = renderSheet({ exerciseName: 'Cooldown', settings: { type: 'mobility', durationSec: 600 } });

    expect(screen.getByText('Length')).toBeTruthy();
    expect(screen.queryByText('Rounds')).toBeNull();

    fireEvent.press(screen.getByLabelText('Decrease Length'));
    expect(props.onChangeSettings).toHaveBeenCalledWith({ type: 'mobility', durationSec: 595 });
  });

  test('Reset to defaults and Done', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(props.onReset).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(props.onClose).toHaveBeenCalled();
  });

  test('renders nothing without settings', () => {
    renderSheet({ settings: undefined });

    expect(screen.queryByText('Heavy bag')).toBeNull();
  });
});
