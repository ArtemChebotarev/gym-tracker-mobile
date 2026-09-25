import type { ActionMenuItem } from '@design/components/ActionMenu';
import { ListRow } from '@design/components/ListRow';
import { armMenuDismissGuard, disarmMenuDismissGuard } from '@design/menuDismissGuard';
import { TrashIcon } from '@design/icons/TrashIcon';
import { fireEvent, render, screen } from '@testing-library/react-native';

function menuItems(onDelete: () => void): ActionMenuItem[] {
  return [
    {
      key: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      systemImage: 'trash',
      destructive: true,
      onPress: onDelete,
    },
  ];
}

beforeEach(() => {
  disarmMenuDismissGuard();
});

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
          action: { label: 'Copy', variant: 'secondary', onPress: jest.fn() },
          menu: { items: menuItems(jest.fn()) },
        }}
      />,
    );

    expect(tree.toJSON()).toMatchSnapshot();
  });

  test('actions trailing accessory calls its own handlers, labeled with the row title', () => {
    const onAction = jest.fn();
    const onDelete = jest.fn();
    render(
      <ListRow
        title="Push/Pull/Legs"
        trailing={{
          type: 'actions',
          action: { label: 'Start', variant: 'primary', onPress: onAction },
          menu: { testID: 'row-menu', items: menuItems(onDelete) },
        }}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Start Push/Pull/Legs' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();

    // The `⋯` is an ActionMenu, so its items are native menu buttons rather than anything this
    // row draws — picking one runs the item's own handler.
    expect(screen.getByTestId('row-menu').props.accessibilityLabel).toBe(
      'More actions for Push/Pull/Legs',
    );
    fireEvent(screen.getByTestId('row-menu-delete'), 'buttonPress');
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('an actions row can carry a menu alone, with no pill', () => {
    render(
      <ListRow
        title="Strength Base"
        trailing={{ type: 'actions', menu: { testID: 'row-menu', items: menuItems(jest.fn()) } }}
      />,
    );

    expect(screen.getByTestId('row-menu')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Strength Base$/ })).toBeNull();
  });

  // 08.3's Planned row: the tap opens the editor, `Start` starts the block. The accessories sit
  // outside the press region, so one tap never does both.
  test('a tappable actions row presses its own body, never through its accessories', () => {
    const onPress = jest.fn();
    const onAction = jest.fn();
    render(
      <ListRow
        title="Push/Pull/Legs"
        subtitle="6 weeks · 3 days/week"
        onPress={onPress}
        trailing={{
          type: 'actions',
          action: { label: 'Start', variant: 'primary', onPress: onAction },
          menu: { testID: 'row-menu', items: menuItems(jest.fn()) },
        }}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Start Push/Pull/Legs' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Push/Pull/Legs' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  // iOS hands the tap that closes a native menu to whatever is under it, so without this a tap
  // meant to put the menu away opened the row as well (Artem, on the device).
  test('a tappable row drops the press that closed a menu, and only that one', () => {
    const onPress = jest.fn();
    render(
      <ListRow
        title="Push/Pull/Legs"
        onPress={onPress}
        trailing={{ type: 'actions', menu: { items: menuItems(jest.fn()) } }}
      />,
    );
    const row = screen.getByRole('button', { name: 'Push/Pull/Legs' });

    armMenuDismissGuard();
    fireEvent.press(row);
    expect(onPress).not.toHaveBeenCalled();

    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
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
