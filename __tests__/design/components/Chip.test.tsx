import { Chip } from '@design/components/Chip';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('Chip', () => {
  test.each([true, false])('renders the selectable variant when selected=%s', (selected) => {
    render(<Chip variant="selectable" label="Chest" selected={selected} onPress={() => {}} />);

    expect(screen.getByRole('button', { name: 'Chest' })).toBeTruthy();
  });

  test('selectable calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Chip variant="selectable" label="Chest" selected={false} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('renders the static variant without a group dot', () => {
    render(<Chip variant="static" label="Chest" />);
    expect(screen.getByText('Chest')).toBeTruthy();
  });

  test('renders the static variant with a group dot', () => {
    render(<Chip variant="static" label="Chest" dotColor="#F0A537" />);
    expect(screen.getByText('Chest')).toBeTruthy();
  });

  test('renders the counter variant with its count', () => {
    render(<Chip variant="counter" label="Exercises" count={12} />);
    expect(screen.getByText('Exercises 12')).toBeTruthy();
  });
});
