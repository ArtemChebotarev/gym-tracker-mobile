import { fireEvent, render, screen } from '@testing-library/react-native';

import { PlanChip } from '@design/components/PlanChip';

describe('PlanChip', () => {
  test('shows both lines and reads them as one label', () => {
    render(<PlanChip value="3 × 2:00" caption="1:00 rest" accessibilityLabel="Heavy bag plan" />);

    expect(screen.getByText('3 × 2:00')).toBeTruthy();
    expect(screen.getByText('1:00 rest')).toBeTruthy();
    expect(screen.getByLabelText('Heavy bag plan: 3 × 2:00, 1:00 rest')).toBeTruthy();
  });

  test('without onPress it is not a button and carries no chevron', () => {
    render(<PlanChip value="10:00" caption="Length" accessibilityLabel="Cooldown plan" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(' ›')).toBeNull();
  });

  test('with onPress it is a button with a chevron', () => {
    const onPress = jest.fn();
    render(<PlanChip value="10:00" caption="Length" accessibilityLabel="Cooldown plan" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Cooldown plan: 10:00, Length' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText(' ›')).toBeTruthy();
  });
});
