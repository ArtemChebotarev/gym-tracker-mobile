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
    onChangeSettings: jest.fn(),
    onReset: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  render(<CyclePlanSheet {...props} />);
  return props;
}

describe('CyclePlanSheet (GT-92)', () => {
  test('interval: rounds, Progress by and Step — no times (GT-188, GT-191)', () => {
    renderSheet();

    expect(screen.getByText('Heavy bag')).toBeTruthy();
    expect(screen.getByText('Plan for this training cycle · Day 2')).toBeTruthy();
    for (const label of ['Rounds', 'Progress by', 'Step']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    for (const label of ['Work', 'Rest', 'Get ready']) {
      expect(screen.queryByText(label)).toBeNull();
    }
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
