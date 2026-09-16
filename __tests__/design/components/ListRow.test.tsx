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

  test('actions trailing accessory calls its own handlers, labeled with the row title', () => {
    const onAction = jest.fn();
    const onMenu = jest.fn();
    render(
      <ListRow
        title="Push/Pull/Legs"
        trailing={{
          type: 'actions',
          actionLabel: 'Start',
          actionVariant: 'primary',
          onAction,
          onMenu,
        }}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Start Push/Pull/Legs' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onMenu).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'More actions for Push/Pull/Legs' }));
    expect(onMenu).toHaveBeenCalledTimes(1);
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

  test('renders without a checkbox leading accessory', () => {
    render(<ListRow title="Bench press" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Bench press' })).toBeTruthy();
  });

  test('renders an unchecked checkbox leading accessory as the checkbox role', () => {
    render(
      <ListRow
        title="Bench press"
        leading={{ type: 'checkbox', checked: false }}
        onPress={jest.fn()}
      />,
    );

    const row = screen.getByRole('checkbox', { name: 'Bench press' });
    expect(row.props.accessibilityState).toEqual({ checked: false });
    expect(screen.queryByText('✓')).toBeNull();
  });

  test('renders a checked checkbox leading accessory with its checkmark', () => {
    render(
      <ListRow
        title="Bench press"
        leading={{ type: 'checkbox', checked: true }}
        onPress={jest.fn()}
      />,
    );

    const row = screen.getByRole('checkbox', { name: 'Bench press' });
    expect(row.props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByText('✓')).toBeTruthy();
  });

  test('pressing a checkbox row calls onPress, the same as any other row', () => {
    const onPress = jest.fn();
    render(
      <ListRow
        title="Bench press"
        leading={{ type: 'checkbox', checked: false }}
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByRole('checkbox', { name: 'Bench press' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
