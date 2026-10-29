import { StyleSheet } from 'react-native';

import { Chip } from '@design/components/Chip';
import { SlidersIcon } from '@design/icons/SlidersIcon';
import { COLORS } from '@design/tokens';
import { fireEvent, render, screen } from '@testing-library/react-native';

/** The chip's own box: the nearest ancestor of its label that has a fill. */
function boxOf(label: ReturnType<typeof screen.getByText>) {
  let node = label.parent;
  while (node && StyleSheet.flatten(node.props.style)?.backgroundColor === undefined) {
    node = node.parent;
  }
  return StyleSheet.flatten(node!.props.style);
}

describe('Chip', () => {
  test('an action chip calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(
      <Chip variant="action" label="Filters" icon={SlidersIcon} active={false} onPress={onPress} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Filters' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // GT-150: it opens something, so it must not read as one more outlined tag in the row.
  test('an inactive action chip is tonal: a step lighter than the chips, text at full strength', () => {
    render(
      <Chip
        variant="action"
        label="Filters"
        icon={SlidersIcon}
        active={false}
        onPress={jest.fn()}
      />,
    );

    const label = screen.getByText('Filters');

    expect(StyleSheet.flatten(label.props.style).color).toBe(COLORS['text/primary']);
    expect(boxOf(label).backgroundColor).toBe(COLORS['surface/control-active']);
    expect(screen.getByRole('button')).toHaveProp('accessibilityState', { selected: false });
  });

  test('an active action chip takes the accent wash, never the solid accent fill', () => {
    render(
      <Chip variant="action" label="Filters · 2" icon={SlidersIcon} active onPress={jest.fn()} />,
    );

    const label = screen.getByText('Filters · 2');

    expect(StyleSheet.flatten(label.props.style).color).toBe(COLORS.accent);
    expect(boxOf(label)).toMatchObject({
      backgroundColor: COLORS['accent/bg'],
      borderColor: COLORS['accent/border'],
    });
    expect(screen.getByRole('button')).toHaveProp('accessibilityState', { selected: true });
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

  // 08.11: the first-weight ladder's rep counts carry the accent tint.
  test('a static chip can take the accent tint: dark green fill, green outline and text', () => {
    render(<Chip variant="static" label="12 reps" accent />);

    const label = screen.getByText('12 reps');

    expect(StyleSheet.flatten(label.props.style).color).toBe(COLORS.accent);
    expect(boxOf(label)).toMatchObject({
      backgroundColor: COLORS['accent/bg'],
      borderColor: COLORS['accent/border'],
    });
  });

  test('without it a static chip keeps its neutral look', () => {
    render(<Chip variant="static" label="12 reps" />);

    const label = screen.getByText('12 reps');

    expect(StyleSheet.flatten(label.props.style).color).toBe(COLORS['text/secondary']);
    expect(boxOf(label).backgroundColor).toBe(COLORS['surface/card']);
  });
});
