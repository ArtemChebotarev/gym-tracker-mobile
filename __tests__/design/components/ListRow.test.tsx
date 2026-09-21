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

  test('renders a title suffix after a separator on the title line', () => {
    render(<ListRow title="Bench press" titleSuffix="Dumbbell" />);
    expect(screen.getByText('Bench press')).toBeTruthy();
    expect(screen.getByText(' · Dumbbell')).toBeTruthy();
  });

  test('renders no separator without a title suffix', () => {
    render(<ListRow title="Bench press" />);
    expect(screen.queryByText(/·/)).toBeNull();
  });

  test('renders without a badge', () => {
    render(<ListRow title="Bench press" />);
    expect(screen.queryByText('Custom')).toBeNull();
  });

  test('renders with a badge', () => {
    render(<ListRow title="Bench press" badge={{ label: 'Custom' }} />);
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  test('a badge sits in a wrapper so the row can centre it', () => {
    // Badge carries `alignSelf: 'flex-start'` so it shrink-wraps in a column; dropped straight
    // into this row it overrode `alignItems: 'center'` and rode above the pill beside it (Artem,
    // 21.09.2026). The wrapper keeps that alignSelf off the row's cross axis. Snapshotted rather
    // than asserted on styles: what broke was the shape of the tree, and that is what this holds.
    const tree = render(
      <ListRow
        title="Test"
        subtitle="3 weeks"
        badge={{ label: 'Stopped' }}
        trailing={{
          type: 'actions',
          actionLabel: 'Copy',
          actionVariant: 'secondary',
          onAction: jest.fn(),
          onMenu: jest.fn(),
        }}
      />,
    );

    expect(tree.toJSON()).toMatchSnapshot();
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
