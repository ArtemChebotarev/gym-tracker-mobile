import { ListRow } from '@design/components/ListRow';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('ListRow', () => {
  test('renders without a subtitle', () => {
    render(<ListRow title="Bench press" />);
    expect(screen.getByText('Bench press')).toBeTruthy();
  });

  test('renders with a subtitle', () => {
    render(<ListRow title="Bench press" subtitle="Chest" />);
    expect(screen.getByText('Bench press')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
  });

  test('renders without a badge', () => {
    render(<ListRow title="Bench press" />);
    expect(screen.queryByText('Custom')).toBeNull();
  });

  test('renders with a badge', () => {
    render(<ListRow title="Bench press" badge={{ label: 'Custom' }} />);
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  test('renders a chevron trailing accessory', () => {
    render(<ListRow title="Bench press" trailing={{ type: 'chevron' }} />);
    expect(screen.getByText('›')).toBeTruthy();
  });

  test('renders a value trailing accessory', () => {
    render(<ListRow title="Bench press" trailing={{ type: 'value', value: '80 kg' }} />);
    expect(screen.getByText('80 kg')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<ListRow title="Bench press" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Bench press' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('is not pressable without onPress', () => {
    render(<ListRow title="Bench press" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
